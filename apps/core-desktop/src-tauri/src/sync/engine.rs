use crate::{
    activation::{ActivationClient, DeviceCredentials},
    security::keystore::Keystore,
    sync::{store, AckStatus, ChangeAck, OutboxChange},
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

static SYNC_LOCK: Mutex<()> = Mutex::const_new(());
const BATCH_SIZE: i64 = 100;
const MAX_BATCHES_PER_RUN: usize = 5;
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRunResult {
    pub state: String,
    pub sent: usize,
    pub applied: usize,
    pub rejected: usize,
    pub pending: i64,
    pub server_cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    pub state: String,
    pub pending: i64,
    pub failed: i64,
    pub last_ack_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TokenScope {
    device_id: String,
    workspace_id: String,
    branch_id: String,
}

#[derive(Serialize)]
struct PushRequest<'a> {
    device_id: &'a str,
    batch_id: String,
    app_version: &'static str,
    changes: Vec<PushChange>,
}

#[derive(Serialize)]
struct PushChange {
    change_id: String,
    entity: String,
    entity_id: String,
    op: String,
    version: i64,
    payload: serde_json::Value,
    created_at: String,
}

#[derive(Deserialize)]
struct PushResponse {
    acks: Vec<ServerAck>,
    server_cursor: String,
}

#[derive(Deserialize)]
struct ServerAck {
    change_id: String,
    status: String,
    reason: Option<String>,
}

fn token_scope(token: &str) -> Result<TokenScope, String> {
    let payload = token
        .split('.')
        .nth(1)
        .ok_or_else(|| "Malformed device access token".to_string())?;
    let bytes = URL_SAFE_NO_PAD
        .decode(payload)
        .map_err(|_| "Malformed device access token".to_string())?;
    serde_json::from_slice(&bytes).map_err(|_| "Malformed device access token claims".into())
}

fn push_change(change: OutboxChange) -> Result<PushChange, String> {
    let payload = serde_json::from_str(&change.payload)
        .map_err(|_| format!("Outbox payload for {} is invalid JSON", change.id))?;
    Ok(PushChange {
        change_id: change.id,
        entity: change.entity,
        entity_id: change.entity_id,
        op: change.op,
        version: change.version,
        payload,
        created_at: change.created_at,
    })
}

fn map_ack(ack: ServerAck) -> Result<ChangeAck, String> {
    let status = match ack.status.as_str() {
        "applied" => AckStatus::Applied,
        "stale" => AckStatus::Stale,
        "rejected" => AckStatus::Rejected,
        _ => return Err("API Core returned an unsupported sync acknowledgement".into()),
    };
    Ok(ChangeAck {
        change_id: ack.change_id,
        status,
        reason: ack.reason,
    })
}

async fn pending_count(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let mut conn = pool.acquire().await?;
    store::pending_count(&mut conn).await
}

pub async fn status(pool: &SqlitePool) -> Result<SyncStatus, sqlx::Error> {
    let mut conn = pool.acquire().await?;
    let pending = store::pending_count(&mut conn).await?;
    let failed: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM sync_outbox WHERE status = 'failed'")
            .fetch_one(&mut *conn)
            .await?;
    let last_ack_at: Option<String> =
        sqlx::query_scalar("SELECT last_ack_at FROM sync_state LIMIT 1")
            .fetch_optional(&mut *conn)
            .await?
            .flatten();
    let state = if failed > 0 {
        "attention"
    } else if pending > 0 {
        "pending"
    } else {
        "idle"
    };
    Ok(SyncStatus {
        state: state.into(),
        pending,
        failed,
        last_ack_at,
    })
}

pub async fn sync_once(
    pool: &SqlitePool,
    api_base_url: &str,
    activation_client: &Arc<dyn ActivationClient>,
) -> Result<SyncRunResult, String> {
    let _guard = SYNC_LOCK.lock().await;
    let mut credentials: DeviceCredentials = match Keystore::load_cloud_credentials() {
        Ok(credentials) => credentials,
        Err(_) => {
            return Ok(SyncRunResult {
                state: "not_enrolled".into(),
                sent: 0,
                applied: 0,
                rejected: 0,
                pending: pending_count(pool).await.map_err(|e| e.to_string())?,
                server_cursor: None,
            })
        }
    };
    let scope = token_scope(&credentials.access_token)?;
    if scope.device_id != credentials.device_id
        || scope.workspace_id.trim().is_empty()
        || scope.branch_id.trim().is_empty()
    {
        return Err("Stored device credential scope is invalid".into());
    }

    let http = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(5))
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| format!("Could not configure API client: {e}"))?;
    let endpoint = format!("{}/v1/sync/push", api_base_url.trim_end_matches('/'));
    let mut sent = 0usize;
    let mut applied = 0usize;
    let mut rejected = 0usize;
    let mut server_cursor = None;

    {
        let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
        store::enqueue_bootstrap(&mut conn)
            .await
            .map_err(|e| format!("Could not prepare local sync outbox: {e}"))?;
        // A previous process may have stopped after claiming rows. Reset those
        // claims before starting this serialized run so they survive restarts.
        store::requeue_interrupted_inflight(&mut conn)
            .await
            .map_err(|e| format!("Could not recover interrupted sync work: {e}"))?;
    }

    for _ in 0..MAX_BATCHES_PER_RUN {
        let batch = {
            let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
            store::next_batch_for_scope(
                &mut conn,
                BATCH_SIZE,
                &scope.workspace_id,
                &scope.branch_id,
            )
            .await
            .map_err(|e| format!("Could not read local sync outbox: {e}"))?
        };
        if batch.is_empty() {
            break;
        }
        sent += batch.len();
        let mut expected_ids = std::collections::HashSet::new();
        let mut changes = Vec::with_capacity(batch.len());
        let mut local_failures = Vec::new();
        for change in &batch {
            match push_change(change.clone()) {
                Ok(payload) => changes.push(payload),
                Err(reason) => local_failures.push(ChangeAck {
                    change_id: change.id.clone(),
                    status: AckStatus::Rejected,
                    reason: Some(reason),
                }),
            }
        }
        expected_ids.extend(changes.iter().map(|change| change.change_id.clone()));
        if !local_failures.is_empty() {
            rejected += local_failures.len();
            let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
            store::ack(&mut conn, local_failures)
                .await
                .map_err(|e| format!("Could not record invalid local outbox data: {e}"))?;
        }
        if changes.is_empty() {
            continue;
        }
        let device_id = credentials.device_id.clone();
        let request = PushRequest {
            device_id: &device_id,
            batch_id: Uuid::new_v4().to_string(),
            app_version: APP_VERSION,
            changes,
        };

        let mut response = http
            .post(&endpoint)
            .bearer_auth(&credentials.access_token)
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("API Core is unavailable: {e}"))?;
        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            credentials = activation_client
                .refresh_device_credentials(&credentials.device_id, &credentials.refresh_token)
                .await
                .map_err(|_| "Device session expired; credential refresh failed".to_string())?;
            Keystore::store_cloud_credentials(&credentials)
                .map_err(|_| "Could not securely save refreshed device credentials".to_string())?;
            response = http
                .post(&endpoint)
                .bearer_auth(&credentials.access_token)
                .json(&request)
                .send()
                .await
                .map_err(|e| format!("API Core is unavailable after credential refresh: {e}"))?;
        }
        if response.status() == reqwest::StatusCode::CONFLICT {
            let conflict_acks = batch
                .iter()
                .map(|change| ChangeAck {
                    change_id: change.id.clone(),
                    status: AckStatus::Rejected,
                    reason: Some("server_conflict_review_required".into()),
                })
                .collect::<Vec<_>>();
            let rejected_count = conflict_acks.len();
            let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
            store::ack(&mut conn, conflict_acks)
                .await
                .map_err(|e| format!("Could not record sync conflict: {e}"))?;
            rejected += rejected_count;
            continue;
        }
        if !response.status().is_success() {
            return Err(format!(
                "API Core sync request failed with HTTP {}",
                response.status()
            ));
        }
        let body: PushResponse = response
            .json()
            .await
            .map_err(|e| format!("API Core returned an invalid sync response: {e}"))?;
        let ack_ids = body
            .acks
            .iter()
            .map(|ack| ack.change_id.clone())
            .collect::<std::collections::HashSet<_>>();
        if ack_ids.len() != expected_ids.len() || ack_ids != expected_ids {
            return Err("API Core returned incomplete or mismatched sync acknowledgements".into());
        }
        for ack in &body.acks {
            match ack.status.as_str() {
                "applied" => applied += 1,
                "rejected" | "stale" => rejected += 1,
                _ => return Err("API Core returned an unsupported sync acknowledgement".into()),
            }
        }
        let acks = body
            .acks
            .into_iter()
            .map(map_ack)
            .collect::<Result<Vec<_>, _>>()?;
        let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
        store::ack(&mut conn, acks)
            .await
            .map_err(|e| format!("Could not persist sync acknowledgements: {e}"))?;
        sqlx::query("UPDATE sync_state SET last_server_cursor = ?")
            .bind(&body.server_cursor)
            .execute(&mut *conn)
            .await
            .map_err(|e| format!("Could not save sync cursor: {e}"))?;
        server_cursor = Some(body.server_cursor);
    }

    Ok(SyncRunResult {
        state: if rejected > 0 { "attention" } else { "synced" }.into(),
        sent,
        applied,
        rejected,
        pending: pending_count(pool).await.map_err(|e| e.to_string())?,
        server_cursor,
    })
}
