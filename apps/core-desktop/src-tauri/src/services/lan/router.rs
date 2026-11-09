use axum::{
    middleware,
    routing::{get, patch, post},
    Router,
};
use std::sync::Arc;

use super::{
    auth::auth_middleware,
    handlers::*,
    pairing, LanServerState,
};

pub fn create_router(state: Arc<LanServerState>) -> Router {
    let protected_routes = Router::new()
        .route("/devices/me", get(devices_me_handler))
        .route("/devices/me/heartbeat", post(heartbeat_handler))
        .route("/staff/roster", get(staff_roster_handler))
        .route("/me/summary", get(summary_handler))
        .route("/activity", get(activity_handler))
        .route(
            "/staff-notifications",
            get(get_staff_notifications_handler).post(post_staff_notification_handler),
        )
        .route(
            "/staff-notifications/:id/read",
            patch(patch_staff_notification_read_handler),
        )
        .route("/stock", get(get_stock_handler))
        .route("/stock/:id", get(get_stock_item_handler))
        .route("/stock/receipts", post(post_stock_receipt_handler))
        .route("/lab/orders", get(get_lab_orders_handler))
        .route("/lab/samples", post(post_lab_samples_handler))
        .route("/lab/results", post(post_lab_results_handler))
        .route(
            "/customers",
            get(get_customers_handler).post(post_customers_handler),
        )
        .route("/sales", post(post_sales_handler))
        .route_layer(middleware::from_fn_with_state(
            Arc::clone(&state),
            auth_middleware,
        ));

    Router::new()
        .route("/api/pairing/health", get(pairing::health_handler))
        .route("/api/pairing/pair", post(pairing::pair_handler))
        .nest("/api/v1", protected_routes)
        .with_state(state)
}
