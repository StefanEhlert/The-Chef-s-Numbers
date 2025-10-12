// Automatische Schema-Generierung aus TypeScript-Interfaces
// Verwendet ts-morph für AST-Parsing und Schema-Analyse
//
// ========================================
// SCHEMA-VERSIONS-MANAGEMENT
// ========================================
//
// Schema-Versionen werden automatisch in system_info gespeichert.
// Bei jedem DB-Neustart werden Migrationen geprüft und ausgeführt.
//
// Aktuelle Version: 2.2.2
// - v2.0.0: Initiale Version
// - v2.1.0: address TEXT → JSONB, DEFAULT-Werte für db_id und Timestamps
// - v2.2.1: Open Food Facts Code für Artikel-Rückverfolgbarkeit
// - v2.2.2: Energy-Feld für Rezepte (Energieverbrauch in kWh)
//
// NEUE MIGRATIONEN HINZUFÜGEN:
// 1. Erhöhe targetVersion in generatePostgreSQLInitScript() (z.B. auf 2.3.0)
// 2. Füge Migration in generateMigrations() hinzu
// 3. Dokumentiere die Änderung hier
//

import { Project, InterfaceDeclaration, PropertySignature, TypeNode } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

// Typ-Definitionen
interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primary?: boolean;
  defaultValue?: any;
  description: string;
  tsType: string;
}

interface TableDefinition {
  tableName: string;
  interfaceName: string;
  columns: ColumnDefinition[];
  baseInterfaces: string[];
}

interface SchemaDefinitions {
  [interfaceName: string]: TableDefinition;
}

// TypeScript-Typen zu PostgreSQL-Typen Mapping
const typeMapping: { [key: string]: string } = {
  'string': 'TEXT',
  'number': 'DECIMAL',
  'boolean': 'BOOLEAN',
  'Date': 'TIMESTAMP',
  'string[]': 'TEXT[]',
  'number[]': 'DECIMAL[]',
  'boolean[]': 'BOOLEAN[]',
  'UUID': 'UUID',
  'JSON': 'JSONB',
  'Unit': 'TEXT',
  'Difficulty': 'INTEGER',
  'SyncStatus': 'TEXT',
  'ArticleCategory': 'TEXT',
  'PhoneType': 'TEXT'
};

// Spezielle Typ-Mappings für komplexe Typen
const complexTypeMapping: { [key: string]: string } = {
  'RecipeIngredient[]': 'JSONB',
  'UsedRecipe[]': 'JSONB',
  'PreparationStep[]': 'JSONB',
  'PhoneNumber[]': 'JSONB'
};

// Extrahiere Typ-Informationen aus TypeScript-Typen
function extractTypeInfo(typeNode: TypeNode): { type: string; nullable: boolean; array: boolean } {
  let type = typeNode.getText();
  let nullable = false;
  let array = false;

  // Handle Union Types (z.B. string | null)
  if (typeNode.getKind() === 185) { // Union Type
    const unionTypes = (typeNode as any).asUnion().getTypes();
    nullable = unionTypes.some((t: any) => t.getText().trim() === 'null' || t.getText().trim() === 'undefined');
    type = unionTypes.find((t: any) => t.getText().trim() !== 'null' && t.getText().trim() !== 'undefined')?.getText() || 'any';
  }

  // Handle Array Types
  if (type.endsWith('[]')) {
    array = true;
    type = type.slice(0, -2);
  }

  // Handle Optional Properties (TypeScript ?)
  if (type.includes('?')) {
    nullable = true;
    type = type.replace('?', '');
  }

  return { type: type.trim(), nullable, array };
}

