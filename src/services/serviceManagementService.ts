import { 
  ServiceConfig, 
  ServiceType, 
  TenantConfig, 
  ConnectionTestResult, 
  ContainerStatus,
  ServiceDiscoveryResult,
  DiscoveredService
} from '../types/serviceConfig';
import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

export class ServiceManagementService {
  private readonly STORAGE_KEY = 'chef_service_configs';
  private readonly TENANT_KEY = 'chef_tenant_configs';
  private readonly DOCKER_API_BASE = 'http://localhost:2375'; // Docker daemon API

  constructor() {
    this.initializeDefaultServices();
  }

  // ========================================
  // TENANT VERWALTUNG
  // ========================================

  /**
   * Erstellt einen neuen Tenant
   */
  async createTenant(name: string, description?: string): Promise<TenantConfig> {
    const tenant: TenantConfig = {
      id: this.generateId(),
      name,
      description,
      services: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tenants = this.getTenants();
    tenants.push(tenant);
    this.saveTenants(tenants);

    console.log(`✅ Tenant "${name}" erstellt:`, tenant.id);
    return tenant;
  }

  /**
   * Lädt alle Tenants
   */
  getTenants(): TenantConfig[] {
    try {
      const data = localStorage.getItem(this.TENANT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Fehler beim Laden der Tenants:', error);
      return [];
    }
  }

  /**
   * Speichert alle Tenants
   */
  private saveTenants(tenants: TenantConfig[]): void {
    try {
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenants));
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Tenants:', error);
    }
  }

  // ========================================
  // SERVICE VERWALTUNG
  // ========================================

  /**
   * Erstellt einen neuen Service
   */
  async createService(
    tenantId: string,
    name: string,
    type: ServiceType,
    host: string,
    port: number,
    credentials: any,
    isDockerManaged: boolean = false,
    dockerConfig?: any
  ): Promise<ServiceConfig> {
    const service: ServiceConfig = {
      id: this.generateId(),
      name,
      type,
      host,
      port,
      credentials,
      isActive: true,
      isDockerManaged,
      dockerConfig,
      connectionStatus: 'unknown',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tenants = this.getTenants();
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      throw new Error(`Tenant mit ID ${tenantId} nicht gefunden`);
    }

    tenant.services.push(service);
    tenant.updatedAt = new Date();
    this.saveTenants(tenants);

    console.log(`✅ Service "${name}" für Tenant "${tenant.name}" erstellt:`, service.id);
    return service;
  }

  /**
   * Lädt alle Services eines Tenants
   */
  getServices(tenantId: string): ServiceConfig[] {
    const tenants = this.getTenants();
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.services || [];
  }

  /**
   * Aktualisiert einen Service
   */
  async updateService(tenantId: string, serviceId: string, updates: Partial<ServiceConfig>): Promise<ServiceConfig> {
    const tenants = this.getTenants();
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      throw new Error(`Tenant mit ID ${tenantId} nicht gefunden`);
    }

