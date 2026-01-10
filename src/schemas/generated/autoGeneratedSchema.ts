// Automatisch generierte Schema-Definitionen aus TypeScript-Interfaces
// Generiert am: 2026-01-09T13:47:35.255Z
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
  "AccountingAccount": {
    "tableName": "accountingaccounts",
    "interfaceName": "AccountingAccount",
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
        "name": "chart_id",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "chartId property",
        "tsType": "AccountingChartId"
      },
      {
        "name": "template_id",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "templateId property",
        "tsType": "string"
      },
      {
        "name": "code",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "code property",
        "tsType": "string"
      },
      {
        "name": "number",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "number property",
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
        "tsType": "string"
      },
      {
        "name": "vat_tag",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "vatTag property",
        "tsType": "string"
      },
      {
        "name": "origin",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "origin property",
        "tsType": "AccountingAccountOrigin"
      },
      {
        "name": "status",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "status property",
        "tsType": "AccountingAccountStatus"
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
        "name": "parent_id",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "parentId property",
        "tsType": "string | null"
      },
      {
        "name": "path",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "path property",
        "tsType": "string[]"
      },
      {
        "name": "sort_order",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "sortOrder property",
        "tsType": "number"
      },
      {
        "name": "type",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "type property",
        "tsType": "string"
      },
      {
        "name": "is_leaf",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "description": "isLeaf property",
        "tsType": "boolean"
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
  "AccountingSettings": {
    "tableName": "accountingsettings",
    "interfaceName": "AccountingSettings",
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
        "name": "selected_chart_id",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "selectedChartId property",
        "tsType": "AccountingChartId"
      },
      {
        "name": "customizations_enabled",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "description": "customizationsEnabled property",
        "tsType": "boolean"
      },
      {
        "name": "ocr_api_configs",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "ocrApiConfigs property",
        "tsType": "OCRApiConfig[]"
      },
      {
        "name": "vat_rates",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "vatRates property",
        "tsType": "VatRate[]"
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
        "tsType": "{\n    street: string;\n    zipCode: string;\n    city: string;\n    country: string;\n  }"
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
        "name": "netto_prices",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "description": "nettoPrices property",
        "tsType": "boolean"
      },
      {
        "name": "recognized_names",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "recognizedNames property",
        "tsType": "string[]"
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
  "UnitEntity": {
    "tableName": "unitentitys",
    "interfaceName": "UnitEntity",
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
  "CategoryEntity": {
    "tableName": "categoryentitys",
    "interfaceName": "CategoryEntity",
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
        "name": "names_o_c_r",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "namesOCR property",
        "tsType": "string[]"
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
        "name": "accounting_account_number",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "accountingAccountNumber property",
        "tsType": "string"
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
        "tsType": "{\n    calories: number; // kcal pro 100g\n    kilojoules: number; // kJ pro 100g\n    protein: number; // g pro 100g\n    fat: number; // g pro 100g\n    carbohydrates: number; // g pro 100g\n    fiber: number; // g pro 100g\n    sugar?: number; // g pro 100g\n    salt?: number; // g pro 100g\n    alcohol?: number; // % Alkoholgehalt\n  }"
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
        "tsType": "{\n    calories: number;\n    kilojoules: number;\n    protein: number;\n    fat: number;\n    carbohydrates: number;\n    fiber: number;\n    sugar?: number;\n    salt?: number;\n    alcohol?: number; // % Alkoholgehalt\n  }"
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
        "name": "allergens",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "allergens property",
        "tsType": "string[]"
      },
      {
        "name": "ingredients_text",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "ingredientsText property",
        "tsType": "string"
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
  "Receipt": {
    "tableName": "receipts",
    "interfaceName": "Receipt",
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
        "name": "supplier_id",
        "type": "UUID",
        "nullable": true,
        "primary": false,
        "description": "supplierId property",
        "tsType": "string"
      },
      {
        "name": "booking_number",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "bookingNumber property",
        "tsType": "string"
      },
      {
        "name": "receipt_date",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "receiptDate property",
        "tsType": "string"
      },
      {
        "name": "receipt_number",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "receiptNumber property",
        "tsType": "string"
      },
      {
        "name": "receipt_details",
        "type": "JSONB",
        "nullable": true,
        "primary": false,
        "description": "receiptDetails property",
        "tsType": "{\n    lineItems: ReceiptLineItem[];\n    currency: string;\n    totalNet?: number;\n    totalVat?: number;\n    totalGross?: number;\n  }"
      },
      {
        "name": "due_date",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "dueDate property",
        "tsType": "string"
      },
      {
        "name": "payment_status",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "paymentStatus property",
        "tsType": "ReceiptPaymentStatus"
      },
      {
        "name": "line_item_count",
        "type": "DECIMAL",
        "nullable": true,
        "primary": false,
        "description": "lineItemCount property",
        "tsType": "number"
      },
      {
        "name": "accounting",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "accounting property",
        "tsType": "ReceiptAccountingEntry[]"
      },
      {
        "name": "is_completed",
        "type": "BOOLEAN",
        "nullable": true,
        "primary": false,
        "description": "isCompleted property",
        "tsType": "boolean"
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
        "name": "ocr_result",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "ocrResult property",
        "tsType": "any"
      },
      {
        "name": "ocr_provider",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "ocrProvider property",
        "tsType": "'azure' | 'taggun'"
      },
      {
        "name": "receipt_image_path",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "receiptImagePath property",
        "tsType": "string"
      },
      {
        "name": "processed_ocr_data",
        "type": "TEXT",
        "nullable": true,
        "primary": false,
        "description": "processedOcrData property",
        "tsType": "any"
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
-- Generiert am: 2026-01-09T13:47:35.240Z
-- Automatische Schema-Generierung mit ts-morph

-- ========================================
-- Enum Types
-- ========================================

CREATE TYPE IF NOT EXISTS sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
CREATE TYPE IF NOT EXISTS difficulty_enum AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE IF NOT EXISTS unit_enum AS ENUM ('kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Dose', 'Glas', 'Bund', 'Portion');

-- ========================================
-- Tabelle: accountingaccounts (Interface: AccountingAccount)
-- ========================================

-- Erstelle Tabelle: accountingaccounts (Interface: AccountingAccount)
CREATE TABLE IF NOT EXISTS accountingaccounts (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
chart_id TEXT,
template_id TEXT,
code TEXT,
number TEXT,
name TEXT NOT NULL,
category TEXT NOT NULL,
vat_tag TEXT,
origin TEXT,
status TEXT,
notes TEXT,
parent_id TEXT,
path JSONB,
sort_order DECIMAL,
type TEXT,
is_leaf BOOLEAN,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für accountingaccounts
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_id ON accountingaccounts(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_db_id ON accountingaccounts(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_created_at ON accountingaccounts(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingaccounts_updated_at ON accountingaccounts(updated_at);

-- ========================================
-- Tabelle: accountingsettings (Interface: AccountingSettings)
-- ========================================

-- Erstelle Tabelle: accountingsettings (Interface: AccountingSettings)
CREATE TABLE IF NOT EXISTS accountingsettings (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
selected_chart_id TEXT,
customizations_enabled BOOLEAN,
ocr_api_configs TEXT,
vat_rates TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für accountingsettings
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_accountingsettings_id ON accountingsettings(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_accountingsettings_db_id ON accountingsettings(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingsettings_created_at ON accountingsettings(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_accountingsettings_updated_at ON accountingsettings(updated_at);

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
netto_prices BOOLEAN,
recognized_names JSONB,
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
-- Tabelle: unitentitys (Interface: UnitEntity)
-- ========================================

-- Erstelle Tabelle: unitentitys (Interface: UnitEntity)
CREATE TABLE IF NOT EXISTS unitentitys (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
name TEXT NOT NULL,
description TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für unitentitys
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_unitentitys_id ON unitentitys(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_unitentitys_db_id ON unitentitys(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_unitentitys_created_at ON unitentitys(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_unitentitys_updated_at ON unitentitys(updated_at);

-- ========================================
-- Tabelle: categoryentitys (Interface: CategoryEntity)
-- ========================================

-- Erstelle Tabelle: categoryentitys (Interface: CategoryEntity)
CREATE TABLE IF NOT EXISTS categoryentitys (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
name TEXT NOT NULL,
description TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für categoryentitys
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_categoryentitys_id ON categoryentitys(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_categoryentitys_db_id ON categoryentitys(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_categoryentitys_created_at ON categoryentitys(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_categoryentitys_updated_at ON categoryentitys(updated_at);

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

-- Erstelle Tabelle: articles (Interface: Article)
CREATE TABLE IF NOT EXISTS articles (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
name TEXT NOT NULL,
names_o_c_r JSONB,
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
accounting_account_number TEXT,
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
alcohol DECIMAL,
allergens JSONB,
ingredients_text TEXT,
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
-- Tabelle: receipts (Interface: Receipt)
-- ========================================

-- Erstelle Tabelle: receipts (Interface: Receipt)
CREATE TABLE IF NOT EXISTS receipts (
id UUID NOT NULL,
db_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
supplier_id UUID,
booking_number TEXT,
receipt_date TEXT,
receipt_number TEXT,
receipt_details JSONB,
due_date TEXT,
payment_status TEXT,
line_item_count DECIMAL,
accounting TEXT,
is_completed BOOLEAN,
notes TEXT,
ocr_result TEXT,
ocr_provider TEXT,
receipt_image_path TEXT,
processed_ocr_data TEXT,
is_dirty BOOLEAN DEFAULT false,
is_new BOOLEAN DEFAULT false,
sync_status sync_status_enum DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
created_by UUID,
updated_by UUID,
last_modified_by UUID
);

-- Indizes für receipts
-- Index für Frontend-ID (id)
CREATE INDEX IF NOT EXISTS idx_receipts_id ON receipts(id);
-- Index für Primary Key (db_id)
CREATE INDEX IF NOT EXISTS idx_receipts_db_id ON receipts(db_id);
-- Index für Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
-- Index für Aktualisierungsdatum
CREATE INDEX IF NOT EXISTS idx_receipts_updated_at ON receipts(updated_at);

-- ========================================
-- Foreign Key Constraints (DEAKTIVIERT)
-- ========================================
-- Foreign Keys werden bewusst nicht erstellt, um ungewollte Löschungen zu vermeiden.
-- Referentielle Integrität wird in der App-Logik sichergestellt.

-- POTENTIELLER Foreign Key (deaktiviert):
-- ALTER TABLE articles ADD CONSTRAINT fk_articles_supplier 
--   FOREIGN KEY (supplier_id) REFERENCES suppliers(db_id) 
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- POTENTIELLER Foreign Key (deaktiviert):
-- ALTER TABLE receipts ADD CONSTRAINT fk_receipts_supplier 
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
