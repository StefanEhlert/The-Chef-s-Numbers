const { Pool } = require('pg');

// Datenbankverbindung konfigurieren
const pool = new Pool({
  user: 'chef',
  host: '192.168.1.7', // PostgreSQL läuft auf dem NAS
  database: 'chef_numbers',
  password: 'password',
  port: 5432,
});

async function cleanupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starte Datenbankbereinigung...');
    
    // 1. Artikel bereinigen - entferne Duplikate basierend auf name und supplier_id
    console.log('📦 Bereinige Artikel...');
    const articlesResult = await client.query(`
      DELETE FROM articles 
      WHERE id NOT IN (
        SELECT DISTINCT ON (name, supplier_id) id 
        FROM articles 
        ORDER BY name, supplier_id, "created_at" DESC
      );
    `);
    console.log(`✅ ${articlesResult.rowCount} doppelte Artikel entfernt`);
    
    // 2. Lieferanten bereinigen - entferne Duplikate basierend auf name
    console.log('👥 Bereinige Lieferanten...');
    const suppliersResult = await client.query(`
      DELETE FROM suppliers 
      WHERE id NOT IN (
        SELECT DISTINCT ON (name) id 
        FROM suppliers 
        ORDER BY name, "created_at" DESC
      );
    `);
    console.log(`✅ ${suppliersResult.rowCount} doppelte Lieferanten entfernt`);
    
    // 3. Rezepte bereinigen - entferne Duplikate basierend auf name
    console.log('🍳 Bereinige Rezepte...');
    const recipesResult = await client.query(`
      DELETE FROM recipes 
      WHERE id NOT IN (
        SELECT DISTINCT ON (name) id 
        FROM recipes 
        ORDER BY name, "created_at" DESC
      );
    `);
    console.log(`✅ ${recipesResult.rowCount} doppelte Rezepte entfernt`);
    
    // 4. Zeige aktuelle Anzahl
    const articlesCount = await client.query('SELECT COUNT(*) FROM articles');
    const suppliersCount = await client.query('SELECT COUNT(*) FROM suppliers');
    const recipesCount = await client.query('SELECT COUNT(*) FROM recipes');
    
    console.log('\n📊 Aktuelle Datenbankgröße:');
    console.log(`   Artikel: ${articlesCount.rows[0].count}`);
    console.log(`   Lieferanten: ${suppliersCount.rows[0].count}`);
    console.log(`   Rezepte: ${recipesCount.rows[0].count}`);
    
    console.log('\n✅ Datenbankbereinigung abgeschlossen!');
    
  } catch (error) {
    console.error('❌ Fehler bei der Datenbankbereinigung:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Skript ausführen
cleanupDatabase().catch(console.error);
