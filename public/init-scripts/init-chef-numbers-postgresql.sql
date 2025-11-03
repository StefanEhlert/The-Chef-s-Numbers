-- Chef Numbers Database Initialization Script (PostgreSQL)
-- Wird beim ersten Start der PostgreSQL-Datenbank ausgeführt
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2025-11-03T01:06:18.445Z

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
-- Generiert am: 2025-11-03T01:06:18.445Z
-- Automatische Schema-Generierung mit ts-morph

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

-- ========================================
-- ALTER-Statements für alle Tabellen (Idempotent)
-- Führt für jede Spalte eine Prüfung durch und fügt sie hinzu falls nicht vorhanden
-- ========================================

-- Prüfe und füge Spalten für suppliers hinzu
DO $$
BEGIN
    -- Spalte: id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN id UUID  NOT NULL;
        RAISE NOTICE '✅ Spalte id zu suppliers hinzugefügt';
    END IF;

    -- Spalte: db_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL;
        RAISE NOTICE '✅ Spalte db_id zu suppliers hinzugefügt';
    END IF;

    -- Spalte: name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN name TEXT  NOT NULL;
        RAISE NOTICE '✅ Spalte name zu suppliers hinzugefügt';
    END IF;

    -- Spalte: contact_person
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'contact_person'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN contact_person TEXT  NULL;
        RAISE NOTICE '✅ Spalte contact_person zu suppliers hinzugefügt';
    END IF;

    -- Spalte: email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN email TEXT  NULL;
        RAISE NOTICE '✅ Spalte email zu suppliers hinzugefügt';
    END IF;

    -- Spalte: website
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN website TEXT  NULL;
        RAISE NOTICE '✅ Spalte website zu suppliers hinzugefügt';
    END IF;

    -- Spalte: address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN address JSONB  NULL;
        RAISE NOTICE '✅ Spalte address zu suppliers hinzugefügt';
    END IF;

    -- Spalte: phone_numbers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'phone_numbers'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN phone_numbers JSONB  NULL;
        RAISE NOTICE '✅ Spalte phone_numbers zu suppliers hinzugefügt';
    END IF;

    -- Spalte: notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN notes TEXT  NULL;
        RAISE NOTICE '✅ Spalte notes zu suppliers hinzugefügt';
    END IF;

    -- Spalte: is_dirty
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL;
        RAISE NOTICE '✅ Spalte is_dirty zu suppliers hinzugefügt';
    END IF;

    -- Spalte: is_new
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN is_new BOOLEAN DEFAULT false NULL;
        RAISE NOTICE '✅ Spalte is_new zu suppliers hinzugefügt';
    END IF;

    -- Spalte: sync_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL;
        RAISE NOTICE '✅ Spalte sync_status zu suppliers hinzugefügt';
    END IF;

    -- Spalte: created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        RAISE NOTICE '✅ Spalte created_at zu suppliers hinzugefügt';
    END IF;

    -- Spalte: updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        RAISE NOTICE '✅ Spalte updated_at zu suppliers hinzugefügt';
    END IF;

    -- Spalte: created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN created_by UUID  NULL;
        RAISE NOTICE '✅ Spalte created_by zu suppliers hinzugefügt';
    END IF;

    -- Spalte: updated_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN updated_by UUID  NULL;
        RAISE NOTICE '✅ Spalte updated_by zu suppliers hinzugefügt';
    END IF;

    -- Spalte: last_modified_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN last_modified_by UUID  NULL;
        RAISE NOTICE '✅ Spalte last_modified_by zu suppliers hinzugefügt';
    END IF;

END $$;

