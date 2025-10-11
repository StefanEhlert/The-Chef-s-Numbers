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

async function testConnection() {
  try {
    console.log('Versuche Verbindung zur Datenbank...');
    await client.connect();
    console.log(' Verbindung erfolgreich!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Datenbank-Zeit:', result.rows[0].now);
    
    await client.end();
    console.log('Verbindung geschlossen.');
  } catch (error) {
    console.error(' Verbindungsfehler:', error.message);
    console.error('Details:', error);
  }
}

testConnection();