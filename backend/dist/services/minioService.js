"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.minioService = exports.MinIOService = void 0;
const Minio = __importStar(require("minio"));
class MinIOService {
    constructor() {
        this.client = null;
        this.config = null;
    }
    initialize(config) {
        this.config = config;
        try {
            this.client = new Minio.Client({
                endPoint: config.host,
                port: config.port,
                useSSL: config.useSSL || false,
                accessKey: config.accessKey,
                secretKey: config.secretKey
            });
            console.log('✅ MinIO Client initialisiert:', {
                host: config.host,
                port: config.port,
                useSSL: config.useSSL || false
            });
            return this.client;
        }
        catch (error) {
            console.error('❌ Fehler beim Initialisieren des MinIO Clients:', error);
            throw error;
        }
    }
    async testConnection(config) {
        const startTime = Date.now();
        try {
            const testConfig = config || this.config;
            if (!testConfig) {
                throw new Error('Keine MinIO-Konfiguration verfügbar');
            }
            const testClient = new Minio.Client({
                endPoint: testConfig.host,
                port: testConfig.port,
                useSSL: testConfig.useSSL || false,
                accessKey: testConfig.accessKey,
                secretKey: testConfig.secretKey
            });
            console.log('🔍 Teste MinIO-Verbindung...', {
                host: testConfig.host,
                port: testConfig.port,
                bucket: testConfig.bucket
            });
            const bucketName = testConfig.bucket || 'test-bucket';
            let bucketExists = false;
            try {
                bucketExists = await testClient.bucketExists(bucketName);
                console.log(`📦 Bucket "${bucketName}" existiert:`, bucketExists);
            }
            catch (error) {
                console.warn('⚠️ Konnte Bucket-Existenz nicht prüfen:', error);
            }
            let canCreateBucket = false;
            if (!bucketExists) {
                try {
                    await testClient.makeBucket(bucketName, 'us-east-1');
                    canCreateBucket = true;
                    bucketExists = true;
                    console.log(`✅ Bucket "${bucketName}" erfolgreich erstellt`);
                }
                catch (error) {
                    console.warn('⚠️ Konnte Bucket nicht erstellen:', error);
                }
            }
            else {
                canCreateBucket = true;
            }
            let canUpload = false;
            let canDownload = false;
            if (bucketExists) {
                try {
                    const testObjectName = 'connection-test.txt';
                    const testContent = `MinIO Verbindungstest - ${new Date().toISOString()}`;
                    await testClient.putObject(bucketName, testObjectName, Buffer.from(testContent, 'utf8'), testContent.length, {
                        'Content-Type': 'text/plain'
                    });
                    canUpload = true;
                    console.log('✅ Upload-Test erfolgreich');
                    try {
                        const stream = await testClient.getObject(bucketName, testObjectName);
                        const chunks = [];
                        await new Promise((resolve, reject) => {
                            stream.on('data', (chunk) => chunks.push(chunk));
                            stream.on('end', () => resolve());
                            stream.on('error', reject);
                        });
                        const downloadedContent = Buffer.concat(chunks).toString('utf8');
                        canDownload = downloadedContent === testContent;
                        console.log('✅ Download-Test erfolgreich:', canDownload);
                        try {
                            await testClient.removeObject(bucketName, testObjectName);
                            console.log('🧹 Test-Objekt gelöscht');
                        }
                        catch (err) {
                            console.warn('⚠️ Konnte Test-Objekt nicht löschen:', err);
                        }
                    }
                    catch (error) {
                        console.warn('⚠️ Download-Test fehlgeschlagen:', error);
                    }
                }
                catch (error) {
                    console.warn('⚠️ Upload-Test fehlgeschlagen:', error);
                }
            }
            const responseTime = Date.now() - startTime;
            return {
                success: true,
                message: `MinIO-Verbindung erfolgreich! Bucket: ${bucketName}`,
                responseTime,
                bucketExists,
                canCreateBucket,
                canUpload,
                canDownload
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            console.error('❌ MinIO-Verbindungstest fehlgeschlagen:', error);
            return {
                success: false,
                message: 'MinIO-Verbindung fehlgeschlagen',
                responseTime,
                error: error instanceof Error ? error.message : 'Unbekannter Fehler'
            };
        }
    }
    async downloadFile(bucketName, objectName) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            const stream = await this.client.getObject(bucketName, objectName);
            const chunks = [];
            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        }
        catch (error) {
            console.error('❌ Fehler beim Herunterladen der Datei:', error);
            throw error;
        }
    }
    async objectExists(bucketName, objectName) {
        if (!this.client)
            throw new Error('MinIO Client nicht initialisiert');
        try {
            await this.client.statObject(bucketName, objectName);
            return true;
        }
        catch (error) {
            if (error.code === 'NotFound') {
                return false;
            }
            throw error;
        }
    }
    async uploadFile(bucketName, objectName, data, contentType) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
            await this.client.putObject(bucketName, objectName, buffer, buffer.length, contentType ? { 'Content-Type': contentType } : undefined);
            console.log(`✅ Datei erfolgreich hochgeladen: ${bucketName}/${objectName}`);
        }
        catch (error) {
            console.error('❌ Fehler beim Hochladen der Datei:', error);
            throw error;
        }
    }
    async uploadFileStream(bucketName, objectName, stream, size, contentType) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            await this.client.putObject(bucketName, objectName, stream, size, contentType ? { 'Content-Type': contentType } : undefined);
            console.log(`✅ Datei erfolgreich hochgeladen (Stream): ${bucketName}/${objectName}`);
        }
        catch (error) {
            console.error('❌ Fehler beim Hochladen der Datei (Stream):', error);
            throw error;
        }
    }
    async deleteFile(bucketName, objectName) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            await this.client.removeObject(bucketName, objectName);
            console.log(`✅ Datei erfolgreich gelöscht: ${bucketName}/${objectName}`);
        }
        catch (error) {
            console.error('❌ Fehler beim Löschen der Datei:', error);
            throw error;
        }
    }
    async listObjects(bucketName, prefix) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            const objects = [];
            const stream = this.client.listObjects(bucketName, prefix, true);
            return new Promise((resolve, reject) => {
                stream.on('data', (obj) => {
                    objects.push({
                        name: obj.name || '',
                        size: obj.size || 0,
                        lastModified: obj.lastModified || new Date(),
                        etag: obj.etag || ''
                    });
                });
                stream.on('end', () => resolve(objects));
                stream.on('error', reject);
            });
        }
        catch (error) {
            console.error('❌ Fehler beim Auflisten der Objekte:', error);
            throw error;
        }
    }
    async createBucket(bucketName, region = 'us-east-1') {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            await this.client.makeBucket(bucketName, region);
            console.log(`✅ Bucket erfolgreich erstellt: ${bucketName}`);
        }
        catch (error) {
            console.error('❌ Fehler beim Erstellen des Buckets:', error);
            throw error;
        }
    }
    async bucketExists(bucketName) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            return await this.client.bucketExists(bucketName);
        }
        catch (error) {
            console.error('❌ Fehler beim Prüfen der Bucket-Existenz:', error);
            throw error;
        }
    }
    async deleteBucket(bucketName) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            await this.client.removeBucket(bucketName);
            console.log(`✅ Bucket erfolgreich gelöscht: ${bucketName}`);
        }
        catch (error) {
            console.error('❌ Fehler beim Löschen des Buckets:', error);
            throw error;
        }
    }
    async getPresignedUploadUrl(bucketName, objectName, expiry = 7 * 24 * 60 * 60) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            return await this.client.presignedPutObject(bucketName, objectName, expiry);
        }
        catch (error) {
            console.error('❌ Fehler beim Erstellen der presigned Upload-URL:', error);
            throw error;
        }
    }
    async getPresignedDownloadUrl(bucketName, objectName, expiry = 7 * 24 * 60 * 60) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            return await this.client.presignedGetObject(bucketName, objectName, expiry);
        }
        catch (error) {
            console.error('❌ Fehler beim Erstellen der presigned Download-URL:', error);
            throw error;
        }
    }
    async copyObject(sourceBucket, sourceObject, destBucket, destObject) {
        if (!this.client) {
            throw new Error('MinIO Client nicht initialisiert');
        }
        try {
            await this.client.copyObject(destBucket, destObject, `/${sourceBucket}/${sourceObject}`, new Minio.CopyConditions());
            console.log(`✅ Objekt erfolgreich kopiert: ${sourceBucket}/${sourceObject} -> ${destBucket}/${destObject}`);
        }
        catch (error) {
            console.error('❌ Fehler beim Kopieren des Objekts:', error);
            throw error;
        }
    }
    getConfig() {
        return this.config;
    }
    getClient() {
        return this.client;
    }
}
exports.MinIOService = MinIOService;
exports.minioService = new MinIOService();
//# sourceMappingURL=minioService.js.map