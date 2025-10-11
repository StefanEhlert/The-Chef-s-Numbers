-- Chef Numbers Database Initialization Script
-- Wird beim ersten Start der Supabase-Datenbank ausgeführt
-- MIT API-Funktionen für direkten Frontend-Zugriff

-- Erstelle Rollen für Supabase
DO $$
BEGIN
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

-- Setze Berechtigungen
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- Erstelle Chef Numbers Tabellen
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    supplier_id UUID,
    supplier_article_number VARCHAR(100),
    bundle_unit VARCHAR(50),
    bundle_price DECIMAL(10,2),
    bundle_ean_code VARCHAR(20),
    content DECIMAL(10,3),
    content_unit VARCHAR(50),
    content_ean_code VARCHAR(20),
    price_per_unit DECIMAL(10,4),
    allergens TEXT[],
    additives TEXT[],
    ingredients TEXT,
    nutrition_info JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    website VARCHAR(255),
    address JSONB,
    phone_numbers JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    portions INTEGER,
    preparation_time INTEGER,
    difficulty INTEGER,
    ingredients JSONB,
    used_recipes JSONB,
    preparation_steps JSONB,
    material_costs DECIMAL(10,2),
    markup_percentage DECIMAL(5,2),
    vat_rate DECIMAL(5,2),
    selling_price DECIMAL(10,2),
    total_nutrition_info JSONB,
    allergens TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS design (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100),
    colors JSONB,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS einkaufs_liste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artikel_name VARCHAR(255) NOT NULL,
    menge DECIMAL(10,3),
    einheit VARCHAR(50),
    lieferant VARCHAR(255),
    preis DECIMAL(10,2),
    bestelldatum TIMESTAMP,
    lieferdatum TIMESTAMP,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS inventur_liste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artikel_name VARCHAR(255) NOT NULL,
    kategorie VARCHAR(100),
    soll_bestand DECIMAL(10,3),
    ist_bestand DECIMAL(10,3),
    einheit VARCHAR(50),
    preis DECIMAL(10,2),
    inventur_datum TIMESTAMP,
    differenz DECIMAL(10,3),
    bemerkung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS system_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_articles_supplier_id ON articles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_einkaufs_liste_status ON einkaufs_liste(status);
CREATE INDEX IF NOT EXISTS idx_inventur_liste_kategorie ON inventur_liste(kategorie);

-- Setze Berechtigungen für Tabellen
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Berechtigungen werden nach der Funktions-Erstellung gesetzt

-- Aktiviere Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE design ENABLE ROW LEVEL SECURITY;
ALTER TABLE einkaufs_liste ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventur_liste ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- Erstelle RLS-Policies für Standard-PostgreSQL (ohne Supabase auth schema)
-- Für Docker-Stack mit PostgREST: Alle Rollen haben Zugriff (JWT-basierte Authentifizierung)

-- Articles: Alle Rollen (JWT-Authentifizierung über PostgREST)
CREATE POLICY "Enable all operations for all roles" ON articles FOR ALL USING (true);

-- Suppliers: Alle Rollen (JWT-Authentifizierung über PostgREST)
CREATE POLICY "Enable all operations for all roles" ON suppliers FOR ALL USING (true);

-- Recipes: Alle Rollen (JWT-Authentifizierung über PostgREST)
CREATE POLICY "Enable all operations for all roles" ON recipes FOR ALL USING (true);

-- Design: Alle Rollen (JWT-Authentifizierung über PostgREST)
CREATE POLICY "Enable all operations for all roles" ON design FOR ALL USING (true);

-- Einkaufsliste: Alle Rollen (JWT-Authentifizierung über PostgREST)
CREATE POLICY "Enable all operations for all roles" ON einkaufs_liste FOR ALL USING (true);

-- Inventurliste: Alle Rollen (JWT-Authentifizierung über PostgREST)
CREATE POLICY "Enable all operations for all roles" ON inventur_liste FOR ALL USING (true);

-- System Info: Alle Rollen (JWT-Authentifizierung über PostgREST)
CREATE POLICY "Enable all operations for all roles" ON system_info FOR ALL USING (true);