    const serviceIndex = tenant.services.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) {
      throw new Error(`Service mit ID ${serviceId} nicht gefunden`);
    }

    tenant.services[serviceIndex] = {
      ...tenant.services[serviceIndex],
      ...updates,
      updatedAt: new Date()
    };
    tenant.updatedAt = new Date();
    this.saveTenants(tenants);

    console.log(`✅ Service "${tenant.services[serviceIndex].name}" aktualisiert`);
    return tenant.services[serviceIndex];
  }

  /**
   * Löscht einen Service
   */
  async deleteService(tenantId: string, serviceId: string): Promise<void> {
    const tenants = this.getTenants();
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      throw new Error(`Tenant mit ID ${tenantId} nicht gefunden`);
    }

    const serviceIndex = tenant.services.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) {
      throw new Error(`Service mit ID ${serviceId} nicht gefunden`);
    }

    const service = tenant.services[serviceIndex];
    
    // Wenn Docker-verwaltet, Container stoppen
    if (service.isDockerManaged && service.dockerConfig) {
      await this.stopDockerContainer(service.dockerConfig.containerName);
    }

    tenant.services.splice(serviceIndex, 1);
    tenant.updatedAt = new Date();
    this.saveTenants(tenants);

    console.log(`✅ Service "${service.name}" erstellt`);
  }

  // ========================================
  // VERBINDUNGS-TESTING
  // ========================================

  /**
   * Testet die Verbindung zu einem Service
   */
  async testConnection(service: ServiceConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      let success = false;
      
      let minioDetails: any = undefined;

      switch (service.type) {
        case 'postgres':
          success = await this.testPostgreSQLConnection(service);
          break;
        case 'mariadb':
          success = await this.testMariaDBConnection(service);
          break;
        case 'minio':
          const minioResult = await this.testMinIOConnection(service);
          success = minioResult.success;
          minioDetails = minioResult.details;
          break;
        default:
          throw new Error(`Unbekannter Service-Typ: ${service.type}`);
      }

      const responseTime = Date.now() - startTime;
      
      const result: ConnectionTestResult = {
        serviceId: service.id,
        success,
        responseTime,
        timestamp: new Date()
      };

      // Füge MinIO-spezifische Felder hinzu, wenn verfügbar
      if (minioDetails) {
        result.bucketExists = minioDetails.bucketExists;
        result.canCreateBucket = minioDetails.canCreateBucket;
        result.canUpload = minioDetails.canUpload;
        result.canDownload = minioDetails.canDownload;
      }

      // Status aktualisieren
      await this.updateService(
        this.getTenantIdByServiceId(service.id),
        service.id,
        {
          connectionStatus: success ? 'connected' : 'error',
          lastConnectionTest: new Date()
        }
      );

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const result: ConnectionTestResult = {
        serviceId: service.id,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date()
      };

      // Status aktualisieren
      await this.updateService(
        this.getTenantIdByServiceId(service.id),
        service.id,
        {
          connectionStatus: 'error',
          lastConnectionTest: new Date()
        }
      );

      return result;
    }
  }

  /**
   * Testet PostgreSQL-Verbindung
   */
  private async testPostgreSQLConnection(service: ServiceConfig): Promise<boolean> {
    // Hier würde die tatsächliche PostgreSQL-Verbindung implementiert
    // Für den Moment simulieren wir einen Test
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simuliere erfolgreiche Verbindung
        resolve(true);
      }, 100);
    });
  }

  /**
   * Testet MariaDB-Verbindung
   */
  private async testMariaDBConnection(service: ServiceConfig): Promise<boolean> {
    // Hier würde die tatsächliche MariaDB-Verbindung implementiert
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simuliere erfolgreiche Verbindung
        resolve(true);
      }, 100);
    });
  }

  /**
   * Testet MinIO-Verbindung (direkt mit S3Client ohne Backend)
   */
  private async testMinIOConnection(service: ServiceConfig): Promise<{ success: boolean; details?: any }> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Teste MinIO-Verbindung...', {
        host: service.host,
        port: service.port,
        bucket: service.credentials.database || 'test-bucket'
      });

      // S3Client direkt initialisieren (wie im MinIOAdapter)
      const s3Client = new S3Client({
        endpoint: `http://${service.host}:${service.port}`,
        region: 'us-east-1', // MinIO Standard
        credentials: {
          accessKeyId: service.credentials.username || '',
          secretAccessKey: service.credentials.password || ''
        },
        forcePathStyle: true, // MinIO erfordert path-style URLs
      });

      // Teste Verbindung mit ListBuckets
      const listBucketsCommand = new ListBucketsCommand({});
      const listBucketsResponse = await s3Client.send(listBucketsCommand);
      
      const responseTime = Date.now() - startTime;
      const bucketName = service.credentials.database || 'test-bucket';
      
      // Prüfe ob spezifischer Bucket existiert
      let bucketExists = false;
      if (listBucketsResponse.Buckets) {
        bucketExists = listBucketsResponse.Buckets.some(b => b.Name === bucketName);
      }
      
      console.log('✅ MinIO-Verbindung erfolgreich:', {
        responseTime: `${responseTime}ms`,
        bucketsFound: listBucketsResponse.Buckets?.length || 0,
        bucketExists
      });
      
      return { 
        success: true, 
        details: {
          responseTime: `${responseTime}ms`,
          bucketsFound: listBucketsResponse.Buckets?.length || 0,
          bucketExists
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ MinIO-Verbindung fehlgeschlagen:', error);
      return { 
        success: false,
        details: {
          responseTime: `${responseTime}ms`,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        }
      };
    }
  }

  // ========================================
  // DOCKER INTEGRATION
  // ========================================

  /**
   * Startet einen Docker-Container für einen Service
   */
  async startDockerContainer(service: ServiceConfig): Promise<boolean> {
    if (!service.isDockerManaged || !service.dockerConfig) {
      throw new Error('Service ist nicht Docker-verwaltet');
    }

    try {
      // Hier würde die tatsächliche Docker-API-Integration implementiert
      // Für den Moment simulieren wir den Start
      console.log(`🐳 Starte Docker-Container für Service: ${service.name}`);
      
      // Simuliere Container-Start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`✅ Docker-Container für Service "${service.name}" gestartet`);
      return true;
    } catch (error) {
      console.error(`❌ Fehler beim Starten des Docker-Containers:`, error);
      return false;
    }
  }

  /**
   * Stoppt einen Docker-Container
   */
  async stopDockerContainer(containerName: string): Promise<boolean> {
    try {
      // Hier würde die tatsächliche Docker-API-Integration implementiert
      console.log(`🛑 Stoppe Docker-Container: ${containerName}`);
      
      // Simuliere Container-Stopp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ Docker-Container "${containerName}" gestoppt`);
      return true;
    } catch (error) {
      console.error(`❌ Fehler beim Stoppen des Docker-Containers:`, error);
      return false;
    }
  }

  /**
   * Lädt den Status aller Docker-Container
   */
  async getDockerContainerStatus(): Promise<ContainerStatus[]> {
    try {
      // Hier würde die tatsächliche Docker-API-Integration implementiert
      // Für den Moment simulieren wir Container-Status
      return [];
    } catch (error) {
      console.error('❌ Fehler beim Laden der Docker-Container-Status:', error);
      return [];
    }
  }

  // ========================================
  // SERVICE DISCOVERY
  // ========================================

  /**
   * Entdeckt verfügbare Services im Netzwerk
   */
  async discoverServices(serviceType: ServiceType, networkRange: string = '192.168.1.0/24'): Promise<ServiceDiscoveryResult> {
    try {
      console.log(`🔍 Starte Service-Discovery für ${serviceType} im Netzwerk ${networkRange}`);
      
      // Hier würde die tatsächliche Netzwerk-Scanning-Implementierung stehen
      // Für den Moment simulieren wir die Entdeckung
      const discoveredServices: DiscoveredService[] = [];
      
      // Simuliere gefundene Services
      if (serviceType === 'postgres' || serviceType === 'mariadb') {
        discoveredServices.push({
          host: '192.168.1.100',
          port: serviceType === 'postgres' ? 5432 : 3306,
          isAccessible: true,
          responseTime: 15,
          metadata: { version: 'latest' }
        });
      }
      
      if (serviceType === 'minio') {
        discoveredServices.push({
          host: '192.168.1.101',
          port: 9000,
          isAccessible: true,
          responseTime: 8,
          metadata: { version: 'latest' }
        });
      }

      const result: ServiceDiscoveryResult = {
        serviceType,
        discoveredServices
      };

      console.log(`✅ Service-Discovery abgeschlossen: ${discoveredServices.length} Services gefunden`);
      return result;
    } catch (error) {
      console.error('❌ Fehler bei der Service-Discovery:', error);
      return {
        serviceType,
        discoveredServices: []
      };
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Generiert eine eindeutige ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Findet die Tenant-ID für eine Service-ID
   */
  private getTenantIdByServiceId(serviceId: string): string {
    const tenants = this.getTenants();
    for (const tenant of tenants) {
      if (tenant.services.some(s => s.id === serviceId)) {
        return tenant.id;
      }
    }
    throw new Error(`Kein Tenant für Service-ID ${serviceId} nicht gefunden`);
  }

  /**
   * Initialisiert Standard-Services
   */
  private initializeDefaultServices(): void {
    const tenants = this.getTenants();
    if (tenants.length === 0) {
      // Erstelle Standard-Tenant
      this.createTenant('Standard', 'Standard-Tenant für The Chef\'s Numbers')
        .then(tenant => {
          console.log('✅ Standard-Tenant erstellt:', tenant.id);
        })
        .catch(error => {
          console.error('❌ Fehler beim Erstellen des Standard-Tenants:', error);
        });
    }
  }
}

// Singleton-Instanz exportieren
export const serviceManagementService = new ServiceManagementService();
