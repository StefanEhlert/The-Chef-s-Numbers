# MinIO Container Start-Skript
# Startet MinIO für The Chef's Numbers

Write-Host "🚀 Starte MinIO Container..." -ForegroundColor Green

# Prüfe ob Docker läuft
try {
    docker version | Out-Null
    Write-Host "✅ Docker ist verfügbar" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker ist nicht verfügbar oder läuft nicht!" -ForegroundColor Red
    Write-Host "Bitte starten Sie Docker Desktop und versuchen Sie es erneut." -ForegroundColor Yellow
    exit 1
}

# Stoppe existierende MinIO Container
Write-Host "🛑 Stoppe existierende MinIO Container..." -ForegroundColor Yellow
docker stop chef-minio 2>$null
docker rm chef-minio 2>$null

# Starte MinIO Container
Write-Host "📦 Starte MinIO Container..." -ForegroundColor Blue
docker run -d `
    --name chef-minio `
    -p 9000:9000 `
    -p 9001:9001 `
    -e MINIO_ROOT_USER=minioadmin `
    -e MINIO_ROOT_PASSWORD=minioadmin `
    -v minio_data:/data `
    minio/minio:latest server /data --console-address ":9001"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MinIO Container erfolgreich gestartet!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 MinIO Informationen:" -ForegroundColor Cyan
    Write-Host "   API Endpoint: http://localhost:9000" -ForegroundColor White
    Write-Host "   Console: http://localhost:9001" -ForegroundColor White
    Write-Host "   Username: minioadmin" -ForegroundColor White
    Write-Host "   Password: minioadmin" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Standard-Konfiguration für The Chef's Numbers:" -ForegroundColor Cyan
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Port: 9000" -ForegroundColor White
    Write-Host "   Access Key: minioadmin" -ForegroundColor White
    Write-Host "   Secret Key: minioadmin" -ForegroundColor White
    Write-Host "   Bucket: chef-images" -ForegroundColor White
    Write-Host ""
    Write-Host "⏳ Warten Sie 10 Sekunden, bis MinIO vollständig gestartet ist..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "🌐 Öffne MinIO Console..." -ForegroundColor Green
    Start-Process "http://localhost:9001"
    
    Write-Host ""
    Write-Host "🎉 MinIO ist bereit! Sie können jetzt die Verbindung in der Speicherverwaltung testen." -ForegroundColor Green
} else {
    Write-Host "❌ Fehler beim Starten des MinIO Containers!" -ForegroundColor Red
    Write-Host "Überprüfen Sie die Docker-Logs mit: docker logs chef-minio" -ForegroundColor Yellow
}
