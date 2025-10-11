import { SupabaseClient } from '@supabase/supabase-js';

export interface SchemaCreationResult {
  success: boolean;
  createdTables: string[];
  errors: string[];
}

export class SupabaseSchemaService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Erstellt alle benötigten Tabellen und Buckets automatisch
   */
  async createSchema(): Promise<SchemaCreationResult> {
    const result: SchemaCreationResult = {
      success: true,
      createdTables: [],
      errors: []
    };

    try {
      // 1. Tabellen erstellen
      await this.createTables(result);
      
      // 2. Storage Buckets erstellen
      await this.createStorageBuckets(result);
      
      // 3. Row Level Security (RLS) konfigurieren
      await this.configureRLS(result);
      
      // 4. Indizes erstellen
      await this.createIndexes(result);

    } catch (error) {
      result.success = false;
      result.errors.push(`Schema-Erstellung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }

    return result;
  }

  /**
   * Erstellt alle benötigten Tabellen
   */
  private async createTables(result: SchemaCreationResult): Promise<void> {
    // Prüfe ob exec_sql Funktion verfügbar ist
    const hasExecSql = await this.checkExecSqlAvailable();
    
    const tables = [
      {
        name: 'articles',
        columns: [
          'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
          'name TEXT NOT NULL',
          'category TEXT',
          'supplier_id TEXT',
          'net_price DECIMAL(10,2)',
          'gross_price DECIMAL(10,2)',
          'vat_rate DECIMAL(5,2) DEFAULT 19.00',
          'unit TEXT DEFAULT \'Stück\'',
          'min_stock INTEGER DEFAULT 0',
          'current_stock INTEGER DEFAULT 0',
          'allergens TEXT[]',
          'additives TEXT[]',
          'notes TEXT',
          'image_url TEXT',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      {
        name: 'suppliers',
        columns: [
          'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
          'name TEXT NOT NULL',
          'contact_person TEXT',
          'email TEXT',
          'phone_numbers TEXT[]',
          'address_street TEXT',
          'address_zip_code TEXT',
          'address_city TEXT',
          'address_country TEXT DEFAULT \'Deutschland\'',
          'website TEXT',
          'notes TEXT',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      {
        name: 'recipes',
        columns: [
          'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
          'name TEXT NOT NULL',
          'description TEXT',
          'portions INTEGER DEFAULT 1',
          'ingredients JSONB',
          'preparation_steps TEXT[]',
          'material_costs DECIMAL(10,2) DEFAULT 0',
          'selling_price DECIMAL(10,2) DEFAULT 0',
          'energy_kcal INTEGER DEFAULT 0',
          'energy_kj INTEGER DEFAULT 0',
          'allergens TEXT[]',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'last_modified_by TEXT DEFAULT \'Benutzer\''
        ]
      },
      {
        name: 'einkauf',
        columns: [
          'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
          'article_id TEXT', // Vereinfacht ohne Foreign Key für bessere Kompatibilität
          'quantity DECIMAL(10,2) NOT NULL',
          'unit TEXT DEFAULT \'Stück\'',
          'priority TEXT DEFAULT \'normal\'',
          'notes TEXT',
          'completed BOOLEAN DEFAULT FALSE',
          'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ]
      },
      {
        name: 'inventur',
        columns: [
          'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
          'article_id TEXT', // Vereinfacht ohne Foreign Key für bessere Kompatibilität
          'counted_quantity DECIMAL(10,2) NOT NULL',
          'unit TEXT DEFAULT \'Stück\'',
          'notes TEXT',
          'counted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
          'counted_by TEXT DEFAULT \'Benutzer\''
        ]
      }
    ];

    for (const table of tables) {
      try {
        if (hasExecSql) {
          // Verwende exec_sql wenn verfügbar
          const sql = `CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns.join(', ')});`;
          const { error } = await this.supabase.rpc('exec_sql', { sql });
          if (!error) {
            result.createdTables.push(table.name);
          }
        } else {
          // Fallback: Prüfe ob Tabelle existiert
          const { data, error } = await this.supabase
            .from(table.name)
            .select('*')
            .limit(1);
          
          if (error && error.code === '42P01') {
            // Tabelle existiert nicht - kann nicht automatisch erstellt werden
            console.warn(`Tabelle ${table.name} existiert nicht und kann nicht automatisch erstellt werden.`);
            result.errors.push(`Tabelle ${table.name} muss manuell in Supabase erstellt werden.`);
          } else if (!error) {
            // Tabelle existiert bereits
            result.createdTables.push(table.name);
          }
        }
      } catch (error) {
        console.warn(`Fehler beim Erstellen der Tabelle ${table.name}:`, error);
        result.errors.push(`Fehler bei Tabelle ${table.name}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      }
    }
  }

  /**
   * Prüft ob die exec_sql Funktion verfügbar ist
   */
  private async checkExecSqlAvailable(): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Erstellt Storage Buckets für Bilder
   */
  private async createStorageBuckets(result: SchemaCreationResult): Promise<void> {
    try {
      // Versuche den images Bucket zu erstellen
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
      
      if (!imagesBucketExists) {
        const { error } = await this.supabase.storage.createBucket('images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (!error) {
          result.createdTables.push('images_bucket');
        }
      }
    } catch (error) {
      console.warn('Fehler beim Erstellen der Storage Buckets:', error);
      // Storage Buckets sind optional, fahre fort
    }
  }

  /**
   * Konfiguriert Row Level Security
   */
  private async configureRLS(result: SchemaCreationResult): Promise<void> {
    try {
      // Aktiviere RLS für alle Tabellen
      const tables = ['articles', 'suppliers', 'recipes', 'einkauf', 'inventur'];
      
      for (const table of tables) {
        try {
          // Versuche RLS zu aktivieren (kann fehlschlagen wenn bereits aktiv)
          await this.supabase.rpc('exec_sql', { 
            sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;` 
          });
          
          // Erstelle Policy für öffentlichen Zugriff (für Demo-Zwecke)
          await this.supabase.rpc('exec_sql', { 
            sql: `CREATE POLICY "Öffentlicher Zugriff auf ${table}" ON ${table} FOR ALL USING (true);` 
          });
        } catch (error) {
          // RLS ist wahrscheinlich bereits konfiguriert
          console.log(`RLS für ${table} bereits konfiguriert`);
        }
      }
    } catch (error) {
      console.warn('Fehler beim Konfigurieren von RLS:', error);
      // RLS ist optional, fahre fort
    }
  }

  /**
   * Erstellt nützliche Indizes
   */
  private async createIndexes(result: SchemaCreationResult): Promise<void> {
    try {
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_articles_name ON articles(name);',
        'CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);',
        'CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);',
        'CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);',
        'CREATE INDEX IF NOT EXISTS idx_einkauf_article_id ON einkauf(article_id);',
        'CREATE INDEX IF NOT EXISTS idx_inventur_article_id ON inventur(article_id);'
      ];

      for (const indexSql of indexes) {
        try {
          await this.supabase.rpc('exec_sql', { sql: indexSql });
        } catch (error) {
          // Index existiert wahrscheinlich bereits
          console.log('Index konnte nicht erstellt werden (existiert bereits):', indexSql);
        }
      }
    } catch (error) {
      console.warn('Fehler beim Erstellen der Indizes:', error);
      // Indizes sind optional, fahre fort
    }
  }

  /**
   * Überprüft ob das Schema bereits existiert
   */
  async checkSchemaExists(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('id')
        .limit(1);
      
      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Testet die Verbindung und erstellt Schema bei Bedarf
   */
  async testConnectionAndSetupSchema(): Promise<{ connectionOk: boolean; schemaCreated: boolean; result?: SchemaCreationResult }> {
    try {
      // 1. Teste grundlegende Verbindung
      const { data, error } = await this.supabase
        .from('articles')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Tabelle existiert nicht - Schema erstellen
        console.log('Schema nicht gefunden, erstelle es automatisch...');
        const result = await this.createSchema();
        return {
          connectionOk: true,
          schemaCreated: true,
          result
        };
      } else if (error) {
        // Anderer Fehler
        return {
          connectionOk: false,
          schemaCreated: false
        };
      } else {
        // Schema existiert bereits
        return {
          connectionOk: true,
          schemaCreated: false
        };
      }
    } catch (error) {
      return {
        connectionOk: false,
        schemaCreated: false
      };
    }
  }
}
