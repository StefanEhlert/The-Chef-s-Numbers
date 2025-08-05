# The Chef's Numbers

Eine moderne React-Anwendung für die Verwaltung von Artikeln, Lieferanten und Rezepten in der Gastronomie.

## 🚀 Features

- **Artikelverwaltung**: Vollständige CRUD-Operationen für Artikel mit Kategorisierung
- **Lieferantenverwaltung**: Verwaltung von Lieferanten mit Kontaktdaten
- **Rezeptverwaltung**: Erstellung und Verwaltung von Rezepten mit Zutaten
- **Import/Export**: CSV- und JSON-Import/Export-Funktionalität
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Theme-System**: Verschiedene Design-Templates (Modern, Dark, Warm, Professional)
- **Lokale Speicherung**: Automatische Speicherung im Browser

## 📁 Projektstruktur

```
src/
├── components/           # React-Komponenten
│   ├── ui/              # UI-Basis-Komponenten
│   ├── Artikelformular.tsx
│   ├── Artikelverwaltung.tsx
│   ├── Dashboard.tsx
│   ├── Einkauf.tsx
│   ├── Inventur.tsx
│   ├── Kalkulation.tsx
│   ├── Lieferantenformular.tsx
│   ├── Lieferantenverwaltung.tsx
│   ├── Rezeptformular.tsx
│   └── Rezeptverwaltung.tsx
├── constants/           # Konstanten und Konfiguration
│   ├── articleConstants.ts
│   └── designTemplates.ts
├── contexts/           # React Contexts
│   ├── AppContext.tsx
│   └── ColorContext.tsx
├── hooks/              # Custom React Hooks
│   ├── useArticleForm.ts
│   ├── useArticleHandlers.ts
│   ├── useDashboard.ts
│   ├── useEinkauf.ts
│   ├── useImportExport.ts
│   ├── useInventur.ts
│   ├── useKalkulation.ts
│   ├── useRecipeForm.ts
│   ├── useStorage.ts
│   └── useSupplierForm.ts
├── services/           # Services und API
│   └── storage.ts
├── types/              # TypeScript Typdefinitionen
│   ├── common.ts
│   ├── einkauf.ts
│   ├── index.ts
│   └── inventur.ts
├── utils/              # Hilfsfunktionen
│   ├── formatters.ts
│   ├── helpers.ts
│   └── recipeHelpers.ts
├── App.tsx             # Hauptkomponente
└── index.tsx           # App-Einstiegspunkt
```

## 🛠️ Technologien

- **React 18** mit TypeScript
- **Bootstrap 5** für das UI
- **React Icons** für Icons
- **Local Storage** für Datenpersistierung
- **Custom Hooks** für State Management

## 🎨 Design-System

Die Anwendung unterstützt verschiedene Design-Templates:

- **Modern & Minimal**: Clean Design mit viel Weißraum
- **Dark Theme**: Dunkles Design mit Akzentfarben
- **Warm & Gastronomisch**: Braun/Beige Töne, gemütlich
- **Professional Blue**: Business-Look mit Blau

## 📦 Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm start

# Build für Produktion
npm run build
```

## 🔧 Entwicklung

### Neue Komponenten hinzufügen

1. Erstelle die Komponente in `src/components/`
2. Füge TypeScript-Typen in `src/types/` hinzu
3. Erstelle Custom Hooks in `src/hooks/` falls nötig
4. Aktualisiere die README

### State Management

Die Anwendung verwendet eine modulare Struktur:
- **AppContext**: Zentraler State für die gesamte App
- **Custom Hooks**: Spezifische Logik für verschiedene Bereiche
- **Local Storage**: Persistierung der Daten

### Import/Export

Die Import/Export-Funktionalität unterstützt:
- **CSV-Dateien** mit automatischer Trennzeichen-Erkennung
- **JSON-Dateien** für strukturierte Daten
- **Automatische Zeichenkodierung-Erkennung** (UTF-8, Windows-1252, etc.)
- **Feldzuordnung** mit Drag & Drop
- **Vorschau** vor dem Import
- **Duplikatsprüfung** und -behandlung

## 📝 Changelog

### Version 2.0.0
- ✅ Modulare Struktur implementiert
- ✅ Design-Templates ausgelagert
- ✅ Import/Export-Funktionalität in separaten Hook
- ✅ Hilfsfunktionen in utils/ organisiert
- ✅ Konstanten in constants/ zentralisiert
- ✅ Lieferantenverwaltung als separate Komponente
- ✅ AppContext für zentrales State Management
- ✅ Custom Hooks für Event Handler

### Version 1.0.0
- ✅ Grundlegende CRUD-Operationen
- ✅ Responsive Design
- ✅ Lokale Speicherung

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen erstelle bitte ein Issue im Repository. 