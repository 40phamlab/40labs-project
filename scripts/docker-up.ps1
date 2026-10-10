$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

$envFile = "infra/docker/.env"
$envExample = "infra/docker/.env.example"

if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
    Write-Host "Creating infra/docker/.env from .env.example..." -ForegroundColor Cyan
    Copy-Item $envExample $envFile
}

Write-Host "Starting 40Labs Development Docker Compose Stack..." -ForegroundColor Green
docker compose -f infra/docker/compose.dev.yml --env-file infra/docker/.env up --build
