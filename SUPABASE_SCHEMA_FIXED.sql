-- 🍴 The Chef's Numbers - Korrigiertes Supabase Schema
-- WICHTIG: Führen Sie dieses korrigierte SQL-Skript in Supabase aus um die Schema-Probleme zu beheben

-- ====================================
-- 1. ARTIKEL-TABELLE MIT KORREKTEN FELDERN
-- ====================================

-- Lösche alte Tabelle falls vorhanden (ACHTUNG: Daten gehen verloren!)
DROP TABLE IF EXISTS articles CASCADE;

-- Neue Artikel-Tabelle mit allen von der App verwendeten Feldern
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basis-Informationen
  name TEXT NOT NULL,
  category TEXT,
  supplier_id TEXT, -- Verweis auf Lieferanten
  supplier_article_number TEXT, -- Artikel-Nummer beim Lieferanten
  
  -- Preise und Einheiten (wie in der App verwendet)
  bundle_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- bundlePrice
  bundle_unit TEXT DEFAULT 'Stück', -- bundleUnit
  content DECIMAL(10,3) DEFAULT 1, -- content (Inhalt)
  content_unit TEXT DEFAULT 'Stück', -- contentUnit
  price_per_unit DECIMAL(10,4) DEFAULT 0, -- pricePerUnit (berechnet)
  
  -- Preis-Typ (wie in der App verwendet)
  is_gross_price BOOLEAN DEFAULT true, -- isGrossPrice (true=brutto, false=netto)
  vat_rate DECIMAL(5,2) DEFAULT 19.00, -- vatRate (MwSt-Satz)
  
  -- Inhaltsstoffe und Allergene
  additives TEXT[] DEFAULT '{}', -- additives
  allergens TEXT[] DEFAULT '{}', -- allergens
  ingredients TEXT, -- ingredients (Zutatenliste)
  
  -- Nährwerte (komplettes nutritionInfo Objekt als JSONB)
  nutrition JSONB DEFAULT '{"calories": 0, "kilojoules": 0, "protein": 0, "fat": 0, "carbohydrates": 0}',
  
  -- Legacy-Felder für Kompatibilität
  net_price DECIMAL(10,2), -- Für Migration von alten Daten
  gross_price DECIMAL(10,2), -- Für Migration von alten Daten
  
  -- Zusätzliche Informationen
  notes TEXT,
  image_url TEXT,
  
  -- Zeitstempel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. LIEFERANTEN-TABELLE (KORRIGIERT)
-- ====================================

-- Lösche alte Tabelle falls vorhanden
DROP TABLE IF EXISTS suppliers CASCADE;

-- Neue Lieferanten-Tabelle
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone_numbers TEXT[] DEFAULT '{}', -- Array für mehrere Telefonnummern
  
  -- Adresse (separate Felder wie in der App)
  address_street TEXT,
  address_zip_code TEXT,
  address_city TEXT,
  address_country TEXT DEFAULT 'Deutschland',
  
  website TEXT,
  notes TEXT,
  
  -- Zeitstempel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 3. REZEPTE-TABELLE (ERWEITERT)
-- ====================================

-- Lösche alte Tabelle falls vorhanden
DROP TABLE IF EXISTS recipes CASCADE;

-- Neue Rezepte-Tabelle mit allen App-Feldern
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basis-Informationen
  name TEXT NOT NULL,
  description TEXT,
  portions INTEGER DEFAULT 1,
  preparation_time INTEGER DEFAULT 0, -- in Minuten
  difficulty TEXT DEFAULT 'mittel', -- leicht, mittel, schwer
  
  -- Komplexe Daten als JSONB
  ingredients JSONB DEFAULT '[]', -- Array von RecipeIngredient-Objekten
  used_recipes JSONB DEFAULT '[]', -- Array von UsedRecipe-Objekten
  preparation_steps JSONB DEFAULT '[]', -- Array von PreparationStep-Objekten
  
  -- Kalkulation
  material_costs DECIMAL(10,2) DEFAULT 0,
  markup_percentage DECIMAL(5,2) DEFAULT 300.00, -- Standard 300%
  vat_rate DECIMAL(5,2) DEFAULT 19.00,
  selling_price DECIMAL(10,2) DEFAULT 0,
  
  -- Nährwerte (komplettes totalNutritionInfo Objekt)
  total_nutrition_info JSONB DEFAULT '{"calories": 0, "kilojoules": 0, "protein": 0, "fat": 0, "carbohydrates": 0}',
  
  -- Allergene (berechnet aus Zutaten)
  allergens TEXT[] DEFAULT '{}',
  
  -- Zusätzliche Informationen
  notes TEXT,
  
  -- Zeitstempel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 4. EINKAUFSLISTE-TABELLE
