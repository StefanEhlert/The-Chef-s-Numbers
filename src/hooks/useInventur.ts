import { useState, useEffect } from 'react';
import { generateId, createEntity } from '../utils/storageUtils';
import { InventurItem } from '../types/inventur';
import { StorageLayer } from '../services/storageLayer';

export const useInventur = () => {
  const [inventurListe, setInventurListe] = useState<InventurItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('uebersicht');
  const [inventurAktiv, setInventurAktiv] = useState<boolean>(false);

  // Lade gespeicherte Daten beim Start
  useEffect(() => {
    const loadData = async () => {
      try {
        const storageLayer = StorageLayer.getInstance();
        const savedData = await storageLayer.load('inventurListe');
        if (Array.isArray(savedData)) {
          setInventurListe(savedData as InventurItem[]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Inventurliste:', error);
      }
    };
    loadData();
  }, []);

  // Speichere Daten bei Änderungen
  useEffect(() => {
    const saveData = async () => {
      try {
        const storageLayer = StorageLayer.getInstance();
        await storageLayer.save('inventurListe', inventurListe as any);
      } catch (error) {
        console.error('Fehler beim Speichern der Inventurliste:', error);
      }
    };
    saveData();
  }, [inventurListe]);

  const startInventur = () => {
    setInventurAktiv(true);
    // Hier würde die Logik zum Laden der aktuellen Artikelbestände implementiert
  };

  const beendeInventur = () => {
    setInventurAktiv(false);
  };

  const addInventurItem = (item: Omit<InventurItem, 'id' | 'inventurDatum' | 'differenz' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'lastModifiedBy'>) => {
    const differenz = item.istBestand - item.sollBestand;
    const newItem = createEntity<InventurItem>({
      ...item,
      inventurDatum: new Date(),
      differenz
    });
    setInventurListe(prev => [...prev, newItem]);
  };

  const updateInventurItem = (id: string, updates: Partial<InventurItem>) => {
    setInventurListe(prev => 
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          // Differenz neu berechnen wenn istBestand geändert wurde
          if (updates.istBestand !== undefined) {
            updatedItem.differenz = updatedItem.istBestand - updatedItem.sollBestand;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const deleteInventurItem = (id: string) => {
    setInventurListe(prev => prev.filter(item => item.id !== id));
  };

  const getInventurStatistik = () => {
    const totalSoll = inventurListe.reduce((sum, item) => sum + item.sollBestand, 0);
    const totalIst = inventurListe.reduce((sum, item) => sum + item.istBestand, 0);
    const totalDifferenz = inventurListe.reduce((sum, item) => sum + item.differenz, 0);
    const totalWert = inventurListe.reduce((sum, item) => sum + (item.istBestand * item.preis), 0);

    return {
      totalSoll,
      totalIst,
      totalDifferenz,
      totalWert,
      anzahlArtikel: inventurListe.length
    };
  };

  return {
    inventurListe,
    activeTab,
    setActiveTab,
    inventurAktiv,
    startInventur,
    beendeInventur,
    addInventurItem,
    updateInventurItem,
    deleteInventurItem,
    getInventurStatistik
  };
}; 