pub mod auth;
pub mod pairing;
pub mod router;

use chrono::{Duration, Utc};
use rcgen::{CertificateParams, KeyPair};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::net::{IpAddr, Ipv4Addr};
use std::path::Path;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::models::device::{PairingNetworkOption, PairingSessionInfo};

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
    pub tls_certificate_pem: String,
    pub tls_private_key_pem: String,
    pub tls_fingerprint: String,
}

impl LanServerState {
    pub fn new(pool: SqlitePool, port: u16, app_data_dir: &Path) -> Result<Self, String> {
        let (tls_certificate_pem, tls_private_key_pem, tls_fingerprint) =
            load_or_create_tls_identity(app_data_dir)?;
        Ok(Self {
            pool,
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
            pair_failures: Arc::new(Mutex::new(HashMap::new())),
            server_port: port,
            tls_certificate_pem,
            tls_private_key_pem,
            tls_fingerprint,
        })
    }

    pub async fn create_session(
        &self,
        user_id: &str,
        permissions_json: &str,
    ) -> Result<PairingSessionInfo, String> {
        let network_options = get_pairing_network_options(self.server_port);
        if network_options.is_empty() {
            return Err("No active private network address is available for pairing".to_string());
        }

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
            sessions.retain(|_, existing| !existing.consumed && now <= existing.expires_at);
            sessions.insert(session_id.clone(), session);
        }

        let endpoints = network_options
            .iter()
            .map(|option| option.endpoint.clone())
            .collect::<Vec<_>>();
        let endpoint = endpoints[0].clone();
        let encoded_endpoints = percent_encode(&endpoints.join("|"));
        let qr_payload = format!(
            "orbit://pair?endpoint={}&sessionId={}&token={}&fp={}",
            encoded_endpoints, session_id, token, self.tls_fingerprint
        );

        Ok(PairingSessionInfo {
            session_id,
            endpoint,
            endpoints,
            network_options,
            fingerprint: self.tls_fingerprint.clone(),
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
            if session.consumed || Utc::now() > session.expires_at || session.token != token {
                return Err(());
            }
            session.consumed = true;
            Ok((session.user_id.clone(), session.permissions_json.clone()))
        } else {
            Err(())
        }
    }
}

fn load_or_create_tls_identity(app_data_dir: &Path) -> Result<(String, String, String), String> {
    let tls_dir = app_data_dir.join("orbit").join("tls");
    std::fs::create_dir_all(&tls_dir)
        .map_err(|error| format!("Unable to create Orbit TLS directory: {error}"))?;
    let certificate_path = tls_dir.join("certificate.pem");
    let private_key_path = tls_dir.join("private-key.pem");

    match (certificate_path.exists(), private_key_path.exists()) {
        (true, true) => {
            let certificate = std::fs::read_to_string(&certificate_path)
                .map_err(|error| format!("Unable to read Orbit TLS certificate: {error}"))?;
            let private_key = std::fs::read_to_string(&private_key_path)
                .map_err(|error| format!("Unable to read Orbit TLS private key: {error}"))?;
            let certificate_der = decode_pem_certificate(&certificate)?;
            let fingerprint = format!("{:x}", Sha256::digest(certificate_der));
            Ok((certificate, private_key, fingerprint))
        }
        (false, false) => {
            let key_pair = KeyPair::generate()
                .map_err(|error| format!("Unable to create Orbit TLS key: {error}"))?;
            let certificate = CertificateParams::new(Vec::<String>::new())
                .map_err(|error| format!("Unable to create Orbit TLS certificate: {error}"))?
                .self_signed(&key_pair)
                .map_err(|error| format!("Unable to sign Orbit TLS certificate: {error}"))?;
            let certificate_der = certificate.der().to_vec();
            let certificate_pem = certificate.pem();
            let private_key_pem = key_pair.serialize_pem();
            write_private_file(&certificate_path, certificate_pem.as_bytes())?;
            if let Err(error) = write_private_file(&private_key_path, private_key_pem.as_bytes()) {
                let _ = std::fs::remove_file(&certificate_path);
                return Err(error);
            }
            let fingerprint = format!("{:x}", Sha256::digest(certificate_der));
            Ok((certificate_pem, private_key_pem, fingerprint))
        }
        _ => Err("Orbit TLS identity is incomplete; refusing to replace it automatically".to_string()),
    }
}