-- ====================================

-- Lösche alte Tabelle falls vorhanden
DROP TABLE IF EXISTS einkauf CASCADE;

-- Neue Einkaufsliste-Tabelle
CREATE TABLE einkauf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT, -- Verweis auf Artikel
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'Stück',
  priority TEXT DEFAULT 'normal', -- niedrig, normal, hoch
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 5. INVENTUR-TABELLE
-- ====================================

-- Lösche alte Tabelle falls vorhanden
DROP TABLE IF EXISTS inventur CASCADE;

-- Neue Inventur-Tabelle
CREATE TABLE inventur (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT, -- Verweis auf Artikel
  current_stock DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'Stück',
  notes TEXT,
  counted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  counted_by TEXT DEFAULT 'Benutzer'
);

-- ====================================
-- 6. INDIZES FÜR BESSERE PERFORMANCE
-- ====================================

-- Artikel-Indizes
CREATE INDEX idx_articles_name ON articles(name);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_supplier_id ON articles(supplier_id);
CREATE INDEX idx_articles_bundle_price ON articles(bundle_price);

-- Lieferanten-Indizes
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- Rezepte-Indizes
CREATE INDEX idx_recipes_name ON recipes(name);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);

-- Einkauf-Indizes
CREATE INDEX idx_einkauf_article_id ON einkauf(article_id);
CREATE INDEX idx_einkauf_completed ON einkauf(completed);

-- Inventur-Indizes
CREATE INDEX idx_inventur_article_id ON inventur(article_id);

-- ====================================
-- 7. ROW LEVEL SECURITY (RLS) AKTIVIEREN
-- ====================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE einkauf ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventur ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 8. POLICIES FÜR ÖFFENTLICHEN ZUGRIFF
-- ====================================

-- WICHTIG: Für Demo-Zwecke - in Produktion restriktivere Policies verwenden!

-- Artikel-Policies
CREATE POLICY "Public access for articles" ON articles FOR ALL USING (true);

-- Lieferanten-Policies  
CREATE POLICY "Public access for suppliers" ON suppliers FOR ALL USING (true);

-- Rezepte-Policies
CREATE POLICY "Public access for recipes" ON recipes FOR ALL USING (true);

-- Einkauf-Policies
CREATE POLICY "Public access for einkauf" ON einkauf FOR ALL USING (true);

-- Inventur-Policies
CREATE POLICY "Public access for inventur" ON inventur FOR ALL USING (true);

-- ====================================
-- 9. TRIGGER FÜR AUTOMATISCHE UPDATES
-- ====================================

-- Funktion für automatische updated_at Zeitstempel
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für alle Tabellen
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_einkauf_updated_at BEFORE UPDATE ON einkauf FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventur_updated_at BEFORE UPDATE ON inventur FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- ✅ SCHEMA-ERSTELLUNG ABGESCHLOSSEN!
-- ====================================

-- Dieses Schema ist jetzt vollständig kompatibel mit der App-Datenstruktur.
-- Alle Felder wie bundlePrice, contentUnit, pricePerUnit, isGrossPrice, vatRate etc. sind enthalten.

-- NÄCHSTE SCHRITTE:
-- 1. Führen Sie dieses SQL-Skript in Supabase aus (SQL Editor)
-- 2. Testen Sie die App - die Fehler sollten verschwunden sein
-- 3. Überprüfen Sie die Browser-Konsole auf weitere Fehlermeldungen
