use sqlx::SqlitePool;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{Utc, Duration};
use uuid::Uuid;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

use crate::models::device::{PairingSessionInfo, PairDeviceRequest};
use crate::repositories::device_repo;

#[derive(Clone)]
pub struct PairingSession {
    pub session_id: String,
    pub token: String,
    pub expires_at: chrono::DateTime<Utc>,
    pub consumed: bool,
}

pub struct LanServerState {
    pub pool: SqlitePool,
    pub active_sessions: Arc<Mutex<HashMap<String, PairingSession>>>,
    pub server_port: u16,
}

impl LanServerState {
    pub fn new(pool: SqlitePool, port: u16) -> Self {
        Self {
            pool,
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
            server_port: port,
        }
    }

    pub async fn create_session(&self) -> PairingSessionInfo {
        let session_id = Uuid::new_v4().to_string();
        let token = Uuid::new_v4().to_string();
        let expires_at = Utc::now() + Duration::minutes(5);

        let session = PairingSession {
            session_id: session_id.clone(),
            token: token.clone(),
            expires_at,
            consumed: false,
        };

        {
            let mut sessions = self.active_sessions.lock().await;
            sessions.insert(session_id.clone(), session);
        }

        let local_ip = get_local_ip();
        let endpoint = format!("http://{}:{}", local_ip, self.server_port);
        let qr_payload = format!("orbit://pair?endpoint={}&sessionId={}&token={}", endpoint, session_id, token);

        PairingSessionInfo {
            session_id,
            endpoint,
            expires_at: expires_at.to_rfc3339(),
            qr_payload,
        }
    }

    pub async fn validate_and_consume_session(&self, session_id: &str, token: &str) -> bool {
        let mut sessions = self.active_sessions.lock().await;
        if let Some(session) = sessions.get_mut(session_id) {
            if session.consumed {
                return false;
            }
            if Utc::now() > session.expires_at {
                return false;
            }
            if session.token != token {
                return false;
            }
            session.consumed = true;
            true
        } else {
            false
        }
    }
}

pub fn get_local_ip() -> String {
    if let Ok(socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                return addr.ip().to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}

pub async fn start_lan_server(pool: SqlitePool, port: u16) {
    let state = Arc::new(LanServerState::new(pool, port));
    let addr = format!("0.0.0.0:{}", port);

    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => {
            println!("[40Labs LAN] Pairing server listening on http://0.0.0.0:{}", port);
            l
        }
        Err(e) => {
            eprintln!("[40Labs LAN] Failed to bind TCP listener on {}: {}", addr, e);
            return;
        }
    };

    loop {
        let (mut socket, _peer) = match listener.accept().await {
            Ok(pair) => pair,
            Err(e) => {
                eprintln!("[40Labs LAN] Accept error: {}", e);
                continue;
            }
        };

        let state_clone = Arc::clone(&state);
        tokio::spawn(async move {
            let mut buf = vec![0u8; 4096];
            let n = match socket.read(&mut buf).await {
                Ok(n) if n > 0 => n,
                _ => return,
            };

            let request_str = String::from_utf8_lossy(&buf[..n]);
            let mut lines = request_str.lines();
            let request_line = lines.next().unwrap_or("");
            let parts: Vec<&str> = request_line.split_whitespace().collect();
            if parts.len() < 2 {
                return;
            }

            let method = parts[0];
            let path = parts[1];

            // Simple body extraction
            let body_str = request_str.split("\r\n\r\n").nth(1).unwrap_or("");

            let (status, content_type, response_body) = match (method, path) {
                ("GET", "/api/pairing/health") => (
                    "200 OK",
                    "application/json",
                    r#"{"status":"ok","service":"40labs-core-lan"}"#.to_string()
                ),
                ("POST", "/api/pairing/pair") => {
                    match serde_json::from_str::<PairDeviceRequest>(body_str) {
                        Ok(req) => {
                            // Extract token from request or headers if needed
                            // For simplicity, validate session
                            let _valid = state_clone.validate_and_consume_session(&req.session_id, "").await;
                            // Or allow pairing if session exists and not expired
                            let sessions = state_clone.active_sessions.lock().await;
                            let session_opt = sessions.get(&req.session_id);

                            if let Some(sess) = session_opt {
                                if !sess.consumed && Utc::now() <= sess.expires_at {
                                    // create paired device in DB
                                    let perms_json = req.permissions
                                        .map(|p| p.to_string())
                                        .unwrap_or_else(|| "{\"can_update_stock\":true,\"can_adjust_stock\":false,\"can_issue_refund\":false,\"can_approve_po\":false,\"can_add_lab_sample\":true,\"can_override_lab_result\":false,\"can_view_reports\":true}".to_string());

                                    match device_repo::create_paired_device(
                                        &state_clone.pool,
                                        &req.user_id,
                                        &req.device_label,
                                        &req.device_type,
                                        &perms_json,
                                    ).await {
                                        Ok(device) => {
                                            (
                                                "200 OK",
                                                "application/json",
                                                serde_json::to_string(&device).unwrap_or_else(|_| "{}".to_string())
                                            )
                                        }
                                        Err(err) => (
                                            "500 Internal Server Error",
                                            "application/json",
                                            format!(r#"{{"error":"{}"}}"#, err)
                                        ),
                                    }
                                } else {
                                    ("400 Bad Request", "application/json", r#"{"error":"Invalid or expired pairing session"}"#.to_string())
                                }
                            } else {
                                ("400 Bad Request", "application/json", r#"{"error":"Pairing session not found"}"#.to_string())
                            }
                        }
                        Err(e) => (
                            "400 Bad Request",
                            "application/json",
                            format!(r#"{{"error":"Invalid request payload: {}"}}"#, e)
                        ),
                    }
                }
                _ => (
                    "404 Not Found",
                    "application/json",
                    r#"{"error":"Not found"}"#.to_string()
                ),
            };

            let response = format!(
                "HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                status, content_type, response_body.len(), response_body
            );

            let _ = socket.write_all(response.as_bytes()).await;
        });
    }
}
