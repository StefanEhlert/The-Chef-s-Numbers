import { useState, useEffect } from 'react';
import { generateId, createEntity } from '../utils/storageUtils';
import { EinkaufsItem, EinkaufsStatus } from '../types/einkauf';
import { StorageLayer } from '../services/storageLayer';

export const useEinkauf = () => {
  const [einkaufsListe, setEinkaufsListe] = useState<EinkaufsItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('uebersicht');

  // Lade gespeicherte Daten beim Start
  useEffect(() => {
    const loadData = async () => {
      try {
        const storageLayer = StorageLayer.getInstance();
        const savedData = await storageLayer.load('einkaufsListe');
        
        // Debug-Logging
        console.log('🔍 EinkaufsListe geladen:', {
          type: typeof savedData,
          isArray: Array.isArray(savedData),
          data: savedData
        });
        
        if (Array.isArray(savedData)) {
          setEinkaufsListe(savedData as EinkaufsItem[]);
        } else if (savedData && typeof savedData === 'object') {
          // Fallback: Wenn es ein Object ist, versuche es zu konvertieren
          console.warn('⚠️ EinkaufsListe ist kein Array, versuche Konvertierung...');
          const convertedData = Object.values(savedData).filter(item => 
            typeof item === 'object' && item !== null
          ) as EinkaufsItem[];
          if (Array.isArray(convertedData)) {
            setEinkaufsListe(convertedData);
          } else {
            setEinkaufsListe([]);
          }
        } else {
          setEinkaufsListe([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Einkaufsliste:', error);
        setEinkaufsListe([]);
      }
    };
    loadData();
  }, []);

  // Speichere Daten bei Änderungen
  useEffect(() => {
    const saveData = async () => {
      try {
        const storageLayer = StorageLayer.getInstance();
        
        // Debug-Logging
        console.log('💾 EinkaufsListe speichern:', {
          type: typeof einkaufsListe,
          isArray: Array.isArray(einkaufsListe),
          length: einkaufsListe.length
        });
        
        // Stelle sicher, dass es ein Array ist
        const dataToSave = Array.isArray(einkaufsListe) ? einkaufsListe : [];
        await storageLayer.save('einkaufsListe', dataToSave);
      } catch (error) {
        console.error('Fehler beim Speichern der Einkaufsliste:', error);
      }
    };
    saveData();
  }, [einkaufsListe]);

  const addEinkaufsItem = (item: Omit<EinkaufsItem, 'id' | 'bestelldatum' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'lastModifiedBy'>) => {
    const newItem = createEntity<EinkaufsItem>({
      ...item,
      bestelldatum: new Date(),
      status: 'offen'
    });
    setEinkaufsListe(prev => [...prev, newItem]);
  };

  const updateEinkaufsItem = (id: string, updates: Partial<EinkaufsItem>) => {
    setEinkaufsListe(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const deleteEinkaufsItem = (id: string) => {
    setEinkaufsListe(prev => prev.filter(item => item.id !== id));
  };

  // Datenbereinigung: Konvertiere Object zu Array falls nötig
  const cleanupEinkaufsData = async () => {
    try {
      const storageLayer = StorageLayer.getInstance();
      const savedData = await storageLayer.load('einkaufsListe');
      
      if (savedData && typeof savedData === 'object' && !Array.isArray(savedData)) {
        console.log('🧹 Bereinige EinkaufsListe-Daten...');
        const convertedData = Object.values(savedData).filter(item => 
          typeof item === 'object' && item !== null
        ) as EinkaufsItem[];
        await storageLayer.save('einkaufsListe', convertedData);
        console.log('✅ EinkaufsListe-Daten bereinigt');
      }
    } catch (error) {
      console.error('❌ Fehler bei Datenbereinigung:', error);
    }
  };

  const getEinkaufsItemsByStatus = (status: EinkaufsStatus) => {
    return einkaufsListe.filter(item => item.status === status);
  };

  return {
    einkaufsListe,
    activeTab,
    setActiveTab,
    addEinkaufsItem,
    updateEinkaufsItem,
    deleteEinkaufsItem,
    getEinkaufsItemsByStatus,
    cleanupEinkaufsData
  };
}; 