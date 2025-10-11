const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL Konfiguration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chef_numbers',
  user: process.env.DB_USER || 'chef',
  password: process.env.DB_PASSWORD || 'password',
};

async function fixDatabaseSchema() {
  const pool = new Pool(config);
  
  try {
    console.log('🔧 Starte Schema-Migration...');
    
    // Verbinde zur Datenbank
    const client = await pool.connect();
    console.log('✅ Verbindung zur Datenbank hergestellt');
    
    // Lese das SQL-Script
    const sqlPath = path.join(__dirname, 'fix-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Führe das Script aus
    console.log('🔧 Führe Schema-Migration aus...');
    await client.query(sqlContent);
    
    console.log('✅ Schema-Migration erfolgreich abgeschlossen!');
    console.log('📋 Neue Tabellen-Struktur:');
    console.log('   - suppliers: id SERIAL PRIMARY KEY');
    console.log('   - articles: id SERIAL PRIMARY KEY, supplier_id INTEGER');
    console.log('   - recipes: id SERIAL PRIMARY KEY');
    console.log('   - Alle Referenzen sind jetzt INTEGER');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Fehler bei der Schema-Migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Führe die Migration aus
fixDatabaseSchema()
  .then(() => {
    console.log('🎉 Schema-Migration abgeschlossen!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema-Migration fehlgeschlagen:', error);
    process.exit(1);
  });
