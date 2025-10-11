import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface SupabaseConnectionResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export interface SupabaseSchemaInfo {
  hasStructure: boolean;
  tables: string[];
  columns: { [tableName: string]: string[] };
  indexes: { [tableName: string]: string[] };
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;
  private static config: SupabaseConfig | null = null;

  static initialize(config: SupabaseConfig): SupabaseClient {
    logger.info('SUPABASE', '🔧 Initialisiere Supabase-Client: Cloud');
    
    this.config = config;
    this.client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    });

    logger.info('SUPABASE', `✅ Supabase-Client initialisiert: ${config.url}`);
    return this.client;
  }

  static async testConnection(config: SupabaseConfig): Promise<SupabaseConnectionResult> {
    const startTime = Date.now();
    
    try {
      logger.info('SUPABASE', `🔍 Teste Supabase-Verbindung: ${config.url}`);
      
      if (!config.url || !config.anonKey) {
        return {
          success: false,
          message: 'Ungültige Konfiguration: URL und Anon-Key müssen angegeben werden',
          duration: Date.now() - startTime
        };
      }

      const testClient = createClient(config.url, config.anonKey, {
        auth: { persistSession: false },
        db: { schema: 'public' }
      });

      const { data, error } = await testClient
        .from('system_info')
        .select('key')
        .limit(1);

      const duration = Date.now() - startTime;

      if (error && error.code !== 'PGRST116') {
        logger.warn('SUPABASE', `⚠️ Supabase-Verbindungstest fehlgeschlagen: ${error.message}`);
        return {
          success: false,
          message: `Verbindungsfehler: ${error.message}`,
          duration
        };
      }

      logger.info('SUPABASE', `✅ Supabase-Verbindung erfolgreich (${duration}ms)`);
      return {
        success: true,
        message: `Supabase-Verbindung erfolgreich zu ${config.url}`,
        details: {
          url: config.url,
          method: 'HTTP-API'
        },
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('SUPABASE', `❌ Supabase-Verbindungstest fehlgeschlagen:`, error as Error);
      return {
        success: false,
        message: `Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        duration
      };
    }
  }

  /**
   * Lädt Daten aus Supabase
   */
  static async loadData(tableName: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Supabase-Client nicht initialisiert');
    }

    const { data, error } = await this.client
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('SUPABASE', `❌ Fehler beim Laden von ${tableName}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Speichert Daten in Supabase
   */
  static async saveData(tableName: string, data: any[]): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase-Client nicht initialisiert');
    }

    // Lösche alle bestehenden Daten
    const { error: deleteError } = await this.client
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Lösche alle

    if (deleteError) {
      logger.warn('SUPABASE', `⚠️ Fehler beim Löschen von ${tableName}:`, deleteError);
    }

    // Füge neue Daten hinzu
    if (data.length > 0) {
      const { error: insertError } = await this.client
        .from(tableName)
        .insert(data);

      if (insertError) {
        logger.error('SUPABASE', `❌ Fehler beim Speichern von ${tableName}:`, insertError);
        throw insertError;
      }
    }

    logger.info('SUPABASE', `✅ ${data.length} Datensätze in ${tableName} gespeichert`);
  }

  /**
   * Prüft Supabase-Datenbankstruktur
   */
  static async checkStructure(config: SupabaseConfig): Promise<SupabaseSchemaInfo> {
    try {
      logger.info('SUPABASE', `🔍 Prüfe Supabase-Datenbankstruktur`);
      
      const client = createClient(config.url, config.anonKey, {
        auth: { persistSession: false },
        db: { schema: 'public' }
      });

      // Prüfe Chef's Numbers Tabellen
      const { data: tablesData, error: tablesError } = await client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['articles', 'suppliers', 'recipes', 'design', 'einkaufs_liste', 'inventur_liste']);

      if (tablesError) {
        logger.warn('SUPABASE', `⚠️ Strukturprüfung fehlgeschlagen: ${tablesError.message}`);
        return {
          hasStructure: false,
          tables: [],
          columns: {},
          indexes: {}
        };
      }

      const tables = tablesData?.map(row => row.table_name) || [];
      const hasStructure = tables.length > 0;

      let columns: { [tableName: string]: string[] } = {};
      let indexes: { [tableName: string]: string[] } = {};

      if (hasStructure) {
        // Hole Spalten-Informationen für jede Tabelle
        for (const table of tables) {
          const { data: columnsData } = await client
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_schema', 'public')
            .eq('table_name', table);

          columns[table] = columnsData?.map(row => `${row.column_name} (${row.data_type})`) || [];
        }
      }

      logger.info('SUPABASE', `✅ Strukturprüfung erfolgreich: ${hasStructure ? 'Struktur vorhanden' : 'Struktur fehlt'}`);
      return {
        hasStructure,
        tables,
        columns,
        indexes
      };
      
    } catch (error) {
      logger.error('SUPABASE', `❌ Strukturprüfung fehlgeschlagen:`, error as Error);
      return {
        hasStructure: false,
        tables: [],
        columns: {},
        indexes: {}
      };
    }
  }

  /**
   * Erstellt Supabase-Datenbankstruktur
   */
  static async createStructure(config: SupabaseConfig): Promise<{ success: boolean; message: string; tablesCreated: string[] }> {
    try {
      logger.info('SUPABASE', `🔍 Erstelle Supabase-Datenbankstruktur`);
      
      const client = createClient(config.url, config.serviceRoleKey || config.anonKey, {
        auth: { persistSession: false },
        db: { schema: 'public' }
      });

      // Erstelle Chef's Numbers Tabellen über SQL
      const createTablesSQL = `
        -- Articles Table
        CREATE TABLE IF NOT EXISTS articles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          supplier_id UUID,
          supplier_article_number VARCHAR(100),
          bundle_unit VARCHAR(50),
          bundle_price DECIMAL(10,2),
          bundle_ean_code VARCHAR(20),
          content DECIMAL(10,3),
          content_unit VARCHAR(50),
          content_ean_code VARCHAR(20),
          price_per_unit DECIMAL(10,4),
          allergens TEXT[],
          additives TEXT[],
          ingredients TEXT,
          nutrition_info JSONB,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100),
          updated_by VARCHAR(100),
          last_modified_by VARCHAR(100)
        );

        -- Suppliers Table
        CREATE TABLE IF NOT EXISTS suppliers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255),
          email VARCHAR(255),
          website VARCHAR(255),
          address JSONB,
          phone_numbers JSONB,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100),
          updated_by VARCHAR(100),
          last_modified_by VARCHAR(100)
        );

        -- Recipes Table
        CREATE TABLE IF NOT EXISTS recipes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          portions INTEGER,
          preparation_time INTEGER,
          difficulty INTEGER,
          ingredients JSONB,
          used_recipes JSONB,
          preparation_steps JSONB,
          material_costs DECIMAL(10,2),
          markup_percentage DECIMAL(5,2),
          vat_rate DECIMAL(5,2),
          selling_price DECIMAL(10,2),
          total_nutrition_info JSONB,
          allergens TEXT[],
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100),
          updated_by VARCHAR(100),
          last_modified_by VARCHAR(100)
        );

        -- Design Table
        CREATE TABLE IF NOT EXISTS design (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_name VARCHAR(100),
          colors JSONB,
          settings JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100),
          updated_by VARCHAR(100),
          last_modified_by VARCHAR(100)
        );

        -- Einkaufsliste Table
        CREATE TABLE IF NOT EXISTS einkaufs_liste (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          artikel_name VARCHAR(255) NOT NULL,
          menge DECIMAL(10,3),
          einheit VARCHAR(50),
          lieferant VARCHAR(255),
          preis DECIMAL(10,2),
          bestelldatum TIMESTAMP,
          lieferdatum TIMESTAMP,
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100),
          updated_by VARCHAR(100),
          last_modified_by VARCHAR(100)
        );

        -- Inventurliste Table
        CREATE TABLE IF NOT EXISTS inventur_liste (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          artikel_name VARCHAR(255) NOT NULL,
          kategorie VARCHAR(100),
          soll_bestand DECIMAL(10,3),
          ist_bestand DECIMAL(10,3),
          einheit VARCHAR(50),
          preis DECIMAL(10,2),
          inventur_datum TIMESTAMP,
          differenz DECIMAL(10,3),
          bemerkung TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100),
          updated_by VARCHAR(100),
          last_modified_by VARCHAR(100)
        );

        -- System Info Table
        CREATE TABLE IF NOT EXISTS system_info (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create Indexes
        CREATE INDEX IF NOT EXISTS idx_articles_supplier_id ON articles(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
        CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
        CREATE INDEX IF NOT EXISTS idx_einkaufs_liste_status ON einkaufs_liste(status);
        CREATE INDEX IF NOT EXISTS idx_inventur_liste_kategorie ON inventur_liste(kategorie);

        -- Insert System Info
        INSERT INTO system_info (key, value, description) VALUES 
          ('app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
          ('version', '1.0.0', 'Aktuelle Version'),
          ('database_created', CURRENT_TIMESTAMP::text, 'Datum der Datenbankerstellung'),
          ('connection_tested_at', CURRENT_TIMESTAMP::text, 'Letzter Verbindungstest')
        ON CONFLICT (key) DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP;
      `;

      // Führe SQL aus (über RPC-Funktion)
      const { error } = await client.rpc('exec_sql', { sql: createTablesSQL });

      if (error) {
        logger.warn('SUPABASE', `⚠️ Strukturerstellung fehlgeschlagen: ${error.message}`);
        return {
          success: false,
          message: `Strukturerstellung fehlgeschlagen: ${error.message}`,
          tablesCreated: []
        };
      }

      const tablesCreated = ['articles', 'suppliers', 'recipes', 'design', 'einkaufs_liste', 'inventur_liste', 'system_info'];
      logger.info('SUPABASE', `✅ Strukturerstellung erfolgreich: ${tablesCreated.length} Tabellen erstellt`);
      
      return {
        success: true,
        message: `Chef's Numbers Datenbankstruktur erfolgreich erstellt (${tablesCreated.length} Tabellen)`,
        tablesCreated
      };
      
    } catch (error) {
      logger.error('SUPABASE', `❌ Strukturerstellung fehlgeschlagen:`, error as Error);
      return {
        success: false,
        message: `Fehler bei der Strukturerstellung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        tablesCreated: []
      };
    }
  }

  /**
   * Gibt aktuellen Client zurück
   */
  static getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Gibt aktuelle Konfiguration zurück
   */
  static getConfig(): SupabaseConfig | null {
    return this.config;
  }
}