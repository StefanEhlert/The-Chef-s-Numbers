# 🐳 Docker Image bauen und zu GitHub pushen

Diese Anleitung zeigt Dir, wie Du das Docker Image für The Chef's Numbers baust und zu GitHub Container Registry pushst.

---

## 🎯 Zwei Methoden:

### **Methode 1: Automatisch (Empfohlen) 🤖**
GitHub Actions baut das Image automatisch bei jedem Push!

### **Methode 2: Manuell 👨‍💻**
Du baust und pushst das Image selbst.

---

## 🤖 Methode 1: Automatisch (GitHub Actions)

### Schritt 1: GitHub Repository öffentlich machen

1. Gehe zu deinem GitHub Repository
2. Settings → General
3. Scrolle runter zu "Danger Zone"
4. "Change visibility" → "Make public"

### Schritt 2: Container Registry aktivieren

1. Settings → Packages
2. "Improved Container Support" aktivieren

### Schritt 3: Code pushen

```bash
git add .
git commit -m "Add Docker support"
git push origin main
```

### Schritt 4: Automatischer Build

GitHub Actions baut jetzt automatisch:
- ✅ Bei jedem Push auf main/master
- ✅ Bei jedem Tag (z.B. v2.3.0)
- ✅ Multi-Platform (AMD64 + ARM64)

**Fortschritt ansehen:**
- Gehe zu: Repository → Actions → "Build and Push Docker Image"

---

## 👨‍💻 Methode 2: Manuell

### Voraussetzungen

```bash
# Docker installiert?
docker --version

# GitHub CLI installiert? (optional)
gh --version
```

### Schritt 1: Bei GitHub Container Registry anmelden

```bash
# Mit Personal Access Token
echo "DEIN_GITHUB_TOKEN" | docker login ghcr.io -u StefanEhlert --password-stdin

# ODER mit GitHub CLI (einfacher!)
gh auth login
```

**Personal Access Token erstellen:**
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token (classic)"
4. Scopes: `write:packages`, `read:packages`, `delete:packages`
5. Token kopieren (wird nur einmal angezeigt!)

### Schritt 2: Docker Image bauen

```bash
# In deinem Projekt-Verzeichnis
cd the-chefs-numbers

# Image bauen (dauert ~2-5 Minuten beim ersten Mal)
docker build -t ghcr.io/StefanEhlert/the-chefs-numbers:latest .

# Multi-Platform Build (optional - für ARM und AMD)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/StefanEhlert/the-chefs-numbers:latest \
  --push \
  .
```

**Ersetze:**
- `StefanEhlert` mit deinem GitHub Benutzernamen

### Schritt 3: Image zu GitHub pushen

```bash
# Image hochladen
docker push ghcr.io/StefanEhlert/the-chefs-numbers:latest
```

### Schritt 4: Image öffentlich machen

1. Gehe zu: GitHub → Your profile → Packages
2. Klicke auf "chef-numbers" oder "the-chefs-numbers"
3. Package settings → "Change visibility"
4. "Make public"

---

## ✅ Prüfen ob es funktioniert

### Lokal testen:

```bash
# Image pullen
docker pull ghcr.io/StefanEhlert/the-chefs-numbers:latest

# Container starten
docker run -d -p 3000:80 ghcr.io/StefanEhlert/the-chefs-numbers:latest

# Im Browser öffnen
open http://localhost:3000
```

### Mit Docker Compose:

```bash
# docker-compose-frontend.yml verwenden
docker-compose -f docker-compose-frontend.yml up -d

# Logs ansehen
docker-compose -f docker-compose-frontend.yml logs -f
```

---

## 🔄 Image aktualisieren

### Automatisch (GitHub Actions):

```bash
# Code ändern und pushen
git add .
git commit -m "Update frontend"
git push origin main

# GitHub Actions baut automatisch neues Image
```

### Manuell:

```bash
# Neu bauen
docker build -t ghcr.io/StefanEhlert/the-chefs-numbers:latest .

# Pushen
docker push ghcr.io/StefanEhlert/the-chefs-numbers:latest

# Nutzer müssen dann nur neu starten:
docker-compose -f docker-compose-frontend.yml pull
docker-compose -f docker-compose-frontend.yml up -d
```

---

## 📊 Image-Größe optimieren

Unser Multi-Stage Build ist bereits optimiert:

```
Stage 1 (Builder): ~1.2 GB (Node.js + Dependencies)
                    ↓ (nur Build-Artefakte kopiert)
Stage 2 (Production): ~50 MB (Nginx + Static Files)
```

**Resultat:** Nur ~50 MB zum Herunterladen! ⚡

---

## 🏷️ Versions-Tags (optional)

Für verschiedene Versionen:

```bash
# Latest (automatisch)
docker tag ghcr.io/StefanEhlert/the-chefs-numbers:latest \
           ghcr.io/StefanEhlert/the-chefs-numbers:2.3.0

# Pushen
docker push ghcr.io/StefanEhlert/the-chefs-numbers:2.3.0
```

Nutzer können dann wählen:

```yaml
# Immer neueste Version
image: ghcr.io/username/the-chefs-numbers:latest

# Spezifische Version
image: ghcr.io/username/the-chefs-numbers:2.3.0
```

---

## 🆘 Troubleshooting

### "permission denied"

```bash
# Erneut anmelden
docker login ghcr.io -u StefanEhlert
```

### "manifest unknown"

Image wurde noch nicht gepusht oder ist nicht öffentlich:

1. Prüfe ob Push erfolgreich war
2. Prüfe ob Package public ist (GitHub → Packages)

### Build schlägt fehl

```bash
# Lokalen Build testen
docker build -t test .

# Logs prüfen
docker build --progress=plain -t test .
```

### Image zu groß

Das sollte nicht passieren (Multi-Stage Build):

```bash
# Image-Größe prüfen
docker images | grep chef-numbers
```

Sollte ~50 MB sein, nicht >500 MB!

---

## 📝 Checkliste

- [ ] Bei GitHub Container Registry angemeldet
- [ ] Image gebaut
- [ ] Image gepusht
- [ ] Package auf "public" gesetzt
- [ ] Image lokal getestet
- [ ] docker-compose-frontend.yml aktualisiert (mit richtigem Username)
- [ ] Dokumentation aktualisiert

---

## 🎉 Fertig!

Dein Image ist jetzt öffentlich verfügbar und jeder kann es mit einem Befehl starten:

```bash
docker run -d -p 3000:80 ghcr.io/StefanEhlert/the-chefs-numbers:latest
```

**Oder mit Docker Compose:**

```bash
docker-compose -f docker-compose-frontend.yml up -d
```

---

**Viel Erfolg! 🚀**

