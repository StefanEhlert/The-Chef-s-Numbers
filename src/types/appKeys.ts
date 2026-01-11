/**
 * appKeys.ts
 * TypeScript-Typen für App-Keys Export/Import
 */

import { OCRApiConfig } from './accounting';

/**
 * Export-Datenstruktur für App-Keys
 */
export interface AppKeysExportData {
  version: string; // Format-Version (z.B. '1.0.0')
  timestamp: string; // ISO-Timestamp
  activeDatabase?: string; // ID der aktuell aktiven Datenbank (z.B. 'postgresql', 'mariadb', 'supabase', etc.) - nur gesetzt wenn currentStorage aktiv ist
  activeStorageMode?: 'local' | 'cloud'; // Aktueller Storage-Modus
  activePictureStorage?: string; // Aktueller Bildspeicher (z.B. 'LocalPath', 'MinIO', 'Supabase', etc.)
  data: {
    databases?: {
      postgresql?: any; // PostgreSQL-Verbindungskonfiguration
      mariadb?: any; // MariaDB-Verbindungskonfiguration
      mysql?: any; // MySQL-Verbindungskonfiguration
      couchdb?: any; // CouchDB-Verbindungskonfiguration
      supabase?: any; // Supabase-Verbindungskonfiguration
      firebase?: any; // Firebase-Verbindungskonfiguration
    };
    ocrApis?: Record<string, OCRApiConfig>; // OCR-API-Konfigurationen (key = provider name)
    appSettings?: {
      localOptions?: any; // App-Einstellungen (Design, etc.)
    };
  };
}

/**
 * Verschlüsselte Export-Datei-Struktur
 */
export interface EncryptedAppKeysFile {
  version: string;
  encrypted: string; // Base64-kodierte verschlüsselte Daten
  salt: string; // Base64-kodierter Salt
  iv: string; // Base64-kodierter IV
}

/**
 * Konfigurations-Item für die UI-Liste
 */
export interface AppKeysConfigItem {
  id: string; // Eindeutige ID (z.B. 'postgresql', 'ocr-azure', 'appSettings')
  name: string; // Anzeigename (z.B. 'PostgreSQL', 'Azure Form Recognizer', 'App-Einstellungen')
  type: 'database' | 'ocrApi' | 'appSettings';
  isComplete: boolean; // Ob alle erforderlichen Felder vorhanden sind
  data?: any; // Die tatsächlichen Konfigurationsdaten
  provider?: string; // Für OCR-APIs: Provider-Name (z.B. 'azure', 'taggun', 'gemini')
}
