# syntax=docker/dockerfile:1

# Build the API package from the repository workspace.
FROM rust:1.97-slim@sha256:8e8cf8f7fd54a2d23d5a743b3a03f56e26b6c774276c33fa0595111704ebb15c AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY apps/core-desktop/src-tauri/Cargo.toml apps/core-desktop/src-tauri/Cargo.toml
COPY apps/core-desktop/src-tauri/build.rs apps/core-desktop/src-tauri/build.rs
COPY apps/core-desktop/src-tauri/src/lib.rs apps/core-desktop/src-tauri/src/lib.rs
COPY apps/core-desktop/src-tauri/src/main.rs apps/core-desktop/src-tauri/src/main.rs
COPY services/api-core/ services/api-core/

ENV SQLX_OFFLINE=true

RUN cargo build --release --locked --package api-core

# Minimal runtime
FROM gcr.io/distroless/cc-debian12:nonroot@sha256:9dac0a79194e45a7da0158a9c6da57b217585af0786db3845d1f0ec1a0dd182f AS runtime

WORKDIR /app

COPY --from=builder --chown=65532:65532 /app/target/release/api-core /app/api-core

COPY --from=builder --chown=65532:65532 /app/services/api-core/migrations /app/migrations

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/app/api-core", "healthcheck"]

EXPOSE 3000

USER 65532:65532

LABEL org.opencontainers.image.source="https://github.com/40Labs/40Labs"
LABEL org.opencontainers.image.revision="main"
LABEL org.opencontainers.image.version="0.1.0"

ENTRYPOINT ["/app/api-core"]
