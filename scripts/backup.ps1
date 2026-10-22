param([Parameter(Mandatory=$true)][string]$BackupDirectory)
$ErrorActionPreference = 'Stop'
# Configure PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD or PGPASSFILE securely.
if (-not $env:PGHOST -or -not $env:PGUSER -or -not $env:PGDATABASE) { throw 'Configure the PostgreSQL connection environment before backup.' }
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw 'Install PostgreSQL client tools first.' }
$backupRoot = [IO.Path]::GetFullPath($BackupDirectory)
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
$backupFile = Join-Path $backupRoot ('plainpage-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.dump')
& pg_dump --format=custom --no-owner --no-acl --schema=public --file=$backupFile
if ($LASTEXITCODE -ne 0) { throw 'Database backup failed. Do not use the partial dump.' }
& pg_restore --list $backupFile | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Backup integrity listing failed.' }
Write-Output ('Created database backup: ' + $backupFile)
Write-Output 'Store this dump in encrypted storage. Test restoration in a separate staging database. Storage images and Supabase Auth require separate backup coverage.'