// Generiere Spaltenname aus Property-Namen
function generateColumnName(propertyName: string): string {
  // CamelCase zu snake_case konvertieren
  return propertyName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

// Generiere Tabellennamen aus Interface-Namen
function generateTableName(interfaceName: string): string {
  return interfaceName.toLowerCase() + 's';
}

// Extrahiere JSDoc-Kommentare für Beschreibungen
function extractDescription(property: PropertySignature): string {
  try {
    const jsDoc = property.getJsDocs()[0];
    if (jsDoc) {
      return jsDoc.getDescription() || `${property.getName()} property`;
    }
  } catch (error) {
    // Ignore JSDoc parsing errors
  }
  return `${property.getName()} property`;
}

// Generiere BaseEntity-Spalten (werden zu allen Tabellen hinzugefügt)
// Reihenfolge: db_id - id - restliche BaseEntity-Felder
function generateBaseEntityColumns(): ColumnDefinition[] {
  return [
    {
      name: 'db_id',
      type: 'UUID',
      nullable: true,
      primary: false,
      description: 'Datenbank-ID für DB-Operationen',
      tsType: 'string'
    },
    {
      name: 'id',
      type: 'UUID',
      nullable: false,
      primary: true,
      description: 'Frontend-ID für State-Management',
      tsType: 'string'
    },
    {
      name: 'is_dirty',
      type: 'BOOLEAN',
      nullable: true,
      primary: false,
      defaultValue: false,
      description: 'Wurde geändert?',
      tsType: 'boolean'
    },
    {
      name: 'is_new',
      type: 'BOOLEAN',
      nullable: true,
      primary: false,
      defaultValue: false,
      description: 'Neuer Datensatz?',
      tsType: 'boolean'
    },
    {
      name: 'sync_status',
      type: 'sync_status_enum',
      nullable: true,
      primary: false,
      defaultValue: 'pending',
      description: 'Sync-Status',
      tsType: 'SyncStatus'
    },
    {
      name: 'created_at',
      type: 'TIMESTAMP',
      nullable: false,
      primary: false,
      description: 'Erstellungsdatum',
      tsType: 'Date'
    },
    {
      name: 'updated_at',
      type: 'TIMESTAMP',
      nullable: false,
      primary: false,
      description: 'Aktualisierungsdatum',
      tsType: 'Date'
    },
    {
      name: 'created_by',
      type: 'UUID',
      nullable: true,
      primary: false,
      description: 'Benutzer-ID der erstellt hat',
      tsType: 'string'
    },
    {
      name: 'updated_by',
      type: 'UUID',
      nullable: true,
      primary: false,
      description: 'Benutzer-ID der zuletzt geändert hat',
      tsType: 'string'
    },
    {
      name: 'last_modified_by',
      type: 'UUID',
      nullable: true,
      primary: false,
      description: 'Benutzer-ID der zuletzt modifiziert hat',
      tsType: 'string'
    }
  ];
}

// Generiere nur db_id und id für den Anfang
function generatePrimaryBaseEntityColumns(): ColumnDefinition[] {
  return [
    {
      name: 'db_id',
      type: 'UUID',
      nullable: false,
      primary: true,
      defaultValue: 'gen_random_uuid()',  // PostgreSQL generiert automatisch UUID
      description: 'Datenbank-ID für DB-Operationen (Primary Key)',
      tsType: 'string'
    },
    {
      name: 'id',
      type: 'UUID',
      nullable: false,
      primary: false,
      description: 'Frontend-ID für State-Management',
      tsType: 'string'
    }
  ];
}

// Generiere restliche BaseEntity-Felder für das Ende
function generateRemainingBaseEntityColumns(): ColumnDefinition[] {
  return [
    {
      name: 'is_dirty',
      type: 'BOOLEAN',
      nullable: true,
      primary: false,
      defaultValue: false,
      description: 'Wurde geändert?',
      tsType: 'boolean'
    },
    {
      name: 'is_new',
      type: 'BOOLEAN',
      nullable: true,
      primary: false,
      defaultValue: false,
      description: 'Neuer Datensatz?',
      tsType: 'boolean'
    },
    {
      name: 'sync_status',
      type: 'sync_status_enum',
      nullable: true,
      primary: false,
      defaultValue: 'pending',
      description: 'Sync-Status',
      tsType: 'SyncStatus'
    },
    {
      name: 'created_at',
      type: 'TIMESTAMP',
      nullable: false,
      primary: false,
      defaultValue: 'CURRENT_TIMESTAMP',  // PostgreSQL setzt automatisch Zeitstempel
      description: 'Erstellungsdatum',
      tsType: 'Date'
    },
    {
      name: 'updated_at',
      type: 'TIMESTAMP',
      nullable: false,
      primary: false,
      defaultValue: 'CURRENT_TIMESTAMP',  // PostgreSQL setzt automatisch Zeitstempel + Trigger für Updates
      description: 'Aktualisierungsdatum',
      tsType: 'Date'
    },
    {
      name: 'created_by',
      type: 'UUID',
      nullable: true,
      primary: false,
      description: 'Benutzer-ID der erstellt hat',
      tsType: 'string'
    },
    {
      name: 'updated_by',
      type: 'UUID',
      nullable: true,
      primary: false,
      description: 'Benutzer-ID der zuletzt geändert hat',
      tsType: 'string'
    },
    {
      name: 'last_modified_by',
      type: 'UUID',
      nullable: true,
      primary: false,
      description: 'Benutzer-ID der zuletzt modifiziert hat',
      tsType: 'string'
    }
  ];
}

// Analysiere Interface und generiere Tabellen-Definition
function analyzeInterface(interfaceDecl: InterfaceDeclaration): TableDefinition {
  const interfaceName = interfaceDecl.getName();
  const tableName = generateTableName(interfaceName);
  
  // Finde Basis-Interfaces
  const baseInterfaces = interfaceDecl.getExtends().map(ext => ext.getText());
  const extendsBaseEntity = baseInterfaces.some(b => b.includes('BaseEntity'));
  
  const columns: ColumnDefinition[] = [];
  
  // 1. Füge db_id und id am Anfang hinzu (wenn BaseEntity erweitert wird)
  if (extendsBaseEntity) {
    const primaryBaseEntityColumns = generatePrimaryBaseEntityColumns();
    columns.push(...primaryBaseEntityColumns);
  }
  
  // 2. Analysiere alle Interface-Properties (ohne BaseEntity-Felder)
  interfaceDecl.getProperties().forEach(property => {
    const propertyName = property.getName();
    
    // Überspringe BaseEntity-Felder (werden automatisch hinzugefügt)
    const baseEntityFields = ['id', 'dbId', 'isDirty', 'isNew', 'syncStatus', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'lastModifiedBy'];
    if (baseEntityFields.includes(propertyName)) {
      return;
    }
    
    const columnName = generateColumnName(propertyName);
    const typeNode = property.getTypeNode();
    
    if (!typeNode) return;
    
    const typeInfo = extractTypeInfo(typeNode);
    const description = extractDescription(property);
    
    // Bestimme PostgreSQL-Typ
    let pgType = 'TEXT'; // Default
    const fullTypeName = typeInfo.array ? `${typeInfo.type}[]` : typeInfo.type;
    
    if (complexTypeMapping[fullTypeName]) {
      pgType = complexTypeMapping[fullTypeName];
    } else if (typeMapping[fullTypeName]) {
      pgType = typeMapping[fullTypeName];
    } else if (typeMapping[typeInfo.type]) {
      pgType = typeMapping[typeInfo.type];
    }
    
    // Spezielle Behandlung für bekannte Felder
    let primary = false;
    let defaultValue: any = undefined;
    
    // Default-Werte für bestimmte Felder
    if (propertyName === 'vatRate' || propertyName === 'vat_rate') {
      defaultValue = 19.00;
    } else if (propertyName === 'markupPercentage' || propertyName === 'markup_percentage') {
      defaultValue = 300.00;
    } else if (propertyName === 'portions') {
      defaultValue = 1;
    }
    
    // Bestimme nullable-Status: Standardmäßig nullable für Frontend-Kompatibilität
    // Nur wirklich erforderliche Felder sollten NOT NULL sein
    let nullable = true; // Default: nullable für Flexibilität
    
    // Spezielle Felder, die NOT NULL sein sollten
    const requiredFields = ['name', 'title', 'email', 'category', 'supplierId', 'artikelName', 'kategorie'];
    const isRequiredField = requiredFields.some(reqField => 
      propertyName.toLowerCase().includes(reqField.toLowerCase())
    );
    
    // Supplier-ID sollte UUID sein für konsistente Foreign Key Referenzen
    if (propertyName === 'supplierId' || propertyName === 'supplier_id') {
      pgType = 'UUID';
    }
    
    // Address-Feld sollte JSONB sein (verschachteltes Objekt)
    if (propertyName === 'address') {
      pgType = 'JSONB';
    }
    
    // Verschachtelte Objekte sollten JSONB sein (erkenne an geschweiften Klammern im Typ)
    if (typeInfo.type.includes('{') || typeInfo.type.includes('interface')) {
      pgType = 'JSONB';
    }
    
    // Wenn explizit als NOT NULL markiert oder erforderliches Feld
    if (!typeInfo.nullable && !property.hasQuestionToken() && isRequiredField) {
      nullable = false;
    }
    
    columns.push({
      name: columnName,
      type: pgType,
      nullable,
      primary,
      defaultValue,
      description,
      tsType: fullTypeName
    });
  });
  
  // 3. Füge restliche BaseEntity-Spalten am Ende hinzu (für bessere Übersichtlichkeit)
  if (extendsBaseEntity) {
    const remainingBaseEntityColumns = generateRemainingBaseEntityColumns();
    columns.push(...remainingBaseEntityColumns);
  }
  
  return {
    tableName,
    interfaceName,
    columns,
    baseInterfaces
  };
}

// Hauptfunktion für automatische Schema-Generierung
function generateAutoSchema(): SchemaDefinitions {
  console.log('🔍 Starte automatische Interface-Analyse mit ts-morph...');
  
  // TypeScript-Projekt initialisieren
  const project = new Project({
    tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
  });
  
  // Quell-Dateien laden
  const sourceFiles = project.getSourceFiles();
  console.log(`📁 ${sourceFiles.length} TypeScript-Dateien gefunden`);
  
  const schemaDefinitions: SchemaDefinitions = {};
  const processedInterfaces = new Set<string>();
  
  // Alle Source-Files durchgehen
  sourceFiles.forEach(sourceFile => {
    const filePath = sourceFile.getFilePath();
    
    // Nur relevante Dateien verarbeiten (types/ Verzeichnis)
    if (!filePath.includes('types/') && !filePath.includes('src/types/')) {
      return;
    }
    
    console.log(`🔍 Analysiere: ${path.basename(filePath)}`);
    
    // Alle Interfaces in der Datei finden
    const interfaces = sourceFile.getInterfaces();
    
    interfaces.forEach(interfaceDecl => {
      const interfaceName = interfaceDecl.getName();
      
      // Nur Entity-Interfaces verarbeiten (die BaseEntity erweitern oder wichtige Interfaces sind)
      const extendsBaseEntity = interfaceDecl.getExtends().some(ext => ext.getText().includes('BaseEntity'));
      const isImportantInterface = ['Article', 'Supplier', 'Recipe', 'EinkaufsItem', 'ShoppingListItem', 'InventoryItem'].includes(interfaceName);
      
      if (!processedInterfaces.has(interfaceName) && (extendsBaseEntity || isImportantInterface)) {
        
        console.log(`  📋 Interface: ${interfaceName}`);
        
        try {
          const tableDefinition = analyzeInterface(interfaceDecl);
          schemaDefinitions[interfaceName] = tableDefinition;
          processedInterfaces.add(interfaceName);
          
          console.log(`    ✅ Tabelle: ${tableDefinition.tableName} (${tableDefinition.columns.length} Spalten)`);
        } catch (error) {
          console.error(`    ❌ Fehler bei Interface ${interfaceName}:`, error);
        }
      }
    });
  });
  
  console.log(`📊 ${Object.keys(schemaDefinitions).length} Interfaces erfolgreich analysiert`);
  return schemaDefinitions;
}

// Generiere SQL aus automatisch analysierten Schemas
function generateSQLFromAutoSchema(definitions: SchemaDefinitions): string {
  let sqlOutput = '';
  sqlOutput += '-- Automatisch generierte SQL-Befehle aus TypeScript-Interfaces\n';
  sqlOutput += '-- Generiert am: ' + new Date().toISOString() + '\n';
  sqlOutput += '-- Automatische Schema-Generierung mit ts-morph\n\n';

  // Enum Types zuerst erstellen
  sqlOutput += '-- ========================================\n';
  sqlOutput += '-- Enum Types\n';
  sqlOutput += '-- ========================================\n\n';
  sqlOutput += 'CREATE TYPE IF NOT EXISTS sync_status_enum AS ENUM (\'synced\', \'pending\', \'error\', \'conflict\');\n';
  sqlOutput += 'CREATE TYPE IF NOT EXISTS difficulty_enum AS ENUM (\'1\', \'2\', \'3\', \'4\', \'5\');\n';
  sqlOutput += 'CREATE TYPE IF NOT EXISTS unit_enum AS ENUM (\'kg\', \'g\', \'l\', \'ml\', \'Stück\', \'Packung\', \'Dose\', \'Glas\', \'Bund\', \'Portion\');\n\n';

  // Generiere SQL für jede Tabelle
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    sqlOutput += `-- ========================================\n`;
    sqlOutput += `-- Tabelle: ${definition.tableName} (Interface: ${definition.interfaceName})\n`;
    sqlOutput += `-- ========================================\n\n`;

    // CREATE TABLE
    sqlOutput += `-- Erstelle Tabelle: ${definition.tableName} (Interface: ${definition.interfaceName})\n`;
    sqlOutput += `CREATE TABLE IF NOT EXISTS ${definition.tableName} (\n`;
    
    const columnDefinitions: string[] = [];
    
    for (const column of definition.columns) {
      const nullable = column.nullable ? '' : 'NOT NULL';
      const primary = column.primary ? 'PRIMARY KEY' : '';
      
      // Spezielle Behandlung für SQL-Funktionen (nicht in Anführungszeichen setzen)
      let defaultVal = '';
      if (column.defaultValue !== undefined) {
        const sqlFunctions = ['gen_random_uuid()', 'CURRENT_TIMESTAMP', 'NOW()'];
        const isSqlFunction = sqlFunctions.includes(column.defaultValue);
        
        defaultVal = `DEFAULT ${isSqlFunction ? column.defaultValue : 
          (typeof column.defaultValue === 'string' ? `'${column.defaultValue}'` : column.defaultValue)}`;
      }
      
      const columnDef = `${column.name} ${column.type} ${primary} ${defaultVal} ${nullable}`.replace(/\s+/g, ' ').trim();
      columnDefinitions.push(columnDef);
    }
    
    sqlOutput += columnDefinitions.join(',\n');
    sqlOutput += '\n);\n\n';

    // INDEXES
    sqlOutput += `-- Indizes für ${definition.tableName}\n`;
    
    // Basis-Indizes für BaseEntity-Felder (wenn vorhanden)
    const hasId = definition.columns.find(col => col.name === 'id');
    const hasDbId = definition.columns.find(col => col.name === 'db_id' && col.primary);
    const hasCreatedAt = definition.columns.find(col => col.name === 'created_at');
    const hasUpdatedAt = definition.columns.find(col => col.name === 'updated_at');
    
    // Index für Primary Key (db_id) wird automatisch erstellt, aber explizit für Frontend-ID (id)
    if (hasId) {
      sqlOutput += `-- Index für Frontend-ID (id)\n`;
      sqlOutput += `CREATE INDEX IF NOT EXISTS idx_${definition.tableName}_id ON ${definition.tableName}(id);\n`;
    }
    if (hasDbId) {
      sqlOutput += `-- Index für Primary Key (db_id)\n`;
      sqlOutput += `CREATE INDEX IF NOT EXISTS idx_${definition.tableName}_db_id ON ${definition.tableName}(db_id);\n`;
    }
    if (hasCreatedAt) {
      sqlOutput += `-- Index für Erstellungsdatum\n`;
      sqlOutput += `CREATE INDEX IF NOT EXISTS idx_${definition.tableName}_created_at ON ${definition.tableName}(created_at);\n`;
    }
    if (hasUpdatedAt) {
      sqlOutput += `-- Index für Aktualisierungsdatum\n`;
      sqlOutput += `CREATE INDEX IF NOT EXISTS idx_${definition.tableName}_updated_at ON ${definition.tableName}(updated_at);\n`;
    }
    
    // Spezielle Indizes basierend auf Interface-Namen
    if (definition.interfaceName === 'Article') {
      const supplierIdColumn = definition.columns.find(col => col.name === 'supplier_id' || col.name === 'supplierId');
      const categoryColumn = definition.columns.find(col => col.name === 'category');
      
      if (supplierIdColumn) {
        sqlOutput += `-- Index für Lieferant-Referenz\n`;
        sqlOutput += `CREATE INDEX IF NOT EXISTS idx_${definition.tableName}_supplier_id ON ${definition.tableName}(${supplierIdColumn.name});\n`;
      }
      if (categoryColumn) {
        sqlOutput += `-- Index für Kategorie\n`;
        sqlOutput += `CREATE INDEX IF NOT EXISTS idx_${definition.tableName}_category ON ${definition.tableName}(${categoryColumn.name});\n`;
      }
    }
    
    sqlOutput += '\n';

    // COMMENTS
    sqlOutput += `-- Kommentare für Spalten in ${definition.tableName}\n`;
    for (const column of definition.columns) {
      sqlOutput += `-- Kommentar für Spalte: ${column.name}\n`;
      sqlOutput += `COMMENT ON COLUMN ${definition.tableName}.${column.name} IS '${column.description} (TS: ${column.tsType})';\n`;
    }
    sqlOutput += '\n';
  }

  // FOREIGN KEYS (deaktiviert - werden in der App-Logik abgefangen)
  sqlOutput += `-- ========================================\n`;
  sqlOutput += `-- Foreign Key Constraints (DEAKTIVIERT)\n`;
  sqlOutput += `-- ========================================\n`;
  sqlOutput += `-- Foreign Keys werden bewusst nicht erstellt, um ungewollte Löschungen zu vermeiden.\n`;
  sqlOutput += `-- Referentielle Integrität wird in der App-Logik sichergestellt.\n\n`;
  
  // Automatische Foreign Key Erkennung (nur als Kommentar)
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    for (const column of definition.columns) {
      if (column.name === 'supplier_id' || column.name === 'supplierId') {
        sqlOutput += `-- POTENTIELLER Foreign Key (deaktiviert):\n`;
        sqlOutput += `-- ALTER TABLE ${definition.tableName} ADD CONSTRAINT fk_${definition.tableName}_supplier \n`;
        sqlOutput += `--   FOREIGN KEY (${column.name}) REFERENCES suppliers(db_id) \n`;
        sqlOutput += `--   ON DELETE SET NULL ON UPDATE CASCADE;\n\n`;
      }
    }
  }

  // CHECK CONSTRAINTS
  sqlOutput += `-- ========================================\n`;
  sqlOutput += `-- Check Constraints\n`;
  sqlOutput += `-- ========================================\n\n`;
  
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    // Positive Preise
    const priceColumns = definition.columns.filter(col => 
      col.name.includes('price') || col.name.includes('Price')
    );
    
    if (priceColumns.length > 0) {
      const priceChecks = priceColumns.map(col => `${col.name} >= 0`).join(' AND ');
      sqlOutput += `-- Check Constraint für positive Preise in ${definition.tableName}\n`;
      sqlOutput += `ALTER TABLE ${definition.tableName} ADD CONSTRAINT chk_${definition.tableName}_positive_prices \n`;
      sqlOutput += `  CHECK (${priceChecks});\n\n`;
    }
    
    // Positive Zahlen
    const numberColumns = definition.columns.filter(col => 
      (col.name.includes('amount') || col.name.includes('content') || col.name.includes('portions')) &&
      col.type === 'DECIMAL'
    );
    
    if (numberColumns.length > 0) {
      numberColumns.forEach(col => {
        sqlOutput += `-- Check Constraint für positive ${col.name} in ${definition.tableName}\n`;
        sqlOutput += `ALTER TABLE ${definition.tableName} ADD CONSTRAINT chk_${definition.tableName}_positive_${col.name} \n`;
        sqlOutput += `  CHECK (${col.name} > 0);\n\n`;
      });
    }
  }

  // MIGRATION NOTES
  sqlOutput += `-- ========================================\n`;
  sqlOutput += `-- Migration Notes\n`;
  sqlOutput += `-- ========================================\n\n`;
  sqlOutput += `-- Automatisch generiert aus TypeScript-Interfaces\n`;
  sqlOutput += `-- 1. Führen Sie diese Befehle in der richtigen Reihenfolge aus\n`;
  sqlOutput += `-- 2. Für bestehende Tabellen: Prüfen Sie auf Konflikte\n`;
  sqlOutput += `-- 3. Testen Sie die Constraints und Foreign Keys\n`;
  sqlOutput += `-- 4. Backup vor Migration erstellen\n\n`;

  sqlOutput += `-- Ende der automatisch generierten SQL-Befehle\n`;

  return sqlOutput;
}

