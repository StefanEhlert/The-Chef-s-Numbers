# The Chef's Numbers

Eine professionelle Rezeptverwaltung mit Kalkulationsfunktionen für Küchenchefs.

## 🍳 Über das Projekt

"The Chef's Numbers" ist eine moderne Web-Applikation, die Küchenchefs dabei unterstützt, ihre Rezepte professionell zu verwalten und zu kalkulieren. Die App bietet umfassende Funktionen für die Verwaltung von Artikeln, Lieferanten und Rezepten mit integrierter Aufschlagkalkulation.

## ✨ Hauptfunktionen

### 📊 Kalkulation
- **Rezeptverwaltung**: Erstellen und verwalten Sie Rezepte mit detaillierter Kalkulation
- **Artikelverwaltung**: Umfassende Datenbank für Zutaten und Artikel
- **Lieferantenverwaltung**: Kontaktverwaltung mit mehreren Telefonnummern pro Lieferant

### 🧮 Kalkulationsfunktionen
- Automatische Aufschlagkalkulation (Standard: 300%)
- Dynamische Preisberechnung (Brutto/Netto)
- MwSt-Integration
- Nährwertberechnung
- Allergen- und Inhaltsstoffverwaltung

### 🔍 Such- und Filterfunktionen
- Volltextsuche in allen Bereichen
- Filter nach Kategorien und Lieferanten
- Sortierung nach verschiedenen Kriterien
- Listen- und Kachelansicht

### 📱 Responsive Design
- Optimiert für Desktop, Tablet und Mobile
- Moderne, intuitive Benutzeroberfläche
- Warmes Farbschema für Gastronomie-Thematik

## 🚀 Installation

### Voraussetzungen
- Node.js (Version 16 oder höher)
- npm oder yarn

### Installation
```bash
# Repository klonen
git clone [repository-url]
cd the-chefs-numbers

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm start
```

Die App ist dann unter `http://localhost:3000` verfügbar.

## 🏗️ Projektstruktur

```
src/
├── components/          # Wiederverwendbare Komponenten
│   └── Layout/         # Header, Sidebar, etc.
├── pages/              # Hauptseiten der App
├── services/           # Datenmanagement (IndexedDB)
├── types/              # TypeScript Definitionen
├── utils/              # Hilfsfunktionen
├── styles/             # CSS Styles
└── assets/             # Bilder und Grafiken
```

## 🛠️ Technologie-Stack

- **Frontend**: React 18 mit TypeScript
- **Styling**: Bootstrap 5 + Custom CSS
- **Datenbank**: IndexedDB (lokale Speicherung)
- **Routing**: React Router v6
- **Icons**: React Icons
- **Build-Tool**: Create React App

## 📋 Datenmodelle

### Artikel
- Name, Kategorie, Lieferant
- Gebindepreis (Brutto/Netto)
- Preis pro Einheit
- Nährwertangaben
- Allergene und Inhaltsstoffe

### Lieferant
- Kontaktdaten (Name, Adresse, E-Mail)
- Mehrere Telefonnummern (Typ: Mobil, Geschäft, Privat, etc.)
- Website und Notizen

### Rezept
- Name, Beschreibung, Portionen
- Zutatenliste mit Mengen
- Zubereitungsschritte
- Kalkulation (Wareneinsatz, Aufschlag, Verkaufspreis)
- Nährwertangaben und Allergene

## 🎨 Design-Features

- **Farbschema**: Warme, gastronomiefreundliche Farben
- **Responsive**: Optimiert für alle Bildschirmgrößen
- **Accessibility**: Barrierefreie Benutzeroberfläche
- **Performance**: Schnelle Ladezeiten und flüssige Animationen

## 🔧 Entwicklung

### Verfügbare Scripts

```bash
# Entwicklungsserver starten
npm start

# Produktionsbuild erstellen
npm run build

# Tests ausführen
npm test

# Code-Linting
npm run lint
```

### Datenexport/Import

Die App unterstützt den Export und Import aller Daten im JSON-Format für Backup-Zwecke und die spätere Integration mit einem Backend.

## 🚧 Geplante Features

### Einkauf
- Bestelllisten erstellen
- Lieferantenaufträge verwalten
- Preisvergleiche durchführen

### Inventur
- Lagerbestände verwalten
- Inventuren durchführen
- Bestandsberichte erstellen

### Backend-Integration
- Cloud-Synchronisation
- Multi-User-Support
- Erweiterte Berichtsfunktionen

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 📞 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository.

---

**The Chef's Numbers** - Professionelle Rezeptverwaltung für moderne Küchenchefs 🍽️ 