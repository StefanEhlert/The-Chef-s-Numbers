/**
 * backupHelpers.ts
 * Helper-Funktionen für dynamische Tabellenerkennung und Backup-Operationen
 * Verwendet autoSchemaDefinitions.json zur Laufzeit für automatische Tabellenerkennung
 */

import autoSchemaDefinitions from '../schemas/generated/autoSchemaDefinitions.json';

// Interface-Definitionen für Schema-Definitionen
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

/**
 * Konvertiert Interface-Name zu Entity-Type (camelCase Plural)
 * Beispiele:
 * - "Article" → "articles"
 * - "Supplier" → "suppliers"
 * - "UnitEntity" → "units" (spezieller Fall)
 * - "CategoryEntity" → "categories" (spezieller Fall)
 * - "AccountingAccount" → "accountingAccounts"
 */
export const interfaceNameToEntityType = (interfaceName: string): string => {
  // Spezielle Fälle
  if (interfaceName === 'UnitEntity') return 'units';
  if (interfaceName === 'CategoryEntity') return 'categories';
  
  // Standard: Konvertiere zu camelCase Plural
  // Zuerst zu camelCase (erster Buchstabe klein)
  const camelCase = interfaceName.charAt(0).toLowerCase() + interfaceName.slice(1);
  
  // Füge 's' hinzu wenn nicht bereits vorhanden
  return camelCase.endsWith('s') ? camelCase : camelCase + 's';
};

/**
 * Konvertiert Entity-Type zurück zu Interface-Name
 * Beispiele:
 * - "articles" → "Article"
 * - "units" → "UnitEntity"
 * - "accountingAccounts" → "AccountingAccount"
 */
export const entityTypeToInterfaceName = (entityType: string): string | null => {
  // Spezielle Fälle
  if (entityType === 'units') return 'UnitEntity';
  if (entityType === 'categories') return 'CategoryEntity';
  
  // Standard: Entferne 's' am Ende und konvertiere zu PascalCase
  const singular = entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
  const pascalCase = singular.charAt(0).toUpperCase() + singular.slice(1);
  
  return pascalCase;
};

/**
 * Gibt alle Entity-Typen zurück, die gesichert werden sollten
 * Läd autoSchemaDefinitions.json zur Laufzeit
 */
export const getBackupEntityTypes = (): string[] => {
  const schema = autoSchemaDefinitions as SchemaDefinitions;
  const entityTypes = Object.keys(schema)
    .map(interfaceName => interfaceNameToEntityType(interfaceName))
    .filter(entityType => entityType !== null) as string[];
  
  return entityTypes;
};

/**
 * Gibt das Mapping von Entity-Type zu tableName zurück
 */
export const getEntityTypeToTableNameMapping = (): Record<string, string> => {
  const schema = autoSchemaDefinitions as SchemaDefinitions;
  const mapping: Record<string, string> = {};
  
  Object.entries(schema).forEach(([interfaceName, definition]) => {
    const entityType = interfaceNameToEntityType(interfaceName);
    mapping[entityType] = definition.tableName;
  });
  
  return mapping;
};

/**
 * Gibt das Mapping von tableName zu Entity-Type zurück
 */
export const getTableNameToEntityTypeMapping = (): Record<string, string> => {
  const schema = autoSchemaDefinitions as SchemaDefinitions;
  const mapping: Record<string, string> = {};
  
  Object.entries(schema).forEach(([interfaceName, definition]) => {
    const entityType = interfaceNameToEntityType(interfaceName);
    mapping[definition.tableName] = entityType;
  });
  
  return mapping;
};

/**
 * Gibt alle Tabellennamen zurück
 */
export const getBackupTableNames = (): string[] => {
  const schema = autoSchemaDefinitions as SchemaDefinitions;
  return Object.values(schema).map(def => def.tableName);
};

/**
 * Prüft ob ein Entity-Type existiert
 */
export const isValidEntityType = (entityType: string): boolean => {
  const entityTypes = getBackupEntityTypes();
  return entityTypes.includes(entityType);
};

/**
 * Gibt die Tabellennamen für einen Entity-Type zurück
 */
export const getTableNameForEntityType = (entityType: string): string | null => {
  const mapping = getEntityTypeToTableNameMapping();
  return mapping[entityType] || null;
};

/**
 * Gibt den Entity-Type für einen Tabellennamen zurück
 */
export const getEntityTypeForTableName = (tableName: string): string | null => {
  const mapping = getTableNameToEntityTypeMapping();
  return mapping[tableName] || null;
};

/**
 * Gibt deutsche Bezeichnung für Entity-Type zurück (für UI)
 */
export const getEntityNameGerman = (entityType: string): string => {
  const mapping: Record<string, string> = {
    'articles': 'Artikel',
    'suppliers': 'Lieferanten',
    'recipes': 'Rezepte',
    'receipts': 'Belege',
    'accountingAccounts': 'Buchungskonten',
    'accountingSettings': 'Buchhaltungseinstellungen',
    'units': 'Einheiten',
    'categories': 'Kategorien'
  };
  
  return mapping[entityType] || entityType;
};

/**
 * Filtert Entity-Typen, die Bilder enthalten können
 */
export const getEntityTypesWithImages = (): string[] => {
  // Nur diese Entity-Typen können Bilder haben
  return ['articles', 'recipes', 'receipts'];
};

/**
 * Erstellt den Bildpfad für eine Entity
 */
export const getImagePathForEntity = (entityType: string, entityId: string): string => {
  if (entityType === 'articles') {
    return `pictures/articles/${entityId}`;
  } else if (entityType === 'recipes') {
    return `pictures/recipes/${entityId}`;
  } else if (entityType === 'receipts') {
    return `pictures/receipts/${entityId}`;
  }
  throw new Error(`Entity-Type ${entityType} unterstützt keine Bilder`);
};
