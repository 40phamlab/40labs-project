use serde::{Deserialize, Serialize};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ExplorerItemMetadata {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_symlink: bool,
    pub size_bytes: u64,
    pub extension: String,
    pub modified_at: u64, // Epoch milliseconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExplorerDirectoryContent {
    pub current_path: String,
    pub parent_path: Option<String>,
    pub items: Vec<ExplorerItemMetadata>,
}

/// Checks if a path exists and is safe to access (not a protected application database file).
pub fn validate_path_safety(path: &Path) -> Result<PathBuf, String> {
    let canonical = path
        .canonicalize()
        .map_err(|e| format!("Invalid path or path does not exist '{}': {}", path.display(), e))?;

    let path_str = canonical.to_string_lossy().to_lowercase();

    // Block direct manipulation of core application database or keystore files
    if path_str.ends_with("40labs.db")
        || path_str.ends_with("40labs.db-wal")
        || path_str.ends_with("40labs.db-shm")
        || path_str.ends_with(".keystore")
    {
        return Err("Access to sensitive application database or credential store is protected.".to_string());
    }

    Ok(canonical)
}

/// Validates path for destructive operations (delete/rename): blocks root filesystem directories.
pub fn validate_destructive_operation(path: &Path) -> Result<PathBuf, String> {
    let canonical = validate_path_safety(path)?;

    if canonical.parent().is_none() {
        return Err("Destructive operations on root filesystem directories are prohibited.".to_string());
    }

    Ok(canonical)
}

/// Get default directory ($DOCUMENT/40Labs), creating layout if needed
pub fn get_default_directory(app: &tauri::AppHandle) -> Result<String, String> {
    let root = crate::services::documents::ensure_layout(app)?;
    let canonical = root.canonicalize().unwrap_or(root);
    Ok(canonical.to_string_lossy().to_string())
}

/// Read directory items and return typed metadata
pub fn read_directory(dir_path: &str) -> Result<ExplorerDirectoryContent, String> {
    let path = Path::new(dir_path);
    let canonical = validate_path_safety(path)?;

    if !canonical.is_dir() {
        return Err(format!("Specified path is not a directory: {}", canonical.display()));
    }

    let parent_path = canonical.parent().map(|p| p.to_string_lossy().to_string());

    let entries = std::fs::read_dir(&canonical).map_err(|e| format!("Failed to read directory content: {}", e))?;

    let mut items = Vec::new();

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue, // Skip unreadable entries gracefully
        };

        let item_path = entry.path();
        let symlink_meta = std::fs::symlink_metadata(&item_path).ok();
        let is_symlink = symlink_meta.as_ref().map(|m| m.file_type().is_symlink()).unwrap_or(false);

        let metadata = std::fs::metadata(&item_path).ok();

        let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);

        let modified_at = metadata
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        let name = item_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let extension = item_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        items.push(ExplorerItemMetadata {
            name,
            path: item_path.to_string_lossy().to_string(),
            is_dir,
            is_symlink,
            size_bytes,
            extension,
            modified_at,
        });
    }

    // Sort directories first (A-Z), then files (A-Z)
    items.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(ExplorerDirectoryContent {
        current_path: canonical.to_string_lossy().to_string(),
        parent_path,
        items,
    })
}

/// Read text file content with sensible size limit (default 5MB)
pub fn read_file_text(file_path: &str, max_bytes: Option<u64>) -> Result<String, String> {
    let path = Path::new(file_path);
    let canonical = validate_path_safety(path)?;

    if !canonical.is_file() {
        return Err(format!("Path is not a file: {}", canonical.display()));
    }

    let limit = max_bytes.unwrap_or(5_000_000); // 5 MB default
    let file = std::fs::File::open(&canonical).map_err(|e| format!("Failed to open file: {}", e))?;

    let mut handle = file.take(limit);
    let mut buffer = Vec::new();
    handle.read_to_end(&mut buffer).map_err(|e| format!("Failed to read file: {}", e))?;

    String::from_utf8(buffer).map_err(|_| "File contains binary data or invalid UTF-8 encoding.".to_string())
}

