# HTTPS für Entwicklungsserver aktivieren

## Problem
Die Web Crypto API (`crypto.subtle`) ist nur in sicheren Kontexten verfügbar:
- ✅ HTTPS
- ✅ localhost (HTTP)
- ❌ HTTP über Netzwerk-IP (z.B. `http://192.168.1.100:3000`)

## Lösung: HTTPS aktivieren

### Option 1: Umgebungsvariable (Empfohlen)

**Windows (PowerShell):**
```powershell
$env:HTTPS="true"
$env:SSL_CRT_FILE="localhost.crt"
$env:SSL_KEY_FILE="localhost.key"
npm start
```

**Windows (CMD):**
```cmd
set HTTPS=true
set SSL_CRT_FILE=localhost.crt
set SSL_KEY_FILE=localhost.key
npm start
```

**Linux/Mac:**
```bash
HTTPS=true SSL_CRT_FILE=localhost.crt SSL_KEY_FILE=localhost.key npm start
```

### Option 2: .env Datei erstellen

Erstellen Sie eine `.env` Datei im Projekt-Root:

```env
HTTPS=true
SSL_CRT_FILE=localhost.crt
SSL_KEY_FILE=localhost.key
```

Dann einfach:
```bash
npm start
```

### Option 3: Self-Signed Zertifikat erstellen

Wenn Sie noch kein Zertifikat haben, können Sie ein Self-Signed Zertifikat erstellen:

**Windows (mit Git Bash):**
```bash
# Option A: Script verwenden (interaktiv)
bash create-cert.sh

# Option B: Interaktiv (wenn OpenSSL verfügbar)
openssl req -x509 -newkey rsa:2048 -keyout localhost.key -out localhost.crt -days 365 -nodes
# Dann die Fragen beantworten (Enter für Defaults, wichtig: Common Name = localhost)
```

**Linux/Mac:**
```bash
openssl req -x509 -newkey rsa:2048 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/CN=localhost"
```

**Hinweis:** 
- Die Dateien `localhost.crt` und `localhost.key` müssen im Projekt-Root liegen
- Der Browser wird eine Warnung anzeigen (Self-Signed Zertifikat)
- Sie müssen die Warnung akzeptieren, um fortzufahren

### Option 4: Nur HTTPS ohne Zertifikat (Create React App generiert automatisch)

Create React App kann automatisch ein Self-Signed Zertifikat generieren:

**Windows (PowerShell):**
```powershell
$env:HTTPS="true"
npm start
```

**Windows (CMD):**
```cmd
set HTTPS=true
npm start
```

**Linux/Mac:**
```bash
HTTPS=true npm start
```

**Hinweis:** 
- Create React App generiert automatisch ein Self-Signed Zertifikat
- Der Browser wird eine Warnung anzeigen
- Sie müssen die Warnung akzeptieren, um fortzufahren

## Zugriff über Netzwerk

Nachdem HTTPS aktiviert ist, können Sie die App über das Netzwerk erreichen:

```
https://DEINE-IP:3000
```

**Wichtig:** 
- Verwenden Sie `https://` statt `http://`
- Der Browser wird eine Sicherheitswarnung anzeigen (Self-Signed Zertifikat)
- Klicken Sie auf "Erweitert" → "Trotzdem fortfahren" (oder ähnlich)

## Browser-Warnung umgehen

Bei Self-Signed Zertifikaten zeigt der Browser eine Warnung. Das ist normal und sicher für die Entwicklung.

**Chrome/Edge:**
1. Klicken Sie auf "Erweitert"
2. Klicken Sie auf "Trotzdem fortfahren" (oder "Advanced" → "Proceed to localhost")

**Firefox:**
1. Klicken Sie auf "Erweitert"
2. Klicken Sie auf "Trotzdem fortfahren" (oder "Advanced" → "Accept the Risk and Continue")

## Alternative: localhost verwenden

Wenn möglich, verwenden Sie `localhost` statt der Netzwerk-IP:

```
http://localhost:3000
```

Die Web Crypto API funktioniert auch ohne HTTPS auf `localhost`.
