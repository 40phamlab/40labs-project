use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::{
    limit::RequestBodyLimitLayer,
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, RequestId, SetRequestIdLayer},
    trace::{DefaultOnResponse, TraceLayer},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use api_core::{
    config::Config,
    ratelimit::RateLimiter,
    routes::{activation, health},
    sms::{console::ConsoleOtpProvider, nextsms::NextSmsProvider, OtpProvider},
};

async fn apply_database_migrations(
    pool: &PgPool,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    api_core::migrations::run(pool).await
}

async fn connect_pool(
    options: PgPoolOptions,
    database_url: &str,
    connect_timeout_secs: u64,
) -> Result<PgPool, Box<dyn std::error::Error + Send + Sync>> {
    let pool = tokio::time::timeout(
        std::time::Duration::from_secs(connect_timeout_secs),
        options.connect(database_url),
    )
    .await??;
    Ok(pool)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Optional healthcheck CLI subcommand for container healthchecks
    if let Some(arg) = std::env::args().nth(1) {
        if arg == "healthcheck" || arg == "health" {
            let config = Config::from_env();
            let url = format!("http://127.0.0.1:{}/readyz", config.port);
            let client = reqwest::Client::new();
            match client.get(&url).send().await {
                Ok(resp) if resp.status().is_success() => {
                    println!("Healthcheck OK");
                    std::process::exit(0);
                }
                _ => {
                    eprintln!("Healthcheck failed");
                    std::process::exit(1);
                }
            }
        }

        if arg == "migrate" {
            let config = Config::from_env();
            if let Err(error) = config.validate_migration_environment() {
                eprintln!("Refusing migration with invalid configuration: {error}");
                std::process::exit(2);
            }
            let migration_url = if config.migration_database_url.trim().is_empty() {
                &config.database_url
            } else {
                &config.migration_database_url
            };
            let pool = connect_pool(
                PgPoolOptions::new().max_connections(2).acquire_timeout(
                    std::time::Duration::from_secs(
                        config.database_acquire_timeout_secs.clamp(1, 60),
                    ),
                ),
                migration_url,
                config.database_connect_timeout_secs.clamp(1, 60),
            )
            .await?;
            apply_database_migrations(&pool)
                .await
                .map_err(|_| std::io::Error::other("Database migration failed"))?;
            pool.close().await;
            println!("Database migrations completed");
            return Ok(());
        }

        if arg == "admin-seed" {
            let config = Config::from_env();
            if matches!(
                config.app_env.to_ascii_lowercase().as_str(),
                "production" | "staging"
            ) {
                eprintln!("admin-seed is disabled in production");
                std::process::exit(1);
            }
            let pool = PgPoolOptions::new()
                .max_connections(1)
                .connect(&config.database_url)
                .await
                .expect("Failed to connect for seeding");

            apply_database_migrations(&pool)
                .await
                .expect("Failed to run migrations during seed");

            let mut email = "admin@40labs.io".to_string();
            let mut role = "admin".to_string();
            let password = std::env::var("ADMIN_SEED_PASSWORD").unwrap_or_default();

            let args: Vec<String> = std::env::args().collect();
            let mut i = 2;
            while i < args.len() {
                match args[i].as_str() {
                    "--email" => {
                        if i + 1 < args.len() {
                            email = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    "--role" => {
                        if i + 1 < args.len() {
                            role = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }

            if password.len() < 16 {
                eprintln!("Set ADMIN_SEED_PASSWORD to a unique password of at least 16 characters");
                std::process::exit(2);
            }

            let password_hash =
                api_core::admin::auth::hash_password(&password).expect("Failed to hash password");
            let id = uuid::Uuid::new_v4().to_string();

            let res = sqlx::query(
                "INSERT INTO admin_users (id, email, password_hash, totp_secret_enc, totp_enrolled_at, role) \
                 VALUES ($1, $2, $3, NULL, NULL, $4) \
                 ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, totp_secret_enc = NULL, totp_enrolled_at = NULL, totp_last_step = NULL, role = EXCLUDED.role \
                 RETURNING id"
            )
            .bind(id)
            .bind(&email)
            .bind(&password_hash)
            .bind(&role)
            .fetch_one(&pool)
            .await;

            match res {
                Ok(_) => {
                    println!("Admin seeded successfully!");
                    println!("Email: {}", email);
                    println!("Role: {}", role);
                    std::process::exit(0);
                }
                Err(e) => {
                    eprintln!("Failed to seed admin: {}", e);
                    std::process::exit(1);
                }
            }
        }

        if arg == "admin-demo-seed" {
            let config = Config::from_env();
            if matches!(
                config.app_env.to_lowercase().as_str(),
                "production" | "staging"
            ) {
                eprintln!("Refusing to run demo seed in production environment!");
                std::process::exit(1);
            }
            let pool = PgPoolOptions::new()
                .max_connections(1)
                .connect(&config.database_url)
                .await
                .expect("Failed to connect for demo seeding");

            apply_database_migrations(&pool)
                .await
                .expect("Failed to run migrations during demo seed");

            let regions = ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Mbeya"];
            let tiers = ["free", "pro", "enterprise"];
            let statuses = ["verified", "pending", "rejected"];

            for i in 1..=15 {
                let business_id = format!("biz_demo_{:03}", i);
                let workspace_id = format!("ws_demo_{:03}", i);
                let name = format!("Demo Pharmacy {}", i);
                let region = regions[i % regions.len()];
                let tier = tiers[i % tiers.len()];
                let status = statuses[i % statuses.len()];
                let phone_hash = format!("phone_hash_{}", i);

                let _ = sqlx::query(
                    r#"
                    INSERT INTO business_registry (business_id, workspace_id, branch_id, phone_hash, terms_version, terms_locale, terms_text_sha256, terms_accepted_at, name, address_region, tier, tmda_number)
                    VALUES ($1, $2, 'branch_1', $3, '1.0', 'en', 'hash', NOW()::text, $4, $5, $6, $7)
                    ON CONFLICT (business_id) DO UPDATE SET name = EXCLUDED.name, address_region = EXCLUDED.address_region, tier = EXCLUDED.tier
                    "#
                )
                .bind(&business_id)
                .bind(&workspace_id)
                .bind(&phone_hash)
                .bind(&name)
                .bind(region)
                .bind(tier)
                .bind(format!("TMDA-REG-{}", i))
                .execute(&pool)
                .await;

                let _ = sqlx::query(
                    r#"
                    INSERT INTO business_verification (business_id, status, reason, decided_by, decided_at)
                    VALUES ($1, $2, $3, 'admin@40labs.io', NOW())
                    ON CONFLICT (business_id) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason
                    "#
                )
                .bind(&business_id)
                .bind(status)
                .bind(if status == "rejected" { Some(String::from("Incomplete documentation")) } else { None })
                .execute(&pool)
                .await;

                let _ = sqlx::query(
                    r#"
                    INSERT INTO sync_devices (workspace_id, branch_id, device_id, last_seen, last_seen_at, pending_count, outbox_pending, app_version)
                    VALUES ($1, 'branch_1', $2, NOW(), NOW(), 0, 0, '0.1.0')
                    ON CONFLICT (device_id) DO UPDATE SET last_seen = NOW()
                    "#
                )
                .bind(&workspace_id)
                .bind(format!("dev_demo_{:03}", i))
                .execute(&pool)
                .await;

                for day_offset in 0..90 {
                    let summary_date =
                        chrono::Utc::now().date_naive() - chrono::Duration::days(day_offset);
                    let revenue = (i as i64 * 150_000) + (day_offset * 12_000);
                    let _ = sqlx::query(
                        r#"
                        INSERT INTO cloud_daily_summaries (id, workspace_id, branch_id, summary_date, revenue_total, tx_count, items_sold, version, source_device_id)
                        VALUES ($1, $2, 'branch_1', $3, $4, 25, 45, 1, $5)
                        ON CONFLICT (workspace_id, branch_id, summary_date) DO UPDATE SET revenue_total = EXCLUDED.revenue_total
                        "#
                    )
                    .bind(format!("ds_{}_{}", i, day_offset))
                    .bind(&workspace_id)
                    .bind(summary_date)
                    .bind(revenue as i64)
                    .bind(format!("dev_demo_{:03}", i))
                    .execute(&pool)
                    .await;
                }

                if i % 3 == 0 {
                    let _ = sqlx::query(
                        r#"
                        INSERT INTO ops_events (id, ts, level, source, message, business_id, device_id, meta)
                        VALUES ($1, NOW(), 'WARN', 'sync', $2, $3, $4, $5)
                        "#
                    )
                    .bind(uuid::Uuid::new_v4().to_string())
                    .bind("Sync push rejected: workspace_mismatch")
                    .bind(&workspace_id)
                    .bind(format!("dev_demo_{:03}", i))
                    .bind(serde_json::json!({ "reason": "workspace_mismatch" }))
                    .execute(&pool)
                    .await;
                }
            }

            println!("Demo seed completed successfully: 15 businesses, 90 days of summaries, devices, and test logs seeded.");
            std::process::exit(0);
        }
    }

    let config = Config::from_env();
    if let Err(error) = config.validate_environment() {
        panic!("Refusing to start with invalid environment configuration: {error}");
    }
    let default_log = if matches!(
        config.app_env.to_lowercase().as_str(),
        "production" | "staging"
    ) {
        "api_core=info,tower_http=info".into()
    } else {
        "api_core=debug,tower_http=debug".into()
    };

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| default_log))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    if matches!(
        config.app_env.to_lowercase().as_str(),
        "production" | "staging"
    ) && config.otp_provider.to_lowercase() == "console"
    {
        tracing::error!(
            "Refusing to start: Cannot use console OTP provider in production environment."
        );
        panic!("Refusing to start: Console OTP provider not allowed in production.");
    }

    if config.sms_mode.to_lowercase() == "live" || config.otp_provider.to_lowercase() == "nextsms" {
        if config.nextsms_api_token.is_empty() || config.nextsms_sender_id.is_empty() {
            if matches!(
                config.app_env.to_lowercase().as_str(),
                "production" | "staging"
            ) {
                panic!("Refusing to start in production mode: NEXTSMS_API_TOKEN and NEXTSMS_SENDER_ID must not be empty.");
            }
        }
    }

    tracing::info!("Connecting to database...");
    let pool = connect_pool(
        PgPoolOptions::new()
            .max_connections(config.database_max_connections.clamp(1, 200))
            .min_connections(1)
            .acquire_timeout(std::time::Duration::from_secs(
                config.database_acquire_timeout_secs.clamp(1, 60),
            ))
            .idle_timeout(Some(std::time::Duration::from_secs(600)))
            .max_lifetime(Some(std::time::Duration::from_secs(1800))),
        &config.database_url,
        config.database_connect_timeout_secs.clamp(1, 60),
    )
    .await
    .expect("Failed to connect to Postgres");

    if !matches!(
        config.app_env.to_lowercase().as_str(),
        "production" | "staging"
    ) {
        tracing::info!("Running database migrations...");
        let migration_url = if config.migration_database_url.trim().is_empty() {
            config.database_url.as_str()
        } else {
            config.migration_database_url.as_str()
        };
        let migration_pool = connect_pool(
            PgPoolOptions::new().max_connections(2).acquire_timeout(
                std::time::Duration::from_secs(config.database_acquire_timeout_secs.clamp(1, 60)),
            ),
            migration_url,
            config.database_connect_timeout_secs.clamp(1, 60),
        )
        .await
        .expect("Failed to connect with migration database role");
        apply_database_migrations(&migration_pool)
            .await
            .expect("Failed to run migrations");
        migration_pool.close().await;
    }

    let sms_sender: Arc<dyn OtpProvider> = match config.otp_provider.to_lowercase().as_str() {
        "console" => {
            tracing::info!("Using ConsoleOtpProvider for OTP delivery");
            Arc::new(ConsoleOtpProvider::new())
        }
        _ => Arc::new(NextSmsProvider::new(
            config.nextsms_base_url.clone(),
            config.nextsms_api_token.clone(),
            config.nextsms_sender_id.clone(),
            config.sms_mode.to_lowercase() != "live",
        )),
    };

    // Startup check for SMS sender & log loud warning if status 56/58
    match sms_sender
        .send("255712345678", "startup check", "health-startup")
        .await
    {
        Ok(receipt) => {
            if matches!(receipt.status_id, 56 | 58) {
                tracing::warn!("LOUD WARNING: NextSMS returned status {} (Sender ID not registered / config error) at startup!", receipt.status_id);
            } else {
                tracing::info!(
                    "SMS sender startup health check passed with status ID {}",
                    receipt.status_id
                );
            }
        }
        Err(e) => {
            if let api_core::sms::SmsError::ConfigError(_)
            | api_core::sms::SmsError::SenderNotApproved(_) = e
            {
                tracing::warn!(
                    "LOUD WARNING: NextSMS configuration error at startup: {}",
                    e
                );
            } else {
                tracing::info!("SMS sender startup health check completed: {:?}", e);
            }
        }
    }

    let rate_limiter = RateLimiter::new();

    let state = activation::AppState {
        pool,
        config: config.clone(),
        sms_sender,
        rate_limiter,
    };

    api_core::admin::infra::start_health_prober(state.clone());

    let cors = tower_http::cors::CorsLayer::new()
        .allow_origin(
            config
                .admin_web_origin
                .parse::<axum::http::HeaderValue>()
                .unwrap_or_else(|_| axum::http::HeaderValue::from_static("http://localhost:5174")),
        )
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
        ])
        .allow_credentials(true);

    let app = axum::Router::new()
        .merge(health::health_router(state.clone()))
        .merge(api_core::observability::router(state.clone()))
        .merge(activation::router(state.clone()))
        .merge(api_core::sync::router(state.clone()))
        .merge(api_core::routes::device::router(state.clone()))
        .merge(api_core::admin::router(state.clone()))
        .layer(cors)
        .layer(RequestBodyLimitLayer::new(2 * 1024 * 1024))
        .layer(axum::middleware::from_fn(
            api_core::observability::track_request,
        ))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|request: &axum::http::Request<_>| {
                    let request_id = request
                        .extensions()
                        .get::<RequestId>()
                        .and_then(|id| id.header_value().to_str().ok())
                        .unwrap_or("missing");
                    tracing::info_span!(
                        "api_request",
                        method = %request.method(),
                        request_id = %request_id
                    )
                })
                .on_response(DefaultOnResponse::new().include_headers(false)),
        )
        .layer(PropagateRequestIdLayer::new(
            axum::http::HeaderName::from_static("x-request-id"),
        ))
        .layer(SetRequestIdLayer::new(
            axum::http::HeaderName::from_static("x-request-id"),
            MakeRequestUuid,
        ));

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("API core server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("Received Ctrl+C, shutting down gracefully...");
        },
        _ = terminate => {
            tracing::info!("Received SIGTERM, shutting down gracefully...");
        },
    }
}
