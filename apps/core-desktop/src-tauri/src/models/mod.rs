pub mod audit;
pub mod auth;
pub mod business;
pub mod customers;
pub mod device;
pub mod integrations;
pub mod inventory;
pub mod lab;
pub mod notification;
pub mod partner_facility;
pub mod purchases;
pub mod sales;
pub mod staff_notification;

#[cfg(test)]
pub const DEFAULT_WORKSPACE_ID: &str = "ws_010101";
#[cfg(test)]
pub const DEFAULT_BRANCH_ID: &str = "br_010101";
