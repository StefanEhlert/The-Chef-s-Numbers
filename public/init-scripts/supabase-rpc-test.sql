-- ============================================
-- SUPABASE RPC TEST: SQL-Ausführung per API
-- ============================================
-- 
-- Dieses Script erstellt eine PostgreSQL Function, die per Supabase REST API
-- aufgerufen werden kann, um SQL-Befehle auszuführen.
--
-- Nach dem Ausführen dieses Scripts kann die App SQL-Befehle per API senden!
--

-- 1. Erstelle eine RPC-Function für CREATE TABLE
CREATE OR REPLACE FUNCTION create_test_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- Wichtig: Führt mit Owner-Rechten aus!
AS $$
BEGIN
  -- Erstelle Test-Tabelle
  CREATE TABLE IF NOT EXISTS api_test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name TEXT NOT NULL,
    test_value INTEGER,
    test_description TEXT,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
  );
  
  -- Erstelle Index
  CREATE INDEX IF NOT EXISTS idx_api_test_table_name ON api_test_table(test_name);
  
  -- Füge Test-Daten ein
  INSERT INTO api_test_table (test_name, test_value, test_description) 
  VALUES 
    ('API Test 1', 123, 'Erstellt per RPC-Function'),
    ('API Test 2', 456, 'Automatisch über REST API');
  
  RETURN 'Test-Tabelle erfolgreich erstellt! RPC funktioniert! 🎉';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Fehler beim Erstellen: ' || SQLERRM;
END;
$$;

-- 2. Erstelle eine RPC-Function für ALTER TABLE
CREATE OR REPLACE FUNCTION modify_test_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Füge neue Spalte hinzu
  ALTER TABLE api_test_table 
  ADD COLUMN IF NOT EXISTS new_column TEXT DEFAULT 'Hinzugefügt per API';
  
  -- Update bestehende Daten
  UPDATE api_test_table 
  SET test_description = test_description || ' [Modified via API]'
  WHERE test_description NOT LIKE '%Modified via API%';
  
  RETURN 'Test-Tabelle erfolgreich modifiziert! ALTER TABLE funktioniert! 🎉';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Fehler beim Modifizieren: ' || SQLERRM;
END;
$$;

-- 3. Erstelle eine RPC-Function zum Auslesen der Test-Daten
CREATE OR REPLACE FUNCTION get_test_table_info()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'table_exists', EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'api_test_table'
    ),
    'row_count', (SELECT COUNT(*) FROM api_test_table),
    'columns', (
      SELECT json_agg(column_name)
      FROM information_schema.columns
      WHERE table_name = 'api_test_table'
    ),
    'sample_data', (
      SELECT json_agg(row_to_json(t))
      FROM (SELECT * FROM api_test_table LIMIT 3) t
    )
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- 4. Erstelle eine Cleanup-Function zum Löschen der Test-Tabelle
CREATE OR REPLACE FUNCTION cleanup_test_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DROP TABLE IF EXISTS api_test_table CASCADE;
  
  RETURN 'Test-Tabelle erfolgreich gelöscht! Cleanup abgeschlossen. ✅';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Fehler beim Cleanup: ' || SQLERRM;
END;
$$;

-- ============================================
-- ANLEITUNG:
-- ============================================
--
-- 1. Führe dieses Script im Supabase SQL Editor aus
-- 
-- 2. Teste die Functions per API:
--    
--    A) Tabelle erstellen:
--       POST https://xxxxx.supabase.co/rest/v1/rpc/create_test_table
--       Header: apikey, Authorization
--    
--    B) Tabelle modifizieren:
--       POST https://xxxxx.supabase.co/rest/v1/rpc/modify_test_table
--    
--    C) Info abrufen:
--       POST https://xxxxx.supabase.co/rest/v1/rpc/get_test_table_info
--    
--    D) Aufräumen:
--       POST https://xxxxx.supabase.co/rest/v1/rpc/cleanup_test_table
--
-- 3. Wenn erfolgreich: Automatische Schema-Initialisierung ist möglich! 🎉
--
-- ============================================

