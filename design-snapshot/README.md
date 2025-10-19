# Design-Snapshot - Bootstrap zu Tailwind Migration

Dieses Verzeichnis enthält eine vollständige Dokumentation aller aktuellen Styles vor der Migration von Bootstrap zu Tailwind CSS.

## 📁 Dateien

### `component-styles.json`
Dokumentiert alle aktuell verwendeten CSS-Properties für UI-Komponenten:
- Buttons (Primary, Secondary, Danger)
- Input-Felder
- Tabellen
- Cards
- Modals
- Sidebar-Elemente
- StatCards

### `color-schemes.json`
Extrahiert alle Farben aus `designTemplates.ts`:
- Modern Theme
- Dark Theme  
- Warm Theme
- Professional Theme

### `spacing-sizing.json`
Dokumentiert alle Spacing-, Sizing- und Layout-Werte:
- Padding/Margin-Werte
- Border-Radius
- Font-Sizes
- Font-Weights
- Shadows
- Transitions
- Z-Index-Werte

### `component-specific.md`
Detaillierte Beschreibung für jede Komponente:
- Sidebar-Verhalten
- StatCard-Layout
- DataTable-Styling
- Modal-Verhalten
- Button-Varianten
- Input-Styling
- Responsive Breakpoints

### `css-to-tailwind-mapping.json`
Mapping von aktuellen CSS-Properties zu Tailwind-Klassen:
- Padding/Margin → Tailwind Spacing
- Border-Radius → Tailwind Border-Radius
- Font-Sizes → Tailwind Typography
- Flexbox → Tailwind Flexbox
- Shadows → Tailwind Shadows
- Transitions → Tailwind Transitions

### `extract-styles.ts`
Automatisches Script zur Extraktion von Inline-Styles aus TSX-Dateien:
- Findet alle JSX-Elemente mit style-Props
- Parst CSS-Properties
- Gruppiert nach Komponenten
- Speichert als JSON

### `screenshots/`
Verzeichnis für Screenshots aller Komponenten (manuell zu erstellen)

## 🚀 Verwendung

### Style-Extraction ausführen:
```bash
npx tsx design-snapshot/extract-styles.ts
```

### Screenshots erstellen:
1. App starten: `npm start`
2. Für jede Komponente/Ansicht Screenshots anfertigen
3. In `screenshots/` speichern

## 📋 Checkliste für Screenshots

- [ ] Dashboard (alle StatCards)
- [ ] Artikelverwaltung (Tabelle + Buttons)
- [ ] Artikelformular (alle Input-Felder, Dropdowns, Buttons)
- [ ] Rezeptverwaltung
- [ ] Rezeptformular
- [ ] Lieferantenverwaltung
- [ ] Lieferantenformular
- [ ] Sidebar (geöffnet + geschlossen)
- [ ] Modals (DuplicateArticle, DockerSetup, Calculator)
- [ ] Storage-Management
- [ ] Alle Design-Templates (Farbschemata)

## 🎯 Zweck

Dieser Design-Snapshot dient als:
1. **Referenz** für die exakte Rekonstruktion in Tailwind
2. **Backup** der aktuellen Styles vor der Migration
3. **Dokumentation** für zukünftige Entwickler
4. **Test-Basis** für die Validierung der Migration

## ⚠️ Wichtig

- **Vor** Bootstrap-Entfernung erstellen
- **Vollständig** dokumentieren
- **Committen** vor Migration starten
- **Referenzieren** während der Migration
