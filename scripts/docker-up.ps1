$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

$envFile = "infra/docker/.env"
$envExample = "infra/docker/.env.example"

if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
    Write-Host "Creating infra/docker/.env from .env.example..." -ForegroundColor Cyan
    Copy-Item $envExample $envFile
}

$apiHostPort = if ($env:API_HOST_PORT) { $env:API_HOST_PORT } else { "3000" }
if (Test-Path $envFile) {
    $portSetting = Get-Content $envFile | Where-Object { $_ -match '^\s*API_HOST_PORT\s*=' } | Select-Object -First 1
    if ($portSetting -and -not $env:API_HOST_PORT) {
        $apiHostPort = ($portSetting -split '=', 2)[1].Trim().Trim('"').Trim("'")
    }
}
if ($apiHostPort -notmatch '^\d{1,5}$' -or [int]$apiHostPort -lt 1 -or [int]$apiHostPort -gt 65535) {
    throw "API_HOST_PORT must be a valid TCP port between 1 and 65535. Current value: '$apiHostPort'."
}

Write-Host "Starting 40Labs Development Docker Compose Stack..." -ForegroundColor Green
Write-Host "Auth API will be available at http://127.0.0.1:$apiHostPort" -ForegroundColor Cyan
Write-Host "Use API_BASE_URL=http://127.0.0.1:$apiHostPort when starting the desktop app." -ForegroundColor Cyan

docker compose -f infra/docker/compose.dev.yml --env-file $envFile up --build
if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose failed to start. Check whether localhost port $apiHostPort is already in use, or set API_HOST_PORT in infra/docker/.env."
}
