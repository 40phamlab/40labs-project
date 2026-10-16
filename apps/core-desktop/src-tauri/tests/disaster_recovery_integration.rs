use core_desktop_lib::auth::policy::get_command_policy_map;

#[test]
fn test_disaster_recovery_command_policies_registered() {
    let policy_map = get_command_policy_map();
    assert!(policy_map.contains_key("export_disaster_recovery_pack"));
    assert!(policy_map.contains_key("preview_disaster_recovery_pack"));
    assert!(policy_map.contains_key("restore_disaster_recovery_pack"));
}
