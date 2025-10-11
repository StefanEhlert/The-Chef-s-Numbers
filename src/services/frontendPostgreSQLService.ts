import { logger } from '../utils/logger';

/**
 * Frontend-PostgreSQL-Service
 * Adaptiert die Backend-Logik für Frontend-Verwendung
 * Simuliert PostgreSQL-Operationen basierend auf Port-Erreichbarkeit
 */

export interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export interface DatabaseCheckResult {
  exists: boolean;
  message: string;
  tables?: string[];
  size?: string;
  lastModified?: string;
}

export interface DatabaseCreationResult {
  success: boolean;
  message: string;
  database?: string;
  created?: string;
}

export interface StructureCheckResult {
  hasStructure: boolean;
  tables: string[];
  message: string;
  columns?: { [tableName: string]: string[] };
  indexes?: { [tableName: string]: string[] };
}

export interface StructureCreationResult {
  success: boolean;
  message: string;
  tablesCreated: string[];
}

/**
 * Frontend-PostgreSQL-Service
 * Verwendet echte PostgreSQL-Operationen über Mini-Proxy
 */
export class FrontendPostgreSQLService {
  private static readonly PROXY_URL = 'http://localhost:3002'; // Mini-Proxy Port
  private static readonly TIMEOUT = 10000; // 10 Sekunden Timeout

