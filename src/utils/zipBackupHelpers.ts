/**
 * zipBackupHelpers.ts
 * Helper-Funktionen für ZIP-Backup-Erstellung und -Restore
 * Unterstützt Standard ZIP und Multi-Part ZIP für große Backups
 */

import JSZip from 'jszip';
import { getBackupEntityTypes, getEntityTypesWithImages, getImagePathForEntity } from './backupHelpers';

// Konstanten für Backup-Größen
export const BACKUP_SIZE_LIMITS = {
  JSON_MAX_SIZE: 100 * 1024 * 1024, // 100 MB
  ZIP_MAX_SIZE: 500 * 1024 * 1024, // 500 MB pro Teil
  WARNING_SIZE: 400 * 1024 * 1024, // 400 MB Warnung
  LARGE_IMAGE_SIZE: 10 * 1024 * 1024, // 10 MB Warnung pro Bild
} as const;

/**
 * Backup-Format-Typen
 */
export type BackupFormat = 'json' | 'zip' | 'multipart-zip';

/**
 * Bild-Metadaten
 */
export interface ImageMetadata {
  path: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Backup-Metadaten
 */
export interface BackupMetadata {
  version: string;
  timestamp: string;
  appVersion: string;
  format: BackupFormat;
  totalSize: number;
  totalEntities: number;
  totalImages: number;
  imageSizes: Record<string, number>;
}

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
}

/**
 * Konvertiert Blob/File zu Base64 Data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Konvertiert Base64 Data URL zu Blob
 */
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Konvertiert eine URL (Data URL oder Blob URL) zu einem Blob
 * Unterstützt sowohl Data URLs (data:...) als auch Blob URLs (blob:...)
 */
export const urlToBlob = async (url: string): Promise<Blob> => {
  if (url.startsWith('blob:')) {
    // Blob URL: Verwende fetch um den Blob zu erhalten
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der Blob URL: ${response.statusText}`);
    }
    return await response.blob();
  } else if (url.startsWith('data:')) {
    // Data URL: Verwende die bestehende dataURLToBlob Funktion
    return dataURLToBlob(url);
  } else {
    // HTTP/HTTPS URL: Lade als Blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Fehler beim Laden der URL: ${response.statusText}`);
    }
    return await response.blob();
  }
};

/**
 * Konvertiert Base64 Data URL zu File
 */
export const dataURLToFile = (dataURL: string, filename: string): File => {
  const blob = dataURLToBlob(dataURL);
  return new File([blob], filename, { type: blob.type });
};

/**
 * Bestimmt das Backup-Format basierend auf geschätzter Größe
 */
export const determineBackupFormat = (estimatedSize: number): BackupFormat => {
  if (estimatedSize < BACKUP_SIZE_LIMITS.JSON_MAX_SIZE) {
    return 'json';
  } else if (estimatedSize < BACKUP_SIZE_LIMITS.ZIP_MAX_SIZE) {
    return 'zip';
  } else {
    return 'multipart-zip';
  }
};

/**
 * Erstellt ein ZIP-Archiv mit Backup-Daten
 */
