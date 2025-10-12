-- Chef Numbers Database Initialization Script (PostgreSQL)
-- Wird beim ersten Start der PostgreSQL-Datenbank ausgeführt
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2025-10-12T23:06:38.916Z

-- Erstelle Rollen für PostgreSQL
DO $$
BEGIN
    -- Standard-Benutzer postgres erstellen (falls nicht vorhanden)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE ROLE postgres WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD 'postgres';
        RAISE NOTICE 'Standard-Benutzer postgres erstellt';
    ELSE
        RAISE NOTICE 'Standard-Benutzer postgres existiert bereits';
    END IF;

    -- Anon Role (für öffentliche API-Zugriffe)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    
    -- Authenticated Role (für authentifizierte Benutzer)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    
    -- Service Role (für Admin-Operationen)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
END
$$;

-- Erstelle Schema
CREATE SCHEMA IF NOT EXISTS public;

-- Berechtigungen vergeben
-- WICHTIG: Database-Level Berechtigungen (falls Datenbank chef_numbers existiert)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'chef_numbers') THEN
        GRANT ALL PRIVILEGES ON DATABASE chef_numbers TO postgres;
        RAISE NOTICE 'Berechtigungen für Datenbank chef_numbers erteilt';
    ELSE
        RAISE NOTICE 'Datenbank chef_numbers nicht gefunden, überspringe Database-Level Berechtigungen';
    END IF;
END
$$;

-- Setze Schema-Berechtigungen
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON SCHEMA public TO service_role, postgres;

-- Berechtigungen für bestehende Objekte
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- ========================================
-- Enum Types (erstellen mit DO-Block für Fehlerbehandlung)
-- ========================================

DO $$
BEGIN
    -- Sync Status Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status_enum') THEN
        CREATE TYPE sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
        RAISE NOTICE 'Enum sync_status_enum erstellt';
    ELSE
        RAISE NOTICE 'Enum sync_status_enum existiert bereits';
    END IF;
    
    -- Difficulty Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_enum') THEN
        CREATE TYPE difficulty_enum AS ENUM ('1', '2', '3', '4', '5');
        RAISE NOTICE 'Enum difficulty_enum erstellt';
    ELSE
        RAISE NOTICE 'Enum difficulty_enum existiert bereits';
    END IF;
    
    -- Unit Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_enum') THEN
        CREATE TYPE unit_enum AS ENUM ('kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Dose', 'Glas', 'Bund', 'Portion');
        RAISE NOTICE 'Enum unit_enum erstellt';
    ELSE
        RAISE NOTICE 'Enum unit_enum existiert bereits';
    END IF;
END
$$;

-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Automatisch generierte Tabellen aus TypeScript-Interfaces
-- ========================================

-- Automatisch generierte SQL-Befehle aus TypeScript-Interfaces
-- Generiert am: 2025-10-12T23:06:38.916Z
-- Automatische Schema-Generierung mit ts-morph

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

-- Design-Tabelle für UI-Einstellungen
CREATE TABLE IF NOT EXISTS design (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme TEXT DEFAULT 'light',
    primary_color TEXT DEFAULT '#007bff',
    secondary_color TEXT DEFAULT '#6c757d',
    accent_color TEXT DEFAULT '#28a745',
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#212529',
    card_color TEXT DEFAULT '#f8f9fa',
    border_color TEXT DEFAULT '#dee2e6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping List Tabelle
CREATE TABLE IF NOT EXISTS shopping_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Tabelle
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID,
    quantity DECIMAL DEFAULT 0,
    unit TEXT DEFAULT 'Stück',
    expiry_date DATE,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Schema-Migrations-System
-- Version: 2.0.0 → 2.2.2
-- Automatisch generiert - Migrationen werden nur einmal ausgeführt
-- ========================================

-- Migrationen für bestehende Tabellen
DO $$
DECLARE
    current_schema_version TEXT;
BEGIN
    -- Hole aktuelle Schema-Version
    SELECT value INTO current_schema_version 
    FROM system_info 
    WHERE key = 'schema_version' 
    LIMIT 1;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Schema-Migrations-System';
    RAISE NOTICE 'Aktuelle Version: %', COALESCE(current_schema_version, 'keine');
    RAISE NOTICE 'Ziel-Version: 2.2.2';
    RAISE NOTICE '=========================================';
    
    -- Migration 1: Typ-Konvertierungen (v2.0.0 → v2.2.2)
    IF current_schema_version IS NULL OR current_schema_version::DECIMAL < 2.2.2 THEN
        RAISE NOTICE 'Führe Typ-Konvertierungen aus...';
        
        -- suppliers.address: TEXT → JSONB
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'suppliers' 
                AND column_name = 'address' 
                AND data_type = 'text'
            ) THEN
                ALTER TABLE suppliers ALTER COLUMN address TYPE JSONB USING 
                    CASE 
                        WHEN address IS NULL THEN NULL
                        WHEN address = '' THEN NULL
                        WHEN address LIKE '{%}' THEN address::jsonb
                        ELSE NULL
                    END;
                RAISE NOTICE '✅ suppliers.address: TEXT → JSONB konvertiert';
            ELSE
                RAISE NOTICE '✓ suppliers.address ist bereits JSONB';
            END IF;
        END IF;
        
    END IF;
    
    -- Migration 2: db_id mit DEFAULT gen_random_uuid()
    IF current_schema_version IS NULL OR current_schema_version::DECIMAL < 2.2.2 THEN
        RAISE NOTICE 'Prüfe db_id DEFAULT-Werte...';
        
        DECLARE
            table_name TEXT;
        BEGIN
            FOR table_name IN SELECT unnest(ARRAY['einkaufsitems', 'suppliers', 'articles', 'recipes', 'inventuritems'])
            LOOP
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = table_name) THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND columns.table_name = table_name 
                        AND column_name = 'db_id' 
                        AND column_default LIKE '%gen_random_uuid%'
                    ) THEN
                        EXECUTE format('ALTER TABLE %I ALTER COLUMN db_id SET DEFAULT gen_random_uuid()', table_name);
                        RAISE NOTICE '✅ %.db_id: DEFAULT gen_random_uuid() hinzugefügt', table_name;
                    ELSE
                        RAISE NOTICE '✓ %.db_id hat bereits DEFAULT', table_name;
                    END IF;
                END IF;
            END LOOP;
        END;
    END IF;
    
    -- Migration 3: created_at und updated_at mit DEFAULT CURRENT_TIMESTAMP
    IF current_schema_version IS NULL OR current_schema_version::DECIMAL < 2.2.2 THEN
        RAISE NOTICE 'Prüfe Timestamp DEFAULT-Werte...';
        
        DECLARE
            table_name TEXT;
        BEGIN
            FOR table_name IN SELECT unnest(ARRAY['einkaufsitems', 'suppliers', 'articles', 'recipes', 'inventuritems'])
            LOOP
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = table_name) THEN
                    -- Prüfe created_at DEFAULT
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND columns.table_name = table_name 
                        AND column_name = 'created_at' 
                        AND column_default IS NOT NULL
                    ) THEN
                        EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP', table_name);
                        RAISE NOTICE '✅ %.created_at: DEFAULT CURRENT_TIMESTAMP hinzugefügt', table_name;
                    END IF;
                    
                    -- Prüfe updated_at DEFAULT
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND columns.table_name = table_name 
                        AND column_name = 'updated_at' 
                        AND column_default IS NOT NULL
                    ) THEN
                        EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP', table_name);
                        RAISE NOTICE '✅ %.updated_at: DEFAULT CURRENT_TIMESTAMP hinzugefügt', table_name;
                    END IF;
                END IF;
            END LOOP;
        END;
    END IF;
    
