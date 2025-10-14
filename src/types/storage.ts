// Storage-Konfiguration Types

// Storage-Modi
export type StorageMode = 'local' | 'cloud';

// Datenbank-Services
export type StorageData = 
  | 'PostgreSQL' 
  | 'MariaDB' 
  | 'MySQL' 
  | 'CouchDB'
  | 'Supabase' 
  | 'Firebase' 
  | 'SQLite';

// Bild-Speicher-Services
export type StoragePicture = 
  | 'LocalPath' 
  | 'MinIO' 
  | 'Supabase' 
  | 'Firebase';

// Vollständige Storage-Konfiguration
export interface StorageConfig {
  mode: StorageMode;
  data: StorageData;
  picture: StoragePicture;
}

// Legacy-Support für bestehende Konfiguration
export type LegacyStorageMode = 'local' | 'cloud';
export type LegacyCloudType = 'docker' | 'supabase' | 'firebase';

// Konvertierungsfunktionen
export const convertLegacyToNew = (legacyMode: LegacyStorageMode, legacyCloudType?: LegacyCloudType): StorageConfig => {
  if (legacyMode === 'local') {
    return {
      mode: 'local',
      data: 'SQLite',
      picture: 'LocalPath'
    };
  }
  
  // Cloud-Modus
  switch (legacyCloudType) {
    case 'supabase':
      return {
        mode: 'cloud',
        data: 'Supabase',
        picture: 'Supabase'
      };
    case 'firebase':
      return {
        mode: 'cloud',
        data: 'Firebase',
        picture: 'Firebase'
      };
    case 'docker':
    default:
      return {
        mode: 'cloud',
        data: 'PostgreSQL',
        picture: 'MinIO'
      };
  }
};

export const convertNewToLegacy = (config: StorageConfig): { mode: LegacyStorageMode; cloudType: LegacyCloudType } => {
  if (config.mode === 'local') {
    return {
      mode: 'local',
      cloudType: 'docker' // Default für Legacy
    };
  }
  
  // Cloud-Modus basierend auf Datenbank-Service
  switch (config.data) {
    case 'Supabase':
      return {
        mode: 'cloud',
        cloudType: 'supabase'
      };
    case 'Firebase':
      return {
        mode: 'cloud',
        cloudType: 'firebase'
      };
    case 'PostgreSQL':
    case 'MariaDB':
    case 'MySQL':
    case 'CouchDB':
    case 'SQLite':
    default:
      return {
        mode: 'cloud',
        cloudType: 'docker'
      };
  }
};

// Validierungsfunktionen
export const isValidStorageConfig = (config: Partial<StorageConfig>): config is StorageConfig => {
  return (
    config.mode !== undefined &&
    config.data !== undefined &&
    config.picture !== undefined &&
    ['local', 'cloud'].includes(config.mode) &&
    ['PostgreSQL', 'MariaDB', 'MySQL', 'CouchDB', 'Supabase', 'Firebase', 'SQLite'].includes(config.data) &&
    ['LocalPath', 'MinIO', 'Supabase', 'Firebase'].includes(config.picture)
  );
};

// Default-Konfigurationen
export const DEFAULT_STORAGE_CONFIGS: Record<StorageMode, StorageConfig> = {
  local: {
    mode: 'local',
    data: 'SQLite',
    picture: 'LocalPath'
  },
  cloud: {
    mode: 'cloud',
    data: 'PostgreSQL',
    picture: 'MinIO'
  }
};

// Service-Kompatibilität
export const getCompatibleServices = (mode: StorageMode): { data: StorageData[]; picture: StoragePicture[] } => {
  switch (mode) {
    case 'local':
      return {
        data: ['SQLite'],
        picture: ['LocalPath']
      };
    case 'cloud':
      return {
        data: ['PostgreSQL', 'MariaDB', 'MySQL', 'CouchDB', 'Supabase', 'Firebase'],
        picture: ['MinIO', 'Supabase', 'Firebase']
      };
    default:
      return {
        data: [],
        picture: []
      };
  }
};
