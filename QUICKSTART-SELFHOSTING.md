# 🚀 The Chef's Numbers - Selfhosting Quickstart

## ⚡ In 3 Minuten zur eigenen Instanz!

### Schritt 1: Repository klonen

```bash
git clone https://github.com/YOUR_USERNAME/the-chefs-numbers.git
cd the-chefs-numbers
```

### Schritt 2: Frontend starten

```bash
docker-compose -f docker-compose-frontend.yml up -d --build
```

⏱️ **Dauert beim ersten Mal ~2-5 Minuten**

### Schritt 3: Browser öffnen

```
http://localhost:3000
```

### Schritt 4: Datenbank wählen

1. Gehe zu **Speicherverwaltung**
2. Wähle **Cloud-Speicher → Selbst-gehostet (Docker)**
3. Wähle deine Datenbank (z.B. **CouchDB**)
4. Lade das Docker Compose herunter
5. Starte die Datenbank:

```bash
docker-compose -f docker-compose-couchdb.yml up -d
```

6. Verbindungstest durchführen ✅

---

## 🎉 Fertig!

Du hast jetzt:
- ✅ Frontend läuft auf Port 3000
- ✅ Datenbank deiner Wahl
- ✅ Volle Kontrolle über deine Daten

---

## 🔄 Befehle für den Alltag

```bash
# Status prüfen
docker ps

# Logs ansehen
docker logs -f chef-numbers-frontend

# Stoppen
docker-compose -f docker-compose-frontend.yml down

# Neu starten (ohne Build)
docker-compose -f docker-compose-frontend.yml up -d

# Update (mit Build)
git pull
docker-compose -f docker-compose-frontend.yml up -d --build
```

---

## 📚 Vollständige Anleitung

Siehe [SELFHOSTING.md](./SELFHOSTING.md) für:
- Detaillierte Erklärungen
- Troubleshooting
- HTTPS Setup
- Monitoring
- Sicherheit

---

**Los geht's! 🎯**

