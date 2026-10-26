use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use api_core::{
    config::Config,
    ratelimit::RateLimiter,
    routes::{activation, health},
    sms::{console::ConsoleOtpProvider, nextsms::NextSmsProvider, OtpProvider},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
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

        if arg == "admin-seed" {
            let config = Config::from_env();
            let pool = PgPoolOptions::new()
                .max_connections(1)
                .connect(&config.database_url)
                .await
                .expect("Failed to connect for seeding");

            sqlx::migrate!("./migrations")
                .run(&pool)
                .await
                .expect("Failed to run migrations during seed");

            let mut email = "admin@40labs.io".to_string();
            let mut role = "admin".to_string();
            let mut password = String::new();

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
                    "--password" => {
                        if i + 1 < args.len() {
                            password = args[i + 1].clone();
                            i += 1;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }

            if password.is_empty() {
                password = format!("Admin#{}!", rand::Rng::gen_range(&mut rand::thread_rng(), 1000..9999));
                println!("Generated one-time password: {}", password);
            }

            let password_hash = api_core::admin::auth::hash_password(&password).expect("Failed to hash password");
            let (totp_secret, otpauth_url) = api_core::admin::auth::generate_totp_secret();
            let totp_secret_enc = api_core::admin::auth::encrypt_secret(&totp_secret, &config.totp_enc_key).expect("Failed to encrypt TOTP secret");
            let id = uuid::Uuid::new_v4().to_string();

            let res = sqlx::query(
                "INSERT INTO admin_users (id, email, password_hash, totp_secret_enc, role) \
                 VALUES ($1, $2, $3, $4, $5) \
                 ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role \
                 RETURNING id"
            )
            .bind(id)
            .bind(&email)
            .bind(&password_hash)
            .bind(&totp_secret_enc)
            .bind(&role)
            .fetch_one(&pool)
            .await;

            match res {
                Ok(_) => {
                    println!("Admin seeded successfully!");
                    println!("Email: {}", email);
                    println!("Role: {}", role);
                    println!("Password: {}", password);
                    println!("TOTP Secret (Base32): {}", totp_secret);
                    println!("OTPAuth URL: {}", otpauth_url);
                    std::process::exit(0);
                }
                Err(e) => {
                    eprintln!("Failed to seed admin: {}", e);
                    std::process::exit(1);
                }
            }
        }
    }

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api_core=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();

    if config.app_env.to_lowercase() == "production" && config.otp_provider.to_lowercase() == "console" {
        tracing::error!("Refusing to start: Cannot use console OTP provider in production environment.");
        panic!("Refusing to start: Console OTP provider not allowed in production.");
    }

    if config.app_env.to_lowercase() == "production" {
        let is_invalid = config.activation_signing_key.is_empty()
            || hex::decode(&config.activation_signing_key).map(|d| d.len() < 32).unwrap_or(true);
        if is_invalid {
            panic!("Refusing to start in production mode: ACTIVATION_SIGNING_KEY must be a valid hex string of at least 32 bytes.");
        }
    }

    if config.sms_mode.to_lowercase() == "live" || config.otp_provider.to_lowercase() == "nextsms" {
        if config.nextsms_api_token.is_empty() || config.nextsms_sender_id.is_empty() {
            if config.app_env.to_lowercase() == "production" {
                panic!("Refusing to start in production mode: NEXTSMS_API_TOKEN and NEXTSMS_SENDER_ID must not be empty.");
            }
        }
    }

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

    let sms_sender: Arc<dyn OtpProvider> = match config.otp_provider.to_lowercase().as_str() {
        "console" => {
            tracing::info!("Using ConsoleOtpProvider for OTP delivery");
            Arc::new(ConsoleOtpProvider::new())
        }
        _ => {
            Arc::new(NextSmsProvider::new(
                config.nextsms_base_url.clone(),
                config.nextsms_api_token.clone(),
                config.nextsms_sender_id.clone(),
                config.sms_mode.to_lowercase() != "live",
            ))
        }
    };

    // Startup check for SMS sender & log loud warning if status 56/58
    match sms_sender.send("255712345678", "startup check", "health-startup").await {
        Ok(receipt) => {
            if matches!(receipt.status_id, 56 | 58) {
                tracing::warn!("LOUD WARNING: NextSMS returned status {} (Sender ID not registered / config error) at startup!", receipt.status_id);
            } else {
                tracing::info!("SMS sender startup health check passed with status ID {}", receipt.status_id);
            }
        }
        Err(e) => {
            if let api_core::sms::SmsError::ConfigError(_) | api_core::sms::SmsError::SenderNotApproved(_) = e {
                tracing::warn!("LOUD WARNING: NextSMS configuration error at startup: {}", e);
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
        admin_challenges: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        login_failures: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        account_lockouts: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
    };

    let cors = tower_http::cors::CorsLayer::new()
        .allow_origin(config.admin_web_origin.parse::<axum::http::HeaderValue>().unwrap_or_else(|_| axum::http::HeaderValue::from_static("http://localhost:5174")))
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST, axum::http::Method::PUT, axum::http::Method::DELETE, axum::http::Method::OPTIONS])
        .allow_headers([axum::http::header::CONTENT_TYPE, axum::http::header::AUTHORIZATION])
        .allow_credentials(true);

    let app = axum::Router::new()
        .merge(health::health_router(state.clone()))
        .merge(activation::router(state.clone()))
        .merge(api_core::sync::router(state.clone()))
        .merge(api_core::admin::router(state.clone()))
        .layer(cors);

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
