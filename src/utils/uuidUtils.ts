import { v4 as uuidv4 } from 'uuid';

/**
 * Einheitliche UUID-Generierung für die gesamte Anwendung
 * Ersetzt alle verschiedenen ID-Generierungsmethoden
 */
export class UUIDUtils {
  /**
   * Generiert eine neue UUID v4
   */
  static generateId(): string {
    return uuidv4();
  }

  /**
   * Generiert eine neue UUID für temporäre Objekte (z.B. Formularfelder)
   */
  static generateTempId(): string {
    return `temp_${uuidv4()}`;
  }

  /**
   * Validiert ob eine ID ein gültiges UUID-Format hat
   */
  static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Validiert ob eine ID ein temporäres ID-Format hat
   */
  static isTempId(id: string): boolean {
    return id.startsWith('temp_') && this.isValidUUID(id.substring(5));
  }

  /**
   * Konvertiert eine alte String-ID zu UUID (für Migration)
   */
  static migrateOldId(oldId: string | undefined): string {
    // Prüfe ob oldId existiert
    if (!oldId) {
      return this.generateId();
    }
    
    // Wenn es bereits eine UUID ist, zurückgeben
    if (this.isValidUUID(oldId)) {
      return oldId;
    }
    
    // Wenn es eine temporäre ID ist, neue UUID generieren
    if (oldId.startsWith('temp_')) {
      return this.generateTempId();
    }
    
    // Für alte String-IDs: neue UUID generieren
    return this.generateId();
  }
}

/**
 * Legacy-Support: Alte ID-Generierung für Rückwärtskompatibilität
 * @deprecated Verwende UUIDUtils.generateId() stattdessen
 */
export const generateLegacyId = (): string => {
  console.warn('⚠️ generateLegacyId() ist deprecated. Verwende UUIDUtils.generateId() stattdessen.');
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
