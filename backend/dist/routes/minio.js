"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const minioService_1 = require("../services/minioService");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
});
router.post('/test-connection', async (req, res) => {
    try {
        const config = req.body;
        if (!config.host || !config.port || !config.accessKey || !config.secretKey) {
            return res.status(400).json({
                success: false,
                error: 'MinIO-Konfiguration unvollständig. Host, Port, AccessKey und SecretKey sind erforderlich.'
            });
        }
        console.log('🔍 Teste MinIO-Verbindung über Backend...', {
            host: config.host,
            port: config.port,
            bucket: config.bucket
        });
        const result = await minioService_1.minioService.testConnection(config);
        return res.json(result);
    }
    catch (error) {
        console.error('❌ MinIO-Verbindungstest fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/initialize', async (req, res) => {
    try {
        const config = req.body;
        if (!config.host || !config.port || !config.accessKey || !config.secretKey) {
            return res.status(400).json({
                success: false,
                error: 'MinIO-Konfiguration unvollständig'
            });
        }
        minioService_1.minioService.initialize(config);
        return res.json({
            success: true,
            message: 'MinIO-Client erfolgreich initialisiert'
        });
    }
    catch (error) {
        console.error('❌ MinIO-Initialisierung fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.get('/buckets/:bucketName/exists', async (req, res) => {
    try {
        const { bucketName } = req.params;
        const exists = await minioService_1.minioService.bucketExists(bucketName);
        res.json({
            success: true,
            exists,
            bucketName
        });
    }
    catch (error) {
        console.error('❌ Bucket-Existenz-Prüfung fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/buckets', async (req, res) => {
    try {
        const { bucketName, region = 'us-east-1' } = req.body;
        if (!bucketName) {
            return res.status(400).json({
                success: false,
                error: 'Bucket-Name ist erforderlich'
            });
        }
        await minioService_1.minioService.createBucket(bucketName, region);
        return res.json({
            success: true,
            message: `Bucket "${bucketName}" erfolgreich erstellt`,
            bucketName
        });
    }
    catch (error) {
        console.error('❌ Bucket-Erstellung fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.delete('/buckets/:bucketName', async (req, res) => {
    try {
        const { bucketName } = req.params;
        await minioService_1.minioService.deleteBucket(bucketName);
        res.json({
            success: true,
            message: `Bucket "${bucketName}" erfolgreich gelöscht`,
            bucketName
        });
    }
    catch (error) {
        console.error('❌ Bucket-Löschung fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.get('/buckets/:bucketName/objects', async (req, res) => {
    try {
        const { bucketName } = req.params;
        const { prefix } = req.query;
        const objects = await minioService_1.minioService.listObjects(bucketName, prefix);
        res.json({
            success: true,
            objects,
            bucketName,
            count: objects.length
        });
    }
    catch (error) {
        console.error('❌ Objekt-Liste fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/buckets/:bucketName/upload', upload.single('file'), async (req, res) => {
    try {
        const bucketName = req.params['bucketName'];
        const { objectName, contentType } = req.body;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Keine Datei hochgeladen'
            });
        }
        if (!objectName) {
            return res.status(400).json({
                success: false,
                error: 'Objekt-Name ist erforderlich'
            });
        }
        if (!bucketName) {
            return res.status(400).json({
                success: false,
                error: 'Bucket-Name ist erforderlich'
            });
        }
        await minioService_1.minioService.uploadFile(bucketName, objectName, req.file.buffer, contentType || req.file.mimetype);
        return res.json({
            success: true,
            message: `Datei "${objectName}" erfolgreich hochgeladen`,
            bucketName,
            objectName,
            size: req.file.size,
            contentType: contentType || req.file.mimetype
        });
    }
    catch (error) {
        console.error('❌ Datei-Upload fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.get('/buckets/:bucketName/download/:objectName', async (req, res) => {
    try {
        const { bucketName, objectName } = req.params;
        const fileBuffer = await minioService_1.minioService.downloadFile(bucketName, objectName);
        const contentType = getContentType(objectName);
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${objectName}"`,
            'Content-Length': fileBuffer.length.toString()
        });
        res.send(fileBuffer);
    }
    catch (error) {
        console.error('❌ Datei-Download fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.delete('/buckets/:bucketName/objects/:objectName', async (req, res) => {
    try {
        const { bucketName, objectName } = req.params;
        await minioService_1.minioService.deleteFile(bucketName, objectName);
        res.json({
            success: true,
            message: `Datei "${objectName}" erfolgreich gelöscht`,
            bucketName,
            objectName
        });
    }
    catch (error) {
        console.error('❌ Datei-Löschung fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.get('/buckets/:bucketName/presigned-upload/:objectName', async (req, res) => {
    try {
        const { bucketName, objectName } = req.params;
        const { expiry = 3600 } = req.query;
        const presignedUrl = await minioService_1.minioService.getPresignedUploadUrl(bucketName, objectName, parseInt(expiry));
        res.json({
            success: true,
            presignedUrl,
            bucketName,
            objectName,
            expiry: parseInt(expiry)
        });
    }
    catch (error) {
        console.error('❌ Presigned Upload-URL fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.get('/buckets/:bucketName/presigned-download/:objectName', async (req, res) => {
    try {
        const { bucketName, objectName } = req.params;
        const { expiry = 3600 } = req.query;
        const presignedUrl = await minioService_1.minioService.getPresignedDownloadUrl(bucketName, objectName, parseInt(expiry));
        res.json({
            success: true,
            presignedUrl,
            bucketName,
            objectName,
            expiry: parseInt(expiry)
        });
    }
    catch (error) {
        console.error('❌ Presigned Download-URL fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
router.post('/copy-object', async (req, res) => {
    try {
        const { sourceBucket, sourceObject, destBucket, destObject } = req.body;
        if (!sourceBucket || !sourceObject || !destBucket || !destObject) {
            return res.status(400).json({
                success: false,
                error: 'Alle Parameter (sourceBucket, sourceObject, destBucket, destObject) sind erforderlich'
            });
        }
        await minioService_1.minioService.copyObject(sourceBucket, sourceObject, destBucket, destObject);
        return res.json({
            success: true,
            message: `Objekt erfolgreich kopiert`,
            sourceBucket,
            sourceObject,
            destBucket,
            destObject
        });
    }
    catch (error) {
        console.error('❌ Objekt-Kopie fehlgeschlagen:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
    }
});
function getContentType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const contentTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'json': 'application/json',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
}
exports.default = router;
//# sourceMappingURL=minio.js.map