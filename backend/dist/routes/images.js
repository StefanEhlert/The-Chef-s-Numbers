"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const minioService_1 = require("../services/minioService");
const router = express_1.default.Router();
const ensureLocalImagesDirectory = () => {
    const documentsPath = path_1.default.join(require('os').homedir(), 'Documents');
    const appPath = path_1.default.join(documentsPath, "The Chef's Numbers");
    const imagesPath = path_1.default.join(appPath, 'Bilder');
    if (!fs_1.default.existsSync(appPath)) {
        fs_1.default.mkdirSync(appPath, { recursive: true });
        console.log('📁 App-Ordner erstellt:', appPath);
    }
    if (!fs_1.default.existsSync(imagesPath)) {
        fs_1.default.mkdirSync(imagesPath, { recursive: true });
        console.log('📁 Bilder-Ordner erstellt:', imagesPath);
    }
    return imagesPath;
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Keine Bilddatei hochgeladen'
            });
        }
        const { entityType, entityId, minioConfig } = req.body;
        if (!entityType) {
            return res.status(400).json({
                success: false,
                error: 'Entity-Typ ist erforderlich (article, recipe, etc.)'
            });
        }
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                error: 'Nur Bilddateien sind erlaubt'
            });
        }
        console.log(`📸 Bild-Upload für ${entityType}:`, {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            entityId: entityId || 'new'
        });
        console.log('🔍 Backend empfängt:', {
            hasMinioConfig: !!minioConfig,
            minioConfigLength: minioConfig ? minioConfig.length : 0,
            entityType,
            entityId
        });
        let actualMinioConfig;
        let useMinIO = false;
        if (minioConfig) {
            try {
                actualMinioConfig = JSON.parse(minioConfig);
                useMinIO = true;
                console.log('🔍 MinIO-Modus: Konfiguration aus Frontend verwendet:', actualMinioConfig);
            }
            catch (error) {
                console.error('❌ Fehler beim Parsen der MinIO-Konfiguration:', error);
                actualMinioConfig = null;
                useMinIO = false;
                console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration');
            }
        }
        else {
            actualMinioConfig = null;
            useMinIO = false;
            console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
        }
        if (!useMinIO) {
            console.log('📁 Lokaler Speichermodus: Speichere Bild lokal');
            const imagesPath = ensureLocalImagesDirectory();
            const cleanEntityId = (entityId || 'new').replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${entityType}_${cleanEntityId}.jpg`;
            const filePath = path_1.default.join(imagesPath, fileName);
            console.log('📁 Lokale Speicherung:', {
                fileName,
                filePath,
                entityId: cleanEntityId
            });
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                    console.log(`🗑️ Vorhandene lokale Datei gelöscht: ${fileName}`);
                }
            }
            catch (error) {
                console.warn('⚠️ Fehler beim Löschen vorhandener Datei:', error);
            }
            fs_1.default.writeFileSync(filePath, req.file.buffer);
            console.log(`✅ Bild lokal gespeichert: ${filePath}`);
            const localUrl = `http://localhost:3001/api/images/local/${fileName}`;
            return res.json({
                success: true,
                message: 'Bild erfolgreich lokal gespeichert',
                imageData: localUrl,
                fileName: fileName,
                storageMode: 'local',
                entityType,
                entityId: entityId || null
            });
        }
        console.log(`🔍 Verwende MinIO-Modus für Bild-Upload`);
        if (!actualMinioConfig) {
            console.error('❌ MinIO-Konfiguration nicht verfügbar');
            return res.status(500).json({
                success: false,
                error: 'MinIO-Konfiguration nicht verfügbar'
            });
        }
        console.log(`🔍 MinIO-Konfiguration geladen:`, {
            host: actualMinioConfig.host,
            port: actualMinioConfig.port,
            bucket: actualMinioConfig.bucket,
            useSSL: actualMinioConfig.useSSL
        });
        minioService_1.minioService.initialize(actualMinioConfig);
        const fileExtension = 'jpg';
        const cleanEntityId = (entityId || 'new').replace(/[^a-zA-Z0-9._-]/g, '_');
        const objectName = `${entityType}/${cleanEntityId}.${fileExtension}`;
        console.log(`🔍 Generierter Objektname: ${objectName}`);
        try {
            const bucketExists = await minioService_1.minioService.bucketExists(actualMinioConfig.bucket || 'chef-images');
            if (bucketExists) {
                const objectExists = await minioService_1.minioService.objectExists(actualMinioConfig.bucket || 'chef-images', objectName);
                if (objectExists) {
                    console.log(`🗑️ Lösche vorhandenes Bild: ${objectName}`);
                    await minioService_1.minioService.deleteFile(actualMinioConfig.bucket || 'chef-images', objectName);
                    console.log(`✅ Vorhandenes Bild gelöscht`);
                }
            }
        }
        catch (error) {
            console.warn('⚠️ Fehler beim Prüfen/Löschen vorhandener Bilder:', error);
        }
        console.log(`📤 Starte Upload zu MinIO...`);
        await minioService_1.minioService.uploadFile(actualMinioConfig.bucket || 'chef-images', objectName, req.file.buffer, req.file.mimetype);
        console.log(`✅ Upload zu MinIO erfolgreich`);
        console.log(`🔗 Generiere Presigned URL...`);
        const presignedUrl = await minioService_1.minioService.getPresignedDownloadUrl(actualMinioConfig.bucket || 'chef-images', objectName, 7 * 24 * 60 * 60);
        console.log(`✅ Presigned URL generiert: ${presignedUrl.substring(0, 100)}...`);
        return res.json({
            success: true,
            message: 'Bild erfolgreich zu MinIO hochgeladen',
            imageData: presignedUrl,
            objectName: objectName,
            storageMode: 'minio',
            entityType,
            entityId: entityId || null
        });
    }
    catch (error) {
        console.error('❌ Bild-Upload fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Upload'
        });
    }
});
router.get('/local/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        if (!fileName) {
            return res.status(400).json({
                success: false,
                error: 'Dateiname ist erforderlich'
            });
        }
        console.log(`📸 Lokales Bild-Laden angefordert: ${fileName}`);
        const imagesPath = ensureLocalImagesDirectory();
        const filePath = path_1.default.join(imagesPath, fileName);
        if (!fs_1.default.existsSync(filePath)) {
            console.log(`❌ Lokale Datei nicht gefunden: ${fileName}`);
            return res.status(404).json({
                success: false,
                error: 'Bild nicht gefunden'
            });
        }
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        const mimeType = 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        console.log(`✅ Lokales Bild geladen: ${fileName}`);
        return res.json({
            success: true,
            imageData: dataUrl,
            storageMode: 'local',
            fileName: fileName
        });
    }
    catch (error) {
        console.error('❌ Lokales Bild-Laden fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden'
        });
    }
});
router.get('/:objectName', async (req, res) => {
    try {
        const { objectName } = req.params;
        if (!objectName) {
            return res.status(400).json({
                success: false,
                error: 'Objektname ist erforderlich'
            });
        }
        console.log(`📸 Bild-Laden angefordert: ${objectName}`);
        let actualMinioConfig;
        let useMinIO = false;
        const { minioConfig } = req.query;
        if (minioConfig && typeof minioConfig === 'string') {
            try {
                actualMinioConfig = JSON.parse(minioConfig);
                useMinIO = true;
                console.log('🔍 MinIO-Modus: Konfiguration aus Query-Parameter verwendet:', actualMinioConfig);
            }
            catch (error) {
                console.error('❌ Fehler beim Parsen der MinIO-Konfiguration aus Query:', error);
                actualMinioConfig = null;
                useMinIO = false;
                console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration aus Query');
            }
        }
        else {
            actualMinioConfig = null;
            useMinIO = false;
            console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
        }
        if (!useMinIO) {
            console.log('📁 Lokaler Speichermodus: Lade Bild lokal');
            const fileName = objectName.replace('/', '_') + '.jpg';
            const imagesPath = ensureLocalImagesDirectory();
            const filePath = path_1.default.join(imagesPath, fileName);
            if (!fs_1.default.existsSync(filePath)) {
                console.log(`❌ Lokale Datei nicht gefunden: ${fileName}`);
                return res.status(404).json({
                    success: false,
                    error: 'Bild nicht gefunden'
                });
            }
            const fileBuffer = fs_1.default.readFileSync(filePath);
            const base64Data = fileBuffer.toString('base64');
            const mimeType = 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            console.log(`✅ Lokales Bild geladen: ${fileName}`);
            return res.json({
                success: true,
                imageData: dataUrl,
                storageMode: 'local',
                fileName: fileName
            });
        }
        console.log(`🔍 Verwende MinIO-Modus für Bild-Laden`);
        if (!actualMinioConfig) {
            console.error('❌ MinIO-Konfiguration nicht verfügbar für Bild-Laden');
            return res.status(500).json({
                success: false,
                error: 'MinIO-Konfiguration nicht verfügbar'
            });
        }
        console.log(`🔍 MinIO-Konfiguration für Bild-Laden:`, {
            host: actualMinioConfig.host,
            port: actualMinioConfig.port,
            bucket: actualMinioConfig.bucket
        });
        minioService_1.minioService.initialize(actualMinioConfig);
        console.log(`🔍 Prüfe ob Datei existiert: ${objectName}`);
        try {
            const bucketExists = await minioService_1.minioService.bucketExists(actualMinioConfig.bucket || 'chef-images');
            if (!bucketExists) {
                console.log(`❌ Bucket existiert nicht: ${actualMinioConfig.bucket || 'chef-images'}`);
                return res.status(404).json({
                    success: false,
                    error: 'Bucket nicht gefunden'
                });
            }
            const objectExists = await minioService_1.minioService.objectExists(actualMinioConfig.bucket || 'chef-images', objectName);
            if (!objectExists) {
                console.log(`❌ Datei existiert nicht: ${objectName}`);
                return res.status(404).json({
                    success: false,
                    error: 'Bild nicht gefunden'
                });
            }
            console.log(`✅ Datei existiert: ${objectName}`);
        }
        catch (error) {
            console.error('❌ Fehler beim Prüfen der Datei-Existenz:', error);
            return res.status(500).json({
                success: false,
                error: 'Fehler beim Prüfen der Datei-Existenz'
            });
        }
        console.log(`🔗 Generiere Presigned URL für: ${objectName}`);
        const presignedUrl = await minioService_1.minioService.getPresignedDownloadUrl(actualMinioConfig.bucket || 'chef-images', objectName, 7 * 24 * 60 * 60);
        console.log(`✅ Presigned URL für Bild-Laden generiert: ${presignedUrl.substring(0, 100)}...`);
        return res.json({
            success: true,
            imageData: presignedUrl,
            storageMode: 'minio'
        });
    }
    catch (error) {
        console.error('❌ Bild-Laden fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden'
        });
    }
});
router.delete('/:objectName', async (req, res) => {
    try {
        const { objectName } = req.params;
        if (!objectName) {
            return res.status(400).json({
                success: false,
                error: 'Objektname ist erforderlich'
            });
        }
        console.log(`🗑️ Bild-Löschen: ${objectName}`);
        let actualMinioConfig;
        let useMinIO = false;
        const { minioConfig } = req.query;
        if (minioConfig && typeof minioConfig === 'string') {
            try {
                actualMinioConfig = JSON.parse(minioConfig);
                useMinIO = true;
                console.log('🔍 MinIO-Modus: Konfiguration aus Query-Parameter verwendet:', actualMinioConfig);
            }
            catch (error) {
                console.error('❌ Fehler beim Parsen der MinIO-Konfiguration aus Query:', error);
                actualMinioConfig = null;
                useMinIO = false;
                console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration aus Query');
            }
        }
        else {
            actualMinioConfig = null;
            useMinIO = false;
            console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
        }
        if (!useMinIO) {
            console.log('📁 Lokaler Speichermodus: Lösche Bild lokal');
            const fileName = objectName.replace('/', '_') + '.jpg';
            const imagesPath = ensureLocalImagesDirectory();
            const filePath = path_1.default.join(imagesPath, fileName);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`✅ Lokale Datei gelöscht: ${fileName}`);
                return res.json({
                    success: true,
                    message: 'Bild erfolgreich gelöscht',
                    storageMode: 'local',
                    fileName: fileName
                });
            }
            else {
                console.log(`❌ Lokale Datei nicht gefunden: ${fileName}`);
                return res.status(404).json({
                    success: false,
                    error: 'Bild nicht gefunden'
                });
            }
        }
        console.log(`🔍 Verwende MinIO-Modus für Bild-Löschen`);
        if (!actualMinioConfig) {
            console.error('❌ MinIO-Konfiguration nicht verfügbar für Bild-Löschen');
            return res.status(500).json({
                success: false,
                error: 'MinIO-Konfiguration nicht verfügbar'
            });
        }
        minioService_1.minioService.initialize(actualMinioConfig);
        await minioService_1.minioService.deleteFile(actualMinioConfig.bucket || 'chef-images', objectName);
        console.log(`✅ Bild aus MinIO gelöscht: ${objectName}`);
        return res.json({
            success: true,
            message: 'Bild erfolgreich gelöscht',
            storageMode: 'minio'
        });
    }
    catch (error) {
        console.error('❌ Bild-Löschen fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen'
        });
    }
});
router.delete('/wildcard/:entityType/:entityId', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        if (!entityType || !entityId) {
            return res.status(400).json({
                success: false,
                error: 'Entity-Type und Entity-ID sind erforderlich'
            });
        }
        console.log(`🗑️ Wildcard-Löschung angefordert: ${entityType}/${entityId}.*`);
        let actualMinioConfig;
        let useMinIO = false;
        const { minioConfig } = req.query;
        if (minioConfig && typeof minioConfig === 'string') {
            try {
                actualMinioConfig = JSON.parse(minioConfig);
                useMinIO = true;
                console.log('🔍 MinIO-Modus: Konfiguration aus Query-Parameter verwendet:', actualMinioConfig);
            }
            catch (error) {
                console.error('❌ Fehler beim Parsen der MinIO-Konfiguration aus Query:', error);
                actualMinioConfig = null;
                useMinIO = false;
                console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration aus Query');
            }
        }
        else {
            actualMinioConfig = null;
            useMinIO = false;
            console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
        }
        if (!useMinIO) {
            console.log('📁 Lokaler Speichermodus: Wildcard-Löschung lokal');
            const imagesPath = ensureLocalImagesDirectory();
            const prefix = `${entityType}_${entityId}`;
            console.log(`🔍 Suche nach lokalen Dateien mit Präfix: ${prefix}`);
            const files = fs_1.default.readdirSync(imagesPath);
            const matchingFiles = files.filter(file => file.startsWith(prefix));
            console.log(`🔍 Gefundene lokale Dateien: ${matchingFiles.length}`);
            if (matchingFiles.length === 0) {
                console.log(`✅ Keine lokalen Dateien gefunden für Präfix: ${prefix}`);
                return res.json({
                    success: true,
                    message: 'Keine Dateien zum Löschen gefunden',
                    deletedCount: 0,
                    prefix
                });
            }
            let deletedCount = 0;
            for (const file of matchingFiles) {
                try {
                    const filePath = path_1.default.join(imagesPath, file);
                    fs_1.default.unlinkSync(filePath);
                    console.log(`✅ Lokale Datei gelöscht: ${file}`);
                    deletedCount++;
                }
                catch (error) {
                    console.error(`❌ Fehler beim Löschen von ${file}:`, error);
                }
            }
            console.log(`✅ Lokale Wildcard-Löschung abgeschlossen: ${deletedCount} Dateien gelöscht`);
            return res.json({
                success: true,
                message: `Wildcard-Löschung erfolgreich: ${deletedCount} Dateien gelöscht`,
                deletedCount,
                prefix
            });
        }
        console.log(`🔍 Verwende MinIO-Modus für Wildcard-Löschung`);
        if (!actualMinioConfig) {
            console.error('❌ MinIO-Konfiguration nicht verfügbar für Wildcard-Löschung');
            return res.status(500).json({
                success: false,
                error: 'MinIO-Konfiguration nicht verfügbar'
            });
        }
        minioService_1.minioService.initialize(actualMinioConfig);
        const bucketExists = await minioService_1.minioService.bucketExists(actualMinioConfig.bucket || 'chef-images');
        if (!bucketExists) {
            console.log(`❌ Bucket existiert nicht: ${actualMinioConfig.bucket || 'chef-images'}`);
            return res.status(404).json({
                success: false,
                error: 'Bucket nicht gefunden'
            });
        }
        const prefix = `${entityType}/${entityId}.`;
        console.log(`🔍 Suche nach Objekten mit Präfix: ${prefix}`);
        const objects = await minioService_1.minioService.listObjects(actualMinioConfig.bucket || 'chef-images', prefix);
        console.log(`🔍 Gefundene Objekte: ${objects.length}`);
        if (objects.length === 0) {
            console.log(`✅ Keine Objekte gefunden für Präfix: ${prefix}`);
            return res.json({
                success: true,
                message: 'Keine Objekte zum Löschen gefunden',
                deletedCount: 0
            });
        }
        let deletedCount = 0;
        for (const obj of objects) {
            if (obj.name) {
                try {
                    await minioService_1.minioService.deleteFile(actualMinioConfig.bucket || 'chef-images', obj.name);
                    console.log(`✅ Objekt gelöscht: ${obj.name}`);
                    deletedCount++;
                }
                catch (error) {
                    console.error(`❌ Fehler beim Löschen von ${obj.name}:`, error);
                }
            }
        }
        console.log(`✅ Wildcard-Löschung abgeschlossen: ${deletedCount} Objekte gelöscht`);
        return res.json({
            success: true,
            message: `Wildcard-Löschung erfolgreich: ${deletedCount} Objekte gelöscht`,
            deletedCount,
            prefix
        });
    }
    catch (error) {
        console.error('❌ Wildcard-Löschung fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler bei Wildcard-Löschung'
        });
    }
});
exports.default = router;
//# sourceMappingURL=images.js.map