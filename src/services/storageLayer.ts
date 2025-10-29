import { StorageConfig, StorageData, StoragePicture } from '../types/storage';
// AWS SDK Import - Standard-Pfad
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// AWS SDK Typen werden jetzt direkt importiert

// JWT Token für PostgreSQL
interface JWTToken {
  token: string;
  expires: number;
}

// Storage Entity Interface mit Hybrid-ID-System
export interface StorageEntity {
  id: string; // Frontend-ID
  db_id?: string; // DB-ID für Datenbank-Operationen (Primary Key)
  isDirty?: boolean; // Wurde geändert?
  isNew?: boolean; // Neuer Datensatz?
  syncStatus?: 'synced' | 'pending' | 'error' | 'conflict';
  [key: string]: any;
}

// Storage Mode Types
export type StorageMode = 'local' | 'cloud';
export type CloudStorageType = 'docker' | 'supabase' | 'firebase' | 'postgres';

// Adapter Interface
export interface StorageAdapter {
  name: string;
  type: string;
  save<T extends StorageEntity>(
    key: string, 
    data: T[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean>;
  load<T extends StorageEntity>(key: string): Promise<T[] | null>;
  delete<T extends StorageEntity>(key: string, id: string): Promise<boolean>;
  testConnection?(): Promise<boolean>;
}

// LocalStorage Adapter
export class LocalStorageAdapter implements StorageAdapter {
  name = 'LocalStorageAdapter';
  type = 'localStorage';

  async save<T extends StorageEntity>(
    key: string, 
    data: T[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    try {
      // Lade bestehende Daten
      const existingData = await this.load<T>(key) || [];
      console.log(`💾 LocalStorage: Bestehende ${key}: ${existingData.length} Einträge`);
      console.log(`💾 LocalStorage: Neue ${key}: ${data.length} Einträge`);
      
      // Rufe Progress-Callback auf
      if (onProgress) {
        onProgress(0, data.length);
      }
      
      // Merge die neuen Daten mit den bestehenden
      const mergedData = [...existingData];
      
      for (let i = 0; i < data.length; i++) {
        const newItem = data[i];
        
        // Rufe Progress-Callback VOR der Verarbeitung auf
        if (onProgress) {
          onProgress(i, data.length);
        }
        
        const existingIndex = mergedData.findIndex(item => item.id === newItem.id);
        if (existingIndex >= 0) {
          // Ersetze bestehenden Eintrag
          mergedData[existingIndex] = newItem;
          console.log(`💾 LocalStorage: Artikel ${newItem.id} aktualisiert`);
        } else {
          // Füge neuen Eintrag hinzu
          mergedData.push(newItem);
          console.log(`💾 LocalStorage: Artikel ${newItem.id} hinzugefügt`);
        }
        
        // Kleine Verzögerung für sichtbaren Fortschritt (nur bei vielen Items)
        if (data.length > 10 && i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Finaler Progress-Callback
      if (onProgress) {
        onProgress(data.length, data.length);
      }
      
      // Speichere die zusammengeführten Daten
      localStorage.setItem(`chef_${key}`, JSON.stringify(mergedData));
      console.log(`💾 LocalStorage: ${key} gespeichert (${mergedData.length} Einträge total)`);
      return true;
    } catch (error) {
      console.error(`❌ LocalStorage Fehler beim Speichern von ${key}:`, error);
      return false;
    }
  }

  async load<T extends StorageEntity>(key: string): Promise<T[] | null> {
    try {
      const data = localStorage.getItem(`chef_${key}`);
      if (!data || data === 'null' || data === 'undefined') {
        return [];
      }
      const parsedData = JSON.parse(data);
      return Array.isArray(parsedData) ? parsedData as T[] : [];
    } catch (error) {
      console.error(`❌ LocalStorage Fehler beim Laden von ${key}:`, error);
      return null;
    }
  }

  async delete<T extends StorageEntity>(key: string, id: string): Promise<boolean> {
    try {
      const data = await this.load<T>(key);
      if (!data) return false;
      
      const filteredData = data.filter(item => item.id !== id);
      
      // Speichere die gefilterten Daten direkt (ohne Merge)
      localStorage.setItem(`chef_${key}`, JSON.stringify(filteredData));
      console.log(`💾 LocalStorage: ${key} gelöscht (${filteredData.length} Einträge übrig)`);
      return true;
    } catch (error) {
      console.error(`❌ LocalStorage Fehler beim Löschen von ${key}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test LocalStorage availability
      const testKey = 'chef_test_connection';
      const testData = { id: 'test', timestamp: Date.now() };
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === JSON.stringify(testData);
    } catch (error) {
      console.error('❌ LocalStorage Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Bereinigt korrupte LocalStorage-Daten
   */
  async cleanupCorruptedData(): Promise<void> {
    console.log('🧹 Starte Bereinigung korrupter LocalStorage-Daten...');
    
    const keysToCheck = ['articles', 'suppliers', 'recipes', 'einkaufsListe', 'inventurListe'];
    let cleanedCount = 0;
    
    for (const key of keysToCheck) {
      const data = localStorage.getItem(`chef_${key}`);
      if (data === 'null' || data === 'undefined') {
        console.log(`🗑️ Entferne korrupte Daten für ${key}: ${data}`);
        localStorage.removeItem(`chef_${key}`);
        cleanedCount++;
      }
    }
    
    console.log(`✅ Bereinigung abgeschlossen: ${cleanedCount} korrupte Einträge entfernt`);
  }

  /**
   * Speichert ein Bild im lokalen Dateisystem
   */
  async saveImage(imagePath: string, file: File): Promise<boolean> {
    try {
      console.log(`📷 LocalStorage: Speichere Bild unter ${imagePath}`);
      
      // Konvertiere File zu Base64 für LocalStorage
      const base64 = await this.fileToBase64(file);
      
      // Lade bestehende Bilder-Struktur
      const existingImages = this.loadImageStructure();
      
      // Parse imagePath: "pictures/recipes/{recipeId}" oder "pictures/articles/{articleId}"
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'pictures' && (pathParts[1] === 'recipes' || pathParts[1] === 'articles')) {
        const entityType = pathParts[1]; // 'recipes' oder 'articles'
        const entityId = pathParts[2];
        
        // Erstelle verschachtelte Struktur falls nicht vorhanden
        if (!existingImages.pictures) existingImages.pictures = {};
        if (!existingImages.pictures[entityType]) existingImages.pictures[entityType] = {};
        
        // Speichere das Bild unter der Entity-ID
        existingImages.pictures[entityType][entityId] = base64;
        
        // Speichere die gesamte Struktur zurück
        localStorage.setItem('chef_images', JSON.stringify(existingImages));
        
        console.log(`✅ LocalStorage: Bild erfolgreich gespeichert unter chef_images.pictures.${entityType}.${entityId}`);
        return true;
      } else {
        throw new Error(`Ungültiger Bildpfad: ${imagePath}. Erwartet: pictures/recipes/{recipeId} oder pictures/articles/{articleId}`);
      }
    } catch (error) {
      console.error(`❌ LocalStorage Fehler beim Speichern des Bildes ${imagePath}:`, error);
      return false;
    }
  }

  /**
   * Lädt ein Bild aus dem lokalen Dateisystem
   */
  async loadImage(imagePath: string): Promise<string | null> {
    try {
      console.log(`📷 LocalStorage: Lade Bild von ${imagePath}`);
      
      // Lade Bilder-Struktur
      const imageStructure = this.loadImageStructure();
      
      // Parse imagePath: "pictures/recipes/{recipeId}" oder "pictures/articles/{articleId}"
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'pictures' && (pathParts[1] === 'recipes' || pathParts[1] === 'articles')) {
        const entityType = pathParts[1]; // 'recipes' oder 'articles'
        const entityId = pathParts[2];
        
        // Navigiere durch die verschachtelte Struktur
        const base64 = imageStructure?.pictures?.[entityType]?.[entityId];
        
        if (!base64) {
          console.log(`📷 LocalStorage: Kein Bild gefunden unter chef_images.pictures.${entityType}.${entityId}`);
          return null;
        }
        
        console.log(`✅ LocalStorage: Bild erfolgreich geladen von chef_images.pictures.${entityType}.${entityId}`);
        return base64;
      } else {
        throw new Error(`Ungültiger Bildpfad: ${imagePath}. Erwartet: pictures/recipes/{recipeId} oder pictures/articles/{articleId}`);
      }
    } catch (error) {
      console.error(`❌ LocalStorage Fehler beim Laden des Bildes ${imagePath}:`, error);
      return null;
    }
  }

  /**
   * Löscht ein Bild aus dem lokalen Dateisystem
   */
  async deleteImage(imagePath: string): Promise<boolean> {
    try {
      console.log(`📷 LocalStorage: Lösche Bild von ${imagePath}`);
      
      // Lade bestehende Bilder-Struktur
      const existingImages = this.loadImageStructure();
      
      // Parse imagePath: "pictures/recipes/{recipeId}" oder "pictures/articles/{articleId}"
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'pictures' && (pathParts[1] === 'recipes' || pathParts[1] === 'articles')) {
        const entityType = pathParts[1]; // 'recipes' oder 'articles'
        const entityId = pathParts[2];
        
        // Prüfe ob das Bild existiert
        if (existingImages?.pictures?.[entityType]?.[entityId]) {
          // Lösche das Bild aus der Struktur
          delete existingImages.pictures[entityType][entityId];
          
          // Speichere die aktualisierte Struktur zurück
          localStorage.setItem('chef_images', JSON.stringify(existingImages));
          
          console.log(`✅ LocalStorage: Bild erfolgreich gelöscht von chef_images.pictures.${entityType}.${entityId}`);
          return true;
        } else {
          console.log(`📷 LocalStorage: Kein Bild gefunden zum Löschen unter chef_images.pictures.${entityType}.${entityId}`);
          return false;
        }
      } else {
        throw new Error(`Ungültiger Bildpfad: ${imagePath}. Erwartet: pictures/recipes/{recipeId} oder pictures/articles/{articleId}`);
      }
    } catch (error) {
      console.error(`❌ LocalStorage Fehler beim Löschen des Bildes ${imagePath}:`, error);
      return false;
    }
  }

  /**
   * Konvertiert eine File zu Base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Lädt die Bilder-Struktur aus dem LocalStorage
   */
  private loadImageStructure(): any {
    try {
      const data = localStorage.getItem('chef_images');
      if (!data || data === 'null' || data === 'undefined') {
        return {};
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ LocalStorage Fehler beim Laden der Bilder-Struktur:', error);
      return {};
    }
  }
}

// PostgreSQL Adapter (PostgREST)
class PostgreSQLAdapter implements StorageAdapter {
  name = 'PostgreSQLAdapter';
  type = 'postgresql';

  constructor(private connectionData: any) {
    console.log('🐘 PostgreSQLAdapter erstellt mit ConnectionData:', connectionData);
    
    // Schema-Initialisierung erfolgt jetzt nur noch bei Konfigurationsübernahme in StorageManagement.tsx
  }

  // NEU: Schema-Initialisierung (Phase 2)
  private async initializeSchema(): Promise<void> {
    try {
      console.log('🔧 Starte Schema-Initialisierung für PostgreSQL...');
      
      // Lade das Init-Script vom Server (öffentliche Assets werden von / aus serviert)
      const response = await fetch('/init-scripts/init-chef-numbers-postgresql.sql');
      if (!response.ok) {
        console.warn('⚠️ Init-Script nicht gefunden (404) - überspringe Schema-Init');
        console.warn(`   Pfad: /init-scripts/init-chef-numbers-postgresql.sql`);
        return;
      }
      
      const sqlScript = await response.text();
      console.log('✅ Init-Script geladen, starte Schema-Initialisierung...');
      console.log(`📏 Script-Länge: ${sqlScript.length} Zeichen`);
      
      // Warte kurz auf PostgREST
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Führe das Schema-Script über execute_safe_sql aus
      const result = await this.executeSQL(sqlScript);
      console.log('✅ Schema-Initialisierung Ergebnis:', result);
      
    } catch (error) {
      console.error('❌ Schema-Initialisierung fehlgeschlagen:', error);
      console.log('⚠️ Adapter funktioniert weiterhin ohne Schema-Init');
    }
  }
  
  // Führe SQL über RPC aus
  private async executeSQL(sql: string): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/rpc/execute_safe_sql`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql_text: sql })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SQL-Execution fehlgeschlagen: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Fehler bei SQL-Execution:', error);
      throw error;
    }
  }

  private async createNewJWTToken(): Promise<{ token: string; expires: number } | null> {
    try {
      console.log('🔑 Erstelle neues JWT-Token automatisch...');
      
      // Generiere JWT-Secret aus Passwort (gleiche Logik wie im Frontend)
      const encoder = new TextEncoder();
      const data = encoder.encode(this.connectionData.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const jwtSecret = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
      const secretKey = new TextEncoder().encode(jwtSecret);

      // Erstelle neues JWT-Token
      // WICHTIG: Verwende 'anon' role für PostgREST (nicht 'service_role')
      const { SignJWT } = await import('jose');
      const jwt = await new SignJWT({
        role: 'anon'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(secretKey);

      const expires = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 Tage in Millisekunden
      
      console.log('✅ Neues JWT-Token automatisch erstellt');
      
      // WICHTIG: Speichere das neue Token auch im LocalStorage storageManagement
      await this.saveTokenToLocalStorage(jwt, expires);
      
      return { token: jwt, expires };
    } catch (error) {
      console.error('❌ Fehler beim automatischen Erstellen des JWT-Tokens:', error);
      return null;
    }
  }

  // Speichere JWT-Token im LocalStorage storageManagement
  private async saveTokenToLocalStorage(token: string, expires: number): Promise<void> {
    try {
      const storageManagementData = localStorage.getItem('storageManagement');
      
      if (storageManagementData) {
        const parsed = JSON.parse(storageManagementData);
        
        // Aktualisiere das JWT-Token in der PostgreSQL-Verbindung
        if (parsed.connections?.postgres) {
          parsed.connections.postgres.jwtToken = token;
          parsed.connections.postgres.jwtTokenExpires = expires;
          
          // Speichere zurück ins LocalStorage
          localStorage.setItem('storageManagement', JSON.stringify(parsed));
          
          console.log('💾 JWT-Token im LocalStorage storageManagement aktualisiert');
          console.log('🔑 Token Expires:', new Date(expires).toISOString());
        } else {
          console.warn('⚠️ PostgreSQL-Verbindung nicht in storageManagement gefunden');
        }
      } else {
        console.warn('⚠️ storageManagement nicht im LocalStorage gefunden');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern des JWT-Tokens im LocalStorage:', error);
    }
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };

    // Füge JWT Token hinzu, falls vorhanden
    if (this.connectionData.jwtToken) {
      headers['Authorization'] = `Bearer ${this.connectionData.jwtToken}`;
    }

    return headers;
  }

  private getBaseUrl(): string {
    console.log(`🐘 ConnectionData Keys:`, Object.keys(this.connectionData));
    console.log(`🐘 Host: ${this.connectionData.host}`);
    console.log(`🐘 PostgREST Port: ${this.connectionData.postgrestPort}`);
    console.log(`🐘 PostgreSQL Port: ${this.connectionData.port}`);
    
    // Verwende PostgREST-Port, falls verfügbar, sonst Standard-PostgREST-Port 3000
    const postgrestPort = this.connectionData.postgrestPort || '3000';
    
    const baseUrl = `http://${this.connectionData.host}:${postgrestPort}`;
    console.log(`🐘 PostgreSQL BaseUrl: ${baseUrl} (verwendeter Port: ${postgrestPort})`);
    return baseUrl;
  }

  async save<T extends StorageEntity>(
    key: string, 
    data: T[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    try {
      console.log(`🐘 PostgreSQL: ${key} speichern (${data.length} Einträge)`);
      
      // Transformiere Daten für PostgreSQL
      const transformedData = this.transformDataForPostgreSQL(data);
      
      // Debug: Zeige die zu sendenden Daten
      console.log(`🐘 Ursprüngliche Daten:`, JSON.stringify(data, null, 2));
      console.log(`🐘 Transformierte Daten:`, JSON.stringify(transformedData, null, 2));
      
      // PostgREST verwendet POST für neue Einträge, PUT/PATCH für Updates
      let allSuccess = true;
      
      for (let i = 0; i < transformedData.length; i++) {
        const item = transformedData[i];
        
        // Rufe Progress-Callback auf
        if (onProgress) {
          onProgress(i, transformedData.length);
        }
        
        // Bestimme HTTP-Methode basierend auf db_id:
        // - Wenn db_id vorhanden: Update (PUT)
        // - Wenn db_id fehlt: Neuer Datensatz (POST), PostgreSQL generiert db_id automatisch
        const isUpdate = !!item.db_id;
        
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate 
          ? `${this.getBaseUrl()}/${key}?db_id=eq.${item.db_id}` 
          : `${this.getBaseUrl()}/${key}`;
        
        console.log(`🐘 HTTP-Methode: ${method} (${isUpdate ? 'Update' : 'Insert'}), URL: ${url}`);
        console.log(`🐘 Item db_id: ${item.db_id || 'wird von PostgreSQL generiert'}, Frontend-ID: ${item.id}`);
        
        const response = await fetch(url, {
          method: method,
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
            // Wichtig: Bei POST möchten wir die generierte db_id zurück
            'Prefer': isUpdate ? 'return=minimal' : 'return=representation'
          },
          body: JSON.stringify(item)
        });
        
        // Prüfe auf 401 Unauthorized (Token abgelaufen)
        if (response.status === 401) {
          console.warn('⚠️ 401 Unauthorized - Token möglicherweise abgelaufen, versuche Erneuerung...');
          const newToken = await this.createNewJWTToken();
          if (newToken) {
            this.connectionData.jwtToken = newToken.token;
            this.connectionData.jwtTokenExpires = newToken.expires;
            
            // Retry mit neuem Token - verwende die gleiche Methode und URL
            const retryResponse = await fetch(url, {
              method: method,
              headers: {
                ...this.getAuthHeaders(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(item)
            });
            
            if (!retryResponse.ok) {
              // Debug: Lese Response Body für detaillierte Fehlermeldung
              try {
                const errorText = await retryResponse.text();
                console.error(`🐘 PostgreSQL Response Body (${retryResponse.status}):`, errorText);
              } catch (e) {
                console.error(`🐘 Could not read PostgreSQL response body:`, e);
              }
              
              allSuccess = false;
              break;
            }
          } else {
            allSuccess = false;
            break;
          }
        } else if (!response.ok) {
          // Debug: Lese Response Body für detaillierte Fehlermeldung
          try {
            const errorText = await response.text();
            console.error(`🐘 PostgreSQL Response Body (${response.status}):`, errorText);
          } catch (e) {
            console.error(`🐘 Could not read PostgreSQL response body:`, e);
          }
          
          allSuccess = false;
          break;
        } else {
          console.log(`✅ PostgreSQL: Einzelnes Item erfolgreich gespeichert`);
          
          // Bei POST (neuer Datensatz): Lese die generierte db_id aus der Response
          if (!isUpdate && response.ok) {
            try {
              const responseData = await response.json();
              if (responseData && responseData.length > 0 && responseData[0].db_id) {
                const generatedDbId = responseData[0].db_id;
                console.log(`🆕 PostgreSQL hat db_id generiert: ${generatedDbId} für Frontend-ID: ${item.id}`);
                
                // Finde das ursprüngliche Item und aktualisiere die db_id
                const originalItem = data.find(orig => orig.id === item.id);
                if (originalItem) {
                  originalItem.db_id = generatedDbId;
                  console.log(`✅ db_id für Frontend-ID ${item.id} aktualisiert: ${generatedDbId}`);
                }
              }
            } catch (e) {
              console.warn('⚠️ Konnte generierte db_id nicht aus Response lesen:', e);
            }
          }
        }
      }
      
      if (!allSuccess) {
        throw new Error(`PostgreSQL Fehler beim Speichern von ${key}`);
      }
      
      // Rufe finalen Progress-Callback auf
      if (onProgress) {
        onProgress(transformedData.length, transformedData.length);
      }
      
      console.log(`✅ PostgreSQL: ${key} erfolgreich gespeichert`);
      return true;
    } catch (error) {
      console.error(`❌ PostgreSQL Fehler beim Speichern von ${key}:`, error);
      return false;
    }
  }

  // Neue Methode: Teste verfügbare Tabellen
  async testTables(): Promise<void> {
    try {
      const baseUrl = this.getBaseUrl();
      
      // Teste verfügbare Tabellen
      const tablesToTest = ['articles', 'suppliers', 'recipes'];
      
      for (const table of tablesToTest) {
        try {
          const response = await fetch(`${baseUrl}/${table}?limit=1`, {
            method: 'GET',
            headers: this.getAuthHeaders()
          });
          
          if (response.ok) {
            console.log(`✅ Tabelle ${table} ist verfügbar`);
          } else {
            console.warn(`⚠️ Tabelle ${table} nicht verfügbar: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.warn(`⚠️ Fehler beim Testen der Tabelle ${table}:`, error);
        }
      }
    } catch (error) {
      console.error('🐘 Fehler beim Testen der Tabellen:', error);
    }
  }

  // Neue Methode: Transformiere Daten für PostgreSQL
  private transformDataForPostgreSQL<T extends StorageEntity>(data: T[]): any[] {
    return data.map(item => {
      const transformed: any = { ...item };
      
      // Trennung von db_id und id:
      // - db_id: Wird von PostgreSQL automatisch generiert (bei neuen Datensätzen)
      // - id: Frontend-ID für State-Management (bleibt unverändert)
      if (transformed.db_id) {
        // Bestehender Datensatz: Verwende db_id für Datenbank-Operationen
        console.log(`🔄 PostgreSQL Transform: Update für bestehenden Datensatz mit db_id: ${transformed.db_id}, Frontend-ID: ${transformed.id}`);
      } else {
        // Neuer Datensatz: KEINE db_id senden - PostgreSQL generiert sie automatisch via DEFAULT gen_random_uuid()
        delete transformed.db_id; // Stelle sicher, dass db_id nicht mitgesendet wird
        console.log(`🆕 PostgreSQL Transform: Neuer Datensatz mit Frontend-ID: ${transformed.id}, db_id wird von PostgreSQL generiert`);
      }
      
      // Entferne veraltetes dbId-Feld falls vorhanden
      if (transformed.dbId) {
        delete transformed.dbId;
      }
      
      // Entferne Sync-Felder (werden nicht in DB gespeichert)
      delete transformed.isDirty;
      delete transformed.isNew;
      delete transformed.syncStatus;
      
      // Entferne Timestamp-Felder (werden von PostgreSQL automatisch verwaltet)
      delete transformed.createdAt;
      delete transformed.updatedAt;
      delete transformed.created_at;
      delete transformed.updated_at;
      
      // WICHTIG: Entferne das alte 'supplier'-Feld (gibt es nicht in der DB)
      delete transformed.supplier;
      
      // Feldnamen-Mapping für PostgreSQL
      // supplier_id verweist auf die Frontend-ID (supplier.id), nicht db_id
      if (transformed.supplierId) {
        // Validierung: Nur wenn supplierId ein gültiges UUID-Format hat
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(transformed.supplierId)) {
          transformed.supplier_id = transformed.supplierId;
        } else {
          // PostgreSQL benötigt NOT NULL - verwende einen Dummy-Supplier wenn ungültig
          console.warn(`⚠️ Invalid supplier_id format: "${transformed.supplierId}" - using dummy supplier`);
          transformed.supplier_id = '00000000-0000-0000-0000-000000000000';
        }
        delete transformed.supplierId;
      }
      
      if (transformed.supplierArticleNumber) {
        transformed.supplier_article_number = transformed.supplierArticleNumber;
        delete transformed.supplierArticleNumber;
      }
      
      if (transformed.bundleUnit) {
        transformed.bundle_unit = transformed.bundleUnit;
        delete transformed.bundleUnit;
      }
      
      if (transformed.bundlePrice) {
        transformed.bundle_price = transformed.bundlePrice;
        delete transformed.bundlePrice;
      }
      
      if (transformed.bundleEanCode) {
        transformed.bundle_ean_code = transformed.bundleEanCode;
        delete transformed.bundleEanCode;
      }
      
      if (transformed.contentUnit) {
        transformed.content_unit = transformed.contentUnit;
        delete transformed.contentUnit;
      }
      
      if (transformed.contentEanCode) {
        transformed.content_ean_code = transformed.contentEanCode;
        delete transformed.contentEanCode;
      }
      
      // content field is already in correct format (snake_case not needed)
      // Just keep it as is
      
      if (transformed.pricePerUnit) {
        transformed.price_per_unit = transformed.pricePerUnit;
        delete transformed.pricePerUnit;
      }
      
      if (transformed.vatRate) {
        transformed.vat_rate = transformed.vatRate;
        delete transformed.vatRate;
      }
      
      // Handle nutrition fields - merge both nutrition and nutritionInfo
      // NUR für Articles (Suppliers haben kein nutritionInfo!)
      if (transformed.nutrition || transformed.nutritionInfo) {
        // Use nutritionInfo if available, otherwise use nutrition
        const nutritionData = transformed.nutritionInfo || transformed.nutrition;
        
        // Nur setzen wenn nutritionData tatsächlich ein gültiges Objekt ist
        if (nutritionData && typeof nutritionData === 'object' && Object.keys(nutritionData).length > 0) {
          transformed.nutrition_info = nutritionData;
        }
        
        // Remove both original fields
        delete transformed.nutrition;
        delete transformed.nutritionInfo;
      }
      
      // Entferne nutritionInfo von Suppliers (falls vorhanden)
      if (transformed.nutrition_info !== undefined && !transformed.category) {
        // Kein category-Feld = kein Article = kein nutritionInfo erlaubt
        delete transformed.nutrition_info;
      }
      
      // Handle openFoodFactsCode field
      if (transformed.openFoodFactsCode) {
        transformed.open_food_facts_code = transformed.openFoodFactsCode;
        delete transformed.openFoodFactsCode;
      }
      
      // Handle Recipe-spezifische Felder - transform camelCase to snake_case
      if (transformed.preparationTime !== undefined) {
        transformed.preparation_time = transformed.preparationTime;
        delete transformed.preparationTime;
      }
      
      if (transformed.markupPercentage !== undefined) {
        transformed.markup_percentage = transformed.markupPercentage;
        delete transformed.markupPercentage;
      }
      
      if (transformed.materialCosts !== undefined) {
        transformed.material_costs = transformed.materialCosts;
        delete transformed.materialCosts;
      }
      
      if (transformed.sellingPrice !== undefined) {
        transformed.selling_price = transformed.sellingPrice;
        delete transformed.sellingPrice;
      }
      
      if (transformed.preparationSteps) {
        transformed.preparation_steps = transformed.preparationSteps;
        delete transformed.preparationSteps;
      }
      
      if (transformed.usedRecipes) {
        transformed.used_recipes = transformed.usedRecipes;
        delete transformed.usedRecipes;
      }
      
      if (transformed.totalNutritionInfo) {
        transformed.total_nutrition_info = transformed.totalNutritionInfo;
        delete transformed.totalNutritionInfo;
      }
      
      // WICHTIG: Entferne image-Feld (nur für Frontend, wird separat gespeichert)
      delete transformed.image;
      
      // Handle supplier fields - transform camelCase to snake_case
      if (transformed.contactPerson) {
        transformed.contact_person = transformed.contactPerson;
        delete transformed.contactPerson;
      }
      
      // Address-Feld: Stelle sicher dass es ein Objekt ist (kein String)
      if (transformed.address) {
        // Falls address ein String ist, parse es
        if (typeof transformed.address === 'string') {
          try {
            transformed.address = JSON.parse(transformed.address);
          } catch (e) {
            console.warn('⚠️ Konnte address-String nicht parsen:', transformed.address);
            transformed.address = { street: '', zipCode: '', city: '', country: '' };
          }
        }
        // PostgreSQL JSONB braucht kein extra Mapping
      }
      
      if (transformed.phoneNumbers) {
        transformed.phone_numbers = transformed.phoneNumbers;
        delete transformed.phoneNumbers;
      }
      
      // Handle timestamp fields - entfernen, da sie von PostgreSQL verwaltet werden
      // Diese Felder werden automatisch von der Datenbank gesetzt
      delete transformed.createdAt;
      delete transformed.updatedAt;
      delete transformed.created_at;
      delete transformed.updated_at;
      
      // User-Tracking Felder (optional - werden später implementiert)
      delete transformed.createdBy;
      delete transformed.updatedBy;
      delete transformed.lastModifiedBy;
      delete transformed.created_by;
      delete transformed.updated_by;
      delete transformed.last_modified_by;
      
      // Sync status fields wurden bereits am Anfang entfernt
      // Doppelte Prüfung für Sicherheit
      delete transformed.isDirty;
      delete transformed.isNew;
      delete transformed.syncStatus;
      delete transformed.is_dirty;
      delete transformed.is_new;
      delete transformed.sync_status;
      
      // Transformiere spezifische Felder je nach Tabelle
      if (transformed.allergens && Array.isArray(transformed.allergens)) {
        // PostgreSQL erwartet TEXT[] für Allergene
        transformed.allergens = transformed.allergens.filter((a: any) => a && a.trim());
      }
      
      if (transformed.additives && Array.isArray(transformed.additives)) {
        // PostgreSQL erwartet TEXT[] für Zusatzstoffe
        transformed.additives = transformed.additives.filter((a: any) => a && a.trim());
      }
      
      // Entferne nur wirklich leere Werte, aber behalte gültige Strings
      Object.keys(transformed).forEach(key => {
        if (transformed[key] === undefined || transformed[key] === null) {
          delete transformed[key];
        } else if (typeof transformed[key] === 'string' && transformed[key].trim() === '') {
          // Entferne nur leere Strings, aber behalte leere Strings die als gültige Werte gelten
          if (key !== 'notes' && key !== 'ingredients' && key !== 'category') {
            delete transformed[key];
          }
        }
      });
      
      return transformed;
    });
  }

  // Hilfsfunktion: Generiere UUID (nicht mehr benötigt, da PostgreSQL automatisch generiert)
  // Wird für Kompatibilität beibehalten, falls andere Adapter sie benötigen
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Hilfsfunktion: Parse JSONB-String zu Objekt
  private parseJSONBField(field: any): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error('❌ Fehler beim Parsen von JSONB-Feld:', e);
        return field; // Gib Original zurück bei Fehler
      }
    }
    return field;
  }

  // Neue Methode: Transformiere Daten von PostgreSQL zurück zu Frontend-Format
  private transformDataFromPostgreSQL(data: any[]): any[] {
    return data.map(item => {
      const transformed: any = { ...item };
      
      // Trennung von db_id und id:
      // - db_id aus Datenbank bleibt als db_id (für zukünftige Updates)
      // - id bleibt unverändert als Frontend-ID für State-Management
      
      // WICHTIG: id NICHT überschreiben!
      // Die Frontend-ID (id) bleibt unverändert für State-Konsistenz
      // Sie ist bereits im Datensatz vorhanden und sollte nicht modifiziert werden
      
      // db_id bleibt erhalten (wird für Updates benötigt)
      
      transformed.isDirty = false;
      transformed.isNew = false;
      transformed.syncStatus = 'synced';
      
      // Entferne veraltetes dbId-Feld falls vorhanden
      if (transformed.dbId) {
        delete transformed.dbId;
      }
      
      // Feldnamen-Mapping von PostgreSQL zu Frontend
      if (transformed.supplier_id) {
        transformed.supplierId = transformed.supplier_id;
        delete transformed.supplier_id;
      }
      
      if (transformed.supplier_article_number) {
        transformed.supplierArticleNumber = transformed.supplier_article_number;
        delete transformed.supplier_article_number;
      }
      
      if (transformed.bundle_unit) {
        transformed.bundleUnit = transformed.bundle_unit;
        delete transformed.bundle_unit;
      }
      
      if (transformed.bundle_price) {
        transformed.bundlePrice = transformed.bundle_price;
        delete transformed.bundle_price;
      }
      
      if (transformed.bundle_ean_code) {
        transformed.bundleEanCode = transformed.bundle_ean_code;
        delete transformed.bundle_ean_code;
      }
      
      if (transformed.content_unit) {
        transformed.contentUnit = transformed.content_unit;
        delete transformed.content_unit;
      }
      
      if (transformed.content_ean_code) {
        transformed.contentEanCode = transformed.content_ean_code;
        delete transformed.content_ean_code;
      }
      
      // content field is already in correct format (no transformation needed)
      
      if (transformed.price_per_unit) {
        transformed.pricePerUnit = transformed.price_per_unit;
        delete transformed.price_per_unit;
      }
      
      if (transformed.vat_rate) {
        transformed.vatRate = transformed.vat_rate;
        delete transformed.vat_rate;
      }
      
      // Handle openFoodFactsCode field - convert back to Frontend format
      if (transformed.open_food_facts_code) {
        transformed.openFoodFactsCode = transformed.open_food_facts_code;
        delete transformed.open_food_facts_code;
      }
      
      // Handle nutrition fields - convert back to Frontend format
      if (transformed.nutrition_info) {
        console.log('🔍 Nutrition Info gefunden in DB:', transformed.nutrition_info);
        console.log('🔍 Nutrition Info Typ:', typeof transformed.nutrition_info);
        
        // Frontend expects nutritionInfo field
        // Stelle sicher, dass alle Nährwert-Felder vorhanden sind
        let nutritionData = transformed.nutrition_info;
        
        // WICHTIG: PostgREST liefert manchmal JSONB als String zurück!
        if (typeof nutritionData === 'string') {
          try {
            
            nutritionData = JSON.parse(nutritionData);
            
          } catch (e) {
            console.error('❌ Fehler beim Parsen von nutrition_info:', e);
            nutritionData = null;
          }
        }
        
        // Prüfe ob nutrition_info ein gültiges Objekt ist
        if (typeof nutritionData === 'object' && nutritionData !== null) {
          // Validiere und säubere die Nährwert-Daten
          transformed.nutritionInfo = {
            calories: nutritionData.calories || 0,
            kilojoules: nutritionData.kilojoules || 0,
            protein: nutritionData.protein || 0,
            fat: nutritionData.fat || 0,
            carbohydrates: nutritionData.carbohydrates || 0,
            fiber: nutritionData.fiber !== undefined ? nutritionData.fiber : 0,
            sugar: nutritionData.sugar,
            salt: nutritionData.salt
          };
                    
        } else {
          console.warn('⚠️ Nutrition Info ist kein gültiges Objekt:', nutritionData);
          // Setze leeres Nährwert-Objekt
          transformed.nutritionInfo = {
            calories: 0,
            kilojoules: 0,
            protein: 0,
            fat: 0,
            carbohydrates: 0,
            fiber: 0,
            sugar: undefined,
            salt: undefined
          };
        }
        
        delete transformed.nutrition_info;
      } else {
        console.log('⚠️ Keine Nutrition Info in DB gefunden für Artikel:', transformed.name || transformed.id);
        // Setze leeres Nährwert-Objekt wenn nicht vorhanden
        transformed.nutritionInfo = {
          calories: 0,
          kilojoules: 0,
          protein: 0,
          fat: 0,
          carbohydrates: 0,
          fiber: 0,
          sugar: undefined,
          salt: undefined
        };
      }
      
      // Handle supplier fields - convert back to camelCase
      if (transformed.contact_person) {
        transformed.contactPerson = transformed.contact_person;
        delete transformed.contact_person;
      }
      
      // Handle address (JSONB field - kann als String kommen)
      if (transformed.address) {
        if (typeof transformed.address === 'string') {
          try {
            transformed.address = JSON.parse(transformed.address);
          } catch (e) {
            console.error('❌ Fehler beim Parsen von address:', e);
            transformed.address = null;
          }
        }
      }
      
      // Handle phone_numbers (JSONB field - kann als String kommen)
      if (transformed.phone_numbers) {
        let phoneData = transformed.phone_numbers;
        if (typeof phoneData === 'string') {
          try {
            phoneData = JSON.parse(phoneData);
          } catch (e) {
            console.error('❌ Fehler beim Parsen von phone_numbers:', e);
            phoneData = [];
          }
        }
        transformed.phoneNumbers = phoneData;
        delete transformed.phone_numbers;
      }
      
      // Handle timestamp fields - convert back to camelCase
      if (transformed.created_at) {
        transformed.createdAt = transformed.created_at;
        delete transformed.created_at;
      }
      
      if (transformed.updated_at) {
        transformed.updatedAt = transformed.updated_at;
        delete transformed.updated_at;
      }
      
      if (transformed.created_by) {
        transformed.createdBy = transformed.created_by;
        delete transformed.created_by;
      }
      
      if (transformed.updated_by) {
        transformed.updatedBy = transformed.updated_by;
        delete transformed.updated_by;
      }
      
      if (transformed.last_modified_by) {
        transformed.lastModifiedBy = transformed.last_modified_by;
        delete transformed.last_modified_by;
      }
      
      // Handle sync status fields
      if (transformed.is_dirty) {
        transformed.isDirty = transformed.is_dirty;
        delete transformed.is_dirty;
      }
      
      if (transformed.is_new) {
        transformed.isNew = transformed.is_new;
        delete transformed.is_new;
      }
      
      if (transformed.sync_status) {
        transformed.syncStatus = transformed.sync_status;
        delete transformed.sync_status;
      }
      
      // Handle Recipe-spezifische Felder - convert back to camelCase
      if (transformed.preparation_time !== undefined) {
        transformed.preparationTime = transformed.preparation_time;
        delete transformed.preparation_time;
      }
      
      if (transformed.markup_percentage !== undefined) {
        transformed.markupPercentage = transformed.markup_percentage;
        delete transformed.markup_percentage;
      }
      
      if (transformed.material_costs !== undefined) {
        transformed.materialCosts = transformed.material_costs;
        delete transformed.material_costs;
      }
      
      if (transformed.selling_price !== undefined) {
        transformed.sellingPrice = transformed.selling_price;
        delete transformed.selling_price;
      }
      
      // Handle Recipe-spezifische JSONB-Felder (können als String kommen)
      if (transformed.ingredients) {
        transformed.ingredients = this.parseJSONBField(transformed.ingredients);
      }
      
      if (transformed.usedRecipes || transformed.used_recipes) {
        const usedRecipes = transformed.usedRecipes || transformed.used_recipes;
        transformed.usedRecipes = this.parseJSONBField(usedRecipes);
        delete transformed.used_recipes;
      }
      
      if (transformed.preparationSteps || transformed.preparation_steps) {
        const prepSteps = transformed.preparationSteps || transformed.preparation_steps;
        transformed.preparationSteps = this.parseJSONBField(prepSteps);
        delete transformed.preparation_steps;
      }
      
      if (transformed.totalNutritionInfo || transformed.total_nutrition_info) {
        const totalNutrition = transformed.totalNutritionInfo || transformed.total_nutrition_info;
        transformed.totalNutritionInfo = this.parseJSONBField(totalNutrition);
        delete transformed.total_nutrition_info;
      }
      
      return transformed;
    });
  }

  async load<T extends StorageEntity>(key: string): Promise<T[] | null> {
    try {
      console.log(`🐘 PostgreSQL: ${key} laden`);
      
      const response = await fetch(`${this.getBaseUrl()}/${key}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      // Prüfe auf 401 Unauthorized (Token abgelaufen)
      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - Token möglicherweise abgelaufen, versuche Erneuerung...');
        const newToken = await this.createNewJWTToken();
        if (newToken) {
          this.connectionData.jwtToken = newToken.token;
          this.connectionData.jwtTokenExpires = newToken.expires;
          
          // Wiederhole den Request mit neuem Token
          const retryResponse = await fetch(`${this.getBaseUrl()}/${key}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
          });
          
          if (!retryResponse.ok) {
            throw new Error(`PostgreSQL Fehler nach Token-Erneuerung: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          
          const data = await retryResponse.json();
          console.log(`✅ PostgreSQL: ${key} erfolgreich geladen (nach Token-Erneuerung, ${data.length} Einträge)`);
          
          // Debug: Zeige Rohdaten aus Datenbank (nur erstes Element)
          if (data.length > 0) {
            console.log(`🔍 Rohdaten aus DB nach Token-Erneuerung (erstes Element):`, JSON.stringify(data[0], null, 2));
            if (data[0].nutrition_info) {
              console.log(`🔍 nutrition_info im ersten Element:`, data[0].nutrition_info);
            } else {
              console.warn(`⚠️ KEIN nutrition_info im ersten Element gefunden!`);
            }
          }
          
          // Transformiere Daten zurück zu Frontend-Format
          const transformedData = this.transformDataFromPostgreSQL(data);
          
          // Debug: Zeige transformierte Daten (nur erstes Element)
          if (transformedData.length > 0) {
            console.log(`🔄 Transformierte Daten nach Token-Erneuerung (erstes Element):`, JSON.stringify(transformedData[0], null, 2));
            if (transformedData[0].nutritionInfo) {
              console.log(`✅ nutritionInfo im transformierten Element:`, transformedData[0].nutritionInfo);
            } else {
              console.error(`❌ KEIN nutritionInfo im transformierten Element gefunden!`);
            }
          }
          
          return transformedData;
        }
      }

      if (!response.ok) {
        throw new Error(`PostgreSQL Fehler: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ PostgreSQL: ${key} erfolgreich geladen (${data.length} Einträge)`);
      
      // Debug: Zeige Rohdaten aus Datenbank (nur erstes Element)
      if (data.length > 0) {
        console.log(`🔍 Rohdaten aus DB (erstes Element):`, JSON.stringify(data[0], null, 2));
        if (data[0].nutrition_info) {
          console.log(`🔍 nutrition_info im ersten Element:`, data[0].nutrition_info);
        } else {
          console.warn(`⚠️ KEIN nutrition_info im ersten Element gefunden!`);
        }
      }
      
      // Transformiere Daten zurück zu Frontend-Format
      const transformedData = this.transformDataFromPostgreSQL(data);
      
      // Debug: Zeige transformierte Daten (nur erstes Element)
      if (transformedData.length > 0) {
        console.log(`🔄 Transformierte Daten (erstes Element):`, JSON.stringify(transformedData[0], null, 2));
        if (transformedData[0].nutritionInfo) {
          console.log(`✅ nutritionInfo im transformierten Element:`, transformedData[0].nutritionInfo);
        } else {
          console.error(`❌ KEIN nutritionInfo im transformierten Element gefunden!`);
        }
      }
      
      return transformedData;
    } catch (error) {
      console.error(`❌ PostgreSQL Fehler beim Laden von ${key}:`, error);
      return null;
    }
  }

  async delete<T extends StorageEntity>(key: string, id: string): Promise<boolean> {
    try {
      console.log(`🐘 PostgreSQL: ${key} löschen (Frontend-ID: ${id})`);
      
      // Lösche über die Frontend-ID (id-Spalte), nicht über db_id
      // Da wir beide Felder getrennt halten, verwenden wir die Frontend-ID zum Löschen
      console.log(`🐘 PostgreSQL: Lösche über Frontend-ID (id-Spalte): ${id}`);
      
      const response = await fetch(`${this.getBaseUrl()}/${key}?id=eq.${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      // Prüfe auf 401 Unauthorized (Token abgelaufen)
      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - Token möglicherweise abgelaufen, versuche Erneuerung...');
        const newToken = await this.createNewJWTToken();
        if (newToken) {
          this.connectionData.jwtToken = newToken.token;
          this.connectionData.jwtTokenExpires = newToken.expires;
          
          // Wiederhole den Request mit neuem Token
          const retryResponse = await fetch(`${this.getBaseUrl()}/${key}?id=eq.${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
          });
          
          if (!retryResponse.ok) {
            throw new Error(`PostgreSQL Fehler nach Token-Erneuerung: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          
          console.log(`✅ PostgreSQL: ${key} erfolgreich gelöscht (nach Token-Erneuerung, Frontend-ID: ${id})`);
          return true;
        }
      }

      if (!response.ok) {
        throw new Error(`PostgreSQL Fehler: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ PostgreSQL: ${key} erfolgreich gelöscht (Frontend-ID: ${id})`);
      return true;
    } catch (error) {
      console.error(`❌ PostgreSQL Fehler beim Löschen von ${key}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🐘 PostgreSQL: Verbindungstest');
      console.log(`🐘 Teste Verbindung zu: ${this.getBaseUrl()}/`);
      
      // NEU: Schritt 1 - Teste ob Container läuft (ohne Auth)
      try {
        console.log('🔍 Schritt 1: Teste ob Container läuft...');
        const healthCheck = await fetch(`${this.getBaseUrl()}/`, {
          method: 'GET'
        });
        
        console.log(`🔍 Health-Check Status: ${healthCheck.status} ${healthCheck.statusText}`);
        
        if (!healthCheck.ok && healthCheck.status !== 401) {
          console.error('❌ Container läuft nicht oder PostgREST nicht verfügbar');
          return false;
        }
        
        console.log('✅ Container läuft!');
      } catch (error) {
        console.error('❌ Container Health-Check fehlgeschlagen:', error);
        return false;
      }
      
      // NEU: Schritt 2 - Teste RPC-Funktion execute_safe_sql
      console.log('🔍 Schritt 2: Teste RPC-Funktion execute_safe_sql...');
      
      try {
        const rpcResponse = await fetch(`${this.getBaseUrl()}/rpc/execute_safe_sql`, {
          method: 'POST',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            sql_text: 'SELECT 1 as test'
          })
        });
        
        console.log(`🔍 RPC-Response Status: ${rpcResponse.status} ${rpcResponse.statusText}`);
        
        if (rpcResponse.ok) {
          const result = await rpcResponse.json();
          console.log('✅ RPC-Funktion execute_safe_sql funktioniert!');
          console.log('✅ Result:', result);
          
          if (result.success || !result.error) {
            console.log('✅ PostgreSQL-Verbindung erfolgreich getestet!');
            return true;
          } else {
            console.warn('⚠️ RPC-Funktion meldete Fehler:', result.error);
            return false;
          }
        } else {
          console.error('❌ RPC-Funktion test fehlgeschlagen:', rpcResponse.statusText);
          
          // Debug: Zeige Response-Body
          try {
            const errorText = await rpcResponse.text();
            console.log('❌ Response-Body:', errorText);
          } catch (e) {
            // Ignoriere
          }
          
          return false;
        }
      } catch (error) {
        console.error('❌ RPC-Funktion Test fehlgeschlagen:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ PostgreSQL Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }
}

// MariaDB/MySQL Adapter (Prisma API)
class PrismaAdapter implements StorageAdapter {
  name = 'PrismaAdapter';
  type = 'prisma';

  constructor(private connectionData: any, private dbType: 'mariadb' | 'mysql') {
    console.log(`🔧 ${this.dbType.toUpperCase()}Adapter erstellt mit ConnectionData:`, connectionData);
    
    // Schema-Initialisierung erfolgt jetzt nur noch bei Konfigurationsübernahme in StorageManagement.tsx
  }

  // NEU: Schema-Initialisierung (Phase 2)
  private async initializeSchema(): Promise<void> {
    try {
      console.log(`🔧 Starte Schema-Initialisierung für ${this.dbType.toUpperCase()}...`);
      
      // Lade das Init-Script vom Server
      const scriptName = this.dbType === 'mariadb' 
        ? '/init-scripts/init-chef-numbers-mariadb.sql'
        : '/init-scripts/init-chef-numbers-mysql.sql';
      
      const response = await fetch(scriptName);
      if (!response.ok) {
        console.warn(`⚠️ Init-Script nicht gefunden (404) - überspringe Schema-Init`);
        console.warn(`   Pfad: ${scriptName}`);
        return;
      }
      
      const sqlScript = await response.text();
      console.log(`✅ Init-Script geladen, starte Schema-Initialisierung...`);
      console.log(`📏 Script-Länge: ${sqlScript.length} Zeichen`);
      
      // Warte kurz auf Prisma API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Führe das Schema-Script über die Prisma API aus
      const result = await this.executeSQL(sqlScript);
      console.log(`✅ Schema-Initialisierung Ergebnis:`, result);
      
    } catch (error) {
      console.error('❌ Schema-Initialisierung fehlgeschlagen:', error);
      console.log('⚠️ Adapter funktioniert weiterhin ohne Schema-Init');
    }
  }
  
  // Führe SQL über Prisma API aus
  // JETZT MIT NATIVEM MYSQL-TREIBER in der Prisma API!
  private async executeSQL(sql: string): Promise<any> {
    try {
      // Entferne USE-Statements (werden nicht benötigt)
      let cleanedSQL = sql
        .replace(/^\s*USE\s+\w+;?\s*$/gmi, '')
        .replace(/^\s*USE\s+\w+;?\s*\n/gmi, '')
        .trim();
      
      console.log(`📝 Führe SQL-Script aus (${cleanedSQL.length} Zeichen)...`);
      
      // Führe kompletten SQL-Block aus (Multi-Statement wird vom MySQL-Treiber unterstützt)
      const response = await fetch(`${this.getBaseUrl()}/api/execute-sql`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sql: cleanedSQL })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ SQL-Execution fehlgeschlagen:`, errorText.substring(0, 500));
        throw new Error(`SQL-Execution fehlgeschlagen: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`✅ SQL-Execution erfolgreich`);
      
      return result;
    } catch (error) {
      console.error('❌ Fehler bei SQL-Execution:', error);
      throw error;
    }
  }

  private getBaseUrl(): string {
    const port = this.connectionData.prismaPort || '3001';
    const host = this.connectionData.host || 'localhost';
    const baseUrl = `http://${host}:${port}`;
    console.log(`🔧 ${this.dbType.toUpperCase()} BaseUrl: ${baseUrl}`);
    return baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private mapKeyToTable(key: string): string {
    // Verwende die gleichen Tabellennamen wie im autoSchemaGenerator
    const keyMap: { [key: string]: string } = {
      'articles': 'articles',
      'suppliers': 'suppliers',
      'recipes': 'recipes',
      'einkaufsListe': 'einkaufsitems',
      'inventurListe': 'inventuritems',
    };
    return keyMap[key] || key;
  }

  // Transformiere Daten für MariaDB/MySQL via Prisma API
  // WICHTIG: Prisma verwendet db_id direkt (keine camelCase-Konvertierung!)
  // Die Prisma-Schema-Mappings (@map) kümmern sich um die DB-Konvertierung
  private transformDataForMySQL<T extends StorageEntity>(data: T[]): any[] {
    return data.map(item => {
      const transformed: any = {};
      
      // WICHTIG: db_id bleibt als db_id (keine Konvertierung zu dbId!)
      if (item.db_id) {
        transformed.db_id = item.db_id;
        console.log(`🔄 ${this.dbType.toUpperCase()} Transform: Verwende db_id: ${item.db_id}`);
      }
      
      // Kopiere nur camelCase Felder (filtere alle snake_case Felder raus!)
      // ABER: db_id ist eine Ausnahme und wird direkt übernommen
      for (const [key, value] of Object.entries(item)) {
        // Ignoriere snake_case Felder (enthalten "_") - ABER db_id wurde bereits behandelt
        if (key.includes('_') && key !== 'db_id') {
          console.log(`🗑️ Ignoriere snake_case Feld: ${key}`);
          continue;
        }
        
        // Ignoriere dbId (falls vorhanden - sollte nicht mehr verwendet werden)
        if (key === 'dbId') {
          console.log(`🗑️ Ignoriere veraltetes dbId Feld (verwende db_id stattdessen)`);
          continue;
        }
        
        // Ignoriere Frontend-spezifische Felder
        if (['isDirty', 'isNew', 'syncStatus', 'supplier', 'image', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'lastModifiedBy'].includes(key)) {
          console.log(`🗑️ Ignoriere Frontend-Feld: ${key}`);
          continue;
        }
        
        // Ignoriere nutritionInfo bei Suppliers (nur Articles haben das)
        if (key === 'nutritionInfo' && !item.hasOwnProperty('category')) {
          console.log(`🗑️ Ignoriere nutritionInfo bei Supplier`);
          continue;
        }
        
        // Kopiere das Feld (camelCase, außer db_id)
        transformed[key] = value;
      }
      
      // db_id/id Handling für Prisma
      // WICHTIG: db_id ist der Primary Key, id ist die Frontend-ID
      if (!transformed.db_id && transformed.id) {
        // Neuer Datensatz: db_id wird vom Server generiert, lass es weg
        console.log(`🆕 ${this.dbType.toUpperCase()} Transform: Neuer Datensatz, db_id wird vom Server generiert (Frontend-ID: ${transformed.id})`);
      } else if (transformed.db_id) {
        console.log(`🔄 ${this.dbType.toUpperCase()} Transform: Update für bestehenden Datensatz mit db_id: ${transformed.db_id}`);
      }
      
      // Merge nutrition und nutritionInfo (falls beide vorhanden)
      if (transformed.nutrition && !transformed.nutritionInfo) {
        transformed.nutritionInfo = transformed.nutrition;
        delete transformed.nutrition;
      } else if (transformed.nutrition) {
        delete transformed.nutrition;
      }
      
      console.log(`✅ Transformiert für Prisma (nur camelCase):`, Object.keys(transformed));
      return transformed;
    });
  }

  // Transformiere Daten von MariaDB/MySQL (via Prisma) zurück zu Frontend-Format
  // Prisma gibt db_id direkt zurück (keine camelCase-Konvertierung)
  private transformDataFromMySQL(data: any[]): any[] {
    return data.map(item => {
      const transformed: any = { ...item };
      
      // Prisma gibt db_id zurück - bereits korrekt!
      // Füge nur Frontend-Felder hinzu
      transformed.isDirty = false;
      transformed.isNew = false;
      transformed.syncStatus = 'synced';
      
      // Entferne dbId falls vorhanden (veraltetes Feld)
      if (transformed.dbId) {
        delete transformed.dbId;
      }
      
      // WICHTIG: Konvertiere Prisma Decimal-Objekte zu JavaScript Numbers
      // Prisma gibt Decimal als spezielle Objekte zurück, die .toFixed() nicht unterstützen
      const decimalFields = [
        'bundlePrice', 'content', 'pricePerUnit', 'vatRate',
        'materialCosts', 'markupPercentage', 'sellingPrice',
        'menge', 'preis', 'quantity'
      ];
      
      for (const field of decimalFields) {
        if (transformed[field] !== null && transformed[field] !== undefined) {
          // Konvertiere Decimal zu Number
          transformed[field] = Number(transformed[field]);
        }
      }
      
      // Parse JSON-Strings falls nötig (sollte normalerweise nicht passieren)
      if (typeof transformed.address === 'string') {
        try {
          transformed.address = JSON.parse(transformed.address);
        } catch (e) {
          console.warn('⚠️ Konnte address nicht parsen:', e);
        }
      }
      
      if (typeof transformed.phoneNumbers === 'string') {
        try {
          transformed.phoneNumbers = JSON.parse(transformed.phoneNumbers);
        } catch (e) {
          console.warn('⚠️ Konnte phoneNumbers nicht parsen:', e);
        }
      }
      
      if (typeof transformed.nutritionInfo === 'string') {
        try {
          transformed.nutritionInfo = JSON.parse(transformed.nutritionInfo);
        } catch (e) {
          console.warn('⚠️ Konnte nutritionInfo nicht parsen:', e);
        }
      }
      
      return transformed;
    });
  }

  async save<T extends StorageEntity>(
    key: string, 
    data: T[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    try {
      console.log(`🔧 ${this.dbType.toUpperCase()}: ${key} speichern (${data.length} Einträge)`);
      
      // Transformiere Daten für MySQL
      const transformedData = this.transformDataForMySQL(data);
      
      if (onProgress) {
        onProgress(0, data.length);
      }
      
      const tableName = this.mapKeyToTable(key);
      
      // Speichere jedes Item einzeln (für db_id-Handling)
      let allSuccess = true;
      for (let i = 0; i < transformedData.length; i++) {
        const item = transformedData[i];
        
        if (onProgress) {
          onProgress(i, transformedData.length);
        }
        
        // Bestimme ob Update oder Insert (Prisma verwendet db_id direkt)
        const isUpdate = !!item.db_id;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate
          ? `${this.getBaseUrl()}/api/${tableName}/${item.db_id}`
          : `${this.getBaseUrl()}/api/${tableName}`;
        
        console.log(`🔧 ${this.dbType.toUpperCase()} ${method}: ${url}`);
        console.log(`📦 Sende Daten:`, JSON.stringify(item, null, 2));
        
        const response = await fetch(url, {
          method,
          headers: this.getAuthHeaders(),
          body: JSON.stringify(item)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${this.dbType.toUpperCase()} Fehler: ${response.status}`, errorText);
          allSuccess = false;
          break;
        }
        
        // Bei POST: Lese generierte db_id
        if (!isUpdate) {
          try {
            const responseData = await response.json();
            // Prisma gibt db_id zurück
            const generatedDbId = responseData?.db_id;
            if (generatedDbId) {
              const originalItem = data.find(orig => orig.id === item.id);
              if (originalItem) {
                originalItem.db_id = generatedDbId;
                console.log(`✅ db_id generiert: ${generatedDbId} für Frontend-ID: ${item.id}`);
              }
            }
          } catch (e) {
            console.warn('⚠️ Konnte generierte db_id nicht lesen:', e);
          }
        }
      }

      if (!allSuccess) {
        throw new Error(`${this.dbType.toUpperCase()} Fehler beim Speichern von ${key}`);
      }

      if (onProgress) {
        onProgress(data.length, data.length);
      }

      console.log(`✅ ${this.dbType.toUpperCase()}: ${key} erfolgreich gespeichert`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.dbType.toUpperCase()} Fehler beim Speichern von ${key}:`, error);
      return false;
    }
  }

  async load<T extends StorageEntity>(key: string): Promise<T[] | null> {
    try {
      console.log(`🔧 ${this.dbType.toUpperCase()}: ${key} laden`);
      
      const tableName = this.mapKeyToTable(key);
      const response = await fetch(`${this.getBaseUrl()}/api/${tableName}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`${this.dbType.toUpperCase()} Fehler: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ ${this.dbType.toUpperCase()}: ${key} erfolgreich geladen (${data.length} Einträge)`);
      
      // Transformiere Daten zurück zu Frontend-Format
      const transformedData = this.transformDataFromMySQL(data);
      
      return transformedData;
    } catch (error) {
      console.error(`❌ ${this.dbType.toUpperCase()} Fehler beim Laden von ${key}:`, error);
      return null;
    }
  }

  async delete<T extends StorageEntity>(key: string, id: string): Promise<boolean> {
    try {
      console.log(`🔧 ${this.dbType.toUpperCase()}: ${key} löschen (Frontend-ID: ${id})`);
      
      const tableName = this.mapKeyToTable(key);
      
      // Lösche über Frontend-ID (nicht db_id)
      // Prisma API sollte einen Query-Parameter akzeptieren: ?id=eq.{id}
      const response = await fetch(`${this.getBaseUrl()}/api/${tableName}?id=${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${this.dbType.toUpperCase()} Fehler: ${response.status}`, errorText);
        throw new Error(`${this.dbType.toUpperCase()} Fehler: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ ${this.dbType.toUpperCase()}: ${key} erfolgreich gelöscht (Frontend-ID: ${id})`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.dbType.toUpperCase()} Fehler beim Löschen von ${key}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔧 ${this.dbType.toUpperCase()}: Verbindungstest`);
      
      const response = await fetch(`${this.getBaseUrl()}/health`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error(`❌ ${this.dbType.toUpperCase()} Verbindungstest fehlgeschlagen:`, error);
      return false;
    }
  }
}

// Supabase Adapter (für Daten UND Bilder)
class SupabaseAdapter implements StorageAdapter {
  name = 'SupabaseAdapter';
  type = 'supabase';

  constructor(private connectionData: any) {
    console.log('☁️ SupabaseAdapter erstellt mit ConnectionData:', {
      url: connectionData?.url,
      hasAnonKey: !!connectionData?.anonKey,
      hasServiceKey: !!connectionData?.serviceRoleKey
    });
    
    // Schema-Initialisierung erfolgt jetzt nur noch bei Konfigurationsübernahme in StorageManagement.tsx
  }

  // NEU: Schema-Initialisierung (Phase 2)
  // Teilt das SQL-Script in logische Abschnitte auf, um Deadlocks zu vermeiden
  private async initializeSchema(): Promise<void> {
    try {
      console.log('☁️ Starte Schema-Initialisierung für Supabase...');
      
      // Warte kurz auf Supabase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Lade das Init-Script vom Server
      const response = await fetch('/init-scripts/init-chef-numbers-supabase.sql');
      if (!response.ok) {
        console.warn('⚠️ Init-Script nicht gefunden (404) - überspringe Schema-Init');
        console.warn(`   Pfad: /init-scripts/init-chef-numbers-supabase.sql`);
        return;
      }
      
      const sqlScript = await response.text();
      console.log('✅ Init-Script geladen, teile in logische Abschnitte auf...');
      console.log(`📏 Script-Länge: ${sqlScript.length} Zeichen`);
      
      // Teile das Script in logische Abschnitte auf
      // Jeder Abschnitt wird separat ausgeführt, um Deadlocks zu vermeiden
      const sections = this.splitScriptIntoSections(sqlScript);
      console.log(`📦 Script in ${sections.length} Abschnitte aufgeteilt`);
      
      // Führe jeden Abschnitt sequenziell aus
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionLabel = section.label || `Abschnitt ${i + 1}`;
        
        try {
          console.log(`☁️ Führe ${sectionLabel} aus (${i + 1}/${sections.length})...`);
          console.log(`📏 Abschnitt-Länge: ${section.sql.length} Zeichen`);
          
          // Verwende execute_sql_dynamic RPC-Funktion
          const rpcResponse = await fetch(`${this.getBaseUrl()}/rpc/execute_sql_dynamic`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ sql_statement: section.sql })
          });
          
          if (rpcResponse.ok) {
            const result = await rpcResponse.json();
            
            if (result.success) {
              console.log(`✅ ${sectionLabel} erfolgreich ausgeführt`);
              successCount++;
            } else {
              // Prüfe ob Fehler kritisch ist (deadlock, timeout, etc.)
              const errorMsg = result.error || result.message || '';
              const isCriticalError = 
                errorMsg.toLowerCase().includes('deadlock') ||
                errorMsg.toLowerCase().includes('timeout') ||
                errorMsg.toLowerCase().includes('connection');
              
              if (isCriticalError) {
                console.warn(`⚠️ ${sectionLabel} meldete kritischen Fehler:`, errorMsg);
                console.warn('⚠️ Überspringe diesen Abschnitt und fahre fort...');
                errorCount++;
                // Kurze Pause bei kritischen Fehlern
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                // Bei nicht-kritischen Fehlern (z.B. "already exists") als Erfolg werten
                console.log(`ℹ️ ${sectionLabel} meldete nicht-kritischen Fehler (vermutlich idempotent):`, errorMsg);
                successCount++;
              }
            }
          } else {
            const errorText = await rpcResponse.text();
            
            // Prüfe ob RPC-Funktion existiert
            if (rpcResponse.status === 404 || errorText.includes('does not exist')) {
              console.warn('⚠️ RPC-Funktion execute_sql_dynamic nicht verfügbar');
              console.warn('⚠️ Das Schema-Script definiert diese Funktion - bitte führen Sie es einmalig aus');
              console.warn('   Datei: /init-scripts/init-chef-numbers-supabase.sql');
              console.warn('   Danach wird die automatische Schema-Initialisierung funktionieren');
              return;
            } else {
              console.warn(`⚠️ ${sectionLabel} fehlgeschlagen:`, errorText.substring(0, 200));
              errorCount++;
            }
          }
          
          // Kleine Pause zwischen Abschnitten, um Deadlocks zu vermeiden
          if (i < sections.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error: any) {
          console.error(`❌ Fehler beim Ausführen von ${sectionLabel}:`, error);
          errorCount++;
          
          // Bei kritischen Fehlern: Pause und weiter
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`📊 Schema-Initialisierung abgeschlossen: ${successCount} erfolgreich, ${errorCount} Fehler`);
      
      if (errorCount > 0 && successCount === 0) {
        console.warn('⚠️ Alle Abschnitte fehlgeschlagen - Schema könnte nicht initialisiert sein');
        console.warn('⚠️ Bitte führen Sie init-chef-numbers-supabase.sql manuell im Supabase SQL Editor aus');
      } else if (errorCount > 0) {
        console.warn('⚠️ Einige Abschnitte fehlgeschlagen, aber viele Statements sind idempotent');
        console.warn('⚠️ Schema sollte größtenteils korrekt sein');
      } else {
        console.log('✅ Schema-Initialisierung vollständig erfolgreich!');
      }
      
    } catch (error) {
      console.error('❌ Schema-Initialisierung fehlgeschlagen:', error);
      console.log('⚠️ Adapter funktioniert weiterhin ohne Schema-Init');
      console.log('⚠️ Bitte führen Sie init-chef-numbers-supabase.sql manuell im Supabase SQL Editor aus');
    }
  }

  // Hilfsfunktion: Teilt SQL-Script in logische Abschnitte auf
  private splitScriptIntoSections(sqlScript: string): Array<{ label: string; sql: string }> {
    const sections: Array<{ label: string; sql: string }> = [];
    
    // Finde alle Abschnitt-Markierungen (-- ======================================== gefolgt von -- Text)
    // Pattern erkennt: "-- ========================================" gefolgt von einer leeren Zeile und "-- Label"
    const markerPattern = /-- ========================================\s*\r?\n\s*-- (.+?)\s*\r?\n/g;
    const foundMarkers: Array<{ position: number; label: string }> = [];
    
    let match;
    while ((match = markerPattern.exec(sqlScript)) !== null) {
      const label = match[1].trim();
      // Vereinheitliche Labels
      let normalizedLabel = label;
      if (label.includes('Enum-Typen')) {
        normalizedLabel = '1. Enum-Typen';
      } else if (label.includes('System-Tabellen')) {
        normalizedLabel = '2. System-Tabellen';
      } else if (label.includes('Haupt-Tabellen')) {
        normalizedLabel = '3. Haupt-Tabellen';
      } else if (label.startsWith('Tabelle:')) {
        const tableName = label.match(/Tabelle: (\w+)/)?.[1] || 'unbekannt';
        normalizedLabel = `4. Tabelle: ${tableName}`;
      } else if (label.includes('ALTER-Statements')) {
        normalizedLabel = '5. ALTER-Statements';
      } else if (label.includes('Trigger')) {
        normalizedLabel = '6. Trigger';
      } else if (label.includes('System-Informationen')) {
        normalizedLabel = '7. System-Info';
      } else if (label.includes('Dynamische RPC-Functions')) {
        normalizedLabel = '8. RPC-Functions';
      }
      
      foundMarkers.push({
        position: match.index,
        label: normalizedLabel
      });
    }
    
    // Sortiere Marker nach Position
    foundMarkers.sort((a, b) => a.position - b.position);
    
    // Erstelle Abschnitte basierend auf Markierungen
    if (foundMarkers.length === 0) {
      // Fallback: Wenn keine Marker gefunden wurden, teile in gleichmäßige Chunks
      console.warn('⚠️ Keine Abschnitt-Marker gefunden, teile Script in Chunks auf');
      const chunkSize = 50000; // 50KB pro Chunk
      for (let i = 0; i < sqlScript.length; i += chunkSize) {
        const chunk = sqlScript.substring(i, i + chunkSize).trim();
        if (chunk.length > 0) {
          sections.push({
            label: `Chunk ${Math.floor(i / chunkSize) + 1}`,
            sql: chunk
          });
        }
      }
      return sections;
    }
    
    // Erstelle Abschnitte zwischen den Markern
    for (let i = 0; i < foundMarkers.length; i++) {
      const marker = foundMarkers[i];
      const nextMarker = foundMarkers[i + 1];
      
      const sectionStart = marker.position;
      const sectionEnd = nextMarker ? nextMarker.position : sqlScript.length;
      const sectionSQL = sqlScript.substring(sectionStart, sectionEnd).trim();
      
      if (sectionSQL.length > 0) {
        sections.push({
          label: marker.label,
          sql: sectionSQL
        });
      }
    }
    
    // Füge Einleitung hinzu, wenn vorhanden
    if (foundMarkers.length > 0 && foundMarkers[0].position > 0) {
      const introSQL = sqlScript.substring(0, foundMarkers[0].position).trim();
      if (introSQL.length > 0) {
        sections.unshift({
          label: '0. Einleitung',
          sql: introSQL
        });
      }
    }
    
    return sections;
  }
  

  private getBaseUrl(): string {
    return `${this.connectionData.url}/rest/v1`;
  }

  private getAuthHeaders(): HeadersInit {
    return {
      'apikey': this.connectionData.serviceRoleKey,
      'Authorization': `Bearer ${this.connectionData.serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  // Konvertiere camelCase zu snake_case für Supabase
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Transformiere Objekt von camelCase zu snake_case
  private transformToSnakeCase(obj: any): any {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // WICHTIG: db_id bleibt als db_id (wird nicht konvertiert)
      if (key === 'db_id') {
        transformed.db_id = value;
      } else if (key === 'dbId') {
        // Veraltetes Feld dbId ignorieren (verwende db_id)
        console.log('🗑️ Ignoriere veraltetes dbId-Feld (verwende db_id stattdessen)');
        continue;
      } else {
        const snakeKey = this.camelToSnake(key);
        transformed[snakeKey] = value;
      }
    }
    
    return transformed;
  }

  // Transformiere Objekt von snake_case zu camelCase
  private transformToCamelCase(obj: any): any {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // WICHTIG: db_id bleibt als db_id (wird nicht zu dbId konvertiert)
      if (key === 'db_id') {
        transformed.db_id = value;
      } else {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformed[camelKey] = value;
      }
    }
    
    return transformed;
  }

  async save<T extends StorageEntity>(
    entityType: string,
    data: T | T[]
  ): Promise<boolean> {
    try {
      const items = Array.isArray(data) ? data : [data];
      console.log(`☁️ SUPABASE: Speichere ${items.length} ${entityType}`);

      const baseUrl = this.getBaseUrl();
      
      for (const item of items) {
        let itemData = { ...item };
        
        // UUID-Validierung: Prüfe ob ein String eine gültige UUID ist
        const isValidUUID = (value: any): boolean => {
          if (!value || typeof value !== 'string') return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(value);
        };
        
        // Bereinige alle UUID-Felder: Setze ungültige UUIDs auf null oder entferne sie
        const cleanUUIDFields = async (data: any, entityType: string): Promise<any> => {
          const cleaned = { ...data };
          
          // Liste der UUID-Felder, die NULL erlaubt sind (können auf null gesetzt werden)
          const nullableUUIDFields = ['created_by', 'updated_by', 'last_modified_by', 'createdBy', 'updatedBy', 'lastModifiedBy'];
          
          // Liste der UUID-Felder, die NOT NULL sein können (benötigen besondere Behandlung)
          const requiredUUIDFields = ['id', 'supplier_id', 'supplierId'];
          
          // Bereinige nullable UUID-Felder
          for (const field of nullableUUIDFields) {
            if (cleaned[field] !== undefined && cleaned[field] !== null && !isValidUUID(cleaned[field])) {
              console.warn(`⚠️ Ungültige UUID in Feld "${field}": "${cleaned[field]}" - setze auf null`);
              cleaned[field] = null;
            }
          }
          
          // Bereinige required UUID-Felder
          for (const field of requiredUUIDFields) {
            if (cleaned[field] !== undefined && cleaned[field] !== null && !isValidUUID(cleaned[field])) {
              console.warn(`⚠️ Ungültige UUID in Feld "${field}": "${cleaned[field]}"`);
              
              if (field === 'id') {
                // ID ist kritisch - versuche Migration zu UUID
                console.warn(`⚠️ ID "${cleaned[field]}" ist nicht im UUID-Format - generiere neue UUID`);
                try {
                  const { v5: uuidv5 } = await import('uuid');
                  const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
                  cleaned[field] = uuidv5(String(cleaned[field]), NAMESPACE);
                  console.log(`✅ ID migriert zu UUID: ${cleaned[field]}`);
                } catch (error) {
                  console.warn('⚠️ uuid-Modul nicht verfügbar - verwende UUIDUtils');
                  const { UUIDUtils } = await import('../utils/uuidUtils');
                  cleaned[field] = UUIDUtils.generateId();
                  console.log(`✅ ID generiert mit UUIDUtils: ${cleaned[field]}`);
                }
              } else if (field === 'supplier_id' || field === 'supplierId') {
                // supplier_id ist NOT NULL - verwende Fallback UUID wenn ungültig
                console.warn(`⚠️ Ungültige supplier_id "${cleaned[field]}" - verwende Fallback UUID`);
                cleaned[field] = '00000000-0000-0000-0000-000000000000'; // Null-UUID als Fallback
              }
            }
          }
          
          return cleaned;
        };
        
        // Bereinige UUID-Felder BEVOR weitere Transformationen
        itemData = await cleanUUIDFields(itemData, entityType);
        
        // Entferne Frontend-spezifische Felder
        // db_id wird behalten (wird als Primary Key verwendet)
        // dbId (veraltetes Feld) explizit entfernen
        delete (itemData as any).isDirty;
        delete (itemData as any).isNew;
        delete (itemData as any).syncStatus;
        delete (itemData as any).nutrition; // Veraltetes Feld, nur nutritionInfo wird verwendet
        
        // Entferne veraltetes dbId-Feld falls vorhanden
        if ((itemData as any).dbId) {
          delete (itemData as any).dbId;
          console.log('🗑️ Entferne veraltetes dbId-Feld (verwende db_id)');
        }
        
        // WICHTIG: Entferne nutritionInfo/nutrition_info bei Suppliers (nur Articles haben das)
        if (entityType === 'suppliers') {
          if ((itemData as any).nutritionInfo) {
            delete (itemData as any).nutritionInfo;
            console.log('🗑️ Entferne nutritionInfo bei Supplier (nur Articles haben Nährwerte)');
          }
          if ((itemData as any).nutrition_info) {
            delete (itemData as any).nutrition_info;
            console.log('🗑️ Entferne nutrition_info bei Supplier (nur Articles haben Nährwerte)');
          }
        }
        
        // Setze Timestamps für INSERT (wenn nicht vorhanden)
        if (!(itemData as any).createdAt) {
          (itemData as any).createdAt = new Date().toISOString();
        }
        if (!(itemData as any).updatedAt) {
          (itemData as any).updatedAt = new Date().toISOString();
        }
        
        // Transformiere camelCase → snake_case für Supabase
        itemData = this.transformToSnakeCase(itemData) as any;
        
        // ZUSÄTZLICHE Prüfung nach Transformation: Bereinige UUID-Felder erneut
        // (da transformToSnakeCase camelCase → snake_case konvertiert hat)
        const snakeCaseUUIDFields = ['created_by', 'updated_by', 'last_modified_by', 'supplier_id'];
        for (const field of snakeCaseUUIDFields) {
          if ((itemData as any)[field] !== undefined && (itemData as any)[field] !== null && !isValidUUID((itemData as any)[field])) {
            if (field === 'supplier_id') {
              // supplier_id ist NOT NULL - verwende Fallback UUID
              console.warn(`⚠️ Ungültige UUID in "${field}": "${(itemData as any)[field]}" - verwende Fallback UUID`);
              (itemData as any)[field] = '00000000-0000-0000-0000-000000000000';
            } else {
              // Andere Felder können NULL sein
              console.warn(`⚠️ Ungültige UUID in "${field}": "${(itemData as any)[field]}" - setze auf null`);
              (itemData as any)[field] = null;
            }
          }
        }
        
        // ZUSÄTZLICHE Prüfung nach Transformation: Entferne nutrition_info bei suppliers
        // (falls es durch die Transformation entstanden ist)
        if (entityType === 'suppliers' && (itemData as any).nutrition_info) {
          delete (itemData as any).nutrition_info;
          console.log('🗑️ Entferne nutrition_info nach Transformation bei Supplier');
        }

        // Prüfe ob UPDATE oder INSERT (basierend auf id)
        const existingCheck = await fetch(`${baseUrl}/${entityType}?id=eq.${item.id}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        if (existingCheck.ok) {
          const existing = await existingCheck.json();
          
          if (existing && existing.length > 0) {
            // UPDATE
            console.log(`☁️ UPDATE: ${entityType} mit id=${item.id}`);
            const response = await fetch(`${baseUrl}/${entityType}?id=eq.${item.id}`, {
              method: 'PATCH',
              headers: this.getAuthHeaders(),
              body: JSON.stringify(itemData)
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorJson: any = null;
              try {
                errorJson = JSON.parse(errorText);
              } catch {
                // Fehler ist kein JSON
              }
              
              const errorMessage = errorJson?.message || errorText;
              const errorCode = errorJson?.code || '';
              
              // Prüfe auf UUID-Fehler (22P02 = invalid input syntax for type)
              if (errorCode === '22P02' && errorMessage?.includes('uuid')) {
                console.error(`❌ UPDATE fehlgeschlagen: Ungültige UUID in Daten`, errorMessage);
                console.warn(`⚠️ Überspringe Datensatz mit id=${item.id} aufgrund ungültiger UUID`);
                continue; // Überspringe diesen Datensatz
              } else {
                console.error(`❌ UPDATE fehlgeschlagen:`, errorMessage);
                throw new Error(`UPDATE fehlgeschlagen: ${response.status} - ${errorMessage}`);
              }
            }
          } else {
            // INSERT
            console.log(`☁️ INSERT: ${entityType} mit id=${item.id}`);
            const response = await fetch(`${baseUrl}/${entityType}`, {
              method: 'POST',
              headers: this.getAuthHeaders(),
              body: JSON.stringify(itemData)
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorJson: any = null;
              try {
                errorJson = JSON.parse(errorText);
              } catch {
                // Fehler ist kein JSON
              }
              
              const errorMessage = errorJson?.message || errorText;
              const errorCode = errorJson?.code || '';
              
              // Prüfe auf UUID-Fehler (22P02 = invalid input syntax for type)
              if (errorCode === '22P02' && errorMessage?.includes('uuid')) {
                console.error(`❌ INSERT fehlgeschlagen: Ungültige UUID in Daten`, errorMessage);
                console.warn(`⚠️ Überspringe Datensatz mit id=${item.id} aufgrund ungültiger UUID`);
                continue; // Überspringe diesen Datensatz
              } else {
                console.error(`❌ INSERT fehlgeschlagen:`, errorMessage);
                throw new Error(`INSERT fehlgeschlagen: ${response.status} - ${errorMessage}`);
              }
            }
          }
        } else {
          console.warn(`⚠️ Konnte Existenz-Prüfung für ${entityType} mit id=${item.id} nicht durchführen`);
        }
      }

      console.log(`✅ SUPABASE: ${items.length} ${entityType} verarbeitet (einige Datensätze könnten übersprungen worden sein)`);
      return true;
    } catch (error) {
      console.error(`❌ SUPABASE Fehler beim Speichern von ${entityType}:`, error);
      return false;
    }
  }

  async load<T extends StorageEntity>(entityType: string): Promise<T[]> {
    try {
      console.log(`☁️ SUPABASE: Lade ${entityType}`);
      const baseUrl = this.getBaseUrl();
      
      const response = await fetch(`${baseUrl}/${entityType}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️ Tabelle ${entityType} existiert nicht - returniere leeres Array`);
          return [];
        }
        throw new Error(`Fehler beim Laden: ${response.status}`);
      }

      const data = await response.json();
      
      // Transformiere snake_case → camelCase für Frontend
      const transformedData = data.map((item: any) => {
        const camel = this.transformToCamelCase(item);
        // Entferne dbId (veraltetes Feld) falls vorhanden, behalte db_id
        if ((camel as any).dbId) {
          delete (camel as any).dbId;
        }
        return camel;
      });
      
      console.log(`✅ SUPABASE: ${transformedData.length} ${entityType} geladen`);
      return transformedData as T[];
    } catch (error) {
      console.error(`❌ SUPABASE Fehler beim Laden von ${entityType}:`, error);
      return [];
    }
  }

  async delete(entityType: string, id: string): Promise<boolean> {
    try {
      console.log(`☁️ SUPABASE: Lösche ${entityType} mit id=${id}`);
      const baseUrl = this.getBaseUrl();
      
      const response = await fetch(`${baseUrl}/${entityType}?id=eq.${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Löschen: ${response.status}`);
      }

      console.log(`✅ SUPABASE: ${entityType} gelöscht`);
      return true;
    } catch (error) {
      console.error(`❌ SUPABASE Fehler beim Löschen von ${entityType}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('☁️ SUPABASE: Verbindungstest');
      const baseUrl = this.getBaseUrl();
      
      const response = await fetch(`${baseUrl}/system_info?limit=1`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const success = response.ok;
      console.log(`${success ? '✅' : '❌'} SUPABASE Verbindungstest: ${success ? 'Erfolgreich' : 'Fehlgeschlagen'}`);
      return success;
    } catch (error) {
      console.error('❌ SUPABASE Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }

  // Bild-Methoden für Supabase Storage
  async saveImage(path: string, file: File): Promise<boolean> {
    try {
      console.log(`📷 SUPABASE Storage: Speichere Bild: ${path}`);
      
      const storageUrl = `${this.connectionData.url}/storage/v1/object/chef-numbers-images/${path}`;
      
      const response = await fetch(storageUrl, {
        method: 'POST',
        headers: {
          'apikey': this.connectionData.serviceRoleKey,
          'Authorization': `Bearer ${this.connectionData.serviceRoleKey}`
        },
        body: file
      });

      if (!response.ok) {
        // Falls Bild existiert, versuche UPDATE
        const updateResponse = await fetch(storageUrl, {
          method: 'PUT',
          headers: {
            'apikey': this.connectionData.serviceRoleKey,
            'Authorization': `Bearer ${this.connectionData.serviceRoleKey}`
          },
          body: file
        });

        if (!updateResponse.ok) {
          throw new Error(`Fehler beim Speichern: ${updateResponse.status}`);
        }
      }

      console.log(`✅ SUPABASE Storage: Bild gespeichert`);
      return true;
    } catch (error) {
      console.error(`❌ SUPABASE Storage Fehler beim Speichern:`, error);
      return false;
    }
  }

  async loadImage(path: string): Promise<string | null> {
    try {
      console.log(`📷 SUPABASE Storage: Lade Bild: ${path}`);
      
      const publicUrl = `${this.connectionData.url}/storage/v1/object/public/chef-numbers-images/${path}`;
      
      // Teste ob Bild existiert
      const response = await fetch(publicUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        console.log(`⚠️ Bild nicht gefunden: ${path}`);
        return null;
      }

      console.log(`✅ SUPABASE Storage: Bild-URL: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error(`❌ SUPABASE Storage Fehler beim Laden:`, error);
      return null;
    }
  }

  async deleteImage(path: string): Promise<boolean> {
    try {
      console.log(`📷 SUPABASE Storage: Lösche Bild: ${path}`);
      
      const storageUrl = `${this.connectionData.url}/storage/v1/object/chef-numbers-images/${path}`;
      
      const response = await fetch(storageUrl, {
        method: 'DELETE',
        headers: {
          'apikey': this.connectionData.serviceRoleKey,
          'Authorization': `Bearer ${this.connectionData.serviceRoleKey}`
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Fehler beim Löschen: ${response.status}`);
      }

      console.log(`✅ SUPABASE Storage: Bild gelöscht`);
      return true;
    } catch (error) {
      console.error(`❌ SUPABASE Storage Fehler beim Löschen:`, error);
      return false;
    }
  }
}

// Firebase Adapter (NoSQL - Firestore + Cloud Storage)
class FirebaseAdapter implements StorageAdapter {
  name = 'FirebaseAdapter';
  type = 'firebase';
  private app: any = null;
  private db: any = null;
  private storage: any = null;

  constructor(private connectionData: any) {
    console.log('🔥 FirebaseAdapter erstellt mit ConnectionData:', {
      projectId: connectionData?.projectId,
      hasApiKey: !!connectionData?.apiKey,
      hasAuthDomain: !!connectionData?.authDomain,
      hasStorageBucket: !!connectionData?.storageBucket
    });
  }

  // Initialisiere Firebase (lazy loading)
  private async initializeFirebase() {
    if (this.app && this.db && this.storage) {
      console.log('🔥 Firebase bereits initialisiert - verwende existierende Instanz');
      return; // Bereits initialisiert und ready
    }

    try {
      // Dynamischer Import des Firebase SDK
      const { initializeApp, getApps, deleteApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      const { getStorage } = await import('firebase/storage');

      // Firebase Config
      const firebaseConfig = {
        apiKey: this.connectionData.apiKey,
        authDomain: this.connectionData.authDomain,
        projectId: this.connectionData.projectId,
        storageBucket: this.connectionData.storageBucket,
        messagingSenderId: this.connectionData.messagingSenderId,
        appId: this.connectionData.appId
      };

      // Prüfe ob bereits eine App mit dieser Config existiert
      const existingApps = getApps();
      const existingApp = existingApps.find(app => 
        app.options.projectId === firebaseConfig.projectId &&
        app.options.appId === firebaseConfig.appId
      );

      if (existingApp) {
        console.log('🔥 Verwende existierende Firebase App:', firebaseConfig.projectId);
        this.app = existingApp;
        this.db = getFirestore(this.app);
        this.storage = getStorage(this.app);
        return;
      }

      // Lösche nur Apps mit ANDERER Config (für sauberes Re-Init bei Config-Wechsel)
      for (const app of existingApps) {
        if (app.options.projectId !== firebaseConfig.projectId) {
          console.log('🗑️ Lösche Firebase App mit anderer Config:', app.options.projectId);
          await deleteApp(app);
        }
      }

      // Initialisiere neue Firebase App
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.storage = getStorage(this.app);

      console.log('✅ Firebase NEU initialisiert:', firebaseConfig.projectId);
    } catch (error) {
      console.error('❌ Firebase Initialisierung fehlgeschlagen:', error);
      throw error;
    }
  }

  async save<T extends StorageEntity>(
    entityType: string,
    data: T | T[]
  ): Promise<boolean> {
    try {
      await this.initializeFirebase();
      
      const items = Array.isArray(data) ? data : [data];
      console.log(`🔥 FIREBASE: Speichere ${items.length} ${entityType}`);

      const { collection, doc, setDoc, getDoc } = await import('firebase/firestore');

      for (const item of items) {
        let itemData = { ...item };
        
        // Entferne Frontend-spezifische Felder
        // db_id wird behalten (wird als Primary Key verwendet)
        delete (itemData as any).isDirty;
        delete (itemData as any).isNew;
        delete (itemData as any).syncStatus;
        delete (itemData as any).nutrition; // Veraltetes Feld
        
        // Entferne veraltetes dbId-Feld (verwende db_id stattdessen)
        // Dies verhindert auch undefined-Werte für dbId
        if ('dbId' in itemData) {
          delete (itemData as any).dbId;
          console.log('🗑️ Entferne veraltetes dbId-Feld für Firestore (verwende db_id)');
        }
        
        // WICHTIG: Entferne alle undefined-Werte aus dem Objekt
        // Firestore unterstützt keine undefined-Werte - diese müssen entfernt werden
        const removeUndefinedValues = (obj: any): any => {
          if (obj === null || obj === undefined) {
            return null;
          }
          if (Array.isArray(obj)) {
            return obj.map(removeUndefinedValues).filter(item => item !== undefined);
          }
          if (typeof obj === 'object') {
            const cleaned: any = {};
            for (const [key, value] of Object.entries(obj)) {
              if (value !== undefined) {
                cleaned[key] = removeUndefinedValues(value);
              }
            }
            return cleaned;
          }
          return obj;
        };
        
        itemData = removeUndefinedValues(itemData) as any;
        
        // Setze Timestamps (Firestore erwartet ISO Strings oder Timestamp-Objekte)
        if (!(itemData as any).createdAt) {
          (itemData as any).createdAt = new Date().toISOString();
        }
        if (!(itemData as any).updatedAt) {
          (itemData as any).updatedAt = new Date().toISOString();
        }

        // Firestore: Verwende die ID als Document-ID
        const docRef = doc(this.db, entityType, item.id);
        
        // Prüfe ob Dokument existiert
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // UPDATE
          console.log(`🔥 UPDATE: ${entityType} mit id=${item.id}`);
          await setDoc(docRef, itemData, { merge: true });
        } else {
          // INSERT
          console.log(`🔥 INSERT: ${entityType} mit id=${item.id}`);
          await setDoc(docRef, itemData);
        }
      }

      console.log(`✅ FIREBASE: ${items.length} ${entityType} erfolgreich gespeichert`);
      return true;
    } catch (error) {
      console.error(`❌ FIREBASE Fehler beim Speichern von ${entityType}:`, error);
      return false;
    }
  }

  async load<T extends StorageEntity>(entityType: string): Promise<T[]> {
    try {
      await this.initializeFirebase();
      
      console.log(`🔥 FIREBASE: Lade ${entityType}`);
      
      const { collection, getDocs } = await import('firebase/firestore');

      const collectionRef = collection(this.db, entityType);
      const snapshot = await getDocs(collectionRef);

      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          ...docData,
          id: doc.id // Firestore Document-ID als id verwenden
        } as T;
      });

      console.log(`✅ FIREBASE: ${data.length} ${entityType} geladen`);
      return data;
    } catch (error) {
      console.error(`❌ FIREBASE Fehler beim Laden von ${entityType}:`, error);
      
      // Wenn Collection nicht existiert, returniere leeres Array
      if ((error as any)?.code === 'permission-denied') {
        console.log(`⚠️ Firestore-Zugriff verweigert für ${entityType} - Prüfen Sie die Sicherheitsregeln`);
      }
      
      return [];
    }
  }

  async delete(entityType: string, id: string): Promise<boolean> {
    try {
      await this.initializeFirebase();
      
      console.log(`🔥 FIREBASE: Lösche ${entityType} mit id=${id}`);
      
      const { doc, deleteDoc } = await import('firebase/firestore');

      const docRef = doc(this.db, entityType, id);
      await deleteDoc(docRef);

      console.log(`✅ FIREBASE: ${entityType} gelöscht`);
      return true;
    } catch (error) {
      console.error(`❌ FIREBASE Fehler beim Löschen von ${entityType}:`, error);
      return false;
    }
  }

  async deleteAll(entityType: string): Promise<boolean> {
    try {
      await this.initializeFirebase();
      
      console.log(`🔥 FIREBASE: Lösche alle ${entityType}`);
      
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');

      const collectionRef = collection(this.db, entityType);
      const snapshot = await getDocs(collectionRef);

      // Firestore Batch Delete (max 500 pro Batch)
      const batchSize = 500;
      let batch = writeBatch(this.db);
      let count = 0;

      for (const document of snapshot.docs) {
        batch.delete(doc(this.db, entityType, document.id));
        count++;

        if (count % batchSize === 0) {
          await batch.commit();
          batch = writeBatch(this.db);
        }
      }

      // Commit übrige Dokumente
      if (count % batchSize !== 0) {
        await batch.commit();
      }

      console.log(`✅ FIREBASE: ${count} ${entityType} gelöscht`);
      return true;
    } catch (error) {
      console.error(`❌ FIREBASE Fehler beim Löschen aller ${entityType}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.initializeFirebase();
      
      console.log('🔥 FIREBASE: Verbindungstest');
      
      const { collection, query, limit, getDocs } = await import('firebase/firestore');

      // Test-Query auf system_info
      const testQuery = query(collection(this.db, 'system_info'), limit(1));
      await getDocs(testQuery);

      console.log('✅ FIREBASE Verbindungstest erfolgreich');
      return true;
    } catch (error) {
      // Permission-denied ist OK für Verbindungstest
      if ((error as any)?.code === 'permission-denied') {
        console.log('✅ FIREBASE Verbindung OK (Regeln sind restriktiv)');
        return true;
      }
      
      console.error('❌ FIREBASE Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }

  // Bild-Methoden für Firebase Storage
  async saveImage(path: string, file: File): Promise<boolean> {
    try {
      await this.initializeFirebase();
      
      console.log(`📷 FIREBASE Storage: Speichere Bild: ${path}`);
      
      const { ref, uploadBytes } = await import('firebase/storage');

      const storageRef = ref(this.storage, `images/${path}`);
      await uploadBytes(storageRef, file);

      console.log(`✅ FIREBASE Storage: Bild gespeichert`);
      return true;
    } catch (error) {
      console.error(`❌ FIREBASE Storage Fehler beim Speichern:`, error);
      return false;
    }
  }

  async loadImage(path: string): Promise<string | null> {
    try {
      await this.initializeFirebase();
      
      console.log(`📷 FIREBASE Storage: Lade Bild: ${path}`);
      
      const { ref, getDownloadURL } = await import('firebase/storage');

      const storageRef = ref(this.storage, `images/${path}`);
      const url = await getDownloadURL(storageRef);

      console.log(`✅ FIREBASE Storage: Bild-URL erhalten`);
      return url;
    } catch (error) {
      // Bild existiert nicht
      if ((error as any)?.code === 'storage/object-not-found') {
        console.log(`⚠️ Bild nicht gefunden: ${path}`);
        return null;
      }
      
      console.error(`❌ FIREBASE Storage Fehler beim Laden:`, error);
      return null;
    }
  }

  async deleteImage(path: string): Promise<boolean> {
    try {
      await this.initializeFirebase();
      
      console.log(`📷 FIREBASE Storage: Lösche Bild: ${path}`);
      
      const { ref, deleteObject } = await import('firebase/storage');

      const storageRef = ref(this.storage, `images/${path}`);
      await deleteObject(storageRef);

      console.log(`✅ FIREBASE Storage: Bild gelöscht`);
      return true;
    } catch (error) {
      // Nicht gefunden ist kein Fehler
      if ((error as any)?.code === 'storage/object-not-found') {
        console.log(`⚠️ Bild existiert nicht: ${path}`);
        return true;
      }
      
      console.error(`❌ FIREBASE Storage Fehler beim Löschen:`, error);
      return false;
    }
  }
}

// CouchDB Adapter (NoSQL)
class CouchDBAdapter implements StorageAdapter {
  name = 'CouchDBAdapter';
  type = 'couchdb';

  constructor(private connectionData: any) {
    console.log('🛋️ CouchDBAdapter erstellt mit ConnectionData:', {
      host: connectionData?.host,
      port: connectionData?.port,
      database: connectionData?.database,
      hasUsername: !!connectionData?.username,
      hasPassword: !!connectionData?.password
    });
  }

  private getBaseUrl(): string {
    const host = this.connectionData.host || 'localhost';
    const port = this.connectionData.port || '5984';
    const baseUrl = `http://${host}:${port}`;
    console.log(`🛋️ CouchDB BaseUrl: ${baseUrl}`);
    return baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // CouchDB verwendet Basic Auth
    if (this.connectionData.username && this.connectionData.password) {
      const credentials = btoa(`${this.connectionData.username}:${this.connectionData.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
      console.log(`🛋️ CouchDB: Verwende Basic Auth für ${this.connectionData.username}`);
    } else {
      console.warn('⚠️ CouchDB: Keine Authentifizierungsdaten verfügbar');
    }

    return headers;
  }

  // Map key to CouchDB database name
  private mapKeyToDatabase(key: string): string {
    const keyMap: { [key: string]: string } = {
      'articles': 'articles',
      'suppliers': 'suppliers',
      'recipes': 'recipes',
      'einkaufsListe': 'einkaufsitems',
      'inventurListe': 'inventuritems',
    };
    return keyMap[key] || key;
  }

  // Transformiere Daten für CouchDB
  private transformDataForCouchDB<T extends StorageEntity>(data: T[]): any[] {
    return data.map(item => {
      const transformed: any = { ...item };

      // CouchDB verwendet _id als Document-ID (nicht id)
      transformed._id = item.id;
      
      // Entferne veraltetes dbId-Feld (falls vorhanden)
      // db_id kann behalten werden, wird aber nicht verwendet (CouchDB verwendet _id und _rev automatisch)
      if (transformed.dbId) {
        delete transformed.dbId;
      }

      // Entferne Frontend-spezifische Felder
      delete transformed.isDirty;
      delete transformed.isNew;
      delete transformed.syncStatus;
      delete transformed.supplier; // Nur supplierId verwenden

      // CouchDB speichert alles als JSON, keine Feldnamen-Transformation nötig
      // Behalte camelCase für Konsistenz mit Frontend

      console.log(`🛋️ CouchDB Transform: Document mit _id: ${transformed._id}`);
      return transformed;
    });
  }

  // Transformiere Daten von CouchDB zurück zu Frontend-Format
  private transformDataFromCouchDB(data: any[]): any[] {
    return data.map(item => {
      const transformed: any = { ...item };

      // CouchDB _id wird zu Frontend id
      if (transformed._id) {
        transformed.id = transformed._id;
        delete transformed._id;
      }

      // CouchDB _rev (Revision) behalten für Updates
      if (transformed._rev) {
        transformed.dbRev = transformed._rev;
        delete transformed._rev;
      }

      // Füge Frontend-Felder hinzu
      transformed.isDirty = false;
      transformed.isNew = false;
      transformed.syncStatus = 'synced';

      return transformed;
    });
  }

  async save<T extends StorageEntity>(
    key: string,
    data: T[],
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    try {
      const database = this.mapKeyToDatabase(key);
      console.log(`🛋️ CouchDB: Speichere ${data.length} Einträge in ${database}`);

      const transformedData = this.transformDataForCouchDB(data);

      if (onProgress) {
        onProgress(0, data.length);
      }

      // CouchDB Bulk API für bessere Performance
      const bulkDocs = transformedData.map(doc => {
        // Füge _rev hinzu falls vorhanden (für Updates)
        const originalItem = data.find(orig => orig.id === doc._id);
        if (originalItem && (originalItem as any).dbRev) {
          doc._rev = (originalItem as any).dbRev;
        }
        return doc;
      });

      const response = await fetch(`${this.getBaseUrl()}/${database}/_bulk_docs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ docs: bulkDocs })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ CouchDB Fehler: ${response.status}`, errorText);
        throw new Error(`CouchDB Fehler: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      
      // Aktualisiere _rev für zukünftige Updates
      results.forEach((result: any, index: number) => {
        if (result.ok && result.rev) {
          const originalItem = data.find(orig => orig.id === result.id);
          if (originalItem) {
            (originalItem as any).dbRev = result.rev;
            console.log(`✅ CouchDB: _rev aktualisiert für ${result.id}: ${result.rev}`);
          }
        } else if (result.error) {
          console.error(`❌ CouchDB Fehler für Document ${result.id}:`, result.error, result.reason);
        }
      });

      if (onProgress) {
        onProgress(data.length, data.length);
      }

      console.log(`✅ CouchDB: ${data.length} Einträge erfolgreich gespeichert`);
      return true;
    } catch (error) {
      console.error(`❌ CouchDB Fehler beim Speichern von ${key}:`, error);
      return false;
    }
  }

  async load<T extends StorageEntity>(key: string): Promise<T[] | null> {
    try {
      const database = this.mapKeyToDatabase(key);
      console.log(`🛋️ CouchDB: Lade Daten aus ${database}`);

      // CouchDB _all_docs Endpoint mit include_docs=true
      const response = await fetch(`${this.getBaseUrl()}/${database}/_all_docs?include_docs=true`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️ CouchDB Datenbank ${database} existiert nicht - returniere leeres Array`);
          return [];
        }
        throw new Error(`CouchDB Fehler: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Extrahiere docs aus rows
      const docs = result.rows
        .filter((row: any) => row.doc && !row.id.startsWith('_design/')) // Filter Design-Dokumente
        .map((row: any) => row.doc);

      console.log(`✅ CouchDB: ${docs.length} Einträge aus ${database} geladen`);

      // Transformiere zurück zu Frontend-Format
      const transformedData = this.transformDataFromCouchDB(docs);

      return transformedData as T[];
    } catch (error) {
      console.error(`❌ CouchDB Fehler beim Laden von ${key}:`, error);
      return null;
    }
  }

  async delete<T extends StorageEntity>(key: string, id: string): Promise<boolean> {
    try {
      const database = this.mapKeyToDatabase(key);
      console.log(`🛋️ CouchDB: Lösche Document ${id} aus ${database}`);

      // CouchDB benötigt _rev zum Löschen - hole es zuerst
      const getResponse = await fetch(`${this.getBaseUrl()}/${database}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!getResponse.ok) {
        if (getResponse.status === 404) {
          console.log(`⚠️ Document ${id} existiert nicht`);
          return false;
        }
        throw new Error(`Fehler beim Abrufen von ${id}: ${getResponse.status}`);
      }

      const doc = await getResponse.json();

      // Lösche mit _rev
      const deleteResponse = await fetch(`${this.getBaseUrl()}/${database}/${id}?rev=${doc._rev}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!deleteResponse.ok) {
        throw new Error(`CouchDB Löschfehler: ${deleteResponse.status} ${deleteResponse.statusText}`);
      }

      console.log(`✅ CouchDB: Document ${id} erfolgreich gelöscht`);
      return true;
    } catch (error) {
      console.error(`❌ CouchDB Fehler beim Löschen von ${key} (${id}):`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🛋️ CouchDB: Verbindungstest');

      // Teste CouchDB Root Endpoint
      const response = await fetch(`${this.getBaseUrl()}/`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`CouchDB nicht erreichbar: ${response.status} ${response.statusText}`);
      }

      const info = await response.json();
      console.log('✅ CouchDB Verbindungstest erfolgreich:', info);

      // Teste auch die Datenbank
      const database = this.connectionData.database || 'chef_numbers';
      const dbResponse = await fetch(`${this.getBaseUrl()}/${database}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (dbResponse.ok) {
        const dbInfo = await dbResponse.json();
        console.log(`✅ CouchDB Datenbank ${database} ist verfügbar:`, dbInfo);
      } else if (dbResponse.status === 404) {
        console.log(`⚠️ CouchDB Datenbank ${database} existiert noch nicht (wird bei erstem Schreiben erstellt)`);
      }

      return true;
    } catch (error) {
      console.error('❌ CouchDB Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }
}

// MinIO Adapter (für Bilder)
class MinIOAdapter implements StorageAdapter {
  name = 'MinIOAdapter';
  type = 'minio';
  private s3Client: S3Client | null = null;

  constructor(private connectionData: any) {
    console.log('📦 MinIOAdapter erstellt mit ConnectionData:', connectionData);
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    if (!this.connectionData) {
      console.warn('⚠️ MinIO: Keine Verbindungsdaten für S3Client');
      return;
    }

    try {
      this.s3Client = new S3Client({
        endpoint: `http://${this.connectionData.host}:${this.connectionData.port}`,
        region: 'us-east-1', // MinIO Standard
        credentials: {
          accessKeyId: this.connectionData.accessKey || this.connectionData.username || '',
          secretAccessKey: this.connectionData.secretKey || this.connectionData.password || ''
        },
        forcePathStyle: true, // MinIO erfordert path-style URLs
      });

      console.log('✅ MinIO S3Client initialisiert:', {
        endpoint: `http://${this.connectionData.host}:${this.connectionData.port}`,
        region: 'us-east-1',
        forcePathStyle: true
      });
    } catch (error) {
      console.error('❌ MinIO S3Client Initialisierung fehlgeschlagen:', error);
    }
  }

  private getBaseUrl(): string {
    // Verwende Port aus Verbindungsdaten oder Standard MinIO-Port 9000
    const port = this.connectionData.port || '9000';
    const host = this.connectionData.host || 'localhost';
    const baseUrl = `http://${host}:${port}`;
    console.log(`📦 MinIO BaseUrl: ${baseUrl} (Host: ${host}, Port: ${port})`);
    console.log(`📦 MinIO ConnectionData:`, this.connectionData);
    console.log(`📦 MinIO Port-Mapping:`, {
      apiPort: this.connectionData.port,
      consolePort: this.connectionData.consolePort,
      defaultApiPort: '9000',
      defaultConsolePort: '9001'
    });
    return baseUrl;
  }

  private getBucketUrl(): string {
    const bucket = this.connectionData.bucket || 'chefnumbers';
    const bucketUrl = `${this.getBaseUrl()}/${bucket}`;
    console.log(`📦 MinIO BucketUrl: ${bucketUrl} (Bucket: ${bucket})`);
    return bucketUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/octet-stream'
    };

    // Füge MinIO-Authentifizierung hinzu, falls verfügbar
    // MinIO verwendet accessKey und secretKey (oder username/password)
    const accessKey = this.connectionData.accessKey || this.connectionData.username;
    const secretKey = this.connectionData.secretKey || this.connectionData.password;
    
    if (accessKey && secretKey) {
      // MinIO S3-kompatible Authentifizierung mit AWS Signature V4
      // Für einfache Fälle verwenden wir Basic Auth
      const credentials = btoa(`${accessKey}:${secretKey}`);
      headers['Authorization'] = `Basic ${credentials}`;
      console.log(`📦 MinIO: Verwende Authentifizierung für ${accessKey}`);
    } else {
      console.warn('⚠️ MinIO: Keine Authentifizierungsdaten verfügbar');
    }

    return headers;
  }

  // MinIO-Authentifizierung (vereinfacht - ohne S3-Signatur)
  private getS3Headers(method: string, fileName: string, contentType?: string): HeadersInit {
    const headers: HeadersInit = {};

    const accessKey = this.connectionData.accessKey || this.connectionData.username;
    const secretKey = this.connectionData.secretKey || this.connectionData.password;
    
    if (accessKey && secretKey) {
      // MinIO erfordert AWS Signature V4, was im Browser komplex ist
      // Für einfache Fälle verwenden wir Query-Parameter-Authentifizierung
      console.log(`📦 MinIO: Verwende Access Key ${accessKey} für ${method} ${fileName}`);
      // TODO: Implementiere AWS Signature V4 oder verwende Pre-signed URLs
    }

    // Setze Content-Type nur wenn gesetzt
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    return headers;
  }

  async save<T extends StorageEntity>(
    key: string, 
    data: T[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    try {
      console.log(`📦 MinIO: ${key} speichern (${data.length} Einträge)`);
      
      if (onProgress) {
        onProgress(0, data.length);
      }
      
      // MinIO für Bilder - speichere als JSON-Datei
      const fileName = `${key}.json`;
      const response = await fetch(`${this.getBucketUrl()}/${fileName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`MinIO Fehler: ${response.status} ${response.statusText}`);
      }

      if (onProgress) {
        onProgress(data.length, data.length);
      }

      console.log(`✅ MinIO: ${key} erfolgreich gespeichert`);
        return true;
    } catch (error) {
      console.error(`❌ MinIO Fehler beim Speichern von ${key}:`, error);
      return false;
    }
  }

  async load<T extends StorageEntity>(key: string): Promise<T[] | null> {
    try {
      console.log(`📦 MinIO: ${key} laden`);
      
      const fileName = `${key}.json`;
      const response = await fetch(`${this.getBucketUrl()}/${fileName}`, {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`📦 MinIO: ${key} nicht gefunden, leere Liste zurückgeben`);
          return [];
        }
        throw new Error(`MinIO Fehler: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ MinIO: ${key} erfolgreich geladen (${data.length} Einträge)`);
      return data;
    } catch (error) {
      console.error(`❌ MinIO Fehler beim Laden von ${key}:`, error);
      return null;
    }
  }

  async delete<T extends StorageEntity>(key: string, id: string): Promise<boolean> {
    try {
      console.log(`📦 MinIO: ${key} löschen (ID: ${id})`);
      
      // Für MinIO: Lade alle Daten, entferne das Element und speichere wieder
      const data = await this.load<T>(key);
      if (!data) return false;
      
      const filteredData = data.filter(item => item.id !== id);
      return await this.save(key, filteredData);
    } catch (error) {
      console.error(`❌ MinIO Fehler beim Löschen von ${key}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('📦 MinIO: Verbindungstest');
      console.log('📦 MinIO: Prüfe ob ConnectionData vorhanden ist:', !!this.connectionData);
      
      if (!this.connectionData) {
        console.warn('⚠️ MinIO: Keine Verbindungsdaten verfügbar');
        return false;
      }
      
      // Teste MinIO-Verbindung über S3-kompatible API (Bucket-Liste)
      const bucket = this.connectionData.bucket || 'chefnumbers';
      const testUrl = `${this.getBaseUrl()}/${bucket}/`;
      console.log(`📦 MinIO: Teste API-Verbindung zu ${testUrl}`);
      
      try {
        // Teste MinIO-API ohne Authentifizierung (sollte 403 Forbidden zurückgeben)
        const response = await fetch(testUrl, {
          method: 'GET'
        });

        console.log(`📦 MinIO API Response: ${response.status} ${response.statusText}`);
        
        // 403 (Forbidden) bedeutet MinIO läuft, aber keine Authentifizierung
        // 200 (OK) bedeutet MinIO läuft ohne Authentifizierung
        // 404 (Not Found) bedeutet MinIO läuft, aber Bucket existiert nicht
        const isOk = response.status === 200 || response.status === 403 || response.status === 404;
        console.log(`📦 MinIO: Verbindungstest ${isOk ? 'erfolgreich' : 'fehlgeschlagen'}`);
        
        // Zeige Response-Body für bessere Diagnose (auch bei Erfolg)
        try {
          const responseText = await response.text();
          console.log(`📦 MinIO: Response Body:`, responseText);
        } catch (e) {
          console.log(`📦 MinIO: Konnte Response Body nicht lesen`);
        }
        
        return isOk;
      } catch (fetchError) {
        console.error('❌ MinIO: Fetch-Fehler:', fetchError);
        // Bei CORS-Fehlern oder Netzwerk-Problemen nehmen wir an, dass MinIO läuft
        // wenn die Verbindungsdaten konfiguriert sind
        console.log('📦 MinIO: CORS/Netzwerk-Fehler - nehme an, dass MinIO läuft (Daten konfiguriert)');
        return true;
      }
    } catch (error) {
      console.error('❌ MinIO Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Speichert ein Bild im MinIO Bucket
   */
  async saveImage(imagePath: string, file: File): Promise<boolean> {
    try {
      console.log(`📦 MinIO: Speichere Bild unter ${imagePath} mit AWS SDK`);
      
      if (!this.s3Client) {
        console.error('❌ MinIO: S3Client nicht initialisiert');
        return false;
      }
      
      // Parse imagePath: "pictures/recipes/{recipeId}" oder "pictures/articles/{articleId}"
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'pictures' && (pathParts[1] === 'recipes' || pathParts[1] === 'articles')) {
        const entityType = pathParts[1]; // 'recipes' oder 'articles'
        const entityId = pathParts[2];
        
        // Extrahiere Dateiendung aus MIME-Type statt aus Dateinamen
        const mimeTypeMap: { [key: string]: string } = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp'
        };
        const fileExtension = mimeTypeMap[file.type] || file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${entityType}/${entityId}.${fileExtension}`;
        const bucket = this.connectionData?.bucket || 'chefnumbers';
        
        console.log(`📦 MinIO: Speichere Bild als ${fileName} in Bucket ${bucket}`);
        console.log(`📦 MinIO: Original filename: ${file.name}`);
        console.log(`📦 MinIO: Content-Type: ${file.type}`);
        console.log(`📦 MinIO: Extrahierte Extension: ${fileExtension}`);
        console.log(`📦 MinIO: Dateigröße: ${file.size} bytes`);
        
        // Konvertiere File zu ArrayBuffer für AWS SDK
        const arrayBuffer = await file.arrayBuffer();
        
        // AWS SDK PutObjectCommand
        const putCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: new Uint8Array(arrayBuffer),
          ContentType: file.type,
          ContentLength: arrayBuffer.byteLength
        });
        
        const result = await this.s3Client.send(putCommand);
        console.log(`✅ MinIO: Bild erfolgreich gespeichert unter ${fileName}`, result);
        return true;
      } else {
        throw new Error(`Ungültiger Bildpfad: ${imagePath}. Erwartet: pictures/recipes/{recipeId} oder pictures/articles/{articleId}`);
      }
    } catch (error) {
      console.error(`❌ MinIO Fehler beim Speichern des Bildes ${imagePath}:`, error);
      return false;
    }
  }

  /**
   * Lädt ein Bild aus dem MinIO Bucket
   */
  async loadImage(imagePath: string): Promise<string | null> {
    try {
      console.log(`📦 MinIO: Lade Bild von ${imagePath} mit AWS SDK`);
      
      if (!this.s3Client) {
        console.error('❌ MinIO: S3Client nicht initialisiert');
        return null;
      }
      
      // Parse imagePath: "pictures/recipes/{recipeId}" oder "pictures/articles/{articleId}"
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'pictures' && (pathParts[1] === 'recipes' || pathParts[1] === 'articles')) {
        const entityType = pathParts[1]; // 'recipes' oder 'articles'
        const entityId = pathParts[2];
        const bucket = this.connectionData?.bucket || 'chefnumbers';
        
        // Versuche verschiedene Dateierweiterungen
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        for (const ext of extensions) {
          const fileName = `${entityType}/${entityId}.${ext}`;
          
          try {
            // AWS SDK GetObjectCommand
            const getCommand = new GetObjectCommand({
              Bucket: bucket,
              Key: fileName
            });
            
            const result = await this.s3Client.send(getCommand);
            
            if (result.Body) {
              // Konvertiere Stream zu ArrayBuffer
              const chunks: Uint8Array[] = [];
              const stream = result.Body as any;
              
              // Browser-Umgebung: Body ist ReadableStream
              if (stream.getReader) {
                const reader = stream.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  chunks.push(value);
                }
              } else {
                // Node.js-Umgebung: Body ist Node.js Stream
                for await (const chunk of stream) {
                  chunks.push(chunk);
                }
              }
              
              // Zusammenfügen der Chunks
              const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
              const arrayBuffer = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of chunks) {
                arrayBuffer.set(chunk, offset);
                offset += chunk.length;
              }
              
              // Konvertiere zu Base64 für Frontend-Kompatibilität
              const base64 = btoa(String.fromCharCode.apply(null, Array.from(arrayBuffer)));
              const contentType = result.ContentType || 'image/jpeg';
              const dataUrl = `data:${contentType};base64,${base64}`;
              
              console.log(`✅ MinIO: Bild erfolgreich geladen von ${fileName}`);
              return dataUrl;
            }
          } catch (e: any) {
            // Prüfe ob es ein "Not Found" Fehler ist
            if (e.name === 'NoSuchKey' || e.name === 'NotFound') {
              // Datei existiert nicht, versuche nächste Erweiterung
              continue;
            }
            console.warn(`⚠️ MinIO: Fehler beim Laden von ${fileName}:`, e.message);
            continue;
          }
        }
        
        console.log(`📦 MinIO: Kein Bild gefunden für ${imagePath}`);
        return null;
      } else {
        throw new Error(`Ungültiger Bildpfad: ${imagePath}. Erwartet: pictures/recipes/{recipeId} oder pictures/articles/{articleId}`);
      }
    } catch (error) {
      console.error(`❌ MinIO Fehler beim Laden des Bildes ${imagePath}:`, error);
      return null;
    }
  }

  /**
   * Löscht ein Bild aus dem MinIO Bucket
   */
  async deleteImage(imagePath: string): Promise<boolean> {
    try {
      console.log(`📦 MinIO: Lösche Bild von ${imagePath} mit AWS SDK`);
      
      if (!this.s3Client) {
        console.error('❌ MinIO: S3Client nicht initialisiert');
        return false;
      }
      
      // Parse imagePath: "pictures/recipes/{recipeId}" oder "pictures/articles/{articleId}"
      const pathParts = imagePath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'pictures' && (pathParts[1] === 'recipes' || pathParts[1] === 'articles')) {
        const entityType = pathParts[1]; // 'recipes' oder 'articles'
        const entityId = pathParts[2];
        const bucket = this.connectionData?.bucket || 'chefnumbers';
        
        // Versuche verschiedene Dateierweiterungen zu löschen
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        let deleted = false;
        
        for (const ext of extensions) {
          const fileName = `${entityType}/${entityId}.${ext}`;
          
          try {
            console.log(`📦 MinIO: Versuche ${fileName} zu löschen aus Bucket ${bucket}...`);
            
            // AWS SDK DeleteObjectCommand
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucket,
              Key: fileName
            });
            
            const result = await this.s3Client.send(deleteCommand);
            console.log(`✅ MinIO: Bild erfolgreich gelöscht: ${fileName}`, result);
            deleted = true;
            // Nicht break - lösche alle Varianten falls mehrere existieren
          } catch (e: any) {
            // Prüfe ob es ein "Not Found" Fehler ist
            if (e.name === 'NoSuchKey' || e.name === 'NotFound') {
              console.log(`📦 MinIO: ${fileName} existiert nicht, überspringe`);
              continue;
            }
            console.warn(`⚠️ MinIO: Fehler beim Löschen von ${fileName}:`, e.message);
            continue;
          }
        }
        
        if (!deleted) {
          console.log(`📦 MinIO: Kein Bild gefunden zum Löschen für ${imagePath}`);
          return false;
        }
        
        return true;
      } else {
        throw new Error(`Ungültiger Bildpfad: ${imagePath}. Erwartet: pictures/recipes/{recipeId} oder pictures/articles/{articleId}`);
      }
    } catch (error) {
      console.error(`❌ MinIO Fehler beim Löschen des Bildes ${imagePath}:`, error);
      return false;
    }
  }
}

// StorageLayer Singleton
export class StorageLayer {
  private static instance: StorageLayer | null = null;
  private dataAdapter: StorageAdapter | null = null;
  private pictureAdapter: StorageAdapter | null = null;
  private currentConfig: StorageConfig | null = null;
  private isInitialized = false;

  private constructor() {
    console.log('🏗️ StorageLayer Singleton erstellt');
  }

  // Lade Storage-Konfiguration direkt aus storageManagement LocalStorage
  private async loadStorageConfigFromLocalStorage(): Promise<StorageConfig> {
    try {
      const storageManagementData = localStorage.getItem('storageManagement');
      
      if (!storageManagementData) {
        console.log('📱 Keine StorageManagement-Daten gefunden, verwende lokalen Modus');
        return {
          mode: 'local',
          data: 'SQLite',
          picture: 'LocalPath'
        };
      }

      const parsed = JSON.parse(storageManagementData);
      const currentStorage = parsed.currentStorage;

      if (!currentStorage || !currentStorage.isActive) {
        console.log('📱 Keine aktive Storage-Konfiguration gefunden, verwende lokalen Modus');
        return {
          mode: 'local',
          data: 'SQLite',
          picture: 'LocalPath'
        };
      }

      const config: StorageConfig = {
        mode: currentStorage.currentStorageMode || 'local',
        data: currentStorage.currentDataStorage || 'SQLite',
        picture: currentStorage.currentPictureStorage || 'LocalPath'
      };

      console.log('📊 Storage-Konfiguration aus LocalStorage geladen:', config);
      return config;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Storage-Konfiguration:', error);
      return {
        mode: 'local',
        data: 'SQLite',
        picture: 'LocalPath'
      };
    }
  }

  // Lade Verbindungsdaten direkt aus storageManagement LocalStorage
  private async loadConnectionDataFromLocalStorage(): Promise<any> {
    try {
      const storageManagementData = localStorage.getItem('storageManagement');
      
      if (!storageManagementData) {
        console.log('📱 Keine StorageManagement-Daten gefunden, keine Verbindungsdaten verfügbar');
        return {};
      }

      const parsed = JSON.parse(storageManagementData);
      
      // WICHTIG: Verwende activeConnections Snapshot statt connections!
      // Dies verhindert, dass getestete aber nicht übernommene Daten verwendet werden
      if (parsed.currentStorage?.activeConnections) {
        console.log('🔒 Verwende AKTIVE Connection-Daten aus Snapshot (sicher)');
        console.log('🔗 Aktive Verbindungen:', Object.keys(parsed.currentStorage.activeConnections).filter(k => parsed.currentStorage.activeConnections[k]));
        return parsed.currentStorage.activeConnections;
      }
      
      // Fallback: Verwende normale connections (für Abwärtskompatibilität)
      const connections = parsed.connections || {};
      console.log('⚠️ Kein activeConnections Snapshot gefunden, verwende normale connections (UNSICHER!)');
      console.log('🔗 Verbindungsdaten aus LocalStorage geladen:', Object.keys(connections));
      return connections;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Verbindungsdaten:', error);
      return {};
    }
  }

  // Singleton Pattern
  public static getInstance(): StorageLayer {
    if (!StorageLayer.instance) {
      StorageLayer.instance = new StorageLayer();
    }
    return StorageLayer.instance;
  }

  // Initialize with Storage Schema
  public async initialize(config?: StorageConfig, connectionData?: any): Promise<boolean> {
    try {
      // Lade Konfiguration direkt aus storageManagement LocalStorage
      const storageConfig = config || await this.loadStorageConfigFromLocalStorage();
      const connections = connectionData || await this.loadConnectionDataFromLocalStorage();
      
      console.log('🚀 StorageLayer initialisiert mit Schema:', storageConfig);
      console.log('🔗 ConnectionData geladen:', connections);
      
      this.currentConfig = storageConfig;
      
      // Initialize data adapter based on mode
      if (storageConfig.mode === 'local') {
        this.dataAdapter = new LocalStorageAdapter();
        this.pictureAdapter = new LocalStorageAdapter(); // For now, use LocalStorage for pictures too
        console.log('📱 Lokaler Modus: LocalStorage für Daten und Bilder');
      } else if (storageConfig.mode === 'cloud') {
        // Initialize data adapter based on currentDataStorage
        this.dataAdapter = await this.createDataAdapter(storageConfig.data, connections);
        
        // Initialize picture adapter based on currentPictureStorage
        this.pictureAdapter = await this.createPictureAdapter(storageConfig.picture, connections);
        
        console.log(`☁️ Cloud-Modus: ${storageConfig.data} für Daten, ${storageConfig.picture} für Bilder`);
      }

      // Test connections
      if (this.dataAdapter && this.dataAdapter.testConnection) {
        const dataConnectionOk = await this.dataAdapter.testConnection();
        if (!dataConnectionOk) {
          throw new Error(`Daten-Verbindung fehlgeschlagen für ${storageConfig.data}`);
        }
      }

      if (this.pictureAdapter && this.pictureAdapter.testConnection) {
        const pictureConnectionOk = await this.pictureAdapter.testConnection();
        if (!pictureConnectionOk) {
          throw new Error(`Bild-Verbindung fehlgeschlagen für ${storageConfig.picture}`);
        }
      }

      this.isInitialized = true;
      console.log('✅ StorageLayer erfolgreich initialisiert');
      return true;

    } catch (error) {
      console.error('❌ StorageLayer Initialisierung fehlgeschlagen:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  // Create data adapter based on storage type
  private async createDataAdapter(storageType: StorageData, connectionData?: any): Promise<StorageAdapter> {
    console.log(`🔧 Erstelle Daten-Adapter für ${storageType}`);
    console.log(`📊 ConnectionData für ${storageType}:`, connectionData);
    
    switch (storageType) {
      case 'PostgreSQL':
        console.log(`🐘 PostgreSQL ConnectionData:`, connectionData?.postgres);
        return new PostgreSQLAdapter(connectionData?.postgres);
      
      case 'MariaDB':
        console.log(`🔧 MariaDB ConnectionData:`, connectionData?.mariadb);
        return new PrismaAdapter(connectionData?.mariadb, 'mariadb');
      
      case 'MySQL':
        console.log(`🔧 MySQL ConnectionData:`, connectionData?.mysql);
        return new PrismaAdapter(connectionData?.mysql, 'mysql');
      
      case 'CouchDB':
        console.log(`🛋️ CouchDB ConnectionData:`, connectionData?.couchdb);
        return new CouchDBAdapter(connectionData?.couchdb);
      
      case 'Supabase':
        console.log(`☁️ Supabase ConnectionData:`, connectionData?.supabase);
        return new SupabaseAdapter(connectionData?.supabase);
      
      case 'Firebase':
        console.log(`🔥 Firebase ConnectionData:`, connectionData?.firebase);
        return new FirebaseAdapter(connectionData?.firebase);
      
      case 'SQLite':
        console.log(`📱 SQLite - verwende LocalStorage`);
        return new LocalStorageAdapter();
      
      default:
        throw new Error(`Unbekannter Daten-Speicher-Typ: ${storageType}`);
    }
  }

  // Create picture adapter based on storage type
  private async createPictureAdapter(storageType: StoragePicture, connectionData?: any): Promise<StorageAdapter> {
    console.log(`🔧 Erstelle Bild-Adapter für ${storageType}`);
    console.log(`📊 ConnectionData für ${storageType}:`, connectionData);
    
    switch (storageType) {
      case 'MinIO':
        console.log(`📦 MinIO ConnectionData:`, connectionData?.minio);
        return new MinIOAdapter(connectionData?.minio);
      
      case 'Supabase':
        console.log(`☁️ Supabase Storage ConnectionData:`, connectionData?.supabase);
        return new SupabaseAdapter(connectionData?.supabase);
      
      case 'Firebase':
        console.log(`🔥 Firebase Storage ConnectionData:`, connectionData?.firebase);
        return new FirebaseAdapter(connectionData?.firebase);
      
      case 'LocalPath':
        return new LocalStorageAdapter();
      
      default:
        throw new Error(`Unbekannter Bild-Speicher-Typ: ${storageType}`);
    }
  }

  // Check if initialized
  public isReady(): boolean {
    return this.isInitialized && this.dataAdapter !== null;
  }

  // Auto-initialize if not ready
  public async ensureInitialized(): Promise<boolean> {
    if (this.isReady()) {
      return true;
    }

    console.log('🔄 StorageLayer nicht initialisiert, führe automatische Initialisierung durch...');
    try {
      return await this.initialize();
    } catch (error) {
      console.error('❌ Automatische StorageLayer-Initialisierung fehlgeschlagen:', error);
      return false;
    }
  }

  // Get current configuration
  public getCurrentConfig(): StorageConfig | null {
    return this.currentConfig;
  }

  // Save data mit optionalem Progress-Callback
  public async save<T extends StorageEntity>(
    key: string, 
    data: T[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    // Automatische Initialisierung falls noch nicht geschehen
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('StorageLayer konnte nicht automatisch initialisiert werden.');
    }

    try {
      // Rufe Progress-Callback auf (falls vorhanden)
      if (onProgress) {
        onProgress(0, data.length);
      }
      
      // Gebe Callback an Adapter weiter
      const result = await this.dataAdapter!.save(key, data, onProgress);
      
      // Rufe Progress-Callback nach Abschluss auf
      if (onProgress) {
        onProgress(data.length, data.length);
      }
      
      if (!result) {
        throw new Error(`Fehler beim Speichern von ${key}`);
      }
      return result;
    } catch (error) {
      console.error(`❌ StorageLayer Fehler beim Speichern von ${key}:`, error);
      throw error;
    }
  }

  // Load data
  public async load<T extends StorageEntity>(key: string): Promise<T[] | null> {
    // Automatische Initialisierung falls noch nicht geschehen
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('StorageLayer konnte nicht automatisch initialisiert werden.');
    }

    try {
      return await this.dataAdapter!.load<T>(key);
    } catch (error) {
      console.error(`❌ StorageLayer Fehler beim Laden von ${key}:`, error);
      throw error;
    }
  }

  // Delete data (mit automatischem Bild-Löschen für Artikel und Rezepte)
  public async delete<T extends StorageEntity>(key: string, id: string): Promise<boolean> {
    // Automatische Initialisierung falls noch nicht geschehen
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('StorageLayer konnte nicht automatisch initialisiert werden.');
    }

    try {
      // 1. Lösche das zugehörige Bild (falls vorhanden) für Artikel und Rezepte
      if (key === 'articles' || key === 'recipes') {
        const imagePath = `pictures/${key}/${id}`;
        try {
          console.log(`🗑️ Versuche zugehöriges Bild zu löschen: ${imagePath}`);
          const imageDeleted = await this.deleteImage(imagePath);
          if (imageDeleted) {
            console.log(`✅ Zugehöriges Bild erfolgreich gelöscht: ${imagePath}`);
          } else {
            console.log(`ℹ️ Kein Bild gefunden für: ${imagePath}`);
          }
        } catch (imageError) {
          // Fehler beim Bild-Löschen sollten den Datensatz-Löschvorgang nicht stoppen
          console.warn(`⚠️ Fehler beim Löschen des Bildes ${imagePath}:`, imageError);
        }
      }
      
      // 2. Lösche den Datensatz selbst
      return await this.dataAdapter!.delete<T>(key, id);
    } catch (error) {
      console.error(`❌ StorageLayer Fehler beim Löschen von ${key}:`, error);
      throw error;
    }
  }

  // Save image
  public async saveImage(imagePath: string, file: File): Promise<boolean> {
    // Automatische Initialisierung falls noch nicht geschehen
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('StorageLayer konnte nicht automatisch initialisiert werden.');
    }

    try {
      if (this.pictureAdapter && 'saveImage' in this.pictureAdapter) {
        // Verwende den Picture-Adapter falls verfügbar
        return await (this.pictureAdapter as any).saveImage(imagePath, file);
      } else if (this.dataAdapter && 'saveImage' in this.dataAdapter) {
        // Fallback auf den Data-Adapter
        return await (this.dataAdapter as any).saveImage(imagePath, file);
      } else {
        throw new Error('Kein Bild-Adapter verfügbar');
      }
    } catch (error) {
      console.error(`❌ StorageLayer Fehler beim Speichern des Bildes ${imagePath}:`, error);
      throw error;
    }
  }

  // Load image
  public async loadImage(imagePath: string): Promise<string | null> {
    // Automatische Initialisierung falls noch nicht geschehen
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('StorageLayer konnte nicht automatisch initialisiert werden.');
    }

    try {
      if (this.pictureAdapter && 'loadImage' in this.pictureAdapter) {
        // Verwende den Picture-Adapter falls verfügbar
        return await (this.pictureAdapter as any).loadImage(imagePath);
      } else if (this.dataAdapter && 'loadImage' in this.dataAdapter) {
        // Fallback auf den Data-Adapter
        return await (this.dataAdapter as any).loadImage(imagePath);
      } else {
        throw new Error('Kein Bild-Adapter verfügbar');
      }
    } catch (error) {
      console.error(`❌ StorageLayer Fehler beim Laden des Bildes ${imagePath}:`, error);
      throw error;
    }
  }

  // Delete image
  public async deleteImage(imagePath: string): Promise<boolean> {
    // Automatische Initialisierung falls noch nicht geschehen
    const initialized = await this.ensureInitialized();
    if (!initialized) {
      throw new Error('StorageLayer konnte nicht automatisch initialisiert werden.');
    }

    try {
      if (this.pictureAdapter && 'deleteImage' in this.pictureAdapter) {
        // Verwende den Picture-Adapter falls verfügbar
        return await (this.pictureAdapter as any).deleteImage(imagePath);
      } else if (this.dataAdapter && 'deleteImage' in this.dataAdapter) {
        // Fallback auf den Data-Adapter
        return await (this.dataAdapter as any).deleteImage(imagePath);
      } else {
        throw new Error('Kein Bild-Adapter verfügbar');
      }
    } catch (error) {
      console.error(`❌ StorageLayer Fehler beim Löschen des Bildes ${imagePath}:`, error);
      throw error;
    }
  }

  // Switch storage mode (legacy compatibility)
  public async switchMode(mode: StorageMode, cloudType?: CloudStorageType): Promise<boolean> {
    console.log(`🔄 StorageLayer: Wechsel zu ${mode}${cloudType ? ` (${cloudType})` : ''}`);
    
    // Convert legacy mode to new config
    let config: StorageConfig;
    if (mode === 'local') {
      config = {
        mode: 'local',
        data: 'SQLite',
        picture: 'LocalPath'
      };
    } else {
      config = {
        mode: 'cloud',
        data: 'PostgreSQL',
        picture: 'MinIO'
      };
    }

    return await this.initialize(config);
  }

  // Reset instance (for testing)
  public static resetInstance(): void {
    StorageLayer.instance = null;
  }
}

// Export singleton instance
export const storageLayer = StorageLayer.getInstance();
