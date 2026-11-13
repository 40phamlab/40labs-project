param(
    [Parameter(Mandatory=$true)][string]$PgService,
    [Parameter(Mandatory=$true)][string]$BackupFile,
    [Parameter(Mandatory=$true)][string]$TargetDatabase
)
$ErrorActionPreference = 'Stop'
foreach ($tool in @('pg_restore', 'psql', 'createdb')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool is required (PostgreSQL client tools)." }
}
if ($TargetDatabase -cnotmatch '^[A-Za-z_][A-Za-z0-9_-]{0,62}$') {
    throw 'TargetDatabase must start with a letter or underscore and contain only letters, digits, underscores, or hyphens (maximum 63 characters).'
}
$resolved = (Resolve-Path -LiteralPath $BackupFile).Path
$checksumFile = "$resolved.sha256"
if (-not (Test-Path -LiteralPath $checksumFile)) { throw 'Backup checksum file is missing.' }
$expected = ((Get-Content -LiteralPath $checksumFile -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
$actual = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash.ToLowerInvariant()
if ($expected -ne $actual) { throw 'Backup checksum verification failed.' }
$exists = & psql --dbname="service=$PgService" --set ON_ERROR_STOP=1 --tuples-only --no-align --set target="$TargetDatabase" --command "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'target')"
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect PostgreSQL databases using the configured service.' }
if ($exists.Trim() -eq 't') { throw 'Target database already exists; refusing to overwrite it. Choose a new empty database name.' }
# createdb receives the target as an argument and safely quotes it as an identifier.
& createdb --maintenance-db="service=$PgService" --template=template0 $TargetDatabase
if ($LASTEXITCODE -ne 0) { throw 'Could not create the new restore target database.' }
try {
    & pg_restore --dbname="service=$PgService dbname=$TargetDatabase" --no-owner --no-acl --exit-on-error $resolved
    if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE" }
    & psql --dbname="service=$PgService dbname=$TargetDatabase" --set ON_ERROR_STOP=1 --command 'SELECT current_database(); SELECT count(*) AS public_tables FROM information_schema.tables WHERE table_schema = ''public'' AND table_type = ''BASE TABLE''' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Post-restore validation query failed.' }
    Write-Output "Restore completed and validated in new database: $TargetDatabase"
} catch {
    Write-Error "Restore failed. The new database '$TargetDatabase' was left in place for inspection; no existing database was overwritten. $($_.Exception.Message)"
    throw
}
