# PowerShell-Skript zum Hinzufügen der open_food_facts_code Spalte
# Verwendung: .\add-open-food-facts-code.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration v2.2.1: open_food_facts_code" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Docker läuft
$dockerRunning = docker ps -q --filter "name=postgres" 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ PostgreSQL Container nicht gefunden oder läuft nicht!" -ForegroundColor Red
    Write-Host "Starten Sie zuerst den Container mit: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ PostgreSQL Container gefunden" -ForegroundColor Green
Write-Host ""

# Führe Migrations-Skript aus
Write-Host "Führe Migration aus..." -ForegroundColor Yellow
docker exec -i postgres psql -U postgres -d chef_numbers -f /docker-entrypoint-initdb.d/migration-2.2.1-add-open-food-facts-code.sql

Write-Host ""
Write-Host "Verifiziere Spalte..." -ForegroundColor Yellow
docker exec -i postgres psql -U postgres -d chef_numbers -f /docker-entrypoint-initdb.d/verify-open-food-facts-code.sql

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration abgeschlossen" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