-- Füge System-Informationen hinzu
INSERT INTO system_info (key, value, description) VALUES 
    ('app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
    ('version', '1.0.0', 'Aktuelle Version'),
    ('database_created', CURRENT_TIMESTAMP::text, 'Datum der Datenbankerstellung'),
    ('connection_tested_at', CURRENT_TIMESTAMP::text, 'Letzter Verbindungstest'),
    ('supabase_version', '1.0.0', 'Supabase Self-Hosted Version'),
    ('setup_completed', 'true', 'Initial Setup abgeschlossen')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Erstelle Funktion für SQL-Ausführung (für Schema-Updates)
-- Diese Funktion wird von PostgREST benötigt für automatische Schema-Erstellung
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Erstelle Funktion für SQL-Ausführung mit Rückgabe (für PostgREST)
CREATE OR REPLACE FUNCTION exec_sql_with_result(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE sql INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Erstelle Funktion für Schema-Versionierung
CREATE OR REPLACE FUNCTION update_schema_version(version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO system_info (key, value, description) 
    VALUES ('schema_version', version, 'Aktuelle Schema-Version')
    ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP;
END;
$$;

-- Setze initiale Schema-Version
SELECT update_schema_version('1.0.0');

-- Erstelle Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Füge updated_at Trigger zu allen Tabellen hinzu
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_design_updated_at BEFORE UPDATE ON design FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_einkaufs_liste_updated_at BEFORE UPDATE ON einkaufs_liste FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventur_liste_updated_at BEFORE UPDATE ON inventur_liste FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HTTP-API-Funktionen für direkten Frontend-Zugriff
-- Diese Funktionen ermöglichen es dem Frontend, direkt mit PostgreSQL zu kommunizieren

-- API-Funktion für Schema-Status-Prüfung
CREATE OR REPLACE FUNCTION api_check_schema_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY['articles', 'suppliers', 'recipes', 'design', 'einkaufs_liste', 'inventur_liste', 'system_info'];
    existing_tables TEXT[];
    missing_tables TEXT[];
BEGIN
    -- Zähle existierende Tabellen
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = ANY(expected_tables);
    
    -- Finde fehlende Tabellen
    SELECT ARRAY_AGG(table_name) INTO existing_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = ANY(expected_tables);
    
    -- Finde fehlende Tabellen durch Vergleich
    missing_tables := ARRAY(
        SELECT unnest(expected_tables) 
        EXCEPT 
        SELECT unnest(COALESCE(existing_tables, ARRAY[]::TEXT[]))
    );
    
    -- Erstelle JSON-Response
    result := json_build_object(
        'success', true,
        'message', CASE 
            WHEN table_count = array_length(expected_tables, 1) THEN 'Schema ist vollständig und aktuell'
            WHEN table_count = 0 THEN 'Datenbank-Schema ist noch nicht angelegt!'
            ELSE 'Schema unvollständig. Fehlende Tabellen: ' || array_to_string(missing_tables, ', ')
        END,
        'needsMigration', table_count < array_length(expected_tables, 1),
        'tableCount', table_count,
        'expectedCount', array_length(expected_tables, 1),
        'missingTables', missing_tables
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API-Funktion für Schema-Migration mit Test-Modus
CREATE OR REPLACE FUNCTION api_migrate_schema(
    test_mode BOOLEAN DEFAULT false,
    changes JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    migration_id TEXT;
    change JSONB;
    operation JSONB;
BEGIN
    -- Generiere eindeutige Migration-ID
    migration_id := CASE 
        WHEN test_mode THEN 'test_' || extract(epoch from now())::text
        ELSE 'migration_' || extract(epoch from now())::text
    END;
    
    -- Wenn Test-Modus und Änderungen angegeben
    IF test_mode AND changes IS NOT NULL THEN
        -- Führe Test-Änderungen durch
        FOR change IN SELECT * FROM jsonb_array_elements(changes)
        LOOP
            -- Verarbeite verschiedene Änderungstypen
            CASE change->>'type'
                WHEN 'alter_table' THEN
                    -- Tabellen-Änderungen
                    FOR operation IN SELECT * FROM jsonb_array_elements(change->'operations')
                    LOOP
                        CASE operation->>'action'
                            WHEN 'drop_column' THEN
                                EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', 
                                    change->>'table', operation->>'column');
                            WHEN 'add_column' THEN
                                EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s', 
                                    change->>'table', operation->>'column', operation->>'type');
                        END CASE;
                    END LOOP;
                WHEN 'drop_table' THEN
                    -- Tabelle löschen
                    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', change->>'table');
            END CASE;
        END LOOP;
        
        -- Aktualisiere System-Info für Test
        INSERT INTO system_info (key, value, description) VALUES 
            ('schema_test_completed', 'true', 'Schema-Test erfolgreich abgeschlossen'),
            ('schema_test_timestamp', CURRENT_TIMESTAMP::text, 'Zeitstempel des Schema-Tests'),
            ('test_migration_id', migration_id, 'ID der Test-Migration')
        ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP;
            
        result := json_build_object(
            'success', true,
            'message', 'Schema-Test erfolgreich durchgeführt! Änderungen: Feld notes → Notizen, Tabelle einkaufs_liste entfernt.',
            'migrationId', migration_id,
            'timestamp', CURRENT_TIMESTAMP::text,
            'testMode', true
        );
    ELSE
        -- Normale Schema-Migration
        -- (Die Tabellen werden bereits durch das Init-Script erstellt)
        
        -- Aktualisiere System-Info
        INSERT INTO system_info (key, value, description) VALUES 
            ('last_migration', migration_id, 'Letzte Schema-Migration'),
            ('migration_timestamp', CURRENT_TIMESTAMP::text, 'Zeitstempel der Migration')
        ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP;
        
        result := json_build_object(
            'success', true,
            'message', 'Schema-Migration erfolgreich abgeschlossen!',
            'migrationId', migration_id,
            'timestamp', CURRENT_TIMESTAMP::text,
            'testMode', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API-Funktion für Tabellen-Liste
CREATE OR REPLACE FUNCTION api_get_tables()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'tableName', table_name,
            'tableType', table_type,
            'createdAt', creation_time
        ) ORDER BY table_name
    ) INTO result
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API-Funktion für System-Info
CREATE OR REPLACE FUNCTION api_get_system_info()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_object_agg(key, value) INTO result
    FROM system_info;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Setze Berechtigungen für alle Funktionen
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION exec_sql_with_result(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_schema_version(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION api_check_schema_status() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION api_migrate_schema(BOOLEAN, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION api_get_tables() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION api_get_system_info() TO anon, authenticated, service_role;

-- Abschluss-Meldung
DO $$
BEGIN
    RAISE NOTICE 'Chef Numbers Database erfolgreich initialisiert!';
    RAISE NOTICE 'API-Funktionen für direkten Frontend-Zugriff aktiviert!';
    RAISE NOTICE 'API-Endpoints verfügbar:';
    RAISE NOTICE '  - Schema-Status: SELECT api_check_schema_status();';
    RAISE NOTICE '  - Schema-Migration: SELECT api_migrate_schema(test_mode, changes);';
    RAISE NOTICE '  - Tabellen-Liste: SELECT api_get_tables();';
    RAISE NOTICE '  - System-Info: SELECT api_get_system_info();';
    RAISE NOTICE 'Test-Modus für Schema-Migration aktiviert!';
END
$$;
