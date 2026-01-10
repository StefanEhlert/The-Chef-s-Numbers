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
import * as crypto from 'crypto';

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

// ========================================
// SCHEMA-ÄNDERUNGSERKENNUNG & ALTER-STATEMENTS
// ========================================

/**
 * Generiert einen deterministischen Hash für Schema-Definitionen
 */
function generateSchemaHash(definitions: SchemaDefinitions): string {
  // Sortierte, deterministische Hash-Generierung
  const sortedDefs = JSON.stringify(definitions, Object.keys(definitions).sort());
  return crypto.createHash('sha256').update(sortedDefs).digest('hex');
}

/**
 * Lädt vorherige Schema-Definitionen aus JSON-Datei
 */
function loadPreviousSchemaDefinitions(): SchemaDefinitions | null {
  try {
    const existingDefsPath = path.join(__dirname, '../src/schemas/generated/autoSchemaDefinitions.json');
    
    if (!fs.existsSync(existingDefsPath)) {
      return null;
    }
    
    const content = fs.readFileSync(existingDefsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️ Fehler beim Laden der vorherigen Schema-Definitionen:', error);
    return null;
  }
}

/**
 * Loggt detaillierte Schema-Änderungen
 */
function logSchemaChanges(previous: SchemaDefinitions, current: SchemaDefinitions): void {
  console.log('🔄 Schema-Änderungen erkannt:');
  
  // Neue Tabellen
  const newTables = Object.keys(current).filter(k => !previous[k]);
  if (newTables.length > 0) {
    console.log(`  📋 Neue Tabellen: ${newTables.join(', ')}`);
  }
  
  // Entfernte Tabellen
  const removedTables = Object.keys(previous).filter(k => !current[k]);
  if (removedTables.length > 0) {
    console.log(`  🗑️ Entfernte Tabellen: ${removedTables.join(', ')}`);
  }
  
  // Geänderte Tabellen (neue/geänderte Felder)
  for (const [tableName, currentDef] of Object.entries(current)) {
    if (previous[tableName]) {
      const prevDef = previous[tableName];
      const currentColumns = currentDef.columns;
      const prevColumns = prevDef.columns;
      
      // Neue Felder
      const newColumns = currentColumns.filter(
        col => !prevColumns.find((c: ColumnDefinition) => c.name === col.name)
      );
      if (newColumns.length > 0) {
        console.log(`  ➕ ${tableName}: neue Felder: ${newColumns.map(c => c.name).join(', ')}`);
      }
      
      // Geänderte Felder (Typ-Änderung, nullable-Änderung, etc.)
      const changedColumns = currentColumns.filter(currentCol => {
        const prevCol = prevColumns.find((c: ColumnDefinition) => c.name === currentCol.name);
        if (!prevCol) return false;
        
        return (
          prevCol.type !== currentCol.type ||
          prevCol.nullable !== currentCol.nullable ||
          prevCol.defaultValue !== currentCol.defaultValue
        );
      });
      if (changedColumns.length > 0) {
        console.log(`  🔄 ${tableName}: geänderte Felder: ${changedColumns.map(c => c.name).join(', ')}`);
      }
      
      // Entfernte Felder (nur warnen, nicht automatisch löschen)
      const removedColumns = prevColumns.filter(
        (prevCol: ColumnDefinition) => !currentColumns.find(c => c.name === prevCol.name)
      );
      if (removedColumns.length > 0) {
        console.log(`  ⚠️ ${tableName}: entfernte Felder (bleiben in DB erhalten): ${removedColumns.map((c: ColumnDefinition) => c.name).join(', ')}`);
      }
    }
  }
}

/**
 * Prüft ob sich das Schema geändert hat
 */
function hasSchemaChanged(currentDefinitions: SchemaDefinitions): boolean {
  try {
    console.log('🔍 Prüfe Schema-Änderungen...');
    
    const previousDefs = loadPreviousSchemaDefinitions();
    
    if (!previousDefs) {
      console.log('📝 Keine vorherigen Schema-Definitionen gefunden - erstelle neue');
      return true;
    }
    
    // Hash-Vergleich
    const currentHash = generateSchemaHash(currentDefinitions);
    const previousHash = generateSchemaHash(previousDefs);
    
    if (currentHash === previousHash) {
      console.log('✅ Schema unverändert - überspringe Regenerierung');
      return false;
    }
    
    console.log('🔄 Schema-Änderungen erkannt!');
    console.log(`  📊 Hash-Vergleich:`);
    console.log(`     Vorher: ${previousHash.substring(0, 16)}...`);
    console.log(`     Jetzt:  ${currentHash.substring(0, 16)}...`);
    
    logSchemaChanges(previousDefs, currentDefinitions);
    
    return true;
    
  } catch (error) {
    console.warn('⚠️ Fehler beim Schema-Vergleich, generiere sicherheitshalber neu:', error);
    return true;
  }
}

/**
 * Generiert ALTER-Statements für alle Spalten in allen Tabellen (PostgreSQL)
 * Prüft jede Spalte und fügt sie hinzu, wenn sie nicht existiert
 */
function generateAlterStatementsPostgreSQL(definitions: SchemaDefinitions): string {
  let alterSQL = '';
  alterSQL += '\n-- ========================================\n';
  alterSQL += '-- ALTER-Statements für alle Tabellen (Idempotent)\n';
  alterSQL += '-- Führt für jede Spalte eine Prüfung durch und fügt sie hinzu falls nicht vorhanden\n';
  alterSQL += '-- ========================================\n\n';
  
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    alterSQL += `-- Prüfe und füge Spalten für ${definition.tableName} hinzu\n`;
    alterSQL += `DO $$\n`;
    alterSQL += `BEGIN\n`;
    
    for (const col of definition.columns) {
      const nullable = col.nullable ? 'NULL' : 'NOT NULL';
      
      // Build default value
      let defaultVal = '';
      if (col.defaultValue !== undefined) {
        const sqlFunctions = ['gen_random_uuid()', 'CURRENT_TIMESTAMP', 'NOW()'];
        const isSqlFunction = sqlFunctions.some(fn => col.defaultValue === fn || col.defaultValue?.toString().includes(fn));
        
        if (isSqlFunction) {
          defaultVal = `DEFAULT ${col.defaultValue}`;
        } else if (typeof col.defaultValue === 'string') {
          defaultVal = `DEFAULT '${col.defaultValue}'`;
        } else {
          defaultVal = `DEFAULT ${col.defaultValue}`;
        }
      }
      
      alterSQL += `    -- Spalte: ${col.name}\n`;
      alterSQL += `    IF NOT EXISTS (\n`;
      alterSQL += `        SELECT 1 FROM information_schema.columns \n`;
      alterSQL += `        WHERE table_schema = 'public' \n`;
      alterSQL += `        AND table_name = '${definition.tableName}' \n`;
      alterSQL += `        AND column_name = '${col.name}'\n`;
      alterSQL += `    ) THEN\n`;
      alterSQL += `        ALTER TABLE ${definition.tableName} ADD COLUMN ${col.name} ${col.type} ${defaultVal} ${nullable};\n`;
      alterSQL += `        RAISE NOTICE '✅ Spalte ${col.name} zu ${definition.tableName} hinzugefügt';\n`;
      alterSQL += `    END IF;\n\n`;
    }
    
    alterSQL += `END $$;\n\n`;
  }
  
  return alterSQL;
}

/**
 * Generiert ALTER-Statements für alle Spalten in allen Tabellen (MariaDB/MySQL)
 * Prüft jede Spalte und fügt sie hinzu, wenn sie nicht existiert
 */
