-- ========================================
-- Migration v2.2.2: Energy-Feld für Rezepte
-- ========================================
-- Fügt das energy-Feld zur recipes-Tabelle hinzu
-- Datum: 2025-10-10
-- Beschreibung: Energieverbrauch in kWh für Rezepte

-- Prüfe ob die Spalte bereits existiert, bevor sie hinzugefügt wird
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes' 
        AND column_name = 'energy'
    ) THEN
        -- Füge energy-Spalte hinzu
        ALTER TABLE recipes ADD COLUMN energy DECIMAL;
        
        -- Füge Kommentar hinzu
        COMMENT ON COLUMN recipes.energy IS 'energy property (TS: number) - Energieverbrauch in kWh';
        
        RAISE NOTICE '✅ recipes.energy: Spalte erfolgreich hinzugefügt';
    ELSE
        RAISE NOTICE '✓ recipes.energy: Spalte existiert bereits';
    END IF;
END $$;

-- Aktualisiere Schema-Version in system_info
UPDATE system_info 
SET value = '2.2.2', 
    updated_at = CURRENT_TIMESTAMP 
WHERE key = 'schema_version';

-- Erfolgsmeldung
SELECT 'Migration v2.2.2 erfolgreich abgeschlossen!' as status;
SELECT 'Energy-Feld zur recipes-Tabelle hinzugefügt' as migration_info;

