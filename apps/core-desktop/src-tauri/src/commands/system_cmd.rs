#[tauri::command]
pub fn system_health_check() -> String {
    "40Labs Core-Desktop Engine OK".to_string()
}
