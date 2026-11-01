use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use uuid::Uuid;

const SUPPORTED_SCHEMA_VERSION: i32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowFile {
    pub schema_version: i32,
    pub id: String,
    pub name: String,
    pub lab_category: Option<String>,
    pub status: String, // "draft" | "published"
    pub created_at: String,
    pub updated_at: String,
    pub nodes: Vec<serde_json::Value>,
    pub edges: Vec<serde_json::Value>,
    pub viewport: Option<serde_json::Value>,
    pub meta: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowMetadata {
    pub id: String,
    pub name: String,
    pub lab_category: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub filename: String,
}

pub fn get_workflows_dir<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let dir = app_data.join("40labs").join("workflows");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir)
}

pub fn get_trash_dir<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, String> {
    let workflows_dir = get_workflows_dir(app)?;
    let trash = workflows_dir.join(".trash");
    if !trash.exists() {
        fs::create_dir_all(&trash).map_err(|e| e.to_string())?;
    }
    Ok(trash)
}

pub fn slugify(name: &str) -> String {
    let slug = name
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>();

    // Collapse multiple hyphens
    let mut cleaned = String::new();
    let mut last_dash = false;
    for c in slug.chars() {
        if c == '-' {
            if !last_dash {
                cleaned.push(c);
                last_dash = true;
            }
        } else {
            cleaned.push(c);
            last_dash = false;
        }
    }
    let trimmed = cleaned.trim_matches('-');
    if trimmed.is_empty() {
        "workflow".to_string()
    } else {
        trimmed.to_string()
    }
}

pub fn sanitize_filename(filename: &str) -> Result<String, String> {
    if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
        return Err("Path traversal attack detected".to_string());
    }
    if !filename.ends_with(".workflow.json") {
        return Err("Invalid workflow filename extension".to_string());
    }
    Ok(filename.to_string())
}