  /**
   * Testet PostgreSQL-Verbindung (echt)
   * Verwendet Mini-Proxy für echte PostgreSQL-Operationen
   */
  static async testConnection(config: PostgreSQLConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      logger.info('POSTGRES-FRONTEND', `🔍 Teste PostgreSQL-Verbindung zu ${config.host}:${config.port}`);
      
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Ungültige Konfiguration: Alle Felder müssen ausgefüllt sein',
          duration: Date.now() - startTime
        };
      }

      // Echter PostgreSQL-Verbindungstest über Mini-Proxy
      const response = await fetch(`${this.PROXY_URL}/api/postgres/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        logger.info('POSTGRES-FRONTEND', `✅ PostgreSQL-Verbindung erfolgreich (${duration}ms)`);
        return {
          success: true,
          message: `PostgreSQL-Verbindung erfolgreich zu ${config.host}:${config.port}`,
          details: result,
          duration
        };
      } else {
        const errorData = await response.json();
        logger.warn('POSTGRES-FRONTEND', `⚠️ PostgreSQL-Verbindung fehlgeschlagen: ${errorData.message}`);
        return {
          success: false,
          message: errorData.message || `Verbindung fehlgeschlagen: ${response.status}`,
          duration
        };
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        logger.error('POSTGRES-FRONTEND', `❌ Mini-Proxy nicht erreichbar: ${this.PROXY_URL}`);
        return {
          success: false,
          message: `Mini-Proxy nicht erreichbar. Bitte starten Sie den PostgreSQL-Mini-Proxy.`,
          duration
        };
      }
      
      logger.error('POSTGRES-FRONTEND', `❌ PostgreSQL-Verbindungstest fehlgeschlagen:`, error as Error);
      return {
        success: false,
        message: `Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        duration
      };
    }
  }

  /**
   * Prüft ob PostgreSQL-Datenbank existiert (echt)
   */
  static async checkDatabaseExists(config: PostgreSQLConfig): Promise<DatabaseCheckResult> {
    const startTime = Date.now();
    
    try {
      logger.info('POSTGRES-FRONTEND', `🔍 Prüfe PostgreSQL-Datenbankexistenz: ${config.database}`);
      
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          exists: false,
          message: 'Ungültige Konfiguration'
        };
      }

      // Echte Datenbankprüfung über Mini-Proxy
      const response = await fetch(`${this.PROXY_URL}/api/postgres/check-db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        logger.info('POSTGRES-FRONTEND', `✅ Datenbankprüfung erfolgreich (${duration}ms)`);
        return {
          exists: result.exists,
          message: result.exists ? `Datenbank '${config.database}' existiert` : `Datenbank '${config.database}' existiert nicht`,
          tables: result.tables,
          size: result.size,
          lastModified: result.lastModified
        };
      } else {
        const errorData = await response.json();
        logger.warn('POSTGRES-FRONTEND', `⚠️ Datenbankprüfung fehlgeschlagen: ${errorData.message}`);
        return {
          exists: false,
          message: errorData.message || `Datenbankprüfung fehlgeschlagen: ${response.status}`,
          tables: [],
          size: '0 MB'
        };
      }
      
    } catch (error) {
      logger.error('POSTGRES-FRONTEND', `❌ Datenbankprüfung fehlgeschlagen:`, error as Error);
      return {
        exists: false,
        message: `Fehler bei der Datenbankprüfung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        tables: [],
        size: '0 MB'
      };
    }
  }

  /**
   * Erstellt PostgreSQL-Datenbank (echt)
   */
  static async createDatabase(config: PostgreSQLConfig): Promise<DatabaseCreationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('POSTGRES-FRONTEND', `🔍 Erstelle PostgreSQL-Datenbank: ${config.database}`);
      
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Ungültige Konfiguration'
        };
      }

      // Echte Datenbankerstellung über Mini-Proxy
      const response = await fetch(`${this.PROXY_URL}/api/postgres/create-db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        logger.info('POSTGRES-FRONTEND', `✅ Datenbankerstellung erfolgreich (${duration}ms)`);
        return {
          success: true,
          message: result.message,
          database: result.database,
          created: result.created
        };
      } else {
        const errorData = await response.json();
        logger.warn('POSTGRES-FRONTEND', `⚠️ Datenbankerstellung fehlgeschlagen: ${errorData.message}`);
        return {
          success: false,
          message: errorData.message || `Datenbankerstellung fehlgeschlagen: ${response.status}`
        };
      }
      
    } catch (error) {
      logger.error('POSTGRES-FRONTEND', `❌ Datenbankerstellung fehlgeschlagen:`, error as Error);
      return {
        success: false,
        message: `Fehler bei der Datenbankerstellung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  }

  /**
   * Prüft PostgreSQL-Datenbankstruktur (echt)
   */
  static async checkStructure(config: PostgreSQLConfig): Promise<StructureCheckResult> {
    const startTime = Date.now();
    
    try {
      logger.info('POSTGRES-FRONTEND', `🔍 Prüfe PostgreSQL-Datenbankstruktur: ${config.database}`);
      
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          hasStructure: false,
          tables: [],
          message: 'Ungültige Konfiguration'
        };
      }

      // Echte Strukturprüfung über Mini-Proxy
      const response = await fetch(`${this.PROXY_URL}/api/postgres/check-structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        logger.info('POSTGRES-FRONTEND', `✅ Strukturprüfung erfolgreich (${duration}ms)`);
        return {
          hasStructure: result.hasStructure,
          tables: result.tables,
          message: result.hasStructure ? `Chef's Numbers Datenbankstruktur gefunden (${result.tableCount} Tabellen)` : 'Keine Chef\'s Numbers Datenbankstruktur gefunden',
          columns: result.columns,
          indexes: result.indexes
        };
      } else {
        const errorData = await response.json();
        logger.warn('POSTGRES-FRONTEND', `⚠️ Strukturprüfung fehlgeschlagen: ${errorData.message}`);
        return {
          hasStructure: false,
          tables: [],
          message: errorData.message || `Strukturprüfung fehlgeschlagen: ${response.status}`,
          columns: {},
          indexes: {}
        };
      }
      
    } catch (error) {
      logger.error('POSTGRES-FRONTEND', `❌ Strukturprüfung fehlgeschlagen:`, error as Error);
      return {
        hasStructure: false,
        tables: [],
        message: `Fehler bei der Strukturprüfung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        columns: {},
        indexes: {}
      };
    }
  }

  /**
   * Erstellt PostgreSQL-Datenbankstruktur (echt)
   */
  static async createStructure(config: PostgreSQLConfig): Promise<StructureCreationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('POSTGRES-FRONTEND', `🔍 Erstelle PostgreSQL-Datenbankstruktur: ${config.database}`);
      
      // Validiere Konfiguration
      if (!this.validateConfig(config)) {
        return {
          success: false,
          message: 'Ungültige Konfiguration',
          tablesCreated: []
        };
      }

      // Echte Strukturerstellung über Mini-Proxy
      const response = await fetch(`${this.PROXY_URL}/api/postgres/create-structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        logger.info('POSTGRES-FRONTEND', `✅ Strukturerstellung erfolgreich (${duration}ms)`);
        return {
          success: true,
          message: result.message,
          tablesCreated: result.tables
        };
      } else {
        const errorData = await response.json();
        logger.warn('POSTGRES-FRONTEND', `⚠️ Strukturerstellung fehlgeschlagen: ${errorData.message}`);
        return {
          success: false,
          message: errorData.message || `Strukturerstellung fehlgeschlagen: ${response.status}`,
          tablesCreated: []
        };
      }
      
    } catch (error) {
      logger.error('POSTGRES-FRONTEND', `❌ Strukturerstellung fehlgeschlagen:`, error as Error);
      return {
        success: false,
        message: `Fehler bei der Strukturerstellung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        tablesCreated: []
      };
    }
  }


  /**
   * Validiert PostgreSQL-Konfiguration
   * (Adaptiert aus Backend postgresService)
   */
  private static validateConfig(config: PostgreSQLConfig): boolean {
    return !!(
      config.host &&
      config.port &&
      config.database &&
      config.username &&
      config.password &&
      config.port >= 1 &&
      config.port <= 65535
    );
  }
}
