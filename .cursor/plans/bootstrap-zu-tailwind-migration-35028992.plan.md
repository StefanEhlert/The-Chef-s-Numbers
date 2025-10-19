<!-- 35028992-2594-4d6a-bf45-fbf01909d6d8 4f63fb6d-1a95-4506-82ee-3a8e0320c969 -->
# Migration von Bootstrap zu Tailwind CSS und daisyUI (Sicherer Ansatz)

## Warum dieser Ansatz?

Beim letzten Versuch entstanden **CSS-Klassenkonflikt-Probleme** zwischen Bootstrap und Tailwind:

- Beide Frameworks definieren Klassen wie `btn`, `container`, `card`, etc.
- Specificity-Konflikte machen Fehlersuche extrem schwierig
- Unvorhersehbares Styling-Verhalten

**Lösung:** Drei-Phasen-Migration

1. ✅ Bootstrap vollständig entfernen
2. ✅ App mit Inline-Styles/Custom CSS funktionsfähig halten
3. ✅ Tailwind und daisyUI sauber installieren (ohne Konflikte)

## Phase 0: Design-Snapshot erstellen (NEU!)

### 0.1 Warum ein Design-Snapshot?

**Problem:** Nach Bootstrap-Entfernung könnten wir vergessen, wie Komponenten aussahen.

**Lösung:** Detaillierte Dokumentation aller aktuellen Styles als Referenz für die spätere Tailwind-Migration.

### 0.2 Screenshots erstellen

Für jede Komponente/Ansicht Screenshots anfertigen:

- Dashboard (alle StatCards)
- Artikelverwaltung (Tabelle + Buttons)
- Artikelformular (alle Input-Felder, Dropdowns, Buttons)
- Rezeptverwaltung
- Rezeptformular
- Lieferantenverwaltung
- Lieferantenformular
- Sidebar (geöffnet + geschlossen)
- Modals (DuplicateArticle, DockerSetup, Calculator)
- Storage-Management
- Alle Design-Templates (Farbschemata)

**Speicherort:** `design-snapshot/screenshots/`

### 0.3 Computed Styles dokumentieren

**Datei:** `design-snapshot/component-styles.json` (NEU)

Für jede Komponente die tatsächlich gerendereten CSS-Properties extrahieren:

```json
{
  "button-primary": {
    "padding": "0.5rem 1rem",
    "borderRadius": "0.375rem",
    "fontSize": "0.875rem",
    "fontWeight": "500",
    "backgroundColor": "#3b82f6",
    "color": "#ffffff",
    "border": "none",
    "cursor": "pointer",
    "transition": "all 0.2s"
  },
  "input-field": {
    "padding": "0.5rem 0.75rem",
    "borderRadius": "0.375rem",
    "border": "1px solid #d1d5db",
    "fontSize": "0.875rem",
    "backgroundColor": "#ffffff"
  },
  "table-header": {
    "padding": "0.75rem",
    "fontWeight": "600",
    "borderBottom": "2px solid #e5e7eb"
  }
  // ... für alle Komponenten
}
```

### 0.4 Color-System dokumentieren

**Datei:** `design-snapshot/color-schemes.json` (NEU)

Alle Farben aus `designTemplates.ts` extrahieren und dokumentieren:

```json
{
  "modern": {
    "primary": "#3b82f6",
    "secondary": "#10b981",
    "accent": "#f59e0b",
    "background": "#f9fafb",
    "paper": "#ffffff",
    "card": "#ffffff",
    "text": "#1f2937",
    "textSecondary": "#6b7280",
    "cardBorder": "#e5e7eb",
    "hover": "#f3f4f6",
    "paperShadow": "0 4px 12px rgba(0,0,0,0.1)"
  },
  "classic": {
    // ... alle anderen Templates
  }
}
```

### 0.5 Spacing & Sizing dokumentieren

**Datei:** `design-snapshot/spacing-sizing.json` (NEU)

```json
{
  "spacing": {
    "page-padding": "1rem",
    "card-padding": "2rem",
    "input-padding": "0.5rem 0.75rem",
    "button-padding": "0.5rem 1rem",
    "sidebar-width-open": "224px",
    "sidebar-width-closed": "60px",
    "header-height": "56px"
  },
  "borderRadius": {
    "small": "0.375rem",
    "medium": "0.5rem",
    "large": "0.75rem",
    "card": "12px"
  },
  "fontSize": {
    "small": "0.75rem",
    "base": "0.875rem",
    "large": "1rem",
    "heading": "1.5rem"
  }
}
```

