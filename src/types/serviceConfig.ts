// Service-Konfiguration für Multi-Tenant-Architektur
export interface ServiceConfig {
  id: string;
  name: string;
  type: ServiceType;
  host: string;
  port: number;
  credentials: ServiceCredentials;
  isActive: boolean;
  isDockerManaged: boolean;
  dockerConfig?: DockerConfig;
  lastConnectionTest?: Date;
  connectionStatus: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceType = 'postgres' | 'mariadb' | 'minio' | 'redis';

export interface ServiceCredentials {
  username: string;
  password: string;
  database?: string;
  additionalParams?: Record<string, string>;
}

export interface DockerConfig {
  image: string;
  containerName: string;
  environment: Record<string, string>;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  networks: string[];
  restartPolicy: 'no' | 'always' | 'on-failure' | 'unless-stopped';
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol?: 'tcp' | 'udp';
}

export interface VolumeMapping {
  hostPath: string;
  containerPath: string;
  readOnly?: boolean;
}

export type ConnectionStatus = 'unknown' | 'connected' | 'disconnected' | 'error' | 'connecting';

// Tenant-Konfiguration
export interface TenantConfig {
  id: string;
  name: string;
  description?: string;
  services: ServiceConfig[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Verbindungs-Test-Ergebnisse
export interface ConnectionTestResult {
  serviceId: string;
  success: boolean;
  responseTime?: number;
  error?: string;
  timestamp: Date;
  // MinIO-spezifische Felder
  bucketExists?: boolean;
  canCreateBucket?: boolean;
  canUpload?: boolean;
  canDownload?: boolean;
}

// Docker-Container-Status
export interface ContainerStatus {
  containerId: string;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'exited';
  image: string;
  ports: string[];
  createdAt: string;
  state: {
    status: string;
    running: boolean;
    paused: boolean;
    restarting: boolean;
    oomKilled: boolean;
    dead: boolean;
    pid: number;
    exitCode: number;
    error: string;
    startedAt: string;
    finishedAt: string;
  };
}

// Service-Discovery
export interface ServiceDiscoveryResult {
  serviceType: ServiceType;
  discoveredServices: DiscoveredService[];
}

export interface DiscoveredService {
  host: string;
  port: number;
  isAccessible: boolean;
  responseTime?: number;
  metadata?: Record<string, any>;
}
