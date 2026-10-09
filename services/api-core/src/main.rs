use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use api_core::{
    config::Config,
    ratelimit::RateLimiter,
    routes::activation::{router, AppState},
    sms::{nextsms::NextSmsSender, test_mode::TestModeSender, SmsSender},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api_core=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();

    tracing::info!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to Postgres");

    tracing::info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let sms_sender: Arc<dyn SmsSender> = if config.sms_mode.to_lowercase() == "live" {
        Arc::new(NextSmsSender::new(
            config.nextsms_base_url.clone(),
            config.nextsms_username.clone(),
            config.nextsms_password.clone(),
            config.nextsms_sender_id.clone(),
        ))
    } else {
        Arc::new(TestModeSender)
    };

    let rate_limiter = RateLimiter::new();

    let state = AppState {
        pool,
        config: config.clone(),
        sms_sender,
        rate_limiter,
    };

    let app = router(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("API core server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app.into_make_service_with_connect_info::<std::net::SocketAddr>()).await?;

    Ok(())
}
