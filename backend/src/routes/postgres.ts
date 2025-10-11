import { Router, Request, Response } from 'express';
import { postgresService, PostgresConfig } from '../services/postgresService';

const router = Router();

/**
 * POST /api/test-postgres-connection
 * Testet die Verbindung zu einer PostgreSQL-Datenbank
 */
router.post('/test-postgres-connection', async (req: Request, res: Response) => {
  try {
    const config: PostgresConfig = req.body;

    // Validiere Request-Body
    if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein',
        required: ['host', 'port', 'database', 'username', 'password']
      });
    }

    // Validiere Port
    const port = parseInt(config.port.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
      });
    }

    // Teste Verbindung
    const result = await postgresService.testConnection({
      ...config,
      port
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        details: result.details
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        details: result.details
      });
    }

      } catch (error: any) {
      console.error('PostgreSQL connection test route error:', error);
      return res.status(500).json({
        success: false,
        message: 'Interner Server-Fehler beim Verbindungstest',
        error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
      });
    }
});

/**
 * POST /api/check-postgres-database
 * Prüft ob die PostgreSQL-Datenbank existiert
 */
router.post('/check-postgres-database', async (req: Request, res: Response) => {
  try {
    const config: PostgresConfig = req.body;

    // Validiere Request-Body
    if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
      });
    }

    // Validiere Port
    const port = parseInt(config.port.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
      });
    }

    // Prüfe Datenbankexistenz
    const result = await postgresService.checkDatabaseExists({
      ...config,
      port
    });

    return res.status(200).json({
      success: true,
      exists: result.exists,
      message: result.message
    });

  } catch (error: any) {
    console.error('PostgreSQL database check route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler bei der Datenbankprüfung',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * POST /api/create-postgres-database
 * Erstellt eine neue PostgreSQL-Datenbank
 */
router.post('/create-postgres-database', async (req: Request, res: Response) => {
  try {
    const config: PostgresConfig = req.body;

    // Validiere Request-Body
    if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
      });
    }

    // Validiere Port
    const port = parseInt(config.port.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
      });
    }

    // Erstelle Datenbank
    const result = await postgresService.createDatabase({
      ...config,
      port
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error: any) {
    console.error('PostgreSQL database creation route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler bei der Datenbankerstellung',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * POST /api/check-postgres-structure
 * Prüft ob die Chef's Numbers Datenbankstruktur bereits existiert
 */
router.post('/check-postgres-structure', async (req: Request, res: Response) => {
  try {
    const config: PostgresConfig = req.body;

    // Validiere Request-Body
    if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
      });
    }

    // Validiere Port
    const port = parseInt(config.port.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
      });
    }

    // Prüfe Datenbankstruktur
    const result = await postgresService.checkStructure({
      ...config,
      port
    });

    return res.status(200).json({
      success: true,
      hasStructure: result.hasStructure,
      message: result.message,
      tables: result.tables
    });

  } catch (error: any) {
    console.error('PostgreSQL structure check route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler bei der Strukturprüfung',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * POST /api/create-postgres-structure
 * Erstellt die Chef's Numbers Datenbankstruktur
 */
router.post('/create-postgres-structure', async (req: Request, res: Response) => {
  try {
    const config: PostgresConfig = req.body;

    // Validiere Request-Body
    if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
      });
    }

    // Validiere Port
    const port = parseInt(config.port.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
      });
    }

    // Erstelle Datenbankstruktur
    const result = await postgresService.createStructure({
      ...config,
      port
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        tablesCreated: result.tablesCreated
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error: any) {
    console.error('PostgreSQL structure creation route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler bei der Strukturerstellung',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * POST /api/update-postgres-schema
 * Aktualisiert die Datenbankstruktur um fehlende Spalten hinzuzufügen
 */
router.post('/update-postgres-schema', async (req: Request, res: Response) => {
  try {
    console.log('Schema update request received:', {
      body: req.body,
      hasHost: !!req.body?.host,
      hasPort: !!req.body?.port,
      hasDatabase: !!req.body?.database,
      hasUsername: !!req.body?.username,
      hasPassword: !!req.body?.password
    });
    
    const config: PostgresConfig = req.body;

    // Validiere Request-Body
    if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
      });
    }

    // Validiere Port
    const port = parseInt(config.port.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
      });
    }

    // Aktualisiere Schema
    const result = await postgresService.updateSchema({
      ...config,
      port
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        columnsAdded: result.columnsAdded
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error: any) {
    console.error('PostgreSQL schema update route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler bei der Schema-Aktualisierung',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * POST /api/sync-postgres-data
 * Synchronisiert Daten zwischen LocalStorage und PostgreSQL
 */
router.post('/sync-postgres-data', async (req: Request, res: Response) => {
  try {
    const { config, data } = req.body;

    // Validiere Request-Body
    if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Keine Daten zum Synchronisieren bereitgestellt'
      });
    }

    // Validiere Port
    const port = parseInt(config.port.toString());
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
      });
    }

    // Synchronisiere Daten
    const result = await postgresService.syncData({
      ...config,
      port
    }, data);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        syncedTables: result.syncedTables,
        recordsSynced: result.recordsSynced
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error: any) {
    console.error('PostgreSQL data sync route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler bei der Datensynchronisation',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * GET /api/postgres-health
 * Gesundheitsprüfung für PostgreSQL-Service
 */
router.get('/postgres-health', async (_req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'PostgreSQL-Service läuft',
      timestamp: new Date().toISOString(),
      service: 'postgres'
    });
  } catch (error: any) {
    console.error('PostgreSQL health check error:', error);
    return res.status(500).json({
      success: false,
      message: 'PostgreSQL-Service nicht verfügbar',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;
