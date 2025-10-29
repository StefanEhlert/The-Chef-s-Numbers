// Automatisch generierte Schema-Definitionen aus TypeScript-Interfaces
// Generiert am: 2025-10-29T20:35:35.899Z
// Automatische Schema-Generierung mit ts-morph

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primary?: boolean;
  defaultValue?: any;
  description: string;
  tsType: string;
}

export interface TableDefinition {
  tableName: string;
  interfaceName: string;
  columns: ColumnDefinition[];
  baseInterfaces: string[];
}

export interface SchemaDefinitions {
  [interfaceName: string]: TableDefinition;
}

export const AUTO_GENERATED_SCHEMA_DEFINITIONS: SchemaDefinitions = {
  "Supplier": {
    "tableName": "suppliers",
    "interfaceName": "Supplier",
    "columns": [
      {
        "name": "id",
        "type": "UUID",
        "nullable": false,
        "primary": false,
        "description": "Frontend-ID für State-Management",
        "tsType": "string"
      },
      {
        "name": "db_id",
        "type": "UUID",
        "nullable": false,
        "primary": true,
        "defaultValue": "gen_random_uuid()",
        "description": "Datenbank-ID (Primary Key) - wird von Prisma mit UUID() automatisch generiert",
        "tsType": "string"
      },
      {
        "name": "name",
        "type": "TEXT",
        "nullable": false,
        "primary": false,
        "description": "name property",
        "tsType": "string"
      },
      {
        "name": "contact_person",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "contactPerson property",
        "tsType": "string"
      },
      {
        "name": "email",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "email property",
        "tsType": "string"
      },
      {
        "name": "website",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "website property",
        "tsType": "string"
      },
      {
        "name": "address",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "address property",
        "tsType": "{\r\n    street: string;\r\n    zipCode: string;\r\n    city: string;\r\n    country: string;\r\n  }"
      },
      {
        "name": "phone_numbers",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "phoneNumbers property",
        "tsType": "PhoneNumber[]"
      },
      {
        "name": "notes",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "notes property",
        "tsType": "string"
      },
      {
        "name": "is_dirty",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "defaultValue": false,
        "description": "Wurde geändert?",
        "tsType": "boolean"
      },
      {
        "name": "is_new",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "defaultValue": false,
        "description": "Neuer Datensatz?",
        "tsType": "boolean"
      },
      {
        "name": "sync_status",
        "type": "sync_status_enum",
        "nullable": true,
        "primary": false,
        "defaultValue": "pending",
        "description": "Sync-Status",
        "tsType": "SyncStatus"
      },
      {
        "name": "created_at",
        "type": "TIMESTAMP",
        "nullable": false,
        "primary": false,
        "defaultValue": "CURRENT_TIMESTAMP",
        "description": "Erstellungsdatum",
        "tsType": "Date"
      },
      {
        "name": "updated_at",
        "type": "TIMESTAMP",
        "nullable": false,
        "primary": false,
        "defaultValue": "CURRENT_TIMESTAMP",
        "description": "Aktualisierungsdatum",
        "tsType": "Date"
      },
      {
        "name": "created_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der erstellt hat",
        "tsType": "string"
      },
      {
        "name": "updated_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der zuletzt geändert hat",
        "tsType": "string"
      },
      {
        "name": "last_modified_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der zuletzt modifiziert hat",
        "tsType": "string"
      }
    ],
    "baseInterfaces": [
      "BaseEntity"
    ]
  },
  "Article": {
    "tableName": "articles",
    "interfaceName": "Article",
    "columns": [
      {
        "name": "id",
        "type": "UUID",
        "nullable": false,
        "primary": false,
        "description": "Frontend-ID für State-Management",
        "tsType": "string"
      },
      {
        "name": "db_id",
        "type": "UUID",
        "nullable": false,
        "primary": true,
        "defaultValue": "gen_random_uuid()",
        "description": "Datenbank-ID (Primary Key) - wird von Prisma mit UUID() automatisch generiert",
        "tsType": "string"
      },
      {
        "name": "name",
        "type": "TEXT",
        "nullable": false,
        "primary": false,
        "description": "name property",
        "tsType": "string"
      },
      {
        "name": "category",
        "type": "TEXT",
        "nullable": false,
        "primary": false,
        "description": "category property",
        "tsType": "ArticleCategory"
      },
      {
        "name": "supplier_id",
        "type": "UUID",
        "nullable": false,
        "primary": false,
        "description": "supplierId property",
        "tsType": "string"
      },
      {
        "name": "supplier_article_number",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "supplierArticleNumber property",
        "tsType": "string"
      },
      {
        "name": "bundle_unit",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "bundleUnit property",
        "tsType": "Unit"
      },
      {
        "name": "bundle_price",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "bundlePrice property",
        "tsType": "number"
      },
      {
        "name": "bundle_ean_code",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "bundleEanCode property",
        "tsType": "string"
      },
      {
        "name": "content",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "content property",
        "tsType": "number"
      },
      {
        "name": "content_unit",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "contentUnit property",
        "tsType": "Unit"
      },
      {
        "name": "content_ean_code",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "contentEanCode property",
        "tsType": "string"
      },
      {
        "name": "price_per_unit",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "pricePerUnit property",
        "tsType": "number"
      },
      {
        "name": "vat_rate",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "defaultValue": 19,
        "description": "vatRate property",
        "tsType": "number"
      },
      {
        "name": "allergens",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "allergens property",
        "tsType": "string[]"
      },
      {
        "name": "additives",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "additives property",
        "tsType": "string[]"
      },
      {
        "name": "ingredients",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "ingredients property",
        "tsType": "string"
      },
      {
        "name": "nutrition_info",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "nutritionInfo property",
        "tsType": "{\r\n    calories: number; // kcal pro 100g\r\n    kilojoules: number; // kJ pro 100g\r\n    protein: number; // g pro 100g\r\n    fat: number; // g pro 100g\r\n    carbohydrates: number; // g pro 100g\r\n    fiber: number; // g pro 100g\r\n    sugar?: number; // g pro 100g\r\n    salt?: number; // g pro 100g\r\n    alcohol?: number; // % Alkoholgehalt\r\n  }"
      },
      {
        "name": "alcohol",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "alcohol property",
        "tsType": "number"
      },
      {
        "name": "open_food_facts_code",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "openFoodFactsCode property",
        "tsType": "string"
      },
      {
        "name": "price_per_unit_history",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "pricePerUnitHistory property",
        "tsType": "PriceHistoryEntry[]"
      },
      {
        "name": "notes",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "notes property",
        "tsType": "string"
      },
      {
        "name": "is_dirty",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "defaultValue": false,
        "description": "Wurde geändert?",
        "tsType": "boolean"
      },
      {
        "name": "is_new",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "defaultValue": false,
        "description": "Neuer Datensatz?",
        "tsType": "boolean"
      },
      {
        "name": "sync_status",
        "type": "sync_status_enum",
        "nullable": true,
        "primary": false,
        "defaultValue": "pending",
        "description": "Sync-Status",
        "tsType": "SyncStatus"
      },
      {
        "name": "created_at",
        "type": "TIMESTAMP",
        "nullable": false,
        "primary": false,
        "defaultValue": "CURRENT_TIMESTAMP",
        "description": "Erstellungsdatum",
        "tsType": "Date"
      },
      {
        "name": "updated_at",
        "type": "TIMESTAMP",
        "nullable": false,
        "primary": false,
        "defaultValue": "CURRENT_TIMESTAMP",
        "description": "Aktualisierungsdatum",
        "tsType": "Date"
      },
      {
        "name": "created_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der erstellt hat",
        "tsType": "string"
      },
      {
        "name": "updated_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der zuletzt geändert hat",
        "tsType": "string"
      },
      {
        "name": "last_modified_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der zuletzt modifiziert hat",
        "tsType": "string"
      }
    ],
    "baseInterfaces": [
      "BaseEntity"
    ]
  },
  "Recipe": {
    "tableName": "recipes",
    "interfaceName": "Recipe",
    "columns": [
      {
        "name": "id",
        "type": "UUID",
        "nullable": false,
        "primary": false,
        "description": "Frontend-ID für State-Management",
        "tsType": "string"
      },
      {
        "name": "db_id",
        "type": "UUID",
        "nullable": false,
        "primary": true,
        "defaultValue": "gen_random_uuid()",
        "description": "Datenbank-ID (Primary Key) - wird von Prisma mit UUID() automatisch generiert",
        "tsType": "string"
      },
      {
        "name": "name",
        "type": "TEXT",
        "nullable": false,
        "primary": false,
        "description": "name property",
        "tsType": "string"
      },
      {
        "name": "description",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "description property",
        "tsType": "string"
      },
      {
        "name": "portions",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "defaultValue": 1,
        "description": "portions property",
        "tsType": "number"
      },
      {
        "name": "preparation_time",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "preparationTime property",
        "tsType": "number"
      },
      {
        "name": "difficulty",
        "type": "INTEGER",
        "nullable": true,
        "primary": false,
        "description": "difficulty property",
        "tsType": "Difficulty"
      },
      {
        "name": "energy",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "energy property",
        "tsType": "number"
      },
      {
        "name": "image",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "image property",
        "tsType": "File"
      },
      {
        "name": "ingredients",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "ingredients property",
        "tsType": "RecipeIngredient[]"
      },
      {
        "name": "used_recipes",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "usedRecipes property",
        "tsType": "UsedRecipe[]"
      },
      {
        "name": "preparation_steps",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "preparationSteps property",
        "tsType": "PreparationStep[]"
      },
      {
        "name": "material_costs",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "materialCosts property",
        "tsType": "number"
      },
      {
        "name": "markup_percentage",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "defaultValue": 300,
        "description": "markupPercentage property",
        "tsType": "number"
      },
      {
        "name": "vat_rate",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "defaultValue": 19,
        "description": "vatRate property",
        "tsType": "number"
      },
      {
        "name": "selling_price",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "sellingPrice property",
        "tsType": "number"
      },
      {
        "name": "selling_price_history",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "sellingPriceHistory property",
        "tsType": "PriceHistoryEntry[]"
      },
      {
        "name": "total_nutrition_info",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "totalNutritionInfo property",
        "tsType": "{\r\n    calories: number;\r\n    kilojoules: number;\r\n    protein: number;\r\n    fat: number;\r\n    carbohydrates: number;\r\n    fiber: number;\r\n    sugar?: number;\r\n    salt?: number;\r\n    alcohol?: number; // % Alkoholgehalt\r\n  }"
      },
      {
        "name": "allergens",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "allergens property",
        "tsType": "string[]"
      },
      {
        "name": "notes",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "notes property",
        "tsType": "string"
      },
      {
        "name": "is_dirty",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "defaultValue": false,
        "description": "Wurde geändert?",
        "tsType": "boolean"
      },
      {
        "name": "is_new",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "defaultValue": false,
        "description": "Neuer Datensatz?",
        "tsType": "boolean"
      },
      {
        "name": "sync_status",
        "type": "sync_status_enum",
        "nullable": true,
        "primary": false,
        "defaultValue": "pending",
        "description": "Sync-Status",
        "tsType": "SyncStatus"
      },
      {
        "name": "created_at",
        "type": "TIMESTAMP",
        "nullable": false,
        "primary": false,
        "defaultValue": "CURRENT_TIMESTAMP",
        "description": "Erstellungsdatum",
        "tsType": "Date"
      },
      {
        "name": "updated_at",
        "type": "TIMESTAMP",
        "nullable": false,
        "primary": false,
        "defaultValue": "CURRENT_TIMESTAMP",
        "description": "Aktualisierungsdatum",
        "tsType": "Date"
      },
      {
        "name": "created_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der erstellt hat",
        "tsType": "string"
      },
      {
        "name": "updated_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der zuletzt geändert hat",
        "tsType": "string"
      },
      {
        "name": "last_modified_by",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "Benutzer-ID der zuletzt modifiziert hat",
        "tsType": "string"
      }
    ],
    "baseInterfaces": [
      "BaseEntity"
    ]
  }
};

