-- Automatisch generierte SQL-Befehle aus TypeScript-Interfaces
-- Generiert am: 2025-11-17T23:03:58.540Z
-- Automatische Schema-Generierung mit ts-morph

-- ========================================
-- Enum Types
-- ========================================

CREATE TYPE IF NOT EXISTS sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
CREATE TYPE IF NOT EXISTS difficulty_enum AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE IF NOT EXISTS unit_enum AS ENUM ('kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Dose', 'Glas', 'Bund', 'Portion');

-- ========================================
-- Tabelle: accountingaccounts (Interface: AccountingAccount)
-- ========================================

-- Erstelle Tabelle: accountingaccounts (Interface: AccountingAccount)
CREATE TABLE IF NOT EXISTS accountingaccounts (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
chart_id TEXT,
template_id TEXT,
code TEXT,
number TEXT,
name TEXT NOT NULL,
category TEXT NOT NULL,
vat_tag TEXT,
origin TEXT,
status TEXT,
notes TEXT,
parent_id TEXT,
path JSONB,
sort_order DECIMAL,
type TEXT,
is_leaf BOOLEAN,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für accountingaccounts
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_id ON accountingaccounts(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_db_id ON accountingaccounts(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_created_at ON accountingaccounts(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_updated_at ON accountingaccounts(updated_at);

-- ========================================
-- Tabelle: accountingsettingss (Interface: AccountingSettings)
-- ========================================

-- Erstelle Tabelle: accountingsettingss (Interface: AccountingSettings)
CREATE TABLE IF NOT EXISTS accountingsettingss (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
selected_chart_id TEXT,
customizations_enabled BOOLEAN,
ocr_api_configs TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für accountingsettingss
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_accountingsettingss_id ON accountingsettingss(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_accountingsettingss_db_id ON accountingsettingss(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingsettingss_created_at ON accountingsettingss(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingsettingss_updated_at ON accountingsettingss(updated_at);

-- ========================================
-- Tabelle: suppliers (Interface: Supplier)
-- ========================================

-- Erstelle Tabelle: suppliers (Interface: Supplier)
CREATE TABLE IF NOT EXISTS suppliers (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

-- Erstelle Tabelle: articles (Interface: Article)
CREATE TABLE IF NOT EXISTS articles (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
name TEXT NOT NULL,
names_o_c_r JSONB,
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
accounting_account_number TEXT,
allergens JSONB,
additives JSONB,
ingredients TEXT,
nutrition_info JSONB,
alcohol DECIMAL,
open_food_facts_code TEXT,
price_per_unit_history JSONB,
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

-- ========================================
-- Tabelle: recipes (Interface: Recipe)
-- ========================================

-- Erstelle Tabelle: recipes (Interface: Recipe)
CREATE TABLE IF NOT EXISTS recipes (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
selling_price_history JSONB,
total_nutrition_info JSONB,
alcohol DECIMAL,
allergens JSONB,
ingredients_text TEXT,
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

-- ========================================
-- Tabelle: receipts (Interface: Receipt)
-- ========================================

-- Erstelle Tabelle: receipts (Interface: Receipt)
CREATE TABLE IF NOT EXISTS receipts (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
supplier_id UUID,
booking_number TEXT,
receipt_date TEXT,
receipt_number TEXT,
receipt_details JSONB,
due_date TEXT,
payment_status TEXT,
line_item_count DECIMAL,
accounting TEXT,
is_completed BOOLEAN,
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

-- Indizes für receipts
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_receipts_id ON receipts(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_receipts_db_id ON receipts(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_receipts_updated_at ON receipts(updated_at);

-- ========================================
-- Foreign Key Constraints (DEAKTIVIERT)
-- ========================================
-- Foreign Keys werden bewusst nicht erstellt, um ungewollte Löschungen zu vermeiden.
-- Referentielle Integrität wird in der App-Logik sichergestellt.

-- POTENTIELLER Foreign Key (deaktiviert):
-- ALTER TABLE articles ADD CONSTRAINT fk_articles_supplier 
--   FOREIGN KEY (supplier_id) REFERENCES suppliers(db_id) 
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- POTENTIELLER Foreign Key (deaktiviert):
-- ALTER TABLE receipts ADD CONSTRAINT fk_receipts_supplier 
--   FOREIGN KEY (supplier_id) REFERENCES suppliers(db_id) 
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- Check Constraints
-- ========================================

-- Check Constraints für articles (Idempotent)
DO $$
BEGIN
    -- Prüfe ob Constraint chk_articles_positive_prices existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_positive_prices'
    ) THEN
        ALTER TABLE articles ADD CONSTRAINT chk_articles_positive_prices 
          CHECK (bundle_price >= 0 AND price_per_unit >= 0);
        RAISE NOTICE '✅ Constraint chk_articles_positive_prices erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_articles_positive_prices existiert bereits';
    END IF;

    -- Prüfe ob Constraint chk_articles_positive_content existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_positive_content'
    ) THEN
        ALTER TABLE articles ADD CONSTRAINT chk_articles_positive_content 
          CHECK (content > 0);
        RAISE NOTICE '✅ Constraint chk_articles_positive_content erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_articles_positive_content existiert bereits';
    END IF;

END $$;

-- Check Constraints für recipes (Idempotent)
DO $$
BEGIN
    -- Prüfe ob Constraint chk_recipes_positive_prices existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_recipes_positive_prices'
    ) THEN
        ALTER TABLE recipes ADD CONSTRAINT chk_recipes_positive_prices 
          CHECK (selling_price >= 0);
        RAISE NOTICE '✅ Constraint chk_recipes_positive_prices erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_recipes_positive_prices existiert bereits';
    END IF;

    -- Prüfe ob Constraint chk_recipes_positive_portions existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_recipes_positive_portions'
    ) THEN
        ALTER TABLE recipes ADD CONSTRAINT chk_recipes_positive_portions 
          CHECK (portions > 0);
        RAISE NOTICE '✅ Constraint chk_recipes_positive_portions erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_recipes_positive_portions existiert bereits';
    END IF;

END $$;

-- ========================================
-- Migration Notes
-- ========================================

-- Automatisch generiert aus TypeScript-Interfaces
-- 1. Führen Sie diese Befehle in der richtigen Reihenfolge aus
-- 2. Für bestehende Tabellen: Prüfen Sie auf Konflikte
-- 3. Testen Sie die Constraints und Foreign Keys
-- 4. Backup vor Migration erstellen

-- Ende der automatisch generierten SQL-Befehle
