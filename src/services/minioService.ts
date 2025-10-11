// Frontend MinIO-Service - kommuniziert mit Backend-API
// Alle MinIO-Operationen werden über das Backend ausgeführt

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
  private config: MinIOConfig | null = null;
  private backendUrl: string;

  constructor(backendUrl: string = 'http://localhost:3001') {
    this.backendUrl = backendUrl;
  }

  /**
   * Initialisiert den MinIO Client mit der gegebenen Konfiguration
   */
  initialize(config: MinIOConfig): void {
    this.config = config;
    console.log('✅ MinIO Client initialisiert:', {
      host: config.host,
      port: config.port,
      useSSL: config.useSSL || false
    });
  }

  /**
   * Testet die Verbindung zu MinIO über Backend-API
   */
  async testConnection(config?: MinIOConfig): Promise<MinIOTestResult> {
    const startTime = Date.now();
    
    try {
      const testConfig = config || this.config;
      if (!testConfig) {
        throw new Error('Keine MinIO-Konfiguration verfügbar');
      }

      console.log('🔍 Teste MinIO-Verbindung über Backend-API...', {
        host: testConfig.host,
        port: testConfig.port,
        bucket: testConfig.bucket
      });

      const response = await fetch(`${this.backendUrl}/api/minio/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ MinIO-Verbindungstest erfolgreich:', result);
      
      return result;

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
   * Lädt eine Datei von MinIO über Backend-API
   */
  async downloadFile(bucketName: string, objectName: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/buckets/${bucketName}/download/${objectName}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Download fehlgeschlagen: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen der Datei:', error);
      throw error;
    }
  }

  /**
   * Lädt eine Datei zu MinIO hoch über Backend-API
   */
  async uploadFile(
    bucketName: string, 
    objectName: string, 
    data: Blob | File, 
    contentType?: string
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data);
      formData.append('objectName', objectName);
      if (contentType) {
        formData.append('contentType', contentType);
      }

      const response = await fetch(`${this.backendUrl}/api/minio/buckets/${bucketName}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Datei erfolgreich hochgeladen: ${bucketName}/${objectName}`, result);
    } catch (error) {
      console.error('❌ Fehler beim Hochladen der Datei:', error);
      throw error;
    }
  }

  /**
   * Löscht eine Datei von MinIO über Backend-API
   */
  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/buckets/${bucketName}/objects/${objectName}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Löschen fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Datei erfolgreich gelöscht: ${bucketName}/${objectName}`, result);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Datei:', error);
      throw error;
    }
  }

  /**
   * Listet alle Objekte in einem Bucket auf über Backend-API
   */
  async listObjects(bucketName: string, prefix?: string): Promise<MinIOObject[]> {
    try {
      const url = prefix 
        ? `${this.backendUrl}/api/minio/buckets/${bucketName}/objects?prefix=${encodeURIComponent(prefix)}`
        : `${this.backendUrl}/api/minio/buckets/${bucketName}/objects`;
      
      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Liste fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      return result.objects || [];
    } catch (error) {
      console.error('❌ Fehler beim Auflisten der Objekte:', error);
      throw error;
    }
  }

  /**
   * Erstellt einen neuen Bucket über Backend-API
   */
  async createBucket(bucketName: string, region: string = 'us-east-1'): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/buckets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bucketName, region })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Bucket-Erstellung fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Bucket erfolgreich erstellt: ${bucketName}`, result);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Buckets:', error);
      throw error;
    }
  }

  /**
   * Prüft ob ein Bucket existiert über Backend-API
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/buckets/${bucketName}/exists`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Bucket-Prüfung fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      return result.exists || false;
    } catch (error) {
      console.error('❌ Fehler beim Prüfen der Bucket-Existenz:', error);
      return false;
    }
  }

  /**
   * Löscht einen Bucket über Backend-API
   */
  async deleteBucket(bucketName: string): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/buckets/${bucketName}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Bucket-Löschung fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Bucket erfolgreich gelöscht: ${bucketName}`, result);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Buckets:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine presigned URL für Upload über Backend-API
   */
  async getPresignedUploadUrl(
    bucketName: string, 
    objectName: string, 
    expiry: number = 7 * 24 * 60 * 60 // 7 Tage
  ): Promise<string> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/buckets/${bucketName}/presigned-upload/${objectName}?expiry=${expiry}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Presigned Upload-URL fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      return result.presignedUrl;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der presigned Upload-URL:', error);
      throw error;
    }
  }

  /**
   * Erstellt eine presigned URL für Download über Backend-API
   */
  async getPresignedDownloadUrl(
    bucketName: string, 
    objectName: string, 
    expiry: number = 7 * 24 * 60 * 60 // 7 Tage
  ): Promise<string> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/buckets/${bucketName}/presigned-download/${objectName}?expiry=${expiry}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Presigned Download-URL fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      return result.presignedUrl;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der presigned Download-URL:', error);
      throw error;
    }
  }

  /**
   * Kopiert ein Objekt innerhalb von MinIO über Backend-API
   */
  async copyObject(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string
  ): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/api/minio/copy-object`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceBucket,
          sourceObject,
          destBucket,
          destObject
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Objekt-Kopie fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Objekt erfolgreich kopiert: ${sourceBucket}/${sourceObject} -> ${destBucket}/${destObject}`, result);
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
   * Setzt die Backend-URL
   */
  setBackendUrl(url: string): void {
    this.backendUrl = url;
  }
}

// Singleton-Instanz exportieren
export const minioService = new MinIOService();