// Generiere Migrations-Code für Schema-Änderungen
// 
// WICHTIG: Neue Migrationen hinzufügen:
// 1. Erhöhe targetVersion in generatePostgreSQLInitScript()
// 2. Füge neue Migration hier hinzu mit Versions-Check
// 3. Füge RAISE NOTICE Meldungen für Transparenz hinzu
//
function generateMigrations(definitions: SchemaDefinitions, currentVersion: string, targetVersion: string): string {
  let migrations = '';
  
  migrations += `-- ========================================\n`;
  migrations += `-- Schema-Migrations-System\n`;
  migrations += `-- Version: ${currentVersion} → ${targetVersion}\n`;
  migrations += `-- Automatisch generiert - Migrationen werden nur einmal ausgeführt\n`;
  migrations += `-- ========================================\n\n`;
  migrations += `-- Migrationen für bestehende Tabellen\n`;
  migrations += `DO $$\n`;
  migrations += `DECLARE\n`;
  migrations += `    current_schema_version TEXT;\n`;
  migrations += `BEGIN\n`;
  migrations += `    -- Hole aktuelle Schema-Version\n`;
  migrations += `    SELECT value INTO current_schema_version \n`;
  migrations += `    FROM system_info \n`;
  migrations += `    WHERE key = 'schema_version' \n`;
  migrations += `    LIMIT 1;\n`;
  migrations += `    \n`;
  migrations += `    RAISE NOTICE '=========================================';\n`;
  migrations += `    RAISE NOTICE 'Schema-Migrations-System';\n`;
  migrations += `    RAISE NOTICE 'Aktuelle Version: %', COALESCE(current_schema_version, 'keine');\n`;
  migrations += `    RAISE NOTICE 'Ziel-Version: ${targetVersion}';\n`;
  migrations += `    RAISE NOTICE '=========================================';\n`;
  migrations += `    \n`;
  
  // Migration 1: Spezifische Typ-Konvertierungen
  migrations += `    -- Migration 1: Typ-Konvertierungen (v${currentVersion} → v${targetVersion})\n`;
  migrations += `    IF current_schema_version IS NULL OR current_schema_version::DECIMAL < ${targetVersion} THEN\n`;
  migrations += `        RAISE NOTICE 'Führe Typ-Konvertierungen aus...';\n`;
  migrations += `        \n`;
  
  // Durchsuche alle Definitionen nach speziellen Typ-Konvertierungen
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    for (const column of definition.columns) {
      // address-Feld: TEXT → JSONB
      if (column.name === 'address' && column.type === 'JSONB') {
        migrations += `        -- ${definition.tableName}.address: TEXT → JSONB\n`;
        migrations += `        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${definition.tableName}') THEN\n`;
        migrations += `            IF EXISTS (\n`;
        migrations += `                SELECT 1 FROM information_schema.columns \n`;
        migrations += `                WHERE table_name = '${definition.tableName}' \n`;
        migrations += `                AND column_name = 'address' \n`;
        migrations += `                AND data_type = 'text'\n`;
        migrations += `            ) THEN\n`;
        migrations += `                ALTER TABLE ${definition.tableName} ALTER COLUMN address TYPE JSONB USING \n`;
        migrations += `                    CASE \n`;
        migrations += `                        WHEN address IS NULL THEN NULL\n`;
        migrations += `                        WHEN address = '' THEN NULL\n`;
        migrations += `                        WHEN address LIKE '{%}' THEN address::jsonb\n`;
        migrations += `                        ELSE NULL\n`;
        migrations += `                    END;\n`;
        migrations += `                RAISE NOTICE '✅ ${definition.tableName}.address: TEXT → JSONB konvertiert';\n`;
        migrations += `            ELSE\n`;
        migrations += `                RAISE NOTICE '✓ ${definition.tableName}.address ist bereits JSONB';\n`;
        migrations += `            END IF;\n`;
        migrations += `        END IF;\n`;
        migrations += `        \n`;
      }
    }
  }
  
  migrations += `    END IF;\n`;
  migrations += `    \n`;
  
  // Migration 2: DEFAULT-Werte für db_id
  migrations += `    -- Migration 2: db_id mit DEFAULT gen_random_uuid()\n`;
  migrations += `    IF current_schema_version IS NULL OR current_schema_version::DECIMAL < ${targetVersion} THEN\n`;
  migrations += `        RAISE NOTICE 'Prüfe db_id DEFAULT-Werte...';\n`;
  migrations += `        \n`;
  migrations += `        DECLARE\n`;
  migrations += `            table_name TEXT;\n`;
  migrations += `        BEGIN\n`;
  migrations += `            FOR table_name IN SELECT unnest(ARRAY[`;
  
  // Sammle alle Tabellennamen
  const tableNames = Object.values(definitions).map(def => `'${def.tableName}'`).join(', ');
  migrations += tableNames;
  
  migrations += `])\n`;
  migrations += `            LOOP\n`;
  migrations += `                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = table_name) THEN\n`;
  migrations += `                    IF NOT EXISTS (\n`;
  migrations += `                        SELECT 1 FROM information_schema.columns \n`;
  migrations += `                        WHERE table_schema = 'public' \n`;
  migrations += `                        AND columns.table_name = table_name \n`;
  migrations += `                        AND column_name = 'db_id' \n`;
  migrations += `                        AND column_default LIKE '%gen_random_uuid%'\n`;
  migrations += `                    ) THEN\n`;
  migrations += `                        EXECUTE format('ALTER TABLE %I ALTER COLUMN db_id SET DEFAULT gen_random_uuid()', table_name);\n`;
  migrations += `                        RAISE NOTICE '✅ %.db_id: DEFAULT gen_random_uuid() hinzugefügt', table_name;\n`;
  migrations += `                    ELSE\n`;
  migrations += `                        RAISE NOTICE '✓ %.db_id hat bereits DEFAULT', table_name;\n`;
  migrations += `                    END IF;\n`;
  migrations += `                END IF;\n`;
  migrations += `            END LOOP;\n`;
  migrations += `        END;\n`;
  migrations += `    END IF;\n`;
  migrations += `    \n`;
  
  // Migration 3: DEFAULT-Werte für Timestamps
  migrations += `    -- Migration 3: created_at und updated_at mit DEFAULT CURRENT_TIMESTAMP\n`;
  migrations += `    IF current_schema_version IS NULL OR current_schema_version::DECIMAL < ${targetVersion} THEN\n`;
  migrations += `        RAISE NOTICE 'Prüfe Timestamp DEFAULT-Werte...';\n`;
  migrations += `        \n`;
  migrations += `        DECLARE\n`;
  migrations += `            table_name TEXT;\n`;
  migrations += `        BEGIN\n`;
  migrations += `            FOR table_name IN SELECT unnest(ARRAY[${tableNames}])\n`;
  migrations += `            LOOP\n`;
  migrations += `                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = table_name) THEN\n`;
  migrations += `                    -- Prüfe created_at DEFAULT\n`;
  migrations += `                    IF NOT EXISTS (\n`;
  migrations += `                        SELECT 1 FROM information_schema.columns \n`;
  migrations += `                        WHERE table_schema = 'public' \n`;
  migrations += `                        AND columns.table_name = table_name \n`;
  migrations += `                        AND column_name = 'created_at' \n`;
  migrations += `                        AND column_default IS NOT NULL\n`;
  migrations += `                    ) THEN\n`;
  migrations += `                        EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP', table_name);\n`;
  migrations += `                        RAISE NOTICE '✅ %.created_at: DEFAULT CURRENT_TIMESTAMP hinzugefügt', table_name;\n`;
  migrations += `                    END IF;\n`;
  migrations += `                    \n`;
  migrations += `                    -- Prüfe updated_at DEFAULT\n`;
  migrations += `                    IF NOT EXISTS (\n`;
  migrations += `                        SELECT 1 FROM information_schema.columns \n`;
  migrations += `                        WHERE table_schema = 'public' \n`;
  migrations += `                        AND columns.table_name = table_name \n`;
  migrations += `                        AND column_name = 'updated_at' \n`;
  migrations += `                        AND column_default IS NOT NULL\n`;
  migrations += `                    ) THEN\n`;
  migrations += `                        EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP', table_name);\n`;
  migrations += `                        RAISE NOTICE '✅ %.updated_at: DEFAULT CURRENT_TIMESTAMP hinzugefügt', table_name;\n`;
  migrations += `                    END IF;\n`;
  migrations += `                END IF;\n`;
  migrations += `            END LOOP;\n`;
  migrations += `        END;\n`;
  migrations += `    END IF;\n`;
  migrations += `    \n`;
  
  migrations += `END $$;\n\n`;
  
  return migrations;
}

