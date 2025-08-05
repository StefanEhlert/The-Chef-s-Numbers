# Nährwert-Integration in "The Chef's Numbers"

## Übersicht

Diese Integration ermöglicht es, Nährwertdaten aus externen Datenbanken direkt in die App zu laden. Aktuell ist die **Open Food Facts API** integriert, die eine kostenlose und umfangreiche Datenbank mit internationalen Produkten bietet.

## Implementierte Features

### 1. Nährwert-API Service (`src/services/nutritionAPI.ts`)
- **Open Food Facts Integration**: Kostenlose API mit über 2 Millionen Produkten
- **Automatische Datenkonvertierung**: Konvertiert API-Daten in das interne Format
- **Fehlerbehandlung**: Robuste Fehlerbehandlung für Netzwerkprobleme
- **Debouncing**: Optimierte Suchanfragen mit Debouncing

### 2. Nährwert-Suche Komponente (`src/components/NutritionSearch.tsx`)
- **Benutzerfreundliche Suche**: Autocomplete mit Vorschlägen
- **Produktdetails**: Zeigt Marke, Nährwerte und Produktbilder
- **Keyboard Navigation**: Vollständige Tastaturnavigation
- **Responsive Design**: Funktioniert auf allen Bildschirmgrößen

### 3. Integration in Artikelformular
- **"Nährwerte suchen" Button**: Direkt neben den Nährwertfeldern
- **Automatische Befüllung**: Lädt gefundene Daten automatisch in das Formular
- **Modal-Interface**: Übersichtliche Darstellung der Suchergebnisse

## Verwendung

### Im Artikelformular:
1. Öffnen Sie das Artikelformular für einen neuen oder bestehenden Artikel
2. Geben Sie den Artikelnamen ein
3. Klicken Sie auf "Nährwerte suchen" neben der Nährwertangaben-Überschrift
4. Suchen Sie nach dem gewünschten Produkt
5. Wählen Sie ein Produkt aus der Liste aus
6. Die Nährwertdaten werden automatisch in das Formular übernommen

### API-Funktionen:
```typescript
// Nach Produkten suchen
const suggestions = await nutritionAPI.getSuggestions('Apfel');

// Beste Übereinstimmung finden
const nutritionData = await nutritionAPI.findBestMatch('Banane');

// Produktdetails abrufen
const product = await nutritionAPI.getProductByCode('product_code');
```

## Verfügbare Nährwertdaten

Die Integration unterstützt folgende Nährwertangaben (pro 100g/100ml):
- **Kalorien** (kcal)
- **Kilojoule** (kJ) - automatisch berechnet
- **Protein** (g)
- **Fett** (g)
- **Kohlenhydrate** (g)
- **Ballaststoffe** (g) - optional
- **Zucker** (g) - optional
- **Salz** (g) - optional

## Alternative APIs

Falls Sie andere Datenquellen verwenden möchten, können folgende APIs integriert werden:

### 1. USDA Food Database (Kostenlos)
- **URL**: https://fdc.nal.usda.gov/api-guide.html
- **Vorteile**: Sehr umfangreich, gut dokumentiert
- **Nachteile**: Hauptsächlich US-Produkte, englische Bezeichnungen

### 2. Nutritionix API (Kostenpflichtig)
- **URL**: https://www.nutritionix.com/business/api
- **Vorteile**: Hohe Datenqualität, deutsche Produkte
- **Nachteile**: Kostenpflichtig

### 3. Spoonacular API (Kostenpflichtig)
- **URL**: https://spoonacular.com/food-api
- **Vorteile**: Umfangreich, gute Dokumentation
- **Nachteile**: Kostenpflichtig

## Erweiterte Funktionen

### Automatische Kategorisierung
Die Nährwertdaten können auch für die automatische Kategorisierung von Artikeln verwendet werden:
- Fettarme Produkte → "Gesunde Ernährung"
- Proteinreiche Produkte → "Sport & Fitness"
- etc.

### Rezept-Berechnung
Die Nährwertdaten werden automatisch in Rezepten berechnet:
- Summierung aller Zutaten
- Berechnung pro Portion
- Anzeige der Gesamtnährwerte

### Export-Funktionen
Nährwertdaten werden in alle Export-Formate integriert:
- CSV-Export
- Excel-Export
- PDF-Reports

## Technische Details

### Datenformat
```typescript
interface NutritionData {
  calories: number;      // kcal pro 100g
  kilojoules: number;    // kJ pro 100g
  protein: number;       // g pro 100g
  fat: number;          // g pro 100g
  carbohydrates: number; // g pro 100g
  fiber?: number;       // g pro 100g (optional)
  sugar?: number;       // g pro 100g (optional)
  salt?: number;        // g pro 100g (optional)
}
```

### API-Limits
- **Open Food Facts**: Keine offiziellen Limits
- **Empfohlene Rate**: Max. 10 Anfragen pro Sekunde
- **Caching**: Implementierung für bessere Performance möglich

### Fehlerbehandlung
- Netzwerkfehler werden abgefangen
- Fallback auf manuelle Eingabe
- Benutzerfreundliche Fehlermeldungen

## Zukünftige Erweiterungen

### Geplante Features:
1. **Offline-Cache**: Lokale Speicherung häufig verwendeter Produkte
2. **Barcode-Scanner**: Direkte Produkterkennung über Barcodes
3. **Mehrere APIs**: Integration weiterer Datenquellen
4. **KI-gestützte Suche**: Verbesserte Produktzuordnung
5. **Nährwert-Trends**: Analyse von Nährwertentwicklungen

### Performance-Optimierungen:
1. **Lazy Loading**: Laden von Daten nur bei Bedarf
2. **Intelligentes Caching**: Speicherung basierend auf Nutzungsmustern
3. **Batch-Requests**: Mehrere Anfragen zusammenfassen

## Support

Bei Fragen oder Problemen mit der Nährwert-Integration:
1. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Testen Sie die API-Verbindung mit der Test-Komponente
3. Stellen Sie sicher, dass eine Internetverbindung besteht

## Lizenz

Die Open Food Facts API ist unter der Open Database License verfügbar.
Weitere Informationen: https://world.openfoodfacts.org/terms-of-use 