### 0.6 Component-spezifische Styles dokumentieren

**Datei:** `design-snapshot/component-specific.md` (NEU)

Detaillierte Beschreibung für jede Komponente:

```markdown
## Sidebar
- Width: 224px (open), 60px (closed)
- Transition: width 0.3s ease
- Background: colors.card
- Border: 1px solid colors.cardBorder
- Button hover: colors.accent + '20' (rgba)
- Accordion transition: max-height 0.5s ease-in-out

## StatCard (Dashboard)
- Background: colors.card
- Border: 1px solid colors.cardBorder
- Border-radius: 12px
- Box-shadow: colors.paperShadow
- Padding: 1.5rem
- Icon size: 2rem
- Number size: 2rem, font-weight: bold

## DataTable
- Border-collapse: collapse
- Header padding: 0.75rem
- Header border-bottom: 2px solid
- Cell padding: 0.75rem
- Row hover: rgba(0, 0, 0, 0.05)

## Modal
- Backdrop: rgba(0, 0, 0, 0.5)
- Modal width: max 800px
- Border-radius: 12px
- Box-shadow: 0 10px 40px rgba(0,0,0,0.2)
- Padding: 2rem

## Buttons
- Primary: colors.primary bg, white text
- Secondary: colors.secondary bg, white text
- Danger: #ef4444 bg, white text
- Border-radius: 0.375rem
- Padding: 0.5rem 1rem
- Font-weight: 500
- Transition: all 0.2s

## Inputs
- Border: 1px solid #d1d5db
- Border-radius: 0.375rem
- Padding: 0.5rem 0.75rem
- Focus: border-color changes to accent
- Background: #ffffff
```

### 0.7 CSS-zu-Tailwind Mapping vorbereiten

**Datei:** `design-snapshot/css-to-tailwind-mapping.json` (NEU)

```json
{
  "padding: 0.5rem 1rem": "px-4 py-2",
  "padding: 1rem": "p-4",
  "padding: 2rem": "p-8",
  "border-radius: 0.375rem": "rounded-md",
  "border-radius: 12px": "rounded-xl",
  "font-weight: 500": "font-medium",
  "font-weight: 600": "font-semibold",
  "font-weight: 700": "font-bold",
  "font-size: 0.875rem": "text-sm",
  "display: flex": "flex",
  "flex-direction: column": "flex-col",
  "align-items: center": "items-center",
  "justify-content: space-between": "justify-between",
  "transition: all 0.2s": "transition-all duration-200",
  "box-shadow: 0 4px 12px rgba(0,0,0,0.1)": "shadow-lg"
}
```

### 0.8 Automatisches Style-Extraction Script

**Datei:** `design-snapshot/extract-styles.ts` (NEU)

Ein Script, das durch alle Komponenten geht und Inline-Styles extrahiert:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { Project } from 'ts-morph';

// Script, das alle Inline-Styles aus TSX-Dateien extrahiert
// und in strukturierter Form speichert
```

**Ausführung:**

```bash
npx tsx design-snapshot/extract-styles.ts
```

### 0.9 Design-Snapshot Commit

```bash
git add design-snapshot/
git commit -m "docs: Design-Snapshot vor Bootstrap-Migration erstellt"
```

**Vorteil:** Vollständige Referenz für exakte Rekonstruktion in Tailwind!

## Phase 1: Bootstrap vollständig entfernen

### 1.1 Dependencies deinstallieren

```bash
npm uninstall bootstrap react-bootstrap bootstrap-icons
```

**Entfernte Pakete:**

- `bootstrap@5.3.7` - CSS Framework (~180KB)
- `react-bootstrap@2.9.2` - React-Komponenten
- `bootstrap-icons@1.13.1` - Icon Library (wird durch react-icons ersetzt)

### 1.2 Bootstrap CSS Import entfernen

**Datei:** `src/index.tsx`

```typescript
// ENTFERNEN:
import 'bootstrap/dist/css/bootstrap.min.css';
```

### 1.3 Analyse: Was muss ersetzt werden?

**19 betroffene Komponenten:**

- `AppContent.tsx`, `PageLayout.tsx`, `Sidebar.tsx`
- `DataTable.tsx`, `StatCard.tsx`, `LoadingSpinner.tsx`, `StatusBadge.tsx`
- `Artikelformular.tsx`, `Rezeptformular.tsx`, `Lieferantenformular.tsx`
- `Artikelverwaltung.tsx`, `Rezeptverwaltung.tsx`, `Lieferantenverwaltung.tsx`
- `Dashboard.tsx`, `DuplicateArticleModal.tsx`, `DockerSetupModal.tsx`
- `Calculator.tsx`, `NutritionSearch.tsx`, `StorageConfigForm.tsx`

**Verwendete Bootstrap-Klassen:**

- Layout: `container-fluid`, `row`, `col-*`, `d-flex`, `justify-content-*`, `align-items-*`
- Forms: `form-control`, `form-select`, `form-label`, `form-check`
- Buttons: `btn`, `btn-primary`, `btn-secondary`, `btn-success`, `btn-danger`
- Tables: `table`, `table-responsive`, `table-hover`
- Nav: `nav`, `nav-item`, `nav-link`, `sidebar-button`, `sidebar-sub-button`
- Cards: `card`, `card-body`, `card-header`
- Modals: `modal`, `modal-dialog`, `modal-content`
- Utils: `p-*`, `m-*`, `mb-*`, `text-center`

## Phase 2: Inline-Styles und Custom CSS implementieren

### Strategie: Minimale CSS-Datei + Inline-Styles

Ihre App nutzt bereits stark **Inline-Styles** (siehe Sidebar.tsx, AppContent.tsx) - das ist perfekt! Wir erweitern dies.

### 2.1 Custom CSS erstellen

**Datei:** `src/styles/app.css` (NEU)

```css
/* Reset und Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility Classes (minimal) */
.flex { display: flex; }
.flex-column { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.text-center { text-align: center; }
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }

