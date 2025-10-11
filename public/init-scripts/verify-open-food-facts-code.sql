-- Verifizierung der open_food_facts_code Spalte
-- Dieses Skript prüft ob die Spalte korrekt erstellt wurde

\echo '========================================'
\echo 'Verifizierung: open_food_facts_code'
\echo '========================================'

-- 1. Zeige alle Spalten der articles Tabelle
\echo ''
\echo '1. Alle Spalten der articles Tabelle:'
\echo '--------------------------------------'
SELECT 
    ordinal_position,
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'articles' 
ORDER BY ordinal_position;

-- 2. Prüfe spezifisch ob open_food_facts_code existiert
\echo ''
\echo '2. Existiert open_food_facts_code?'
\echo '--------------------------------------'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'articles' 
            AND column_name = 'open_food_facts_code'
        ) THEN '✅ JA - Spalte existiert'
        ELSE '❌ NEIN - Spalte fehlt'
    END AS status;

-- 3. Zeige aktuelle Schema-Version
\echo ''
\echo '3. Aktuelle Schema-Version:'
\echo '--------------------------------------'
SELECT key, value, description 
FROM system_info 
WHERE key = 'schema_version';

-- 4. Teste einen einfachen SELECT auf die Spalte
\echo ''
\echo '4. Test: SELECT open_food_facts_code'
\echo '--------------------------------------'
SELECT 
    id, 
    name, 
    open_food_facts_code 
FROM articles 
LIMIT 5;

\echo ''
\echo '========================================'
\echo 'Verifizierung abgeschlossen'
\echo '========================================'

