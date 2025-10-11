"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresService = exports.postgresService = void 0;
const pg_1 = require("pg");
class PostgresService {
    constructor() {
        this.pool = null;
    }
    async testConnection(config) {
        try {
            if (!this.validateConfig(config)) {
                return {
                    success: false,
                    message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
                };
            }
            const testPool = new pg_1.Pool({
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
            const result = await client.query('SELECT version()');
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
        }
        catch (error) {
            console.error('PostgreSQL connection test failed:', error);
            let errorMessage = 'Verbindung fehlgeschlagen';
            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Verbindung verweigert - Server nicht erreichbar';
            }
            else if (error.code === '28P01') {
                errorMessage = 'Authentifizierung fehlgeschlagen - Falsche Anmeldedaten';
            }
            else if (error.code === '3D000') {
                errorMessage = 'Datenbank nicht gefunden';
            }
            else if (error.code === 'ENOTFOUND') {
                errorMessage = 'Host nicht gefunden';
            }
            else if (error.message) {
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
    async checkDatabaseExists(config) {
        try {
            if (!this.validateConfig(config)) {
                return {
                    exists: false,
                    message: 'Ungültige Konfiguration'
                };
            }
            const testPool = new pg_1.Pool({
                host: config.host,
                port: config.port,
                database: 'postgres',
                user: config.username,
                password: config.password,
                max: 1,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });
            const client = await testPool.connect();
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
        }
        catch (error) {
            console.error('PostgreSQL database check failed:', error);
            return {
                exists: false,
                message: `Fehler bei der Datenbankprüfung: ${error.message}`
            };
        }
    }
    async createDatabase(config) {
        try {
            if (!this.validateConfig(config)) {
                return {
                    success: false,
                    message: 'Ungültige Konfiguration'
                };
            }
            const testPool = new pg_1.Pool({
                host: config.host,
                port: config.port,
                database: 'postgres',
                user: config.username,
                password: config.password,
                max: 1,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });
            const client = await testPool.connect();
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
            const createQuery = `CREATE DATABASE "${config.database}"`;
            await client.query(createQuery);
            client.release();
            await testPool.end();
            return {
                success: true,
                message: `Datenbank '${config.database}' erfolgreich erstellt`
            };
        }
        catch (error) {
            console.error('PostgreSQL database creation failed:', error);
            return {
                success: false,
                message: `Fehler bei der Datenbankerstellung: ${error.message}`
            };
        }
    }
    async checkStructure(config) {
        try {
            if (!this.validateConfig(config)) {
                return {
                    hasStructure: false,
                    tables: [],
                    message: 'Ungültige Konfiguration'
                };
            }
            const testPool = new pg_1.Pool({
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
            const tableQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
            const tableResult = await client.query(tableQuery);
            const tables = tableResult.rows.map(row => row.table_name);
            const chefTables = tables.filter(table => table.toLowerCase().includes('chef') ||
                table.toLowerCase().includes('article') ||
                table.toLowerCase().includes('recipe') ||
                table.toLowerCase().includes('supplier'));
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
        }
        catch (error) {
            console.error('PostgreSQL structure check failed:', error);
            return {
                hasStructure: false,
                tables: [],
                message: `Fehler bei der Strukturprüfung: ${error.message}`
            };
        }
    }
    async createStructure(config) {
        try {
            if (!this.validateConfig(config)) {
                return {
                    success: false,
                    message: 'Ungültige Konfiguration',
                    tablesCreated: []
                };
            }
            const testPool = new pg_1.Pool({
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
            await client.query('BEGIN');
            try {
                const tablesCreated = [];
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
                await client.query('COMMIT');
                client.release();
                await testPool.end();
                return {
                    success: true,
                    message: `Datenbankstruktur erfolgreich erstellt (${tablesCreated.length} Tabellen)`,
                    tablesCreated
                };
            }
            catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        }
        catch (error) {
            console.error('PostgreSQL structure creation failed:', error);
            return {
                success: false,
                message: `Fehler bei der Strukturerstellung: ${error.message}`,
                tablesCreated: []
            };
        }
    }
    async updateSchema(config) {
        try {
            console.log('updateSchema called with config:', {
                host: config.host,
                port: config.port,
                database: config.database,
                username: config.username,
                hasPassword: !!config.password
            });
            if (!this.validateConfig(config)) {
                console.log('Config validation failed');
                return {
                    success: false,
                    message: 'Ungültige Konfiguration',
                    columnsAdded: []
                };
            }
            const testPool = new pg_1.Pool({
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
            await client.query('BEGIN');
            try {
                const columnsAdded = [];
                console.log('🔧 Starte kritische Schema-Migration...');
                try {
                    await client.query('CREATE TABLE IF NOT EXISTS articles_backup AS SELECT * FROM articles');
                    await client.query('CREATE TABLE IF NOT EXISTS suppliers_backup AS SELECT * FROM suppliers');
                    await client.query('CREATE TABLE IF NOT EXISTS recipes_backup AS SELECT * FROM recipes');
                    console.log('✅ Backup-Tabellen erstellt');
                }
                catch (error) {
                    console.log('⚠️ Backup-Tabellen konnten nicht erstellt werden (wahrscheinlich existieren die Tabellen noch nicht)');
                }
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
                console.log('🔨 Erstelle neue Tabellen mit korrektem Schema...');
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
            }
            catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        }
        catch (error) {
            console.error('PostgreSQL schema update failed:', error);
            return {
                success: false,
                message: `Fehler bei der Schema-Aktualisierung: ${error.message}`,
                columnsAdded: []
            };
        }
    }
    async syncData(config, data) {
        try {
            if (!this.validateConfig(config)) {
                return {
                    success: false,
                    message: 'Ungültige Konfiguration',
                    syncedTables: [],
                    recordsSynced: 0
                };
            }
            const testPool = new pg_1.Pool({
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
            await client.query('BEGIN');
            try {
                const syncedTables = [];
                let recordsSynced = 0;
                const articleIdMapping = {};
                const supplierIdMapping = {};
                if (data.suppliers && Array.isArray(data.suppliers)) {
                    await client.query('DELETE FROM suppliers');
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
                        supplierIdMapping[supplier.id] = supplierResult.rows[0].id;
                        recordsSynced++;
                    }
                    syncedTables.push('suppliers');
                }
                if (data.articles && Array.isArray(data.articles)) {
                    await client.query('DELETE FROM articles');
                    for (const article of data.articles) {
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
                        articleIdMapping[article.id] = articleResult.rows[0].id;
                        recordsSynced++;
                    }
                    syncedTables.push('articles');
                }
                if (data.recipes && Array.isArray(data.recipes)) {
                    await client.query('DELETE FROM recipe_ingredients');
                    await client.query('DELETE FROM recipes');
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
                        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                            for (const ingredient of recipe.ingredients) {
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
                try {
                    await client.query(`
            INSERT INTO system_info (key, value, description) 
            VALUES ('last_sync', CURRENT_TIMESTAMP::text, 'Letzte Datensynchronisation')
            ON CONFLICT (key) DO UPDATE SET 
              value = EXCLUDED.value,
              updated_at = CURRENT_TIMESTAMP
          `);
                }
                catch (error) {
                    console.log('system_info Tabelle nicht verfügbar, überspringe Update');
                }
                await client.query('COMMIT');
                client.release();
                await testPool.end();
                return {
                    success: true,
                    message: `Daten erfolgreich synchronisiert (${recordsSynced} Datensätze in ${syncedTables.length} Tabellen)`,
                    syncedTables,
                    recordsSynced
                };
            }
            catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        }
        catch (error) {
            console.error('PostgreSQL data sync failed:', error);
            return {
                success: false,
                message: `Fehler bei der Datensynchronisation: ${error.message}`,
                syncedTables: [],
                recordsSynced: 0
            };
        }
    }
    validateConfig(config) {
        console.log('validateConfig called with:', {
            hasHost: !!config.host,
            hasPort: !!config.port,
            hasDatabase: !!config.database,
            hasUsername: !!config.username,
            hasPassword: !!config.password,
            portValue: config.port,
            portValid: config.port >= 1 && config.port <= 65535
        });
        const isValid = !!(config.host &&
            config.port &&
            config.database &&
            config.username &&
            config.password &&
            config.port >= 1 &&
            config.port <= 65535);
        console.log('validateConfig result:', isValid);
        return isValid;
    }
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
    async checkAndUpdateSchema(config) {
        try {
            console.log('🔍 Prüfe Datenbankschema auf Abweichungen...');
            const testPool = new pg_1.Pool({
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
            const changes = [];
            try {
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
                for (const [tableName, expectedColumns] of Object.entries(currentSchema)) {
                    console.log(`🔍 Prüfe Tabelle: ${tableName}`);
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
                    const existingColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);
                    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
                    for (const [columnName, columnDef] of Object.entries(expectedColumns)) {
                        if (!existingColumnNames.includes(columnName)) {
                            console.log(`➕ Spalte ${columnName} fehlt in ${tableName} - füge hinzu...`);
                            await client.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef.type}`);
                            changes.push(`Spalte ${columnName} zu ${tableName} hinzugefügt`);
                        }
                    }
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
                }
                else {
                    console.log('✅ Schema ist aktuell - keine Änderungen erforderlich');
                    return {
                        success: true,
                        message: 'Schema ist aktuell - keine Änderungen erforderlich',
                        changes: []
                    };
                }
            }
            catch (error) {
                client.release();
                await testPool.end();
                throw error;
            }
        }
        catch (error) {
            console.error('❌ Fehler bei der Schema-Prüfung:', error);
            return {
                success: false,
                message: `Fehler bei der Schema-Prüfung: ${error.message}`,
                changes: []
            };
        }
    }
    async createTable(client, tableName, columns) {
        const columnDefinitions = Object.entries(columns)
            .map(([name, def]) => `${name} ${def.type}`)
            .join(', ');
        const createQuery = `CREATE TABLE ${tableName} (${columnDefinitions})`;
        await client.query(createQuery);
    }
}
exports.PostgresService = PostgresService;
exports.postgresService = new PostgresService();
//# sourceMappingURL=postgresService.js.map