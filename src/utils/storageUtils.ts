import { UUIDUtils } from './uuidUtils';
import { logger } from './logger';
import { BaseEntity } from '../types';

/**
 * Utility-Funktionen für die Integration der neuen Storage-Architektur
 * in bestehende Komponenten ohne große Änderungen
 */

/**
 * Generiert eine neue UUID für Entitäten
 * Ersetzt alle Date.now().toString() Aufrufe
 */
export const generateId = (): string => {
  logger.logFunction('generateId', [], UUIDUtils.generateId());
  return UUIDUtils.generateId();
};

/**
 * Generiert eine neue UUID für temporäre Objekte (z.B. Formularfelder)
 * Ersetzt alle Date.now().toString() Aufrufe für temporäre IDs
 */
export const generateTempId = (): string => {
  logger.logFunction('generateTempId', [], UUIDUtils.generateTempId());
  return UUIDUtils.generateTempId();
};

/**
 * Legacy-Support: Alte ID-Generierung für Rückwärtskompatibilität
 * @deprecated Verwende generateId() stattdessen
 */
export const generateLegacyId = (): string => {
  logger.warn('LEGACY', 'generateLegacyId() is deprecated. Use generateId() instead.');
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Validiert ob eine ID ein gültiges UUID-Format hat
 */
export const isValidUUID = (id: string): boolean => {
  return UUIDUtils.isValidUUID(id);
};

/**
 * Validiert ob eine ID ein temporäres ID-Format hat
 */
export const isTempId = (id: string): boolean => {
  return UUIDUtils.isTempId(id);
};

/**
 * Konvertiert eine alte String-ID zu UUID (für Migration)
 */
export const migrateOldId = (oldId: string): string => {
  logger.logMigration('id-migration', oldId, UUIDUtils.migrateOldId(oldId));
  return UUIDUtils.migrateOldId(oldId);
};

/**
 * Logging-Hilfsfunktionen für einfache Verwendung
 */
export const logInfo = (category: string, message: string, ...args: any[]): void => {
  logger.info(category, message, ...args);
};

export const logError = (category: string, message: string, error?: Error): void => {
  logger.error(category, message, error);
};

export const logWarn = (category: string, message: string, ...args: any[]): void => {
  logger.warn(category, message, ...args);
};

export const logDebug = (category: string, message: string, ...args: any[]): void => {
  logger.debug(category, message, ...args);
};

/**
 * Performance-Timing-Hilfsfunktionen
 */
export const startTimer = (operation: string): void => {
  logger.startTimer(operation);
};

export const endTimer = (operation: string): number => {
  return logger.endTimer(operation);
};

/**
 * Storage-Logging-Hilfsfunktionen
 */
export const logStorageOperation = (operation: 'save' | 'load' | 'delete' | 'migrate', key: string, details?: any): void => {
  logger.logStorage(operation, key, details);
};

/**
 * Migration-Logging-Hilfsfunktionen
 */
export const logMigrationOperation = (operation: string, from: string, to: string, details?: any): void => {
  logger.logMigration(operation, from, to, details);
};

/**
 * Logging-Konfiguration verwalten
 */
export const setLoggingLevel = (level: number): void => {
  logger.setLevel(level);
};

export const setVerboseMode = (enabled: boolean): void => {
  logger.setVerboseMode(enabled);
};

export const getLoggingStatus = (): string => {
  return logger.getStatus();
};

/**
 * Hilfsfunktion für die Migration bestehender Komponenten
 * Ersetzt alle Date.now().toString() Aufrufe automatisch
 */
export const replaceLegacyIdGeneration = (code: string): string => {
  // Einfache Regex-Ersetzungen für häufige Patterns
  return code
    .replace(/Date\.now\(\)\.toString\(\)/g, 'generateId()')
    .replace(/Date\.now\(\)\.toString\(36\) \+ Math\.random\(\)\.toString\(36\)\.substr\(2\)/g, 'generateLegacyId()')
    .replace(/Date\.now\(\)\.toString\(36\) \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\)/g, 'generateLegacyId()');
};

/**
 * Hilfsfunktion für die Validierung von Entitäten
 */
export const validateEntity = (entity: any): boolean => {
  if (!entity || typeof entity !== 'object') {
    logger.warn('VALIDATION', 'Entity is not a valid object');
    return false;
  }

  if (!entity.id || typeof entity.id !== 'string') {
    logger.warn('VALIDATION', 'Entity missing or invalid ID');
    return false;
  }

  if (!UUIDUtils.isValidUUID(entity.id) && !UUIDUtils.isTempId(entity.id)) {
    logger.warn('VALIDATION', `Entity has invalid ID format: ${entity.id}`);
    return false;
  }

  return true;
};

/**
 * Hilfsfunktion für die Bereinigung von Entitäten
 */
export const cleanEntity = (entity: any): any => {
  if (!entity || typeof entity !== 'object') {
    return entity;
  }

  // Stelle sicher, dass die ID ein gültiges Format hat
  if (entity.id && !UUIDUtils.isValidUUID(entity.id) && !UUIDUtils.isTempId(entity.id)) {
    entity.id = UUIDUtils.migrateOldId(entity.id);
  }

  // Stelle sicher, dass Timestamps vorhanden sind
  if (!entity.createdAt) {
    entity.createdAt = new Date();
  }
  if (!entity.updatedAt) {
    entity.updatedAt = new Date();
  }

  return entity;
};

/**
 * Hilfsfunktion für die Erstellung neuer Entitäten mit korrekten Feldern
 */
export const createEntity = <T extends BaseEntity>(
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'lastModifiedBy'>,
  userId?: string
): T => {
  const now = new Date();
  
  return {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    lastModifiedBy: userId
  } as unknown as T;
};

/**
 * Hilfsfunktion für die Aktualisierung von Entitäten
 * Timestamps werden von PostgreSQL automatisch verwaltet
 */
export const updateEntity = <T extends BaseEntity>(
  entity: T,
  updates: Partial<T>,
  userId?: string
): T => {
  return {
    ...entity,
    ...updates
    // Keine Timestamps - werden von PostgreSQL automatisch gesetzt (created_at, updated_at)
    // updatedBy und lastModifiedBy werden später implementiert (User-System)
  };
};

