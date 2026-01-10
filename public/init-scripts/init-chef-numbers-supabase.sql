-- Chef Numbers Database Initialization Script (Supabase)
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2026-01-09T13:47:35.298Z
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
-- Tabelle: accountingaccounts (Interface: AccountingAccount)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS accountingaccounts (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    chart_id TEXT  NULL,
    template_id TEXT  NULL,
    code TEXT  NULL,
    number TEXT  NULL,
    name TEXT  NOT NULL,
    category TEXT  NOT NULL,
    vat_tag TEXT  NULL,
    origin TEXT  NULL,
    status TEXT  NULL,
    notes TEXT  NULL,
    parent_id TEXT  NULL,
    path JSONB  NULL,
    sort_order DECIMAL  NULL,
    type TEXT  NULL,
    is_leaf BOOLEAN  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für accountingaccounts
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_id ON accountingaccounts(id);
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_sync_status ON accountingaccounts(sync_status);

-- ========================================
-- Tabelle: accountingsettings (Interface: AccountingSettings)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS accountingsettings (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    selected_chart_id TEXT  NULL,
    customizations_enabled BOOLEAN  NULL,
    ocr_api_configs TEXT  NULL,
    vat_rates TEXT  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für accountingsettings
CREATE INDEX IF NOT EXISTS idx_accountingsettings_id ON accountingsettings(id);
CREATE INDEX IF NOT EXISTS idx_accountingsettings_sync_status ON accountingsettings(sync_status);

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
    netto_prices BOOLEAN  NULL,
    recognized_names JSONB  NULL,
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
-- Tabelle: unitentitys (Interface: UnitEntity)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS unitentitys (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT  NOT NULL,
    description TEXT  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für unitentitys
CREATE INDEX IF NOT EXISTS idx_unitentitys_id ON unitentitys(id);
CREATE INDEX IF NOT EXISTS idx_unitentitys_sync_status ON unitentitys(sync_status);

-- ========================================
-- Tabelle: categoryentitys (Interface: CategoryEntity)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS categoryentitys (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT  NOT NULL,
    description TEXT  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für categoryentitys
CREATE INDEX IF NOT EXISTS idx_categoryentitys_id ON categoryentitys(id);
CREATE INDEX IF NOT EXISTS idx_categoryentitys_sync_status ON categoryentitys(sync_status);

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS articles (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT  NOT NULL,
    names_o_c_r JSONB  NULL,
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
    accounting_account_number TEXT  NULL,
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
-- Tabelle: receipts (Interface: Receipt)
-- ========================================

-- Erstelle Tabelle falls nicht vorhanden
CREATE TABLE IF NOT EXISTS receipts (
    id UUID  NOT NULL,
    db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    supplier_id UUID  NULL,
    booking_number TEXT  NULL,
    receipt_date TEXT  NULL,
    receipt_number TEXT  NULL,
    receipt_details JSONB  NULL,
    due_date TEXT  NULL,
    payment_status TEXT  NULL,
    line_item_count DECIMAL  NULL,
    accounting TEXT  NULL,
    is_completed BOOLEAN  NULL,
    notes TEXT  NULL,
    ocr_result TEXT  NULL,
    ocr_provider TEXT  NULL,
    receipt_image_path TEXT  NULL,
    processed_ocr_data TEXT  NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status sync_status_enum DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID  NULL,
    updated_by UUID  NULL,
    last_modified_by UUID  NULL
);

-- Indizes für receipts
CREATE INDEX IF NOT EXISTS idx_receipts_id ON receipts(id);
CREATE INDEX IF NOT EXISTS idx_receipts_sync_status ON receipts(sync_status);


-- ========================================
-- ALTER-Statements für alle Spalten (Idempotent)
-- Prüft jede Spalte und fügt sie hinzu, wenn sie nicht existiert
-- ========================================

-- Prüfe und füge Spalten für accountingaccounts hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'chart_id'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN chart_id TEXT  NULL ;
        RAISE NOTICE '✅ Spalte chart_id zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte chart_id existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'template_id'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN template_id TEXT  NULL ;
        RAISE NOTICE '✅ Spalte template_id zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte template_id existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'code'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN code TEXT  NULL ;
        RAISE NOTICE '✅ Spalte code zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte code existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'number'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN number TEXT  NULL ;
        RAISE NOTICE '✅ Spalte number zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte number existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN name TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte name zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte name existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN category TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte category zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte category existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'vat_tag'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN vat_tag TEXT  NULL ;
        RAISE NOTICE '✅ Spalte vat_tag zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte vat_tag existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'origin'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN origin TEXT  NULL ;
        RAISE NOTICE '✅ Spalte origin zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte origin existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN status TEXT  NULL ;
        RAISE NOTICE '✅ Spalte status zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte status existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN notes TEXT  NULL ;
        RAISE NOTICE '✅ Spalte notes zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte notes existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN parent_id TEXT  NULL ;
        RAISE NOTICE '✅ Spalte parent_id zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte parent_id existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'path'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN path JSONB  NULL ;
        RAISE NOTICE '✅ Spalte path zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte path existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN sort_order DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte sort_order zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sort_order existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN type TEXT  NULL ;
        RAISE NOTICE '✅ Spalte type zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte type existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'is_leaf'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN is_leaf BOOLEAN  NULL ;
        RAISE NOTICE '✅ Spalte is_leaf zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_leaf existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in accountingaccounts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingaccounts' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE accountingaccounts ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu accountingaccounts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in accountingaccounts';
    END IF;
END $$;

-- Prüfe und füge Spalten für accountingsettings hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'selected_chart_id'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN selected_chart_id TEXT  NULL ;
        RAISE NOTICE '✅ Spalte selected_chart_id zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte selected_chart_id existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'customizations_enabled'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN customizations_enabled BOOLEAN  NULL ;
        RAISE NOTICE '✅ Spalte customizations_enabled zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte customizations_enabled existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'ocr_api_configs'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN ocr_api_configs TEXT  NULL ;
        RAISE NOTICE '✅ Spalte ocr_api_configs zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte ocr_api_configs existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'vat_rates'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN vat_rates TEXT  NULL ;
        RAISE NOTICE '✅ Spalte vat_rates zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte vat_rates existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in accountingsettings';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accountingsettings' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE accountingsettings ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu accountingsettings hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in accountingsettings';
    END IF;
END $$;

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
        AND column_name = 'netto_prices'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN netto_prices BOOLEAN  NULL ;
        RAISE NOTICE '✅ Spalte netto_prices zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte netto_prices existiert bereits in suppliers';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'recognized_names'
    ) THEN
        ALTER TABLE suppliers ADD COLUMN recognized_names JSONB  NULL ;
        RAISE NOTICE '✅ Spalte recognized_names zu suppliers hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte recognized_names existiert bereits in suppliers';
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

-- Prüfe und füge Spalten für unitentitys hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN name TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte name zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte name existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN description TEXT  NULL ;
        RAISE NOTICE '✅ Spalte description zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte description existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in unitentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unitentitys' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE unitentitys ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu unitentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in unitentitys';
    END IF;
END $$;

-- Prüfe und füge Spalten für categoryentitys hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN name TEXT  NOT NULL ;
        RAISE NOTICE '✅ Spalte name zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte name existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN description TEXT  NULL ;
        RAISE NOTICE '✅ Spalte description zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte description existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in categoryentitys';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categoryentitys' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE categoryentitys ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu categoryentitys hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in categoryentitys';
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
        AND column_name = 'names_o_c_r'
    ) THEN
        ALTER TABLE articles ADD COLUMN names_o_c_r JSONB  NULL ;
        RAISE NOTICE '✅ Spalte names_o_c_r zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte names_o_c_r existiert bereits in articles';
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
        AND column_name = 'accounting_account_number'
    ) THEN
        ALTER TABLE articles ADD COLUMN accounting_account_number TEXT  NULL ;
        RAISE NOTICE '✅ Spalte accounting_account_number zu articles hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte accounting_account_number existiert bereits in articles';
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

-- Prüfe und füge Spalten für receipts hinzu
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE receipts ADD COLUMN id UUID  NOT NULL ;
        RAISE NOTICE '✅ Spalte id zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte id existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'db_id'
    ) THEN
        ALTER TABLE receipts ADD COLUMN db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY;
        RAISE NOTICE '✅ Spalte db_id zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte db_id existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE receipts ADD COLUMN supplier_id UUID  NULL ;
        RAISE NOTICE '✅ Spalte supplier_id zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte supplier_id existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'booking_number'
    ) THEN
        ALTER TABLE receipts ADD COLUMN booking_number TEXT  NULL ;
        RAISE NOTICE '✅ Spalte booking_number zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte booking_number existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'receipt_date'
    ) THEN
        ALTER TABLE receipts ADD COLUMN receipt_date TEXT  NULL ;
        RAISE NOTICE '✅ Spalte receipt_date zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte receipt_date existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'receipt_number'
    ) THEN
        ALTER TABLE receipts ADD COLUMN receipt_number TEXT  NULL ;
        RAISE NOTICE '✅ Spalte receipt_number zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte receipt_number existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'receipt_details'
    ) THEN
        ALTER TABLE receipts ADD COLUMN receipt_details JSONB  NULL ;
        RAISE NOTICE '✅ Spalte receipt_details zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte receipt_details existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'due_date'
    ) THEN
        ALTER TABLE receipts ADD COLUMN due_date TEXT  NULL ;
        RAISE NOTICE '✅ Spalte due_date zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte due_date existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE receipts ADD COLUMN payment_status TEXT  NULL ;
        RAISE NOTICE '✅ Spalte payment_status zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte payment_status existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'line_item_count'
    ) THEN
        ALTER TABLE receipts ADD COLUMN line_item_count DECIMAL  NULL ;
        RAISE NOTICE '✅ Spalte line_item_count zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte line_item_count existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'accounting'
    ) THEN
        ALTER TABLE receipts ADD COLUMN accounting TEXT  NULL ;
        RAISE NOTICE '✅ Spalte accounting zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte accounting existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'is_completed'
    ) THEN
        ALTER TABLE receipts ADD COLUMN is_completed BOOLEAN  NULL ;
        RAISE NOTICE '✅ Spalte is_completed zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_completed existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE receipts ADD COLUMN notes TEXT  NULL ;
        RAISE NOTICE '✅ Spalte notes zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte notes existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'ocr_result'
    ) THEN
        ALTER TABLE receipts ADD COLUMN ocr_result TEXT  NULL ;
        RAISE NOTICE '✅ Spalte ocr_result zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte ocr_result existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'ocr_provider'
    ) THEN
        ALTER TABLE receipts ADD COLUMN ocr_provider TEXT  NULL ;
        RAISE NOTICE '✅ Spalte ocr_provider zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte ocr_provider existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'receipt_image_path'
    ) THEN
        ALTER TABLE receipts ADD COLUMN receipt_image_path TEXT  NULL ;
        RAISE NOTICE '✅ Spalte receipt_image_path zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte receipt_image_path existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'processed_ocr_data'
    ) THEN
        ALTER TABLE receipts ADD COLUMN processed_ocr_data TEXT  NULL ;
        RAISE NOTICE '✅ Spalte processed_ocr_data zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte processed_ocr_data existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'is_dirty'
    ) THEN
        ALTER TABLE receipts ADD COLUMN is_dirty BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_dirty zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_dirty existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'is_new'
    ) THEN
        ALTER TABLE receipts ADD COLUMN is_new BOOLEAN DEFAULT false NULL ;
        RAISE NOTICE '✅ Spalte is_new zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte is_new existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE receipts ADD COLUMN sync_status sync_status_enum DEFAULT 'pending' NULL ;
        RAISE NOTICE '✅ Spalte sync_status zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte sync_status existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE receipts ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte created_at zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_at existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE receipts ADD COLUMN updated_at TIMESTAMP DEFAULT now() NOT NULL ;
        RAISE NOTICE '✅ Spalte updated_at zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_at existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE receipts ADD COLUMN created_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte created_by zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte created_by existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE receipts ADD COLUMN updated_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte updated_by zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte updated_by existiert bereits in receipts';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipts' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE receipts ADD COLUMN last_modified_by UUID  NULL ;
        RAISE NOTICE '✅ Spalte last_modified_by zu receipts hinzugefügt';
    ELSE
        RAISE NOTICE '✓ Spalte last_modified_by existiert bereits in receipts';
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

