pub mod pairing;
pub mod auth;
pub mod router;

use sqlx::SqlitePool;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{Utc, Duration};
use uuid::Uuid;
use std::net::IpAddr;
use std::time::Instant;

use crate::models::device::PairingSessionInfo;

#[derive(Clone)]
pub struct PairingSession {
    pub session_id: String,
    pub token: String,
    pub user_id: String,
    pub permissions_json: String,
    pub expires_at: chrono::DateTime<Utc>,
    pub consumed: bool,
}

pub struct LanServerState {
    pub pool: SqlitePool,
    pub active_sessions: Arc<Mutex<HashMap<String, PairingSession>>>,
    pub pair_failures: Arc<Mutex<HashMap<IpAddr, (u32, Instant)>>>,
    pub server_port: u16,
}

impl LanServerState {
    pub fn new(pool: SqlitePool, port: u16) -> Self {
        Self {
            pool,
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
            pair_failures: Arc::new(Mutex::new(HashMap::new())),
            server_port: port,
        }
    }

    pub async fn create_session(
        &self,
        user_id: &str,
        permissions_json: &str,
    ) -> Result<PairingSessionInfo, String> {
        let session_id = Uuid::new_v4().to_string();
        let token = Uuid::new_v4().to_string();
        let expires_at = Utc::now() + Duration::minutes(5);

        let session = PairingSession {
            session_id: session_id.clone(),
            token: token.clone(),
            user_id: user_id.to_string(),
            permissions_json: permissions_json.to_string(),
            expires_at,
            consumed: false,
        };

        {
            let mut sessions = self.active_sessions.lock().await;
            let now = Utc::now();
            sessions.retain(|_, s| !s.consumed && now <= s.expires_at);
            sessions.insert(session_id.clone(), session);
        }

        let local_ip = get_local_ip();
        let endpoint = format!("http://{}:{}", local_ip, self.server_port);
        let qr_payload = format!("orbit://pair?endpoint={}&sessionId={}&token={}", endpoint, session_id, token);

        Ok(PairingSessionInfo {
            session_id,
            endpoint,
            expires_at: expires_at.to_rfc3339(),
            qr_payload,
        })
    }

    pub async fn validate_and_consume_session(
        &self,
        session_id: &str,
        token: &str,
    ) -> Result<(String, String), ()> {
        let mut sessions = self.active_sessions.lock().await;
        if let Some(session) = sessions.get_mut(session_id) {
            if session.consumed {
                return Err(());
            }
            if Utc::now() > session.expires_at {
                return Err(());
            }
            if session.token != token {
                return Err(());
            }
            session.consumed = true;
            Ok((session.user_id.clone(), session.permissions_json.clone()))
        } else {
            Err(())
        }
    }
}

pub fn get_local_ip() -> String {
    if let Ok(interfaces) = local_ip_address::list_afinet_netifas() {
        for (_name, ip) in &interfaces {
            if ip.is_ipv4() && !ip.is_loopback() {
                let ip_str = ip.to_string();
                if ip_str.starts_with("192.168.") || ip_str.starts_with("10.") || ip_str.starts_with("172.") {
                    return ip_str;
                }
            }
        }
        for (_name, ip) in &interfaces {
            if ip.is_ipv4() && !ip.is_loopback() {
                return ip.to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}

pub async fn start_lan_server(state: Arc<LanServerState>, port: u16) {
    let app = router::create_router(state);
    let addr = format!("0.0.0.0:{}", port);
    println!("[40Labs LAN] Axum server listening on http://{}", addr);

    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[40Labs LAN] Failed to bind TCP listener on {}: {}", addr, e);
            return;
        }
    };

    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("[40Labs LAN] Server error: {}", e);
    }
}
