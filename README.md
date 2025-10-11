# The Chef's Numbers

Professionelle Rezeptverwaltung mit Kalkulationsfunktionen für Küchenchefs.

## 🚀 Features

- **Rezeptverwaltung**: Vollständige CRUD-Operationen für Rezepte
- **Artikelverwaltung**: Verwaltung von Zutaten und Artikeln
- **Lieferantenverwaltung**: Verwaltung von Lieferanten und deren Daten
- **Kalkulation**: Automatische Kostenberechnung für Rezepte
- **Inventur**: Bestandsverwaltung und Inventurfunktionen
- **Einkauf**: Einkaufsplanung und -verwaltung
- **MinIO-Integration**: Objektspeicher für Bilder und Dateien
- **Multi-Tenant**: Unterstützung für mehrere Mandanten
- **Backup/Restore**: Automatische Datensicherung

## 🗄️ MinIO Objektspeicher

### MinIO-Server starten

```powershell
# MinIO mit Docker starten
.\start-minio.ps1
```

**Standard-Konfiguration:**
- **API Endpoint**: http://localhost:9000
- **Console**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin
- **Standard-Bucket**: chef-images

### MinIO in der Anwendung verwenden

1. **Speicherverwaltung öffnen**
2. **MinIO-Konfiguration eingeben:**
   - Host: localhost
   - Port: 9000
   - Access Key: minioadmin
   - Secret Key: minioadmin
   - Bucket: chef-images
3. **"Verbindung testen" klicken**

### MinIO-Features

- ✅ **Verbindungstest**: Vollständige MinIO-Verbindungsprüfung
- ✅ **Bucket-Management**: Erstellen, Löschen, Prüfen von Buckets
- ✅ **Datei-Upload**: Hochladen von Bildern und Dateien
- ✅ **Datei-Download**: Herunterladen von gespeicherten Dateien
- ✅ **Objekt-Liste**: Auflisten aller Objekte in einem Bucket
- ✅ **Presigned URLs**: Sichere Upload/Download-URLs
- ✅ **Objekt-Kopie**: Kopieren von Objekten zwischen Buckets
- ✅ **Backend-Integration**: Alle Operationen über sichere Backend-APIs

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