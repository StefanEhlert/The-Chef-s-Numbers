-- ============================================
-- SUPABASE AUTO-INSTALLER: RPC-Functions
-- ============================================
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2025-11-03T01:06:18.483Z
--
-- Diese RPC-Functions ermöglichen die automatische Schema-Installation
-- per REST API ohne manuelle Benutzerinteraktion!
--
-- EINMALIGE INSTALLATION:
-- Führen Sie dieses Script EINMAL manuell im SQL Editor aus.
-- 
-- AUTOMATISCHE NUTZUNG:
-- Die App kann dann per API-Call das Schema initialisieren:
-- POST https://xxxxx.supabase.co/rest/v1/rpc/execute_schema_idempotent
--
-- VERFÜGBARE RPC-FUNCTIONS:
-- 1. execute_sql_dynamic(sql_statement TEXT) - Führt einzelnes SQL-Statement aus
-- 2. execute_schema_idempotent() - Führt das komplette Schema-Script aus (idempotent)
--

-- ========================================
-- RPC-Function 1: Dynamische SQL-Ausführung (für einzelne Statements)
-- ========================================

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
  
  RAISE NOTICE '📝 SQL: %', LEFT(sql_statement, 200);
  
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

-- ========================================
-- RPC-Function 2: Idempotentes Schema-Update
-- ========================================
-- Diese Function führt das komplette init-chef-numbers-supabase.sql aus
-- Das Script ist bereits idempotent (CREATE TABLE IF NOT EXISTS, etc.)
-- Keine Versionsprüfung nötig!

CREATE OR REPLACE FUNCTION execute_schema_idempotent(sql_script TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)
AS $$
DECLARE
  result JSON;
  statements TEXT[];
  stmt TEXT;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
  i INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IDEMPOTENTES SCHEMA-UPDATE';
  RAISE NOTICE '========================================';
  
  -- Wenn kein SQL-Script übergeben wurde, verwende Standard-Verhalten
  IF sql_script IS NULL OR sql_script = '' THEN
    RAISE NOTICE '⚠️ Kein SQL-Script übergeben - Schema wird nicht aktualisiert';
    RETURN json_build_object(
      'success', false,
      'message', 'Kein SQL-Script übergeben',
      'timestamp', now()
    );
  END IF;
  
  RAISE NOTICE '📝 SQL-Script erhalten (Länge: % Zeichen)', LENGTH(sql_script);
  RAISE NOTICE '🔄 Führe idempotente Schema-Updates durch...';
  
  -- Das komplette Init-Script ist bereits idempotent
  -- Es erstellt nur fehlende Tabellen/Spalten
  -- Keine Versionsprüfung nötig!
  
  -- Versuche das SQL direkt auszuführen (für Multi-Statement)
  -- PostgreSQL unterstützt Multi-Statement-SQL wenn es als String übergeben wird
  BEGIN
    -- Führe das komplette SQL-Script aus
    -- WICHTIG: Das Script muss als komplettes DO Block oder direkt ausführbar sein
    EXECUTE sql_script;
    
    RAISE NOTICE '✅ SQL-Script erfolgreich ausgeführt';
    
    result := json_build_object(
      'success', true,
      'message', 'Idempotentes Schema-Update erfolgreich durchgeführt',
      'idempotent', true,
      'timestamp', now()
    );
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Fehler bei Schema-Update: %', SQLERRM;
    RAISE NOTICE '⚠️ Versuche alternative Methode (Statement-Splitting)...';
    
    -- Fallback: Versuche Statements einzeln auszuführen
    -- Dies ist komplex, da DO $$ Blocks mehrere Statements enthalten können
    -- Für jetzt: Gebe Fehler zurück und empfehle manuelle Ausführung
    
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'SQL-Execution fehlgeschlagen. Bitte führen Sie das Script manuell aus: ' || SQLERRM,
      'hint', 'Das SQL-Script ist zu komplex für automatische Ausführung. Bitte führen Sie init-chef-numbers-supabase.sql manuell im SQL Editor aus.',
      'timestamp', now()
    );
  END;
  
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
-- FERTIG!
-- ========================================
-- 
-- Die RPC-Functions sind jetzt installiert!
-- 
-- Verfügbare Functions:
-- 1. execute_sql_dynamic(sql_statement TEXT)
--    Führt einzelnes SQL-Statement aus
-- 
-- 2. execute_schema_idempotent(sql_script TEXT)
--    Führt das komplette Schema-Script aus (idempotent)
--    Das SQL-Script wird vom Frontend übergeben
-- 
-- NÄCHSTE SCHRITTE:
-- 1. Die App ruft execute_schema_idempotent() mit dem SQL-Script auf
-- 2. Das Schema wird automatisch initialisiert (idempotent)
-- 3. Keine manuelle Interaktion nötig!
-- 
-- ========================================
