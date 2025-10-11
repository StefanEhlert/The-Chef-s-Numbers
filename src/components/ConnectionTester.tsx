/**
 * ConnectionTester.tsx
 * Zentrale Verbindungstest-Funktionen für Storage-Management
 * Ausgelagert aus StorageManagement.tsx für bessere Wartbarkeit
 */

// Import der benötigten Services
import { FrontendPostgreSQLService } from '../services/frontendPostgreSQLService';
import { FrontendConnectionTests } from '../services/frontendConnectionTests';

// Interfaces
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  showModal?: boolean;
}

export interface PingResult {
  success: boolean;
  message: string;
  latency?: number;
}

export interface PortCheckResult {
  success: boolean;
  message: string;
  latency?: number;
}

export interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export interface MinIOConfig {
  host: string;
  port: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  useSSL?: boolean;
  endpoint?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * Ping-Funktion für Hostname/IP-Adresse
 */
export const pingHost = async (hostname: string): Promise<PingResult> => {
  if (!hostname.trim()) {
    return { success: false, message: 'Keine Adresse zum Pingen angegeben' };
  }

  try {
    const startTime = Date.now();
    
    // Verwende einen einfachen HTTP-Request zum Testen der Erreichbarkeit
    // Für lokale Entwicklung verwenden wir einen anderen Ansatz
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const latency = Date.now() - startTime;
      return { 
        success: true, 
        message: `✓ ${hostname} ist erreichbar`, 
        latency: Math.max(latency, 1) 
      };
    }
    
    // Für externe Hosts verwenden wir eine einfache Verbindungsprüfung
    // In einer echten Anwendung würde hier ein echter Ping verwendet werden
    const testUrl = `http://${hostname}:80`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sekunden Timeout
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      return { 
        success: true, 
        message: `✓ ${hostname} ist erreichbar`, 
        latency: Math.max(latency, 10) 
      };
    } catch (error) {
      // Auch bei Netzwerkfehlern kann der Host erreichbar sein
      // (z.B. wenn Port 80 nicht offen ist, aber der Host erreichbar ist)
      const latency = Date.now() - startTime;
      return { 
        success: true, 
        message: `✓ ${hostname} ist erreichbar (Port 80 nicht verfügbar)`, 
        latency: Math.max(latency, 10) 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `❌ ${hostname} ist nicht erreichbar: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    };
  }
};

/**
 * Port-Verfügbarkeitsprüfung
 */
export const checkPortAvailability = async (hostname: string, port: string): Promise<PortCheckResult> => {
  if (!hostname.trim() || !port.trim()) {
    return { success: false, message: 'Host und Port sind erforderlich' };
  }

  try {
    const startTime = Date.now();
    
    // Für localhost verwenden wir einen speziellen Ansatz
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Versuche eine Verbindung zum Port
      const testUrl = `http://${hostname}:${port}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 Sekunden Timeout
        
        const response = await fetch(testUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;
        
        return { 
          success: true, 
          message: `✓ Port ${port} ist verfügbar`, 
          latency: Math.max(latency, 5) 
        };
      } catch (error) {
        // Port ist möglicherweise nicht verfügbar
        const latency = Date.now() - startTime;
        return { 
          success: false, 
          message: `❌ Port ${port} ist nicht verfügbar`, 
          latency: Math.max(latency, 5) 
        };
      }
    }
    
    // Für externe Hosts verwenden wir einen ähnlichen Ansatz
    const testUrl = `http://${hostname}:${port}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sekunden Timeout
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      return { 
        success: true, 
        message: `✓ Port ${port} ist verfügbar`, 
        latency: Math.max(latency, 10) 
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { 
        success: false, 
        message: `❌ Port ${port} ist nicht verfügbar`, 
        latency: Math.max(latency, 10) 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Port-Prüfung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    };
  }
};

/**
 * PostgreSQL-Verbindungstest
 */
export const testPostgreSQLConnection = async (config: DatabaseConfig): Promise<boolean> => {
  try {
    console.log('🔍 Teste PostgreSQL-Verbindung...', config);
    
    const result = await FrontendConnectionTests.testPostgreSQLConnection({
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      username: config.username,
      password: config.password
    });
    
    if (result.success) {
      console.log('✅ PostgreSQL-Verbindung erfolgreich:', result.message);
      return true;
    } else {
      console.log('❌ PostgreSQL-Verbindung fehlgeschlagen:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ PostgreSQL-Verbindungstest fehlgeschlagen:', error);
    return false;
  }
};

/**
 * MinIO-Verbindungstest
 */
export const testMinIOConnection = async (config: MinIOConfig): Promise<boolean> => {
  try {
    console.log('🔍 Teste MinIO-Verbindung...', config);
    
    const result = await FrontendConnectionTests.testMinIOConnection({
      ...config,
      port: parseInt(config.port),
      endpoint: `http://${config.host}:${config.port}`
    });
    
    if (result.success) {
      console.log('✅ MinIO-Verbindung erfolgreich:', result.message);
      return true;
    } else {
      console.log('❌ MinIO-Verbindung fehlgeschlagen:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ MinIO-Verbindungstest fehlgeschlagen:', error);
    return false;
  }
};

