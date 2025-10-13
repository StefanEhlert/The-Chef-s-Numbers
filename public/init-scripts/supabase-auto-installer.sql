-- ============================================
-- SUPABASE AUTO-INSTALLER: RPC-Function
-- ============================================
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2025-10-13T15:52:59.894Z
--
-- Diese RPC-Function ermöglicht die automatische Schema-Installation
-- per REST API ohne manuelle Benutzerinteraktion!
--
-- EINMALIGE INSTALLATION:
-- Führen Sie dieses Script EINMAL manuell im SQL Editor aus.
-- 
-- AUTOMATISCHE NUTZUNG:
-- Die App kann dann per API-Call das Schema initialisieren:
-- POST https://xxxxx.supabase.co/rest/v1/rpc/initialize_chef_numbers_schema
--

-- ========================================
-- RPC-Function: Schema initialisieren/migrieren
-- ========================================

CREATE OR REPLACE FUNCTION initialize_chef_numbers_schema()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)
AS $$
DECLARE
  current_version TEXT := NULL;
  target_version TEXT := '2.2.2';
  tables_created INTEGER := 0;
  tables_migrated INTEGER := 0;
  errors_count INTEGER := 0;
  result JSON;
BEGIN
  -- Prüfe ob system_info Tabelle existiert
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_info') THEN
    -- ERSTE INSTALLATION - Erstelle alles von Grund auf
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ERSTE INSTALLATION - Erstelle Schema v%', target_version;
    RAISE NOTICE '========================================';
    
    -- 1. Erstelle Enum-Typen
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status_enum') THEN
        CREATE TYPE sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
        RAISE NOTICE '✅ Enum sync_status_enum erstellt';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Fehler bei sync_status_enum: %', SQLERRM;
      errors_count := errors_count + 1;
    END;
    
    -- 2. Erstelle system_info Tabelle
    BEGIN
      CREATE TABLE IF NOT EXISTS system_info (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
      tables_created := tables_created + 1;
      RAISE NOTICE '✅ Tabelle system_info erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei system_info: %', SQLERRM;
      errors_count := errors_count + 1;
    END;
    
    -- 3. Erstelle design Tabelle
    BEGIN
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
      tables_created := tables_created + 1;
      RAISE NOTICE '✅ Tabelle design erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei design: %', SQLERRM;
      errors_count := errors_count + 1;
    END;
    
    -- 4.1 Erstelle einkaufsitems Tabelle
    BEGIN
      CREATE TABLE IF NOT EXISTS einkaufsitems (
        db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        id UUID  NOT NULL ,
        artikel_name TEXT  NOT NULL ,
        menge DECIMAL  NULL ,
        einheit TEXT  NULL ,
        lieferant TEXT  NULL ,
        preis DECIMAL  NULL ,
        bestelldatum TIMESTAMP  NULL ,
        lieferdatum TIMESTAMP  NULL ,
        status TEXT  NULL ,
        is_dirty BOOLEAN DEFAULT false NULL ,
        is_new BOOLEAN DEFAULT false NULL ,
        sync_status sync_status_enum DEFAULT 'pending' NULL ,
        created_at TIMESTAMP DEFAULT now() NOT NULL ,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ,
        created_by UUID  NULL ,
        updated_by UUID  NULL ,
        last_modified_by UUID  NULL 
      );
      tables_created := tables_created + 1;
      RAISE NOTICE '✅ Tabelle einkaufsitems erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei einkaufsitems: %', SQLERRM;
      errors_count := errors_count + 1;
    END;

    -- Indizes für einkaufsitems
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_einkaufsitems_id ON einkaufsitems(id);
      CREATE INDEX IF NOT EXISTS idx_einkaufsitems_sync_status ON einkaufsitems(sync_status);
      RAISE NOTICE '✅ Indizes für einkaufsitems erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Fehler bei Indizes für einkaufsitems: %', SQLERRM;
    END;

    -- 4.2 Erstelle suppliers Tabelle
    BEGIN
      CREATE TABLE IF NOT EXISTS suppliers (
        db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        id UUID  NOT NULL ,
        name TEXT  NOT NULL ,
        contact_person TEXT  NULL ,
        email TEXT  NULL ,
        website TEXT  NULL ,
        address JSONB  NULL ,
        phone_numbers JSONB  NULL ,
        notes TEXT  NULL ,
        is_dirty BOOLEAN DEFAULT false NULL ,
        is_new BOOLEAN DEFAULT false NULL ,
        sync_status sync_status_enum DEFAULT 'pending' NULL ,
        created_at TIMESTAMP DEFAULT now() NOT NULL ,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ,
        created_by UUID  NULL ,
        updated_by UUID  NULL ,
        last_modified_by UUID  NULL 
      );
      tables_created := tables_created + 1;
      RAISE NOTICE '✅ Tabelle suppliers erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei suppliers: %', SQLERRM;
      errors_count := errors_count + 1;
    END;

    -- Indizes für suppliers
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_suppliers_id ON suppliers(id);
      CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON suppliers(sync_status);
      RAISE NOTICE '✅ Indizes für suppliers erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Fehler bei Indizes für suppliers: %', SQLERRM;
    END;

    -- 4.3 Erstelle articles Tabelle
    BEGIN
      CREATE TABLE IF NOT EXISTS articles (
        db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        id UUID  NOT NULL ,
        name TEXT  NOT NULL ,
        category TEXT  NOT NULL ,
        supplier_id UUID  NOT NULL ,
        supplier_article_number TEXT  NULL ,
        bundle_unit TEXT  NULL ,
        bundle_price DECIMAL  NULL ,
        bundle_ean_code TEXT  NULL ,
        content DECIMAL  NULL ,
        content_unit TEXT  NULL ,
        content_ean_code TEXT  NULL ,
        price_per_unit DECIMAL  NULL ,
        vat_rate DECIMAL DEFAULT 19 NULL ,
        allergens TEXT[]  NULL ,
        additives TEXT[]  NULL ,
        ingredients TEXT  NULL ,
        nutrition_info JSONB  NULL ,
        open_food_facts_code TEXT  NULL ,
        notes TEXT  NULL ,
        is_dirty BOOLEAN DEFAULT false NULL ,
        is_new BOOLEAN DEFAULT false NULL ,
        sync_status sync_status_enum DEFAULT 'pending' NULL ,
        created_at TIMESTAMP DEFAULT now() NOT NULL ,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ,
        created_by UUID  NULL ,
        updated_by UUID  NULL ,
        last_modified_by UUID  NULL 
      );
      tables_created := tables_created + 1;
      RAISE NOTICE '✅ Tabelle articles erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei articles: %', SQLERRM;
      errors_count := errors_count + 1;
    END;

    -- Indizes für articles
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_articles_id ON articles(id);
      CREATE INDEX IF NOT EXISTS idx_articles_sync_status ON articles(sync_status);
      RAISE NOTICE '✅ Indizes für articles erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Fehler bei Indizes für articles: %', SQLERRM;
    END;

    -- 4.4 Erstelle recipes Tabelle
    BEGIN
      CREATE TABLE IF NOT EXISTS recipes (
        db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        id UUID  NOT NULL ,
        name TEXT  NOT NULL ,
        description TEXT  NULL ,
        portions DECIMAL DEFAULT 1 NULL ,
        preparation_time DECIMAL  NULL ,
        difficulty INTEGER  NULL ,
        energy DECIMAL  NULL ,
        image TEXT  NULL ,
        ingredients JSONB  NULL ,
        used_recipes JSONB  NULL ,
        preparation_steps JSONB  NULL ,
        material_costs DECIMAL  NULL ,
        markup_percentage DECIMAL DEFAULT 300 NULL ,
        vat_rate DECIMAL DEFAULT 19 NULL ,
        selling_price DECIMAL  NULL ,
        total_nutrition_info JSONB  NULL ,
        allergens TEXT[]  NULL ,
        notes TEXT  NULL ,
        is_dirty BOOLEAN DEFAULT false NULL ,
        is_new BOOLEAN DEFAULT false NULL ,
        sync_status sync_status_enum DEFAULT 'pending' NULL ,
        created_at TIMESTAMP DEFAULT now() NOT NULL ,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ,
        created_by UUID  NULL ,
        updated_by UUID  NULL ,
        last_modified_by UUID  NULL 
      );
      tables_created := tables_created + 1;
      RAISE NOTICE '✅ Tabelle recipes erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei recipes: %', SQLERRM;
      errors_count := errors_count + 1;
    END;

    -- Indizes für recipes
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_recipes_id ON recipes(id);
      CREATE INDEX IF NOT EXISTS idx_recipes_sync_status ON recipes(sync_status);
      RAISE NOTICE '✅ Indizes für recipes erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Fehler bei Indizes für recipes: %', SQLERRM;
    END;

    -- 4.5 Erstelle inventuritems Tabelle
    BEGIN
      CREATE TABLE IF NOT EXISTS inventuritems (
        db_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
        id UUID  NOT NULL ,
        artikel_name TEXT  NOT NULL ,
        kategorie TEXT  NOT NULL ,
        soll_bestand DECIMAL  NULL ,
        ist_bestand DECIMAL  NULL ,
        einheit TEXT  NULL ,
        preis DECIMAL  NULL ,
        inventur_datum TIMESTAMP  NULL ,
        differenz DECIMAL  NULL ,
        bemerkung TEXT  NULL ,
        is_dirty BOOLEAN DEFAULT false NULL ,
        is_new BOOLEAN DEFAULT false NULL ,
        sync_status sync_status_enum DEFAULT 'pending' NULL ,
        created_at TIMESTAMP DEFAULT now() NOT NULL ,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL ,
        created_by UUID  NULL ,
        updated_by UUID  NULL ,
        last_modified_by UUID  NULL 
      );
      tables_created := tables_created + 1;
      RAISE NOTICE '✅ Tabelle inventuritems erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei inventuritems: %', SQLERRM;
      errors_count := errors_count + 1;
    END;

    -- Indizes für inventuritems
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_inventuritems_id ON inventuritems(id);
      CREATE INDEX IF NOT EXISTS idx_inventuritems_sync_status ON inventuritems(sync_status);
      RAISE NOTICE '✅ Indizes für inventuritems erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Fehler bei Indizes für inventuritems: %', SQLERRM;
    END;

    -- 5. Erstelle Trigger-Function für updated_at
    BEGIN
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $trigger$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $trigger$ language 'plpgsql';
      RAISE NOTICE '✅ Trigger-Function erstellt';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei Trigger-Function: %', SQLERRM;
      errors_count := errors_count + 1;
    END;

    -- 6. Erstelle updated_at Trigger
    BEGIN
      DROP TRIGGER IF EXISTS update_einkaufsitems_updated_at ON einkaufsitems;
      CREATE TRIGGER update_einkaufsitems_updated_at
        BEFORE UPDATE ON einkaufsitems
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN OTHERS THEN null; END;

    BEGIN
      DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
      CREATE TRIGGER update_suppliers_updated_at
        BEFORE UPDATE ON suppliers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN OTHERS THEN null; END;

    BEGIN
      DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
      CREATE TRIGGER update_articles_updated_at
        BEFORE UPDATE ON articles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN OTHERS THEN null; END;

    BEGIN
      DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
      CREATE TRIGGER update_recipes_updated_at
        BEFORE UPDATE ON recipes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN OTHERS THEN null; END;

    BEGIN
      DROP TRIGGER IF EXISTS update_inventuritems_updated_at ON inventuritems;
      CREATE TRIGGER update_inventuritems_updated_at
        BEFORE UPDATE ON inventuritems
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN OTHERS THEN null; END;

    BEGIN
      DROP TRIGGER IF EXISTS update_system_info_updated_at ON system_info;
      CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      DROP TRIGGER IF EXISTS update_design_updated_at ON design;
      CREATE TRIGGER update_design_updated_at BEFORE UPDATE ON design FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN OTHERS THEN null; END;

    -- 7. Initialisiere system_info
    BEGIN
      INSERT INTO system_info (key, value, description) VALUES
        ('schema_version', '2.2.2', 'Schema Version'),
        ('installation_date', now()::text, 'Installationsdatum'),
        ('auto_installed', 'true', 'Per RPC-Function automatisch installiert')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
      RAISE NOTICE '✅ System-Info initialisiert';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Fehler bei system_info INSERT: %', SQLERRM;
      errors_count := errors_count + 1;
    END;

  ELSE
    -- SCHEMA EXISTIERT BEREITS - Prüfe Migration
    SELECT value INTO current_version FROM system_info WHERE key = 'schema_version' LIMIT 1;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SCHEMA-MIGRATION';
    RAISE NOTICE 'Aktuelle Version: %', COALESCE(current_version, 'unbekannt');
    RAISE NOTICE 'Ziel-Version: %', target_version;
    RAISE NOTICE '========================================';
    
    IF current_version IS NULL OR current_version::DECIMAL < target_version::DECIMAL THEN
      RAISE NOTICE '🔄 Migration erforderlich';
      
      -- Hier könnten spezifische Migrationen eingefügt werden
      -- Beispiel: ALTER TABLE ... ADD COLUMN ...
      
      -- Update Schema-Version
      UPDATE system_info SET value = target_version, updated_at = now() WHERE key = 'schema_version';
      tables_migrated := tables_migrated + 1;
      RAISE NOTICE '✅ Schema auf v% migriert', target_version;
    ELSE
      RAISE NOTICE '✅ Schema ist bereits aktuell (v%)', current_version;
    END IF;
  END IF;
  
  -- Baue Ergebnis-JSON
  result := json_build_object(
    'success', true,
    'version', target_version,
    'tables_created', tables_created,
    'tables_migrated', tables_migrated,
    'errors_count', errors_count,
    'message', CASE
      WHEN tables_created > 0 THEN 'Schema v' || target_version || ' erfolgreich installiert! ' || tables_created::text || ' Tabellen erstellt.'
      WHEN tables_migrated > 0 THEN 'Schema auf v' || target_version || ' migriert!'
      ELSE 'Schema ist bereits aktuell (v' || target_version || ')'
    END,
    'timestamp', now()
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Schema-Installation fehlgeschlagen: ' || SQLERRM,
      'timestamp', now()
    );
END;
$$;

-- ========================================
-- FERTIG!
-- ========================================
-- 
-- Die RPC-Function ist jetzt installiert!
-- 
-- Die App kann sie nun per API aufrufen:
-- POST /rest/v1/rpc/initialize_chef_numbers_schema
-- 
-- Die Function:
-- - Erkennt automatisch ob Neu-Installation oder Migration
-- - Erstellt alle benötigten Tabellen
-- - Führt Migrationen durch (falls nötig)
-- - Gibt detailliertes JSON-Ergebnis zurück
-- 
-- ========================================
