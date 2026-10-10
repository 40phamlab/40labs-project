use std::fs;
use std::path::Path;
use regex::Regex;
use core_desktop_lib::auth::policy::get_command_policy_map;
use core_desktop_lib::debug::redact_sensitive;

#[test]
fn test_redaction_rules() {
    assert_eq!(redact_sensitive("+255712345678"), "***-***-678");
    assert_eq!(redact_sensitive("0712345678"), "***-***-678");
    assert_eq!(redact_sensitive("SecretPassword123!"), "[REDACTED]");
    assert_eq!(redact_sensitive("123456"), "[REDACTED]");
}

#[test]
fn test_invoke_name_completeness() {
    let api_dir = Path::new("../src/api");
    if !api_dir.exists() {
        return;
    }

    let policy_map = get_command_policy_map();
    let re = Regex::new(r#"invoke(?:Command)?\s*\(\s*['"]([a-zA-Z0-9_]+)['"]"#).unwrap();

    let mut found_commands = Vec::new();

    if let Ok(entries) = fs::read_dir(api_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("ts") {
                if let Ok(content) = fs::read_to_string(&path) {
                    for cap in re.captures_iter(&content) {
                        if let Some(cmd) = cap.get(1) {
                            found_commands.push(cmd.as_str().to_string());
                        }
                    }
                }
            }
        }
    }

    for cmd in found_commands {
        assert!(
            policy_map.contains_key(cmd.as_str()),
            "Command '{}' found in frontend API calls but missing from COMMAND_POLICY map",
            cmd
        );
    }
}
