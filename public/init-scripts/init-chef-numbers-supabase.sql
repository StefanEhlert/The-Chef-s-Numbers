-- Chef Numbers Database Initialization Script (Supabase)
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2025-11-03T01:06:18.478Z
-- 
-- WICHTIG: Dieses Script ist für Supabase Cloud optimiert
-- - Verwendet UUIDs als Primary Keys
-- - Beinhaltet idempotente Schema-Updates
-- - Storage Bucket für Bilder wird separat erstellt

-- ========================================
-- Enum-Typen
-- ========================================

-- Enum für Sync-Status
DO $$ BEGIN
    CREATE TYPE sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- System-Tabellen (ZUERST erstellen!)
-- ========================================

-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Design-Tabelle (NICHT ERSTELLEN - wird nur in LocalStorage verwendet)
-- CREATE TABLE IF NOT EXISTS design (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     theme TEXT DEFAULT 'light',
--     primary_color TEXT DEFAULT '#007bff',
--     secondary_color TEXT DEFAULT '#6c757d',
--     accent_color TEXT DEFAULT '#28a745',
--     background_color TEXT DEFAULT '#ffffff',
--     text_color TEXT DEFAULT '#212529',
--     card_color TEXT DEFAULT '#f8f9fa',
--     border_color TEXT DEFAULT '#dee2e6',
--     created_at TIMESTAMP DEFAULT now(),
--     updated_at TIMESTAMP DEFAULT now()
-- );

-- ========================================
-- Haupt-Tabellen
-- ========================================

-- ========================================
-- Tabelle: suppliers (Interface: Supplier)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT  NOT NULL,
    contact_person TEXT  NULL,
    email TEXT  NULL,
    website TEXT  NULL,
    address JSONB  NULL,
    phone_numbers JSONB  NULL,
    notes TEXT  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_id ON suppliers(id);
CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON suppliers(sync_status);

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS articles (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT  NOT NULL,
    category TEXT  NOT NULL,
    supplier_id UUID  NOT NULL,
    supplier_article_number TEXT  NULL,
    bundle_unit TEXT  NULL,
    bundle_price DECIMAL  NULL,
    bundle_ean_code TEXT  NULL,
    content DECIMAL  NULL,
    content_unit TEXT  NULL,
    content_ean_code TEXT  NULL,
    price_per_unit DECIMAL  NULL,
    vat_rate DECIMAL DEFAULT 19 NULL,
    allergens JSONB  NULL,
    additives JSONB  NULL,
    ingredients TEXT  NULL,
    nutrition_info JSONB  NULL,
    alcohol DECIMAL  NULL,
    open_food_facts_code TEXT  NULL,
    price_per_unit_history JSONB  NULL,
    notes TEXT  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für articles
CREATE INDEX IF NOT EXISTS idx_articles_id ON articles(id);
CREATE INDEX IF NOT EXISTS idx_articles_sync_status ON articles(sync_status);
CREATE INDEX IF NOT EXISTS idx_articles_supplier_id ON articles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- ========================================
-- Tabelle: recipes (Interface: Recipe)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS recipes (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT  NOT NULL,
    description TEXT  NULL,
    portions DECIMAL DEFAULT 1 NULL,
    preparation_time DECIMAL  NULL,
    difficulty INTEGER  NULL,
    energy DECIMAL  NULL,
    image TEXT  NULL,
    ingredients JSONB  NULL,
    used_recipes JSONB  NULL,
    preparation_steps JSONB  NULL,
    material_costs DECIMAL  NULL,
    markup_percentage DECIMAL DEFAULT 300 NULL,
    vat_rate DECIMAL DEFAULT 19 NULL,
    selling_price DECIMAL  NULL,
    selling_price_history JSONB  NULL,
    total_nutrition_info JSONB  NULL,
    alcohol DECIMAL  NULL,
    allergens JSONB  NULL,
    ingredients_text TEXT  NULL,
    notes TEXT  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für recipes
CREATE INDEX IF NOT EXISTS idx_recipes_id ON recipes(id);
CREATE INDEX IF NOT EXISTS idx_recipes_sync_status ON recipes(sync_status);


-- ========================================
-- ALTER-Statements für alle Spalten (Idempotent)
-- Prüft jede Spalte und fügt sie hinzu, wenn sie nicht existiert
-- ========================================

-- Prüfe und füge Spalten für suppliers hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN name TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte name zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte name existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'contact_person'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN contact_person TEXT  NULL ;
        RAISE NOTICE '✅ Spalte contact_person zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte contact_person existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN email TEXT  NULL ;
        RAISE NOTICE '✅ Spalte email zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte email existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN website TEXT  NULL ;
        RAISE NOTICE '✅ Spalte website zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte website existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN address JSONB  NULL ;
        RAISE NOTICE '✅ Spalte address zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte address existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'phone_numbers'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN phone_numbers JSONB  NULL ;
        RAISE NOTICE '✅ Spalte phone_numbers zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte phone_numbers existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN notes TEXT  NULL ;
        RAISE NOTICE '✅ Spalte notes zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte notes existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in suppliers';
    END IF;
END $$;

-- Prüfe und füge Spalten für articles hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE articles ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE articles ADD COLUMN name TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte name zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte name existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE articles ADD COLUMN category TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte category zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte category existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN supplier_id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte supplier_id zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte supplier_id existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'supplier_article_number'
    ) THEN
        ALTER TABLE articles ADD COLUMN supplier_article_number TEXT  NULL ;
        RAISE NOTICE '✅ Spalte supplier_article_number zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte supplier_article_number existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'bundle_unit'
    ) THEN
        ALTER TABLE articles ADD COLUMN bundle_unit TEXT  NULL ;
        RAISE NOTICE '✅ Spalte bundle_unit zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte bundle_unit existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'bundle_price'
    ) THEN
        ALTER TABLE articles ADD COLUMN bundle_price DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte bundle_price zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte bundle_price existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'bundle_ean_code'
    ) THEN
        ALTER TABLE articles ADD COLUMN bundle_ean_code TEXT  NULL ;
        RAISE NOTICE '✅ Spalte bundle_ean_code zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte bundle_ean_code existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'content'
    ) THEN
        ALTER TABLE articles ADD COLUMN content DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte content zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte content existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'content_unit'
    ) THEN
        ALTER TABLE articles ADD COLUMN content_unit TEXT  NULL ;
        RAISE NOTICE '✅ Spalte content_unit zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte content_unit existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'content_ean_code'
    ) THEN
        ALTER TABLE articles ADD COLUMN content_ean_code TEXT  NULL ;
        RAISE NOTICE '✅ Spalte content_ean_code zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte content_ean_code existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'price_per_unit'
    ) THEN
        ALTER TABLE articles ADD COLUMN price_per_unit DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte price_per_unit zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte price_per_unit existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'vat_rate'
    ) THEN
        ALTER TABLE articles ADD COLUMN vat_rate DECIMAL DEFAULT 19 NULL ;
        RAISE NOTICE '✅ Spalte vat_rate zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte vat_rate existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'allergens'
    ) THEN
        ALTER TABLE articles ADD COLUMN allergens JSONB  NULL ;
        RAISE NOTICE '✅ Spalte allergens zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte allergens existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'additives'
    ) THEN
        ALTER TABLE articles ADD COLUMN additives JSONB  NULL ;
        RAISE NOTICE '✅ Spalte additives zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte additives existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'ingredients'
    ) THEN
        ALTER TABLE articles ADD COLUMN ingredients TEXT  NULL ;
        RAISE NOTICE '✅ Spalte ingredients zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte ingredients existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'nutrition_info'
    ) THEN
        ALTER TABLE articles ADD COLUMN nutrition_info JSONB  NULL ;
        RAISE NOTICE '✅ Spalte nutrition_info zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte nutrition_info existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'alcohol'
    ) THEN
        ALTER TABLE articles ADD COLUMN alcohol DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte alcohol zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte alcohol existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'open_food_facts_code'
    ) THEN
        ALTER TABLE articles ADD COLUMN open_food_facts_code TEXT  NULL ;
        RAISE NOTICE '✅ Spalte open_food_facts_code zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte open_food_facts_code existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'price_per_unit_history'
    ) THEN
        ALTER TABLE articles ADD COLUMN price_per_unit_history JSONB  NULL ;
        RAISE NOTICE '✅ Spalte price_per_unit_history zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte price_per_unit_history existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE articles ADD COLUMN notes TEXT  NULL ;
        RAISE NOTICE '✅ Spalte notes zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte notes existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE articles ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE articles ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE articles ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE articles ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE articles ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in articles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE articles ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in articles';
    END IF;