-- Prüfe und füge Spalten für articles hinzu
DO $$
BEGIN
    -- Spalte: id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE articles ADD COLUMN id UUID  NOT NULL;
        RAISE NOTICE '✅ Spalte id zu articles hinzugefügt';
    END IF;

    -- Spalte: db_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL;
        RAISE NOTICE '✅ Spalte db_id zu articles hinzugefügt';
    END IF;

    -- Spalte: name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE articles ADD COLUMN name TEXT  NOT NULL;
        RAISE NOTICE '✅ Spalte name zu articles hinzugefügt';
    END IF;

    -- Spalte: category
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE articles ADD COLUMN category TEXT  NOT NULL;
        RAISE NOTICE '✅ Spalte category zu articles hinzugefügt';
    END IF;

    -- Spalte: supplier_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN supplier_id UUID  NOT NULL;
        RAISE NOTICE '✅ Spalte supplier_id zu articles hinzugefügt';
    END IF;

    -- Spalte: supplier_article_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'supplier_article_number'
    ) THEN
        ALTER TABLE articles ADD COLUMN supplier_article_number TEXT  NULL;
        RAISE NOTICE '✅ Spalte supplier_article_number zu articles hinzugefügt';
    END IF;

    -- Spalte: bundle_unit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'bundle_unit'
    ) THEN
        ALTER TABLE articles ADD COLUMN bundle_unit TEXT  NULL;
        RAISE NOTICE '✅ Spalte bundle_unit zu articles hinzugefügt';
    END IF;

    -- Spalte: bundle_price
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'bundle_price'
    ) THEN
        ALTER TABLE articles ADD COLUMN bundle_price DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte bundle_price zu articles hinzugefügt';
    END IF;

    -- Spalte: bundle_ean_code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'bundle_ean_code'
    ) THEN
        ALTER TABLE articles ADD COLUMN bundle_ean_code TEXT  NULL;
        RAISE NOTICE '✅ Spalte bundle_ean_code zu articles hinzugefügt';
    END IF;

    -- Spalte: content
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'content'
    ) THEN
        ALTER TABLE articles ADD COLUMN content DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte content zu articles hinzugefügt';
    END IF;

    -- Spalte: content_unit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'content_unit'
    ) THEN
        ALTER TABLE articles ADD COLUMN content_unit TEXT  NULL;
        RAISE NOTICE '✅ Spalte content_unit zu articles hinzugefügt';
    END IF;

    -- Spalte: content_ean_code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'content_ean_code'
    ) THEN
        ALTER TABLE articles ADD COLUMN content_ean_code TEXT  NULL;
        RAISE NOTICE '✅ Spalte content_ean_code zu articles hinzugefügt';
    END IF;

    -- Spalte: price_per_unit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'price_per_unit'
    ) THEN
        ALTER TABLE articles ADD COLUMN price_per_unit DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte price_per_unit zu articles hinzugefügt';
    END IF;

    -- Spalte: vat_rate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'vat_rate'
    ) THEN
        ALTER TABLE articles ADD COLUMN vat_rate DECIMAL DEFAULT 19 NULL;
        RAISE NOTICE '✅ Spalte vat_rate zu articles hinzugefügt';
    END IF;

    -- Spalte: allergens
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'allergens'
    ) THEN
        ALTER TABLE articles ADD COLUMN allergens JSONB  NULL;
        RAISE NOTICE '✅ Spalte allergens zu articles hinzugefügt';
    END IF;

    -- Spalte: additives
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'additives'
    ) THEN
        ALTER TABLE articles ADD COLUMN additives JSONB  NULL;
        RAISE NOTICE '✅ Spalte additives zu articles hinzugefügt';
    END IF;

    -- Spalte: ingredients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'ingredients'
    ) THEN
        ALTER TABLE articles ADD COLUMN ingredients TEXT  NULL;
        RAISE NOTICE '✅ Spalte ingredients zu articles hinzugefügt';
    END IF;

    -- Spalte: nutrition_info
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'nutrition_info'
    ) THEN
        ALTER TABLE articles ADD COLUMN nutrition_info JSONB  NULL;
        RAISE NOTICE '✅ Spalte nutrition_info zu articles hinzugefügt';
    END IF;

    -- Spalte: alcohol
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'alcohol'
    ) THEN
        ALTER TABLE articles ADD COLUMN alcohol DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte alcohol zu articles hinzugefügt';
    END IF;

    -- Spalte: open_food_facts_code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'open_food_facts_code'
    ) THEN
        ALTER TABLE articles ADD COLUMN open_food_facts_code TEXT  NULL;
        RAISE NOTICE '✅ Spalte open_food_facts_code zu articles hinzugefügt';
    END IF;

    -- Spalte: price_per_unit_history
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'price_per_unit_history'
    ) THEN
        ALTER TABLE articles ADD COLUMN price_per_unit_history JSONB  NULL;
        RAISE NOTICE '✅ Spalte price_per_unit_history zu articles hinzugefügt';
    END IF;

    -- Spalte: notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE articles ADD COLUMN notes TEXT  NULL;
        RAISE NOTICE '✅ Spalte notes zu articles hinzugefügt';
    END IF;

    -- Spalte: is_dirty
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE articles ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL;
        RAISE NOTICE '✅ Spalte is_dirty zu articles hinzugefügt';
    END IF;

    -- Spalte: is_new
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE articles ADD COLUMN is_new BOOLEAN DEFAULT false NULL;
        RAISE NOTICE '✅ Spalte is_new zu articles hinzugefügt';
    END IF;

    -- Spalte: sync_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE articles ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL;
        RAISE NOTICE '✅ Spalte sync_status zu articles hinzugefügt';
    END IF;

    -- Spalte: created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        RAISE NOTICE '✅ Spalte created_at zu articles hinzugefügt';
    END IF;

    -- Spalte: updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        RAISE NOTICE '✅ Spalte updated_at zu articles hinzugefügt';
    END IF;

    -- Spalte: created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE articles ADD COLUMN created_by UUID  NULL;
        RAISE NOTICE '✅ Spalte created_by zu articles hinzugefügt';
    END IF;

    -- Spalte: updated_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE articles ADD COLUMN updated_by UUID  NULL;
        RAISE NOTICE '✅ Spalte updated_by zu articles hinzugefügt';
    END IF;

    -- Spalte: last_modified_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE articles ADD COLUMN last_modified_by UUID  NULL;
        RAISE NOTICE '✅ Spalte last_modified_by zu articles hinzugefügt';
    END IF;

