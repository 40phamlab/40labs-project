$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

Write-Host "Resetting 40Labs Development PostgreSQL Database & Volumes..." -ForegroundColor Red
docker compose -f infra/docker/compose.dev.yml down -v
Write-Host "Development database volumes removed." -ForegroundColor Green
