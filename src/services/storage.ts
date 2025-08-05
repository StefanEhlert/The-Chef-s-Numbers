// Storage-Service für LocalStorage mit TypeScript-Typisierung

export interface AppData {
  articles: any[];
  recipes: any[];
  suppliers: any[];
  design: string;
  einkaufsListe: any[];
  inventurListe: any[];
  // Weitere Daten können hier hinzugefügt werden
}

class StorageService {
  private readonly STORAGE_KEY = 'chef_numbers_app_data';
  private readonly VERSION_KEY = 'chef_numbers_app_version';
  private readonly CURRENT_VERSION = '1.0.0';

  // Prüft ob LocalStorage verfügbar ist
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Lädt alle App-Daten
  loadAppData(): AppData {
    if (!this.isStorageAvailable()) {
      console.warn('LocalStorage ist nicht verfügbar. Verwende Standarddaten.');
      return this.getDefaultData();
    }

    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      const storedVersion = localStorage.getItem(this.VERSION_KEY);

      if (!storedData) {
        console.log('Keine gespeicherten Daten gefunden. Verwende Standarddaten.');
        return this.getDefaultData();
      }

      const parsedData = JSON.parse(storedData);

      // Version-Check für zukünftige Migrationen
      if (storedVersion !== this.CURRENT_VERSION) {
        console.log(`App-Version geändert: ${storedVersion} -> ${this.CURRENT_VERSION}`);
        // Hier könnten Migrationen implementiert werden
        this.saveVersion();
      }

      // Validiere und ergänze fehlende Felder
      const validatedData = this.validateAndMergeData(parsedData);
      
      console.log('App-Daten erfolgreich geladen:', validatedData);
      return validatedData;
    } catch (error) {
      console.error('Fehler beim Laden der App-Daten:', error);
      return this.getDefaultData();
    }
  }

  // Speichert alle App-Daten
  saveAppData(data: Partial<AppData>): boolean {
    if (!this.isStorageAvailable()) {
      console.error('LocalStorage ist nicht verfügbar. Daten können nicht gespeichert werden.');
      return false;
    }

    try {
      // Lade aktuelle Daten und merge sie mit den neuen Daten
      const currentData = this.loadAppData();
      const mergedData = { ...currentData, ...data };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedData));
      this.saveVersion();
      
      console.log('App-Daten erfolgreich gespeichert:', mergedData);
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern der App-Daten:', error);
      return false;
    }
  }

  // Speichert spezifische Daten
  saveData<T extends keyof AppData>(key: T, data: AppData[T]): boolean {
    return this.saveAppData({ [key]: data } as Partial<AppData>);
  }

  // Lädt spezifische Daten
  loadData<T extends keyof AppData>(key: T): AppData[T] {
    const appData = this.loadAppData();
    return appData[key];
  }

  // Löscht alle gespeicherten Daten
  clearAllData(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.VERSION_KEY);
      console.log('Alle App-Daten wurden gelöscht.');
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der App-Daten:', error);
      return false;
    }
  }

  // Exportiert alle Daten als JSON
  exportData(): string {
    const data = this.loadAppData();
    return JSON.stringify(data, null, 2);
  }

  // Importiert Daten aus JSON
  importData(jsonData: string): boolean {
    try {
      const parsedData = JSON.parse(jsonData);
      const validatedData = this.validateAndMergeData(parsedData);
      return this.saveAppData(validatedData);
    } catch (error) {
      console.error('Fehler beim Importieren der Daten:', error);
      return false;
    }
  }

  // Validiert und ergänzt fehlende Datenfelder
  private validateAndMergeData(data: any): AppData {
    const defaultData = this.getDefaultData();
    
    // Migriere Artikel mit altem supplier-Format zu supplierId
    let articles = Array.isArray(data.articles) ? data.articles : defaultData.articles;
    const suppliers = Array.isArray(data.suppliers) ? data.suppliers : defaultData.suppliers;
    
    articles = articles.map((article: any) => {
      // Wenn der Artikel ein supplier-Feld hat, aber kein supplierId
      if (article.supplier && !article.supplierId) {
        // Wenn supplier ein Objekt ist (alter Format)
        if (typeof article.supplier === 'object' && article.supplier.name) {
          // Suche nach dem Lieferanten anhand des Namens
          const supplier = suppliers.find((s: any) => s.name === article.supplier.name);
          if (supplier) {
            article.supplierId = supplier.id;
          }
        }
        // Wenn supplier ein String ist (direkter Name)
        else if (typeof article.supplier === 'string') {
          const supplier = suppliers.find((s: any) => s.name === article.supplier);
          if (supplier) {
            article.supplierId = supplier.id;
          }
        }
        // Entferne das alte supplier-Feld
        delete article.supplier;
      }
      return article;
    });
    
    return {
      articles,
      recipes: Array.isArray(data.recipes) ? data.recipes : defaultData.recipes,
      suppliers,
      design: typeof data.design === 'string' ? data.design : defaultData.design,
      einkaufsListe: Array.isArray(data.einkaufsListe) ? data.einkaufsListe : defaultData.einkaufsListe,
      inventurListe: Array.isArray(data.inventurListe) ? data.inventurListe : defaultData.inventurListe,
    };
  }

  // Standarddaten für neue Installationen
  private getDefaultData(): AppData {
    return {
      articles: [],
      recipes: [],
      suppliers: [],
      design: 'warm',
      einkaufsListe: [],
      inventurListe: [],
    };
  }

  // Speichert die aktuelle App-Version
  private saveVersion(): void {
    if (this.isStorageAvailable()) {
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    }
  }

  // Prüft ob Daten vorhanden sind
  hasData(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  // Gibt Speicherplatz-Info zurück
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isStorageAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      const used = JSON.stringify(this.loadAppData()).length;
      const available = 5 * 1024 * 1024; // 5MB (typisches LocalStorage-Limit)
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

// Singleton-Instanz
export const storageService = new StorageService(); 