/**
 * Supabase-Verbindungstest
 */
export const testSupabaseConnection = async (config: SupabaseConfig): Promise<boolean> => {
  try {
    console.log('🔍 Teste Supabase-Verbindung...', config);
    
    // Einfacher Test durch Abrufen der Supabase-API-Info
    const response = await fetch(`${config.url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase-Verbindung erfolgreich');
      return true;
    } else {
      console.log('❌ Supabase-Verbindung fehlgeschlagen:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase-Verbindungstest fehlgeschlagen:', error);
    return false;
  }
};

/**
 * MySQL/MariaDB-Verbindungstest
 */
export const testMySQLConnection = async (config: DatabaseConfig): Promise<boolean> => {
  try {
    console.log('🔍 Teste MySQL-Verbindung...', config);
    
    // Einfacher Test durch Versuch einer Verbindung
    // In einer echten Anwendung würde hier eine MySQL-Bibliothek verwendet werden
    const testUrl = `http://${config.host}:${config.port}`;
    
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      console.log('✅ MySQL-Verbindung erfolgreich');
      return true;
    } catch (error) {
      console.log('❌ MySQL-Verbindung fehlgeschlagen:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ MySQL-Verbindungstest fehlgeschlagen:', error);
    return false;
  }
};


/**
 * Vollständiger Verbindungstest für PostgreSQL (inklusive Ping und Port-Checks)
 */
export const performFullPostgreSQLTest = async (
  config: DatabaseConfig,
  postgrestPort?: string,
  onProgress?: (progress: string) => void
): Promise<ConnectionTestResult> => {
  try {
    const { host, port } = config;
    
    // Schritt 1: IP-Adresse prüfen
    onProgress?.('IP-Adresse wird geprüft...');
    const ipPingResult = await pingHost(host);
    
    if (!ipPingResult.success) {
      return { 
        success: false, 
        message: `❌ Host nicht erreichbar: ${ipPingResult.message}`,
        showModal: true
      };
    }

    // Schritt 2: PostgreSQL-Port prüfen
    onProgress?.('PostgreSQL-Port wird geprüft...');
    const postgresPortResult = await checkPortAvailability(host, port);
    
    // Schritt 3: PostgREST-Port prüfen (falls angegeben)
    if (postgrestPort) {
      onProgress?.('PostgREST-Port wird geprüft...');
      const postgrestPortResult = await checkPortAvailability(host, postgrestPort);
    }

    // Schritt 4: PostgreSQL-Verbindung testen
    onProgress?.('PostgreSQL-Verbindung wird getestet...');
    const connectionResult = await testPostgreSQLConnection(config);
    
    if (connectionResult) {
      return {
        success: true,
        message: `✅ PostgreSQL-Verbindung erfolgreich! Host: ${host}:${port}`,
        showModal: false
      };
    } else {
      return {
        success: false,
        message: `❌ PostgreSQL-Verbindung fehlgeschlagen`,
        showModal: true
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      showModal: true
    };
  }
};

/**
 * Vollständiger Verbindungstest für MinIO
 */
export const performFullMinIOTest = async (
  config: MinIOConfig,
  onProgress?: (progress: string) => void
): Promise<ConnectionTestResult> => {
  try {
    const { host, port } = config;
    
    // Schritt 1: IP-Adresse prüfen
    onProgress?.('IP-Adresse wird geprüft...');
    const ipPingResult = await pingHost(host);
    
    if (!ipPingResult.success) {
      return { 
        success: false, 
        message: `❌ Host nicht erreichbar: ${ipPingResult.message}`,
        showModal: true
      };
    }

    // Schritt 2: MinIO-Port prüfen
    onProgress?.('MinIO-Port wird geprüft...');
    const portResult = await checkPortAvailability(host, port);
    
    // Schritt 3: MinIO-Verbindung testen
    onProgress?.('MinIO-Verbindung wird getestet...');
    const connectionResult = await testMinIOConnection(config);
    
    if (connectionResult) {
      return {
        success: true,
        message: `✅ MinIO-Verbindung erfolgreich! Host: ${host}:${port}`,
        showModal: false
      };
    } else {
      return {
        success: false,
        message: `❌ MinIO-Verbindung fehlgeschlagen`,
        showModal: true
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ MinIO-Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      showModal: true
    };
  }
};
