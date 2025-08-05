import { useState, useEffect } from 'react';
import { InventurItem } from '../types/inventur';
import { storageService } from '../services/storage';

export const useInventur = () => {
  const [inventurListe, setInventurListe] = useState<InventurItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('uebersicht');
  const [inventurAktiv, setInventurAktiv] = useState<boolean>(false);

  // Lade gespeicherte Daten beim Start
  useEffect(() => {
    const savedData = storageService.loadData('inventurListe');
    if (Array.isArray(savedData)) {
      setInventurListe(savedData);
    }
  }, []);

  // Speichere Daten bei Änderungen
  useEffect(() => {
    storageService.saveData('inventurListe', inventurListe);
  }, [inventurListe]);

  const startInventur = () => {
    setInventurAktiv(true);
    // Hier würde die Logik zum Laden der aktuellen Artikelbestände implementiert
  };

  const beendeInventur = () => {
    setInventurAktiv(false);
  };

  const addInventurItem = (item: Omit<InventurItem, 'id' | 'inventurDatum' | 'differenz'>) => {
    const differenz = item.istBestand - item.sollBestand;
    const newItem: InventurItem = {
      ...item,
      id: Date.now().toString(),
      inventurDatum: new Date(),
      differenz
    };
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