use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExportCategory {
    Attachments,
    Exports,
    Reports,
    LabResults,
}

impl ExportCategory {
    pub fn folder_name(&self) -> &'static str {
        match self {
            ExportCategory::Attachments => "Attachments",
            ExportCategory::Exports => "Exports",
            ExportCategory::Reports => "Reports",
            ExportCategory::LabResults => "Lab Results",
        }
    }
}

pub fn documents_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;
    let doc_dir = app.path().document_dir().map_err(|e| e.to_string())?;
    Ok(doc_dir.join("40Labs"))
}

pub fn ensure_layout(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let root = documents_root(app)?;
    std::fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    for cat in &[
        ExportCategory::Attachments,
        ExportCategory::Exports,
        ExportCategory::Reports,
        ExportCategory::LabResults,
    ] {
        let sub = root.join(cat.folder_name());
        std::fs::create_dir_all(&sub).map_err(|e| e.to_string())?;
    }
    Ok(root)
}

pub fn sanitize_file_name(name: &str) -> String {
    // Extract base file name component to prevent any path traversal (e.g. "../../x.exe" -> "x.exe")
    let base = Path::new(name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(name);

    // 1. Strip path separators and control chars
    let cleaned: String = base
        .chars()
        .filter(|c| !c.is_control() && *c != '/' && *c != '\\')
        .collect();

    // 2. Replace illegal characters: < > : " / \ | ? *
    let illegal_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let replaced: String = cleaned
        .chars()
        .map(|c| if illegal_chars.contains(&c) { '_' } else { c })
        .collect();

    // Trim trailing dots and spaces
    let trimmed = replaced.trim_end_matches(|c| c == '.' || c == ' ');

    let fallback = if trimmed.is_empty() { "file" } else { trimmed };

    // 3. Block Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9) case-insensitive
    let upper = fallback.to_uppercase();
    let stem = upper.split('.').next().unwrap_or(&upper);
    let is_reserved = matches!(
        stem,
        "CON"
            | "PRN"
            | "AUX"
            | "NUL"
            | "COM1"
            | "COM2"
            | "COM3"
            | "COM4"
            | "COM5"
            | "COM6"
            | "COM7"
            | "COM8"
            | "COM9"
            | "LPT1"
            | "LPT2"
            | "LPT3"
            | "LPT4"
            | "LPT5"
            | "LPT6"
            | "LPT7"
            | "LPT8"
            | "LPT9"
    );

    let mut final_name = if is_reserved {
        format!("_{}", fallback)
    } else {
        fallback.to_string()
    };

    // 4. Cap 120 chars preserving extension
    if final_name.chars().count() > 120 {
        if let Some(idx) = final_name.rfind('.') {
            let ext = &final_name[idx..];
            let stem = &final_name[..idx];
            let max_stem_len = 120_usize.saturating_sub(ext.chars().count());
            let truncated_stem: String = stem.chars().take(max_stem_len).collect();
            final_name = format!("{}{}", truncated_stem, ext);
        } else {
            final_name = final_name.chars().take(120).collect();
        }
    }

    if final_name.is_empty() {
        "file".to_string()
    } else {
        final_name
    }
}

pub fn unique_path(dir: &Path, name: &str) -> PathBuf {
    let path = dir.join(name);
    if !path.exists() {
        return path;
    }

    let (stem, ext) = if let Some(idx) = name.rfind('.') {
        (&name[..idx], &name[idx..])
    } else {
        (name, "")
    };

    let mut counter = 1;
    loop {
        let new_name = format!("{} ({}){}", stem, counter, ext);
        let new_path = dir.join(new_name);
        if !new_path.exists() {
            return new_path;
        }
        counter += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_traversal() {
        let input = "../../x.exe";
        let sanitized = sanitize_file_name(input);
        assert!(!sanitized.contains(".."));
        assert!(!sanitized.contains('/'));
        assert!(!sanitized.contains('\\'));
        assert_eq!(sanitized, "x.exe");
    }

    #[test]
    fn test_sanitize_reserved_names() {
        assert_eq!(sanitize_file_name("CON.txt"), "_CON.txt");
        assert_eq!(sanitize_file_name("nul"), "_nul");
        assert_eq!(sanitize_file_name("COM1.pdf"), "_COM1.pdf");
    }

    #[test]
    fn test_sanitize_long_name() {
        let long_stem = "a".repeat(150);
        let input = format!("{}.pdf", long_stem);
        let sanitized = sanitize_file_name(&input);
        assert!(sanitized.chars().count() <= 120);
        assert!(sanitized.ends_with(".pdf"));
    }

    #[test]
    fn test_unicode_swahili() {
        let input = "ripoti_ya_matokeo_ya_maabara.pdf";
        let sanitized = sanitize_file_name(input);
        assert_eq!(sanitized, "ripoti_ya_matokeo_ya_maabara.pdf");
    }

    #[test]
    fn test_unique_path_collision() {
        let dir = std::env::temp_dir().join(format!("40labs_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let file_name = "test.txt";
        let path1 = unique_path(&dir, file_name);
        std::fs::write(&path1, "hello").unwrap();

        let path2 = unique_path(&dir, file_name);
        assert_eq!(path2.file_name().unwrap().to_str().unwrap(), "test (1).txt");

        std::fs::write(&path2, "world").unwrap();
        let path3 = unique_path(&dir, file_name);
        assert_eq!(path3.file_name().unwrap().to_str().unwrap(), "test (2).txt");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
