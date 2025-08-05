import { useState, useEffect } from 'react';
import { EinkaufsItem, EinkaufsStatus } from '../types/einkauf';
import { storageService } from '../services/storage';

export const useEinkauf = () => {
  const [einkaufsListe, setEinkaufsListe] = useState<EinkaufsItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('uebersicht');

  // Lade gespeicherte Daten beim Start
  useEffect(() => {
    const savedData = storageService.loadData('einkaufsListe');
    if (Array.isArray(savedData)) {
      setEinkaufsListe(savedData);
    }
  }, []);

  // Speichere Daten bei Änderungen
  useEffect(() => {
    storageService.saveData('einkaufsListe', einkaufsListe);
  }, [einkaufsListe]);

  const addEinkaufsItem = (item: Omit<EinkaufsItem, 'id' | 'bestelldatum'>) => {
    const newItem: EinkaufsItem = {
      ...item,
      id: Date.now().toString(),
      bestelldatum: new Date(),
      status: 'offen'
    };
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
    getEinkaufsItemsByStatus
  };
}; 