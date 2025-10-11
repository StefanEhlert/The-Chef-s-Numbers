import { Pool } from 'pg';

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface DatabaseCheckResult {
  exists: boolean;
  message: string;
}

export interface DatabaseCreationResult {
  success: boolean;
  message: string;
}

export interface StructureCheckResult {
  hasStructure: boolean;
  tables: string[];
  message: string;
}

export interface StructureCreationResult {
  success: boolean;
  message: string;
  tablesCreated: string[];
}

export interface DataSyncResult {
  success: boolean;
  message: string;
  syncedTables: string[];
  recordsSynced: number;
}

export interface SchemaUpdateResult {
  success: boolean;
  message: string;
  columnsAdded: string[];
}

class PostgresService {
  private pool: Pool | null = null;

  /**
   * Testet die Verbindung zu einer PostgreSQL-Datenbank
   */
  async testConnection(config: PostgresConfig): Promise<ConnectionTestResult> {
    try {
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
        };
      }

      // Erstelle temporären Pool für den Test
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Teste Verbindung
      const client = await testPool.connect();
      
      // Führe einfache Abfrage aus
      const result = await client.query('SELECT version()');
      
      // Schließe Verbindung
      client.release();
      await testPool.end();

      return {
        success: true,
        message: 'Verbindung erfolgreich hergestellt',
        details: {
          version: result.rows[0]?.version || 'Unbekannt',
          host: config.host,
          port: config.port,
          database: config.database
        }
      };

    } catch (error: any) {
      console.error('PostgreSQL connection test failed:', error);
      
      let errorMessage = 'Verbindung fehlgeschlagen';
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Verbindung verweigert - Server nicht erreichbar';
      } else if (error.code === '28P01') {
        errorMessage = 'Authentifizierung fehlgeschlagen - Falsche Anmeldedaten';
      } else if (error.code === '3D000') {
        errorMessage = 'Datenbank nicht gefunden';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Host nicht gefunden';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        details: {
          errorCode: error.code,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Prüft ob die PostgreSQL-Datenbank existiert
   */
  async checkDatabaseExists(config: PostgresConfig): Promise<DatabaseCheckResult> {
    try {
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          exists: false,
          message: 'Ungültige Konfiguration'
        };
      }

      // Erstelle temporären Pool mit postgres-Datenbank (Standard-Datenbank)
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: 'postgres', // Verwende Standard-Datenbank für die Prüfung
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await testPool.connect();

      // Prüfe ob die Ziel-Datenbank existiert
      const dbQuery = `
        SELECT 1 FROM pg_database WHERE datname = $1
      `;
      
      const dbResult = await client.query(dbQuery, [config.database]);
      const exists = dbResult.rows.length > 0;

      client.release();
      await testPool.end();

      return {
        exists,
        message: exists 
          ? `Datenbank '${config.database}' existiert bereits`
          : `Datenbank '${config.database}' existiert nicht`
      };

    } catch (error: any) {
      console.error('PostgreSQL database check failed:', error);
      return {
        exists: false,
        message: `Fehler bei der Datenbankprüfung: ${error.message}`
      };
    }
  }

  /**
   * Erstellt eine neue PostgreSQL-Datenbank
   */
  async createDatabase(config: PostgresConfig): Promise<DatabaseCreationResult> {
    try {
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Ungültige Konfiguration'
        };
      }

      // Erstelle temporären Pool mit postgres-Datenbank
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: 'postgres', // Verwende Standard-Datenbank für die Erstellung
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await testPool.connect();

      // Prüfe zuerst ob die Datenbank bereits existiert
      const checkQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const checkResult = await client.query(checkQuery, [config.database]);
      
      if (checkResult.rows.length > 0) {
        client.release();
        await testPool.end();
        return {
          success: true,
          message: `Datenbank '${config.database}' existiert bereits`
        };
      }

      // Erstelle die Datenbank
      const createQuery = `CREATE DATABASE "${config.database}"`;
      await client.query(createQuery);

      client.release();
      await testPool.end();

      return {
        success: true,
        message: `Datenbank '${config.database}' erfolgreich erstellt`
      };

    } catch (error: any) {
      console.error('PostgreSQL database creation failed:', error);
      return {
        success: false,
        message: `Fehler bei der Datenbankerstellung: ${error.message}`
      };
    }
  }

  /**
   * Prüft ob die Datenbankstruktur bereits existiert
   */
  async checkStructure(config: PostgresConfig): Promise<StructureCheckResult> {
    try {
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          hasStructure: false,
          tables: [],
          message: 'Ungültige Konfiguration'
        };
      }

      // Erstelle temporären Pool
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await testPool.connect();

      // Prüfe ob Tabellen existieren
      const tableQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      
      const tableResult = await client.query(tableQuery);
      const tables = tableResult.rows.map(row => row.table_name);

      // Prüfe spezifisch nach Chef's Numbers Tabellen
      const chefTables = tables.filter(table => 
        table.toLowerCase().includes('chef') || 
        table.toLowerCase().includes('article') ||
        table.toLowerCase().includes('recipe') ||
        table.toLowerCase().includes('supplier')
      );

      client.release();
      await testPool.end();

      const hasStructure = chefTables.length > 0;

      return {
        hasStructure,
        tables: tables,
        message: hasStructure 
          ? `Datenbankstruktur gefunden (${chefTables.length} Chef's Numbers Tabellen)`
          : 'Keine Chef\'s Numbers Datenbankstruktur gefunden'
      };

    } catch (error: any) {
      console.error('PostgreSQL structure check failed:', error);
      return {
        hasStructure: false,
        tables: [],
        message: `Fehler bei der Strukturprüfung: ${error.message}`
      };
    }
  }

  /**
   * Erstellt die Chef's Numbers Datenbankstruktur
   */
  async createStructure(config: PostgresConfig): Promise<StructureCreationResult> {
    try {
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Ungültige Konfiguration',
          tablesCreated: []
        };
      }

      // Erstelle temporären Pool
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await testPool.connect();

      // Starte Transaktion
      await client.query('BEGIN');

      try {
        const tablesCreated: string[] = [];

        // 1. Artikel-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS articles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            supplier_id INTEGER NULL,
            supplier_article_number VARCHAR(100),
            bundle_unit VARCHAR(50) DEFAULT 'Stück',
            bundle_price DECIMAL(10,2) DEFAULT 0,
            bundle_ean_code VARCHAR(13),
            content DECIMAL(10,3) DEFAULT 1,
            content_unit VARCHAR(50) DEFAULT 'Stück',
            content_ean_code VARCHAR(13),
            price_per_unit DECIMAL(10,2) DEFAULT 0,
            vat_rate DECIMAL(5,2) DEFAULT 19,
            allergens JSONB DEFAULT '[]',
            additives JSONB DEFAULT '[]',
            ingredients TEXT,
            nutrition JSONB DEFAULT '{}',
            notes TEXT,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('articles');

        // 2. Lieferanten-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS suppliers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('suppliers');

        // 3. Rezepte-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS recipes (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            instructions TEXT,
            preparation_time INTEGER,
            cooking_time INTEGER,
            servings INTEGER,
            difficulty VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('recipes');

        // 4. Rezept-Zutaten-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS recipe_ingredients (
            id SERIAL PRIMARY KEY,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
            article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
            quantity DECIMAL(10,3) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('recipe_ingredients');

        // 5. Einkauf-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS purchases (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
            supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
            quantity DECIMAL(10,3) NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            purchase_date DATE NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('purchases');

        // 6. Inventur-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS inventory (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
            quantity DECIMAL(10,3) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            last_count_date DATE NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('inventory');

        // 7. Bilder-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS images (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            size INTEGER NOT NULL,
            path VARCHAR(500) NOT NULL,
            article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('images');

        // 8. System-Info-Tabelle
        await client.query(`
          CREATE TABLE IF NOT EXISTS system_info (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        tablesCreated.push('system_info');

        // Füge System-Info hinzu
        await client.query(`
          INSERT INTO system_info (key, value, description) 
          VALUES 
            ('app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
            ('version', '1.0.0', 'Aktuelle Version'),
            ('database_created', CURRENT_TIMESTAMP::text, 'Datum der Datenbankerstellung'),
            ('connection_tested_at', CURRENT_TIMESTAMP::text, 'Letzter Verbindungstest')
          ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `);

        // Commit Transaktion
        await client.query('COMMIT');

        client.release();
        await testPool.end();

        return {
          success: true,
          message: `Datenbankstruktur erfolgreich erstellt (${tablesCreated.length} Tabellen)`,
          tablesCreated
        };

      } catch (error) {
        // Rollback bei Fehler
        await client.query('ROLLBACK');
        throw error;
      }

    } catch (error: any) {
      console.error('PostgreSQL structure creation failed:', error);
      return {
        success: false,
        message: `Fehler bei der Strukturerstellung: ${error.message}`,
        tablesCreated: []
      };
    }
  }

  /**
   * Aktualisiert die Datenbankstruktur um fehlende Spalten hinzuzufügen
   */
  async updateSchema(config: PostgresConfig): Promise<SchemaUpdateResult> {
    try {
      console.log('updateSchema called with config:', {
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        hasPassword: !!config.password
      });
      
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        console.log('Config validation failed');
        return {
          success: false,
          message: 'Ungültige Konfiguration',
          columnsAdded: []
        };
      }

      // Erstelle temporären Pool
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await testPool.connect();

      // Starte Transaktion
      await client.query('BEGIN');

      try {
        const columnsAdded: string[] = [];

        // 🔧 KRITISCHE SCHEMA-MIGRATION: Lösche alte Tabellen und erstelle neue
        console.log('🔧 Starte kritische Schema-Migration...');
        
        // Sichere existierende Daten (falls vorhanden)
        try {
          await client.query('CREATE TABLE IF NOT EXISTS articles_backup AS SELECT * FROM articles');
          await client.query('CREATE TABLE IF NOT EXISTS suppliers_backup AS SELECT * FROM suppliers');
          await client.query('CREATE TABLE IF NOT EXISTS recipes_backup AS SELECT * FROM recipes');
          console.log('✅ Backup-Tabellen erstellt');
        } catch (error) {
          console.log('⚠️ Backup-Tabellen konnten nicht erstellt werden (wahrscheinlich existieren die Tabellen noch nicht)');
        }

        // Lösche alte Tabellen (mit CASCADE um Abhängigkeiten zu lösen)
        console.log('🗑️ Lösche alte Tabellen...');
        await client.query('DROP TABLE IF EXISTS recipe_ingredients CASCADE');
        await client.query('DROP TABLE IF EXISTS recipe_steps CASCADE');
        await client.query('DROP TABLE IF EXISTS purchases CASCADE');
        await client.query('DROP TABLE IF EXISTS inventory CASCADE');
        await client.query('DROP TABLE IF EXISTS images CASCADE');
        await client.query('DROP TABLE IF EXISTS articles CASCADE');
        await client.query('DROP TABLE IF EXISTS suppliers CASCADE');
        await client.query('DROP TABLE IF EXISTS recipes CASCADE');
        await client.query('DROP TABLE IF EXISTS system_info CASCADE');
        console.log('✅ Alte Tabellen gelöscht');

        // Erstelle neue Tabellen mit korrektem Schema
        console.log('🔨 Erstelle neue Tabellen mit korrektem Schema...');

        // Suppliers mit SERIAL PRIMARY KEY
        await client.query(`
          CREATE TABLE suppliers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('suppliers (SERIAL PRIMARY KEY)');

        // Articles mit SERIAL PRIMARY KEY und INTEGER supplier_id
        await client.query(`
          CREATE TABLE articles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            supplier_id INTEGER REFERENCES suppliers(id),
            supplier_article_number VARCHAR(100),
            bundle_unit VARCHAR(50) DEFAULT 'Stück',
            bundle_price DECIMAL(10,2) DEFAULT 0,
            bundle_ean_code VARCHAR(13),
            content DECIMAL(10,3) DEFAULT 1,
            content_unit VARCHAR(50) DEFAULT 'Stück',
            content_ean_code VARCHAR(13),
            price_per_unit DECIMAL(10,2) DEFAULT 0,
            vat_rate DECIMAL(5,2) DEFAULT 19,
            allergens JSONB DEFAULT '[]',
            additives JSONB DEFAULT '[]',
            ingredients TEXT,
            nutrition JSONB DEFAULT '{}',
            notes TEXT,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('articles (SERIAL PRIMARY KEY, INTEGER supplier_id)');

        // Recipes mit SERIAL PRIMARY KEY
        await client.query(`
          CREATE TABLE recipes (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            instructions TEXT,
            preparation_time INTEGER,
            cooking_time INTEGER,
            servings INTEGER,
            difficulty VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('recipes (SERIAL PRIMARY KEY)');

        // Recipe ingredients mit INTEGER Referenzen
        await client.query(`
          CREATE TABLE recipe_ingredients (
            id SERIAL PRIMARY KEY,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
            article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
            quantity DECIMAL(10,3) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('recipe_ingredients (INTEGER Referenzen)');

        // Recipe steps mit INTEGER Referenzen
        await client.query(`
          CREATE TABLE recipe_steps (
            id SERIAL PRIMARY KEY,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
            step_number INTEGER NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('recipe_steps (INTEGER Referenzen)');

        // Purchases mit INTEGER Referenzen
        await client.query(`
          CREATE TABLE purchases (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
            supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
            quantity DECIMAL(10,3) NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            purchase_date DATE NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('purchases (INTEGER Referenzen)');

        // Inventory mit INTEGER Referenzen
        await client.query(`
          CREATE TABLE inventory (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
            quantity DECIMAL(10,3) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            last_count_date DATE NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('inventory (INTEGER Referenzen)');

        // Images mit INTEGER Referenzen
        await client.query(`
          CREATE TABLE images (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            size INTEGER NOT NULL,
            path VARCHAR(500) NOT NULL,
            article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('images (INTEGER Referenzen)');

        // System info
        await client.query(`
          CREATE TABLE system_info (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        columnsAdded.push('system_info');

        // Erstelle Indizes für bessere Performance
        await client.query('CREATE INDEX idx_articles_supplier_id ON articles(supplier_id)');
        await client.query('CREATE INDEX idx_articles_category ON articles(category)');
        await client.query('CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id)');
        await client.query('CREATE INDEX idx_recipe_ingredients_article_id ON recipe_ingredients(article_id)');
        await client.query('CREATE INDEX idx_purchases_article_id ON purchases(article_id)');
        await client.query('CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id)');
        await client.query('CREATE INDEX idx_inventory_article_id ON inventory(article_id)');
        await client.query('CREATE INDEX idx_images_article_id ON images(article_id)');
        await client.query('CREATE INDEX idx_images_recipe_id ON images(recipe_id)');

        console.log('✅ Neue Tabellen mit korrektem Schema erstellt');

        // Füge System-Info hinzu
        await client.query(`
          INSERT INTO system_info (key, value, description) 
          VALUES 
            ('app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
            ('version', '1.0.0', 'Aktuelle Version'),
            ('database_created', CURRENT_TIMESTAMP::text, 'Datum der Datenbankerstellung'),
            ('schema_migrated', CURRENT_TIMESTAMP::text, 'Schema-Migration durchgeführt'),
            ('connection_tested_at', CURRENT_TIMESTAMP::text, 'Letzter Verbindungstest')
          ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `);

        // Commit Transaktion
        await client.query('COMMIT');

        client.release();
        await testPool.end();

        console.log('🎉 Schema-Migration erfolgreich abgeschlossen!');
        console.log('📋 Neue Tabellen-Struktur:');
        console.log('   - suppliers: id SERIAL PRIMARY KEY');
        console.log('   - articles: id SERIAL PRIMARY KEY, supplier_id INTEGER');
        console.log('   - recipes: id SERIAL PRIMARY KEY');
        console.log('   - Alle Referenzen sind jetzt INTEGER');

        return {
          success: true,
          message: `Schema-Migration erfolgreich abgeschlossen! Alle Tabellen wurden mit korrektem Schema (SERIAL/INTEGER) neu erstellt.`,
          columnsAdded
        };

      } catch (error) {
        // Rollback bei Fehler
        await client.query('ROLLBACK');
        throw error;
      }

    } catch (error: any) {
      console.error('PostgreSQL schema update failed:', error);
      return {
        success: false,
        message: `Fehler bei der Schema-Aktualisierung: ${error.message}`,
        columnsAdded: []
      };
    }
  }

  /**
   * Synchronisiert Daten zwischen LocalStorage und PostgreSQL
   */
  async syncData(config: PostgresConfig, data: any): Promise<DataSyncResult> {
    try {
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Ungültige Konfiguration',
          syncedTables: [],
          recordsSynced: 0
        };
      }

      // Erstelle temporären Pool
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await testPool.connect();

      // Aktualisiere Schema vor der Synchronisation
      const schemaUpdate = await this.updateSchema(config);
      if (!schemaUpdate.success) {
        client.release();
        await testPool.end();
        return {
          success: false,
          message: `Schema-Aktualisierung fehlgeschlagen: ${schemaUpdate.message}`,
          syncedTables: [],
          recordsSynced: 0
        };
      }

      // Starte Transaktion
      await client.query('BEGIN');

      try {
        const syncedTables: string[] = [];
        let recordsSynced = 0;

        // Erstelle Mapping für Artikel-IDs und Lieferanten-IDs
        const articleIdMapping: { [key: string]: number } = {};
        const supplierIdMapping: { [key: string]: number } = {};
        
        // Synchronisiere Lieferanten zuerst (da Artikel auf Lieferanten verweisen)
        if (data.suppliers && Array.isArray(data.suppliers)) {
          await client.query('DELETE FROM suppliers'); // Lösche alle bestehenden Lieferanten
          
          for (const supplier of data.suppliers) {
            const supplierResult = await client.query(`
              INSERT INTO suppliers (name, contact_person, email, phone, address, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id
            `, [
              supplier.name,
              supplier.contact_person || null,
              supplier.email || null,
              supplier.phone || null,
              supplier.address || null,
              supplier.created_at || new Date(),
              supplier.updated_at || new Date()
            ]);
            
            // Speichere Mapping von alter ID zu neuer ID
            supplierIdMapping[supplier.id] = supplierResult.rows[0].id;
            recordsSynced++;
          }
          syncedTables.push('suppliers');
        }
        
        // Synchronisiere Artikel
        if (data.articles && Array.isArray(data.articles)) {
          await client.query('DELETE FROM articles'); // Lösche alle bestehenden Artikel
          
          for (const article of data.articles) {
            // Verwende gemappte Lieferanten-ID oder null falls nicht gefunden
            const mappedSupplierId = supplierIdMapping[article.supplier_id] || null;
            
            const articleResult = await client.query(`
              INSERT INTO articles (
                name, 
                category, 
                supplier_id, 
                supplier_article_number,
                bundle_unit,
                bundle_price,
                content,
                content_unit,
                price_per_unit,
                vat_rate,
                allergens,
                additives,
                ingredients,
                nutrition,
                notes,
                image_url,
                created_at, 
                updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
              RETURNING id
            `, [
              article.name,
              article.category || null,
              mappedSupplierId,
              article.supplierArticleNumber || null,
              article.bundleUnit || 'Stück',
              article.bundlePrice || 0,
              article.content || 1,
              article.contentUnit || 'Stück',
              article.pricePerUnit || 0,
              article.vatRate || 19,
              JSON.stringify(Array.isArray(article.allergens) ? article.allergens : []),
              JSON.stringify(Array.isArray(article.additives) ? article.additives : []),
              article.ingredients || null,
              JSON.stringify(article.nutritionInfo || {}),
              article.notes || null,
              article.imageUrl || null,
              article.created_at || new Date(),
              article.updated_at || new Date()
            ]);
            
            // Speichere Mapping von alter ID zu neuer ID
            articleIdMapping[article.id] = articleResult.rows[0].id;
            recordsSynced++;
          }
          syncedTables.push('articles');
        }

        // Synchronisiere Rezepte
        if (data.recipes && Array.isArray(data.recipes)) {
          await client.query('DELETE FROM recipe_ingredients'); // Lösche zuerst Zutaten
          await client.query('DELETE FROM recipes'); // Dann Rezepte
          
          for (const recipe of data.recipes) {
            const recipeResult = await client.query(`
              INSERT INTO recipes (name, description, instructions, preparation_time, cooking_time, servings, difficulty, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id
            `, [
              recipe.name,
              recipe.description || null,
              recipe.instructions || null,
              recipe.preparation_time || null,
              recipe.cooking_time || null,
              recipe.servings || null,
              recipe.difficulty || null,
              recipe.created_at || new Date(),
              recipe.updated_at || new Date()
            ]);
            
            const newRecipeId = recipeResult.rows[0].id;
            recordsSynced++;

            // Synchronisiere Rezept-Zutaten
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
              for (const ingredient of recipe.ingredients) {
                // Verwende gemappte Artikel-ID oder null falls nicht gefunden
                const mappedArticleId = articleIdMapping[ingredient.article_id] || null;
                
                await client.query(`
                  INSERT INTO recipe_ingredients (recipe_id, article_id, quantity, unit, notes, created_at)
                  VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                  newRecipeId,
                  mappedArticleId,
                  ingredient.quantity,
                  ingredient.unit,
                  ingredient.notes || null,
                  ingredient.created_at || new Date()
                ]);
                recordsSynced++;
              }
            }
          }
          syncedTables.push('recipes');
          syncedTables.push('recipe_ingredients');
        }

        // Aktualisiere System-Info (falls Tabelle existiert)
        try {
          await client.query(`
            INSERT INTO system_info (key, value, description) 
            VALUES ('last_sync', CURRENT_TIMESTAMP::text, 'Letzte Datensynchronisation')
            ON CONFLICT (key) DO UPDATE SET 
              value = EXCLUDED.value,
              updated_at = CURRENT_TIMESTAMP
          `);
        } catch (error) {
          // Ignoriere Fehler wenn system_info Tabelle nicht existiert
          console.log('system_info Tabelle nicht verfügbar, überspringe Update');
        }

        // Commit Transaktion
        await client.query('COMMIT');

        client.release();
        await testPool.end();

        return {
          success: true,
          message: `Daten erfolgreich synchronisiert (${recordsSynced} Datensätze in ${syncedTables.length} Tabellen)`,
          syncedTables,
          recordsSynced
        };

      } catch (error) {
        // Rollback bei Fehler
        await client.query('ROLLBACK');
        throw error;
      }

    } catch (error: any) {
      console.error('PostgreSQL data sync failed:', error);
      return {
        success: false,
        message: `Fehler bei der Datensynchronisation: ${error.message}`,
        syncedTables: [],
        recordsSynced: 0
      };
    }
  }

  /**
   * Validiert die PostgreSQL-Konfiguration
   */
  private validateConfig(config: PostgresConfig): boolean {
    console.log('validateConfig called with:', {
      hasHost: !!config.host,
      hasPort: !!config.port,
      hasDatabase: !!config.database,
      hasUsername: !!config.username,
      hasPassword: !!config.password,
      portValue: config.port,
      portValid: config.port >= 1 && config.port <= 65535
    });
    
    const isValid = !!(
      config.host &&
      config.port &&
      config.database &&
      config.username &&
      config.password &&
      config.port >= 1 &&
      config.port <= 65535
    );
    
    console.log('validateConfig result:', isValid);
    return isValid;
  }

  /**
   * Schließt alle Verbindungen
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Prüft und aktualisiert das Datenbankschema automatisch
   */
  async checkAndUpdateSchema(config: PostgresConfig): Promise<{ success: boolean; message: string; changes: string[] }> {
    try {
      console.log('🔍 Prüfe Datenbankschema auf Abweichungen...');
      
      const testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await testPool.connect();
      const changes: string[] = [];

      try {
        // Definiere das aktuelle App-Schema
        const currentSchema = {
          articles: {
            id: { type: 'SERIAL PRIMARY KEY', required: true },
            name: { type: 'VARCHAR(255) NOT NULL', required: true },
            category: { type: 'VARCHAR(100)', required: false },
            supplier_id: { type: 'INTEGER REFERENCES suppliers(id)', required: false },
            supplier_article_number: { type: 'VARCHAR(100)', required: false },
            bundle_unit: { type: 'VARCHAR(50) DEFAULT \'Stück\'', required: false },
            bundle_price: { type: 'DECIMAL(10,2) DEFAULT 0', required: false },
            bundle_ean_code: { type: 'VARCHAR(13)', required: false },
            content: { type: 'DECIMAL(10,3) DEFAULT 1', required: false },
            content_unit: { type: 'VARCHAR(50) DEFAULT \'Stück\'', required: false },
            content_ean_code: { type: 'VARCHAR(13)', required: false },
            price_per_unit: { type: 'DECIMAL(10,2) DEFAULT 0', required: false },
            vat_rate: { type: 'DECIMAL(5,2) DEFAULT 19', required: false },
            allergens: { type: 'JSONB DEFAULT \'[]\'', required: false },
            additives: { type: 'JSONB DEFAULT \'[]\'', required: false },
            ingredients: { type: 'TEXT', required: false },
            nutrition: { type: 'JSONB DEFAULT \'{}\'', required: false },
            notes: { type: 'TEXT', required: false },
            image_url: { type: 'VARCHAR(500)', required: false },
            created_at: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', required: false },
            updated_at: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', required: false }
          },
          suppliers: {
            id: { type: 'SERIAL PRIMARY KEY', required: true },
            name: { type: 'VARCHAR(255) NOT NULL', required: true },
            contact_person: { type: 'VARCHAR(255)', required: false },
            email: { type: 'VARCHAR(255)', required: false },
            phone: { type: 'VARCHAR(50)', required: false },
            address: { type: 'TEXT', required: false },
            created_at: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', required: false },
            updated_at: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', required: false }
          },
          recipes: {
            id: { type: 'SERIAL PRIMARY KEY', required: true },
            name: { type: 'VARCHAR(255) NOT NULL', required: true },
            description: { type: 'TEXT', required: false },
            instructions: { type: 'TEXT', required: false },
            preparation_time: { type: 'INTEGER', required: false },
            cooking_time: { type: 'INTEGER', required: false },
            servings: { type: 'INTEGER', required: false },
            difficulty: { type: 'VARCHAR(50)', required: false },
            created_at: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', required: false },
            updated_at: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', required: false }
          }
        };

        // Prüfe jede Tabelle im Schema
        for (const [tableName, expectedColumns] of Object.entries(currentSchema)) {
          console.log(`🔍 Prüfe Tabelle: ${tableName}`);
          
          // Prüfe ob Tabelle existiert
          const tableExists = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            ) as table_exists
          `, [tableName]);

          if (!tableExists.rows[0].table_exists) {
            console.log(`➕ Tabelle ${tableName} existiert nicht - erstelle sie...`);
            await this.createTable(client, tableName, expectedColumns);
            changes.push(`Tabelle ${tableName} erstellt`);
            continue;
          }

          // Prüfe Spalten der existierenden Tabelle
          const existingColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);

          const existingColumnNames = existingColumns.rows.map(row => row.column_name);

          // Prüfe fehlende Spalten
          for (const [columnName, columnDef] of Object.entries(expectedColumns)) {
            if (!existingColumnNames.includes(columnName)) {
              console.log(`➕ Spalte ${columnName} fehlt in ${tableName} - füge hinzu...`);
              await client.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef.type}`);
              changes.push(`Spalte ${columnName} zu ${tableName} hinzugefügt`);
            }
          }

          // Optional: Prüfe auch auf überflüssige Spalten (warnen, aber nicht löschen)
          for (const existingColumn of existingColumnNames) {
            if (!Object.keys(expectedColumns).includes(existingColumn)) {
              console.log(`⚠️ Unerwartete Spalte ${existingColumn} in ${tableName} gefunden`);
            }
          }
        }

        client.release();
        await testPool.end();

        if (changes.length > 0) {
          console.log(`✅ Schema-Aktualisierung abgeschlossen: ${changes.length} Änderungen`);
          return {
            success: true,
            message: `Schema erfolgreich aktualisiert (${changes.length} Änderungen)`,
            changes
          };
        } else {
          console.log('✅ Schema ist aktuell - keine Änderungen erforderlich');
          return {
            success: true,
            message: 'Schema ist aktuell - keine Änderungen erforderlich',
            changes: []
          };
        }

      } catch (error) {
        client.release();
        await testPool.end();
        throw error;
      }

    } catch (error: any) {
      console.error('❌ Fehler bei der Schema-Prüfung:', error);
      return {
        success: false,
        message: `Fehler bei der Schema-Prüfung: ${error.message}`,
        changes: []
      };
    }
  }

  /**
   * Erstellt eine neue Tabelle mit dem angegebenen Schema
   */
  private async createTable(client: any, tableName: string, columns: any): Promise<void> {
    const columnDefinitions = Object.entries(columns)
      .map(([name, def]: [string, any]) => `${name} ${def.type}`)
      .join(', ');

    const createQuery = `CREATE TABLE ${tableName} (${columnDefinitions})`;
    await client.query(createQuery);
  }
}

export const postgresService = new PostgresService();

// Export the updateSchema method
export { PostgresService };