fn decode_pem_certificate(pem: &str) -> Result<Vec<u8>, String> {
    let body = pem
        .lines()
        .filter(|line| !line.starts_with("-----"))
        .collect::<String>();
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(body)
        .map_err(|error| format!("Orbit TLS certificate is invalid: {error}"))
}

fn write_private_file(path: &Path, contents: &[u8]) -> Result<(), String> {
    let temporary_path = path.with_extension("tmp");
    std::fs::write(&temporary_path, contents)
        .map_err(|error| format!("Unable to write Orbit TLS identity: {error}"))?;
    std::fs::rename(&temporary_path, path)
        .map_err(|error| format!("Unable to save Orbit TLS identity: {error}"))
}

fn percent_encode(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b'~') {
            encoded.push(byte as char);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }
    encoded
}

fn get_pairing_network_options(port: u16) -> Vec<PairingNetworkOption> {
    let mut options = local_ip_address::list_afinet_netifas()
        .unwrap_or_default()
        .into_iter()
        .filter_map(|(interface_name, ip)| {
            let ip = match ip {
                IpAddr::V4(ip) if is_pairing_ipv4(ip) => ip,
                _ => return None,
            };
            let interface_lower = interface_name.to_ascii_lowercase();
            if ["vethernet", "wsl", "virtualbox", "vmware", "loopback"]
                .iter()
                .any(|marker| interface_lower.contains(marker))
            {
                return None;
            }
            let connection_type = if interface_lower.contains("wi-fi direct")
                || interface_lower.contains("local area connection*")
            {
                "pc_hotspot"
            } else {
                "same_wifi"
            };
            Some(PairingNetworkOption {
                endpoint: format!("https://{ip}:{port}"),
                connection_type: connection_type.to_string(),
                interface_name,
            })
        })
        .collect::<Vec<_>>();

    options.sort_by(|left, right| {
        let left_hotspot = left.connection_type == "pc_hotspot";
        let right_hotspot = right.connection_type == "pc_hotspot";
        right_hotspot
            .cmp(&left_hotspot)
            .then_with(|| left.endpoint.cmp(&right.endpoint))
    });
    options.dedup_by(|left, right| left.endpoint == right.endpoint);
    options.truncate(8);
    options
}

fn is_pairing_ipv4(ip: Ipv4Addr) -> bool {
    !ip.is_loopback() && !ip.is_unspecified() && !ip.is_link_local() && ip.is_private()
}

pub fn get_local_ip() -> String {
    get_pairing_network_options(0)
        .first()
        .and_then(|option| option.endpoint.strip_prefix("https://"))
        .and_then(|endpoint| endpoint.strip_suffix(":0"))
        .unwrap_or("127.0.0.1")
        .to_string()
}

pub async fn start_lan_server(state: Arc<LanServerState>, port: u16) {
    let app = router::create_router(Arc::clone(&state));
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    let tls_config = match axum_server::tls_rustls::RustlsConfig::from_pem(
        state.tls_certificate_pem.as_bytes().to_vec(),
        state.tls_private_key_pem.as_bytes().to_vec(),
    )
    .await
    {
        Ok(config) => config,
        Err(error) => {
            eprintln!("[40Labs LAN] Failed to load TLS identity: {error}");
            return;
        }
    };
    println!("[40Labs LAN] Axum TLS server listening on https://{}", addr);

    if let Err(error) = axum_server::bind_rustls(addr, tls_config)
        .serve(app.into_make_service_with_connect_info::<std::net::SocketAddr>())
        .await
    {
        eprintln!("[40Labs LAN] Server error: {error}");
    }
}