export const createZipBackup = async (
  backupData: any,
  images: Map<string, Blob>
): Promise<Blob> => {
  const zip = new JSZip();
  
  // Füge backup-data.json hinzu
  const backupDataJson = JSON.stringify(backupData, null, 2);
  zip.file('backup-data.json', backupDataJson);
  
  // Füge Bilder hinzu
  const imageFolders = {
    articles: zip.folder('images/articles'),
    recipes: zip.folder('images/recipes'),
    receipts: zip.folder('images/receipts'),
  };
  
  let imageCount = 0;
  for (const [imagePath, imageBlob] of Array.from(images.entries())) {
    try {
      // Extrahiere Entity-Type und ID aus imagePath
      // Format: "pictures/articles/{id}" oder "pictures/receipts/{id}"
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'pictures') {
        const entityType = pathParts[1]; // 'articles', 'recipes' oder 'receipts'
        const entityId = pathParts[2];
        
        // Bestimme Dateiendung aus Blob-Typ
        let extension = 'jpg';
        if (imageBlob.type) {
          const mimeMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
          };
          extension = mimeMap[imageBlob.type] || 'jpg';
        }
        
        const filename = `${entityId}.${extension}`;
        const folder = imageFolders[entityType as keyof typeof imageFolders];
        
        if (folder) {
          folder.file(filename, imageBlob);
          imageCount++;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Fehler beim Hinzufügen des Bildes ${imagePath} zum ZIP:`, error);
    }
  }
  
  console.log(`✅ ${imageCount} Bilder zum ZIP hinzugefügt`);
  
  // Erstelle ZIP-Archiv
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }, // Mittlere Komprimierung für gute Balance zwischen Größe und Geschwindigkeit
  });
  
  return zipBlob;
};

/**
 * Erstellt Multi-Part ZIP-Backup
 */
export const createMultiPartZipBackup = async (
  backupData: any,
  images: Map<string, Blob>,
  onProgress?: (current: number, total: number, part: number, totalParts: number) => void,
  dbName?: string // Optional: Datenbank-Adapter-Name für Dateinamen
): Promise<{ parts: Blob[]; manifest: MultiPartManifest }> => {
  const parts: Blob[] = [];
  
  // Schätze Größe der Daten
  const backupDataJson = JSON.stringify(backupData, null, 2);
  const dataSize = new Blob([backupDataJson]).size;
  
  // Berechne Bild-Größen
  let totalImageSize = 0;
  const imageSizes = new Map<string, number>();
  for (const [path, blob] of Array.from(images.entries())) {
    const size = blob.size;
    imageSizes.set(path, size);
    totalImageSize += size;
  }
  
  const estimatedTotalSize = dataSize + totalImageSize;
  const estimatedParts = Math.ceil(estimatedTotalSize / BACKUP_SIZE_LIMITS.ZIP_MAX_SIZE);
  
  console.log(`📦 Geschätzte Gesamtgröße: ${(estimatedTotalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📦 Geschätzte Anzahl Teile: ${estimatedParts}`);
  
  // Teile Bilder in Chunks auf
  const imageArray = Array.from(images.entries());
  const imagesPerPart = Math.ceil(imageArray.length / estimatedParts);
  
  let currentPart = 1;
  let currentImages: Array<[string, Blob]> = [];
  let currentPartSize = dataSize; // Starte mit Daten-Größe
  
  for (let i = 0; i < imageArray.length; i++) {
    const [path, blob] = imageArray[i];
    const imageSize = blob.size;
    
    // Prüfe ob wir ein neues Part erstellen müssen
    if (currentPartSize + imageSize > BACKUP_SIZE_LIMITS.ZIP_MAX_SIZE && currentImages.length > 0) {
      // Erstelle aktuelles Part
      const partData = currentPart === 1 ? backupData : JSON.parse(backupDataJson); // Daten nur im ersten Part
      const partImages = new Map(currentImages);
      
      const partBlob = await createZipBackup(
        currentPart === 1 ? partData : { ...partData, entities: {} }, // Nur Daten im ersten Part
        partImages
      );
      
      parts.push(partBlob);
      
      if (onProgress) {
        onProgress(currentPart, estimatedParts, currentPart, estimatedParts);
      }
      
      // Starte neues Part
      currentPart++;
      currentImages = [];
      currentPartSize = 0; // Daten nur im ersten Part
    }
    
    currentImages.push([path, blob]);
    currentPartSize += imageSize;
  }
  
  // Erstelle letztes Part mit restlichen Bildern
  if (currentImages.length > 0) {
    const partData = currentPart === 1 ? backupData : {}; // Daten nur im ersten Part
    const partImages = new Map(currentImages);
    
    const partBlob = await createZipBackup(partData, partImages);
    parts.push(partBlob);
    
    if (onProgress) {
      onProgress(currentPart, estimatedParts, currentPart, estimatedParts);
    }
  }
  
  // Erstelle Manifest
  const dateStr = new Date().toISOString().split('T')[0];
  const dbNameForFile = dbName ? `${dbName}-` : ''; // Leer wenn kein dbName übergeben wurde
  const manifest: MultiPartManifest = {
    version: backupData.version || '2.0.0',
    timestamp: backupData.timestamp || new Date().toISOString(),
    format: 'multipart-zip',
    totalParts: parts.length,
    totalSize: parts.reduce((sum, part) => sum + part.size, 0),
    parts: parts.map((part, index) => ({
      partNumber: index + 1,
      filename: `chef-numbers-backup-${dbNameForFile}${dateStr}-part${index + 1}.zip`,
      size: part.size,
      // TODO: Hash-Berechnung optional hinzufügen
    })),
  };
  
  return { parts, manifest };
};

/**
 * Extrahiert Backup-Daten aus ZIP-Archiv
 */
export const extractZipBackup = async (zipBlob: Blob): Promise<{ backupData: any; images: Map<string, Blob> }> => {
  const zip = await JSZip.loadAsync(zipBlob);
  const images = new Map<string, Blob>();
  
  // Lade backup-data.json
  const backupDataFile = zip.file('backup-data.json');
  if (!backupDataFile) {
    throw new Error('backup-data.json nicht im ZIP-Archiv gefunden');
  }
  
  const backupDataJson = await backupDataFile.async('string');
  const backupData = JSON.parse(backupDataJson);
  
  // Lade Bilder
  const imageFolders = ['images/articles', 'images/recipes', 'images/receipts'];
  
  for (const folderPath of imageFolders) {
    const folder = zip.folder(folderPath);
    if (folder) {
      const entityType = folderPath.split('/')[1]; // 'articles', 'recipes' oder 'receipts'
      
      // Sammle alle Dateien im Ordner
      const filePromises: Promise<void>[] = [];
      
      folder.forEach((relativePath, file) => {
        if (!file.dir) {
          const entityId = relativePath.replace(/\.[^/.]+$/, ''); // Entferne Dateiendung
          const imagePath = `pictures/${entityType}/${entityId}`;
          
          // Erstelle Promise für jede Datei
          const filePromise = file.async('blob').then(blob => {
            images.set(imagePath, blob);
          });
          
          filePromises.push(filePromise);
        }
      });
      
      // Warte auf alle Dateien in diesem Ordner
      await Promise.all(filePromises);
    }
  }
  
  console.log(`✅ ${images.size} Bilder aus ZIP extrahiert`);
  
  return { backupData, images };
};

/**
 * Berechnet geschätzte Backup-Größe
 */
export const estimateBackupSize = (
  entities: Record<string, any[]>,
  imageSizes: Record<string, number>
): number => {
  // Größe der Entities (als JSON)
  const entitiesJson = JSON.stringify(entities);
  const entitiesSize = new Blob([entitiesJson]).size;
  
  // Größe der Bilder (bereits in Bytes)
  const totalImageSize = Object.values(imageSizes).reduce((sum, size) => sum + size, 0);
  
  // ZIP-Komprimierung: ~20-40% Reduktion
  const compressedImageSize = totalImageSize * 0.7; // 30% Reduktion geschätzt
  
  return entitiesSize + compressedImageSize;
};
