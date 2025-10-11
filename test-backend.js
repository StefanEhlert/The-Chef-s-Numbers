const { Client } = require('pg');

const client = new Client({
  host: '192.168.1.7',
  port: 5432,
  database: 'chef_numbers',
  user: 'chef',
  password: 'password',
  connectionTimeoutMillis: 10000,
  query_timeout: 10000
});

async function testBackendStorage() {
  try {
    console.log('🔌 Verbinde mit der Datenbank...');
    await client.connect();
    console.log('✅ Verbindung erfolgreich!');
    
    // Test-Daten einfügen
    console.log('\n📝 Füge Test-Daten ein...');
    
    // Test-Artikel einfügen
    const articleResult = await client.query(`
      INSERT INTO articles (name, category, unit, net_price, gross_price, vat_rate)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, net_price
    `, ['Test-Artikel', 'Test-Kategorie', 'Stück', 10.50, 12.50, 19.00]);
    
    console.log('✅ Artikel eingefügt:', articleResult.rows[0]);
    
    // Test-Lieferant einfügen
    const supplierResult = await client.query(`
      INSERT INTO suppliers (name, contact_person, email)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
    `, ['Test-Lieferant', 'Max Mustermann', 'test@lieferant.de']);
    
    console.log('✅ Lieferant eingefügt:', supplierResult.rows[0]);
    
    // Test-Rezept einfügen
    const recipeResult = await client.query(`
      INSERT INTO recipes (name, description, preparation_time, servings, net_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, net_price
    `, ['Test-Rezept', 'Ein leckeres Test-Rezept', 15, 4, 8.50]);
    
    console.log('✅ Rezept eingefügt:', recipeResult.rows[0]);
    
    // Alle Daten auslesen
    console.log('\n📊 Alle gespeicherten Daten:');
    
    const articles = await client.query('SELECT * FROM articles');
    console.log('📦 Artikel:', articles.rows.length, 'Datensätze');
    
    const suppliers = await client.query('SELECT * FROM suppliers');
    console.log('🏢 Lieferanten:', suppliers.rows.length, 'Datensätze');
    
    const recipes = await client.query('SELECT * FROM recipes');
    console.log('👨‍🍳 Rezepte:', recipes.rows.length, 'Datensätze');
    
    // Test-Daten löschen (optional)
    console.log('\n🧹 Lösche Test-Daten...');
    await client.query('DELETE FROM articles WHERE name = $1', ['Test-Artikel']);
    await client.query('DELETE FROM suppliers WHERE name = $1', ['Test-Lieferant']);
    await client.query('DELETE FROM recipes WHERE name = $1', ['Test-Rezept']);
    console.log('✅ Test-Daten gelöscht');
    
    await client.end();
    console.log('\n🎉 Test erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error('Details:', error);
  }
}

testBackendStorage();