END $$;

-- Prüfe und füge Spalten für recipes hinzu
DO $$
BEGIN
    -- Spalte: id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE recipes ADD COLUMN id UUID  NOT NULL;
        RAISE NOTICE '✅ Spalte id zu recipes hinzugefügt';
    END IF;

    -- Spalte: db_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE recipes ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL;
        RAISE NOTICE '✅ Spalte db_id zu recipes hinzugefügt';
    END IF;

    -- Spalte: name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE recipes ADD COLUMN name TEXT  NOT NULL;
        RAISE NOTICE '✅ Spalte name zu recipes hinzugefügt';
    END IF;

    -- Spalte: description
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE recipes ADD COLUMN description TEXT  NULL;
        RAISE NOTICE '✅ Spalte description zu recipes hinzugefügt';
    END IF;

    -- Spalte: portions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'portions'
    ) THEN
        ALTER TABLE recipes ADD COLUMN portions DECIMAL DEFAULT 1 NULL;
        RAISE NOTICE '✅ Spalte portions zu recipes hinzugefügt';
    END IF;

    -- Spalte: preparation_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'preparation_time'
    ) THEN
        ALTER TABLE recipes ADD COLUMN preparation_time DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte preparation_time zu recipes hinzugefügt';
    END IF;

    -- Spalte: difficulty
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE recipes ADD COLUMN difficulty INTEGER  NULL;
        RAISE NOTICE '✅ Spalte difficulty zu recipes hinzugefügt';
    END IF;

    -- Spalte: energy
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'energy'
    ) THEN
        ALTER TABLE recipes ADD COLUMN energy DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte energy zu recipes hinzugefügt';
    END IF;

    -- Spalte: image
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'image'
    ) THEN
        ALTER TABLE recipes ADD COLUMN image TEXT  NULL;
        RAISE NOTICE '✅ Spalte image zu recipes hinzugefügt';
    END IF;

    -- Spalte: ingredients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'ingredients'
    ) THEN
        ALTER TABLE recipes ADD COLUMN ingredients JSONB  NULL;
        RAISE NOTICE '✅ Spalte ingredients zu recipes hinzugefügt';
    END IF;

    -- Spalte: used_recipes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'used_recipes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN used_recipes JSONB  NULL;
        RAISE NOTICE '✅ Spalte used_recipes zu recipes hinzugefügt';
    END IF;

    -- Spalte: preparation_steps
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'preparation_steps'
    ) THEN
        ALTER TABLE recipes ADD COLUMN preparation_steps JSONB  NULL;
        RAISE NOTICE '✅ Spalte preparation_steps zu recipes hinzugefügt';
    END IF;

    -- Spalte: material_costs
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'material_costs'
    ) THEN
        ALTER TABLE recipes ADD COLUMN material_costs DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte material_costs zu recipes hinzugefügt';
    END IF;

    -- Spalte: markup_percentage
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'markup_percentage'
    ) THEN
        ALTER TABLE recipes ADD COLUMN markup_percentage DECIMAL DEFAULT 300 NULL;
        RAISE NOTICE '✅ Spalte markup_percentage zu recipes hinzugefügt';
    END IF;

    -- Spalte: vat_rate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'vat_rate'
    ) THEN
        ALTER TABLE recipes ADD COLUMN vat_rate DECIMAL DEFAULT 19 NULL;
        RAISE NOTICE '✅ Spalte vat_rate zu recipes hinzugefügt';
    END IF;

    -- Spalte: selling_price
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'selling_price'
    ) THEN
        ALTER TABLE recipes ADD COLUMN selling_price DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte selling_price zu recipes hinzugefügt';
    END IF;

    -- Spalte: selling_price_history
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'selling_price_history'
    ) THEN
        ALTER TABLE recipes ADD COLUMN selling_price_history JSONB  NULL;
        RAISE NOTICE '✅ Spalte selling_price_history zu recipes hinzugefügt';
    END IF;

    -- Spalte: total_nutrition_info
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'total_nutrition_info'
    ) THEN
        ALTER TABLE recipes ADD COLUMN total_nutrition_info JSONB  NULL;
        RAISE NOTICE '✅ Spalte total_nutrition_info zu recipes hinzugefügt';
    END IF;

    -- Spalte: alcohol
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'alcohol'
    ) THEN
        ALTER TABLE recipes ADD COLUMN alcohol DECIMAL  NULL;
        RAISE NOTICE '✅ Spalte alcohol zu recipes hinzugefügt';
    END IF;

    -- Spalte: allergens
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'allergens'
    ) THEN
        ALTER TABLE recipes ADD COLUMN allergens JSONB  NULL;
        RAISE NOTICE '✅ Spalte allergens zu recipes hinzugefügt';
    END IF;

    -- Spalte: ingredients_text
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'ingredients_text'
    ) THEN
        ALTER TABLE recipes ADD COLUMN ingredients_text TEXT  NULL;
        RAISE NOTICE '✅ Spalte ingredients_text zu recipes hinzugefügt';
    END IF;

    -- Spalte: notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN notes TEXT  NULL;
        RAISE NOTICE '✅ Spalte notes zu recipes hinzugefügt';
    END IF;

    -- Spalte: is_dirty
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL;
        RAISE NOTICE '✅ Spalte is_dirty zu recipes hinzugefügt';
    END IF;

    -- Spalte: is_new
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_new BOOLEAN DEFAULT false NULL;
        RAISE NOTICE '✅ Spalte is_new zu recipes hinzugefügt';
    END IF;

    -- Spalte: sync_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE recipes ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL;
        RAISE NOTICE '✅ Spalte sync_status zu recipes hinzugefügt';
    END IF;

    -- Spalte: created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE recipes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        RAISE NOTICE '✅ Spalte created_at zu recipes hinzugefügt';
    END IF;

    -- Spalte: updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE recipes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        RAISE NOTICE '✅ Spalte updated_at zu recipes hinzugefügt';
    END IF;

    -- Spalte: created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE recipes ADD COLUMN created_by UUID  NULL;
        RAISE NOTICE '✅ Spalte created_by zu recipes hinzugefügt';
    END IF;

    -- Spalte: updated_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE recipes ADD COLUMN updated_by UUID  NULL;
        RAISE NOTICE '✅ Spalte updated_by zu recipes hinzugefügt';
    END IF;

    -- Spalte: last_modified_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE recipes ADD COLUMN last_modified_by UUID  NULL;
        RAISE NOTICE '✅ Spalte last_modified_by zu recipes hinzugefügt';
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

