import { createClient } from '@supabase/supabase-js'
import { supabaseConfig, validateAdminConfig } from '../config/supabase'

// Admin-Client mit Service Role Key (hat volle Rechte)
const createAdminClient = () => {
  if (!validateAdminConfig()) {
    throw new Error('Service Role Key ist nicht konfiguriert');
  }
  
  return createClient(
    supabaseConfig.url,
    supabaseConfig.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Schema-Definitionen für alle Tabellen
const SCHEMA_DEFINITIONS = {
  articles: `
    CREATE TABLE IF NOT EXISTS articles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      supplier_id TEXT,
      supplier_article_number TEXT,
      bundle_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      bundle_unit TEXT DEFAULT 'Stück',
      content DECIMAL(10,3) DEFAULT 1,
      content_unit TEXT DEFAULT 'Stück',
      price_per_unit DECIMAL(10,4) DEFAULT 0,
      is_gross_price BOOLEAN DEFAULT true,
      vat_rate DECIMAL(5,2) DEFAULT 19.00,
      additives TEXT[] DEFAULT '{}',
      allergens TEXT[] DEFAULT '{}',
      ingredients TEXT,
      nutrition JSONB DEFAULT '{"calories": 0, "kilojoules": 0, "protein": 0, "fat": 0, "carbohydrates": 0}',
      net_price DECIMAL(10,2),
      gross_price DECIMAL(10,2),
      notes TEXT,
      image_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  suppliers: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone_numbers TEXT[] DEFAULT '{}',
      address_street TEXT,
      address_zip_code TEXT,
      address_city TEXT,
      address_country TEXT DEFAULT 'Deutschland',
      website TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  recipes: `
    CREATE TABLE IF NOT EXISTS recipes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      portions INTEGER DEFAULT 1,
      preparation_time INTEGER DEFAULT 0,
      difficulty TEXT DEFAULT 'mittel',
      ingredients JSONB DEFAULT '[]',
      instructions JSONB DEFAULT '[]',
      nutrition JSONB DEFAULT '{"calories": 0, "kilojoules": 0, "protein": 0, "fat": 0, "carbohydrates": 0}',
      notes TEXT,
      image_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  einkauf: `
    CREATE TABLE IF NOT EXISTS einkauf (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      article_id TEXT NOT NULL,
      quantity DECIMAL(10,3) NOT NULL,
      unit TEXT DEFAULT 'Stück',
      price_per_unit DECIMAL(10,4) NOT NULL,
      supplier_id TEXT,
      order_date DATE DEFAULT CURRENT_DATE,
      delivery_date DATE,
      status TEXT DEFAULT 'bestellt',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  inventur: `
    CREATE TABLE IF NOT EXISTS inventur (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      article_id TEXT NOT NULL,
      current_stock DECIMAL(10,3) DEFAULT 0,
      unit TEXT DEFAULT 'Stück',
      min_stock DECIMAL(10,3) DEFAULT 0,
      max_stock DECIMAL(10,3),
      last_count_date DATE DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
};

// Admin-Service für automatische Schema-Verwaltung
export const supabaseAdminService = {
  // Prüft ob alle erforderlichen Tabellen existieren
  async checkSchema(): Promise<{ [key: string]: boolean }> {
    try {
      const adminClient = createAdminClient();
      const results: { [key: string]: boolean } = {};
      
      for (const [tableName, tableSchema] of Object.entries(SCHEMA_DEFINITIONS)) {
        try {
          // Einfache Abfrage um zu prüfen ob Tabelle existiert
          const { error } = await adminClient
            .from(tableName)
            .select('id')
            .limit(1);
          
          results[tableName] = !error;
        } catch (error) {
          results[tableName] = false;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Fehler beim Prüfen des Schemas:', error);
      throw error;
    }
  },

  // Erstellt alle fehlenden Tabellen
  async createMissingTables(): Promise<string[]> {
    try {
      const adminClient = createAdminClient();
      const schemaStatus = await this.checkSchema();
      const createdTables: string[] = [];
      
      for (const [tableName, exists] of Object.entries(schemaStatus)) {
        if (!exists) {
          try {
            // Verwende direkte SQL-Ausführung über HTTP mit Service Role Key
            const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': supabaseConfig.serviceRoleKey
              },
              body: JSON.stringify({ 
                sql: SCHEMA_DEFINITIONS[tableName as keyof typeof SCHEMA_DEFINITIONS] 
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.warn(`Fehler beim Erstellen der Tabelle ${tableName}: HTTP ${response.status} - ${errorText}`);
            } else {
              createdTables.push(tableName);
              console.log(`Tabelle ${tableName} erfolgreich erstellt`);
            }
          } catch (error) {
            console.warn(`Fehler beim Erstellen der Tabelle ${tableName}:`, error);
          }
        }
      }
      
      return createdTables;
    } catch (error) {
      console.error('Fehler beim Erstellen der fehlenden Tabellen:', error);
      throw error;
    }
  },

  // Führt eine vollständige Schema-Migration durch
  async migrateSchema(): Promise<{ success: boolean; createdTables: string[]; errors: string[] }> {
    try {
      console.log('Starte automatische Schema-Migration...');
      
      // 1. Erstelle erforderliche Rollen (anon, authenticated, service_role)
      console.log('Erstelle Supabase-Rollen...');
      const rolesSQL = `
        -- Anon Role (für öffentliche API-Zugriffe ohne Authentifizierung)
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon NOLOGIN NOINHERIT;
          END IF;
        END
        $$;

        -- Authenticated Role (für authentifizierte Benutzer)
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated NOLOGIN NOINHERIT;
          END IF;
        END
        $$;

        -- Service Role (für Backend-Services mit erweiterten Rechten)
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
            CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
          END IF;
        END
        $$;
      `;
      
      const rolesResult = await this.executeSQL(rolesSQL);
      if (!rolesResult.success) {
        console.error('❌ Fehler beim Erstellen der Rollen:', rolesResult.error);
      } else {
        console.log('✅ Supabase-Rollen erfolgreich erstellt');
      }
      
      // 2. Erstelle Tabellen
      const createdTables = await this.createMissingTables();
      const errors: string[] = [];
      
      // Füge Rollen-Fehler zu errors hinzu falls vorhanden
      if (!rolesResult.success) {
        errors.push(`Rollen-Erstellung fehlgeschlagen: ${rolesResult.error}`);
      }
      
      // 3. Setze Berechtigungen für die Rollen
      console.log('Setze Berechtigungen für Supabase-Rollen...');
      const permissionsSQL = `
        -- Schema-Berechtigungen
        GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
        
        -- Tabellen-Berechtigungen
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
        
        -- Standard-Berechtigungen für neue Objekte
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
      `;
      
      const permissionsResult = await this.executeSQL(permissionsSQL);
      if (!permissionsResult.success) {
        console.error('❌ Fehler beim Setzen der Berechtigungen:', permissionsResult.error);
        errors.push(`Berechtigungen-Setup fehlgeschlagen: ${permissionsResult.error}`);
      } else {
        console.log('✅ Supabase-Berechtigungen erfolgreich gesetzt');
      }
      
      if (createdTables.length > 0) {
        console.log(`Erfolgreich erstellte Tabellen: ${createdTables.join(', ')}`);
      } else {
        console.log('Alle erforderlichen Tabellen existieren bereits');
      }
      
      return {
        success: errors.length === 0,
        createdTables,
        errors
      };
    } catch (error) {
      console.error('Schema-Migration fehlgeschlagen:', error);
      return {
        success: false,
        createdTables: [],
        errors: [error instanceof Error ? error.message : 'Unbekannter Fehler']
      };
    }
  },

  // Prüft ob eine bestimmte Tabelle existiert
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const adminClient = createAdminClient();
      const { error } = await adminClient
        .from(tableName)
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  },

  // Löscht eine Tabelle (VORSICHT: Alle Daten gehen verloren!)
  async dropTable(tableName: string): Promise<boolean> {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseConfig.serviceRoleKey
        },
        body: JSON.stringify({ 
          sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;` 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fehler beim Löschen der Tabelle ${tableName}: HTTP ${response.status} - ${errorText}`);
        return false;
      }
      
      console.log(`Tabelle ${tableName} erfolgreich gelöscht`);
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen der Tabelle ${tableName}:`, error);
      return false;
    }
  },

  // Führt ein benutzerdefiniertes SQL aus (nur für Admin-Operationen)
  async executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseConfig.serviceRoleKey
        },
        body: JSON.stringify({ sql })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      };
    }
  }
};
