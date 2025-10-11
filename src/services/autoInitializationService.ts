import { dataMigrationService } from './dataMigrationService'
import { supabaseAdminService } from './supabaseAdminService'
import { validateSupabaseConfig, validateAdminConfig } from '../config/supabase'

// Status der automatischen Initialisierung
export interface InitializationStatus {
  isInitialized: boolean;
  isInitializing: boolean;
  lastCheck: Date | null;
  schemaStatus: { [key: string]: boolean };
  dataStatus: { [key: string]: boolean };
  errors: string[];
}

// Automatischer Initialisierungs-Service
export class AutoInitializationService {
  private static instance: AutoInitializationService;
  private status: InitializationStatus = {
    isInitialized: false,
    isInitializing: false,
    lastCheck: null,
    schemaStatus: {},
    dataStatus: {},
    errors: []
  };
  
  private initializationPromise: Promise<InitializationStatus> | null = null;

  private constructor() {}

  static getInstance(): AutoInitializationService {
    if (!AutoInitializationService.instance) {
      AutoInitializationService.instance = new AutoInitializationService();
    }
    return AutoInitializationService.instance;
  }

  // Prüft den aktuellen Status
  getStatus(): InitializationStatus {
    return { ...this.status };
  }

  // Startet die automatische Initialisierung
  async initialize(): Promise<InitializationStatus> {
    // Verhindere mehrfache gleichzeitige Initialisierungen
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Prüfe ob Supabase konfiguriert ist
    if (!validateSupabaseConfig()) {
      this.status.errors = ['Supabase ist nicht konfiguriert'];
      this.status.isInitialized = false;
      return this.status;
    }

    // Prüfe ob Admin-Rechte verfügbar sind
    if (!validateAdminConfig()) {
      this.status.errors = ['Service Role Key fehlt - Admin-Funktionen nicht verfügbar'];
      this.status.isInitialized = false;
      return this.status;
    }

    this.status.isInitializing = true;
    this.status.errors = [];

    try {
      // Führe Initialisierung durch
      this.initializationPromise = this.performInitialization();
      const result = await this.initializationPromise;
      
      this.status = { ...this.status, ...result };
      this.status.isInitializing = false;
      this.status.lastCheck = new Date();
      
      return this.status;
    } catch (error) {
      this.status.isInitializing = false;
      this.status.errors = [error instanceof Error ? error.message : 'Unbekannter Fehler'];
      this.status.isInitialized = false;
      
      return this.status;
    } finally {
      this.initializationPromise = null;
    }
  }

  // Führt die eigentliche Initialisierung durch
  private async performInitialization(): Promise<InitializationStatus> {
    try {
      console.log('Starte automatische Supabase-Initialisierung...');

      // 1. Schema-Status prüfen
      const schemaStatus = await supabaseAdminService.checkSchema();
      console.log('Schema-Status:', schemaStatus);

      // 2. Vollständige Initialisierung durchführen
      const initResult = await dataMigrationService.initializeSupabase();
      console.log('Initialisierungsergebnis:', initResult);

      // 3. Aktualisierten Schema-Status abrufen
      const updatedSchemaStatus = await supabaseAdminService.checkSchema();

      // 4. Daten-Status für jede Tabelle prüfen
      const dataStatus: { [key: string]: boolean } = {};
      for (const tableName of Object.keys(updatedSchemaStatus)) {
        dataStatus[tableName] = await dataMigrationService.hasSupabaseData(tableName);
      }

      return {
        isInitialized: initResult.success,
        isInitializing: false,
        lastCheck: new Date(),
        schemaStatus: updatedSchemaStatus,
        dataStatus,
        errors: initResult.errors
      };
    } catch (error) {
      console.error('Fehler bei der automatischen Initialisierung:', error);
      throw error;
    }
  }

  // Prüft ob eine erneute Initialisierung erforderlich ist
  async checkIfReinitializationNeeded(): Promise<boolean> {
    try {
      const currentSchemaStatus = await supabaseAdminService.checkSchema();
      const hasLocalData = dataMigrationService.hasLocalData();
      
      // Prüfe ob alle Tabellen existieren
      const allTablesExist = Object.values(currentSchemaStatus).every(exists => exists);
      
      // Prüfe ob lokale Daten vorhanden sind die migriert werden müssen
      const needsDataMigration = hasLocalData && Object.values(currentSchemaStatus).some(exists => !exists);
      
      return !allTablesExist || needsDataMigration;
    } catch (error) {
      console.warn('Fehler beim Prüfen der Reinitialisierung:', error);
      return true; // Im Zweifelsfall neu initialisieren
    }
  }

  // Führt eine erneute Initialisierung durch falls nötig
  async reinitializeIfNeeded(): Promise<InitializationStatus> {
    const needsReinit = await this.checkIfReinitializationNeeded();
    
    if (needsReinit) {
      console.log('Reinitialisierung erforderlich - starte automatisch...');
      return this.initialize();
    } else {
      console.log('Keine Reinitialisierung erforderlich');
      return this.status;
    }
  }

  // Prüft den Status ohne Initialisierung
  async checkStatus(): Promise<InitializationStatus> {
    try {
      if (!validateSupabaseConfig()) {
        this.status.errors = ['Supabase ist nicht konfiguriert'];
        this.status.isInitialized = false;
        return this.status;
      }

      const schemaStatus = await supabaseAdminService.checkSchema();
      const dataStatus: { [key: string]: boolean } = {};
      
      for (const tableName of Object.keys(schemaStatus)) {
        dataStatus[tableName] = await dataMigrationService.hasSupabaseData(tableName);
      }

      this.status = {
        ...this.status,
        schemaStatus,
        dataStatus,
        lastCheck: new Date(),
        errors: []
      };

      return this.status;
    } catch (error) {
      this.status.errors = [error instanceof Error ? error.message : 'Unbekannter Fehler'];
      return this.status;
    }
  }

  // Löscht lokale Daten nach erfolgreicher Migration
  clearLocalData(): void {
    dataMigrationService.clearLocalData();
    console.log('Lokale Daten nach erfolgreicher Migration gelöscht');
  }

  // Setzt den Status zurück
  resetStatus(): void {
    this.status = {
      isInitialized: false,
      isInitializing: false,
      lastCheck: null,
      schemaStatus: {},
      dataStatus: {},
      errors: []
    };
    this.initializationPromise = null;
  }
}

// Export der Singleton-Instanz
export const autoInitializationService = AutoInitializationService.getInstance();
