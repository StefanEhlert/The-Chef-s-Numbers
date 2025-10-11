# Schema-Migrations-System

## Übersicht

Das automatische Schema-Migrations-System ermöglicht es, Datenbank-Schemata zu aktualisieren, ohne bestehende Daten zu verlieren.

## Funktionsweise

### 1. Schema-Versionierung

Jede Schema-Version wird in der `system_info`-Tabelle gespeichert:

```sql
SELECT value FROM system_info WHERE key = 'schema_version';
-- Ergebnis: 2.1.0
```

### 2. Automatische Migrationen

Bei jedem Neustart der Datenbank:

1. **Liest aktuelle Version** aus `system_info`
2. **Prüft welche Migrationen nötig sind**
3. **Führt nur fehlende Migrationen aus**
4. **Aktualisiert Schema-Version**

### 3. Idempotenz

Migrationen können **mehrfach ausgeführt werden** ohne Fehler:

```sql
-- Migration prüft zuerst ob nötig:
IF current_schema_version::DECIMAL < 2.1 THEN
    -- Prüft ob Spalte bereits korrekt ist:
    IF column_type = 'text' THEN
        -- Ändert nur wenn nötig
        ALTER TABLE ... 
    END IF;
END IF;
```

## Schema-Versionen

### v2.0.0 (Initial)
- Grundlegendes Schema mit `id` und `dbId`
- Basis-Tabellen: articles, suppliers, recipes

### v2.1.0 (Aktuell)
**Migrationen:**
1. ✅ `address`: TEXT → JSONB (für strukturierte Adressen)
2. ✅ `db_id`: DEFAULT gen_random_uuid() hinzugefügt
3. ✅ `created_at`: DEFAULT CURRENT_TIMESTAMP hinzugefügt
4. ✅ `updated_at`: DEFAULT CURRENT_TIMESTAMP hinzugefügt

**Vorteile:**
- PostgreSQL generiert automatisch `db_id` (keine Frontend-Generierung)
- PostgreSQL setzt automatisch Timestamps (konsistente Zeit)
- Verschachtelte Objekte werden korrekt als JSONB gespeichert

## Neue Migration hinzufügen

### Schritt 1: Version erhöhen

In `scripts/autoSchemaGenerator.ts`:

```typescript
function generatePostgreSQLInitScript(definitions: SchemaDefinitions): string {
  const currentVersion = '2.1.0'; // ← Alte Version
  const targetVersion = '2.2.0';  // ← NEUE VERSION
```

### Schritt 2: Migration hinzufügen

In `generateMigrations()`:

```typescript
// Migration 4: Deine neue Migration (v2.1.0 → v2.2.0)
if (current_schema_version IS NULL OR current_schema_version::DECIMAL < 2.2) THEN
    RAISE NOTICE 'Führe neue Migration aus...';
    
    // Deine Migrations-Logik hier
    ALTER TABLE ... 
    
    RAISE NOTICE '✅ Migration abgeschlossen';
END IF;
```

### Schritt 3: Dokumentieren

Aktualisiere diese Datei und `scripts/autoSchemaGenerator.ts` (Zeile 11-13)

### Schritt 4: Schema regenerieren

```bash
npx ts-node scripts/autoSchemaGenerator.ts
```

## Manuelle Migration

Falls Du Migrationen **ohne Neustart** ausführen möchtest:

```sql
-- 1. Aktuelle Version prüfen
SELECT value FROM system_info WHERE key = 'schema_version';

-- 2. Migrations-Block aus init-chef-numbers-postgresql.sql kopieren und ausführen
DO $$
DECLARE
    current_schema_version TEXT;
BEGIN
    -- ... (kopiere den DO-Block)
END $$;

-- 3. Version manuell aktualisieren
UPDATE system_info 
SET value = '2.1.0', updated_at = CURRENT_TIMESTAMP 
WHERE key = 'schema_version';
```

## Migration-Logs

Beim Neustart zeigt PostgreSQL NOTICE-Meldungen:

```
NOTICE: =========================================
NOTICE: Schema-Migrations-System
NOTICE: Aktuelle Version: 2.0.0
NOTICE: Ziel-Version: 2.1.0
NOTICE: =========================================
NOTICE: Führe Typ-Konvertierungen aus...
NOTICE: ✅ suppliers.address: TEXT → JSONB konvertiert
NOTICE: Prüfe db_id DEFAULT-Werte...
NOTICE: ✅ suppliers.db_id: DEFAULT gen_random_uuid() hinzugefügt
NOTICE: ✅ articles.db_id: DEFAULT gen_random_uuid() hinzugefügt
...
```

## Best Practices

### ✅ DO:
- Erhöhe Schema-Version bei jeder Änderung
- Teste Migrationen auf Test-Datenbank zuerst
- Füge RAISE NOTICE für Transparenz hinzu
- Prüfe vor jeder Änderung ob sie nötig ist
- Dokumentiere alle Migrationen

### ❌ DON'T:
- Lösche nie alte Migrationen (Rückwärtskompatibilität!)
- Ändere Schema-Version manuell in der DB
- Führe Migrationen ohne Versions-Check aus
- Vergiss nicht zu dokumentieren

## Troubleshooting

### Migration wird nicht ausgeführt

**Problem:** Schema-Version ist bereits höher als Target-Version

**Lösung:**
```sql
-- Version zurücksetzen (NUR für Development!)
UPDATE system_info SET value = '2.0.0' WHERE key = 'schema_version';
```

### Migration schlägt fehl

**Problem:** Datenbank-Fehler bei ALTER TABLE

**Lösung:**
1. Prüfe PostgreSQL-Logs
2. Teste Migration auf Test-DB
3. Passe USING-Clause an für Datenkonvertierung

### Schema nicht synchron

**Problem:** Init-Script wurde manuell geändert

**Lösung:**
```bash
# Schema neu generieren
npx ts-node scripts/autoSchemaGenerator.ts
```

## Beispiel-Migration

### Szenario: Neues Feld hinzufügen

**1. TypeScript-Interface erweitern:**

```typescript
export interface Article extends BaseEntity {
  // ... bestehende Felder
  barcode?: string; // ← Neu!
}
```

**2. Version erhöhen:**

```typescript
const targetVersion = '2.2.0'; // v2.1.0 → v2.2.0
```

**3. Schema regenerieren:**

```bash
npx ts-node scripts/autoSchemaGenerator.ts
```

**4. Resultat:**

```sql
-- Automatisch generiert:
ALTER TABLE articles ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Migrations-Check:
IF current_schema_version < 2.2 THEN
    -- Füge Spalte hinzu falls nicht vorhanden
END IF;
```

## Support

Bei Fragen oder Problemen:
- Prüfe die Console-Logs des autoSchemaGenerators
- Prüfe PostgreSQL NOTICE-Meldungen beim Neustart
- Dokumentation in `scripts/autoSchemaGenerator.ts` (Zeile 4-18)