/* Spacing (minimal set) */
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-3 { margin-top: 0.75rem; }

/* Container */
.container-fluid {
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Table Base (kein Bootstrap) */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

table.table {
  width: 100%;
  border-collapse: collapse;
}

table.table thead th {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 2px solid;
  font-weight: 600;
}

table.table tbody td {
  padding: 0.75rem;
  border-bottom: 1px solid;
}

table.table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Nav Base */
.nav {
  display: flex;
  flex-direction: column;
  list-style: none;
}

.nav-item {
  display: block;
}

/* Buttons - mit Inline-Styles ergänzen */
button, .btn {
  cursor: pointer;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Input Base */
input, select, textarea {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid;
  font-size: 0.875rem;
  width: 100%;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: currentColor;
}

/* Sidebar Specific */
.sidebar-button, .sidebar-sub-button {
  text-align: left;
  transition: background-color 0.2s;
}

.sidebar-button:hover, .sidebar-sub-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.accordion-content {
  overflow: hidden;
  transition: max-height 0.5s ease-in-out, opacity 0.4s ease-in-out;
}
```

### 2.2 CSS Import aktualisieren

**Datei:** `src/index.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/app.css'; // NEU - ersetzt Bootstrap
import App from './App';
```

### 2.3 Komponenten anpassen (Inline-Styles erweitern)

**Priorität:** Kritische Komponenten zuerst

#### Gruppe A: Layout-Komponenten

- `PageLayout.tsx` - Container bleibt mit Inline-Styles
- `Sidebar.tsx` - Bereits 95% Inline-Styles ✅
- `AppContent.tsx` - `container-fluid` bleibt in custom CSS

#### Gruppe B: Formulare

Buttons mit Farben als Inline-Styles definieren:

```typescript
// Beispiel: Button mit Dynamic Colors
<button
  style={{
    backgroundColor: colors.primary,
    color: colors.textOnPrimary,
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    // ... weitere Styles
  }}
>
  Speichern
</button>
```

#### Gruppe C: Tabellen

`DataTable.tsx` - Minimales Custom CSS + Inline-Styles für Farben

#### Gruppe D: Modals

Eigene Modal-Styles mit Inline-Styles + CSS

### 2.4 Color-System beibehalten

**Wichtig:** Ihr bestehendes Color-System (`ColorContext.tsx` + `designTemplates.ts`) bleibt erhalten!

```typescript
// Beispiel: Dynamic Theming
const colors = getCurrentColors();

<div style={{
  backgroundColor: colors.background,
  color: colors.text,
  borderColor: colors.cardBorder
}}>
  {/* Content */}
</div>
```

## Phase 3: Funktionalität sicherstellen

### 3.1 Test-Checkliste

**Visuelle Tests:**

- [ ] Dashboard lädt und zeigt Statistiken
- [ ] Sidebar öffnet/schließt korrekt
- [ ] Navigation zwischen Seiten funktioniert
- [ ] Design-Template-Wechsel funktioniert
- [ ] Mobile Ansicht (Sidebar-Collapse)

**Funktionale Tests:**

- [ ] Artikelformular öffnen/schließen
- [ ] Artikel erstellen
- [ ] Artikel bearbeiten
- [ ] Artikel löschen
- [ ] Rezeptformular öffnen/schließen
- [ ] Rezept erstellen mit Zutaten
- [ ] Lieferanten verwalten
- [ ] Import/Export (CSV)
- [ ] Storage-Management
- [ ] Kalkulationen

**Input-Tests:**

- [ ] Text-Inputs funktionieren
- [ ] Dropdowns (Selects) funktionieren
- [ ] Checkboxen funktionieren
- [ ] Datei-Uploads (Bilder)
- [ ] EAN-Code Scanner
- [ ] Nutrition Search API

### 3.2 Commit-Point

```bash
git add .
git commit -m "refactor: Bootstrap vollständig entfernt, Custom CSS implementiert"
```

**Warum jetzt committen?**

- Sauberer Checkpoint vor Tailwind-Installation
- Bei Problemen einfach zurückrollen
- Klare Trennung der Migrations-Phasen

## Phase 4: Tailwind CSS und daisyUI installieren

### 4.1 Installation (OHNE Konflikte!)

```bash
npm install -D tailwindcss postcss autoprefixer daisyui
npx tailwindcss init -p
```

### 4.2 Tailwind konfigurieren

**Datei:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Integration mit designTemplates.ts
        // Diese werden später dynamisch gesetzt
      }
    }
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "corporate",
      "retro",
      {
        custom: {
          "primary": "#3b82f6",
          "secondary": "#10b981",
          "accent": "#f59e0b",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        }
      }
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  }
}
```

### 4.3 PostCSS konfigurieren

**Datei:** `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

### 4.4 CSS aktualisieren

**Datei:** `src/styles/app.css`

```css
/* Tailwind Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Styles bleiben unterhalb */
/* ... bestehende Custom CSS ... */
```

### 4.5 Erste Tailwind-Klassen testen

```typescript
// Beispiel: Einfacher Test in Dashboard
<div className="p-4 bg-blue-500 text-white rounded-lg">
  Tailwind funktioniert! 🎉
</div>
```

**Test:**

```bash
npm start
```

Wenn die blaue Box erscheint → Tailwind läuft ohne Konflikte! ✅

## Phase 5: Schrittweise zu Tailwind/daisyUI migrieren

### 5.1 Migration-Mapping

#### Container & Layout

```typescript
// Vorher (Custom CSS):
<div className="container-fluid p-4">

// Nachher (Tailwind):
<div className="max-w-full px-4 py-4">
```

#### Flexbox

```typescript
// Vorher:
<div className="flex justify-between items-center">

// Nachher: (gleich!)
<div className="flex justify-between items-center">
```

#### Buttons

```typescript
// Vorher (Inline):
<button style={{ backgroundColor: colors.primary, ... }}>

// Nachher (daisyUI + Inline):
<button className="btn btn-primary" style={{ backgroundColor: colors.primary }}>
```

#### Forms

```typescript
// Vorher (Custom):
<input style={{ ... }} />

// Nachher (daisyUI):
<input className="input input-bordered w-full" style={{ borderColor: colors.border }} />
```

#### Tables

```typescript
// Vorher (Custom):
<table className="table">

// Nachher (daisyUI):
<table className="table table-zebra">
```

#### Modals

```typescript
// Vorher (Custom):
<div className="modal" style={{ display: show ? 'block' : 'none' }}>

// Nachher (daisyUI):
<dialog className="modal" open={show}>
  <div className="modal-box">
    <h3 className="font-bold text-lg">Titel</h3>
    <p className="py-4">Inhalt</p>
    <div className="modal-action">
      <button className="btn">Schließen</button>
    </div>
  </div>
</dialog>
```

### 5.2 Migrations-Reihenfolge

**Empfohlene Reihenfolge (von einfach zu komplex):**

1. **Utility-Klassen** (p-4, mb-2, flex, etc.) - Schnell überall ersetzen
2. **PageLayout.tsx** - Einfache Komponente, guter Test
3. **DataTable.tsx** - daisyUI Table testen
4. **StatCard.tsx** - daisyUI Card testen
5. **LoadingSpinner.tsx** - Einfach
6. **StatusBadge.tsx** - daisyUI Badge testen
7. **Dashboard.tsx** - Kombiniert Cards + Layout
8. **Sidebar.tsx** - Bereits Inline-Styles, minimal ändern
9. **Formulare** - Input/Select mit daisyUI
10. **Modals** - daisyUI Dialog-Element
11. **Verwaltungskomponenten** - Kombination alles

### 5.3 Color-System Integration

**Hybrid-Ansatz:** daisyUI + Dynamic Colors

```typescript
// Komponente
const colors = getCurrentColors();

// Tailwind für Layout, Dynamic Colors für Theme
<div 
  className="card shadow-xl p-6" 
  style={{
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    color: colors.text
  }}
>
  <button 
    className="btn btn-primary"
    style={{ backgroundColor: colors.primary }}
  >
    Primary Action
  </button>
</div>
```

### 5.4 Testing nach jeder Komponente

Nach jeder migrierten Komponente:

1. `npm start` - App startet ohne Fehler?
2. Visuelle Prüfung - Sieht korrekt aus?
3. Funktionstest - Funktioniert wie vorher?
4. Mobile-Test - Responsive OK?
5. ✅ Commit!

## Vorteile dieses Ansatzes

✅ **Keine CSS-Konflikte** - Bootstrap ist weg, bevor Tailwind kommt

✅ **Sicherer** - App bleibt jederzeit funktionsfähig

✅ **Testbar** - Jede Phase kann isoliert getestet werden

✅ **Rollback-fähig** - Klare Commit-Points zum Zurückrollen

✅ **Schrittweise** - Komponente für Komponente migrieren

✅ **Flexibel** - Hybrid-Ansatz (Tailwind + Custom Inline-Styles)

✅ **Performance** - Am Ende nur benötigte Tailwind-Klassen im Bundle

## Zeitabschätzung (überarbeitet)

- **Phase 1 (Bootstrap entfernen)**: 30 Minuten
- **Phase 2 (Custom CSS + Inline-Styles)**: 2-3 Stunden
  - CSS-Datei erstellen: 30 Min
  - Komponenten anpassen: 2 Stunden
- **Phase 3 (Funktionstest)**: 1 Stunde
- **Phase 4 (Tailwind installieren)**: 30 Minuten
- **Phase 5 (Schrittweise Migration)**: 3-4 Stunden
  - Utility-Klassen: 30 Min
  - UI-Komponenten: 1 Stunde
  - Formulare: 1 Stunde
  - Modals: 1 Stunde
  - Verwaltung: 30 Min
- **Testing & Polish**: 1 Stunde

**Gesamt: ~8-10 Stunden** (aufgeteilt auf mehrere Sessions)

## Risiko-Minimierung

### Problem beim letzten Mal

- Bootstrap + Tailwind gleichzeitig = Klassenkonflikt-Chaos
- Specificity-Probleme unmöglich zu debuggen
- Unvorhersehbares Verhalten

### Lösung jetzt

- ✅ Bootstrap **komplett weg** vor Tailwind-Installation
- ✅ Custom CSS als Brücke
- ✅ Saubere Trennung der Phasen
- ✅ Jede Phase einzeln testbar
- ✅ Rollback-Points bei Problemen

### To-dos

- [ ] Tailwind CSS, PostCSS, Autoprefixer und daisyUI installieren
- [ ] tailwind.config.js erstellen mit Content-Pfaden, daisyUI Plugin, und Custom Colors
- [ ] postcss.config.js erstellen mit Tailwind und Autoprefixer
- [ ] Bootstrap CSS in src/index.tsx durch Tailwind Directives ersetzen
- [ ] Bootstrap und react-bootstrap Dependencies deinstallieren
- [ ] Layout-Komponenten migrieren: AppContent, PageLayout, Sidebar
- [ ] UI-Komponenten migrieren: DataTable, StatCard, LoadingSpinner, StatusBadge
- [ ] Formular-Komponenten migrieren: Artikelformular, Rezeptformular, Lieferantenformular
- [ ] Verwaltungskomponenten migrieren: Artikelverwaltung, Rezeptverwaltung, Dashboard
- [ ] Modal-Komponenten migrieren: DuplicateArticleModal, DockerSetupModal, Calculator
- [ ] custom-styles.css bereinigen und für Tailwind optimieren
- [ ] Alle Features testen: Artikel/Rezept/Lieferanten CRUD, Import/Export, Modals
- [ ] Responsive Design auf verschiedenen Geräten testen (Mobile, Tablet, Desktop)
- [ ] Theme-System testen: Design-Templates wechseln, Dark/Light Mode
- [ ] Production Build erstellen und Bundle-Size überprüfen