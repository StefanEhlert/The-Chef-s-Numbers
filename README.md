# The Chef's Numbers

Professionelle Rezeptverwaltung mit Kalkulationsfunktionen für Küchenchefs.

## 🚀 Deployment auf Netlify

### Automatisches Deployment

1. **Repository mit GitHub verbinden:**
   - Gehen Sie zu [Netlify](https://netlify.com)
   - Klicken Sie auf "New site from Git"
   - Wählen Sie Ihr GitHub-Repository aus

2. **Build-Einstellungen:**
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
   - **Node version:** `18`

3. **Umgebungsvariablen (falls benötigt):**
   - Gehen Sie zu Site settings > Environment variables
   - Fügen Sie bei Bedarf Umgebungsvariablen hinzu

### Manuelles Deployment

1. **Lokaler Build:**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy über Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=build
   ```

## 🛠️ Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm start

# Production Build erstellen
npm run build
```

## 📁 Projektstruktur

```
src/
├── components/          # React-Komponenten
├── contexts/           # React Contexts
├── hooks/              # Custom Hooks
├── services/           # API-Services
├── types/              # TypeScript Typen
└── utils/              # Hilfsfunktionen
```

## 🎨 Features

- **Rezeptverwaltung:** Erstellen und verwalten Sie Rezepte
- **Kalkulation:** Automatische Kostenberechnung
- **Inventur:** Bestandsverwaltung
- **Einkauf:** Lieferantenverwaltung
- **Dashboard:** Übersicht über alle Bereiche

## 🔧 Technologien

- React 18
- TypeScript
- Bootstrap 5
- IndexedDB (lokale Datenspeicherung)
- React Router DOM

## 📱 Browser-Support

- Chrome (empfohlen)
- Firefox
- Safari
- Edge

## 🚨 Wichtige Hinweise

- Die App verwendet IndexedDB für lokale Datenspeicherung
- Alle Daten werden im Browser gespeichert
- Für Backup/Export-Funktionen siehe die entsprechenden Menüpunkte

## 📄 Lizenz

Dieses Projekt ist für den internen Gebrauch bestimmt. 