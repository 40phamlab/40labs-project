pub mod audit;
pub mod auth;
pub mod business;
pub mod customers;
pub mod inventory;
pub mod lab;
pub mod sales;
pub mod notification;
pub mod staff_notification;
pub mod device;

#[cfg(test)]
pub const DEFAULT_WORKSPACE_ID: &str = "ws_010101";
#[cfg(test)]
pub const DEFAULT_BRANCH_ID: &str = "br_010101";
