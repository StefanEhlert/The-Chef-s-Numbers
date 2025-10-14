# 🐳 The Chef's Numbers - Selfhosting Anleitung

Willkommen zur Selfhosting-Anleitung für The Chef's Numbers! Diese Anleitung hilft Ihnen, Ihre eigene Instanz der App auf Ihrem Server bereitzustellen.

## 📋 Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass auf Ihrem Server folgendes installiert ist:

- ✅ **Docker** (Version 20.10 oder höher)
- ✅ **Docker Compose** (Version 2.0 oder höher)
- ✅ **Git** (um das Repository zu klonen)

### Installation prüfen:

```bash
docker --version
docker-compose --version
git --version
```

---

## 🚀 Schnellstart

### 1. Repository klonen

```bash
git clone https://github.com/YOUR_USERNAME/the-chefs-numbers.git
cd the-chefs-numbers
```

### 2. Frontend-Container starten

```bash
# Erstmaliger Build und Start (dauert ~2-5 Minuten)
docker-compose -f docker-compose-frontend.yml up -d --build

# Logs ansehen
docker-compose -f docker-compose-frontend.yml logs -f
```

### 3. App öffnen

Öffnen Sie Ihren Browser und navigieren Sie zu:

```
http://localhost:3000
```

oder wenn auf einem Server:

```
http://IHRE-SERVER-IP:3000
```

### 4. Datenbank einrichten

1. Gehen Sie in der App zu **Speicherverwaltung**
2. Wählen Sie **Cloud-Speicher → Selbst-gehostet (Docker)**
3. Wählen Sie Ihre gewünschte Datenbank:
   - PostgreSQL
   - MariaDB
   - MySQL
   - CouchDB
4. Laden Sie das entsprechende Docker Compose herunter
5. Starten Sie die Datenbank:

```bash
# Beispiel für CouchDB
docker-compose -f docker-compose-couchdb.yml up -d
```

6. Führen Sie den Verbindungstest in der App durch ✅

---

## 📦 Verfügbare Komponenten

### Frontend (Pflicht)

```bash
docker-compose -f docker-compose-frontend.yml up -d --build
```

**Enthält:**
- React App
- Nginx Webserver
- Port: 3000

### Datenbanken (Optional - wählen Sie eine)

#### PostgreSQL

```bash
docker-compose -f docker-compose-postgres.yml up -d
```

**Enthält:**
- PostgreSQL Datenbank (Port: 5432)
- PostgREST API (Port: 3000)

#### MariaDB

```bash
docker-compose -f docker-compose-mariadb.yml up -d
```

**Enthält:**
- MariaDB Datenbank (Port: 3306)
- Prisma API (Port: 3001)

#### MySQL

```bash
docker-compose -f docker-compose-mysql.yml up -d
```

**Enthält:**
- MySQL Datenbank (Port: 3306)
- Prisma API (Port: 3001)

#### CouchDB

```bash
docker-compose -f docker-compose-couchdb.yml up -d
```

**Enthält:**
- CouchDB NoSQL Datenbank (Port: 5984)
- Automatische Initialisierung

### Bildspeicher (Optional)

#### MinIO

```bash
docker-compose -f docker-compose-minio.yml up -d
```

**Enthält:**
- MinIO Object Storage (Port: 9000)
- MinIO Console (Port: 9001)

---

## 🔧 Verwaltung

### Container-Status prüfen

```bash
# Alle laufenden Container anzeigen
docker ps

# Logs eines bestimmten Containers
docker logs chef-numbers-frontend

# Logs live verfolgen
docker logs -f chef-numbers-frontend
```

### Container stoppen

```bash
# Frontend stoppen
docker-compose -f docker-compose-frontend.yml down

# Datenbank stoppen (Beispiel CouchDB)
docker-compose -f docker-compose-couchdb.yml down

# Alle stoppen
docker stop $(docker ps -q --filter "name=chef-numbers")
```

### Container neu starten

```bash
# Ohne Rebuild (schnell - ~5 Sekunden)
docker-compose -f docker-compose-frontend.yml restart

# Mit Rebuild (nach Code-Änderungen)
docker-compose -f docker-compose-frontend.yml up -d --build
```

### Container und Daten löschen

```bash
# Container stoppen und entfernen
docker-compose -f docker-compose-frontend.yml down

# Container + Volumes (DATEN GEHEN VERLOREN!)
docker-compose -f docker-compose-couchdb.yml down -v
```

---

## 🌐 Zugriff von außen (Internet)

### Option 1: Reverse Proxy (Empfohlen)

Verwenden Sie einen Reverse Proxy wie **nginx** oder **Traefik**:

```nginx
# Nginx Beispiel
server {
    listen 80;
    server_name meine-app.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2: Port-Freigabe

Öffnen Sie Port 3000 in Ihrer Firewall:

```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

---

## 🔒 Sicherheit

### HTTPS aktivieren

Verwenden Sie **Let's Encrypt** mit **Certbot**:

```bash
# Certbot installieren
sudo apt-get install certbot python3-certbot-nginx

# Zertifikat erstellen
sudo certbot --nginx -d meine-app.example.com
```

### Sichere Passwörter

Ändern Sie die Standard-Passwörter in den Docker Compose Dateien:

```yaml
environment:
  POSTGRES_PASSWORD: IHR-SICHERES-PASSWORT-HIER
```

---

## 🔄 Updates

### Frontend aktualisieren

```bash
# Code aktualisieren
git pull origin main

# Container neu bauen und starten
docker-compose -f docker-compose-frontend.yml up -d --build
```

### Datenbank aktualisieren

```bash
# Neues Image pullen
docker-compose -f docker-compose-couchdb.yml pull

# Container neu starten
docker-compose -f docker-compose-couchdb.yml up -d
```

---

## 🆘 Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker logs chef-numbers-frontend

# Status prüfen
docker ps -a
```

### Port bereits belegt

Ändern Sie den Port in der `docker-compose-frontend.yml`:

```yaml
ports:
  - "8080:80"  # Statt 3000:80
```

### Verbindung zur Datenbank schlägt fehl

1. Prüfen Sie, ob der Container läuft:
   ```bash
   docker ps | grep couchdb
   ```

2. Prüfen Sie die IP-Adresse:
   ```bash
   # Bei Docker: localhost oder 127.0.0.1
   # Bei anderen Systemen: IP des Servers
   ip addr show
   ```

3. Prüfen Sie den Port:
   ```bash
   # Port-Freigabe prüfen
   sudo netstat -tlnp | grep 5984
   ```

---

## 📊 Monitoring

### Docker Stats

```bash
# Echtzeit-Ressourcenverbrauch
docker stats
```

### Health Checks

```bash
# Health-Status aller Container
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🎯 Empfohlenes Setup

Für den produktiven Einsatz empfehlen wir:

```
✅ Frontend + CouchDB + MinIO
oder
✅ Frontend + PostgreSQL + MinIO
```

**Warum?**
- CouchDB: Einfache Replikation, gut für verteilte Systeme
- PostgreSQL: Bewährt, stabil, gute Performance
- MinIO: S3-kompatibel, ideal für Bilder

---

## 📞 Support

Bei Problemen:

1. Prüfen Sie die Logs
2. Schauen Sie in die [GitHub Issues](https://github.com/YOUR_USERNAME/the-chefs-numbers/issues)
3. Erstellen Sie ein neues Issue mit:
   - Docker-Version
   - Betriebssystem
   - Logs (docker logs)
   - Fehlerme ldung

---

## 📜 Lizenz

The Chef's Numbers ist Open Source Software.

---

**Viel Erfolg mit Ihrem Selfhosting! 🚀**

