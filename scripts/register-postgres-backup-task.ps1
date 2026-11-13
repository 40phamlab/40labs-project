param(
    [Parameter(Mandatory=$true)][string]$PgService,
    [Parameter(Mandatory=$true)][string]$OutputDirectory,
    [string]$TaskName = '40Labs PostgreSQL Backup',
    [string]$StartTime = '02:00',
    [ValidateRange(1,3650)][int]$RetentionDays = 30
)
$ErrorActionPreference = 'Stop'
$backupScript = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\infra\db\backup\backup-postgres.ps1')).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
$pwsh = (Get-Command pwsh -ErrorAction Stop).Source
$arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$backupScript`" -PgService `"$PgService`" -OutputDirectory `"$resolvedOutput`" -RetentionDays $RetentionDays"
$action = New-ScheduledTaskAction -Execute $pwsh -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Daily -At $StartTime
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description 'Creates and validates a PostgreSQL custom-format backup and prunes backups beyond retention.' -Force | Out-Null
Write-Output "Scheduled '$TaskName' daily at $StartTime (machine local time), retaining $RetentionDays days in $resolvedOutput."
