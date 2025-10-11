# 🚀 Supabase Self-Hosting Setup für The Chef's Numbers

## 📋 Übersicht

Diese Anleitung zeigt, wie Sie **Supabase als Docker-Container** auf Ihrem Server einrichten, um eine **professionelle Datenbanklösung** für The Chef's Numbers zu erhalten.

## ✨ Vorteile von Supabase Self-Hosting

- ✅ **HTTP-APIs** statt direkte Datenbankverbindungen
- ✅ **Web-Dashboard** für Datenbankverwaltung
- ✅ **Real-time Updates** via WebSocket
- ✅ **Authentifizierung** eingebaut
- ✅ **File Storage** für Artikel-Bilder
- ✅ **Automatische Schema-Migrationen**
- ✅ **Professionelle Lösung** ohne Backend-Code

## 🛠️ Voraussetzungen

- **Docker** und **Docker Compose** installiert
- **Mindestens 2GB RAM** verfügbar
- **Ports 3000, 4000, 5000, 5432, 8000, 8080, 9999** frei

## 🚀 Installation

### 1. Docker-Compose-Datei herunterladen

```bash
# Erstelle Verzeichnis für Supabase
mkdir chef-numbers-supabase
cd chef-numbers-supabase

# Lade docker-compose-supabase.yml herunter
# (Die Datei wird von der App bereitgestellt)
```

### 2. Umgebungsvariablen konfigurieren

```bash
# Erstelle .env Datei
cat > .env << 'EOF'
# Supabase Konfiguration
POSTGRES_PASSWORD=chef_password_123
POSTGRES_USER=chef_user
POSTGRES_DB=chef_numbers

# JWT Secret (WICHTIG: Ändern Sie diesen Wert!)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# Supabase URLs
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZWYtbnVtYmVycyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8E
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZWYtbnVtYmVycyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8E
EOF
```

### 3. Supabase starten

```bash
# Starte alle Services
docker-compose -f docker-compose-supabase.yml up -d

# Prüfe Status
docker-compose -f docker-compose-supabase.yml ps
```

### 4. Services überprüfen

```bash
# Warte bis alle Services bereit sind
docker-compose -f docker-compose-supabase.yml logs -f

# Prüfe Datenbank-Verbindung
docker exec chef-numbers-db pg_isready -U chef_user -d chef_numbers
```

## 🌐 Zugriff auf Services

Nach dem Start sind folgende Services verfügbar:

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Dashboard** | http://localhost:8000 | Supabase Admin-Interface |
| **API** | http://localhost:3000 | PostgREST API |
| **Auth** | http://localhost:9999 | Authentifizierung |
| **Realtime** | http://localhost:4000 | WebSocket-Updates |
| **Storage** | http://localhost:5000 | Datei-Upload |
| **Database** | localhost:5432 | PostgreSQL direkt |

## ⚙️ Konfiguration in The Chef's Numbers

### Supabase-Konfiguration in der App:

1. **Speichermodus**: "Cloud" auswählen
2. **Cloud-Typ**: "Supabase" auswählen
3. **Supabase-Konfiguration**:
   - **URL**: `http://localhost:8000` (oder Ihre Server-IP)
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZWYtbnVtYmVycyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8E`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZWYtbnVtYmVycyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8E`
   - **Self-Hosted**: ✅ Aktiviert

## 🔧 Verwaltung

### Services verwalten:

```bash
# Services stoppen
docker-compose -f docker-compose-supabase.yml down

# Services neu starten
docker-compose -f docker-compose-supabase.yml restart

# Logs anzeigen
docker-compose -f docker-compose-supabase.yml logs -f [service-name]

# Datenbank-Backup
docker exec chef-numbers-db pg_dump -U chef_user chef_numbers > backup.sql

# Datenbank-Wiederherstellung
docker exec -i chef-numbers-db psql -U chef_user chef_numbers < backup.sql
```

### Datenbank verwalten:

```bash
# Direkter Datenbankzugriff
docker exec -it chef-numbers-db psql -U chef_user -d chef_numbers

# Tabellen anzeigen
\dt

# Schema anzeigen
\d articles

# Daten anzeigen
SELECT * FROM articles LIMIT 10;
```

## 🔄 Updates und Migrationen

### Schema-Updates über die App:

1. **App-Update** wird erkannt
2. **Automatische Migration** läuft
3. **Neue Spalten/Tabellen** werden erstellt
4. **Version** wird aktualisiert

### Manuelle Schema-Updates:

```sql
-- Über das Dashboard (http://localhost:8000)
-- SQL-Editor verwenden

-- Beispiel: Neue Spalte hinzufügen
ALTER TABLE articles ADD COLUMN new_field VARCHAR(100);

-- Schema-Version aktualisieren
SELECT update_schema_version('1.1.0');
```

## 🛡️ Sicherheit

### Wichtige Sicherheitshinweise:

1. **JWT Secret ändern**:
   ```bash
   # Generiere neuen JWT Secret
   openssl rand -base64 32
   
   # Aktualisiere .env Datei
   JWT_SECRET=ihr-neuer-super-geheimer-jwt-token
   ```

2. **Passwörter ändern**:
   ```bash
   # Ändere Datenbank-Passwort
   POSTGRES_PASSWORD=ihr-sicheres-passwort
   ```

3. **Firewall konfigurieren**:
   ```bash
   # Nur notwendige Ports öffnen
   ufw allow 8000  # Dashboard
   ufw allow 3000  # API (falls extern benötigt)
   ```

## 📊 Monitoring

### Service-Status überwachen:

```bash
# Alle Services prüfen
docker-compose -f docker-compose-supabase.yml ps

# Ressourcenverbrauch
docker stats

# Logs überwachen
docker-compose -f docker-compose-supabase.yml logs -f --tail=100
```

### Dashboard-Monitoring:

- **http://localhost:8000** → Dashboard öffnen
- **Database** → Tabellen und Daten anzeigen
- **API** → API-Dokumentation
- **Auth** → Benutzer verwalten
- **Storage** → Dateien verwalten

## 🆘 Troubleshooting

### Häufige Probleme:

1. **Services starten nicht**:
   ```bash
   # Prüfe Ports
   netstat -tulpn | grep :8000
   
   # Prüfe Docker-Logs
   docker-compose -f docker-compose-supabase.yml logs
   ```

2. **Datenbank-Verbindung fehlgeschlagen**:
   ```bash
   # Prüfe Datenbank-Status
   docker exec chef-numbers-db pg_isready -U chef_user
   
   # Prüfe Logs
   docker logs chef-numbers-db
   ```

3. **Dashboard nicht erreichbar**:
   ```bash
   # Prüfe Service-Status
   docker ps | grep dashboard
   
   # Service neu starten
   docker-compose -f docker-compose-supabase.yml restart dashboard
   ```

## 🎉 Fertig!

Nach erfolgreicher Installation haben Sie:

- ✅ **Professionelle Datenbanklösung** ohne Backend-Code
- ✅ **Web-Dashboard** für Datenbankverwaltung
- ✅ **HTTP-APIs** für Frontend-Integration
- ✅ **Real-time Updates** für Live-Daten
- ✅ **Automatische Schema-Migrationen**
- ✅ **File Storage** für Bilder

**The Chef's Numbers** kann jetzt über die **Supabase-Konfiguration** mit Ihrer selbst gehosteten Datenbank verbunden werden! 🚀
