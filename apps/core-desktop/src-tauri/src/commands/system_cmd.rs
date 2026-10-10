#[tauri::command]
pub fn system_health_check() -> String {
    "40Labs Core-Desktop Engine OK".to_string()
}

#[tauri::command]
pub fn frontend_log(level: String, msg: String) {
    #[cfg(debug_assertions)]
    {
        match level.to_lowercase().as_str() {
            "debug" => tracing::debug!("[FRONTEND] {}", msg),
            "info" => tracing::info!("[FRONTEND] {}", msg),
            "warn" => tracing::warn!("[FRONTEND] {}", msg),
            "error" => tracing::error!("[FRONTEND] {}", msg),
            _ => tracing::info!("[FRONTEND] {}", msg),
        }
    }
}

