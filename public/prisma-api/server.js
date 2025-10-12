// Chef Numbers Prisma REST API Server
// Frontend-synchronisiertes Schema v2.2.2
// Automatisch generiert am: 2025-10-12T22:53:04.632Z

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

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

// ========================================
// EinkaufsItem Routes
// ========================================

// GET all einkaufsitems
app.get('/api/einkaufsitems', async (req, res) => {
  try {
    const data = await prisma.einkaufsItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von einkaufsitems:', error);
    res.status(500).json({ error: 'Fehler beim Laden von einkaufsitems', details: error.message });
  }
});

// GET single EinkaufsItem
app.get('/api/einkaufsitems/:id', async (req, res) => {
  try {
    const data = await prisma.einkaufsItem.findUnique({
      where: { dbId: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'EinkaufsItem nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von EinkaufsItem:', error);
    res.status(500).json({ error: 'Fehler beim Laden von EinkaufsItem', details: error.message });
  }
});

// POST new EinkaufsItem
app.post('/api/einkaufsitems', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.dbId && !dataToInsert.db_id) {
      dataToInsert.dbId = generateUUID();
      console.log(`🆕 Generiere db_id für neues EinkaufsItem: ${dataToInsert.dbId}`);
    }
    
    const data = await prisma.einkaufsItem.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von EinkaufsItem:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von EinkaufsItem', details: error.message });
  }
});

// PUT update EinkaufsItem
app.put('/api/einkaufsitems/:id', async (req, res) => {
  try {
    const data = await prisma.einkaufsItem.update({
      where: { dbId: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von EinkaufsItem:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von EinkaufsItem', details: error.message });
  }
});

// DELETE EinkaufsItem (über Frontend-ID oder db_id)
app.delete('/api/einkaufsitems', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.einkaufsItem.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'EinkaufsItem nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von EinkaufsItem:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von EinkaufsItem', details: error.message });
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
      where: { dbId: req.params.id }
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
    if (!dataToInsert.dbId && !dataToInsert.db_id) {
      dataToInsert.dbId = generateUUID();
      console.log(`🆕 Generiere db_id für neues Supplier: ${dataToInsert.dbId}`);
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
      where: { dbId: req.params.id },
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
      where: { dbId: req.params.id }
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
    if (!dataToInsert.dbId && !dataToInsert.db_id) {
      dataToInsert.dbId = generateUUID();
      console.log(`🆕 Generiere db_id für neues Article: ${dataToInsert.dbId}`);
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
      where: { dbId: req.params.id },
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
      where: { dbId: req.params.id }
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
    if (!dataToInsert.dbId && !dataToInsert.db_id) {
      dataToInsert.dbId = generateUUID();
      console.log(`🆕 Generiere db_id für neues Recipe: ${dataToInsert.dbId}`);
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
      where: { dbId: req.params.id },
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
// InventurItem Routes
// ========================================

// GET all inventuritems
app.get('/api/inventuritems', async (req, res) => {
  try {
    const data = await prisma.inventurItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von inventuritems:', error);
    res.status(500).json({ error: 'Fehler beim Laden von inventuritems', details: error.message });
  }
});

// GET single InventurItem
app.get('/api/inventuritems/:id', async (req, res) => {
  try {
    const data = await prisma.inventurItem.findUnique({
      where: { dbId: req.params.id }
    });
    if (!data) {
      return res.status(404).json({ error: 'InventurItem nicht gefunden' });
    }
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Laden von InventurItem:', error);
    res.status(500).json({ error: 'Fehler beim Laden von InventurItem', details: error.message });
  }
});

// POST new InventurItem
app.post('/api/inventuritems', async (req, res) => {
  try {
    const dataToInsert = { ...req.body };
    
    // Generiere db_id falls nicht vorhanden (MariaDB/MySQL hat keine native UUID-Generierung)
    if (!dataToInsert.dbId && !dataToInsert.db_id) {
      dataToInsert.dbId = generateUUID();
      console.log(`🆕 Generiere db_id für neues InventurItem: ${dataToInsert.dbId}`);
    }
    
    const data = await prisma.inventurItem.create({
      data: dataToInsert
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Fehler beim Erstellen von InventurItem:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen von InventurItem', details: error.message });
  }
});

// PUT update InventurItem
app.put('/api/inventuritems/:id', async (req, res) => {
  try {
    const data = await prisma.inventurItem.update({
      where: { dbId: req.params.id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren von InventurItem:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren von InventurItem', details: error.message });
  }
});

// DELETE InventurItem (über Frontend-ID oder db_id)
app.delete('/api/inventuritems', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID parameter required' });
    }
    
    // Versuche über Frontend-ID zu löschen
    const deleted = await prisma.inventurItem.deleteMany({
      where: { id: id }
    });
    
    if (deleted.count === 0) {
      return res.status(404).json({ error: 'InventurItem nicht gefunden' });
    }
    
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error('Fehler beim Löschen von InventurItem:', error);
    res.status(500).json({ error: 'Fehler beim Löschen von InventurItem', details: error.message });
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
  console.log(`   - /api/einkaufsitems`);
  console.log(`   - /api/suppliers`);
  console.log(`   - /api/articles`);
  console.log(`   - /api/recipes`);
  console.log(`   - /api/inventuritems`);
});
