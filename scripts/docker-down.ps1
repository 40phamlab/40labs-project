$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

Write-Host "Stopping 40Labs Development Docker Compose Stack..." -ForegroundColor Yellow
docker compose -f infra/docker/compose.dev.yml down
