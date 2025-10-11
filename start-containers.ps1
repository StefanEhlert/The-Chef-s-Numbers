# PowerShell-Skript zum Starten der Docker-Container
# The Chef's Numbers - Container Management

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("postgres", "mariadb")]
    [string]$DatabaseType,
    
    [switch]$StartMinIO = $true,
    [switch]$StartBackend = $true
)

Write-Host "🚀 Starte The Chef's Numbers Container..." -ForegroundColor Green
Write-Host ""

# Überprüfe ob Docker läuft
try {
    docker version | Out-Null
    Write-Host "✅ Docker läuft" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker läuft nicht. Bitte starten Sie Docker Desktop." -ForegroundColor Red
    exit 1
}

# Überprüfe ob docker-compose verfügbar ist
try {
    docker-compose version | Out-Null
    Write-Host "✅ Docker Compose verfügbar" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose nicht verfügbar. Bitte installieren Sie Docker Compose." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Setze Umgebungsvariablen
$env:DB_TYPE = $DatabaseType

# Erstelle Profile-Liste
$profiles = @()
if ($DatabaseType -eq "postgres") {
    $profiles += "postgres"
    Write-Host "🗄️  Verwende PostgreSQL als Datenbank" -ForegroundColor Cyan
} else {
    $profiles += "mariadb"
    Write-Host "🗄️  Verwende MariaDB als Datenbank" -ForegroundColor Cyan
}

if ($StartMinIO) {
    $profiles += "minio"
    Write-Host "🖼️  MinIO für Bildverwaltung wird gestartet" -ForegroundColor Cyan
}

if ($StartBackend) {
    Write-Host "⚙️  Backend-Service wird gestartet" -ForegroundColor Cyan
}

Write-Host ""

# Stoppe alle laufenden Container
Write-Host "🛑 Stoppe alle laufenden Container..." -ForegroundColor Yellow
docker-compose down

# Starte Container mit den gewählten Profilen
$profileString = $profiles -join ","
Write-Host "🚀 Starte Container mit Profilen: $profileString" -ForegroundColor Green

if ($profiles.Count -gt 0) {
    docker-compose --profile $profileString up -d
} else {
    docker-compose up -d
}

Write-Host ""
Write-Host "⏳ Warte auf Container-Start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Zeige Container-Status
Write-Host ""
Write-Host "📊 Container-Status:" -ForegroundColor Green
docker-compose ps

Write-Host ""
Write-Host "🎉 Container wurden gestartet!" -ForegroundColor Green
Write-Host ""

# Zeige Zugangsdaten
if ($DatabaseType -eq "postgres") {
    Write-Host "🗄️  PostgreSQL:" -ForegroundColor Cyan
    Write-Host "   Host: localhost:5432" -ForegroundColor White
    Write-Host "   Datenbank: chef_numbers" -ForegroundColor White
    Write-Host "   Benutzer: chef" -ForegroundColor White
    Write-Host "   Passwort: password" -ForegroundColor White
} else {
    Write-Host "🗄️  MariaDB:" -ForegroundColor Cyan
    Write-Host "   Host: localhost:3306" -ForegroundColor White
    Write-Host "   Datenbank: chef_numbers" -ForegroundColor White
    Write-Host "   Benutzer: chef" -ForegroundColor White
    Write-Host "   Passwort: password" -ForegroundColor White
}

if ($StartMinIO) {
    Write-Host ""
    Write-Host "🖼️  MinIO:" -ForegroundColor Cyan
    Write-Host "   API: http://localhost:9000" -ForegroundColor White
    Write-Host "   Console: http://localhost:9001" -ForegroundColor White
    Write-Host "   Access Key: chef_access_key" -ForegroundColor White
    Write-Host "   Secret Key: chef_secret_key" -ForegroundColor White
}

if ($StartBackend) {
    Write-Host ""
    Write-Host "⚙️  Backend:" -ForegroundColor Cyan
    Write-Host "   API: http://localhost:3000" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Logs anzeigen mit: docker-compose logs [service-name]" -ForegroundColor Gray
Write-Host "🛑 Container stoppen mit: docker-compose down" -ForegroundColor Gray
