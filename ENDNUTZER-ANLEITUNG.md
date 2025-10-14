# 🎯 The Chef's Numbers - Endnutzer Selfhosting

## Für Nutzer die The Chef's Numbers selbst hosten möchten

---

## 📋 Was Du brauchst:

- ✅ Einen Computer/Server mit **Docker** installiert
- ✅ **5 Minuten** Zeit
- ❌ **KEIN** Git
- ❌ **KEIN** Code-Wissen
- ❌ **KEIN** Build-Prozess

---

## 🚀 Installation (3 Schritte)

### Schritt 1: Docker Compose Datei herunterladen

**Option A: Über die App** (Empfohlen)

1. Öffne The Chef's Numbers auf einer Demo-Instanz
2. Gehe zu **Speicherverwaltung**
3. Wähle **Cloud-Speicher → Selbst-gehostet (Docker)**
4. Klicke **"Frontend Docker Compose herunterladen"**

**Option B: Direkt herunterladen**

```bash
curl -O https://raw.githubusercontent.com/StefanEhlert/the-chefs-numbers/main/docker-compose-frontend.yml
```

### Schritt 2: Starten

```bash
docker-compose -f docker-compose-frontend.yml up -d
```

**Das war's!** Docker lädt das Image automatisch herunter (~50 MB) und startet die App.

⏱️ **Dauert:** ~30 Sekunden beim ersten Mal

### Schritt 3: Browser öffnen

```
http://localhost:3000
```

**Oder von einem anderen Gerät im Netzwerk:**

```
http://DEINE-SERVER-IP:3000
```

---

## 📦 Datenbank hinzufügen

1. In der App: **Speicherverwaltung** öffnen
2. **Cloud-Speicher → Selbst-gehostet (Docker)** wählen
3. Deine gewünschte Datenbank wählen (z.B. **CouchDB**)
4. **Docker Compose herunterladen**
5. Im Terminal:

```bash
docker-compose -f docker-compose-couchdb.yml up -d
```

6. Zurück in der App: **Verbindungstest durchführen** ✅

---

## 🔄 Alltägliche Befehle

### Status prüfen:

```bash
docker ps
```

Sollte zeigen: `chef-numbers-frontend` läuft

### Logs ansehen:

```bash
docker logs -f chef-numbers-frontend
```

### Stoppen:

```bash
docker-compose -f docker-compose-frontend.yml down
```

### Neu starten:

```bash
docker-compose -f docker-compose-frontend.yml restart
```

### Aktualisieren (neue Version):

```bash
# Neues Image holen
docker-compose -f docker-compose-frontend.yml pull

# Neu starten
docker-compose -f docker-compose-frontend.yml up -d
```

---

## 🌐 Von außen erreichbar machen

### Option 1: Reverse Proxy (Für Fortgeschrittene)

Nutze **nginx** oder **Traefik** mit SSL/HTTPS.

### Option 2: Einfacher Port-Forward (Nicht sicher für Internet!)

Port 3000 in deinem Router freigeben.

**⚠️ Achtung:** Nur für private Netzwerke empfohlen!

---

## 🐳 Mit Portainer (GUI statt Terminal)

Falls Du **Portainer** nutzt:

1. Portainer öffnen: `http://localhost:9000`
2. **Stacks** → **Add stack**
3. **Upload** → `docker-compose-frontend.yml` hochladen
4. **Deploy** klicken
5. Fertig! ✅

**Vorteile:**
- ✅ Grafische Oberfläche
- ✅ Keine Terminal-Befehle
- ✅ Logs direkt im Browser
- ✅ Container-Status auf einen Blick

---

## 📊 Ressourcen-Verbrauch

```
CPU: ~1-5% (im Idle)
RAM: ~50-100 MB
Disk: ~50 MB (Image)
```

Läuft problemlos auf:
- ✅ Raspberry Pi 4
- ✅ Alter Laptop
- ✅ Mini-PC
- ✅ NAS (QNAP, Synology mit Docker)
- ✅ VPS (1 GB RAM reicht!)

---

## 🆘 Probleme?

### Port 3000 bereits belegt

Ändere in der `docker-compose-frontend.yml`:

```yaml
ports:
  - "8080:80"  # Statt 3000:80
```

Dann: `http://localhost:8080`

### Container startet nicht

```bash
# Logs prüfen
docker logs chef-numbers-frontend

# Neustart erzwingen
docker rm -f chef-numbers-frontend
docker-compose -f docker-compose-frontend.yml up -d
```

### Image kann nicht geladen werden

```bash
# Manuell pullen
docker pull ghcr.io/StefanEhlert/the-chefs-numbers:latest

# Dann starten
docker-compose -f docker-compose-frontend.yml up -d
```

### Datenbank nicht erreichbar

1. Prüfe ob Container läuft:
   ```bash
   docker ps | grep couchdb
   ```

2. Prüfe die IP-Adresse in der App:
   - Bei Docker: `localhost` oder `127.0.0.1`
   - Bei Server: IP-Adresse des Servers

3. Prüfe den Port (sollte frei sein):
   ```bash
   sudo netstat -tlnp | grep 5984
   ```

---

## ✅ Fertig!

Du hast jetzt:
- ✅ The Chef's Numbers läuft auf deinem Server
- ✅ Volle Kontrolle über deine Daten
- ✅ Keine Abhängigkeit von Cloud-Diensten
- ✅ Kostenlos und Open Source

---

## 📚 Weiterführende Links

- [Vollständige Selfhosting-Anleitung](./SELFHOSTING.md)
- [Datenbank-Konfigurationen](./DEPLOYMENT.md)
- [GitHub Repository](https://github.com/StefanEhlert/the-chefs-numbers)

---

**Viel Spaß mit deiner eigenen Chef's Numbers Instanz! 🎉**

