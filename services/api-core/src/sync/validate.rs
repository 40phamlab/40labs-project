use serde::Deserialize;
use crate::error::ApiError;
use std::io::Read;

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct PushRequest {
    pub device_id: String,
    pub batch_id: String,
    pub app_version: String,
    pub changes: Vec<ChangeItem>,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct ChangeItem {
    pub change_id: String,
    pub entity: String,
    pub entity_id: String,
    pub op: String,
    pub version: i64,
    pub payload: serde_json::Value,
    pub created_at: String,
}

#[derive(Deserialize, Debug)]
#[serde(deny_unknown_fields)]
pub struct HeartbeatRequest {
    pub device_id: String,
    pub pending_count: i64,
    pub app_version: String,
    pub last_ack_at: Option<String>,
}

pub fn validate_push_payload(req: &PushRequest) -> Result<(), ApiError> {
    if req.changes.is_empty() {
        return Ok(());
    }
    if req.changes.len() > 500 {
        return Err(ApiError::BadRequest("Batch exceeds maximum limit of 500 changes".into()));
    }
    Ok(())
}

pub fn decompress_gzip(bytes: &[u8], max_size: usize) -> Result<Vec<u8>, ApiError> {
    if bytes.len() > max_size {
        return Err(ApiError::BadRequest("Payload exceeds maximum allowed size of 1 MB".into()));
    }

    // Check if gzip magic bytes (0x1f, 0x8b) are present
    if bytes.len() >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b {
        let mut decoder = flate2::read::GzDecoder::new(bytes);
        let mut decompressed = Vec::new();
        let mut limited = decoder.take((max_size + 1) as u64);
        limited.read_to_end(&mut decompressed)
            .map_err(|_| ApiError::BadRequest("Failed to decompress gzip payload".into()))?;

        if decompressed.len() > max_size {
            return Err(ApiError::BadRequest("Decompressed payload exceeds 1 MB limit".into()));
        }
        Ok(decompressed)
    } else {
        if bytes.len() > max_size {
            return Err(ApiError::BadRequest("Payload exceeds 1 MB limit".into()));
        }
        Ok(bytes.to_vec())
    }
}
