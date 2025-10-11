"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgresService_1 = require("../services/postgresService");
const router = (0, express_1.Router)();
router.post('/test-postgres-connection', async (req, res) => {
    try {
        const config = req.body;
        if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein',
                required: ['host', 'port', 'database', 'username', 'password']
            });
        }
        const port = parseInt(config.port.toString());
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
            });
        }
        const result = await postgresService_1.postgresService.testConnection({
            ...config,
            port
        });
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.message,
                details: result.details
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: result.message,
                details: result.details
            });
        }
    }
    catch (error) {
        console.error('PostgreSQL connection test route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Interner Server-Fehler beim Verbindungstest',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/check-postgres-database', async (req, res) => {
    try {
        const config = req.body;
        if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
            });
        }
        const port = parseInt(config.port.toString());
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
            });
        }
        const result = await postgresService_1.postgresService.checkDatabaseExists({
            ...config,
            port
        });
        return res.status(200).json({
            success: true,
            exists: result.exists,
            message: result.message
        });
    }
    catch (error) {
        console.error('PostgreSQL database check route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Interner Server-Fehler bei der Datenbankprüfung',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/create-postgres-database', async (req, res) => {
    try {
        const config = req.body;
        if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
            });
        }
        const port = parseInt(config.port.toString());
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
            });
        }
        const result = await postgresService_1.postgresService.createDatabase({
            ...config,
            port
        });
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.message
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('PostgreSQL database creation route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Interner Server-Fehler bei der Datenbankerstellung',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/check-postgres-structure', async (req, res) => {
    try {
        const config = req.body;
        if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
            });
        }
        const port = parseInt(config.port.toString());
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
            });
        }
        const result = await postgresService_1.postgresService.checkStructure({
            ...config,
            port
        });
        return res.status(200).json({
            success: true,
            hasStructure: result.hasStructure,
            message: result.message,
            tables: result.tables
        });
    }
    catch (error) {
        console.error('PostgreSQL structure check route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Interner Server-Fehler bei der Strukturprüfung',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/create-postgres-structure', async (req, res) => {
    try {
        const config = req.body;
        if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
            });
        }
        const port = parseInt(config.port.toString());
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
            });
        }
        const result = await postgresService_1.postgresService.createStructure({
            ...config,
            port
        });
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.message,
                tablesCreated: result.tablesCreated
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('PostgreSQL structure creation route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Interner Server-Fehler bei der Strukturerstellung',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/update-postgres-schema', async (req, res) => {
    try {
        console.log('Schema update request received:', {
            body: req.body,
            hasHost: !!req.body?.host,
            hasPort: !!req.body?.port,
            hasDatabase: !!req.body?.database,
            hasUsername: !!req.body?.username,
            hasPassword: !!req.body?.password
        });
        const config = req.body;
        if (!config || !config.host || !config.port || !config.database || !config.username || !config.password) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein'
            });
        }
        const port = parseInt(config.port.toString());
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
            });
        }
        const result = await postgresService_1.postgresService.updateSchema({
            ...config,
            port
        });
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: result.message,
                columnsAdded: result.columnsAdded
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('PostgreSQL schema update route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Interner Server-Fehler bei der Schema-Aktualisierung',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/sync-postgres-data', async (req, res) => {
    try {
        const { config, data } = req.body;
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
        const port = parseInt(config.port.toString());
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Port: Muss zwischen 1 und 65535 liegen'
            });
        }
        const result = await postgresService_1.postgresService.syncData({
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
        }
        else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('PostgreSQL data sync route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Interner Server-Fehler bei der Datensynchronisation',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.get('/postgres-health', async (_req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'PostgreSQL-Service läuft',
            timestamp: new Date().toISOString(),
            service: 'postgres'
        });
    }
    catch (error) {
        console.error('PostgreSQL health check error:', error);
        return res.status(500).json({
            success: false,
            message: 'PostgreSQL-Service nicht verfügbar',
            error: process.env['NODE_ENV'] === 'development' ? error.message : 'Unbekannter Fehler'
        });
    }
});
exports.default = router;
//# sourceMappingURL=postgres.js.map