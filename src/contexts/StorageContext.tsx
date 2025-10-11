import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { StorageMode, CloudStorageType, StorageLayer } from '../services/storageLayer';
import { autoInitializationService, InitializationStatus } from '../services/autoInitializationService';

interface StorageContextType {
  storageMode: StorageMode;
  cloudType?: CloudStorageType;
  switchStorageMode: (mode: StorageMode, cloudType?: CloudStorageType) => Promise<void>;
  validateAndActivateCloud: (mode: StorageMode, cloudType: CloudStorageType) => Promise<void>;
  syncData: () => Promise<void>;
  isOnline: boolean;
  lastSync: Date | null;
  isLoading: boolean;
  error: string | null;
  initializationStatus: InitializationStatus;
}

interface StorageContextProviderProps {
  children: ReactNode;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

// Export the context for direct use
export { StorageContext };

export const StorageContextProvider: React.FC<StorageContextProviderProps> = ({ children }) => {
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [cloudType, setCloudType] = useState<CloudStorageType | undefined>(undefined);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initializationStatus, setInitializationStatus] = useState<InitializationStatus>({
    isInitialized: false,
    isInitializing: false,
    lastCheck: null,
    schemaStatus: {},
    dataStatus: {},
    errors: []
  });

  // Initialize Supabase function
  const initializeSupabase = async () => {
    try {
      console.log('🚀 Starte Supabase-Initialisierung...');
      const status = await autoInitializationService.initialize();
      setInitializationStatus(status);
      console.log('✅ Supabase-Initialisierung abgeschlossen:', status);
      return status;
    } catch (error) {
      console.error('❌ Fehler bei Supabase-Initialisierung:', error);
      const errorStatus = {
        isInitialized: false,
        isInitializing: false,
        lastCheck: new Date(),
        schemaStatus: {},
        dataStatus: {},
        errors: [error instanceof Error ? error.message : 'Unbekannter Fehler']
      };
      setInitializationStatus(errorStatus);
      throw error;
    }
  };

  const initializeStorage = useCallback(async () => {
    try {
      // Lade Storage-Modus aus localStorage
      const savedMode = localStorage.getItem('chef_storage_mode') as StorageMode;
      const savedCloudType = localStorage.getItem('chef_cloud_type') as CloudStorageType;
      
      const mode = savedMode || 'local';
      const type = savedMode === 'cloud' ? (savedCloudType || 'supabase') : undefined;
      
      console.log('🔄 Storage-Modus beim Start geladen:', mode, 'Cloud-Type:', type);
      
      setStorageMode(mode);
      setCloudType(type);
      
      // Initialize Supabase only if cloud mode with Supabase
      if (mode === 'cloud' && type === 'supabase') {
        try {
          await initializeSupabase();
          console.log('✅ Supabase erfolgreich initialisiert');
        } catch (error) {
          console.error('❌ Fehler bei Supabase-Initialisierung:', error);
        }
      }
    } catch (error) {
      console.error('❌ Fehler bei Storage-Initialisierung:', error);
    }
  }, []);

  // Initialize storage mode from localStorage
  useEffect(() => {
    // Kurze Verzögerung um sicherzustellen, dass alles vollständig initialisiert ist
    setTimeout(initializeStorage, 100);
  }, [initializeStorage]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (storageMode === 'cloud') {
        handleSyncData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [storageMode]);

  const switchStorageMode = useCallback(async (mode: StorageMode, cloudType?: CloudStorageType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Nur den lokalen State aktualisieren, keine automatische Validierung
      setStorageMode(mode);
      if (cloudType) {
        setCloudType(cloudType);
      }
      
      // Speichere den neuen Modus in localStorage
      localStorage.setItem('chef_storage_mode', mode);
      if (cloudType) {
        localStorage.setItem('chef_cloud_type', cloudType);
      }
      
      console.log(`Storage mode switched to: ${mode}${cloudType ? ` (${cloudType})` : ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(errorMessage);
      console.error('❌ Fehler beim Wechseln des Storage-Modus:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Neue Funktion: Validiere und aktiviere Cloud-Konfiguration
  const validateAndActivateCloud = useCallback(async (mode: StorageMode, cloudType: CloudStorageType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verwende StorageLayer für die Validierung
      const storageLayer = StorageLayer.getInstance();
      await storageLayer.switchMode(mode, cloudType);
      
      setStorageMode(mode);
      setCloudType(cloudType);
      setLastSync(new Date());
      
      // Initialize Supabase only if switching to cloud mode with Supabase
      if (mode === 'cloud' && cloudType === 'supabase') {
        try {
          await initializeSupabase();
          console.log('✅ Supabase erfolgreich initialisiert');
        } catch (error) {
          console.error('❌ Fehler bei Supabase-Initialisierung:', error);
        }
      }
      
      console.log(`Cloud erfolgreich validiert und aktiviert: ${mode} (${cloudType})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(errorMessage);
      console.error('❌ Fehler bei der Cloud-Validierung:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync data
  const syncData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verwende StorageLayer für Sync-Operationen
      const storageLayer = StorageLayer.getInstance();
      // TODO: Implementiere Sync-Funktionalität in StorageLayer
      
      setLastSync(new Date());
      
      console.log('Data sync completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync fehlgeschlagen';
      setError(errorMessage);
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync when online and in cloud mode
  const handleSyncData = async (): Promise<void> => {
    if (isOnline && storageMode === 'cloud') {
      try {
        await syncData();
      } catch (error) {
        console.warn('Auto-sync failed:', error);
      }
    }
  };

  const contextValue: StorageContextType = {
    storageMode,
    cloudType,
    lastSync,
    switchStorageMode,
    validateAndActivateCloud,
    syncData,
    isOnline,
    initializationStatus,
    isLoading,
    error
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

// Custom hook to use storage context
export const useStorageContext = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorageContext must be used within a StorageContextProvider');
  }
  return context;
};

// Extended hook with additional functionality
export const useStorageExtended = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorageExtended must be used within a StorageContextProvider');
  }
  
  // Hole den Initialisierungs-Status aus dem Context
  const { initializationStatus } = context;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const switchStorageModeWithLoading = async (mode: StorageMode): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await context.switchStorageMode(mode);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncDataWithLoading = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await context.syncData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync fehlgeschlagen';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...context,
    isLoading,
    error,
    initializationStatus,
    switchStorageMode: switchStorageModeWithLoading,
    syncData: syncDataWithLoading,
    getStorageStatus: () => ({
      mode: context.storageMode,
      isOnline: context.isOnline,
      lastSync: context.lastSync,
      syncQueueLength: 0, // TODO: Implementiere Sync-Queue in StorageLayer
      isLoading,
      error
    })
  };
};