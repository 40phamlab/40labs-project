use tauri::AppHandle;
use crate::services::explorer_service::{
    self, ExplorerDirectoryContent
};

#[tauri::command]
pub async fn explorer_get_default_dir(app: AppHandle) -> Result<String, String> {
    explorer_service::get_default_directory(&app)
}

#[tauri::command]
pub async fn explorer_read_dir(path: String) -> Result<ExplorerDirectoryContent, String> {
    explorer_service::read_directory(&path)
}

#[tauri::command]
pub async fn explorer_read_file_text(path: String, max_bytes: Option<u64>) -> Result<String, String> {
    explorer_service::read_file_text(&path, max_bytes)
}

#[tauri::command]
pub async fn explorer_create_dir(parent_path: String, name: String) -> Result<String, String> {
    explorer_service::create_directory(&parent_path, &name)
}

#[tauri::command]
pub async fn explorer_rename_path(old_path: String, new_name: String) -> Result<String, String> {
    explorer_service::rename_path(&old_path, &new_name)
}

#[tauri::command]
pub async fn explorer_copy_file(source_path: String, target_dir: String) -> Result<String, String> {
    explorer_service::copy_file(&source_path, &target_dir)
}

#[tauri::command]
pub async fn explorer_delete_path(path: String) -> Result<(), String> {
    explorer_service::delete_path(&path)
}

#[tauri::command]
pub async fn explorer_reveal_in_file_manager(app: AppHandle, path: String) -> Result<(), String> {
    explorer_service::reveal_in_file_manager(&app, &path)
}