END $$;

-- Prüfe und füge Spalten für recipes hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE recipes ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE recipes ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE recipes ADD COLUMN name TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte name zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte name existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE recipes ADD COLUMN description TEXT  NULL ;
        RAISE NOTICE '✅ Spalte description zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte description existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'portions'
    ) THEN
        ALTER TABLE recipes ADD COLUMN portions DECIMAL DEFAULT 1 NULL ;
        RAISE NOTICE '✅ Spalte portions zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte portions existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'preparation_time'
    ) THEN
        ALTER TABLE recipes ADD COLUMN preparation_time DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte preparation_time zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte preparation_time existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE recipes ADD COLUMN difficulty INTEGER  NULL ;
        RAISE NOTICE '✅ Spalte difficulty zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte difficulty existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'energy'
    ) THEN
        ALTER TABLE recipes ADD COLUMN energy DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte energy zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte energy existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'image'
    ) THEN
        ALTER TABLE recipes ADD COLUMN image TEXT  NULL ;
        RAISE NOTICE '✅ Spalte image zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte image existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'ingredients'
    ) THEN
        ALTER TABLE recipes ADD COLUMN ingredients JSONB  NULL ;
        RAISE NOTICE '✅ Spalte ingredients zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte ingredients existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'used_recipes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN used_recipes JSONB  NULL ;
        RAISE NOTICE '✅ Spalte used_recipes zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte used_recipes existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'preparation_steps'
    ) THEN
        ALTER TABLE recipes ADD COLUMN preparation_steps JSONB  NULL ;
        RAISE NOTICE '✅ Spalte preparation_steps zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte preparation_steps existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'material_costs'
    ) THEN
        ALTER TABLE recipes ADD COLUMN material_costs DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte material_costs zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte material_costs existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'markup_percentage'
    ) THEN
        ALTER TABLE recipes ADD COLUMN markup_percentage DECIMAL DEFAULT 300 NULL ;
        RAISE NOTICE '✅ Spalte markup_percentage zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte markup_percentage existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'vat_rate'
    ) THEN
        ALTER TABLE recipes ADD COLUMN vat_rate DECIMAL DEFAULT 19 NULL ;
        RAISE NOTICE '✅ Spalte vat_rate zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte vat_rate existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'selling_price'
    ) THEN
        ALTER TABLE recipes ADD COLUMN selling_price DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte selling_price zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte selling_price existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'selling_price_history'
    ) THEN
        ALTER TABLE recipes ADD COLUMN selling_price_history JSONB  NULL ;
        RAISE NOTICE '✅ Spalte selling_price_history zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte selling_price_history existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'total_nutrition_info'
    ) THEN
        ALTER TABLE recipes ADD COLUMN total_nutrition_info JSONB  NULL ;
        RAISE NOTICE '✅ Spalte total_nutrition_info zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte total_nutrition_info existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'alcohol'
    ) THEN
        ALTER TABLE recipes ADD COLUMN alcohol DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte alcohol zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte alcohol existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'allergens'
    ) THEN
        ALTER TABLE recipes ADD COLUMN allergens JSONB  NULL ;
        RAISE NOTICE '✅ Spalte allergens zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte allergens existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'ingredients_text'
    ) THEN
        ALTER TABLE recipes ADD COLUMN ingredients_text TEXT  NULL ;
        RAISE NOTICE '✅ Spalte ingredients_text zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte ingredients_text existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN notes TEXT  NULL ;
        RAISE NOTICE '✅ Spalte notes zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte notes existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE recipes ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE recipes ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE recipes ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE recipes ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE recipes ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in recipes';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE recipes ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu recipes hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in recipes';
    END IF;