END $$;

-- Füge System-Informationen hinzu (mit aktualisierter Schema-Version)
INSERT INTO system_info (key, value, description) VALUES 
    ('app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
    ('version', '2.2.2', 'Aktuelle Version'),
    ('database_created', CURRENT_TIMESTAMP::text, 'Datum der Datenbankerstellung'),
    ('connection_tested_at', CURRENT_TIMESTAMP::text, 'Letzter Verbindungstest'),
    ('postgresql_version', '2.2.2', 'PostgreSQL Frontend-synchronisiert Version'),
    ('setup_completed', 'true', 'Initial Setup abgeschlossen'),
    ('schema_version', '2.2.2', 'Frontend-synchronisiertes Schema - Migrationen bis v2.2.2 angewendet')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Erstelle Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Füge updated_at Trigger zu allen Tabellen hinzu
CREATE TRIGGER update_einkaufsitems_updated_at BEFORE UPDATE ON einkaufsitems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventuritems_updated_at BEFORE UPDATE ON inventuritems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_design_updated_at BEFORE UPDATE ON design FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_list_updated_at BEFORE UPDATE ON shopping_list FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security (RLS) Setup
-- ========================================

-- Aktiviere Row Level Security für alle generierten Tabellen
ALTER TABLE einkaufsitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventuritems ENABLE ROW LEVEL SECURITY;
ALTER TABLE design ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies (erlaube alle Operationen für alle Rollen)
-- ========================================

-- RLS Policy für einkaufsitems
CREATE POLICY "Enable all operations for all users" ON einkaufsitems FOR ALL USING (true);

-- RLS Policy für suppliers
CREATE POLICY "Enable all operations for all users" ON suppliers FOR ALL USING (true);

-- RLS Policy für articles
CREATE POLICY "Enable all operations for all users" ON articles FOR ALL USING (true);

-- RLS Policy für recipes
CREATE POLICY "Enable all operations for all users" ON recipes FOR ALL USING (true);

-- RLS Policy für inventuritems
CREATE POLICY "Enable all operations for all users" ON inventuritems FOR ALL USING (true);

-- RLS Policies für System-Tabellen
CREATE POLICY "Enable all operations for all users" ON design FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON shopping_list FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON inventory FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON system_info FOR ALL USING (true);

-- WICHTIG: Explizite Berechtigungen für alle bestehenden Tabellen (PostgREST benötigt diese!)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- Berechtigungen für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, postgres;

-- Erfolgsmeldung
SELECT 'PostgreSQL-Initialisierung erfolgreich abgeschlossen!' as status;
SELECT 'Frontend-synchronisiertes Schema v2.2.2 installiert' as schema_info;
SELECT 'Verfolgbare Migrationen von v2.0.0 zu v2.2.2' as migration_info;
SELECT 'Verfügbare Benutzer:' as info;
SELECT rolname as benutzer FROM pg_roles WHERE rolcanlogin = true;
