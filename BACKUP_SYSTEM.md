# Backup & Restore System

## Übersicht

Das Chef's Numbers Backup-System ermöglicht vollständige Datensicherungen und Wiederherstellungen, unabhängig von der verwendeten Speicherlösung.

## Features

### ✅ Was wird gesichert?

1. **Entitäts-Daten** (aus dem aktuellen State)
   - Alle Lieferanten
   - Alle Artikel
   - Alle Rezepte

2. **LocalStorage-Einstellungen**
   - `artikelExportFilter` - Export-Filter-Einstellungen
   - `chef_design` - Design-Einstellungen
   - `storageManagement` - Speicherverwaltungs-Konfiguration
     - ⚠️ **WICHTIG:** `currentStorage` wird beim Restore NICHT überschrieben!

3. **Bilder**
   - Alle Artikelbilder (`pictures/articles/*`)
   - Alle Rezeptbilder (`pictures/recipes/*`)

## Backup-Dateiformat

```json
{
  "version": "1.0.0",
  "timestamp": "2025-10-10T12:00:00.000Z",
  "appVersion": "2.2.2",
  "entities": {
    "suppliers": [...],
    "articles": [...],
    "recipes": [...]
  },
  "localStorage": {
    "artikelExportFilter": "...",
    "chef_design": "...",
    "storageManagement": "..."
  },
  "images": {
    "pictures/articles/{id}": "data:image/jpeg;base64,...",
    "pictures/recipes/{id}": "data:image/jpeg;base64,..."
  }
}
```

## Verwendung

### Backup erstellen

1. Öffne **Speicherverwaltung**
2. Klicke auf **"Backup & Restore"** (linker Button im Aktionen-Bereich)
3. Wähle **"Backup erstellen"**
4. Klicke auf **"Backup jetzt erstellen"**
5. Fortschritt wird angezeigt:
   - Lieferanten sichern (1/6)
   - Artikel sichern (2/6)
   - Rezepte sichern (3/6)
   - LocalStorage sichern (4/6)
   - Bilder sichern (5/6)
   - Finalisierung (6/6)
6. Backup-Datei wird automatisch heruntergeladen:
   - Dateiname: `chef-numbers-backup-YYYY-MM-DD.json`

### Backup wiederherstellen

1. Öffne **Speicherverwaltung**
2. Klicke auf **"Backup & Restore"**
3. Wähle **"Backup wiederherstellen"**
4. Klicke auf **"Backup-Datei auswählen"**
5. Wähle eine `.json` Backup-Datei aus
6. Fortschritt wird angezeigt:
   - Lieferanten wiederherstellen (1/5)
   - Artikel wiederherstellen (2/5)
   - Rezepte wiederherstellen (3/5)
   - LocalStorage wiederherstellen (4/5)
   - Bilder wiederherstellen (5/5)
7. Daten werden in den aktuellen Storage UND den AppContext geladen

## Besonderheiten

### 🛡️ Schutz der Speicherkonfiguration

Beim Restore wird `storageManagement.currentStorage` **NICHT** überschrieben:

```typescript
// Behalte currentStorage aus aktuellem LocalStorage
const mergedStorageManagement = {
  ...backupStorageManagement,
  currentStorage: currentStorageManagement.currentStorage // NICHT überschreiben!
};
```

**Warum?**
- Verhindert unbeabsichtigte Änderungen der aktiven Speicherkonfiguration
- Ermöglicht Restore in JEDER Speicherumgebung (lokal, PostgreSQL, etc.)
- Benutzer behält die Kontrolle über die Speicherart

### 📷 Bild-Handling

- Bilder werden als **Base64** im Backup gespeichert
- Beim Restore werden sie automatisch zurück in File-Objekte konvertiert
- Funktioniert mit allen Storage-Adaptern (LocalStorage, MinIO, etc.)

### 🔄 Universalität

Das System ist vollständig **speicher-agnostisch**:
- Backup aus LocalStorage → Restore in PostgreSQL ✅
- Backup aus PostgreSQL → Restore in LocalStorage ✅
- Backup aus MinIO → Restore in MinIO ✅

## Erweiterbarkeit

### Neue Entitäten hinzufügen

```typescript
// In createBackup() und restoreBackup()
const entityTypes = ['suppliers', 'articles', 'recipes', 'customers']; // Neuen Typ hinzufügen
```

### Neue LocalStorage-Schlüssel

```typescript
const localStorageKeys = [
  'artikelExportFilter', 
  'chef_design', 
  'storageManagement',
  'neuerSchlüssel' // Neuen Schlüssel hinzufügen
];
```

## Technische Details

### Fortschritts-Tracking

```typescript
setBackupProgress({
  current: 3,      // Aktueller Schritt
  total: 6,        // Gesamt-Schritte
  item: 'Rezepte', // Aktuelles Element
  message: 'Sichere Rezepte...' // Status-Nachricht
});
```

### Fehlerbehandlung

- Fehler bei einzelnen Bildern stoppen nicht den gesamten Backup/Restore
- Detailliertes Logging in der Konsole
- Benutzerfreundliche Fehlermeldungen

## Migration von alter Backup-Funktion

Die alte Backup-Funktionalität wurde komplett ersetzt durch:
- Moderneres UI mit Progress-Modal
- Vollständige Bild-Unterstützung
- Schutz der Speicherkonfiguration
- Bessere Fehlerbehandlung

## Version History

- **v1.0.0** (2025-10-10): Initial Release
  - Vollständiges Backup/Restore-System
  - LocalStorage-Schlüssel-Schutz
  - Bild-Unterstützung
  - Progress-Modal UI

