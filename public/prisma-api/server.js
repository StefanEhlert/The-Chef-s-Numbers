const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000 // Maximal 1000 Requests pro IP
});
app.use(limiter);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Test Connection Endpoint (für Verbindungstests)
app.post('/api/test-connection', async (req, res) => {
  try {
    const { host, port, database, username, password } = req.body;
    
    console.log('🔍 Teste Datenbankverbindung:', { host, port, database, username: '[HIDDEN]' });
    
    // Teste die Verbindung mit den übergebenen Credentials
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: `mysql://${username}:${password}@${host}:${port}/${database}`
        }
      }
    });
    
    // Teste die Verbindung
    await testPrisma.$connect();
    
    // Teste eine einfache Abfrage
    await testPrisma.$queryRaw`SELECT 1 as test`;
    
    // Schließe die Test-Verbindung
    await testPrisma.$disconnect();
    
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

// API Routes
app.get('/api/artikel', authenticateToken, async (req, res) => {
  try {
    const artikel = await prisma.artikel.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(artikel);
  } catch (error) {
    console.error('Fehler beim Laden der Artikel:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Artikel' });
  }
});

app.post('/api/artikel', authenticateToken, async (req, res) => {
  try {
    const artikel = await prisma.artikel.create({
      data: req.body
    });
    res.status(201).json(artikel);
  } catch (error) {
    console.error('Fehler beim Erstellen des Artikels:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Artikels' });
  }
});

app.put('/api/artikel/:id', authenticateToken, async (req, res) => {
  try {
    const artikel = await prisma.artikel.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(artikel);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Artikels:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Artikels' });
  }
});

app.delete('/api/artikel/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.artikel.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Fehler beim Löschen des Artikels:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Artikels' });
  }
});

// Rezepte Routes
app.get('/api/rezepte', authenticateToken, async (req, res) => {
  try {
    const rezepte = await prisma.rezepte.findMany({
      include: {
        rezeptZutaten: {
          include: {
            artikel: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(rezepte);
  } catch (error) {
    console.error('Fehler beim Laden der Rezepte:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Rezepte' });
  }
});

app.post('/api/rezepte', authenticateToken, async (req, res) => {
  try {
    const rezept = await prisma.rezepte.create({
      data: req.body
    });
    res.status(201).json(rezept);
  } catch (error) {
    console.error('Fehler beim Erstellen des Rezepts:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Rezepts' });
  }
});

// Lieferanten Routes
app.get('/api/lieferanten', authenticateToken, async (req, res) => {
  try {
    const lieferanten = await prisma.lieferanten.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(lieferanten);
  } catch (error) {
    console.error('Fehler beim Laden der Lieferanten:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Lieferanten' });
  }
});

app.post('/api/lieferanten', authenticateToken, async (req, res) => {
  try {
    const lieferant = await prisma.lieferanten.create({
      data: req.body
    });
    res.status(201).json(lieferant);
  } catch (error) {
    console.error('Fehler beim Erstellen des Lieferanten:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Lieferanten' });
  }
});

// Einkauf Routes
app.get('/api/einkauf', authenticateToken, async (req, res) => {
  try {
    const einkauf = await prisma.einkauf.findMany({
      include: {
        artikel: true,
        lieferant: true
      },
      orderBy: { datum: 'desc' }
    });
    res.json(einkauf);
  } catch (error) {
    console.error('Fehler beim Laden der Einkäufe:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Einkäufe' });
  }
});

app.post('/api/einkauf', authenticateToken, async (req, res) => {
  try {
    const einkauf = await prisma.einkauf.create({
      data: req.body
    });
    res.status(201).json(einkauf);
  } catch (error) {
    console.error('Fehler beim Erstellen des Einkaufs:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Einkaufs' });
  }
});

// Inventur Routes
app.get('/api/inventur', authenticateToken, async (req, res) => {
  try {
    const inventur = await prisma.inventur.findMany({
      include: {
        artikel: true
      },
      orderBy: { datum: 'desc' }
    });
    res.json(inventur);
  } catch (error) {
    console.error('Fehler beim Laden der Inventur:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Inventur' });
  }
});

app.post('/api/inventur', authenticateToken, async (req, res) => {
  try {
    const inventur = await prisma.inventur.create({
      data: req.body
    });
    res.status(201).json(inventur);
  } catch (error) {
    console.error('Fehler beim Erstellen der Inventur:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Inventur' });
  }
});

// Kalkulation Routes
app.get('/api/kalkulation', authenticateToken, async (req, res) => {
  try {
    const kalkulation = await prisma.kalkulation.findMany({
      include: {
        rezept: true
      },
      orderBy: { datum: 'desc' }
    });
    res.json(kalkulation);
  } catch (error) {
    console.error('Fehler beim Laden der Kalkulationen:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kalkulationen' });
  }
});

app.post('/api/kalkulation', authenticateToken, async (req, res) => {
  try {
    const kalkulation = await prisma.kalkulation.create({
      data: req.body
    });
    res.status(201).json(kalkulation);
  } catch (error) {
    console.error('Fehler beim Erstellen der Kalkulation:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Kalkulation' });
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error('Unbehandelter Fehler:', err);
  res.status(500).json({ error: 'Interner Serverfehler' });
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
  console.log(`📊 Datenbank: MariaDB`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Gesetzt' : 'Nicht gesetzt'}`);
});
