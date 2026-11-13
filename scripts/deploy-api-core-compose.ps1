param(
    [string]$ComposeFile = 'infra/docker/compose.prod.yml',
    [string]$ProjectName = '40labs-api',
    [string]$ImageTag = 'local'
)
$ErrorActionPreference = 'Stop'
$composePath = (Resolve-Path -LiteralPath $ComposeFile).Path
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
Push-Location $root
try {
    $env:API_CORE_IMAGE = "40labs/api-core:$ImageTag"
    docker compose -p $ProjectName -f $composePath build api-core
    if ($LASTEXITCODE -ne 0) { throw 'API image build failed; deployment stopped.' }
    # The migration command completes before the service is replaced.
    docker compose -p $ProjectName -f $composePath run --rm --no-deps api-core-migrate
    if ($LASTEXITCODE -ne 0) { throw 'Database migration failed; the running API was left in place.' }
    docker compose -p $ProjectName -f $composePath up -d --no-build --remove-orphans api-core
    if ($LASTEXITCODE -ne 0) { throw 'API service update failed.' }
    docker compose -p $ProjectName -f $composePath ps api-core
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect API service status.' }
    $ready = $false
    for ($attempt = 0; $attempt -lt 18; $attempt++) {
        docker compose -p $ProjectName -f $composePath exec --no-TTY api-core /app/api-core healthcheck
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 5
    }
    if (-not $ready) { throw 'API did not become ready within 90 seconds; inspect Compose logs and health status.' }
} finally {
    Pop-Location
    Remove-Item Env:API_CORE_IMAGE -ErrorAction SilentlyContinue
}