#[tauri::command]
pub async fn list_workflows(app: tauri::AppHandle) -> Result<Vec<WorkflowMetadata>, String> {
    let dir = get_workflows_dir(&app)?;
    let mut list = Vec::new();

    if dir.exists() {
        for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|s| s.to_str()) {
                    if file_name.ends_with(".workflow.json") {
                        match fs::read_to_string(&path) {
                            Ok(content) => {
                                match serde_json::from_str::<WorkflowFile>(&content) {
                                    Ok(workflow) => {
                                        if workflow.schema_version != SUPPORTED_SCHEMA_VERSION {
                                            tracing::warn!("Skipping workflow {} due to unsupported schema version: {}", file_name, workflow.schema_version);
                                            continue;
                                        }
                                        list.push(WorkflowMetadata {
                                            id: workflow.id,
                                            name: workflow.name,
                                            lab_category: workflow.lab_category,
                                            status: workflow.status,
                                            created_at: workflow.created_at,
                                            updated_at: workflow.updated_at,
                                            filename: file_name.to_string(),
                                        });
                                    }
                                    Err(err) => {
                                        tracing::error!("Corrupt JSON in workflow file {}: {}", file_name, err);
                                        // Surface resiliently by skipping or including error flag if desired
                                    }
                                }
                            }
                            Err(err) => {
                                tracing::error!("Failed to read workflow file {}: {}", file_name, err);
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(list)
}

#[tauri::command]
pub async fn read_workflow(app: tauri::AppHandle, filename: String) -> Result<WorkflowFile, String> {
    let safe_name = sanitize_filename(&filename)?;
    let dir = get_workflows_dir(&app)?;
    let path = dir.join(safe_name);
    if !path.starts_with(&dir) {
        return Err("Access denied".to_string());
    }
    if !path.exists() {
        return Err("Workflow file not found".to_string());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let workflow: WorkflowFile = serde_json::from_str(&content).map_err(|e| format!("Invalid workflow JSON: {}", e))?;

    if workflow.schema_version != SUPPORTED_SCHEMA_VERSION {
        return Err(format!(
            "Unsupported schemaVersion: {}. Expected version {}.",
            workflow.schema_version, SUPPORTED_SCHEMA_VERSION
        ));
    }

    Ok(workflow)
}

#[tauri::command]
pub async fn save_workflow(app: tauri::AppHandle, mut workflow: WorkflowFile) -> Result<WorkflowMetadata, String> {
    if workflow.schema_version != SUPPORTED_SCHEMA_VERSION {
        return Err(format!(
            "Unsupported schemaVersion: {}. Expected version {}.",
            workflow.schema_version, SUPPORTED_SCHEMA_VERSION
        ));
    }

    if workflow.id.is_empty() {
        workflow.id = Uuid::new_v4().to_string();
    }

    let now = chrono::Utc::now().to_rfc3339();
    if workflow.created_at.is_empty() {
        workflow.created_at = now.clone();
    }
    workflow.updated_at = now;

    let dir = get_workflows_dir(&app)?;
    let base_slug = slugify(&workflow.name);

    // Check for duplicate names (append -2, -3 etc if filename exists and belongs to a different ID)
    let mut candidate_filename = format!("{}.workflow.json", base_slug);
    let mut counter = 2;
    loop {
        let candidate_path = dir.join(&candidate_filename);
        if candidate_path.exists() {
            if let Ok(content) = fs::read_to_string(&candidate_path) {
                if let Ok(existing) = serde_json::from_str::<WorkflowFile>(&content) {
                    if existing.id != workflow.id {
                        candidate_filename = format!("{}-{}.workflow.json", base_slug, counter);
                        counter += 1;
                        continue;
                    }
                }
            }
        }
        break;
    }

    let target_path = dir.join(&candidate_filename);
    let temp_path = dir.join(format!("{}.tmp", candidate_filename));

    let json_content = serde_json::to_string_pretty(&workflow).map_err(|e| e.to_string())?;

    // Atomic write: write to temp file then rename
    fs::write(&temp_path, json_content).map_err(|e| format!("Disk write failed: {}", e))?;
    fs::rename(&temp_path, &target_path).map_err(|e| format!("Atomic rename failed: {}", e))?;

    Ok(WorkflowMetadata {
        id: workflow.id,
        name: workflow.name,
        lab_category: workflow.lab_category,
        status: workflow.status,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        filename: candidate_filename,
    })
}

#[tauri::command]
pub async fn duplicate_workflow(app: tauri::AppHandle, filename: String) -> Result<WorkflowMetadata, String> {
    let original = read_workflow(app.clone(), filename).await?;
    let now = chrono::Utc::now().to_rfc3339();

    let duplicated = WorkflowFile {
        schema_version: SUPPORTED_SCHEMA_VERSION,
        id: Uuid::new_v4().to_string(),
        name: format!("{} (Copy)", original.name),
        lab_category: original.lab_category,
        status: "draft".to_string(),
        created_at: now.clone(),
        updated_at: now,
        nodes: original.nodes,
        edges: original.edges,
        viewport: original.viewport,
        meta: original.meta,
    };

    save_workflow(app, duplicated).await
}

#[tauri::command]
pub async fn delete_workflow(app: tauri::AppHandle, filename: String) -> Result<bool, String> {
    let safe_name = sanitize_filename(&filename)?;
    let dir = get_workflows_dir(&app)?;
    let path = dir.join(&safe_name);
    let trash_dir = get_trash_dir(&app)?;
    let trash_path = trash_dir.join(&safe_name);

    if path.exists() {
        fs::rename(&path, &trash_path).map_err(|e| format!("Failed to move workflow to trash: {}", e))?;
        Ok(true)
    } else {
        Err("Workflow file not found".to_string())
    }
}

#[tauri::command]
pub async fn import_workflow(app: tauri::AppHandle, source_path: String) -> Result<WorkflowMetadata, String> {
    let content = fs::read_to_string(&source_path).map_err(|e| format!("Failed to read import file: {}", e))?;
    let workflow: WorkflowFile = serde_json::from_str(&content).map_err(|e| format!("Invalid workflow JSON: {}", e))?;

    if workflow.schema_version != SUPPORTED_SCHEMA_VERSION {
        return Err(format!(
            "Unsupported schemaVersion: {}. Expected version {}.",
            workflow.schema_version, SUPPORTED_SCHEMA_VERSION
        ));
    }

    save_workflow(app, workflow).await
}

#[tauri::command]
pub async fn export_workflow(app: tauri::AppHandle, filename: String, destination_path: String) -> Result<bool, String> {
    let workflow = read_workflow(app, filename).await?;
    let content = serde_json::to_string_pretty(&workflow).map_err(|e| e.to_string())?;
    fs::write(&destination_path, content).map_err(|e| format!("Failed to export workflow: {}", e))?;
    Ok(true)
}

#[tauri::command]
pub async fn reveal_in_explorer(app: tauri::AppHandle, filename: String) -> Result<bool, String> {
    let safe_name = sanitize_filename(&filename)?;
    let dir = get_workflows_dir(&app)?;
    let path = dir.join(safe_name);
    if path.exists() {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("explorer")
                .arg("/select,")
                .arg(path.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("open")
                .arg("-R")
                .arg(&path)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "linux")]
        {
            if let Some(parent) = path.parent() {
                std::process::Command::new("xdg-open")
                    .arg(parent)
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(true)
    } else {
        Err("Workflow file not found".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slugify() {
        assert_eq!(slugify("Hematology & Coagulation #1!"), "hematology-coagulation-1");
        assert_eq!(slugify("   Test Workflow   "), "test-workflow");
        assert_eq!(slugify(""), "workflow");
    }

    #[test]
    fn test_sanitize_filename() {
        assert!(sanitize_filename("valid.workflow.json").is_ok());
        assert!(sanitize_filename("../etc/passwd").is_err());
        assert!(sanitize_filename("invalid.txt").is_err());
    }
}
