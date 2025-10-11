/**
 * storageSchema.ts
 * Zentrale Interface-Definition für StorageSchema
 * Verwendet von allen Komponenten für einheitliche Typen
 */

import { DatabaseConfig, MinIOConfig } from '../components/ConnectionTester';

export interface StorageSchema {
  selectedStorageMode: 'local' | 'cloud' | 'hybrid';
  selectedCloudType: 'docker' | 'supabase' | 'firebase' | 'none';
  selectedDataStorage: 'PostgreSQL' | 'MariaDB' | 'MySQL' | 'Supabase' | 'Firebase' | undefined;
  selectedPictureStorage: 'MinIO' | 'Supabase' | 'Firebase' | 'LocalPath' | undefined;
  connections: {
    postgres: DatabaseConfig;
    postgrest: { port: string };
    mariadb: DatabaseConfig;
    mysql: DatabaseConfig;
    minio: MinIOConfig & { consolePort: string };
    supabase: { url: string; anonKey: string; serviceRoleKey: string };
    firebase: { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string };
  };
}
