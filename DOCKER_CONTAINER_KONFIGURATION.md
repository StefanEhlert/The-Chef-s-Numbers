# Docker Container Konfiguration - The Chef's Numbers

## Übersicht

Diese Anleitung erklärt, wie Sie zwischen PostgreSQL und MariaDB als Datenbank wählen können und MinIO für die Bildverwaltung konfigurieren.

## 🗄️ Datenbank-Auswahl

### Option 1: PostgreSQL (Standard)
- **Empfohlen für**: Produktionsumgebungen, komplexe Abfragen
- **Vorteile**: ACID-konform, erweiterte SQL-Features, JSON-Support
- **Port**: 5432

### Option 2: MariaDB
- **Empfohlen für**: Einfache Anwendungen, MySQL-Kompatibilität
- **Vorteile**: Leichtgewichtig, MySQL-kompatibel, gute Performance
- **Port**: 3306

## 🖼️ MinIO Bildverwaltung

MinIO wird für die Speicherung und Verwaltung von Bildern verwendet:
- **API-Port**: 9000
- **Web-Console**: 9001
- **Bucket**: chef-images (standardmäßig)

## 🚀 Schnellstart

### 1. Umgebungsvariablen konfigurieren

Kopieren Sie `env.example` zu `.env` und passen Sie die Werte an:

```bash
cp env.example .env
```

### 2. Datenbank auswählen

Bearbeiten Sie die `.env` Datei und setzen Sie:

```bash
# Für PostgreSQL
DB_TYPE=postgres

# ODER für MariaDB
DB_TYPE=mariadb
```

### 3. Container starten

#### PostgreSQL + MinIO + Backend:
```bash
docker-compose --profile postgres --profile minio up -d
```

#### MariaDB + MinIO + Backend:
```bash
docker-compose --profile mariadb --profile minio up -d
```

## ⚙️ Detaillierte Konfiguration

### PostgreSQL Konfiguration

```bash
# .env Einstellungen
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=chef_numbers
POSTGRES_USER=chef
POSTGRES_PASSWORD=password
```

### MariaDB Konfiguration

```bash
# .env Einstellungen
MYSQL_HOST=mariadb
MYSQL_PORT=3306
MYSQL_DATABASE=chef_numbers
MYSQL_USER=chef
MYSQL_PASSWORD=password
MYSQL_ROOT_PASSWORD=rootpassword
```

### MinIO Konfiguration

```bash
# .env Einstellungen
MINIO_ROOT_USER=chef_access_key
MINIO_ROOT_PASSWORD=chef_secret_key
MINIO_BUCKET=chef-images
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
```

## 🔧 Portainer.io Integration

### 1. Stack erstellen
- Öffnen Sie Portainer.io
- Gehen Sie zu "Stacks" → "Add stack"
- Wählen Sie "Upload" und laden Sie `docker-compose.yml` hoch

### 2. Umgebungsvariablen setzen
- Fügen Sie alle Variablen aus der `.env` Datei hinzu
- Setzen Sie `DB_TYPE` auf den gewünschten Wert

### 3. Stack starten
- Verwenden Sie die entsprechenden Profile:
  - `postgres,minio` für PostgreSQL
  - `mariadb,minio` für MariaDB

## 📊 Container-Status überprüfen

```bash
# Alle laufenden Container anzeigen
docker-compose ps

# Logs eines spezifischen Services anzeigen
docker-compose logs postgres
docker-compose logs mariadb
docker-compose logs minio
docker-compose logs backend

# Container-Status in Portainer.io
# Gehen Sie zu "Containers" und überprüfen Sie den Status
```

## 🔄 Datenbank wechseln

### Von PostgreSQL zu MariaDB:

1. **Daten exportieren** (falls vorhanden):
```bash
docker-compose exec postgres pg_dump -U chef chef_numbers > backup.sql
```

2. **Container stoppen**:
```bash
docker-compose down
```

3. **Umgebungsvariablen ändern**:
```bash
# .env bearbeiten
DB_TYPE=mariadb
```

4. **Neue Container starten**:
```bash
docker-compose --profile mariadb --profile minio up -d
```

### Von MariaDB zu PostgreSQL:

1. **Daten exportieren** (falls vorhanden):
```bash
docker-compose exec mariadb mysqldump -u chef -p chef_numbers > backup.sql
```

2. **Container stoppen**:
```bash
docker-compose down
```

3. **Umgebungsvariablen ändern**:
```bash
# .env bearbeiten
DB_TYPE=postgres
```

4. **Neue Container starten**:
```bash
docker-compose --profile postgres --profile minio up -d
```

## 🗂️ Verzeichnisstruktur

```
The Chef's Numbers/
├── docker-compose.yml          # Hauptkonfiguration
├── env.example                 # Umgebungsvariablen-Vorlage
├── .env                       # Ihre lokalen Einstellungen
├── database/
│   └── init/                  # Datenbank-Initialisierungsskripte
├── minio/
│   └── config/                # MinIO-Konfiguration
└── backend/                   # Backend-Service
```

## 🚨 Wichtige Hinweise

1. **Nur eine Datenbank gleichzeitig**: Starten Sie niemals PostgreSQL und MariaDB gleichzeitig
2. **Daten-Persistenz**: Alle Daten werden in Docker-Volumes gespeichert
3. **Ports**: Stellen Sie sicher, dass die gewählten Ports nicht von anderen Services belegt sind
4. **Backup**: Erstellen Sie regelmäßig Backups Ihrer Datenbank

## 🆘 Fehlerbehebung

### Container startet nicht:
```bash
# Logs überprüfen
docker-compose logs [service-name]

# Container neu starten
docker-compose restart [service-name]
```

### Datenbankverbindung fehlschlägt:
- Überprüfen Sie die Umgebungsvariablen in der `.env` Datei
- Stellen Sie sicher, dass der richtige `DB_TYPE` gesetzt ist
- Überprüfen Sie, ob die entsprechenden Profile aktiviert sind

### MinIO-Zugriff funktioniert nicht:
- Überprüfen Sie die MinIO-Credentials in der `.env` Datei
- Stellen Sie sicher, dass Port 9000 und 9001 verfügbar sind
- Überprüfen Sie die MinIO-Logs: `docker-compose logs minio`
