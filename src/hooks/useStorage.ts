import { useEffect, useCallback, useState } from 'react';
import { storageService, AppData } from '../services/storage';

export const useStorage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [storageInfo, setStorageInfo] = useState(storageService.getStorageInfo());

  // Lädt alle App-Daten beim Start
  const loadAppData = useCallback((): AppData => {
    setIsLoading(true);
    try {
      const data = storageService.loadAppData();
      setStorageInfo(storageService.getStorageInfo());
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Speichert alle App-Daten
  const saveAppData = useCallback((data: Partial<AppData>): boolean => {
    const success = storageService.saveAppData(data);
    if (success) {
      setLastSaved(new Date());
      setStorageInfo(storageService.getStorageInfo());
    }
    return success;
  }, []);

  // Speichert spezifische Daten
  const saveData = useCallback(<T extends keyof AppData>(key: T, data: AppData[T]): boolean => {
    return saveAppData({ [key]: data } as Partial<AppData>);
  }, [saveAppData]);

  // Lädt spezifische Daten
  const loadData = useCallback(<T extends keyof AppData>(key: T): AppData[T] => {
    return storageService.loadData(key);
  }, []);

  // Löscht alle Daten
  const clearAllData = useCallback((): boolean => {
    const success = storageService.clearAllData();
    if (success) {
      setLastSaved(null);
      setStorageInfo(storageService.getStorageInfo());
    }
    return success;
  }, []);

  // Exportiert Daten
  const exportData = useCallback((): string => {
    return storageService.exportData();
  }, []);

  // Importiert Daten
  const importData = useCallback((jsonData: string): boolean => {
    const success = storageService.importData(jsonData);
    if (success) {
      setLastSaved(new Date());
      setStorageInfo(storageService.getStorageInfo());
    }
    return success;
  }, []);

  // Prüft ob Daten vorhanden sind
  const hasData = useCallback((): boolean => {
    return storageService.hasData();
  }, []);

  // Aktualisiert Storage-Info
  const updateStorageInfo = useCallback(() => {
    setStorageInfo(storageService.getStorageInfo());
  }, []);

  return {
    // Daten-Operationen
    loadAppData,
    saveAppData,
    saveData,
    loadData,
    clearAllData,
    exportData,
    importData,
    hasData,
    
    // Status-Informationen
    isLoading,
    lastSaved,
    storageInfo,
    updateStorageInfo,
    
    // Utility-Funktionen
    isStorageAvailable: () => storageService.hasData(),
  };
}; 