END $$;

-- ========================================
-- Trigger für automatisches updated_at
-- ========================================

-- Funktion für updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für suppliers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für articles
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für recipes
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für system_info
DROP TRIGGER IF EXISTS update_system_info_updated_at ON system_info;
CREATE TRIGGER update_system_info_updated_at
    BEFORE UPDATE ON system_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- System-Informationen initialisieren
INSERT INTO system_info (key, value, description) VALUES
    ('schema_version', '2.2.2', 'Frontend-synchronisiertes Schema Version'),
    ('installation_date', now()::text, 'Datum der Schema-Installation'),
    ('last_update', now()::text, 'Datum der letzten Schema-Aktualisierung'),
    ('idempotent_updates', 'true', 'Schema-Updates sind idempotent - keine Versionsprüfung nötig')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

-- ========================================
-- Dynamische RPC-Functions für Schema-Updates
-- ========================================

-- RPC-Function: Dynamische Tabellen-Erstellung
CREATE OR REPLACE FUNCTION create_table_dynamic(table_sql TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)
AS $$
DECLARE
  result JSON;
  table_name TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DYNAMISCHE TABELLEN-ERSTELLUNG';
  RAISE NOTICE '========================================';
  
  -- Extrahiere Tabellennamen aus SQL (vereinfacht)
  -- Suche nach "CREATE TABLE [IF NOT EXISTS] table_name"
  table_name := regexp_replace(table_sql, '.*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+).*', '\1', 'gi');
  
  RAISE NOTICE '🔧 Erstelle Tabelle: %', table_name;
  RAISE NOTICE '📝 SQL: %', table_sql;
  
  BEGIN
    -- Führe das SQL aus
    EXECUTE table_sql;
    
    RAISE NOTICE '✅ Tabelle % erfolgreich erstellt', table_name;
    
    result := json_build_object(
      'success', true,
      'table_name', table_name,
      'message', 'Tabelle ' || table_name || ' erfolgreich erstellt',
      'timestamp', now()
    );
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Fehler beim Erstellen der Tabelle %: %', table_name, SQLERRM;
    
    result := json_build_object(
      'success', false,
      'table_name', table_name,
      'error', SQLERRM,
      'message', 'Fehler beim Erstellen der Tabelle ' || table_name || ': ' || SQLERRM,
      'timestamp', now()
    );
  END;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Dynamische Tabellen-Erstellung fehlgeschlagen: ' || SQLERRM,
      'timestamp', now()
    );
END;
$$;

-- RPC-Function: SQL ausführen
CREATE OR REPLACE FUNCTION execute_sql_dynamic(sql_statement TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)
AS $$
DECLARE
  result JSON;
  affected_rows INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DYNAMISCHE SQL-AUSFÜHRUNG';
  RAISE NOTICE '========================================';
  
  RAISE NOTICE '📝 SQL: %', sql_statement;
  
  BEGIN
    -- Führe das SQL aus
    EXECUTE sql_statement;
    
    -- Versuche die Anzahl der betroffenen Zeilen zu ermitteln
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RAISE NOTICE '✅ SQL erfolgreich ausgeführt (betroffene Zeilen: %)', affected_rows;
    
    result := json_build_object(
      'success', true,
      'affected_rows', affected_rows,
      'message', 'SQL erfolgreich ausgeführt',
      'timestamp', now()
    );
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Fehler bei SQL-Ausführung: %', SQLERRM;
    
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Fehler bei SQL-Ausführung: ' || SQLERRM,
      'timestamp', now()
    );
  END;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Dynamische SQL-Ausführung fehlgeschlagen: ' || SQLERRM,
      'timestamp', now()
    );