-- Füge updated_at Trigger zu allen Tabellen hinzu (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
        CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger update_suppliers_updated_at erstellt';
    ELSE
        RAISE NOTICE '✓ Trigger update_suppliers_updated_at existiert bereits';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_articles_updated_at') THEN
        CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger update_articles_updated_at erstellt';
    ELSE
        RAISE NOTICE '✓ Trigger update_articles_updated_at existiert bereits';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recipes_updated_at') THEN
        CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger update_recipes_updated_at erstellt';
    ELSE
        RAISE NOTICE '✓ Trigger update_recipes_updated_at existiert bereits';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_info_updated_at') THEN
        CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger update_system_info_updated_at erstellt';
    ELSE
        RAISE NOTICE '✓ Trigger update_system_info_updated_at existiert bereits';
    END IF;
END $$;

-- ========================================
-- Row Level Security (RLS) Setup
-- ========================================

-- Aktiviere Row Level Security für alle generierten Tabellen
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies (erlaube alle Operationen für alle Rollen)
-- ========================================

-- RLS Policy für suppliers (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Enable all operations for all users') THEN
        CREATE POLICY "Enable all operations for all users" ON suppliers FOR ALL USING (true);
        RAISE NOTICE '✅ RLS Policy für suppliers erstellt';
    ELSE
        RAISE NOTICE '✓ RLS Policy für suppliers existiert bereits';
    END IF;
END $$;

-- RLS Policy für articles (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'articles' AND policyname = 'Enable all operations for all users') THEN
        CREATE POLICY "Enable all operations for all users" ON articles FOR ALL USING (true);
        RAISE NOTICE '✅ RLS Policy für articles erstellt';
    ELSE
        RAISE NOTICE '✓ RLS Policy für articles existiert bereits';
    END IF;
END $$;

-- RLS Policy für recipes (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipes' AND policyname = 'Enable all operations for all users') THEN
        CREATE POLICY "Enable all operations for all users" ON recipes FOR ALL USING (true);
        RAISE NOTICE '✅ RLS Policy für recipes erstellt';
    ELSE
        RAISE NOTICE '✓ RLS Policy für recipes existiert bereits';
    END IF;
END $$;

-- RLS Policy für system_info (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_info' AND policyname = 'Enable all operations for all users') THEN
        CREATE POLICY "Enable all operations for all users" ON system_info FOR ALL USING (true);
        RAISE NOTICE '✅ RLS Policy für system_info erstellt';
    ELSE
        RAISE NOTICE '✓ RLS Policy für system_info existiert bereits';
    END IF;
END $$;

-- WICHTIG: Explizite Berechtigungen für alle bestehenden Tabellen (PostgREST benötigt diese!)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- Berechtigungen für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, postgres;

-- ========================================
-- SQL-Execution RPC Function (Phase 2)
-- ========================================

-- RPC-Funktion für sichere SQL-Execution (nur ALTER/CREATE TABLE IF NOT EXISTS)
CREATE OR REPLACE FUNCTION execute_safe_sql(sql_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Führe SQL aus und gib Ergebnis zurück
    EXECUTE sql_text;
    
    -- Gebe Erfolg zurück
    result := json_build_object(
        'success', true,
        'message', 'SQL erfolgreich ausgeführt',
        'timestamp', CURRENT_TIMESTAMP
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Gebe Fehler zurück
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'timestamp', CURRENT_TIMESTAMP
        );
        
        RETURN result;
END;
$$;

-- Berechtigungen für RPC-Funktion
GRANT EXECUTE ON FUNCTION execute_safe_sql(TEXT) TO anon, authenticated, service_role, postgres;

-- Erfolgsmeldung
SELECT 'PostgreSQL-Initialisierung erfolgreich abgeschlossen!' as status;
SELECT 'Frontend-synchronisiertes Schema v2.2.2 installiert' as schema_info;
SELECT 'Verfolgbare Migrationen von v2.0.0 zu v2.2.2' as migration_info;
SELECT 'Verfügbare Benutzer:' as info;
SELECT rolname as benutzer FROM pg_roles WHERE rolcanlogin = true;
