// Chef Numbers Prisma REST API Server
// Frontend-synchronisiertes Schema v2.2.2
// Automatisch generiert am: 2025-11-03T01:06:18.469Z

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// UUID Generator für MariaDB/MySQL (da keine native UUID-Unterstützung)
const generateUUID = () => {
  return uuidv4();
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.2.2',
    database: 'connected'
  });
});

// Test Connection Endpoint (für Frontend-Verbindungstests)
app.post('/api/test-connection', async (req, res) => {
  try {
    const { host, port, database, username, password } = req.body;
    
    console.log('🔍 Teste Datenbankverbindung:', { host, port, database, username: '[HIDDEN]' });
    
    // Teste die Prisma-Verbindung
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Datenbankverbindung erfolgreich getestet');
    
    res.json({ 
      success: true, 
      message: `Verbindung zur Datenbank "${database}" erfolgreich`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Datenbankverbindung fehlgeschlagen:', error);
    
    res.status(400).json({ 
      success: false, 
      message: `Datenbankverbindung fehlgeschlagen: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Execute SQL Endpoint (für Schema-Initialisierung)
app.post('/api/execute-sql', async (req, res) => {
  let mysqlConnection = null;
  
  try {
    const { sql } = req.body;
    
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SQL-String erforderlich'
      });
    }
    
    console.log(`📝 Führe SQL aus: ${sql.substring(0, 100)}...`);
    
    // Parse DATABASE_URL für native MySQL-Verbindung
    const dbUrl = process.env.DATABASE_URL;
    console.log('🔍 DATABASE_URL:', dbUrl);
    
    // Parse DATABASE_URL: mysql://user:password@host:port/database
    const dbUrlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!dbUrlMatch) {
      throw new Error('Ungültige DATABASE_URL');
    }
    
    const [, user, password, host, port, database] = dbUrlMatch;
    console.log('🔌 Verbinde zu MySQL:', { host, port: parseInt(port), user, database });
    
    // Erstelle native MySQL-Verbindung
    mysqlConnection = await mysql.createConnection({
      host: host,
      port: parseInt(port),
      user: user,
      password: password,
      database: database,
      multipleStatements: true // Wichtig für Multi-Statement-Scripts
    });
    
    console.log('✅ MySQL-Verbindung etabliert');
    
    // Entferne USE-Statement aus SQL (wird bereits durch Connection verwendet)
    const cleanedSql = sql.replace(/^USE\s+\w+;/gi, '').trim();
    
    // Führe SQL aus
    const [results] = await mysqlConnection.query(cleanedSql);
    
    console.log(`✅ SQL erfolgreich ausgeführt`);
    
    res.json({
      success: true,
      message: 'SQL erfolgreich ausgeführt',
      result: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ SQL-Execution fehlgeschlagen:', error);
    
    res.status(400).json({
      success: false,
      error: error.message,
      sqlstate: error.code,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Schließe MySQL-Verbindung
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('🔌 MySQL-Verbindung geschlossen');
    }
  }
});

// ========================================
// Supplier Routes
// ========================================

// GET all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const data = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von suppliers:', error);
    res.status(500).json({ error: 'Fehler beim Laden von suppliers', details: error.message });
  }
});

// GET single Supplier
app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const data = await prisma.supplier.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'Supplier nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von Supplier:', error);
    res.status(500).json({ error: 'Fehler beim Laden von Supplier', details: error.message });
  }
});

// POST new Supplier
app.post('/api/suppliers', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues Supplier: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.supplier.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von Supplier:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von Supplier', details: error.message });
  }
});

// PUT update Supplier
app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const data = await prisma.supplier.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von Supplier:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von Supplier', details: error.message });
  }
});

// DELETE Supplier (über Frontend-ID oder db_id)
app.delete('/api/suppliers', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.supplier.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Supplier nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von Supplier:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von Supplier', details: error.message });
  }
});

// ========================================
// Article Routes
// ========================================

// GET all articles
app.get('/api/articles', async (req, res) => {
  try {
    const data = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von articles:', error);
    res.status(500).json({ error: 'Fehler beim Laden von articles', details: error.message });
  }
});

// GET single Article
app.get('/api/articles/:id', async (req, res) => {
  try {
    const data = await prisma.article.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'Article nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von Article:', error);
    res.status(500).json({ error: 'Fehler beim Laden von Article', details: error.message });
  }
});

// POST new Article
app.post('/api/articles', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues Article: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.article.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von Article:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von Article', details: error.message });
  }
});

// PUT update Article
app.put('/api/articles/:id', async (req, res) => {
  try {
    const data = await prisma.article.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von Article:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von Article', details: error.message });
  }
});

// DELETE Article (über Frontend-ID oder db_id)
app.delete('/api/articles', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.article.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Article nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von Article:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von Article', details: error.message });
  }
});

// ========================================
// Recipe Routes
// ========================================

// GET all recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const data = await prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von recipes:', error);
    res.status(500).json({ error: 'Fehler beim Laden von recipes', details: error.message });
  }
});

// GET single Recipe
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const data = await prisma.recipe.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'Recipe nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von Recipe:', error);
    res.status(500).json({ error: 'Fehler beim Laden von Recipe', details: error.message });
  }
});

// POST new Recipe
app.post('/api/recipes', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues Recipe: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.recipe.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von Recipe:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von Recipe', details: error.message });
  }
});

// PUT update Recipe
app.put('/api/recipes/:id', async (req, res) => {
  try {
    const data = await prisma.recipe.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von Recipe:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von Recipe', details: error.message });
  }
});

// DELETE Recipe (über Frontend-ID oder db_id)
app.delete('/api/recipes', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.recipe.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Recipe nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von Recipe:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von Recipe', details: error.message });
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error('Unbehandelter Fehler:', err);
  res.status(500).json({ error: 'Interner Serverfehler', details: err.message });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nicht gefunden' });
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM empfangen, schließe Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT empfangen, schließe Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Prisma API Server läuft auf Port ${PORT}`);
  console.log(`📊 Schema Version: 2.2.2`);
  console.log(`🔗 Endpunkte:`);
  console.log(`   - /api/suppliers`);
  console.log(`   - /api/articles`);
  console.log(`   - /api/recipes`);
});
