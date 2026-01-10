// Chef Numbers Prisma REST API Server
// Frontend-synchronisiertes Schema v2.2.2
// Automatisch generiert am: 2026-01-09T13:47:35.287Z

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
// AccountingAccount Routes
// ========================================

// GET all accountingaccounts
app.get('/api/accountingaccounts', async (req, res) => {
  try {
    const data = await prisma.accountingAccount.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von accountingaccounts:', error);
    res.status(500).json({ error: 'Fehler beim Laden von accountingaccounts', details: error.message });
  }
});

// GET single AccountingAccount
app.get('/api/accountingaccounts/:id', async (req, res) => {
  try {
    const data = await prisma.accountingAccount.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'AccountingAccount nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von AccountingAccount:', error);
    res.status(500).json({ error: 'Fehler beim Laden von AccountingAccount', details: error.message });
  }
});

// POST new AccountingAccount
app.post('/api/accountingaccounts', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues AccountingAccount: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.accountingAccount.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von AccountingAccount:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von AccountingAccount', details: error.message });
  }
});

// PUT update AccountingAccount
app.put('/api/accountingaccounts/:id', async (req, res) => {
  try {
    const data = await prisma.accountingAccount.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von AccountingAccount:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von AccountingAccount', details: error.message });
  }
});

// DELETE AccountingAccount (über Frontend-ID oder db_id)
app.delete('/api/accountingaccounts', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.accountingAccount.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'AccountingAccount nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von AccountingAccount:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von AccountingAccount', details: error.message });
  }
});

// ========================================
// AccountingSettings Routes
// ========================================

// GET all accountingsettings
app.get('/api/accountingsettings', async (req, res) => {
  try {
    const data = await prisma.accountingSettings.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von accountingsettings:', error);
    res.status(500).json({ error: 'Fehler beim Laden von accountingsettings', details: error.message });
  }
});

// GET single AccountingSettings
app.get('/api/accountingsettings/:id', async (req, res) => {
  try {
    const data = await prisma.accountingSettings.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'AccountingSettings nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von AccountingSettings:', error);
    res.status(500).json({ error: 'Fehler beim Laden von AccountingSettings', details: error.message });
  }
});

// POST new AccountingSettings
app.post('/api/accountingsettings', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues AccountingSettings: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.accountingSettings.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von AccountingSettings:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von AccountingSettings', details: error.message });
  }
});

// PUT update AccountingSettings
app.put('/api/accountingsettings/:id', async (req, res) => {
  try {
    const data = await prisma.accountingSettings.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von AccountingSettings:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von AccountingSettings', details: error.message });
  }
});

// DELETE AccountingSettings (über Frontend-ID oder db_id)
app.delete('/api/accountingsettings', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.accountingSettings.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'AccountingSettings nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von AccountingSettings:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von AccountingSettings', details: error.message });
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
// UnitEntity Routes
// ========================================

// GET all unitentitys
app.get('/api/unitentitys', async (req, res) => {
  try {
    const data = await prisma.unitEntity.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von unitentitys:', error);
    res.status(500).json({ error: 'Fehler beim Laden von unitentitys', details: error.message });
  }
});

// GET single UnitEntity
app.get('/api/unitentitys/:id', async (req, res) => {
  try {
    const data = await prisma.unitEntity.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'UnitEntity nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von UnitEntity:', error);
    res.status(500).json({ error: 'Fehler beim Laden von UnitEntity', details: error.message });
  }
});

// POST new UnitEntity
app.post('/api/unitentitys', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues UnitEntity: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.unitEntity.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von UnitEntity:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von UnitEntity', details: error.message });
  }
});

// PUT update UnitEntity
app.put('/api/unitentitys/:id', async (req, res) => {
  try {
    const data = await prisma.unitEntity.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von UnitEntity:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von UnitEntity', details: error.message });
  }
});

// DELETE UnitEntity (über Frontend-ID oder db_id)
app.delete('/api/unitentitys', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.unitEntity.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'UnitEntity nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von UnitEntity:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von UnitEntity', details: error.message });
  }
});

// ========================================
// CategoryEntity Routes
// ========================================

// GET all categoryentitys
app.get('/api/categoryentitys', async (req, res) => {
  try {
    const data = await prisma.categoryEntity.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von categoryentitys:', error);
    res.status(500).json({ error: 'Fehler beim Laden von categoryentitys', details: error.message });
  }
});

// GET single CategoryEntity
app.get('/api/categoryentitys/:id', async (req, res) => {
  try {
    const data = await prisma.categoryEntity.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'CategoryEntity nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von CategoryEntity:', error);
    res.status(500).json({ error: 'Fehler beim Laden von CategoryEntity', details: error.message });
  }
});

// POST new CategoryEntity
app.post('/api/categoryentitys', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues CategoryEntity: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.categoryEntity.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von CategoryEntity:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von CategoryEntity', details: error.message });
  }
});

// PUT update CategoryEntity
app.put('/api/categoryentitys/:id', async (req, res) => {
  try {
    const data = await prisma.categoryEntity.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von CategoryEntity:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von CategoryEntity', details: error.message });
  }
});

// DELETE CategoryEntity (über Frontend-ID oder db_id)
app.delete('/api/categoryentitys', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.categoryEntity.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'CategoryEntity nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von CategoryEntity:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von CategoryEntity', details: error.message });
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

// ========================================
// Receipt Routes
// ========================================

// GET all receipts
app.get('/api/receipts', async (req, res) => {
  try {
    const data = await prisma.receipt.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von receipts:', error);
    res.status(500).json({ error: 'Fehler beim Laden von receipts', details: error.message });
  }
});

// GET single Receipt
app.get('/api/receipts/:id', async (req, res) => {
  try {
    const data = await prisma.receipt.findUnique({
      where: { db_id: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'Receipt nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von Receipt:', error);
    res.status(500).json({ error: 'Fehler beim Laden von Receipt', details: error.message });
  }
});

// POST new Receipt
app.post('/api/receipts', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.db_id) {
      dataToInsert.db_id = generateUUID();
      console.log(`🆕 Generiere db_id für neues Receipt: ${dataToInsert.db_id}`);
    }
    
    const data = await prisma.receipt.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von Receipt:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von Receipt', details: error.message });
  }
});

// PUT update Receipt
app.put('/api/receipts/:id', async (req, res) => {
  try {
    const data = await prisma.receipt.update({
      where: { db_id: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von Receipt:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von Receipt', details: error.message });
  }
});

// DELETE Receipt (über Frontend-ID oder db_id)
app.delete('/api/receipts', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.receipt.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Receipt nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von Receipt:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von Receipt', details: error.message });
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
  console.log(`   - /api/accountingaccounts`);
  console.log(`   - /api/accountingsettings`);
  console.log(`   - /api/suppliers`);
  console.log(`   - /api/unitentitys`);
  console.log(`   - /api/categoryentitys`);
  console.log(`   - /api/articles`);
  console.log(`   - /api/recipes`);
  console.log(`   - /api/receipts`);
});