export const AUTO_GENERATED_SQL: string = `-- Automatisch generierte SQL-Befehle aus TypeScript-Interfaces
-- Generiert am: 2025-10-29T20:35:35.882Z
-- Automatische Schema-Generierung mit ts-morph

-- ========================================
-- Enum Types
-- ========================================

CREATE TYPE IF NOT EXISTS sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
CREATE TYPE IF NOT EXISTS difficulty_enum AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE IF NOT EXISTS unit_enum AS ENUM ('kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Dose', 'Glas', 'Bund', 'Portion');

-- ========================================
-- Tabelle: suppliers (Interface: Supplier)
-- ========================================

-- Erstelle Tabelle: suppliers (Interface: Supplier)
CREATE TABLE IF NOT EXISTS suppliers (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
name TEXT NOT NULL,
contact_person TEXT,
email TEXT,
website TEXT,
address JSONB,
phone_numbers JSONB,
notes TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für suppliers
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_suppliers_id ON suppliers(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_suppliers_db_id ON suppliers(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_suppliers_updated_at ON suppliers(updated_at);

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

-- Erstelle Tabelle: articles (Interface: Article)
CREATE TABLE IF NOT EXISTS articles (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
name TEXT NOT NULL,
category TEXT NOT NULL,
supplier_id UUID NOT NULL,
supplier_article_number TEXT,
bundle_unit TEXT,
bundle_price DECIMAL,
bundle_ean_code TEXT,
content DECIMAL,
content_unit TEXT,
content_ean_code TEXT,
price_per_unit DECIMAL,
vat_rate DECIMAL DEFAULT 19,
allergens JSONB,
additives JSONB,
ingredients TEXT,
nutrition_info JSONB,
alcohol DECIMAL,
open_food_facts_code TEXT,
price_per_unit_history JSONB,
notes TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für articles
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_articles_id ON articles(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_articles_db_id ON articles(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at);
-- Index für Lieferant-Referenz
CREATE INDEX IF NOT EXISTS idx_articles_supplier_id ON articles(supplier_id);
-- Index für Kategorie
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- ========================================
-- Tabelle: recipes (Interface: Recipe)
-- ========================================

-- Erstelle Tabelle: recipes (Interface: Recipe)
CREATE TABLE IF NOT EXISTS recipes (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
name TEXT NOT NULL,
description TEXT,
portions DECIMAL DEFAULT 1,
preparation_time DECIMAL,
difficulty INTEGER,
energy DECIMAL,
image TEXT,
ingredients JSONB,
used_recipes JSONB,
preparation_steps JSONB,
material_costs DECIMAL,
markup_percentage DECIMAL DEFAULT 300,
vat_rate DECIMAL DEFAULT 19,
selling_price DECIMAL,
selling_price_history JSONB,
total_nutrition_info JSONB,
allergens JSONB,
notes TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für recipes
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_recipes_id ON recipes(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_recipes_db_id ON recipes(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at);

-- ========================================
-- Foreign Key Constraints (DEAKTIVIERT)
-- ========================================
-- Foreign Keys werden bewusst nicht erstellt, um ungewollte Löschungen zu vermeiden.
-- Referentielle Integrität wird in der App-Logik sichergestellt.

-- POTENTIELLER Foreign Key (deaktiviert):
-- ALTER TABLE articles ADD CONSTRAINT fk_articles_supplier 
--   FOREIGN KEY (supplier_id) REFERENCES suppliers(db_id) 
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- Check Constraints
-- ========================================

-- Check Constraints für articles (Idempotent)
DO $$
BEGIN
    -- Prüfe ob Constraint chk_articles_positive_prices existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_positive_prices'
    ) THEN
        ALTER TABLE articles ADD CONSTRAINT chk_articles_positive_prices 
          CHECK (bundle_price >= 0 AND price_per_unit >= 0);
        RAISE NOTICE '✅ Constraint chk_articles_positive_prices erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_articles_positive_prices existiert bereits';
    END IF;

    -- Prüfe ob Constraint chk_articles_positive_content existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_articles_positive_content'
    ) THEN
        ALTER TABLE articles ADD CONSTRAINT chk_articles_positive_content 
          CHECK (content > 0);
        RAISE NOTICE '✅ Constraint chk_articles_positive_content erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_articles_positive_content existiert bereits';
    END IF;

END $$;

-- Check Constraints für recipes (Idempotent)
DO $$
BEGIN
    -- Prüfe ob Constraint chk_recipes_positive_prices existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_recipes_positive_prices'
    ) THEN
        ALTER TABLE recipes ADD CONSTRAINT chk_recipes_positive_prices 
          CHECK (selling_price >= 0);
        RAISE NOTICE '✅ Constraint chk_recipes_positive_prices erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_recipes_positive_prices existiert bereits';
    END IF;

    -- Prüfe ob Constraint chk_recipes_positive_portions existiert
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_recipes_positive_portions'
    ) THEN
        ALTER TABLE recipes ADD CONSTRAINT chk_recipes_positive_portions 
          CHECK (portions > 0);
        RAISE NOTICE '✅ Constraint chk_recipes_positive_portions erstellt';
    ELSE
        RAISE NOTICE '✓ Constraint chk_recipes_positive_portions existiert bereits';
    END IF;

END $$;

-- ========================================
-- Migration Notes
-- ========================================

-- Automatisch generiert aus TypeScript-Interfaces
-- 1. Führen Sie diese Befehle in der richtigen Reihenfolge aus
-- 2. Für bestehende Tabellen: Prüfen Sie auf Konflikte
-- 3. Testen Sie die Constraints und Foreign Keys
-- 4. Backup vor Migration erstellen

-- Ende der automatisch generierten SQL-Befehle
`;