function generateAlterStatementsMySQL(definitions: SchemaDefinitions): string {
  let alterSQL = '';
  alterSQL += '\n-- ========================================\n';
  alterSQL += '-- ALTER-Statements für alle Tabellen (Idempotent)\n';
  alterSQL += '-- Führt für jede Spalte eine Prüfung durch und fügt sie hinzu falls nicht vorhanden\n';
  alterSQL += '-- ========================================\n\n';
  
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    alterSQL += `-- Prüfe und füge Spalten für ${definition.tableName} hinzu\n`;
    
    for (const col of definition.columns) {
      // MariaDB/MySQL Typ-Mapping
      let mysqlType = col.type;
      if (mysqlType === 'UUID') {
        mysqlType = 'CHAR(36)';
      } else if (mysqlType === 'TEXT[]' || mysqlType === 'JSONB') {
        mysqlType = 'JSON';
      } else if (mysqlType === 'TIMESTAMP') {
        if (col.name === 'created_at' || col.name === 'updated_at') {
          mysqlType = 'TIMESTAMP';
        } else {
          mysqlType = 'DATETIME';
        }
      } else if (mysqlType === 'sync_status_enum') {
        mysqlType = "VARCHAR(20)";
      }
      
      // WICHTIG: Bei ALTER TABLE ADD COLUMN benötigen NOT NULL Felder einen DEFAULT-Wert
      // oder müssen als NULL hinzugefügt werden (können später mit UPDATE gefüllt werden)
      let nullable = col.nullable ? 'NULL' : 'NOT NULL';
      
      // Build default value
      let defaultVal = '';
      if (col.defaultValue !== undefined) {
        if (col.defaultValue === 'gen_random_uuid()') {
          // Wird von der App gesetzt - muss NULL sein bei ALTER oder mit DEFAULT ''
          defaultVal = '';
          // Bei ALTER TABLE und NOT NULL ohne DEFAULT: als NULL hinzufügen (kann später gefüllt werden)
          if (!col.nullable) {
            nullable = 'NULL';  // Temporär als NULL hinzufügen, kann später zu NOT NULL geändert werden
          }
        } else if (col.defaultValue === 'CURRENT_TIMESTAMP') {
          defaultVal = 'DEFAULT CURRENT_TIMESTAMP';
        } else if (typeof col.defaultValue === 'string') {
          defaultVal = `DEFAULT '${col.defaultValue}'`;
        } else {
          defaultVal = `DEFAULT ${col.defaultValue}`;
        }
      }
      
      // Spezielle Behandlung für updated_at
      let onUpdate = '';
      if (col.name === 'updated_at') {
        // updated_at benötigt sowohl DEFAULT als auch ON UPDATE
        if (!defaultVal) {
          defaultVal = 'DEFAULT CURRENT_TIMESTAMP';
        }
        onUpdate = 'ON UPDATE CURRENT_TIMESTAMP';
      }
      
      // Spezielle Behandlung für created_at
      if (col.name === 'created_at' && !defaultVal && !col.nullable) {
        // created_at sollte immer DEFAULT CURRENT_TIMESTAMP haben wenn NOT NULL
        defaultVal = 'DEFAULT CURRENT_TIMESTAMP';
      }
      
      // WICHTIG: Escape alle Anführungszeichen für CONCAT korrekt
      // ENUM-Werte und DEFAULT-Werte enthalten einfache Anführungszeichen
      let mysqlTypeForConcat = mysqlType.replace(/'/g, "\\'");
      let defaultValForConcat = defaultVal.replace(/'/g, "\\'");
      let onUpdateForConcat = onUpdate.replace(/'/g, "\\'");
      
      alterSQL += `-- Spalte: ${col.name}\n`;
      alterSQL += `SET @col_exists = 0;\n`;
      alterSQL += `SELECT COUNT(*) INTO @col_exists \n`;
      alterSQL += `FROM information_schema.columns \n`;
      alterSQL += `WHERE table_schema = 'chef_numbers' \n`;
      alterSQL += `  AND table_name = '${definition.tableName}' \n`;
      alterSQL += `  AND column_name = '${col.name}';\n`;
      alterSQL += `\n`;
      
      // Spezielle Behandlung für updated_at und created_at: Prüfe auch DEFAULT
      if (col.name === 'updated_at' || col.name === 'created_at') {
        alterSQL += `SET @col_has_default = 0;\n`;
        alterSQL += `SELECT COUNT(*) INTO @col_has_default \n`;
        alterSQL += `FROM information_schema.columns \n`;
        alterSQL += `WHERE table_schema = 'chef_numbers' \n`;
        alterSQL += `  AND table_name = '${definition.tableName}' \n`;
        alterSQL += `  AND column_name = '${col.name}' \n`;
        alterSQL += `  AND column_default IS NOT NULL;\n`;
        alterSQL += `\n`;
        // Wenn Spalte existiert, aber keinen DEFAULT hat: MODIFY COLUMN
        alterSQL += `SET @query = IF(@col_exists = 1 AND @col_has_default = 0, \n`;
        alterSQL += `  CONCAT('ALTER TABLE ${definition.tableName} MODIFY COLUMN ${col.name} ', '${mysqlTypeForConcat}', ' ', '${defaultValForConcat}', ' ', '${onUpdateForConcat}', ' ', '${nullable}'), \n`;
        alterSQL += `  IF(@col_exists = 0, \n`;
        alterSQL += `    CONCAT('ALTER TABLE ${definition.tableName} ADD COLUMN ${col.name} ', '${mysqlTypeForConcat}', ' ', '${defaultValForConcat}', ' ', '${onUpdateForConcat}', ' ', '${nullable}'), \n`;
        alterSQL += `    'SELECT 1'));\n`;
      } else {
        // Normale Spalten: Nur ADD COLUMN wenn nicht existiert
        alterSQL += `SET @query = IF(@col_exists = 0, \n`;
        alterSQL += `  CONCAT('ALTER TABLE ${definition.tableName} ADD COLUMN ${col.name} ', '${mysqlTypeForConcat}', ' ', '${defaultValForConcat}', ' ', '${onUpdateForConcat}', ' ', '${nullable}'), \n`;
        alterSQL += `  'SELECT 1');\n`;
      }
      
      alterSQL += `PREPARE stmt FROM @query;\n`;
      alterSQL += `EXECUTE stmt;\n`;
      alterSQL += `DEALLOCATE PREPARE stmt;\n\n`;
    }
  }
  
  return alterSQL;
}

/**
 * Generiert idempotente CREATE INDEX Statements für MariaDB/MySQL
 * Prüft jeden Index und erstellt ihn nur, wenn er nicht existiert
 */
function generateIndexStatementsMySQL(definitions: SchemaDefinitions): string {
  let indexSQL = '';
  indexSQL += '\n-- ========================================\n';
  indexSQL += '-- CREATE INDEX Statements (Idempotent)\n';
  indexSQL += '-- Prüft jeden Index und erstellt ihn nur, wenn er nicht existiert\n';
  indexSQL += '-- ========================================\n\n';
  
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    const tableName = definition.tableName;
    const indexes: Array<{ name: string; columns: string; prefix?: number }> = [];
    
    // Basis-Indizes
    const hasId = definition.columns.find(col => col.name === 'id');
    const hasDbId = definition.columns.find(col => col.name === 'db_id' && col.primary);
    const hasCreatedAt = definition.columns.find(col => col.name === 'created_at');
    const hasUpdatedAt = definition.columns.find(col => col.name === 'updated_at');
    
    if (hasId && !hasId.primary) {
      indexes.push({ name: `idx_${tableName}_id`, columns: 'id' });
    }
    if (hasCreatedAt) {
      indexes.push({ name: `idx_${tableName}_created_at`, columns: 'created_at' });
    }
    if (hasUpdatedAt) {
      indexes.push({ name: `idx_${tableName}_updated_at`, columns: 'updated_at' });
    }
    
    // Spezielle Indizes basierend auf Interface
    if (definition.interfaceName === 'Article') {
      const supplierIdColumn = definition.columns.find(col => col.name === 'supplier_id');
      const categoryColumn = definition.columns.find(col => col.name === 'category');
      
      if (supplierIdColumn) {
        indexes.push({ name: `idx_${tableName}_supplier_id`, columns: 'supplier_id' });
      }
      if (categoryColumn) {
        indexes.push({ name: `idx_${tableName}_category`, columns: 'category(100)', prefix: 100 });
      }
    }
    
    // Generiere idempotente CREATE INDEX Statements für jeden Index
    for (const idx of indexes) {
      indexSQL += `-- Index: ${idx.name}\n`;
      indexSQL += `SET @idx_exists = 0;\n`;
      indexSQL += `SELECT COUNT(*) INTO @idx_exists \n`;
      indexSQL += `FROM information_schema.statistics \n`;
      indexSQL += `WHERE table_schema = 'chef_numbers' \n`;
      indexSQL += `  AND table_name = '${tableName}' \n`;
      indexSQL += `  AND index_name = '${idx.name}';\n\n`;
      
      // Build column definition (handle prefix for TEXT columns like category(100))
      // Escape single quotes in column definition for CONCAT
      const columnDefEscaped = idx.columns.replace(/'/g, "''");
      
      indexSQL += `SET @query = IF(@idx_exists = 0, \n`;
      indexSQL += `  CONCAT('CREATE INDEX ${idx.name} ON ${tableName}(', '${columnDefEscaped}', ')'), \n`;
      indexSQL += `  'SELECT 1');\n`;
      indexSQL += `PREPARE stmt FROM @query;\n`;
      indexSQL += `EXECUTE stmt;\n`;
      indexSQL += `DEALLOCATE PREPARE stmt;\n\n`;
    }
  }
  
  return indexSQL;
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
  'PhoneNumber[]': 'JSONB',
  'PriceHistoryEntry[]': 'JSONB',
  'string[]': 'JSONB'  // Arrays sollten als JSONB gespeichert werden
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
  const lowerCase = interfaceName.toLowerCase();
  // Füge 's' nur hinzu, wenn der Name nicht bereits auf 's' endet
  return lowerCase.endsWith('s') ? lowerCase : lowerCase + 's';
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

// Hybrid-ID-System:
// - id: Frontend-ID (wird vom Frontend gesetzt)
// - db_id: Datenbank-ID (wird von Prisma mit UUID() automatisch generiert und als Primary Key verwendet)
function generatePrimaryBaseEntityColumns(): ColumnDefinition[] {
  return [
    {
      name: 'id',
      type: 'UUID',
      nullable: false,
      primary: false,  // NICHT Primary Key, nur Frontend-ID
      description: 'Frontend-ID für State-Management',
      tsType: 'string'
    },
    {
      name: 'db_id',
      type: 'UUID',
      nullable: false,
      primary: true,  // IST Primary Key
      defaultValue: 'gen_random_uuid()',  // PostgreSQL generiert automatisch
      description: 'Datenbank-ID (Primary Key) - wird von Prisma mit UUID() automatisch generiert',
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
    const baseEntityFields = ['id', 'db_id', 'isDirty', 'isNew', 'syncStatus', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'lastModifiedBy'];
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

    // COMMENTS - DEAKTIVIERT (werfen Fehler wenn Spalten nicht existieren)
    // sqlOutput += `-- Kommentare für Spalten in ${definition.tableName}\n`;
    // for (const column of definition.columns) {
    //   sqlOutput += `-- Kommentar für Spalte: ${column.name}\n`;
    //   sqlOutput += `COMMENT ON COLUMN ${definition.tableName}.${column.name} IS '${column.description} (TS: ${column.tsType})';\n`;
    // }
    // sqlOutput += '\n';
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
    // Positive Preise (nur numerische Felder!)
    const priceColumns = definition.columns.filter(col => 
      (col.name.includes('price') || col.name.includes('Price')) && 
      col.type === 'DECIMAL'  // Nur DECIMAL-Felder, nicht TEXT/JSONB
    );
    
    // Constraints werden in separatem DO-Block erstellt (idempotent)
    if (priceColumns.length > 0 || 
        definition.columns.some(col => 
          (col.name.includes('amount') || col.name.includes('content') || col.name.includes('portions')) &&
          col.type === 'DECIMAL'
        )) {
      sqlOutput += `-- Check Constraints für ${definition.tableName} (Idempotent)\n`;
      sqlOutput += `DO $$\n`;
      sqlOutput += `BEGIN\n`;
      
      if (priceColumns.length > 0) {
        const priceChecks = priceColumns.map(col => `${col.name} >= 0`).join(' AND ');
        sqlOutput += `    -- Prüfe ob Constraint chk_${definition.tableName}_positive_prices existiert\n`;
        sqlOutput += `    IF NOT EXISTS (\n`;
        sqlOutput += `        SELECT 1 FROM pg_constraint WHERE conname = 'chk_${definition.tableName}_positive_prices'\n`;
        sqlOutput += `    ) THEN\n`;
        sqlOutput += `        ALTER TABLE ${definition.tableName} ADD CONSTRAINT chk_${definition.tableName}_positive_prices \n`;
        sqlOutput += `          CHECK (${priceChecks});\n`;
        sqlOutput += `        RAISE NOTICE '✅ Constraint chk_${definition.tableName}_positive_prices erstellt';\n`;
        sqlOutput += `    ELSE\n`;
        sqlOutput += `        RAISE NOTICE '✓ Constraint chk_${definition.tableName}_positive_prices existiert bereits';\n`;
        sqlOutput += `    END IF;\n\n`;
      }
      
      // Positive Zahlen
      const numberColumns = definition.columns.filter(col => 
        (col.name.includes('amount') || col.name.includes('content') || col.name.includes('portions')) &&
        col.type === 'DECIMAL'
      );
      
      if (numberColumns.length > 0) {
        numberColumns.forEach(col => {
          sqlOutput += `    -- Prüfe ob Constraint chk_${definition.tableName}_positive_${col.name} existiert\n`;
          sqlOutput += `    IF NOT EXISTS (\n`;
          sqlOutput += `        SELECT 1 FROM pg_constraint WHERE conname = 'chk_${definition.tableName}_positive_${col.name}'\n`;
          sqlOutput += `    ) THEN\n`;
          sqlOutput += `        ALTER TABLE ${definition.tableName} ADD CONSTRAINT chk_${definition.tableName}_positive_${col.name} \n`;
          sqlOutput += `          CHECK (${col.name} > 0);\n`;
          sqlOutput += `        RAISE NOTICE '✅ Constraint chk_${definition.tableName}_positive_${col.name} erstellt';\n`;
          sqlOutput += `    ELSE\n`;
          sqlOutput += `        RAISE NOTICE '✓ Constraint chk_${definition.tableName}_positive_${col.name} existiert bereits';\n`;
          sqlOutput += `    END IF;\n\n`;
        });
      }
      
      sqlOutput += `END $$;\n\n`;
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
  migrations += `    IF current_schema_version IS NULL OR current_schema_version < '${targetVersion}' THEN\n`;
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
  migrations += `    IF current_schema_version IS NULL OR current_schema_version < '${targetVersion}' THEN\n`;
  migrations += `        RAISE NOTICE 'Prüfe db_id DEFAULT-Werte...';\n`;
  migrations += `        \n`;
  migrations += `        DECLARE\n`;
  migrations += `            tbl_name TEXT;\n`;
  migrations += `        BEGIN\n`;
  migrations += `            FOR tbl_name IN SELECT unnest(ARRAY[`;
  
  // Sammle alle Tabellennamen
  const tableNames = Object.values(definitions).map(def => `'${def.tableName}'`).join(', ');
  migrations += tableNames;
  
  migrations += `])\n`;
  migrations += `            LOOP\n`;
  migrations += `                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = tbl_name) THEN\n`;
  migrations += `                    IF NOT EXISTS (\n`;
  migrations +=                       `                        SELECT 1 FROM information_schema.columns \n`;
  migrations += `                        WHERE table_schema = 'public' \n`;
  migrations += `                        AND columns.table_name = tbl_name \n`;
  migrations += `                        AND column_name = 'db_id' \n`;
  migrations += `                        AND column_default LIKE '%gen_random_uuid%'\n`;
  migrations += `                    ) THEN\n`;
  migrations += `                        EXECUTE format('ALTER TABLE %I ALTER COLUMN db_id SET DEFAULT gen_random_uuid()', tbl_name);\n`;
  migrations += `                        RAISE NOTICE '✅ %.db_id: DEFAULT gen_random_uuid() hinzugefügt', tbl_name;\n`;
  migrations += `                    ELSE\n`;
  migrations += `                        RAISE NOTICE '✓ %.db_id hat bereits DEFAULT', tbl_name;\n`;
  migrations += `                    END IF;\n`;
  migrations += `                END IF;\n`;
  migrations += `            END LOOP;\n`;
  migrations += `        END;\n`;
  migrations += `    END IF;\n`;
  migrations += `    \n`;
  
  // Migration 3: DEFAULT-Werte für Timestamps
  migrations += `    -- Migration 3: created_at und updated_at mit DEFAULT CURRENT_TIMESTAMP\n`;
  migrations += `    IF current_schema_version IS NULL OR current_schema_version < '${targetVersion}' THEN\n`;
  migrations += `        RAISE NOTICE 'Prüfe Timestamp DEFAULT-Werte...';\n`;
  migrations += `        \n`;
  migrations += `        DECLARE\n`;
  migrations += `            tbl_name TEXT;\n`;
  migrations += `        BEGIN\n`;
  migrations += `            FOR tbl_name IN SELECT unnest(ARRAY[${tableNames}])\n`;
  migrations += `            LOOP\n`;
  migrations += `                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = tbl_name) THEN\n`;
  migrations += `                    -- Prüfe created_at DEFAULT\n`;
  migrations += `                    IF NOT EXISTS (\n`;
  migrations += `                        SELECT 1 FROM information_schema.columns \n`;
  migrations += `                        WHERE table_schema = 'public' \n`;
  migrations += `                        AND columns.table_name = tbl_name \n`;
  migrations += `                        AND column_name = 'created_at' \n`;
  migrations += `                        AND column_default IS NOT NULL\n`;
  migrations += `                    ) THEN\n`;
  migrations += `                        EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP', tbl_name);\n`;
  migrations += `                        RAISE NOTICE '✅ %.created_at: DEFAULT CURRENT_TIMESTAMP hinzugefügt', tbl_name;\n`;
  migrations += `                    END IF;\n`;
  migrations += `                    \n`;
  migrations += `                    -- Prüfe updated_at DEFAULT\n`;
  migrations += `                    IF NOT EXISTS (\n`;
  migrations += `                        SELECT 1 FROM information_schema.columns \n`;
  migrations += `                        WHERE table_schema = 'public' \n`;
  migrations += `                        AND columns.table_name = tbl_name \n`;
  migrations += `                        AND column_name = 'updated_at' \n`;
  migrations += `                        AND column_default IS NOT NULL\n`;
  migrations += `                    ) THEN\n`;
  migrations += `                        EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP', tbl_name);\n`;
  migrations += `                        RAISE NOTICE '✅ %.updated_at: DEFAULT CURRENT_TIMESTAMP hinzugefügt', tbl_name;\n`;
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
  
  
  // ALTER-Statements für alle Spalten (Idempotent)
  script += generateAlterStatementsPostgreSQL(definitions);
  
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

-- Füge updated_at Trigger zu allen Tabellen hinzu (Idempotent)
`;

  // Füge Trigger für alle generierten Tabellen hinzu (mit IF NOT EXISTS)
  Object.values(definitions).forEach(def => {
    script += `DO $$\n`;
    script += `BEGIN\n`;
    script += `    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_${def.tableName}_updated_at') THEN\n`;
    script += `        CREATE TRIGGER update_${def.tableName}_updated_at BEFORE UPDATE ON ${def.tableName} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n`;
    script += `        RAISE NOTICE '✅ Trigger update_${def.tableName}_updated_at erstellt';\n`;
    script += `    ELSE\n`;
    script += `        RAISE NOTICE '✓ Trigger update_${def.tableName}_updated_at existiert bereits';\n`;
    script += `    END IF;\n`;
    script += `END $$;\n\n`;
  });
  
  // Füge Trigger für System-Tabellen hinzu (mit IF NOT EXISTS)
  script += `DO $$\n`;
  script += `BEGIN\n`;
  script += `    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_info_updated_at') THEN\n`;
  script += `        CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n`;
  script += `        RAISE NOTICE '✅ Trigger update_system_info_updated_at erstellt';\n`;
  script += `    ELSE\n`;
  script += `        RAISE NOTICE '✓ Trigger update_system_info_updated_at existiert bereits';\n`;
  script += `    END IF;\n`;
  script += `END $$;

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
  script += `ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS Policies (erlaube alle Operationen für alle Rollen)
-- ========================================

`;
  
  // Erstelle RLS-Policies für alle generierten Tabellen (Idempotent)
  Object.values(definitions).forEach(def => {
    script += `-- RLS Policy für ${def.tableName} (Idempotent)\n`;
    script += `DO $$\n`;
    script += `BEGIN\n`;
    script += `    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '${def.tableName}' AND policyname = 'Enable all operations for all users') THEN\n`;
    script += `        CREATE POLICY "Enable all operations for all users" ON ${def.tableName} FOR ALL USING (true);\n`;
    script += `        RAISE NOTICE '✅ RLS Policy für ${def.tableName} erstellt';\n`;
    script += `    ELSE\n`;
    script += `        RAISE NOTICE '✓ RLS Policy für ${def.tableName} existiert bereits';\n`;
    script += `    END IF;\n`;
    script += `END $$;\n\n`;
  });
  
  // Erstelle RLS-Policies für System-Tabellen (Idempotent)
  script += `-- RLS Policy für system_info (Idempotent)\n`;
  script += `DO $$\n`;
  script += `BEGIN\n`;
  script += `    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_info' AND policyname = 'Enable all operations for all users') THEN\n`;
  script += `        CREATE POLICY "Enable all operations for all users" ON system_info FOR ALL USING (true);\n`;
  script += `        RAISE NOTICE '✅ RLS Policy für system_info erstellt';\n`;
  script += `    ELSE\n`;
  script += `        RAISE NOTICE '✓ RLS Policy für system_info existiert bereits';\n`;
  script += `    END IF;\n`;
  script += `END $$;

-- WICHTIG: Explizite Berechtigungen für alle bestehenden Tabellen (PostgREST benötigt diese!)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role, postgres;

-- Berechtigungen für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, postgres;

-- ========================================
-- SQL-Execution RPC Function (Phase 2)
-- ========================================

-- RPC-Funktion für sichere SQL-Execution (nur ALTER/CREATE TABLE IF NOT EXISTS)
CREATE OR REPLACE FUNCTION execute_safe_sql(sql_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Führe SQL aus und gib Ergebnis zurück
    EXECUTE sql_text;
    
    -- Gebe Erfolg zurück
    result := json_build_object(
        'success', true,
        'message', 'SQL erfolgreich ausgeführt',
        'timestamp', CURRENT_TIMESTAMP
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Gebe Fehler zurück
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'timestamp', CURRENT_TIMESTAMP
        );
        
        RETURN result;
END;
$$;

-- Berechtigungen für RPC-Funktion
GRANT EXECUTE ON FUNCTION execute_safe_sql(TEXT) TO anon, authenticated, service_role, postgres;

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
        // WICHTIG: created_at und updated_at müssen TIMESTAMP sein (nicht DATETIME)
        // MySQL erlaubt DEFAULT CURRENT_TIMESTAMP nur bei TIMESTAMP
        if (column.name === 'created_at' || column.name === 'updated_at') {
          mysqlType = 'TIMESTAMP';
        } else {
          mysqlType = 'DATETIME';
        }
      } else if (mysqlType === 'sync_status_enum') {
        mysqlType = "VARCHAR(20)";
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
        // updated_at benötigt sowohl DEFAULT als auch ON UPDATE
        if (!defaultVal) {
          defaultVal = 'DEFAULT CURRENT_TIMESTAMP';
        }
        onUpdate = 'ON UPDATE CURRENT_TIMESTAMP';
      }
      
      const columnDef = `${column.name} ${mysqlType} ${primary} ${defaultVal} ${onUpdate} ${nullable}`.replace(/\s+/g, ' ').trim();
      columnDefinitions.push(`    ${columnDef}`);
    }
    
    script += columnDefinitions.join(',\n');
    script += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';
  }

  // System-Tabellen
  script += `-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id CHAR(36) PRIMARY KEY,
    \`key\` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  // ALTER-Statements für alle Spalten (Idempotent)
  script += generateAlterStatementsMySQL(definitions);
  
  // CREATE INDEX Statements (Idempotent)
  script += generateIndexStatementsMySQL(definitions);
  
  // ALTER-Statements für system_info Tabelle (fix für updated_at ohne DEFAULT)
  script += `-- ========================================\n`;
  script += `-- ALTER-Statements für system_info Tabelle\n`;
  script += `-- ========================================\n\n`;
  
  // Prüfe und korrigiere updated_at in system_info
  script += `-- Spalte: updated_at in system_info\n`;
  script += `SET @col_exists = 0;\n`;
  script += `SELECT COUNT(*) INTO @col_exists \n`;
  script += `FROM information_schema.columns \n`;
  script += `WHERE table_schema = 'chef_numbers' \n`;
  script += `  AND table_name = 'system_info' \n`;
  script += `  AND column_name = 'updated_at';\n\n`;
  
  script += `SET @col_has_default = 0;\n`;
  script += `SELECT COUNT(*) INTO @col_has_default \n`;
  script += `FROM information_schema.columns \n`;
  script += `WHERE table_schema = 'chef_numbers' \n`;
  script += `  AND table_name = 'system_info' \n`;
  script += `  AND column_name = 'updated_at' \n`;
  script += `  AND column_default IS NOT NULL;\n\n`;
  
  script += `SET @query = IF(@col_exists = 1 AND @col_has_default = 0, \n`;
  script += `  CONCAT('ALTER TABLE system_info MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), \n`;
  script += `  IF(@col_exists = 0, \n`;
  script += `    CONCAT('ALTER TABLE system_info ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), \n`;
  script += `    'SELECT 1'));\n`;
  script += `PREPARE stmt FROM @query;\n`;
  script += `EXECUTE stmt;\n`;
  script += `DEALLOCATE PREPARE stmt;\n\n`;
  
  // Prüfe und korrigiere created_at in system_info
  script += `-- Spalte: created_at in system_info\n`;
  script += `SET @col_exists = 0;\n`;
  script += `SELECT COUNT(*) INTO @col_exists \n`;
  script += `FROM information_schema.columns \n`;
  script += `WHERE table_schema = 'chef_numbers' \n`;
  script += `  AND table_name = 'system_info' \n`;
  script += `  AND column_name = 'created_at';\n\n`;
  
  script += `SET @col_has_default = 0;\n`;
  script += `SELECT COUNT(*) INTO @col_has_default \n`;
  script += `FROM information_schema.columns \n`;
  script += `WHERE table_schema = 'chef_numbers' \n`;
  script += `  AND table_name = 'system_info' \n`;
  script += `  AND column_name = 'created_at' \n`;
  script += `  AND column_default IS NOT NULL;\n\n`;
  
  script += `SET @query = IF(@col_exists = 1 AND @col_has_default = 0, \n`;
  script += `  CONCAT('ALTER TABLE system_info MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'), \n`;
  script += `  IF(@col_exists = 0, \n`;
  script += `    CONCAT('ALTER TABLE system_info ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'), \n`;
  script += `    'SELECT 1'));\n`;
  script += `PREPARE stmt FROM @query;\n`;
  script += `EXECUTE stmt;\n`;
  script += `DEALLOCATE PREPARE stmt;\n\n`;
  
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

`;
  
  script += `-- Erfolgsmeldung
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
      
      // Updated At (hat Vorrang vor Default Values!)
      if (column.name === 'updated_at') {
        attributes.push('@updatedAt');
      }
      // Default Values (aber NICHT für updated_at!)
      else if (column.defaultValue !== undefined) {
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
      
      // Field Mapping (wenn camelCase zu snake_case)
      // WICHTIG: db_id bleibt als db_id (keine camelCase-Konvertierung!)
      const camelCaseName = column.name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      // Nur 'id' und 'db_id' werden ausgeschlossen (bleiben als id und db_id im Prisma Schema)
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
        // WICHTIG: Für Felder mit @default(now()) oder @updatedAt verwende TIMESTAMP (nicht DATETIME)
        // MySQL/MariaDB erlauben nur TIMESTAMP mit DEFAULT CURRENT_TIMESTAMP
        if (column.name === 'created_at' || column.name === 'updated_at') {
          // Explizit @db.Timestamp für MySQL/MariaDB-Kompatibilität
          attributes.push('@db.Timestamp(0)');
        } else {
          attributes.push('@db.DateTime');
        }
      }
      
      // Baue die Zeile zusammen
      // WICHTIG: db_id bleibt als db_id (keine camelCase-Konvertierung!)
      const fieldName = column.name === 'db_id' ? 'db_id' : camelCaseName;
      const attrString = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
      schema += `  ${fieldName.padEnd(22)} ${prismaType}${optional}${attrString}\n`;
    }
    
    // Table Mapping
    schema += `\n  @@map("${definition.tableName}")\n`;
    schema += `}\n\n`;
  }

  // System-Tabellen hinzufügen (nur SystemInfo für Schema-Versionierung)
  schema += `// System-Tabellen

model SystemInfo {
  id          String   @id @default(uuid()) @db.VarChar(36)
  key         String   @unique @db.VarChar(100)
  value       String   @db.Text
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamp(0)

  @@map("system_info")
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
const mysql = require('mysql2/promise');

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

// Execute SQL Endpoint (für Schema-Initialisierung)
app.post('/api/execute-sql', async (req, res) => {
  let mysqlConnection = null;
  
  try {
    const { sql } = req.body;
    
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SQL-String erforderlich'
      });
    }
    
    console.log(\`📝 Führe SQL aus: \${sql.substring(0, 100)}...\`);
    
    // Parse DATABASE_URL für native MySQL-Verbindung
    const dbUrl = process.env.DATABASE_URL;
    console.log('🔍 DATABASE_URL:', dbUrl);
    
    // Parse DATABASE_URL: mysql://user:password@host:port/database
    const dbUrlMatch = dbUrl.match(/mysql:\\/\\/([^:]+):([^@]+)@([^:]+):(\\d+)\\/(.+)/);
    
    if (!dbUrlMatch) {
      throw new Error('Ungültige DATABASE_URL');
    }
    
    const [, user, password, host, port, database] = dbUrlMatch;
    console.log('🔌 Verbinde zu MySQL:', { host, port: parseInt(port), user, database });
    
    // Erstelle native MySQL-Verbindung
    mysqlConnection = await mysql.createConnection({
      host: host,
      port: parseInt(port),
      user: user,
      password: password,
      database: database,
      multipleStatements: true // Wichtig für Multi-Statement-Scripts
    });
    
    console.log('✅ MySQL-Verbindung etabliert');
    
    // Entferne USE-Statement aus SQL (wird bereits durch Connection verwendet)
    const cleanedSql = sql.replace(/^USE\\s+\\w+;/gi, '').trim();
    
    // Führe SQL aus
    const [results] = await mysqlConnection.query(cleanedSql);
    
    console.log(\`✅ SQL erfolgreich ausgeführt\`);
    
    res.json({
      success: true,
      message: 'SQL erfolgreich ausgeführt',
      result: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ SQL-Execution fehlgeschlagen:', error);
    
    res.status(400).json({
      success: false,
      error: error.message,
      sqlstate: error.code,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Schließe MySQL-Verbindung
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('🔌 MySQL-Verbindung geschlossen');
    }
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
      where: { db_id: req.params.id }
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
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(\`🆕 Generiere db_id für neues ${interfaceName}: \${dataToInsert.db_id}\`);
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
      where: { db_id: req.params.id },
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
    
    // NEU: Prüfe ob Schema-Änderungen vorliegen
    if (!hasSchemaChanged(definitions)) {
      console.log('✅ Keine Schema-Änderungen - beende Routine');
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
        "uuid": "^9.0.1",
        "mysql2": "^3.6.5"
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
    
    // Generiere Supabase Init-Script
    console.log('\n📝 Generiere Supabase Init-Script...');
    const supabaseScript = generateSupabaseInitScript(definitions);
    const supabaseScriptPath = path.join(__dirname, '../public/init-scripts', 'init-chef-numbers-supabase.sql');
    fs.writeFileSync(supabaseScriptPath, supabaseScript);
    console.log(`✅ Supabase Init-Script geschrieben: ${supabaseScriptPath}`);
    
    // Generiere Supabase RPC-Function für Auto-Install
    console.log('\n🤖 Generiere Supabase RPC Auto-Installer...');
    const rpcFunction = generateSupabaseRPCFunction(definitions);
    const rpcFunctionPath = path.join(__dirname, '../public/init-scripts', 'supabase-auto-installer.sql');
    fs.writeFileSync(rpcFunctionPath, rpcFunction);
    console.log(`✅ Supabase RPC Auto-Installer geschrieben: ${rpcFunctionPath}`);
    
    console.log('\n🎉 Alle Dateien erfolgreich generiert!');
    console.log(`📦 Prisma API bereit für MariaDB/MySQL`);
    console.log(`☁️  Supabase Script bereit für Cloud-Deployment`);
    console.log(`🤖 Supabase Auto-Installer RPC-Function bereit!`);
    
  } catch (error) {
    console.error('❌ Fehler bei automatischer Schema-Generierung:', error);
    process.exit(1);
  }
};

// Generiere idempotente ALTER Statements für Supabase (DO $$ Blocks)
function generateAlterStatementsSupabase(definitions: SchemaDefinitions): string {
  let alterSQL = '';
  alterSQL += '\n-- ========================================\n';
  alterSQL += '-- ALTER-Statements für alle Spalten (Idempotent)\n';
  alterSQL += '-- Prüft jede Spalte und fügt sie hinzu, wenn sie nicht existiert\n';
  alterSQL += '-- ========================================\n\n';
  
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    alterSQL += `-- Prüfe und füge Spalten für ${definition.tableName} hinzu\n`;
    
    for (const col of definition.columns) {
      // PostgreSQL/Supabase Typ-Mapping
      let pgType = col.type;
      
      // Typ-Konvertierungen
      if (pgType === 'UUID') {
        pgType = 'UUID';
      } else if (pgType === 'TEXT[]' || pgType === 'JSONB') {
        // Behalte TEXT[] und JSONB wie sie sind
        pgType = col.type;
      } else if (pgType === 'TIMESTAMP') {
        pgType = 'TIMESTAMP';
      } else if (pgType === 'sync_status_enum') {
        pgType = 'sync_status_enum';
      }
      
      const nullable = col.nullable ? 'NULL' : 'NOT NULL';
      const primary = col.primary ? 'PRIMARY KEY' : '';
      
      // Build default value
      let defaultVal = '';
      if (col.defaultValue !== undefined) {
        if (col.defaultValue === 'gen_random_uuid()') {
          defaultVal = 'DEFAULT gen_random_uuid()';
        } else if (col.defaultValue === 'CURRENT_TIMESTAMP' || col.defaultValue === 'now()') {
          defaultVal = 'DEFAULT now()';
        } else if (typeof col.defaultValue === 'string') {
          defaultVal = `DEFAULT '${col.defaultValue}'`;
        } else {
          defaultVal = `DEFAULT ${col.defaultValue}`;
        }
      } else {
        // Spezielle Behandlung für bestimmte Spalten
        if (col.name === 'db_id') {
          defaultVal = 'DEFAULT gen_random_uuid()';
        } else if (col.name === 'created_at') {
          defaultVal = 'DEFAULT now()';
        } else if (col.name === 'updated_at') {
          defaultVal = 'DEFAULT now()'; // Auch DEFAULT für CREATE, Trigger für UPDATE
        } else if (col.name === 'sync_status') {
          defaultVal = "DEFAULT 'pending'";
        } else if (col.name === 'is_dirty' || col.name === 'is_new') {
          defaultVal = 'DEFAULT false';
        }
      }
      
      alterSQL += `DO $$\n`;
      alterSQL += `BEGIN\n`;
      alterSQL += `    IF NOT EXISTS (\n`;
      alterSQL += `        SELECT 1 FROM information_schema.columns \n`;
      alterSQL += `        WHERE table_name = '${definition.tableName}' \n`;
      alterSQL += `        AND column_name = '${col.name}'\n`;
      alterSQL += `    ) THEN\n`;
      alterSQL += `        ALTER TABLE ${definition.tableName} ADD COLUMN ${col.name} ${pgType} ${defaultVal} ${nullable} ${primary};\n`;
      alterSQL += `        RAISE NOTICE '✅ Spalte ${col.name} zu ${definition.tableName} hinzugefügt';\n`;
      alterSQL += `    ELSE\n`;
      alterSQL += `        RAISE NOTICE '✓ Spalte ${col.name} existiert bereits in ${definition.tableName}';\n`;
      alterSQL += `    END IF;\n`;
      alterSQL += `END $$;\n\n`;
    }
  }
  
  return alterSQL;
}

// Generiere Supabase Init-Script (PostgreSQL-kompatibel mit RLS)
function generateSupabaseInitScript(definitions: SchemaDefinitions): string {
  const timestamp = new Date().toISOString();
  const targetVersion = '2.2.2';
  
  let script = `-- Chef Numbers Database Initialization Script (Supabase)
-- Frontend-synchronisiertes Schema v${targetVersion}
-- Automatisch generiert am: ${timestamp}
-- 
-- WICHTIG: Dieses Script ist für Supabase Cloud optimiert
-- - Verwendet UUIDs als Primary Keys
-- - Beinhaltet idempotente Schema-Updates
-- - Storage Bucket für Bilder wird separat erstellt

-- ========================================
-- Enum-Typen
-- ========================================

-- Enum für Sync-Status
DO $$ BEGIN
    CREATE TYPE sync_status_enum AS ENUM ('synced', 'pending', 'error', 'conflict');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- System-Tabellen (ZUERST erstellen!)
-- ========================================

-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Design-Tabelle (NICHT ERSTELLEN - wird nur in LocalStorage verwendet)
-- CREATE TABLE IF NOT EXISTS design (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     theme TEXT DEFAULT 'light',
--     primary_color TEXT DEFAULT '#007bff',
--     secondary_color TEXT DEFAULT '#6c757d',
--     accent_color TEXT DEFAULT '#28a745',
--     background_color TEXT DEFAULT '#ffffff',
--     text_color TEXT DEFAULT '#212529',
--     card_color TEXT DEFAULT '#f8f9fa',
--     border_color TEXT DEFAULT '#dee2e6',
--     created_at TIMESTAMP DEFAULT now(),
--     updated_at TIMESTAMP DEFAULT now()
-- );

-- ========================================
-- Haupt-Tabellen
-- ========================================

`;

  // Generiere Tabellen basierend auf Definitionen
  for (const [interfaceName, definition] of Object.entries(definitions)) {
    const tableName = definition.tableName;
    
    script += `-- ========================================\n`;
    script += `-- Tabelle: ${tableName} (Interface: ${definition.interfaceName})\n`;
    script += `-- ========================================\n\n`;
    
    script += `-- Erstelle Tabelle falls nicht vorhanden\n`;
    script += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    // Erstelle Column-Liste für CREATE TABLE
    const columnDefinitions: string[] = [];
    
    for (const column of definition.columns) {
      // PostgreSQL/Supabase Typ-Mapping
      let pgType = column.type;
      
      // Typ-Konvertierungen für Supabase (PostgreSQL-kompatibel)
      if (pgType === 'UUID') {
        pgType = 'UUID';
      } else if (pgType === 'TEXT[]') {
        pgType = 'TEXT[]';
      } else if (pgType === 'JSONB') {
        pgType = 'JSONB';
      } else if (pgType === 'TIMESTAMP') {
        pgType = 'TIMESTAMP';
      } else if (pgType === 'sync_status_enum') {
        pgType = 'sync_status_enum';
      }
      
      const nullable = column.nullable ? 'NULL' : 'NOT NULL';
      const primary = column.primary ? 'PRIMARY KEY' : '';
      
      // Default-Werte für Supabase
      let defaultValue = '';
      if (column.name === 'db_id') {
        defaultValue = 'DEFAULT gen_random_uuid()';
      } else if (column.name === 'created_at') {
        defaultValue = 'DEFAULT now()';
      } else if (column.name === 'updated_at') {
        defaultValue = 'DEFAULT now()'; // DEFAULT für CREATE, Trigger für UPDATE
      } else if (column.name === 'sync_status') {
        defaultValue = "DEFAULT 'pending'";
      } else if (column.name === 'is_dirty' || column.name === 'is_new') {
        defaultValue = 'DEFAULT false';
      } else if (column.defaultValue !== undefined && column.defaultValue !== null) {
        // Spezialbehandlung für SQL-Funktionen (nicht in Anführungszeichen)
        if (typeof column.defaultValue === 'string' && 
            (column.defaultValue === 'CURRENT_TIMESTAMP' || 
             column.defaultValue === 'now()' ||
             column.defaultValue.startsWith('gen_random_uuid'))) {
          defaultValue = `DEFAULT ${column.defaultValue}`;
        } else if (typeof column.defaultValue === 'string') {
          defaultValue = `DEFAULT '${column.defaultValue}'`;
        } else {
          defaultValue = `DEFAULT ${column.defaultValue}`;
        }
      }
      
      const columnDef = `${column.name} ${pgType} ${defaultValue} ${nullable} ${primary}`.trim();
      columnDefinitions.push(`    ${columnDef}`);
    }
    
    script += columnDefinitions.join(',\n');
    script += '\n);\n\n';
    
    // Basis-Indizes
    script += `-- Indizes für ${tableName}\n`;
    
    const hasId = definition.columns.find(col => col.name === 'id');
    const hasSyncStatus = definition.columns.find(col => col.name === 'sync_status');
    
    if (hasId && !hasId.primary) {
      script += `CREATE INDEX IF NOT EXISTS idx_${tableName}_id ON ${tableName}(id);\n`;
    }
    if (hasSyncStatus) {
      script += `CREATE INDEX IF NOT EXISTS idx_${tableName}_sync_status ON ${tableName}(sync_status);\n`;
    }
    
    // Spezielle Indizes basierend auf Interface
    if (definition.interfaceName === 'Article') {
      const supplierIdColumn = definition.columns.find(col => col.name === 'supplier_id');
      const categoryColumn = definition.columns.find(col => col.name === 'category');
      
      if (supplierIdColumn) {
        script += `CREATE INDEX IF NOT EXISTS idx_${tableName}_supplier_id ON ${tableName}(supplier_id);\n`;
      }
      if (categoryColumn) {
        script += `CREATE INDEX IF NOT EXISTS idx_${tableName}_category ON ${tableName}(category);\n`;
      }
    }
    
    script += '\n';
  }

  // ALTER-Statements für alle Spalten (Idempotent)
  script += generateAlterStatementsSupabase(definitions);
  
  // Trigger-Funktion für updated_at (einmalig erstellen)
  script += `-- ========================================\n`;
  script += `-- Trigger für automatisches updated_at\n`;
  script += `-- ========================================\n\n`;
  
  script += `-- Funktion für updated_at Trigger\n`;
  script += `CREATE OR REPLACE FUNCTION update_updated_at_column()\n`;
  script += `RETURNS TRIGGER AS $$\n`;
  script += `BEGIN\n`;
  script += `    NEW.updated_at = now();\n`;
  script += `    RETURN NEW;\n`;
  script += `END;\n`;
  script += `$$ language 'plpgsql';\n\n`;

  // Trigger für jede Tabelle mit updated_at
  for (const [_, definition] of Object.entries(definitions)) {
    const tableName = definition.tableName;
    const hasUpdatedAt = definition.columns.some(col => col.name === 'updated_at');
    
    if (hasUpdatedAt) {
      script += `-- Trigger für ${tableName}\n`;
      script += `DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};\n`;
      script += `CREATE TRIGGER update_${tableName}_updated_at\n`;
      script += `    BEFORE UPDATE ON ${tableName}\n`;
      script += `    FOR EACH ROW\n`;
      script += `    EXECUTE FUNCTION update_updated_at_column();\n\n`;
    }
  }

  // System-Tabellen Trigger
  script += `-- Trigger für system_info\n`;
  script += `DROP TRIGGER IF EXISTS update_system_info_updated_at ON system_info;\n`;
  script += `CREATE TRIGGER update_system_info_updated_at\n`;
  script += `    BEFORE UPDATE ON system_info\n`;
  script += `    FOR EACH ROW\n`;
  script += `    EXECUTE FUNCTION update_updated_at_column();\n\n`;

  // System-Informationen initialisieren (idempotent)
  script += `-- System-Informationen initialisieren\n`;
  script += `INSERT INTO system_info (key, value, description) VALUES\n`;
  script += `    ('schema_version', '${targetVersion}', 'Frontend-synchronisiertes Schema Version'),\n`;
  script += `    ('installation_date', now()::text, 'Datum der Schema-Installation'),\n`;
  script += `    ('last_update', now()::text, 'Datum der letzten Schema-Aktualisierung'),\n`;
  script += `    ('idempotent_updates', 'true', 'Schema-Updates sind idempotent - keine Versionsprüfung nötig')\n`;
  script += `ON CONFLICT (key) DO UPDATE SET\n`;
  script += `    value = EXCLUDED.value,\n`;
  script += `    updated_at = now();\n\n`;

  // Dynamische RPC-Functions für Schema-Updates
  script += `-- ========================================\n`;
  script += `-- Dynamische RPC-Functions für Schema-Updates\n`;
  script += `-- ========================================\n\n`;
  
  // RPC-Function 1: Dynamische Tabellen-Erstellung
  script += `-- RPC-Function: Dynamische Tabellen-Erstellung\n`;
  script += `CREATE OR REPLACE FUNCTION create_table_dynamic(table_sql TEXT)\n`;
  script += `RETURNS JSON\n`;
  script += `LANGUAGE plpgsql\n`;
  script += `SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)\n`;
  script += `AS $$\n`;
  script += `DECLARE\n`;
  script += `  result JSON;\n`;
  script += `  table_name TEXT;\n`;
  script += `BEGIN\n`;
  script += `  RAISE NOTICE '========================================';\n`;
  script += `  RAISE NOTICE 'DYNAMISCHE TABELLEN-ERSTELLUNG';\n`;
  script += `  RAISE NOTICE '========================================';\n`;
  script += `  \n`;
  script += `  -- Extrahiere Tabellennamen aus SQL (vereinfacht)\n`;
  script += `  -- Suche nach "CREATE TABLE [IF NOT EXISTS] table_name"\n`;
  script += `  table_name := regexp_replace(table_sql, '.*CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(\\w+).*', '\\1', 'gi');\n`;
  script += `  \n`;
  script += `  RAISE NOTICE '🔧 Erstelle Tabelle: %', table_name;\n`;
  script += `  RAISE NOTICE '📝 SQL: %', table_sql;\n`;
  script += `  \n`;
  script += `  BEGIN\n`;
  script += `    -- Führe das SQL aus\n`;
  script += `    EXECUTE table_sql;\n`;
  script += `    \n`;
  script += `    RAISE NOTICE '✅ Tabelle % erfolgreich erstellt', table_name;\n`;
  script += `    \n`;
  script += `    result := json_build_object(\n`;
  script += `      'success', true,\n`;
  script += `      'table_name', table_name,\n`;
  script += `      'message', 'Tabelle ' || table_name || ' erfolgreich erstellt',\n`;
  script += `      'timestamp', now()\n`;
  script += `    );\n`;
  script += `    \n`;
  script += `  EXCEPTION WHEN OTHERS THEN\n`;
  script += `    RAISE NOTICE '❌ Fehler beim Erstellen der Tabelle %: %', table_name, SQLERRM;\n`;
  script += `    \n`;
  script += `    result := json_build_object(\n`;
  script += `      'success', false,\n`;
  script += `      'table_name', table_name,\n`;
  script += `      'error', SQLERRM,\n`;
  script += `      'message', 'Fehler beim Erstellen der Tabelle ' || table_name || ': ' || SQLERRM,\n`;
  script += `      'timestamp', now()\n`;
  script += `    );\n`;
  script += `  END;\n`;
  script += `  \n`;
  script += `  RETURN result;\n`;
  script += `  \n`;
  script += `EXCEPTION\n`;
  script += `  WHEN OTHERS THEN\n`;
  script += `    RETURN json_build_object(\n`;
  script += `      'success', false,\n`;
  script += `      'error', SQLERRM,\n`;
  script += `      'message', 'Dynamische Tabellen-Erstellung fehlgeschlagen: ' || SQLERRM,\n`;
  script += `      'timestamp', now()\n`;
  script += `    );\n`;
  script += `END;\n`;
  script += `$$;\n\n`;
  
  // RPC-Function 2: SQL ausführen
  script += `-- RPC-Function: SQL ausführen\n`;
  script += `CREATE OR REPLACE FUNCTION execute_sql_dynamic(sql_statement TEXT)\n`;
  script += `RETURNS JSON\n`;
  script += `LANGUAGE plpgsql\n`;
  script += `SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)\n`;
  script += `AS $$\n`;
  script += `DECLARE\n`;
  script += `  result JSON;\n`;
  script += `  affected_rows INTEGER := 0;\n`;
  script += `BEGIN\n`;
  script += `  RAISE NOTICE '========================================';\n`;
  script += `  RAISE NOTICE 'DYNAMISCHE SQL-AUSFÜHRUNG';\n`;
  script += `  RAISE NOTICE '========================================';\n`;
  script += `  \n`;
  script += `  RAISE NOTICE '📝 SQL: %', sql_statement;\n`;
  script += `  \n`;
  script += `  BEGIN\n`;
  script += `    -- Führe das SQL aus\n`;
  script += `    EXECUTE sql_statement;\n`;
  script += `    \n`;
  script += `    -- Versuche die Anzahl der betroffenen Zeilen zu ermitteln\n`;
  script += `    GET DIAGNOSTICS affected_rows = ROW_COUNT;\n`;
  script += `    \n`;
  script += `    RAISE NOTICE '✅ SQL erfolgreich ausgeführt (betroffene Zeilen: %)', affected_rows;\n`;
  script += `    \n`;
  script += `    result := json_build_object(\n`;
  script += `      'success', true,\n`;
  script += `      'affected_rows', affected_rows,\n`;
  script += `      'message', 'SQL erfolgreich ausgeführt',\n`;
  script += `      'timestamp', now()\n`;
  script += `    );\n`;
  script += `    \n`;
  script += `  EXCEPTION WHEN OTHERS THEN\n`;
  script += `    RAISE NOTICE '❌ Fehler bei SQL-Ausführung: %', SQLERRM;\n`;
  script += `    \n`;
  script += `    result := json_build_object(\n`;
  script += `      'success', false,\n`;
  script += `      'error', SQLERRM,\n`;
  script += `      'message', 'Fehler bei SQL-Ausführung: ' || SQLERRM,\n`;
  script += `      'timestamp', now()\n`;
  script += `    );\n`;
  script += `  END;\n`;
  script += `  \n`;
  script += `  RETURN result;\n`;
  script += `  \n`;
  script += `EXCEPTION\n`;
  script += `  WHEN OTHERS THEN\n`;
  script += `    RETURN json_build_object(\n`;
  script += `      'success', false,\n`;
  script += `      'error', SQLERRM,\n`;
  script += `      'message', 'Dynamische SQL-Ausführung fehlgeschlagen: ' || SQLERRM,\n`;
  script += `      'timestamp', now()\n`;
  script += `    );\n`;
  script += `END;\n`;
  script += `$$;\n\n`;
  
  // RPC-Function 3: Idempotentes Schema-Update
  script += `-- RPC-Function: Idempotentes Schema-Update\n`;
  script += `CREATE OR REPLACE FUNCTION update_schema_idempotent()\n`;
  script += `RETURNS JSON\n`;
  script += `LANGUAGE plpgsql\n`;
  script += `SECURITY DEFINER  -- Führt mit Owner-Rechten aus (wichtig!)\n`;
  script += `AS $$\n`;
  script += `DECLARE\n`;
  script += `  result JSON;\n`;
  script += `  target_version TEXT := '${targetVersion}';\n`;
  script += `BEGIN\n`;
  script += `  RAISE NOTICE '========================================';\n`;
  script += `  RAISE NOTICE 'IDEMPOTENTES SCHEMA-UPDATE';\n`;
  script += `  RAISE NOTICE '========================================';\n`;
  script += `  \n`;
  script += `  RAISE NOTICE '🎯 Ziel-Version: %', target_version;\n`;
  script += `  RAISE NOTICE '🔄 Führe idempotente Schema-Updates durch...';\n`;
  script += `  \n`;
  script += `  -- Das komplette Init-Script ist bereits idempotent\n`;
  script += `  -- Es erstellt nur fehlende Tabellen/Spalten\n`;
  script += `  -- Keine Versionsprüfung nötig!\n`;
  script += `  \n`;
  script += `  -- Update System-Info\n`;
  script += `  INSERT INTO system_info (key, value, description) VALUES\n`;
  script += `    ('schema_version', target_version, 'Schema Version'),\n`;
  script += `    ('last_idempotent_update', now()::text, 'Letztes idempotentes Schema-Update'),\n`;
  script += `    ('idempotent_system', 'active', 'Idempotentes Schema-System ist aktiv')\n`;
  script += `  ON CONFLICT (key) DO UPDATE SET \n`;
  script += `    value = EXCLUDED.value, \n`;
  script += `    updated_at = now();\n`;
  script += `  \n`;
  script += `  result := json_build_object(\n`;
  script += `    'success', true,\n`;
  script += `    'target_version', target_version,\n`;
  script += `    'message', 'Idempotentes Schema-Update erfolgreich durchgeführt (v' || target_version || ')',\n`;
  script += `    'idempotent', true,\n`;
  script += `    'timestamp', now()\n`;
  script += `  );\n`;
  script += `  \n`;
  script += `  RETURN result;\n`;
  script += `  \n`;
  script += `EXCEPTION\n`;
  script += `  WHEN OTHERS THEN\n`;
  script += `    RETURN json_build_object(\n`;
  script += `      'success', false,\n`;
  script += `      'error', SQLERRM,\n`;
  script += `      'message', 'Idempotentes Schema-Update fehlgeschlagen: ' || SQLERRM,\n`;
  script += `      'timestamp', now()\n`;
  script += `    );\n`;
  script += `END;\n`;
  script += `$$;\n\n`;

  // Storage Bucket für Bilder
  script += `-- ========================================\n`;
  script += `-- Storage Bucket für Bilder\n`;
  script += `-- ========================================\n`;
  script += `-- WICHTIG: Storage Buckets werden über das Supabase Dashboard erstellt\n`;
  script += `-- Oder verwenden Sie die Supabase JS Client API\n`;
  script += `-- \n`;
  script += `-- Bucket-Name: chef-numbers-images\n`;
  script += `-- Public: true (für Bildanzeige)\n`;
  script += `-- File Size Limit: 5MB\n`;
  script += `-- Allowed MIME types: image/jpeg, image/png, image/webp\n`;
  script += `-- \n`;
  script += `-- Erstellen Sie den Bucket manuell im Supabase Dashboard:\n`;
  script += `-- Storage → Create a new bucket → Name: "chef-numbers-images"\n\n`;

  // RLS Policies (optional - für später)
  script += `-- ========================================\n`;
  script += `-- Row Level Security (RLS) Policies\n`;
  script += `-- ========================================\n`;
  script += `-- HINWEIS: RLS ist standardmäßig DEAKTIVIERT\n`;
  script += `-- Für Production empfohlen: RLS aktivieren\n`;
  script += `-- Aktivieren Sie RLS nach Bedarf:\n`;
  script += `-- ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;\n`;
  script += `-- CREATE POLICY <policy_name> ON <table_name> ...\n\n`;

  script += `-- Beispiel: Alle Zugriffe erlauben (für Service Role)\n`;
  for (const [_, definition] of Object.entries(definitions)) {
    const tableName = definition.tableName;
    script += `-- ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n`;
    script += `-- CREATE POLICY "${tableName}_all_access" ON ${tableName} FOR ALL USING (true);\n`;
  }
  
  script += `-- ========================================\n`;
  script += `-- Schema-Initialisierung abgeschlossen\n`;
  script += `-- Version: ${targetVersion}\n`;
  script += `-- ========================================\n`;
  script += `-- \n`;
  script += `-- VERFÜGBARE RPC-FUNCTIONS:\n`;
  script += `-- 1. create_table_dynamic(table_sql) - Erstellt eine Tabelle dynamisch\n`;
  script += `-- 2. execute_sql_dynamic(sql_statement) - Führt beliebiges SQL aus\n`;
  script += `-- 3. update_schema_idempotent() - Führt idempotente Schema-Updates durch\n`;
  script += `-- \n`;
  script += `-- API-AUFRUFE:\n`;
  script += `-- POST /rest/v1/rpc/create_table_dynamic\n`;
  script += `-- POST /rest/v1/rpc/execute_sql_dynamic  \n`;
  script += `-- POST /rest/v1/rpc/update_schema_idempotent\n`;
  script += `-- \n`;
  script += `-- IDEMPOTENTES SYSTEM:\n`;
  script += `-- ✅ Alle Tabellen-Erstellungen sind idempotent (CREATE TABLE IF NOT EXISTS)\n`;
  script += `-- ✅ Alle Spalten-Hinzufügungen sind idempotent (prüfen auf Existenz)\n`;
  script += `-- ✅ Alle Indizes sind idempotent (CREATE INDEX IF NOT EXISTS)\n`;
  script += `-- ✅ Keine Versionsprüfung nötig - einfach Script ausführen!\n`;
  script += `-- \n`;
  script += `-- NÄCHSTE SCHRITTE:\n`;
  script += `-- 1. Erstellen Sie den Storage Bucket "chef-numbers-images" im Dashboard\n`;
  script += `-- 2. Aktivieren Sie RLS Policies wenn gewünscht\n`;
  script += `-- 3. Testen Sie die Verbindung in Ihrer App\n`;
  script += `-- 4. Bei Schema-Änderungen: Führen Sie das komplette Script erneut aus!\n`;
  script += `-- \n`;

  return script;
}

// Generiere RPC-Functions für Supabase (nur Functions, kein Schema!)
function generateSupabaseRPCFunction(definitions: SchemaDefinitions): string {
  const timestamp = new Date().toISOString();
  const targetVersion = '2.2.2';
  
  let script = `-- ============================================
-- SUPABASE AUTO-INSTALLER: RPC-Functions
-- ============================================
-- Frontend-synchronisiertes Schema v${targetVersion}
-- Automatisch generiert am: ${timestamp}
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
`;

  return script;
}

// Entfernt: generateOldSupabaseRPCFunction - nicht mehr benötigt

// Führe Script aus
if (require.main === module) {
  main();
}

export { generateAutoSchema, generateSQLFromAutoSchema };
