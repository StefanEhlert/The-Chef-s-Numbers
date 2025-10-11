-- Migration v2.2.1: Füge open_food_facts_code Spalte zur articles Tabelle hinzu
-- Manuell ausführbar mit: psql -U postgres -d chef_numbers -f migration-2.2.1-add-open-food-facts-code.sql

-- Prüfe ob die Spalte bereits existiert
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration v2.2.1: open_food_facts_code';
    RAISE NOTICE '========================================';
    
    -- Prüfe ob articles Tabelle existiert
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles') THEN
        RAISE NOTICE '✓ Tabelle articles gefunden';
        
        -- Prüfe ob Spalte bereits existiert
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'articles' 
            AND column_name = 'open_food_facts_code'
        ) THEN
            RAISE NOTICE '✓ Spalte open_food_facts_code existiert bereits';
            RAISE NOTICE 'Zeige Spalten-Details:';
            
            -- Zeige Details der Spalte
            PERFORM column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'articles' 
            AND column_name = 'open_food_facts_code';
            
        ELSE
            RAISE NOTICE '⚠️ Spalte open_food_facts_code existiert NICHT - füge hinzu...';
            
            -- Füge Spalte hinzu
            ALTER TABLE articles ADD COLUMN open_food_facts_code TEXT;
            
            -- Setze Kommentar
            COMMENT ON COLUMN articles.open_food_facts_code IS 'openFoodFactsCode property (TS: string) - Open Food Facts Produkt-Code für Rückverfolgbarkeit';
            
            RAISE NOTICE '✅ Spalte open_food_facts_code erfolgreich hinzugefügt';
        END IF;
        
        -- Aktualisiere Schema-Version
        UPDATE system_info 
        SET value = '2.2.1', 
            updated_at = CURRENT_TIMESTAMP 
        WHERE key = 'schema_version';
        
        RAISE NOTICE '✅ Schema-Version auf 2.2.1 aktualisiert';
        
    ELSE
        RAISE NOTICE '❌ Tabelle articles nicht gefunden!';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration abgeschlossen';
    RAISE NOTICE '========================================';
END $$;

-- Zeige alle Spalten der articles Tabelle zur Verifizierung
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'articles' 
ORDER BY ordinal_position;

