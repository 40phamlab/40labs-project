param(
    [Parameter(Mandatory=$true)][string]$PgService,
    [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw 'pg_dump is required (PostgreSQL client tools).' }
if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) { throw 'pg_restore is required (PostgreSQL client tools).' }
if (-not (Test-Path -LiteralPath $OutputDirectory)) { New-Item -ItemType Directory -Path $OutputDirectory | Out-Null }
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$target = Join-Path $OutputDirectory "40labs-$stamp.dump"
$temp = "$target.partial"
try {
    & pg_dump --dbname="service=$PgService" --format=custom --no-owner --no-acl --file=$temp
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
    & pg_restore --list $temp | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "pg_restore archive validation failed with exit code $LASTEXITCODE" }
    $hash = (Get-FileHash -LiteralPath $temp -Algorithm SHA256).Hash.ToLowerInvariant()
    Move-Item -LiteralPath $temp -Destination $target
    [System.IO.File]::WriteAllText("$target.sha256", "$hash  $(Split-Path -Leaf $target)", [System.Text.UTF8Encoding]::new($false))
    Write-Output "Backup created and archive-validated: $target"
    Write-Output "SHA256: $hash"
} finally {
    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force }
}