-- Trigger für accountingaccounts
DROP TRIGGER IF EXISTS update_accountingaccounts_updated_at ON accountingaccounts;
CREATE TRIGGER update_accountingaccounts_updated_at
    BEFORE UPDATE ON accountingaccounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für accountingsettings
DROP TRIGGER IF EXISTS update_accountingsettings_updated_at ON accountingsettings;
CREATE TRIGGER update_accountingsettings_updated_at
    BEFORE UPDATE ON accountingsettings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für suppliers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für unitentitys
DROP TRIGGER IF EXISTS update_unitentitys_updated_at ON unitentitys;
CREATE TRIGGER update_unitentitys_updated_at
    BEFORE UPDATE ON unitentitys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für categoryentitys
DROP TRIGGER IF EXISTS update_categoryentitys_updated_at ON categoryentitys;
CREATE TRIGGER update_categoryentitys_updated_at
    BEFORE UPDATE ON categoryentitys
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

-- Trigger für receipts
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
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
-- ALTER TABLE accountingaccounts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "accountingaccounts_all_access" ON accountingaccounts FOR ALL USING (true);
-- ALTER TABLE accountingsettings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "accountingsettings_all_access" ON accountingsettings FOR ALL USING (true);
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "suppliers_all_access" ON suppliers FOR ALL USING (true);
-- ALTER TABLE unitentitys ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "unitentitys_all_access" ON unitentitys FOR ALL USING (true);
-- ALTER TABLE categoryentitys ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "categoryentitys_all_access" ON categoryentitys FOR ALL USING (true);
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "articles_all_access" ON articles FOR ALL USING (true);
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "recipes_all_access" ON recipes FOR ALL USING (true);
-- ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "receipts_all_access" ON receipts FOR ALL USING (true);
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
