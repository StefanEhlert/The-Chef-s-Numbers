-- ========================================
-- Verifizierung: Energy-Feld in recipes-Tabelle
-- ========================================
-- Prüft ob das energy-Feld korrekt angelegt wurde

-- 1. Prüfe ob die Spalte existiert
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'recipes'
    AND column_name = 'energy';

-- 2. Zeige alle Spalten der recipes-Tabelle
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'recipes'
ORDER BY ordinal_position;

-- 3. Zeige aktuelle Schema-Version
SELECT key, value, description 
FROM system_info 
WHERE key = 'schema_version';