// Generiere vollständige Init-Script für PostgreSQL
function generatePostgreSQLInitScript(definitions: SchemaDefinitions): string {
  const timestamp = new Date().toISOString();
  const currentVersion = '2.0.0'; // Bisherige Version
  const targetVersion = '2.2.2';  // Neue Version mit Migrationen
  
  let script = `-- Chef Numbers Database Initialization Script (PostgreSQL)
-- Wird beim ersten Start der PostgreSQL-Datenbank ausgeführt
-- Frontend-synchronisiertes Schema v${targetVersion}
-- Automatisch generiert am: ${timestamp}

-- Erstelle Rollen für PostgreSQL
DO $$
BEGIN
    -- Standard-Benutzer postgres erstellen (falls nicht vorhanden)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE ROLE postgres WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD 'postgres';
        RAISE NOTICE 'Standard-Benutzer postgres erstellt';
    ELSE
        RAISE NOTICE 'Standard-Benutzer postgres existiert bereits';
    END IF;

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

-- Erstelle Schema
CREATE SCHEMA IF NOT EXISTS public;

-- Berechtigungen vergeben
-- WICHTIG: Database-Level Berechtigungen (falls Datenbank chef_numbers existiert)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'chef_numbers') THEN
        GRANT ALL PRIVILEGES ON DATABASE chef_numbers TO postgres;
        RAISE NOTICE 'Berechtigungen für Datenbank chef_numbers erteilt';
    ELSE
        RAISE NOTICE 'Datenbank chef_numbers nicht gefunden, überspringe Database-Level Berechtigungen';
    END IF;
END
$$;

-- Setze Schema-Berechtigungen
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON SCHEMA public TO service_role, postgres;

-- Berechtigungen für bestehende Objekte
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- ========================================
-- Enum Types (erstellen mit DO-Block für Fehlerbehandlung)
-- ========================================

DO $$
BEGIN
    -- Sync Status Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status_enum') THEN
        CREATE TYPE sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
        RAISE NOTICE 'Enum sync_status_enum erstellt';
    ELSE
        RAISE NOTICE 'Enum sync_status_enum existiert bereits';
    END IF;
    
    -- Difficulty Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_enum') THEN
        CREATE TYPE difficulty_enum AS ENUM ('1', '2', '3', '4', '5');
        RAISE NOTICE 'Enum difficulty_enum erstellt';
    ELSE
        RAISE NOTICE 'Enum difficulty_enum existiert bereits';
    END IF;
    
    -- Unit Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_enum') THEN
        CREATE TYPE unit_enum AS ENUM ('kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Dose', 'Glas', 'Bund', 'Portion');
        RAISE NOTICE 'Enum unit_enum erstellt';
    ELSE
        RAISE NOTICE 'Enum unit_enum existiert bereits';
    END IF;
END
$$;

-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Automatisch generierte Tabellen aus TypeScript-Interfaces
-- ========================================

`;

  // Füge das generierte Schema hinzu (ohne die Enum-Typen, da sie bereits oben erstellt wurden)
  const sqlOutput = generateSQLFromAutoSchema(definitions);
  // Entferne die Enum-Typ-Erstellung aus dem generierten SQL, da sie bereits oben erstellt wurden
  const sqlWithoutEnums = sqlOutput.replace(/-- ========================================\n-- Enum Types\n-- ========================================\n\nCREATE TYPE IF NOT EXISTS [^;]+;\nCREATE TYPE IF NOT EXISTS [^;]+;\nCREATE TYPE IF NOT EXISTS [^;]+;\n\n/g, '');
  script += sqlWithoutEnums;
  
  // Füge zusätzliche System-Tabellen hinzu
  script += `
-- Design-Tabelle für UI-Einstellungen
CREATE TABLE IF NOT EXISTS design (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme TEXT DEFAULT 'light',
    primary_color TEXT DEFAULT '#007bff',
    secondary_color TEXT DEFAULT '#6c757d',
    accent_color TEXT DEFAULT '#28a745',
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#212529',
    card_color TEXT DEFAULT '#f8f9fa',
    border_color TEXT DEFAULT '#dee2e6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping List Tabelle
CREATE TABLE IF NOT EXISTS shopping_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Tabelle
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID,
    quantity DECIMAL DEFAULT 0,
    unit TEXT DEFAULT 'Stück',
    expiry_date DATE,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;
  
  // Füge Migrations-Code hinzu
  script += generateMigrations(definitions, currentVersion, targetVersion);
  
  script += `-- Füge System-Informationen hinzu (mit aktualisierter Schema-Version)
INSERT INTO system_info (key, value, description) VALUES 
    ('app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
    ('version', '${targetVersion}', 'Aktuelle Version'),
    ('database_created', CURRENT_TIMESTAMP::text, 'Datum der Datenbankerstellung'),
    ('connection_tested_at', CURRENT_TIMESTAMP::text, 'Letzter Verbindungstest'),
    ('postgresql_version', '${targetVersion}', 'PostgreSQL Frontend-synchronisiert Version'),
    ('setup_completed', 'true', 'Initial Setup abgeschlossen'),
    ('schema_version', '${targetVersion}', 'Frontend-synchronisiertes Schema - Migrationen bis v${targetVersion} angewendet')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Erstelle Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Füge updated_at Trigger zu allen Tabellen hinzu
`;

  // Füge Trigger für alle generierten Tabellen hinzu
  Object.values(definitions).forEach(def => {
    script += `CREATE TRIGGER update_${def.tableName}_updated_at BEFORE UPDATE ON ${def.tableName} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n`;
  });
  
  // Füge Trigger für System-Tabellen hinzu
  script += `CREATE TRIGGER update_design_updated_at BEFORE UPDATE ON design FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_list_updated_at BEFORE UPDATE ON shopping_list FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security (RLS) Setup
-- ========================================

-- Aktiviere Row Level Security für alle generierten Tabellen
`;
  
  // Aktiviere RLS für alle generierten Tabellen
  Object.values(definitions).forEach(def => {
    script += `ALTER TABLE ${def.tableName} ENABLE ROW LEVEL SECURITY;\n`;
  });
  
  // Aktiviere RLS für System-Tabellen
  script += `ALTER TABLE design ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies (erlaube alle Operationen für alle Rollen)
-- ========================================

`;
  
  // Erstelle RLS-Policies für alle generierten Tabellen
  Object.values(definitions).forEach(def => {
    script += `-- RLS Policy für ${def.tableName}
CREATE POLICY "Enable all operations for all users" ON ${def.tableName} FOR ALL USING (true);

`;
  });
  
  // Erstelle RLS-Policies für System-Tabellen
  script += `-- RLS Policies für System-Tabellen
CREATE POLICY "Enable all operations for all users" ON design FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON shopping_list FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON inventory FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON system_info FOR ALL USING (true);

-- WICHTIG: Explizite Berechtigungen für alle bestehenden Tabellen (PostgREST benötigt diese!)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- Berechtigungen für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, postgres;

-- Erfolgsmeldung
SELECT 'PostgreSQL-Initialisierung erfolgreich abgeschlossen!' as status;
SELECT 'Frontend-synchronisiertes Schema v${targetVersion} installiert' as schema_info;
SELECT 'Verfolgbare Migrationen von v${currentVersion} zu v${targetVersion}' as migration_info;
SELECT 'Verfügbare Benutzer:' as info;
SELECT rolname as benutzer FROM pg_roles WHERE rolcanlogin = true;
`;

  return script;
}

// Generiere vollständige Init-Script für MariaDB/MySQL
function generateMariaDBInitScript(definitions: SchemaDefinitions, dbType: 'mariadb' | 'mysql'): string {
  const timestamp = new Date().toISOString();
  const currentVersion = '2.0.0';
  const targetVersion = '2.2.2';
  const dbName = dbType === 'mariadb' ? 'MariaDB' : 'MySQL';
  
  let script = `-- Chef Numbers Database Initialization Script (${dbName})
-- Frontend-synchronisiertes Schema v${targetVersion}
-- Automatisch generiert am: ${timestamp}

-- Erstelle die Datenbank falls sie nicht existiert
CREATE DATABASE IF NOT EXISTS chef_numbers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chef_numbers;

-- ========================================
-- Automatisch generierte Tabellen aus TypeScript-Interfaces
-- ========================================

`;

  // Generiere Tabellen für jede Definition
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    script += `-- ========================================\n`;
    script += `-- Tabelle: ${definition.tableName} (Interface: ${definition.interfaceName})\n`;
    script += `-- ========================================\n\n`;

    script += `CREATE TABLE IF NOT EXISTS ${definition.tableName} (\n`;
    
    const columnDefinitions: string[] = [];
    
    for (const column of definition.columns) {
      // MariaDB/MySQL Typ-Mapping
      let mysqlType = column.type;
      
      // Typ-Konvertierungen für MariaDB/MySQL
      if (mysqlType === 'UUID') {
        mysqlType = 'CHAR(36)';  // UUIDs als CHAR(36) in MySQL
      } else if (mysqlType === 'TEXT[]') {
        mysqlType = 'JSON';  // Arrays als JSON in MySQL
      } else if (mysqlType === 'JSONB') {
        mysqlType = 'JSON';  // JSONB wird zu JSON in MySQL
      } else if (mysqlType === 'TIMESTAMP') {
        mysqlType = 'DATETIME';  // TIMESTAMP als DATETIME
      } else if (mysqlType === 'sync_status_enum') {
        mysqlType = "ENUM('synced', 'pending', 'error', 'conflict')";
      }
      
      const nullable = column.nullable ? 'NULL' : 'NOT NULL';
      const primary = column.primary ? 'PRIMARY KEY' : '';
      
      // Default-Werte für MySQL
      let defaultVal = '';
      if (column.defaultValue !== undefined) {
        if (column.defaultValue === 'gen_random_uuid()') {
          // MySQL unterstützt keine UUID-Generierung - wird von der App gesetzt
          defaultVal = '';
        } else if (column.defaultValue === 'CURRENT_TIMESTAMP') {
          defaultVal = 'DEFAULT CURRENT_TIMESTAMP';
        } else if (typeof column.defaultValue === 'string') {
          defaultVal = `DEFAULT '${column.defaultValue}'`;
        } else {
          defaultVal = `DEFAULT ${column.defaultValue}`;
        }
      }
      
      // Spezielle Behandlung für updated_at
      let onUpdate = '';
      if (column.name === 'updated_at') {
        onUpdate = 'ON UPDATE CURRENT_TIMESTAMP';
      }
      
      const columnDef = `${column.name} ${mysqlType} ${primary} ${defaultVal} ${onUpdate} ${nullable}`.replace(/\s+/g, ' ').trim();
      columnDefinitions.push(`    ${columnDef}`);
    }
    
    script += columnDefinitions.join(',\n');
    script += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

    // Indizes
    script += `-- Indizes für ${definition.tableName}\n`;
    
    const hasId = definition.columns.find(col => col.name === 'id');
    const hasDbId = definition.columns.find(col => col.name === 'db_id' && col.primary);
    const hasCreatedAt = definition.columns.find(col => col.name === 'created_at');
    const hasUpdatedAt = definition.columns.find(col => col.name === 'updated_at');
    
    if (hasId && !hasId.primary) {
      script += `CREATE INDEX idx_${definition.tableName}_id ON ${definition.tableName}(id);\n`;
    }
    if (hasCreatedAt) {
      script += `CREATE INDEX idx_${definition.tableName}_created_at ON ${definition.tableName}(created_at);\n`;
    }
    if (hasUpdatedAt) {
      script += `CREATE INDEX idx_${definition.tableName}_updated_at ON ${definition.tableName}(updated_at);\n`;
    }
    
    // Spezielle Indizes basierend auf Interface
    if (definition.interfaceName === 'Article') {
      const supplierIdColumn = definition.columns.find(col => col.name === 'supplier_id');
      const categoryColumn = definition.columns.find(col => col.name === 'category');
      
      if (supplierIdColumn) {
        script += `CREATE INDEX idx_${definition.tableName}_supplier_id ON ${definition.tableName}(supplier_id);\n`;
      }
      if (categoryColumn) {
        script += `CREATE INDEX idx_${definition.tableName}_category ON ${definition.tableName}(category(100));\n`;
      }
    }
    
    script += '\n';
  }

  // System-Tabellen
  script += `-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id CHAR(36) PRIMARY KEY,
    \`key\` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Design-Tabelle für UI-Einstellungen
CREATE TABLE IF NOT EXISTS design (
    id CHAR(36) PRIMARY KEY,
    theme VARCHAR(50) DEFAULT 'light',
    primary_color VARCHAR(7) DEFAULT '#007bff',
    secondary_color VARCHAR(7) DEFAULT '#6c757d',
    accent_color VARCHAR(7) DEFAULT '#28a745',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#212529',
    card_color VARCHAR(7) DEFAULT '#f8f9fa',
    border_color VARCHAR(7) DEFAULT '#dee2e6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping List Tabelle
CREATE TABLE IF NOT EXISTS shopping_list (
    id CHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    items JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Tabelle
CREATE TABLE IF NOT EXISTS inventory (
    id CHAR(36) PRIMARY KEY,
    article_id CHAR(36),
    quantity DECIMAL(10,3) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Stück',
    expiry_date DATE,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  // System-Informationen
  script += `-- Füge System-Informationen hinzu (mit aktualisierter Schema-Version)
-- MariaDB/MySQL benötigt explizite UUIDs für id-Feld
INSERT INTO system_info (id, \`key\`, value, description) VALUES 
    (UUID(), 'app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
    (UUID(), 'version', '${targetVersion}', 'Aktuelle Version'),
    (UUID(), 'database_created', NOW(), 'Datum der Datenbankerstellung'),
    (UUID(), 'connection_tested_at', NOW(), 'Letzter Verbindungstest'),
    (UUID(), '${dbType.toLowerCase()}_version', '${targetVersion}', '${dbName} Frontend-synchronisiert Version'),
    (UUID(), 'setup_completed', 'true', 'Initial Setup abgeschlossen'),
    (UUID(), 'schema_version', '${targetVersion}', 'Frontend-synchronisiertes Schema - Version ${targetVersion}')
ON DUPLICATE KEY UPDATE 
    value = VALUES(value),
    updated_at = CURRENT_TIMESTAMP;

-- Erfolgsmeldung
SELECT '${dbName}-Initialisierung erfolgreich abgeschlossen!' as status;
SELECT 'Frontend-synchronisiertes Schema v${targetVersion} installiert' as schema_info;
`;

  return script;
}

// Generiere Prisma Schema für MariaDB/MySQL
function generatePrismaSchema(definitions: SchemaDefinitions): string {
  const timestamp = new Date().toISOString();
  const targetVersion = '2.2.2';
  
  let schema = `// Chef Numbers Prisma Schema
// Frontend-synchronisiertes Schema v${targetVersion}
// Automatisch generiert am: ${timestamp}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

`;

  // Generiere Models für jede Definition
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    schema += `// Model: ${definition.interfaceName}\n`;
    schema += `model ${definition.interfaceName} {\n`;
    
    for (const column of definition.columns) {
      let prismaType = '';
      
      // Spezielle Behandlung für bekannte Array-Felder (allergens, additives)
      // Diese sind in MariaDB als JSON gespeichert, aber werden als Arrays verwendet
      if (column.name === 'allergens' || column.name === 'additives') {
        prismaType = 'Json';
      }
      // Typ-Mapping für Prisma
      else if (column.type === 'UUID' || column.type === 'CHAR(36)') {
        prismaType = 'String';
      } else if (column.type === 'TEXT') {
        prismaType = 'String';
      } else if (column.type === 'DECIMAL') {
        prismaType = 'Decimal';
      } else if (column.type === 'INTEGER' || column.type === 'INT') {
        prismaType = 'Int';
      } else if (column.type === 'BOOLEAN') {
        prismaType = 'Boolean';
      } else if (column.type === 'DATETIME' || column.type === 'TIMESTAMP') {
        prismaType = 'DateTime';
      } else if (column.type === 'JSON' || column.type === 'JSONB') {
        prismaType = 'Json';
      } else if (column.type.startsWith('ENUM')) {
        // Für Enums nehmen wir String
        prismaType = 'String';
      } else {
        prismaType = 'String';  // Fallback
      }
      
      // Optional vs Required
      const optional = column.nullable ? '?' : '';
      
      // Attribute
      const attributes: string[] = [];
      
      // Primary Key
      if (column.primary) {
        attributes.push('@id');
      }
      
      // Default Values
      if (column.defaultValue !== undefined) {
        if (column.defaultValue === 'gen_random_uuid()') {
          attributes.push('@default(uuid())');
        } else if (column.defaultValue === 'CURRENT_TIMESTAMP') {
          attributes.push('@default(now())');
        } else if (typeof column.defaultValue === 'string') {
          attributes.push(`@default("${column.defaultValue}")`);
        } else if (typeof column.defaultValue === 'boolean') {
          attributes.push(`@default(${column.defaultValue})`);
        } else {
          attributes.push(`@default(${column.defaultValue})`);
        }
      }
      
      // Updated At
      if (column.name === 'updated_at') {
        attributes.push('@updatedAt');
      }
      
      // Field Mapping (wenn camelCase zu snake_case)
      const camelCaseName = column.name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (camelCaseName !== column.name && column.name !== 'id' && column.name !== 'db_id') {
        attributes.push(`@map("${column.name}")`);
      }
      
      // DB Type Annotations
      if (prismaType === 'String' && column.type === 'TEXT') {
        attributes.push('@db.Text');
      } else if (prismaType === 'String' && (column.type === 'UUID' || column.type === 'CHAR(36)')) {
        attributes.push('@db.VarChar(36)');
      } else if (prismaType === 'Decimal') {
        attributes.push('@db.Decimal(10, 4)');
      } else if (prismaType === 'DateTime') {
        attributes.push('@db.DateTime');
      }
      
      // Baue die Zeile zusammen
      const fieldName = camelCaseName;
      const attrString = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
      schema += `  ${fieldName.padEnd(22)} ${prismaType}${optional}${attrString}\n`;
    }
    
    // Table Mapping
    schema += `\n  @@map("${definition.tableName}")\n`;
    schema += `}\n\n`;
  }

  // System-Tabellen hinzufügen
  schema += `// System-Tabellen

model SystemInfo {
  id          String   @id @default(uuid()) @db.VarChar(36)
  key         String   @unique @db.VarChar(100)
  value       String   @db.Text
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.DateTime
  updatedAt   DateTime @updatedAt @map("updated_at") @db.DateTime

  @@map("system_info")
}

model Design {
  id              String   @id @default(uuid()) @db.VarChar(36)
  theme           String?  @default("light") @db.VarChar(50)
  primaryColor    String?  @default("#007bff") @map("primary_color") @db.VarChar(7)
  secondaryColor  String?  @default("#6c757d") @map("secondary_color") @db.VarChar(7)
  accentColor     String?  @default("#28a745") @map("accent_color") @db.VarChar(7)
  backgroundColor String?  @default("#ffffff") @map("background_color") @db.VarChar(7)
  textColor       String?  @default("#212529") @map("text_color") @db.VarChar(7)
  cardColor       String?  @default("#f8f9fa") @map("card_color") @db.VarChar(7)
  borderColor     String?  @default("#dee2e6") @map("border_color") @db.VarChar(7)
  createdAt       DateTime @default(now()) @map("created_at") @db.DateTime
  updatedAt       DateTime @updatedAt @map("updated_at") @db.DateTime

  @@map("design")
}

model ShoppingList {
  id        String   @id @default(uuid()) @db.VarChar(36)
  name      String   @db.Text
  items     Json?
  createdAt DateTime @default(now()) @map("created_at") @db.DateTime
  updatedAt DateTime @updatedAt @map("updated_at") @db.DateTime

  @@map("shopping_list")
}

model Inventory {
  id         String   @id @default(uuid()) @db.VarChar(36)
  articleId  String?  @map("article_id") @db.VarChar(36)
  quantity   Decimal  @default(0) @db.Decimal(10, 3)
  unit       String?  @default("Stück") @db.VarChar(50)
  expiryDate DateTime? @map("expiry_date") @db.Date
  location   String?  @db.Text
  createdAt  DateTime @default(now()) @map("created_at") @db.DateTime
  updatedAt  DateTime @updatedAt @map("updated_at") @db.DateTime

  @@map("inventory")
}
`;

  return schema;
}

// Generiere Prisma REST API Server
function generatePrismaServer(definitions: SchemaDefinitions): string {
  const timestamp = new Date().toISOString();
  const targetVersion = '2.2.2';
  
  let server = `// Chef Numbers Prisma REST API Server
// Frontend-synchronisiertes Schema v${targetVersion}
// Automatisch generiert am: ${timestamp}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// UUID Generator für MariaDB/MySQL (da keine native UUID-Unterstützung)
const generateUUID = () => {
  return uuidv4();
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging Middleware
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} \${req.method} \${req.path}\`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '${targetVersion}',
    database: 'connected'
  });
});

// Test Connection Endpoint (für Frontend-Verbindungstests)
app.post('/api/test-connection', async (req, res) => {
  try {
    const { host, port, database, username, password } = req.body;
    
    console.log('🔍 Teste Datenbankverbindung:', { host, port, database, username: '[HIDDEN]' });
    
    // Teste die Prisma-Verbindung
    const result = await prisma.$queryRaw\`SELECT 1 as test\`;
    
    console.log('✅ Datenbankverbindung erfolgreich getestet');
    
    res.json({ 
      success: true, 
      message: \`Verbindung zur Datenbank "\${database}" erfolgreich\`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Datenbankverbindung fehlgeschlagen:', error);
    
    res.status(400).json({ 
      success: false, 
      message: \`Datenbankverbindung fehlgeschlagen: \${error.message}\`,
      timestamp: new Date().toISOString()
    });
  }
});

`;

  // Generiere REST-Endpunkte für jede Tabelle
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    const modelName = interfaceName.charAt(0).toLowerCase() + interfaceName.slice(1);  // z.B. 'article'
    const tableName = definition.tableName;  // z.B. 'articles'
    
    server += `// ========================================
// ${interfaceName} Routes
// ========================================

// GET all ${tableName}
app.get('/api/${tableName}', async (req, res) => {
  try {
    const data = await prisma.${modelName}.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von ${tableName}:', error);
    res.status(500).json({ error: 'Fehler beim Laden von ${tableName}', details: error.message });
  }
});

// GET single ${interfaceName}
app.get('/api/${tableName}/:id', async (req, res) => {
  try {
    const data = await prisma.${modelName}.findUnique({
      where: { dbId: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: '${interfaceName} nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von ${interfaceName}:', error);
    res.status(500).json({ error: 'Fehler beim Laden von ${interfaceName}', details: error.message });
  }
});

// POST new ${interfaceName}
app.post('/api/${tableName}', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.dbId && !dataToInsert.db_id) {
      dataToInsert.dbId = generateUUID();
      console.log(\`🆕 Generiere db_id für neues ${interfaceName}: \${dataToInsert.dbId}\`);
    }
    
    const data = await prisma.${modelName}.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von ${interfaceName}:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von ${interfaceName}', details: error.message });
  }
});

// PUT update ${interfaceName}
app.put('/api/${tableName}/:id', async (req, res) => {
  try {
    const data = await prisma.${modelName}.update({
      where: { dbId: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von ${interfaceName}:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von ${interfaceName}', details: error.message });
  }
});

// DELETE ${interfaceName} (über Frontend-ID oder db_id)
app.delete('/api/${tableName}', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.${modelName}.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: '${interfaceName} nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von ${interfaceName}:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von ${interfaceName}', details: error.message });
  }
});

`;
  }

  server += `// Error Handling
app.use((err, req, res, next) => {
  console.error('Unbehandelter Fehler:', err);
  res.status(500).json({ error: 'Interner Serverfehler', details: err.message });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nicht gefunden' });
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM empfangen, schließe Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT empfangen, schließe Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Prisma API Server läuft auf Port \${PORT}\`);
  console.log(\`📊 Schema Version: ${targetVersion}\`);
  console.log(\`🔗 Endpunkte:\`);
`;

  // Liste alle verfügbaren Endpunkte auf
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    server += `  console.log(\`   - /api/${definition.tableName}\`);\n`;
  }

  server += `});
`;

  return server;
}

