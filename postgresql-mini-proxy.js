const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PostgreSQL-Mini-Proxy', timestamp: new Date().toISOString() });
});

// PostgreSQL Connection Test
app.post('/api/postgres/test', async (req, res) => {
  const { host, port, database, username, password, ssl = false } = req.body;
  
  try {
    console.log(`🔍 Teste PostgreSQL-Verbindung zu ${host}:${port}/${database}`);
    
    const pool = new Pool({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 1
    });

    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    await pool.end();

    console.log(`✅ PostgreSQL-Verbindung erfolgreich`);
    res.json({
      success: true,
      message: 'PostgreSQL-Verbindung erfolgreich',
      version: result.rows[0].version,
      database: database,
      host: host,
      port: port
    });

  } catch (error) {
    console.error(`❌ PostgreSQL-Verbindung fehlgeschlagen:`, error.message);
    res.status(500).json({
      success: false,
      message: `Verbindungsfehler: ${error.message}`,
      error: error.message
    });
  }
});

// Check Database Exists
app.post('/api/postgres/check-db', async (req, res) => {
  const { host, port, database, username, password, ssl = false } = req.body;
  
  try {
    console.log(`🔍 Prüfe PostgreSQL-Datenbankexistenz: ${database}`);
    
    const pool = new Pool({
      host,
      port: parseInt(port),
      database: 'postgres', // Verwende Standard-Datenbank für die Prüfung
      user: username,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 1
    });

    const client = await pool.connect();
    
    // Prüfe ob die Ziel-Datenbank existiert
    const dbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbResult = await client.query(dbQuery, [database]);
    const exists = dbResult.rows.length > 0;

    let tables = [];
    let size = '0 MB';
    let lastModified = null;

    if (exists) {
      // Hole Tabellen-Liste
      const tablesResult = await client.query(`
        SELECT table_name, 
               pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
               pg_stat_get_last_analyze(oid) as last_analyze
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      tables = tablesResult.rows.map(row => row.table_name);
      
      // Berechne Gesamtgröße
      const sizeResult = await client.query(`SELECT pg_size_pretty(pg_database_size($1)) as db_size`, [database]);
      size = sizeResult.rows[0].db_size;
      
      lastModified = tablesResult.rows[0]?.last_analyze || new Date();
    }

    client.release();
    await pool.end();

    console.log(`✅ Datenbankprüfung erfolgreich: ${database} existiert = ${exists}`);
    res.json({
      exists,
      tables,
      size,
      lastModified: lastModified?.toISOString()
    });

  } catch (error) {
    console.error(`❌ Datenbankprüfung fehlgeschlagen:`, error.message);
    res.status(500).json({
      success: false,
      message: `Datenbankprüfung fehlgeschlagen: ${error.message}`,
      error: error.message
    });
  }
});

// Create Database
app.post('/api/postgres/create-db', async (req, res) => {
  const { host, port, database, username, password, ssl = false } = req.body;
  
  try {
    console.log(`🔍 Erstelle PostgreSQL-Datenbank: ${database}`);
    
    const pool = new Pool({
      host,
      port: parseInt(port),
      database: 'postgres', // Verwende Standard-Datenbank für die Erstellung
      user: username,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 1
    });

    const client = await pool.connect();
    
    // Prüfe zuerst ob die Datenbank bereits existiert
    const checkQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const checkResult = await client.query(checkQuery, [database]);
    
    if (checkResult.rows.length > 0) {
      client.release();
      await pool.end();
      return res.json({
        success: true,
        message: `Datenbank '${database}' existiert bereits`,
        database: database,
        created: new Date().toISOString()
      });
    }

    // Erstelle die Datenbank
    const createQuery = `CREATE DATABASE "${database}"`;
    await client.query(createQuery);

    client.release();
    await pool.end();

    console.log(`✅ Datenbankerstellung erfolgreich: ${database}`);
    res.json({
      success: true,
      message: `Datenbank '${database}' erfolgreich erstellt`,
      database: database,
      created: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Datenbankerstellung fehlgeschlagen:`, error.message);
    res.status(500).json({
      success: false,
      message: `Datenbankerstellung fehlgeschlagen: ${error.message}`,
      error: error.message
    });
  }
});

// Check Structure
app.post('/api/postgres/check-structure', async (req, res) => {
  const { host, port, database, username, password, ssl = false } = req.body;
  
  try {
    console.log(`🔍 Prüfe PostgreSQL-Datenbankstruktur: ${database}`);
    
    const pool = new Pool({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 1
    });

    const client = await pool.connect();
    
    // Prüfe ob Chef's Numbers Tabellen existieren
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('articles', 'suppliers', 'recipes', 'design', 'einkaufs_liste', 'inventur_liste')
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    const hasStructure = tables.length > 0;
    
    let columns = {};
    let indexes = {};
    
    if (hasStructure) {
      // Hole Spalten-Informationen
      for (const table of tables) {
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        columns[table] = columnsResult.rows.map(row => `${row.column_name} (${row.data_type})`);
        
        // Hole Index-Informationen
        const indexesResult = await client.query(`
          SELECT indexname, indexdef
          FROM pg_indexes 
          WHERE schemaname = 'public' AND tablename = $1
        `, [table]);
        
        indexes[table] = indexesResult.rows.map(row => row.indexname);
      }
    }
    
    client.release();
    await pool.end();

    console.log(`✅ Strukturprüfung erfolgreich: ${database} hat Struktur = ${hasStructure}`);
    res.json({
      hasStructure,
      tables,
      columns,
      indexes,
      tableCount: tables.length
    });

  } catch (error) {
    console.error(`❌ Strukturprüfung fehlgeschlagen:`, error.message);
    res.status(500).json({
      success: false,
      message: `Strukturprüfung fehlgeschlagen: ${error.message}`,
      error: error.message
    });
  }
});

// Create Structure
app.post('/api/postgres/create-structure', async (req, res) => {
  const { host, port, database, username, password, ssl = false } = req.body;
  
  try {
    console.log(`🔍 Erstelle PostgreSQL-Datenbankstruktur: ${database}`);
    
    const pool = new Pool({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 1
    });

    const client = await pool.connect();
    
    // Erstelle Chef's Numbers Tabellen
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

      -- Create Indexes
      CREATE INDEX IF NOT EXISTS idx_articles_supplier_id ON articles(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
      CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
      CREATE INDEX IF NOT EXISTS idx_einkaufs_liste_status ON einkaufs_liste(status);
      CREATE INDEX IF NOT EXISTS idx_inventur_liste_kategorie ON inventur_liste(kategorie);
    `;
    
    await client.query(createTablesSQL);
    
    client.release();
    await pool.end();

    console.log(`✅ Strukturerstellung erfolgreich: ${database}`);
    res.json({
      success: true,
      message: `Datenbankstruktur für '${database}' wurde erfolgreich erstellt`,
      tables: ['articles', 'suppliers', 'recipes', 'design', 'einkaufs_liste', 'inventur_liste'],
      created: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Strukturerstellung fehlgeschlagen:`, error.message);
    res.status(500).json({
      success: false,
      message: `Strukturerstellung fehlgeschlagen: ${error.message}`,
      error: error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 PostgreSQL-Mini-Proxy läuft auf Port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Endpoints:`);
  console.log(`   POST /api/postgres/test`);
  console.log(`   POST /api/postgres/check-db`);
  console.log(`   POST /api/postgres/create-db`);
  console.log(`   POST /api/postgres/check-structure`);
  console.log(`   POST /api/postgres/create-structure`);
});

module.exports = app;