/// Create folder
pub fn create_directory(parent_path: &str, name: &str) -> Result<String, String> {
    let parent = validate_path_safety(Path::new(parent_path))?;
    if !parent.is_dir() {
        return Err("Target parent is not a directory.".to_string());
    }

    let safe_name = crate::services::documents::sanitize_file_name(name);
    let target = parent.join(safe_name);

    std::fs::create_dir_all(&target).map_err(|e| format!("Failed to create folder: {}", e))?;

    Ok(target.to_string_lossy().to_string())
}

/// Rename path
pub fn rename_path(old_path: &str, new_name: &str) -> Result<String, String> {
    let canonical_old = validate_destructive_operation(Path::new(old_path))?;
    let parent = canonical_old.parent().ok_or("Cannot rename path without parent directory.")?;

    let safe_name = crate::services::documents::sanitize_file_name(new_name);
    let target = parent.join(&safe_name);

    if target.exists() {
        return Err(format!("A file or folder with name '{}' already exists.", safe_name));
    }

    std::fs::rename(&canonical_old, &target).map_err(|e| format!("Failed to rename item: {}", e))?;

    Ok(target.to_string_lossy().to_string())
}

/// Copy file
pub fn copy_file(source_path: &str, target_dir: &str) -> Result<String, String> {
    let canonical_source = validate_path_safety(Path::new(source_path))?;
    if !canonical_source.is_file() {
        return Err("Source is not a file.".to_string());
    }

    let canonical_target_dir = validate_path_safety(Path::new(target_dir))?;
    if !canonical_target_dir.is_dir() {
        return Err("Target is not a directory.".to_string());
    }

    let file_name = canonical_source.file_name().and_then(|n| n.to_str()).unwrap_or("copied_file");
    let dest_path = crate::services::documents::unique_path(&canonical_target_dir, file_name);

    std::fs::copy(&canonical_source, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(dest_path.to_string_lossy().to_string())
}

/// Delete file or folder
pub fn delete_path(path: &str) -> Result<(), String> {
    let canonical = validate_destructive_operation(Path::new(path))?;

    if canonical.is_dir() {
        std::fs::remove_dir_all(&canonical).map_err(|e| format!("Failed to delete folder: {}", e))?;
    } else {
        std::fs::remove_file(&canonical).map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

/// Reveal item in OS file manager
pub fn reveal_in_file_manager(app: &tauri::AppHandle, path: &str) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let canonical = validate_path_safety(Path::new(path))?;
    app.opener().reveal_item_in_dir(canonical).map_err(|e| format!("Failed to reveal item in file manager: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_path_safety_blocks_database_files() {
        let temp_dir = std::env::temp_dir().join(format!("40labs_test_db_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&temp_dir).unwrap();
        let db_file = temp_dir.join("40labs.db");
        std::fs::write(&db_file, "sqlite database content").unwrap();

        let result = validate_path_safety(&db_file);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("protected"));

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_filesystem_crud_operations() {
        let temp_dir = std::env::temp_dir().join(format!("40labs_explorer_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&temp_dir).unwrap();
        let temp_str = temp_dir.canonicalize().unwrap().to_string_lossy().to_string();

        // 1. Create directory
        let new_folder = create_directory(&temp_str, "SubFolder").unwrap();
        assert!(Path::new(&new_folder).exists());

        // 2. Read directory
        let content = read_directory(&temp_str).unwrap();
        assert_eq!(content.items.len(), 1);
        assert_eq!(content.items[0].name, "SubFolder");
        assert!(content.items[0].is_dir);

        // 3. Create test file & read text
        let file_path = Path::new(&new_folder).join("hello.txt");
        std::fs::write(&file_path, "Hello 40Labs Core!").unwrap();
        let text = read_file_text(&file_path.to_string_lossy(), None).unwrap();
        assert_eq!(text, "Hello 40Labs Core!");

        // 4. Rename item
        let renamed = rename_path(&file_path.to_string_lossy(), "greeting.txt").unwrap();
        assert!(Path::new(&renamed).exists());
        assert!(!file_path.exists());

        // 5. Copy file
        let copied = copy_file(&renamed, &temp_str).unwrap();
        assert!(Path::new(&copied).exists());

        // 6. Delete item
        delete_path(&renamed).unwrap();
        assert!(!Path::new(&renamed).exists());

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
