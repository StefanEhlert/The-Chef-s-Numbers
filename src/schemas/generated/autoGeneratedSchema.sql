-- Automatisch generierte SQL-Befehle aus TypeScript-Interfaces
-- Generiert am: 2025-10-12T20:38:37.429Z
-- Automatische Schema-Generierung mit ts-morph

-- ========================================
-- Enum Types
-- ========================================

CREATE TYPE IF NOT EXISTS sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
CREATE TYPE IF NOT EXISTS difficulty_enum AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE IF NOT EXISTS unit_enum AS ENUM ('kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Dose', 'Glas', 'Bund', 'Portion');

-- ========================================
-- Tabelle: einkaufsitems (Interface: EinkaufsItem)
-- ========================================

-- Erstelle Tabelle: einkaufsitems (Interface: EinkaufsItem)
CREATE TABLE IF NOT EXISTS einkaufsitems (
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
id UUID NOT NULL,
artikel_name TEXT NOT NULL,
menge DECIMAL,
einheit TEXT,
lieferant TEXT,
preis DECIMAL,
bestelldatum TIMESTAMP,
lieferdatum TIMESTAMP,
status TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für einkaufsitems
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_einkaufsitems_id ON einkaufsitems(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_einkaufsitems_db_id ON einkaufsitems(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_einkaufsitems_created_at ON einkaufsitems(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_einkaufsitems_updated_at ON einkaufsitems(updated_at);

-- Kommentare für Spalten in einkaufsitems
-- Kommentar für Spalte: db_id
COMMENT ON COLUMN einkaufsitems.db_id IS 'Datenbank-ID für DB-Operationen (Primary Key) (TS: string)';
-- Kommentar für Spalte: id
COMMENT ON COLUMN einkaufsitems.id IS 'Frontend-ID für State-Management (TS: string)';
-- Kommentar für Spalte: artikel_name
COMMENT ON COLUMN einkaufsitems.artikel_name IS 'artikelName property (TS: string)';
-- Kommentar für Spalte: menge
COMMENT ON COLUMN einkaufsitems.menge IS 'menge property (TS: number)';
-- Kommentar für Spalte: einheit
COMMENT ON COLUMN einkaufsitems.einheit IS 'einheit property (TS: string)';
-- Kommentar für Spalte: lieferant
COMMENT ON COLUMN einkaufsitems.lieferant IS 'lieferant property (TS: string)';
-- Kommentar für Spalte: preis
COMMENT ON COLUMN einkaufsitems.preis IS 'preis property (TS: number)';
-- Kommentar für Spalte: bestelldatum
COMMENT ON COLUMN einkaufsitems.bestelldatum IS 'bestelldatum property (TS: Date)';
-- Kommentar für Spalte: lieferdatum
COMMENT ON COLUMN einkaufsitems.lieferdatum IS 'lieferdatum property (TS: Date)';
-- Kommentar für Spalte: status
COMMENT ON COLUMN einkaufsitems.status IS 'status property (TS: EinkaufsStatus)';
-- Kommentar für Spalte: is_dirty
COMMENT ON COLUMN einkaufsitems.is_dirty IS 'Wurde geändert? (TS: boolean)';
-- Kommentar für Spalte: is_new
COMMENT ON COLUMN einkaufsitems.is_new IS 'Neuer Datensatz? (TS: boolean)';
-- Kommentar für Spalte: sync_status
COMMENT ON COLUMN einkaufsitems.sync_status IS 'Sync-Status (TS: SyncStatus)';
-- Kommentar für Spalte: created_at
COMMENT ON COLUMN einkaufsitems.created_at IS 'Erstellungsdatum (TS: Date)';
-- Kommentar für Spalte: updated_at
COMMENT ON COLUMN einkaufsitems.updated_at IS 'Aktualisierungsdatum (TS: Date)';
-- Kommentar für Spalte: created_by
COMMENT ON COLUMN einkaufsitems.created_by IS 'Benutzer-ID der erstellt hat (TS: string)';
-- Kommentar für Spalte: updated_by
COMMENT ON COLUMN einkaufsitems.updated_by IS 'Benutzer-ID der zuletzt geändert hat (TS: string)';
-- Kommentar für Spalte: last_modified_by
COMMENT ON COLUMN einkaufsitems.last_modified_by IS 'Benutzer-ID der zuletzt modifiziert hat (TS: string)';

-- ========================================
-- Tabelle: suppliers (Interface: Supplier)
-- ========================================

-- Erstelle Tabelle: suppliers (Interface: Supplier)
CREATE TABLE IF NOT EXISTS suppliers (
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
id UUID NOT NULL,
name TEXT NOT NULL,
contact_person TEXT,
email TEXT,
website TEXT,
address JSONB,
phone_numbers JSONB,
notes TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für suppliers
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_suppliers_id ON suppliers(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_suppliers_db_id ON suppliers(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_suppliers_updated_at ON suppliers(updated_at);

-- Kommentare für Spalten in suppliers
-- Kommentar für Spalte: db_id
COMMENT ON COLUMN suppliers.db_id IS 'Datenbank-ID für DB-Operationen (Primary Key) (TS: string)';
-- Kommentar für Spalte: id
COMMENT ON COLUMN suppliers.id IS 'Frontend-ID für State-Management (TS: string)';
-- Kommentar für Spalte: name
COMMENT ON COLUMN suppliers.name IS 'name property (TS: string)';
-- Kommentar für Spalte: contact_person
COMMENT ON COLUMN suppliers.contact_person IS 'contactPerson property (TS: string)';
-- Kommentar für Spalte: email
COMMENT ON COLUMN suppliers.email IS 'email property (TS: string)';
-- Kommentar für Spalte: website
COMMENT ON COLUMN suppliers.website IS 'website property (TS: string)';
-- Kommentar für Spalte: address
COMMENT ON COLUMN suppliers.address IS 'address property (TS: {
    street: string;
    zipCode: string;
    city: string;
    country: string;
  })';
-- Kommentar für Spalte: phone_numbers
COMMENT ON COLUMN suppliers.phone_numbers IS 'phoneNumbers property (TS: PhoneNumber[])';
-- Kommentar für Spalte: notes
COMMENT ON COLUMN suppliers.notes IS 'notes property (TS: string)';
-- Kommentar für Spalte: is_dirty
COMMENT ON COLUMN suppliers.is_dirty IS 'Wurde geändert? (TS: boolean)';
-- Kommentar für Spalte: is_new
COMMENT ON COLUMN suppliers.is_new IS 'Neuer Datensatz? (TS: boolean)';
-- Kommentar für Spalte: sync_status
COMMENT ON COLUMN suppliers.sync_status IS 'Sync-Status (TS: SyncStatus)';
-- Kommentar für Spalte: created_at
COMMENT ON COLUMN suppliers.created_at IS 'Erstellungsdatum (TS: Date)';
-- Kommentar für Spalte: updated_at
COMMENT ON COLUMN suppliers.updated_at IS 'Aktualisierungsdatum (TS: Date)';
-- Kommentar für Spalte: created_by
COMMENT ON COLUMN suppliers.created_by IS 'Benutzer-ID der erstellt hat (TS: string)';
-- Kommentar für Spalte: updated_by
COMMENT ON COLUMN suppliers.updated_by IS 'Benutzer-ID der zuletzt geändert hat (TS: string)';
-- Kommentar für Spalte: last_modified_by
COMMENT ON COLUMN suppliers.last_modified_by IS 'Benutzer-ID der zuletzt modifiziert hat (TS: string)';

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

-- Erstelle Tabelle: articles (Interface: Article)
CREATE TABLE IF NOT EXISTS articles (
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
id UUID NOT NULL,
name TEXT NOT NULL,
category TEXT NOT NULL,
supplier_id UUID NOT NULL,
supplier_article_number TEXT,
bundle_unit TEXT,
bundle_price DECIMAL,
bundle_ean_code TEXT,
content DECIMAL,
content_unit TEXT,
content_ean_code TEXT,
price_per_unit DECIMAL,
vat_rate DECIMAL DEFAULT 19,
allergens TEXT[],
additives TEXT[],
ingredients TEXT,
nutrition_info JSONB,
open_food_facts_code TEXT,
notes TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für articles
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_articles_id ON articles(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_articles_db_id ON articles(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at);
-- Index für Lieferant-Referenz
CREATE INDEX IF NOT EXISTS idx_articles_supplier_id ON articles(supplier_id);
-- Index für Kategorie
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- Kommentare für Spalten in articles
-- Kommentar für Spalte: db_id
COMMENT ON COLUMN articles.db_id IS 'Datenbank-ID für DB-Operationen (Primary Key) (TS: string)';
-- Kommentar für Spalte: id
COMMENT ON COLUMN articles.id IS 'Frontend-ID für State-Management (TS: string)';
-- Kommentar für Spalte: name
COMMENT ON COLUMN articles.name IS 'name property (TS: string)';
-- Kommentar für Spalte: category
COMMENT ON COLUMN articles.category IS 'category property (TS: ArticleCategory)';
-- Kommentar für Spalte: supplier_id
COMMENT ON COLUMN articles.supplier_id IS 'supplierId property (TS: string)';
-- Kommentar für Spalte: supplier_article_number
COMMENT ON COLUMN articles.supplier_article_number IS 'supplierArticleNumber property (TS: string)';
-- Kommentar für Spalte: bundle_unit
COMMENT ON COLUMN articles.bundle_unit IS 'bundleUnit property (TS: Unit)';
-- Kommentar für Spalte: bundle_price
COMMENT ON COLUMN articles.bundle_price IS 'bundlePrice property (TS: number)';
-- Kommentar für Spalte: bundle_ean_code
COMMENT ON COLUMN articles.bundle_ean_code IS 'bundleEanCode property (TS: string)';
-- Kommentar für Spalte: content
COMMENT ON COLUMN articles.content IS 'content property (TS: number)';
-- Kommentar für Spalte: content_unit
COMMENT ON COLUMN articles.content_unit IS 'contentUnit property (TS: Unit)';
-- Kommentar für Spalte: content_ean_code
COMMENT ON COLUMN articles.content_ean_code IS 'contentEanCode property (TS: string)';
-- Kommentar für Spalte: price_per_unit
COMMENT ON COLUMN articles.price_per_unit IS 'pricePerUnit property (TS: number)';
-- Kommentar für Spalte: vat_rate
COMMENT ON COLUMN articles.vat_rate IS 'vatRate property (TS: number)';
-- Kommentar für Spalte: allergens
COMMENT ON COLUMN articles.allergens IS 'allergens property (TS: string[])';
-- Kommentar für Spalte: additives
COMMENT ON COLUMN articles.additives IS 'additives property (TS: string[])';
-- Kommentar für Spalte: ingredients
COMMENT ON COLUMN articles.ingredients IS 'ingredients property (TS: string)';
-- Kommentar für Spalte: nutrition_info
COMMENT ON COLUMN articles.nutrition_info IS 'nutritionInfo property (TS: {
    calories: number; // kcal pro 100g
    kilojoules: number; // kJ pro 100g
    protein: number; // g pro 100g
    fat: number; // g pro 100g
    carbohydrates: number; // g pro 100g
    fiber: number; // g pro 100g
    sugar?: number; // g pro 100g
    salt?: number; // g pro 100g
  })';
-- Kommentar für Spalte: open_food_facts_code
COMMENT ON COLUMN articles.open_food_facts_code IS 'openFoodFactsCode property (TS: string)';
-- Kommentar für Spalte: notes
COMMENT ON COLUMN articles.notes IS 'notes property (TS: string)';
-- Kommentar für Spalte: is_dirty
COMMENT ON COLUMN articles.is_dirty IS 'Wurde geändert? (TS: boolean)';
-- Kommentar für Spalte: is_new
COMMENT ON COLUMN articles.is_new IS 'Neuer Datensatz? (TS: boolean)';
-- Kommentar für Spalte: sync_status
COMMENT ON COLUMN articles.sync_status IS 'Sync-Status (TS: SyncStatus)';
-- Kommentar für Spalte: created_at
COMMENT ON COLUMN articles.created_at IS 'Erstellungsdatum (TS: Date)';
-- Kommentar für Spalte: updated_at
COMMENT ON COLUMN articles.updated_at IS 'Aktualisierungsdatum (TS: Date)';
-- Kommentar für Spalte: created_by
COMMENT ON COLUMN articles.created_by IS 'Benutzer-ID der erstellt hat (TS: string)';
-- Kommentar für Spalte: updated_by
COMMENT ON COLUMN articles.updated_by IS 'Benutzer-ID der zuletzt geändert hat (TS: string)';
-- Kommentar für Spalte: last_modified_by
COMMENT ON COLUMN articles.last_modified_by IS 'Benutzer-ID der zuletzt modifiziert hat (TS: string)';

-- ========================================
-- Tabelle: recipes (Interface: Recipe)
-- ========================================

-- Erstelle Tabelle: recipes (Interface: Recipe)
CREATE TABLE IF NOT EXISTS recipes (
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
id UUID NOT NULL,
name TEXT NOT NULL,
description TEXT,
portions DECIMAL DEFAULT 1,
preparation_time DECIMAL,
difficulty INTEGER,
energy DECIMAL,
image TEXT,
ingredients JSONB,
used_recipes JSONB,
preparation_steps JSONB,
material_costs DECIMAL,
markup_percentage DECIMAL DEFAULT 300,
vat_rate DECIMAL DEFAULT 19,
selling_price DECIMAL,
total_nutrition_info JSONB,
allergens TEXT[],
notes TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für recipes
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_recipes_id ON recipes(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_recipes_db_id ON recipes(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at);

-- Kommentare für Spalten in recipes
-- Kommentar für Spalte: db_id
COMMENT ON COLUMN recipes.db_id IS 'Datenbank-ID für DB-Operationen (Primary Key) (TS: string)';
-- Kommentar für Spalte: id
COMMENT ON COLUMN recipes.id IS 'Frontend-ID für State-Management (TS: string)';
-- Kommentar für Spalte: name
COMMENT ON COLUMN recipes.name IS 'name property (TS: string)';
-- Kommentar für Spalte: description
COMMENT ON COLUMN recipes.description IS 'description property (TS: string)';
-- Kommentar für Spalte: portions
COMMENT ON COLUMN recipes.portions IS 'portions property (TS: number)';
-- Kommentar für Spalte: preparation_time
COMMENT ON COLUMN recipes.preparation_time IS 'preparationTime property (TS: number)';
-- Kommentar für Spalte: difficulty
COMMENT ON COLUMN recipes.difficulty IS 'difficulty property (TS: Difficulty)';
-- Kommentar für Spalte: energy
COMMENT ON COLUMN recipes.energy IS 'energy property (TS: number)';
-- Kommentar für Spalte: image
COMMENT ON COLUMN recipes.image IS 'image property (TS: File)';
-- Kommentar für Spalte: ingredients
COMMENT ON COLUMN recipes.ingredients IS 'ingredients property (TS: RecipeIngredient[])';
-- Kommentar für Spalte: used_recipes
COMMENT ON COLUMN recipes.used_recipes IS 'usedRecipes property (TS: UsedRecipe[])';
-- Kommentar für Spalte: preparation_steps
COMMENT ON COLUMN recipes.preparation_steps IS 'preparationSteps property (TS: PreparationStep[])';
-- Kommentar für Spalte: material_costs
COMMENT ON COLUMN recipes.material_costs IS 'materialCosts property (TS: number)';
-- Kommentar für Spalte: markup_percentage
COMMENT ON COLUMN recipes.markup_percentage IS 'markupPercentage property (TS: number)';
-- Kommentar für Spalte: vat_rate
COMMENT ON COLUMN recipes.vat_rate IS 'vatRate property (TS: number)';
-- Kommentar für Spalte: selling_price
COMMENT ON COLUMN recipes.selling_price IS 'sellingPrice property (TS: number)';
-- Kommentar für Spalte: total_nutrition_info
COMMENT ON COLUMN recipes.total_nutrition_info IS 'totalNutritionInfo property (TS: {
    calories: number;
    kilojoules: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber: number;
    sugar?: number;
    salt?: number;
  })';
-- Kommentar für Spalte: allergens
COMMENT ON COLUMN recipes.allergens IS 'allergens property (TS: string[])';
-- Kommentar für Spalte: notes
COMMENT ON COLUMN recipes.notes IS 'notes property (TS: string)';
-- Kommentar für Spalte: is_dirty
COMMENT ON COLUMN recipes.is_dirty IS 'Wurde geändert? (TS: boolean)';
-- Kommentar für Spalte: is_new
COMMENT ON COLUMN recipes.is_new IS 'Neuer Datensatz? (TS: boolean)';
-- Kommentar für Spalte: sync_status
COMMENT ON COLUMN recipes.sync_status IS 'Sync-Status (TS: SyncStatus)';
-- Kommentar für Spalte: created_at
COMMENT ON COLUMN recipes.created_at IS 'Erstellungsdatum (TS: Date)';
-- Kommentar für Spalte: updated_at
COMMENT ON COLUMN recipes.updated_at IS 'Aktualisierungsdatum (TS: Date)';
-- Kommentar für Spalte: created_by
COMMENT ON COLUMN recipes.created_by IS 'Benutzer-ID der erstellt hat (TS: string)';
-- Kommentar für Spalte: updated_by
COMMENT ON COLUMN recipes.updated_by IS 'Benutzer-ID der zuletzt geändert hat (TS: string)';
-- Kommentar für Spalte: last_modified_by
COMMENT ON COLUMN recipes.last_modified_by IS 'Benutzer-ID der zuletzt modifiziert hat (TS: string)';

-- ========================================
-- Tabelle: inventuritems (Interface: InventurItem)
-- ========================================

-- Erstelle Tabelle: inventuritems (Interface: InventurItem)
CREATE TABLE IF NOT EXISTS inventuritems (
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
id UUID NOT NULL,
artikel_name TEXT NOT NULL,
kategorie TEXT NOT NULL,
soll_bestand DECIMAL,
ist_bestand DECIMAL,
einheit TEXT,
preis DECIMAL,
inventur_datum TIMESTAMP,
differenz DECIMAL,
bemerkung TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für inventuritems
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_inventuritems_id ON inventuritems(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_inventuritems_db_id ON inventuritems(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_inventuritems_created_at ON inventuritems(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_inventuritems_updated_at ON inventuritems(updated_at);

-- Kommentare für Spalten in inventuritems
-- Kommentar für Spalte: db_id
COMMENT ON COLUMN inventuritems.db_id IS 'Datenbank-ID für DB-Operationen (Primary Key) (TS: string)';
-- Kommentar für Spalte: id
COMMENT ON COLUMN inventuritems.id IS 'Frontend-ID für State-Management (TS: string)';
-- Kommentar für Spalte: artikel_name
COMMENT ON COLUMN inventuritems.artikel_name IS 'artikelName property (TS: string)';
-- Kommentar für Spalte: kategorie
COMMENT ON COLUMN inventuritems.kategorie IS 'kategorie property (TS: string)';
-- Kommentar für Spalte: soll_bestand
COMMENT ON COLUMN inventuritems.soll_bestand IS 'sollBestand property (TS: number)';
-- Kommentar für Spalte: ist_bestand
COMMENT ON COLUMN inventuritems.ist_bestand IS 'istBestand property (TS: number)';
-- Kommentar für Spalte: einheit
COMMENT ON COLUMN inventuritems.einheit IS 'einheit property (TS: string)';
-- Kommentar für Spalte: preis
COMMENT ON COLUMN inventuritems.preis IS 'preis property (TS: number)';
-- Kommentar für Spalte: inventur_datum
COMMENT ON COLUMN inventuritems.inventur_datum IS 'inventurDatum property (TS: Date)';
-- Kommentar für Spalte: differenz
COMMENT ON COLUMN inventuritems.differenz IS 'differenz property (TS: number)';
-- Kommentar für Spalte: bemerkung
COMMENT ON COLUMN inventuritems.bemerkung IS 'bemerkung property (TS: string)';
-- Kommentar für Spalte: is_dirty
COMMENT ON COLUMN inventuritems.is_dirty IS 'Wurde geändert? (TS: boolean)';
-- Kommentar für Spalte: is_new
COMMENT ON COLUMN inventuritems.is_new IS 'Neuer Datensatz? (TS: boolean)';
-- Kommentar für Spalte: sync_status
COMMENT ON COLUMN inventuritems.sync_status IS 'Sync-Status (TS: SyncStatus)';
-- Kommentar für Spalte: created_at
COMMENT ON COLUMN inventuritems.created_at IS 'Erstellungsdatum (TS: Date)';
-- Kommentar für Spalte: updated_at
COMMENT ON COLUMN inventuritems.updated_at IS 'Aktualisierungsdatum (TS: Date)';
-- Kommentar für Spalte: created_by
COMMENT ON COLUMN inventuritems.created_by IS 'Benutzer-ID der erstellt hat (TS: string)';
-- Kommentar für Spalte: updated_by
COMMENT ON COLUMN inventuritems.updated_by IS 'Benutzer-ID der zuletzt geändert hat (TS: string)';
-- Kommentar für Spalte: last_modified_by
COMMENT ON COLUMN inventuritems.last_modified_by IS 'Benutzer-ID der zuletzt modifiziert hat (TS: string)';

-- ========================================
-- Foreign Key Constraints (DEAKTIVIERT)
-- ========================================
-- Foreign Keys werden bewusst nicht erstellt, um ungewollte Löschungen zu vermeiden.
-- Referentielle Integrität wird in der App-Logik sichergestellt.

-- POTENTIELLER Foreign Key (deaktiviert):
-- ALTER TABLE articles ADD CONSTRAINT fk_articles_supplier 
--   FOREIGN KEY (supplier_id) REFERENCES suppliers(db_id) 
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- Check Constraints
-- ========================================

-- Check Constraint für positive Preise in articles
ALTER TABLE articles ADD CONSTRAINT chk_articles_positive_prices 
  CHECK (bundle_price >= 0 AND price_per_unit >= 0);

-- Check Constraint für positive content in articles
ALTER TABLE articles ADD CONSTRAINT chk_articles_positive_content 
  CHECK (content > 0);

-- Check Constraint für positive Preise in recipes
ALTER TABLE recipes ADD CONSTRAINT chk_recipes_positive_prices 
  CHECK (selling_price >= 0);

-- Check Constraint für positive portions in recipes
ALTER TABLE recipes ADD CONSTRAINT chk_recipes_positive_portions 
  CHECK (portions > 0);

-- ========================================
-- Migration Notes
-- ========================================

-- Automatisch generiert aus TypeScript-Interfaces
-- 1. Führen Sie diese Befehle in der richtigen Reihenfolge aus
-- 2. Für bestehende Tabellen: Prüfen Sie auf Konflikte
-- 3. Testen Sie die Constraints und Foreign Keys
-- 4. Backup vor Migration erstellen

-- Ende der automatisch generierten SQL-Befehle
