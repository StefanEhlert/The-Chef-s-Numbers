# 🚀 Netlify Deployment Guide

## Voraussetzungen

- GitHub-Repository mit Ihrem Code
- Netlify-Account (kostenlos verfügbar)

## Schritt-für-Schritt Anleitung

### 1. Repository vorbereiten

Stellen Sie sicher, dass Ihr Repository folgende Dateien enthält:

- ✅ `package.json` mit korrekten Scripts
- ✅ `netlify.toml` (Konfigurationsdatei)
- ✅ `public/_redirects` (für Client-Side Routing)
- ✅ `public/_headers` (für Sicherheitsheader)

### 2. Netlify-Site erstellen

#### Option A: Über Netlify Dashboard

1. **Gehen Sie zu [netlify.com](https://netlify.com)**
2. **Klicken Sie auf "New site from Git"**
3. **Wählen Sie Ihr Git-Provider (GitHub, GitLab, Bitbucket)**
4. **Wählen Sie Ihr Repository aus**
5. **Konfigurieren Sie die Build-Einstellungen:**

```
Build command: npm run build
Publish directory: build
Node version: 18
```

6. **Klicken Sie auf "Deploy site"**

#### Option B: Über Netlify CLI

```bash
# Netlify CLI installieren
npm install -g netlify-cli

# Bei Netlify anmelden
netlify login

# Site erstellen
netlify sites:create --name "chefs-numbers"

# Repository verbinden
netlify link

# Deploy
netlify deploy --prod --dir=build
```

### 3. Umgebungsvariablen konfigurieren

Falls Ihre App Umgebungsvariablen benötigt:

1. **Gehen Sie zu Site settings > Environment variables**
2. **Fügen Sie die benötigten Variablen hinzu:**

```
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENVIRONMENT=production
```

### 4. Domain konfigurieren

#### Automatische Domain
- Netlify generiert automatisch eine `.netlify.app` Domain
- Diese können Sie in den Site settings anpassen

#### Custom Domain
1. **Gehen Sie zu Site settings > Domain management**
2. **Klicken Sie auf "Add custom domain"**
3. **Folgen Sie den DNS-Anweisungen**

### 5. Automatische Deployments

Netlify erstellt automatisch Deployments bei:
- **Push zu main/master Branch**
- **Pull Requests** (Preview Deployments)
- **Manuelle Deployments**

## Build-Optimierungen

### 1. Build-Zeit reduzieren

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--no-optional"
```

### 2. Caching optimieren

```toml
# netlify.toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Troubleshooting

### Häufige Probleme

#### 1. Build-Fehler
```bash
# Lokal testen
npm run build
```

#### 2. Routing-Probleme
Stellen Sie sicher, dass `public/_redirects` existiert:
```
/*    /index.html   200
```

#### 3. Node-Version
Fügen Sie in `package.json` hinzu:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Debugging

1. **Build-Logs prüfen:** Site settings > Build & deploy > Deploys
2. **Lokaler Test:** `npm run build && serve -s build`
3. **Netlify CLI:** `netlify status`

## Performance-Tipps

### 1. Bundle-Größe optimieren
- Verwenden Sie `react-scripts build --analyze`
- Entfernen Sie ungenutzte Dependencies

### 2. Bilder optimieren
- Verwenden Sie moderne Formate (WebP, AVIF)
- Implementieren Sie lazy loading

### 3. Caching-Strategien
- Statische Assets mit langen Cache-Zeiten
- API-Responses mit angemessenen Cache-Headers

## Monitoring

### 1. Netlify Analytics
- Gehen Sie zu Site settings > Analytics
- Aktivieren Sie Netlify Analytics

### 2. Error Tracking
- Implementieren Sie Error Boundaries
- Verwenden Sie Services wie Sentry

### 3. Performance Monitoring
- Lighthouse CI integrieren
- Core Web Vitals überwachen

## Sicherheit

### 1. Security Headers
```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

### 2. HTTPS erzwingen
- Netlify aktiviert automatisch HTTPS
- Redirect HTTP zu HTTPS konfigurieren

## Support

Bei Problemen:
1. **Netlify Docs:** [docs.netlify.com](https://docs.netlify.com)
2. **Community:** [community.netlify.com](https://community.netlify.com)
3. **Support:** Über das Netlify Dashboard 