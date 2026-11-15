param(
    [string]$Profile = "",
    [switch]$Server
)

$ErrorActionPreference = "Stop"

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = Resolve-Path (Join-Path $scriptDirectory "..")
$workspaceMarker = Join-Path $repositoryRoot "pnpm-workspace.yaml"
$devDataDirectory = Join-Path $repositoryRoot "dev-data"

if (-not (Test-Path $workspaceMarker)) {
    Write-Error "[40Labs Dev Reset] Refusing to reset: expected repository root with pnpm-workspace.yaml."
    exit 1
}

$suffix = ""
if (-not [string]::IsNullOrEmpty($Profile)) {
    $trimmed = $Profile.Trim().ToLower()
    if ($trimmed -match '^[a-z0-9-]{1,16}$') {
        $suffix = "-$trimmed"
    } else {
        Write-Error "[40Labs Dev Reset] Invalid profile '$Profile'. Must match [a-z0-9-]{1,16}."
        exit 1
    }
}

$dbName = "40labs-dev$suffix.db"
$databasePath = Join-Path $devDataDirectory $dbName

$databaseFiles = @(
    $databasePath,
    "$databasePath-wal",
    "$databasePath-shm",
    "$databasePath-journal"
)

$keystoreFile = Join-Path $devDataDirectory ".dev-keystore$suffix"
$deviceKeyFile = Join-Path $devDataDirectory ".dev-device-key$suffix"

$logFile = Join-Path $devDataDirectory "registration$suffix.log"

Write-Host "[40Labs Dev Reset] Wiping local database, dev keys, registration logs, and credential entries together (profile: $(if ($Profile) { $Profile } else { 'default' }))..."
Write-Host "[40Labs Dev Reset] Close the desktop app first so files are not locked during reset."

# Remove SQLite database and sidecars
foreach ($filePath in $databaseFiles) {
    if (Test-Path $filePath) {
        try {
            Remove-Item -Force $filePath
            Write-Host "[40Labs Dev Reset] Removed database file: $(Split-Path -Leaf $filePath)"
        } catch {
            Write-Warning "[40Labs Dev Reset] Failed to remove $(Split-Path -Leaf $filePath): $_"
        }
    }
}

# Remove local dev keystore files
foreach ($filePath in @($keystoreFile, $deviceKeyFile)) {
    if (Test-Path $filePath) {
        try {
            Remove-Item -Force $filePath
            Write-Host "[40Labs Dev Reset] Removed dev secret file: $(Split-Path -Leaf $filePath)"
        } catch {
            Write-Warning "[40Labs Dev Reset] Failed to remove $(Split-Path -Leaf $filePath): $_"
        }
    }
}

# Remove registration log file
if (Test-Path $logFile) {
    try {
        Remove-Item -Force $logFile
        Write-Host "[40Labs Dev Reset] Removed registration log: $(Split-Path -Leaf $logFile)"
    } catch {
        Write-Warning "[40Labs Dev Reset] Failed to remove registration log: $_"
    }
}

# Remove Windows Credential Manager / keyring entries
$serviceName = "com.40labs.core-desktop$suffix"
Write-Host "[40Labs Dev Reset] Clearing Windows credentials for service: $serviceName"
try {
    cmdkey /delete:legacy:$serviceName 2>$null
    cmdkey /delete:$serviceName 2>$null
} catch {
    # Ignore if not present
}

if ($Server) {
    Write-Host "[40Labs Dev Reset] Stopping development server Docker containers and wiping volumes (-v)..."
    Push-Location $repositoryRoot
    try {
        docker compose -f infra/docker/compose.dev.yml down -v
    } finally {
        Pop-Location
    }
}

Write-Host "[40Labs Dev Reset] Local development environment (profile: $(if ($Profile) { $Profile } else { 'default' })) fully reset. The app will recreate master secrets, dev keys, and database on next launch."
