import { supabaseAdminService } from './supabaseAdminService'
import { SupabaseService } from './supabaseService'

// Lokale Storage-Schlüssel
const STORAGE_KEYS = {
  articles: 'chef_articles',
  suppliers: 'chef_suppliers',
  recipes: 'chef_recipes',
  einkauf: 'chef_einkauf',
  inventur: 'chef_inventur'
};

// Daten-Migration-Service
export const dataMigrationService = {
  // Prüft ob lokale Daten vorhanden sind
  hasLocalData(): boolean {
    return Object.values(STORAGE_KEYS).some(key => {
      const data = localStorage.getItem(key);
      if (!data) return false;
      
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    });
  },

  // Lädt lokale Daten
  getLocalData(): { [key: string]: any[] } {
    const localData: { [key: string]: any[] } = {};
    
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        const data = localStorage.getItem(storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            localData[key] = parsed;
          }
        }
      } catch (error) {
        console.warn(`Fehler beim Laden der lokalen Daten für ${key}:`, error);
        localData[key] = [];
      }
    }
    
    return localData;
  },

  // Migriert alle lokalen Daten zu Supabase
  async migrateAllData(): Promise<{
    success: boolean;
    migrated: { [key: string]: number };
    errors: string[];
  }> {
    try {
      console.log('Starte Daten-Migration von LocalStorage zu Supabase...');
      
      // Zuerst Schema erstellen
      const schemaResult = await supabaseAdminService.migrateSchema();
      if (!schemaResult.success) {
        throw new Error('Schema-Migration fehlgeschlagen');
      }
      
      const localData = this.getLocalData();
      const migrated: { [key: string]: number } = {};
      const errors: string[] = [];
      
      // Daten für jede Tabelle migrieren
      for (const [tableName, data] of Object.entries(localData)) {
        if (data.length > 0) {
          try {
            const count = await this.migrateTableData(tableName, data);
            migrated[tableName] = count;
            console.log(`${count} Datensätze für ${tableName} migriert`);
          } catch (error) {
            const errorMsg = `Fehler bei Migration von ${tableName}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      }
      
      const success = errors.length === 0;
      console.log(`Daten-Migration abgeschlossen. Erfolgreich: ${success}`);
      
      return { success, migrated, errors };
    } catch (error) {
      console.error('Daten-Migration fehlgeschlagen:', error);
      return {
        success: false,
        migrated: {},
        errors: [error instanceof Error ? error.message : 'Unbekannter Fehler']
      };
    }
  },

  // Migriert Daten für eine spezifische Tabelle
  async migrateTableData(tableName: string, data: any[]): Promise<number> {
    if (!SupabaseService.getClient()) {
      throw new Error('Supabase ist nicht konfiguriert');
    }
    
    if (data.length === 0) return 0;
    
    try {
      // Daten für Supabase vorbereiten
      const preparedData = data.map(item => this.prepareDataForMigration(tableName, item));
      
      // Daten in Supabase einfügen
      const { error } = await SupabaseService.getClient()!
        .from(tableName)
        .insert(preparedData);
      
      if (error) {
        throw error;
      }
      
      return data.length;
    } catch (error) {
      console.error(`Fehler bei Migration von ${tableName}:`, error);
      throw error;
    }
  },

  // Bereitet Daten für die Migration vor (entfernt lokale IDs, fügt Zeitstempel hinzu)
  prepareDataForMigration(tableName: string, item: any): any {
    const prepared = { ...item };
    
    // Lokale ID entfernen (wird von Supabase neu generiert)
    if (prepared.id && typeof prepared.id === 'string' && prepared.id.startsWith('local_')) {
      delete prepared.id;
    }
    
    // Zeitstempel aktualisieren falls nicht vorhanden
    if (!prepared.created_at) {
      prepared.created_at = new Date().toISOString();
    }
    if (!prepared.updated_at) {
      prepared.updated_at = new Date().toISOString();
    }
    
    // Spezielle Behandlung für bestimmte Tabellen
    switch (tableName) {
      case 'articles':
        // Stellen sicher dass erforderliche Felder vorhanden sind
        if (!prepared.bundle_price) prepared.bundle_price = 0;
        if (!prepared.bundle_unit) prepared.bundle_unit = 'Stück';
        if (!prepared.content) prepared.content = 1;
        if (!prepared.content_unit) prepared.content_unit = 'Stück';
        if (!prepared.is_gross_price === undefined) prepared.is_gross_price = true;
        if (!prepared.vat_rate) prepared.vat_rate = 19.00;
        if (!prepared.additives) prepared.additives = [];
        if (!prepared.allergens) prepared.allergens = [];
        if (!prepared.nutrition) {
          prepared.nutrition = {
            calories: 0,
            kilojoules: 0,
            protein: 0,
            fat: 0,
            carbohydrates: 0
          };
        }
        break;
        
      case 'suppliers':
        if (!prepared.phone_numbers) prepared.phone_numbers = [];
        if (!prepared.address_country) prepared.address_country = 'Deutschland';
        break;
        
      case 'recipes':
        if (!prepared.ingredients) prepared.ingredients = [];
        if (!prepared.instructions) prepared.instructions = [];
        if (!prepared.portions) prepared.portions = 1;
        if (!prepared.preparation_time) prepared.preparation_time = 0;
        if (!prepared.difficulty) prepared.difficulty = 'mittel';
        if (!prepared.nutrition) {
          prepared.nutrition = {
            calories: 0,
            kilojoules: 0,
            protein: 0,
            fat: 0,
            carbohydrates: 0
          };
        }
        break;
        
      case 'einkauf':
        if (!prepared.order_date) prepared.order_date = new Date().toISOString().split('T')[0];
        if (!prepared.status) prepared.status = 'bestellt';
        break;
        
      case 'inventur':
        if (!prepared.current_stock) prepared.current_stock = 0;
        if (!prepared.min_stock) prepared.min_stock = 0;
        if (!prepared.last_count_date) prepared.last_count_date = new Date().toISOString().split('T')[0];
        break;
    }
    
    return prepared;
  },

  // Prüft ob Daten bereits in Supabase vorhanden sind
  async hasSupabaseData(tableName: string): Promise<boolean> {
    if (!SupabaseService.getClient()) return false;
    
    try {
      const { data, error } = await SupabaseService.getClient()!
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (error) return false;
      return data && data.length > 0;
    } catch {
      return false;
    }
  },

  // Führt eine vollständige Initialisierung durch (Schema + Daten)
  async initializeSupabase(): Promise<{
    success: boolean;
    schemaCreated: string[];
    dataMigrated: { [key: string]: number };
    errors: string[];
  }> {
    try {
      console.log('Starte vollständige Supabase-Initialisierung...');
      
      // 1. Schema erstellen
      const schemaResult = await supabaseAdminService.migrateSchema();
      
      // 2. Daten migrieren falls vorhanden
      let dataResult: { success: boolean; migrated: { [key: string]: number }; errors: string[] };
      if (this.hasLocalData()) {
        dataResult = await this.migrateAllData();
      } else {
        dataResult = { success: true, migrated: {}, errors: [] };
      }
      
      const success = schemaResult.success && dataResult.success;
      const errors = [...schemaResult.errors, ...dataResult.errors];
      
      console.log('Supabase-Initialisierung abgeschlossen');
      
      return {
        success,
        schemaCreated: schemaResult.createdTables,
        dataMigrated: dataResult.migrated,
        errors
      };
    } catch (error) {
      console.error('Supabase-Initialisierung fehlgeschlagen:', error);
      return {
        success: false,
        schemaCreated: [],
        dataMigrated: {},
        errors: [error instanceof Error ? error.message : 'Unbekannter Fehler']
      };
    }
  },

  // Löscht lokale Daten nach erfolgreicher Migration
  clearLocalData(): void {
    for (const storageKey of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(storageKey);
    }
    console.log('Lokale Daten gelöscht');
  }
};