// Hauptfunktion
const main = () => {
  try {
    console.log('🚀 Starte automatische Schema-Generierung...');
    
    // Automatische Schema-Analyse
    const definitions = generateAutoSchema();
    
    if (Object.keys(definitions).length === 0) {
      console.log('⚠️ Keine Interfaces gefunden. Stelle sicher, dass TypeScript-Interfaces in src/types/ vorhanden sind.');
      return;
    }
    
    // Generiere SQL-Befehle
    const sqlOutput = generateSQLFromAutoSchema(definitions);
    
    // Ausgabe-Verzeichnis erstellen
    const outputDir = path.join(__dirname, '../src/schemas/generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Schreibe JSON-Definitionen
    const jsonOutputPath = path.join(outputDir, 'autoSchemaDefinitions.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(definitions, null, 2));
    console.log(`✅ Schema-Definitionen geschrieben: ${jsonOutputPath}`);
    
    // Schreibe SQL-Befehle
    const sqlOutputPath = path.join(outputDir, 'autoGeneratedSchema.sql');
    fs.writeFileSync(sqlOutputPath, sqlOutput);
    console.log(`✅ SQL-Befehle geschrieben: ${sqlOutputPath}`);
    
    // Schreibe TypeScript-Datei für Import
    const tsOutputPath = path.join(outputDir, 'autoGeneratedSchema.ts');
    const tsContent = `// Automatisch generierte Schema-Definitionen aus TypeScript-Interfaces
// Generiert am: ${new Date().toISOString()}
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

export const AUTO_GENERATED_SCHEMA_DEFINITIONS: SchemaDefinitions = ${JSON.stringify(definitions, null, 2)};

export const AUTO_GENERATED_SQL: string = \`${sqlOutput.replace(/`/g, '\\`')}\`;
`;
    
    fs.writeFileSync(tsOutputPath, tsContent);
    console.log(`✅ TypeScript-Datei geschrieben: ${tsOutputPath}`);
    
    // Generiere und schreibe Init-Scripts
    const initScriptsDir = path.join(__dirname, '../public/init-scripts');
    if (!fs.existsSync(initScriptsDir)) {
      fs.mkdirSync(initScriptsDir, { recursive: true });
    }
    
    // PostgreSQL Init-Script
    const postgresInitScript = generatePostgreSQLInitScript(definitions);
    const postgresInitPath = path.join(initScriptsDir, 'init-chef-numbers-postgresql.sql');
    fs.writeFileSync(postgresInitPath, postgresInitScript);
    console.log(`✅ PostgreSQL Init-Script geschrieben: ${postgresInitPath}`);
    
    // MariaDB Init-Script
    const mariadbInitScript = generateMariaDBInitScript(definitions, 'mariadb');
    const mariadbInitPath = path.join(initScriptsDir, 'init-chef-numbers-mariadb.sql');
    fs.writeFileSync(mariadbInitPath, mariadbInitScript);
    console.log(`✅ MariaDB Init-Script geschrieben: ${mariadbInitPath}`);
    
    // MySQL Init-Script
    const mysqlInitScript = generateMariaDBInitScript(definitions, 'mysql');
    const mysqlInitPath = path.join(initScriptsDir, 'init-chef-numbers-mysql.sql');
    fs.writeFileSync(mysqlInitPath, mysqlInitScript);
    console.log(`✅ MySQL Init-Script geschrieben: ${mysqlInitPath}`);
    
    console.log('✅ Automatische Schema-Generierung abgeschlossen!');
    console.log(`📊 Generiert: ${Object.keys(definitions).length} Interfaces`);
    
    // Zeige Zusammenfassung
    Object.values(definitions).forEach(def => {
      console.log(`  📋 ${def.interfaceName} → ${def.tableName} (${def.columns.length} Spalten)`);
    });
    
    console.log('\n🔄 Migrations-System:');
    console.log(`  📌 Aktuelle Version: 2.0.0`);
    console.log(`  🎯 Ziel-Version: 2.2.2`);
    console.log(`  ✅ Automatische Migrations-Checks für:`);
    console.log(`     - address: TEXT → JSONB`);
    console.log(`     - db_id: DEFAULT gen_random_uuid()`);
    console.log(`     - created_at/updated_at: DEFAULT CURRENT_TIMESTAMP`);
    console.log(`     - open_food_facts_code: Open Food Facts Integration`);
    console.log(`     - energy: Energieverbrauch für Rezepte (kWh)`);
    
    console.log('\n📄 Init-Scripts aktualisiert:');
    console.log(`  🐘 PostgreSQL: ${postgresInitPath}`);
    console.log(`  🔧 MariaDB: ${mariadbInitPath}`);
    console.log(`  🔧 MySQL: ${mysqlInitPath}`);
    
    // Prisma API Dateien generieren
    const prismaApiDir = path.join(__dirname, '../public/prisma-api');
    if (!fs.existsSync(prismaApiDir)) {
      fs.mkdirSync(prismaApiDir, { recursive: true });
    }
    
    // Prisma Schema generieren
    const prismaSchema = generatePrismaSchema(definitions);
    const prismaSchemaPath = path.join(prismaApiDir, 'schema.prisma');
    fs.writeFileSync(prismaSchemaPath, prismaSchema);
    console.log(`\n✅ Prisma Schema geschrieben: ${prismaSchemaPath}`);
    
    // Prisma Server generieren
    const prismaServer = generatePrismaServer(definitions);
    const prismaServerPath = path.join(prismaApiDir, 'server.js');
    fs.writeFileSync(prismaServerPath, prismaServer);
    console.log(`✅ Prisma Server geschrieben: ${prismaServerPath}`);
    
    // Prisma package.json aktualisieren (füge uuid hinzu)
    const prismaPackageJsonPath = path.join(prismaApiDir, 'package.json');
    const prismaPackageJson = {
      "name": "chef-numbers-prisma-api",
      "version": "2.2.2",
      "description": "REST API Server für MariaDB/MySQL mit Prisma - Frontend-synchronisiert",
      "main": "server.js",
      "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js",
        "prisma:generate": "prisma generate",
        "prisma:push": "prisma db push",
        "prisma:studio": "prisma studio"
      },
      "dependencies": {
        "@prisma/client": "^5.7.0",
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "helmet": "^7.1.0",
        "compression": "^1.7.4",
        "uuid": "^9.0.1"
      },
      "devDependencies": {
        "prisma": "^5.7.0",
        "nodemon": "^3.0.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    fs.writeFileSync(prismaPackageJsonPath, JSON.stringify(prismaPackageJson, null, 2));
    console.log(`✅ Prisma package.json geschrieben: ${prismaPackageJsonPath}`);
    
    console.log('\n🎉 Alle Dateien erfolgreich generiert!');
    console.log(`📦 Prisma API bereit für MariaDB/MySQL`);
    
  } catch (error) {
    console.error('❌ Fehler bei automatischer Schema-Generierung:', error);
    process.exit(1);
  }
};

// Führe Script aus
if (require.main === module) {
  main();
}

export { generateAutoSchema, generateSQLFromAutoSchema };
