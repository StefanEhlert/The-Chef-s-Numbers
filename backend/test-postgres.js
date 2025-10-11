const { postgresService } = require('./dist/services/postgresService');

// Test-Konfiguration (anpassen an Ihre lokale PostgreSQL-Instanz)
const testConfig = {
  host: 'localhost',
  port: 5432,
  database: 'chef_numbers_test',
  username: 'postgres',
  password: 'your_password_here'
};

async function testPostgresService() {
  console.log('🧪 Teste PostgreSQL-Service...\n');

  try {
    // 1. Verbindungstest
    console.log('1️⃣ Teste Verbindung...');
    const connectionResult = await postgresService.testConnection(testConfig);
    console.log('Verbindungstest Ergebnis:', connectionResult);
    console.log('');

    if (connectionResult.success) {
      // 2. Strukturprüfung
      console.log('2️⃣ Prüfe Datenbankstruktur...');
      const structureResult = await postgresService.checkStructure(testConfig);
      console.log('Strukturprüfung Ergebnis:', structureResult);
      console.log('');

      // 3. Strukturerstellung (nur wenn keine Struktur vorhanden)
      if (!structureResult.hasStructure) {
        console.log('3️⃣ Erstelle Datenbankstruktur...');
        const creationResult = await postgresService.createStructure(testConfig);
        console.log('Strukturerstellung Ergebnis:', creationResult);
        console.log('');
      } else {
        console.log('3️⃣ Datenbankstruktur bereits vorhanden, überspringe Erstellung');
        console.log('');
      }

      // 4. Erneute Strukturprüfung
      console.log('4️⃣ Prüfe Datenbankstruktur nach Erstellung...');
      const finalStructureResult = await postgresService.checkStructure(testConfig);
      console.log('Finale Strukturprüfung Ergebnis:', finalStructureResult);
      console.log('');

    } else {
      console.log('❌ Verbindung fehlgeschlagen, überspringe weitere Tests');
    }

  } catch (error) {
    console.error('❌ Fehler beim Testen des PostgreSQL-Services:', error);
  } finally {
    // Schließe alle Verbindungen
    await postgresService.close();
    console.log('🔒 Alle Verbindungen geschlossen');
  }
}

// Führe Tests aus
testPostgresService();
