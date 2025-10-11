import * as Minio from 'minio';

export interface MinIOConfig {
  host: string;
  port: number;
  accessKey: string;
  secretKey: string;
  bucket?: string;
  useSSL?: boolean;
}

export interface MinIOTestResult {
  success: boolean;
  message: string;
  responseTime: number;
  bucketExists?: boolean;
  canCreateBucket?: boolean;
  canUpload?: boolean;
  canDownload?: boolean;
  error?: string;
}

export interface MinIOObject {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
}

export class MinIOService {
  private client: Minio.Client | null = null;
  private config: MinIOConfig | null = null;

  /**
   * Initialisiert den MinIO Client mit der gegebenen Konfiguration
   */
  initialize(config: MinIOConfig): Minio.Client {
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
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren des MinIO Clients:', error);
      throw error;
    }
  }

  /**
   * Testet die Verbindung zu MinIO
   */
  async testConnection(config?: MinIOConfig): Promise<MinIOTestResult> {
    const startTime = Date.now();
    
    try {
      const testConfig = config || this.config;
      if (!testConfig) {
        throw new Error('Keine MinIO-Konfiguration verfügbar');
      }

      // Initialisiere temporären Client für den Test
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
      
      // Test 1: Bucket-Existenz prüfen
      let bucketExists = false;
      try {
        bucketExists = await testClient.bucketExists(bucketName);
        console.log(`📦 Bucket "${bucketName}" existiert:`, bucketExists);
      } catch (error) {
        console.warn('⚠️ Konnte Bucket-Existenz nicht prüfen:', error);
      }

      // Test 2: Bucket erstellen (falls nicht vorhanden)
      let canCreateBucket = false;
      if (!bucketExists) {
        try {
          await testClient.makeBucket(bucketName, 'us-east-1');
          canCreateBucket = true;
          bucketExists = true;
          console.log(`✅ Bucket "${bucketName}" erfolgreich erstellt`);
        } catch (error) {
          console.warn('⚠️ Konnte Bucket nicht erstellen:', error);
        }
      } else {
        canCreateBucket = true; // Bucket existiert bereits
      }

      // Test 3: Upload-Test
      let canUpload = false;
      let canDownload = false;
      
      if (bucketExists) {
        try {
          const testObjectName = 'connection-test.txt';
          const testContent = `MinIO Verbindungstest - ${new Date().toISOString()}`;
          
          await testClient.putObject(
            bucketName,
            testObjectName,
            Buffer.from(testContent, 'utf8'),
            testContent.length,
            {
              'Content-Type': 'text/plain'
            }
          );
          
          canUpload = true;
          console.log('✅ Upload-Test erfolgreich');
          
          // Test 4: Download-Test
          try {
            const stream = await testClient.getObject(bucketName, testObjectName);
            const chunks: Buffer[] = [];
            
            await new Promise<void>((resolve, reject) => {
              stream.on('data', (chunk) => chunks.push(chunk));
              stream.on('end', () => resolve());
              stream.on('error', reject);
            });
            
            const downloadedContent = Buffer.concat(chunks).toString('utf8');
            canDownload = downloadedContent === testContent;
            
            console.log('✅ Download-Test erfolgreich:', canDownload);
            
            // Cleanup: Lösche Test-Objekt
            try {
              await testClient.removeObject(bucketName, testObjectName);
              console.log('🧹 Test-Objekt gelöscht');
            } catch (err) {
              console.warn('⚠️ Konnte Test-Objekt nicht löschen:', err);
            }
          } catch (error) {
            console.warn('⚠️ Download-Test fehlgeschlagen:', error);
          }
        } catch (error) {
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

    } catch (error) {
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

  /**
   * Lädt eine Datei von MinIO
   */
  async downloadFile(bucketName: string, objectName: string): Promise<Buffer> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      const stream = await this.client.getObject(bucketName, objectName);
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen der Datei:', error);
      throw error;
    }
  }

  /**
   * Prüft ob ein Objekt existiert
   */
  async objectExists(bucketName: string, objectName: string): Promise<boolean> {
    if (!this.client) throw new Error('MinIO Client nicht initialisiert');
    
    try {
      await this.client.statObject(bucketName, objectName);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Lädt eine Datei zu MinIO hoch
   */
  async uploadFile(
    bucketName: string, 
    objectName: string, 
    data: Buffer | string, 
    contentType?: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      
      await this.client.putObject(
        bucketName,
        objectName,
        buffer,
        buffer.length,
        contentType ? { 'Content-Type': contentType } : undefined
      );
      
      console.log(`✅ Datei erfolgreich hochgeladen: ${bucketName}/${objectName}`);
    } catch (error) {
      console.error('❌ Fehler beim Hochladen der Datei:', error);
      throw error;
    }
  }

  /**
   * Lädt eine Datei zu MinIO hoch (mit Stream)
   */
  async uploadFileStream(
    bucketName: string, 
    objectName: string, 
    stream: NodeJS.ReadableStream,
    size: number,
    contentType?: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      await this.client.putObject(
        bucketName,
        objectName,
        stream as any, // Type assertion für Node.js ReadableStream
        size,
        contentType ? { 'Content-Type': contentType } : undefined
      );
      
      console.log(`✅ Datei erfolgreich hochgeladen (Stream): ${bucketName}/${objectName}`);
    } catch (error) {
      console.error('❌ Fehler beim Hochladen der Datei (Stream):', error);
      throw error;
    }
  }

  /**
   * Löscht eine Datei von MinIO
   */
  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      await this.client.removeObject(bucketName, objectName);
      console.log(`✅ Datei erfolgreich gelöscht: ${bucketName}/${objectName}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Datei:', error);
      throw error;
    }
  }

  /**
   * Listet alle Objekte in einem Bucket auf
   */
  async listObjects(bucketName: string, prefix?: string): Promise<MinIOObject[]> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      const objects: MinIOObject[] = [];
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
    } catch (error) {
      console.error('❌ Fehler beim Auflisten der Objekte:', error);
      throw error;
    }
  }

  /**
   * Erstellt einen neuen Bucket
   */
  async createBucket(bucketName: string, region: string = 'us-east-1'): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      await this.client.makeBucket(bucketName, region);
      console.log(`✅ Bucket erfolgreich erstellt: ${bucketName}`);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Buckets:', error);
      throw error;
    }
  }

  /**
   * Prüft ob ein Bucket existiert
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      return await this.client.bucketExists(bucketName);
    } catch (error) {
      console.error('❌ Fehler beim Prüfen der Bucket-Existenz:', error);
      throw error;
    }
  }

  /**
   * Löscht einen Bucket
   */
  async deleteBucket(bucketName: string): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      await this.client.removeBucket(bucketName);
      console.log(`✅ Bucket erfolgreich gelöscht: ${bucketName}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Buckets:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine presigned URL für Upload
   */
  async getPresignedUploadUrl(
    bucketName: string, 
    objectName: string, 
    expiry: number = 7 * 24 * 60 * 60 // 7 Tage
  ): Promise<string> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      return await this.client.presignedPutObject(bucketName, objectName, expiry);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der presigned Upload-URL:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine presigned URL für Download
   */
  async getPresignedDownloadUrl(
    bucketName: string, 
    objectName: string, 
    expiry: number = 7 * 24 * 60 * 60 // 7 Tage
  ): Promise<string> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      return await this.client.presignedGetObject(bucketName, objectName, expiry);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der presigned Download-URL:', error);
      throw error;
    }
  }

  /**
   * Kopiert ein Objekt innerhalb von MinIO
   */
  async copyObject(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO Client nicht initialisiert');
    }

    try {
      await this.client.copyObject(
        destBucket,
        destObject,
        `/${sourceBucket}/${sourceObject}`,
        new Minio.CopyConditions()
      );
      
      console.log(`✅ Objekt erfolgreich kopiert: ${sourceBucket}/${sourceObject} -> ${destBucket}/${destObject}`);
    } catch (error) {
      console.error('❌ Fehler beim Kopieren des Objekts:', error);
      throw error;
    }
  }

  /**
   * Gibt die aktuelle Konfiguration zurück
   */
  getConfig(): MinIOConfig | null {
    return this.config;
  }

  /**
   * Gibt den MinIO Client zurück
   */
  getClient(): Minio.Client | null {
    return this.client;
  }
}

// Singleton-Instanz exportieren
export const minioService = new MinIOService();
