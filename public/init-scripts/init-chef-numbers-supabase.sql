-- Chef Numbers Database Initialization Script (Supabase)
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2025-10-13T15:52:59.888Z
-- 
-- WICHTIG: Dieses Script ist für Supabase Cloud optimiert
-- - Verwendet UUIDs als Primary Keys
-- - Beinhaltet RLS (Row Level Security) Policies
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

-- Design-Tabelle
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
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ========================================
-- Haupt-Tabellen
-- ========================================

-- Tabelle: einkaufsitems
CREATE TABLE IF NOT EXISTS einkaufsitems (
db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
id UUID  NOT NULL,
artikel_name TEXT  NOT NULL,
menge DECIMAL  NULL,
einheit TEXT  NULL,
lieferant TEXT  NULL,
preis DECIMAL  NULL,
bestelldatum TIMESTAMP  NULL,
lieferdatum TIMESTAMP  NULL,
status TEXT  NULL,
is_dirty BOOLEAN DEFAULT false NULL,
is_new BOOLEAN DEFAULT false NULL,
sync_status sync_status_enum DEFAULT 'pending' NULL,
created_at TIMESTAMP DEFAULT now() NOT NULL,
updated_at TIMESTAMP  NOT NULL,
created_by UUID  NULL,
updated_by UUID  NULL,
last_modified_by UUID  NULL
);

-- Indizes für einkaufsitems
CREATE INDEX IF NOT EXISTS idx_einkaufsitems_id ON einkaufsitems(id);
CREATE INDEX IF NOT EXISTS idx_einkaufsitems_sync_status ON einkaufsitems(sync_status);

-- Tabelle: suppliers
CREATE TABLE IF NOT EXISTS suppliers (
db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
id UUID  NOT NULL,
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
updated_at TIMESTAMP  NOT NULL,
created_by UUID  NULL,
updated_by UUID  NULL,
last_modified_by UUID  NULL
);

-- Indizes für suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_id ON suppliers(id);
CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON suppliers(sync_status);

-- Tabelle: articles
CREATE TABLE IF NOT EXISTS articles (
db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
id UUID  NOT NULL,
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
allergens TEXT[]  NULL,
additives TEXT[]  NULL,
ingredients TEXT  NULL,
nutrition_info JSONB  NULL,
open_food_facts_code TEXT  NULL,
notes TEXT  NULL,
is_dirty BOOLEAN DEFAULT false NULL,
is_new BOOLEAN DEFAULT false NULL,
sync_status sync_status_enum DEFAULT 'pending' NULL,
created_at TIMESTAMP DEFAULT now() NOT NULL,
updated_at TIMESTAMP  NOT NULL,
created_by UUID  NULL,
updated_by UUID  NULL,
last_modified_by UUID  NULL
);

-- Indizes für articles
CREATE INDEX IF NOT EXISTS idx_articles_id ON articles(id);
CREATE INDEX IF NOT EXISTS idx_articles_sync_status ON articles(sync_status);

-- Tabelle: recipes
CREATE TABLE IF NOT EXISTS recipes (
db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
id UUID  NOT NULL,
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
total_nutrition_info JSONB  NULL,
allergens TEXT[]  NULL,
notes TEXT  NULL,
is_dirty BOOLEAN DEFAULT false NULL,
is_new BOOLEAN DEFAULT false NULL,
sync_status sync_status_enum DEFAULT 'pending' NULL,
created_at TIMESTAMP DEFAULT now() NOT NULL,
updated_at TIMESTAMP  NOT NULL,
created_by UUID  NULL,
updated_by UUID  NULL,
last_modified_by UUID  NULL
);

-- Indizes für recipes
CREATE INDEX IF NOT EXISTS idx_recipes_id ON recipes(id);
CREATE INDEX IF NOT EXISTS idx_recipes_sync_status ON recipes(sync_status);

-- Tabelle: inventuritems
CREATE TABLE IF NOT EXISTS inventuritems (
db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
id UUID  NOT NULL,
artikel_name TEXT  NOT NULL,
kategorie TEXT  NOT NULL,
soll_bestand DECIMAL  NULL,
ist_bestand DECIMAL  NULL,
einheit TEXT  NULL,
preis DECIMAL  NULL,
inventur_datum TIMESTAMP  NULL,
differenz DECIMAL  NULL,
bemerkung TEXT  NULL,
is_dirty BOOLEAN DEFAULT false NULL,
is_new BOOLEAN DEFAULT false NULL,
sync_status sync_status_enum DEFAULT 'pending' NULL,
created_at TIMESTAMP DEFAULT now() NOT NULL,
updated_at TIMESTAMP  NOT NULL,
created_by UUID  NULL,
updated_by UUID  NULL,
last_modified_by UUID  NULL
);

-- Indizes für inventuritems
CREATE INDEX IF NOT EXISTS idx_inventuritems_id ON inventuritems(id);
CREATE INDEX IF NOT EXISTS idx_inventuritems_sync_status ON inventuritems(sync_status);

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

-- Trigger für einkaufsitems
DROP TRIGGER IF EXISTS update_einkaufsitems_updated_at ON einkaufsitems;
CREATE TRIGGER update_einkaufsitems_updated_at
    BEFORE UPDATE ON einkaufsitems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger für inventuritems
DROP TRIGGER IF EXISTS update_inventuritems_updated_at ON inventuritems;
CREATE TRIGGER update_inventuritems_updated_at
    BEFORE UPDATE ON inventuritems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für system_info
DROP TRIGGER IF EXISTS update_system_info_updated_at ON system_info;
CREATE TRIGGER update_system_info_updated_at
    BEFORE UPDATE ON system_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für design
DROP TRIGGER IF EXISTS update_design_updated_at ON design;
CREATE TRIGGER update_design_updated_at
    BEFORE UPDATE ON design
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- System-Informationen initialisieren
INSERT INTO system_info (key, value, description) VALUES
    ('schema_version', '2.2.2', 'Frontend-synchronisiertes Schema Version'),
    ('installation_date', now()::text, 'Datum der Schema-Installation'),
    ('last_migration', now()::text, 'Datum der letzten Migration')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

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
-- ALTER TABLE einkaufsitems ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "einkaufsitems_all_access" ON einkaufsitems FOR ALL USING (true);
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "suppliers_all_access" ON suppliers FOR ALL USING (true);
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "articles_all_access" ON articles FOR ALL USING (true);
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "recipes_all_access" ON recipes FOR ALL USING (true);
-- ALTER TABLE inventuritems ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "inventuritems_all_access" ON inventuritems FOR ALL USING (true);

-- ========================================
-- Schema-Initialisierung abgeschlossen
-- Version: 2.2.2
-- ========================================
-- 
-- NÄCHSTE SCHRITTE:
-- 1. Erstellen Sie den Storage Bucket "chef-numbers-images" im Dashboard
-- 2. Aktivieren Sie RLS Policies wenn gewünscht
-- 3. Testen Sie die Verbindung in Ihrer App
-- 
