/**
 * backup.ts
 * TypeScript-Typen für Backup-Format (Version 2.0.0)
 */

import { StorageData, StoragePicture } from './storage';

/**
 * Backup-Format-Versionen
 */
export type BackupVersion = '1.0.0' | '2.0.0';

/**
 * Backup-Format-Typen
 */
export type BackupFormat = 'json' | 'zip' | 'multipart-zip';

/**
 * Source Storage Information (im Backup gespeichert)
 */
export interface BackupSourceStorage {
  mode: 'local' | 'cloud';
  dataStorage: StorageData;
  pictureStorage: StoragePicture;
  connectionInfo: {
    dataStorageType: string;
    pictureStorageType: string;
  };
}

/**
 * Schema-Informationen im Backup
 */
export interface BackupSchema {
  version: string;
  tables: string[]; // Liste aller gesicherten Tabellen
}

/**
 * LocalStorage-Daten im Backup
 */
export interface BackupLocalStorage {
  localOptions: string;
  storageManagement: string; // Vollständig: connections, selectedStorage UND currentStorage
}

/**
 * Bild-Metadaten im Backup (nur Pfade, nicht die Bilder selbst bei ZIP)
 */
export interface BackupImageMetadata {
  [imagePath: string]: string; // Pfad → Dateiname im ZIP oder Base64 Data URL
}

/**
 * Backup-Metadaten
 */
export interface BackupMetadata {
  totalEntities: number;
  totalImages: number;
  totalSize: number; // Größe des Backup-Strings in Bytes
  imageSizes: Record<string, number>; // Größe jedes Bildes
}

/**
 * Backup-Daten-Struktur (Version 2.0.0)
 */
export interface BackupDataV2 {
  version: '2.0.0';
  timestamp: string;
  appVersion: string;
  sourceStorage: BackupSourceStorage;
  schema: BackupSchema;
  entities: Record<string, any[]>; // Dynamisch aus Schema
  localStorage: BackupLocalStorage;
  images: BackupImageMetadata; // Bei ZIP: nur Pfade, bei JSON: Base64 Data URLs
  metadata: BackupMetadata;
}

/**
 * Legacy Backup-Daten-Struktur (Version 1.0.0 - abwärtskompatibel)
 */
export interface BackupDataV1 {
  version: '1.0.0';
  timestamp: string;
  appVersion: string;
  entities: Record<string, any[]>;
  localStorage: Record<string, string>;
  images: Record<string, string>; // Base64 Data URLs
}

/**
 * Union-Type für alle Backup-Versionen
 */
export type BackupData = BackupDataV1 | BackupDataV2;

/**
 * Multi-Part Manifest
 */
export interface MultiPartManifest {
  version: string;
  timestamp: string;
  format: 'multipart-zip';
  totalParts: number;
  totalSize: number;
  parts: Array<{
    partNumber: number;
    filename: string;
    size: number;
    hash?: string;
    entities?: string[];
    imageCount?: number;
  }>;
  sourceStorage?: BackupSourceStorage;
  schema?: BackupSchema;
}

/**
 * Backup-Ergebnis
 */
export interface BackupResult {
  success: boolean;
  data?: BackupData | Blob; // BackupData bei JSON, Blob bei ZIP
  format?: BackupFormat;
  size?: number;
  message: string;
  parts?: Blob[]; // Bei Multi-Part ZIP
  manifest?: MultiPartManifest; // Bei Multi-Part ZIP
}

/**
 * Restore-Ergebnis
 */
export interface RestoreResult {
  success: boolean;
  message: string;
  requiresStorageChange?: boolean; // true wenn currentStorage geändert werden muss
  backupStorageType?: string;
  currentStorageType?: string;
}

/**
 * Backup-Progress-Informationen
 */
export interface BackupProgress {
  current: number;
  total: number;
  item: string;
  message: string;
  size?: number; // Aktuelle Größe in Bytes
  estimatedSize?: number; // Geschätzte Gesamtgröße
}

/**
 * Storage-Typ-Kompatibilitäts-Info
 */
export interface StorageCompatibilityInfo {
  compatible: boolean;
  backupStorageType: string;
  currentStorageType: string;
  requiresStorageChange: boolean;
}
