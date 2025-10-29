import { useEffect, useCallback, useState, useMemo } from 'react';
import { StorageMode, CloudStorageType, StorageLayer } from '../services/storageLayer';

export const useStorage = () => {
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [cloudType, setCloudType] = useState<CloudStorageType | undefined>(undefined);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Lade aktuelle Konfiguration aus StorageLayer
  useEffect(() => {
    const loadCurrentConfig = async () => {
      try {
        const storageLayer = StorageLayer.getInstance();
        const config = storageLayer.getCurrentConfig();
        
        if (config) {
          setStorageMode(config.mode);
          
          if (config.mode === 'cloud') {
            // Bestimme Cloud-Type basierend auf Daten-Speicher
            switch (config.data) {
              case 'PostgreSQL':
              case 'MariaDB':
              case 'MySQL':
                setCloudType('docker');
                break;
              case 'Supabase':
                setCloudType('supabase');
                break;
              case 'Firebase':
                setCloudType('firebase');
                break;
              default:
                setCloudType('docker');
            }
          } else {
            setCloudType(undefined);
          }
          
          console.log(`🔍 useStorage Hook - storageMode: ${config.mode}, cloudType: ${cloudType}, data: ${config.data}`);
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der Storage-Konfiguration:', error);
      }
    };
    
    loadCurrentConfig();
  }, [cloudType]);

  const storageInfo = useMemo(() => ({
    mode: storageMode,
    cloudType,
    lastSync,
    isOnline,
    initializationStatus: { isInitialized: true, isInitializing: false, lastCheck: new Date(), schemaStatus: {}, dataStatus: {}, errors: [] },
    // Add the required properties for StorageStatus component
    used: 0, // Placeholder - could be calculated from actual data
    available: 5 * 1024 * 1024, // 5MB placeholder
    percentage: 0 // Placeholder
  }), [storageMode, cloudType, lastSync, isOnline]);

  const loadAppData = useCallback(async () => {
    // Verwende StorageLayer für konsistente Datenoperationen
    try {
      console.log(`🔄 Lade Daten für Speichermodus: ${storageMode} (über StorageLayer)`);
      
      const storageLayer = StorageLayer.getInstance();
      
      // Lade alle App-Daten über StorageLayer (harmonisiert mit zentralem Schema)
      const articles = await storageLayer.load('articles');
      const suppliers = await storageLayer.load('suppliers');
      const recipes = await storageLayer.load('recipes');
      // Design immer aus LocalStorage laden (nicht über StorageLayer)
      const design = localStorage.getItem('chef_design');
      
      console.log('📁 Daten über StorageLayer geladen');
      return {
        articles: articles || [],
        suppliers: suppliers || [],
        recipes: recipes || [],
        design: design ? JSON.parse(design) : 'warm',
        einkaufsListe: [], // Backward compatibility - nicht mehr in DB
        inventurListe: [] // Backward compatibility - nicht mehr in DB
      };
    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten über StorageLayer:', error);
      return { articles: [], suppliers: [], recipes: [], design: 'warm', einkaufsListe: [], inventurListe: [] };
    }
  }, [storageMode]);

  const saveAppData = useCallback(async (data: any) => {
    // Verwende StorageLayer für konsistente Datenoperationen
    try {
      console.log('💾 Speichere Daten über StorageLayer:', Object.keys(data));
      
      const storageLayer = StorageLayer.getInstance();
      
      // Speichere alle Daten über StorageLayer
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          if (key === 'design') {
            // Design immer in LocalStorage speichern (nicht über StorageLayer)
            localStorage.setItem('chef_design', JSON.stringify(value));
            console.log('💾 Design in LocalStorage gespeichert');
          } else {
            // StorageLayer erwartet Arrays, also konvertiere einzelne Werte zu Arrays
            const arrayValue = Array.isArray(value) ? value : [value];
            await storageLayer.save(key as any, arrayValue);
          }
        }
      }
      
      console.log('✅ Daten erfolgreich über StorageLayer gespeichert');
      setLastSync(new Date());
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Daten über StorageLayer:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      return false;
    }
  }, [storageMode]);

  const switchStorageMode = useCallback(async (mode: StorageMode, cloudType?: CloudStorageType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      setStorageMode(mode);
      setCloudType(cloudType);
      setLastSync(new Date());
      
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

  const syncData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // StorageLayer wird automatisch initialisiert
      const storageLayer = StorageLayer.getInstance();
      await storageLayer.ensureInitialized();
      
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
  }, []);

  const lastSaved = useMemo(() => lastSync, [lastSync]);

  return {
    storageMode,
    cloudType,
    lastSync,
    switchStorageMode,
    syncData,
    isOnline,
    initializationStatus: { isInitialized: true, isInitializing: false, lastCheck: new Date(), schemaStatus: {}, dataStatus: {}, errors: [] },
    isLoading,
    error,
    // Backward compatibility properties
    loadAppData,
    saveAppData,
    lastSaved,
    storageInfo,
    // Legacy compatibility
    backendType: cloudType
  };
};