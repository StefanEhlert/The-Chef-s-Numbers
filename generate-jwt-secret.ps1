# generate-jwt-secret.ps1
# Generiert JWT-Secret aus PostgreSQL-Passwort (deterministisch)

param(
    [Parameter(Mandatory=$true)]
    [string]$PostgresPassword
)

Write-Host "Generiere JWT-Secret aus PostgreSQL-Passwort..." -ForegroundColor Green
Write-Host "Passwort: [HIDDEN]" -ForegroundColor Yellow

try {
    # SHA-256 Hash des Passworts generieren
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($PostgresPassword)
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    $jwtSecret = [System.BitConverter]::ToString($hash) -replace '-', ''
    
    Write-Host "JWT-Secret generiert:" -ForegroundColor Green
    Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Docker-Compose-Konfiguration:" -ForegroundColor Blue
    Write-Host "PGRST_JWT_SECRET: $jwtSecret" -ForegroundColor Cyan
    Write-Host "PGRST_JWT_SECRET_IS_BASE64: false" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Test der Wiederholbarkeit:" -ForegroundColor Blue
    
    # Zweite Generierung zum Test
    $bytes2 = [System.Text.Encoding]::UTF8.GetBytes($PostgresPassword)
    $hash2 = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes2)
    $jwtSecret2 = [System.BitConverter]::ToString($hash2) -replace '-', ''
    
    if ($jwtSecret -eq $jwtSecret2) {
        Write-Host "JWT-Secret-Generierung ist wiederholbar" -ForegroundColor Green
    } else {
        Write-Host "JWT-Secret-Generierung ist NICHT wiederholbar!" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Frontend-Implementierung:" -ForegroundColor Blue
    Write-Host "const jwtSecret = await generateJWTSecretFromPassword('$PostgresPassword');" -ForegroundColor Cyan
    Write-Host "Ergebnis: $jwtSecret" -ForegroundColor Cyan
    
} catch {
    Write-Host "Fehler bei der JWT-Secret-Generierung: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}