END;
$$;

-- RPC-Function: Idempotentes Schema-Update
CREATE OR REPLACE FUNCTION update_schema_idempotent()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)
AS $$
DECLARE
  result JSON;
  target_version TEXT := '2.2.2';
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IDEMPOTENTES SCHEMA-UPDATE';
  RAISE NOTICE '========================================';
  
  RAISE NOTICE '🎯 Ziel-Version: %', target_version;
  RAISE NOTICE '🔄 Führe idempotente Schema-Updates durch...';
  
  -- Das komplette Init-Script ist bereits idempotent
  -- Es erstellt nur fehlende Tabellen/Spalten
  -- Keine Versionsprüfung nötig!
  
  -- Update System-Info
  INSERT INTO system_info (key, value, description) VALUES
    ('schema_version', target_version, 'Schema Version'),
    ('last_idempotent_update', now()::text, 'Letztes idempotentes Schema-Update'),
    ('idempotent_system', 'active', 'Idempotentes Schema-System ist aktiv')
  ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value, 
    updated_at = now();
  
  result := json_build_object(
    'success', true,
    'target_version', target_version,
    'message', 'Idempotentes Schema-Update erfolgreich durchgeführt (v' || target_version || ')',
    'idempotent', true,
    'timestamp', now()
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Idempotentes Schema-Update fehlgeschlagen: ' || SQLERRM,
      'timestamp', now()
    );
END;
$$;

-- ========================================
-- Storage Bucket für Bilder
-- ========================================
-- WICHTIG: Storage Buckets werden über das Supabase Dashboard erstellt
-- Oder verwenden Sie die Supabase JS Client API
-- 
-- Bucket-Name: chef-numbers-images
-- Public: true (für Bildanzeige)
-- File Size Limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- 
-- Erstellen Sie den Bucket manuell im Supabase Dashboard:
-- Storage → Create a new bucket → Name: "chef-numbers-images"

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================
-- HINWEIS: RLS ist standardmäßig DEAKTIVIERT
-- Für Production empfohlen: RLS aktivieren
-- Aktivieren Sie RLS nach Bedarf:
-- ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY <policy_name> ON <table_name> ...

-- Beispiel: Alle Zugriffe erlauben (für Service Role)
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "suppliers_all_access" ON suppliers FOR ALL USING (true);
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "articles_all_access" ON articles FOR ALL USING (true);
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "recipes_all_access" ON recipes FOR ALL USING (true);
-- ========================================
-- Schema-Initialisierung abgeschlossen
-- Version: 2.2.2
-- ========================================
-- 
-- VERFÜGBARE RPC-FUNCTIONS:
-- 1. create_table_dynamic(table_sql) - Erstellt eine Tabelle dynamisch
-- 2. execute_sql_dynamic(sql_statement) - Führt beliebiges SQL aus
-- 3. update_schema_idempotent() - Führt idempotente Schema-Updates durch
-- 
-- API-AUFRUFE:
-- POST /rest/v1/rpc/create_table_dynamic
-- POST /rest/v1/rpc/execute_sql_dynamic  
-- POST /rest/v1/rpc/update_schema_idempotent
-- 
-- IDEMPOTENTES SYSTEM:
-- ✅ Alle Tabellen-Erstellungen sind idempotent (CREATE TABLE IF NOT EXISTS)
-- ✅ Alle Spalten-Hinzufügungen sind idempotent (prüfen auf Existenz)
-- ✅ Alle Indizes sind idempotent (CREATE INDEX IF NOT EXISTS)
-- ✅ Keine Versionsprüfung nötig - einfach Script ausführen!
-- 
-- NÄCHSTE SCHRITTE:
-- 1. Erstellen Sie den Storage Bucket "chef-numbers-images" im Dashboard
-- 2. Aktivieren Sie RLS Policies wenn gewünscht
-- 3. Testen Sie die Verbindung in Ihrer App
-- 4. Bei Schema-Änderungen: Führen Sie das komplette Script erneut aus!
-- 
