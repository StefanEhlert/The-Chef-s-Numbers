// Docker-Compose Generator Service
// Generiert Docker-Compose-Dateien basierend auf der Docker-Konfiguration

export interface DockerComposeConfig {
  postgres: {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
  };
  postgrest: {
    port: string;
  };
  mariadb: {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    prismaPort: string;
  };
  mysql: {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    prismaPort: string;
  };
  prisma: {
    port: string; // Legacy - wird für Rückwärtskompatibilität beibehalten
  };
  minio: {
    host: string;
    port: string;
    consolePort: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    useSSL: boolean;
  };
  frontend: {
    host: string;
    port: string;
  };
}

export interface GeneratedDockerCompose {
  content: string;
  filename: string;
  services: string[];
  ports: { [service: string]: string };
}

// Template-Engine für Docker Compose
export interface TemplateFunction {
  name: string;
  execute: (config: DockerComposeConfig) => string;
}

export interface TemplateConfig {
  key: string;
  value: string;
}

// Template-Engine für Docker Compose
export const templateEngine = {
  // Verfügbare Template-Funktionen
  functions: {
    generateJWTSecret: (config: DockerComposeConfig): string => {
      // Generiert JWT-Secret aus PostgreSQL-Passwort (SHA256-Hash)
      // Das gleiche Verfahren wie im Frontend für Konsistenz
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(config.postgres.password).digest('hex').toLowerCase();
      console.log('🔑 JWT-Secret generiert aus PostgreSQL-Passwort:', hash);
      return hash;
    },
    
    getMinIOConsoleURL: (config: DockerComposeConfig): string => {
      // Generiert die MinIO Console URL
      const protocol = config.minio.useSSL ? 'https' : 'http';
      return `${protocol}://${config.minio.host}:${config.minio.consolePort}`;
    },
    
    addPort: (basePort: string, offset: number): string => {
      // Fügt einen Offset zu einem Port hinzu
      const port = parseInt(basePort);
      return (port + offset).toString();
    },
    
    getCurrentTimestamp: (): string => {
      // Gibt den aktuellen Zeitstempel zurück
      return new Date().toISOString();
    },
    
    getFrontendUrl: (config: DockerComposeConfig): string => {
      // Generiert die Frontend-URL für Init-Script-Downloads
      return dockerComposeGenerator.getFrontendUrl(config);
    }
  },

  // Verarbeitet ein Template und ersetzt Platzhalter
  processTemplate(template: string, config: DockerComposeConfig): string {
    let processedTemplate = template;

    // Ersetze CONFIG-Platzhalter
    processedTemplate = processedTemplate.replace(/\{\{CONFIG:([^}]+)\}\}/g, (match, key) => {
      const keys = key.split('.');
      let value: any = config;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Template-Key nicht gefunden: ${key}`);
          return match; // Behalte den ursprünglichen Platzhalter
        }
      }
      
      return String(value);
    });

    // Ersetze FUNCTION-Platzhalter
    processedTemplate = processedTemplate.replace(/\{\{FUNCTION:([^}]+)\}\}/g, (match, functionName) => {
      if (functionName in this.functions) {
        const func = this.functions[functionName as keyof typeof this.functions];
        // Prüfe ob die Funktion Parameter benötigt
        if (functionName === 'getCurrentTimestamp') {
          return (func as () => string)();
        } else {
          return (func as (config: DockerComposeConfig) => string)(config);
        }
      } else {
        console.warn(`Template-Funktion nicht gefunden: ${functionName}`);
        return match; // Behalte den ursprünglichen Platzhalter
      }
    });

    // Ersetze DEFAULT-Platzhalter (für Fallback-Werte)
    processedTemplate = processedTemplate.replace(/\{\{DEFAULT:([^}]+)\}\}/g, (match, defaultValue) => {
      return defaultValue;
    });

    return processedTemplate;
  },

  // Lädt ein Template aus einer Datei
  async loadTemplate(templateName: string): Promise<string> {
    // Im Browser können wir nicht direkt auf das Dateisystem zugreifen
    // Daher verwenden wir die hardcodierten Templates, die mit der Template-Datei synchronisiert sind
    console.log(`🔄 Lade Template für: ${templateName} (hardcodiert, synchronisiert mit docker-compose-template-${templateName}.yml)`);
    
    switch (templateName) {
      case 'postgresql':
        return `version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: chef-numbers-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: {{CONFIG:postgres.database}}
      POSTGRES_USER: {{CONFIG:postgres.username}}
      POSTGRES_PASSWORD: {{CONFIG:postgres.password}}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
      POSTGRES_HOST_AUTH_METHOD: "md5"
    ports:
      - "{{CONFIG:postgres.port}}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: |
      sh -c "
        # Starte PostgreSQL im Hintergrund
        docker-entrypoint.sh postgres &
        POSTGRES_PID=\$!
        
        # Warte bis PostgreSQL bereit ist
        until pg_isready -U {{CONFIG:postgres.username}} -d postgres; do
          echo 'Warte auf PostgreSQL...'
          sleep 2
        done
        
        # Lade Init-Script von der App herunter
        echo 'Lade Init-Script von der App...'
        wget -O /docker-entrypoint-initdb.d/init-chef-numbers-postgresql.sql {{FUNCTION:getFrontendUrl}}/init-scripts/init-chef-numbers-postgresql.sql
        
        # Führe Init-Script aus
        echo 'Führe Init-Script aus...'
        psql -U {{CONFIG:postgres.username}} -d postgres -f /docker-entrypoint-initdb.d/init-chef-numbers-postgresql.sql
        
        # Warte auf PostgreSQL-Prozess
        wait \$POSTGRES_PID
      "
    networks:
      - chef-numbers-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U {{CONFIG:postgres.username}} -d {{CONFIG:postgres.database}} || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 60s

  # PostgREST API
  postgrest:
    image: postgrest/postgrest:v12.2.0
    container_name: chef-numbers-postgrest
    restart: unless-stopped
    environment:
      # Einfache und robuste Datenbankverbindung
      PGRST_DB_URI: postgres://{{CONFIG:postgres.username}}:{{CONFIG:postgres.password}}@postgres:5432/{{CONFIG:postgres.database}}
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: {{CONFIG:postgres.username}}
      PGRST_DB_USE_LEGACY_GUCS: "false"
      PGRST_JWT_SECRET: {{FUNCTION:generateJWTSecret}}
      PGRST_CORS_ALLOWED_ORIGINS: "*"
      PGRST_CORS_ALLOWED_METHODS: "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      PGRST_CORS_ALLOWED_HEADERS: "Content-Type, Authorization, X-Requested-With"
      PGRST_CORS_EXPOSED_HEADERS: "Content-Range, Content-Location"
      PGRST_CORS_ALLOW_CREDENTIALS: "true"
      PGRST_CORS_MAX_AGE: "3600"
      # Deaktiviere Kerberos für einfache Authentifizierung
      PGRST_DB_EXTRA_SEARCH_PATH: "public"
    ports:
      - "{{CONFIG:postgrest.port}}:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - chef-numbers-network
    # Health-Check deaktiviert - PostgREST zeigt immer "unhealthy" an
    # healthcheck:
    #   test: ["CMD-SHELL", "curl -f http://localhost:3000/rpc/api_check_schema_status || exit 1"]
    #   interval: 30s
    #   timeout: 10s
    #   retries: 5
    #   start_period: 40s

volumes:
  postgres_data:
    driver: local

networks:
  chef-numbers-network:
    driver: bridge
    name: chef-numbers-network`;

      case 'minio':
        return `version: '3.8'

services:
  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: chef-numbers-minio
    restart: unless-stopped
    ports:
      - "{{CONFIG:minio.port}}:9000"
      - "{{CONFIG:minio.consolePort}}:9001"
    environment:
      MINIO_ROOT_USER: {{CONFIG:minio.accessKey}}
      MINIO_ROOT_PASSWORD: {{CONFIG:minio.secretKey}}
      # MinIO Parity-Konfiguration für Single-Disk-Setup
      MINIO_STORAGE_CLASS_STANDARD: "EC:0"  # 0 Paritätsblöcke für Single-Disk
      MINIO_STORAGE_CLASS_RRS: "EC:0"       # 0 Paritätsblöcke für Single-Disk
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - chef-numbers-network

  # MinIO Bucket Initialization
  minio-init:
    image: minio/mc:latest
    container_name: chef-numbers-minio-init
    depends_on:
      - minio
    environment:
      MINIO_ROOT_USER: {{CONFIG:minio.accessKey}}
      MINIO_ROOT_PASSWORD: {{CONFIG:minio.secretKey}}
    entrypoint: >
      /bin/sh -c "
      echo '🪣 Warte auf MinIO-Server...';
      sleep 10;
      echo '🔧 Konfiguriere MinIO-Client...';
      mc alias set minio http://minio:9000 {{CONFIG:minio.accessKey}} {{CONFIG:minio.secretKey}};
      echo '📦 Erstelle Bucket: {{CONFIG:minio.bucket}}';
      mc mb minio/{{CONFIG:minio.bucket}} --ignore-existing;
      echo '✅ Bucket erfolgreich erstellt!';
      mc ls minio/;
      echo '🎉 MinIO-Initialisierung abgeschlossen!';
      echo '🗑️ Container wird automatisch entfernt...';
      "
    networks:
      - chef-numbers-network
    restart: "no"

volumes:
  minio_data:
    driver: local

networks:
  chef-numbers-network:
    driver: bridge
    name: chef-numbers-network`;

      case 'mariadb':
        return `version: '3.8'

services:
  # MariaDB Database
  mariadb:
    image: mariadb:10.11
    container_name: chef-numbers-mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: {{CONFIG:mariadb.password}}
      MYSQL_DATABASE: {{CONFIG:mariadb.database}}
      MYSQL_USER: {{CONFIG:mariadb.username}}
      MYSQL_PASSWORD: {{CONFIG:mariadb.password}}
      MYSQL_CHARSET: utf8mb4
      MYSQL_COLLATION: utf8mb4_unicode_ci
    ports:
      - "{{CONFIG:mariadb.port}}:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    command: |
      sh -c "
        # Starte MariaDB im Hintergrund
        docker-entrypoint.sh mysqld &
        MYSQL_PID=\$!
        
        # Warte bis MariaDB bereit ist
        until mysqladmin ping -h localhost -u root -p{{CONFIG:mariadb.password}} --silent; do
          echo 'Warte auf MariaDB...'
          sleep 2
        done
        
        # Installiere curl und lade Init-Script von der App herunter
        echo 'Installiere curl...'
        apt-get update && apt-get install -y curl
        
        echo 'Lade Init-Script von der App...'
        curl -o /docker-entrypoint-initdb.d/init-chef-numbers-mariadb.sql {{FUNCTION:getFrontendUrl}}/init-scripts/init-chef-numbers-mariadb.sql
        
        # Führe Init-Script aus
        echo 'Führe Init-Script aus...'
        mysql -u root -p{{CONFIG:mariadb.password}} {{CONFIG:mariadb.database}} < /docker-entrypoint-initdb.d/init-chef-numbers-mariadb.sql
        
        # Warte auf MariaDB-Prozess
        wait \$MYSQL_PID
      "
    networks:
      - chef-numbers-network
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u {{CONFIG:mariadb.username}} -p{{CONFIG:mariadb.password}} --silent || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 60s

  # Prisma REST API Server
  prisma-api:
    image: node:18-alpine
    container_name: chef-numbers-prisma-api
    restart: unless-stopped
    working_dir: /app
    environment:
      DATABASE_URL: mysql://{{CONFIG:mariadb.username}}:{{CONFIG:mariadb.password}}@mariadb:3306/{{CONFIG:mariadb.database}}
      JWT_SECRET: {{FUNCTION:generateJWTSecret}}
      PORT: 3001
      NODE_ENV: production
    ports:
      - "{{CONFIG:mariadb.prismaPort}}:3001"
    command: |
      sh -c "
        echo '📦 Installiere curl und OpenSSL für Alpine...'
        apk add --no-cache curl openssl
        
        echo '📥 Lade Prisma API Dateien herunter...'
        curl -o /app/package.json {{FUNCTION:getFrontendUrl}}/prisma-api/package.json
        curl -o /app/schema.prisma {{FUNCTION:getFrontendUrl}}/prisma-api/schema.prisma
        curl -o /app/server.js {{FUNCTION:getFrontendUrl}}/prisma-api/server.js
        
        echo '📦 Installiere Prisma API Dependencies...'
        npm install
        
        echo '🔄 Generiere Prisma Client...'
        npx prisma generate
        
        echo '🗄️ Führe Datenbank-Migrationen aus...'
        npx prisma db push --accept-data-loss
        
        echo '🚀 Starte Prisma API Server...'
        npm start
      "
    depends_on:
      mariadb:
        condition: service_healthy
    networks:
      - chef-numbers-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
      interval: 60s
      timeout: 15s
      retries: 3
      start_period: 120s

volumes:
  mariadb_data:
    driver: local

networks:
  chef-numbers-network:
    driver: bridge
    name: chef-numbers-network`;

      case 'mysql':
        return `version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: chef-numbers-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: {{CONFIG:mysql.password}}
      MYSQL_DATABASE: {{CONFIG:mysql.database}}
      MYSQL_USER: {{CONFIG:mysql.username}}
      MYSQL_PASSWORD: {{CONFIG:mysql.password}}
    ports:
      - "{{CONFIG:mysql.port}}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - mysql-init:/docker-entrypoint-initdb.d
    command: >
      sh -c "
        echo 'MySQL Container gestartet...' &&
        echo 'Lade Init-Script von der App...' &&
        curl -o /docker-entrypoint-initdb.d/init-chef-numbers-mysql.sql {{FUNCTION:getFrontendUrl}}/init-scripts/init-chef-numbers-mysql.sql &&
        echo 'Init-Script geladen. Starte MySQL Server mit Standard-Entrypoint...' &&
        /usr/local/bin/docker-entrypoint.sh mysqld
      "
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p{{CONFIG:mysql.password}}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  # Prisma API Server
  prisma-api:
    image: node:18-alpine
    container_name: chef-numbers-prisma-api-mysql
    restart: unless-stopped
    working_dir: /app
    environment:
      DATABASE_URL: mysql://{{CONFIG:mysql.username}}:{{CONFIG:mysql.password}}@mysql:3306/{{CONFIG:mysql.database}}
      NODE_ENV: production
    ports:
      - "{{CONFIG:mysql.prismaPort}}:3001"
    command: >
      sh -c "
        echo 'Prisma API Container gestartet...' &&
        apk add --no-cache curl openssl &&
        echo 'Lade Prisma API Dateien herunter...' &&
        curl -o package.json {{FUNCTION:getFrontendUrl}}/prisma-api/package.json &&
        curl -o schema.prisma {{FUNCTION:getFrontendUrl}}/prisma-api/schema.prisma &&
        curl -o server.js {{FUNCTION:getFrontendUrl}}/prisma-api/server.js &&
        echo 'Installiere Prisma API Dependencies...' &&
        npm install &&
        echo 'Generiere Prisma Client...' &&
        npx prisma generate &&
        echo 'Führe Datenbank-Migrationen aus...' &&
        npx prisma db push --accept-data-loss &&
        echo 'Starte Prisma API Server...' &&
        npm start
      "
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
      interval: 60s
      timeout: 15s
      retries: 3
      start_period: 120s

volumes:
  mysql_data:
    driver: local
  mysql-init:
    driver: local

networks:
  chef-numbers-network:
    driver: bridge
    name: chef-numbers-network`;

      default:
        throw new Error(`Template nicht gefunden: ${templateName}`);
    }
  }
};

// Docker-Compose Generator
export const dockerComposeGenerator = {
  // Intelligente Frontend-URL-Erkennung
  getFrontendUrl(config: DockerComposeConfig): string {
    let frontendHost = config.frontend.host;
    let frontendPort = config.frontend.port;
    
    // Wenn localhost, verwende die aktuelle IP-Adresse
    if (frontendHost === 'localhost' || frontendHost === '127.0.0.1') {
      // Versuche die aktuelle IP-Adresse zu ermitteln
      try {
        // In einer Browser-Umgebung können wir window.location verwenden
        if (typeof window !== 'undefined') {
          const currentHost = window.location.hostname;
          if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
            frontendHost = currentHost;
          } else {
            // Fallback: Verwende die erste verfügbare IP-Adresse
            frontendHost = '192.168.1.20'; // Fallback für Entwicklung
          }
        }
      } catch (error) {
        console.warn('Konnte Frontend-Host nicht automatisch ermitteln, verwende Fallback');
        frontendHost = '192.168.1.20'; // Fallback
      }
    }
    
    return `http://${frontendHost}:${frontendPort}`;
  },
  // Generiert eine Docker-Compose-Datei basierend auf der Konfiguration
  generateDockerCompose(config: DockerComposeConfig): GeneratedDockerCompose {
    const services: string[] = [];
    const ports: { [service: string]: string } = {};
    
    // PostgreSQL Service
    services.push('postgres');
    ports.postgres = config.postgres.port;
    
    // PostgREST Service (immer aktiviert)
    services.push('postgrest');
    ports.postgrest = config.postgrest.port;
    
    // MinIO Service
    services.push('minio', 'minio-init');
    ports.minio = config.minio.port;
    
    // Generiere Docker-Compose Inhalt
    const content = dockerComposeGenerator.generateDockerComposeContent(config);
    
    return {
      content,
      filename: 'docker-compose-chef-numbers.yml',
      services,
      ports
    };
  },

  // Generiert service-spezifische Docker-Compose-Dateien
  async generateServiceSpecificCompose(serviceType: 'postgresql' | 'mariadb' | 'mysql' | 'minio', config: DockerComposeConfig): Promise<GeneratedDockerCompose> {
    const template = await templateEngine.loadTemplate(serviceType);
    const content = templateEngine.processTemplate(template, config);
    
    const services: string[] = [];
    const ports: { [service: string]: string } = {};
    
    if (serviceType === 'postgresql') {
      services.push('postgres', 'postgrest');
      ports.postgres = config.postgres.port;
      ports.postgrest = config.postgrest.port;
    } else if (serviceType === 'mariadb') {
      services.push('mariadb', 'prisma-api');
      ports.mariadb = config.mariadb.port;
      ports.prisma = config.mariadb.prismaPort;
    } else if (serviceType === 'mysql') {
      services.push('mysql', 'prisma-api');
      ports.mysql = config.mysql.port;
      ports.prisma = config.mysql.prismaPort;
    } else if (serviceType === 'minio') {
      services.push('minio', 'minio-init');
      ports.minio = config.minio.port;
    }
    
    return {
      content,
      filename: `docker-compose-${serviceType}.yml`,
      services,
      ports
    };
  },

  // Generiert den Docker-Compose Inhalt
  generateDockerComposeContent(config: DockerComposeConfig): string {
    const postgresPort = config.postgres.port;
    const postgrestPort = config.postgrest.port;
    const minioPort = config.minio.port;
    const frontendUrl = dockerComposeGenerator.getFrontendUrl(config);
    
    // Generiere JWT-Secret aus PostgreSQL-Passwort
    const jwtSecret = templateEngine.functions.generateJWTSecret(config);
    
    return `version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: chef_numbers_postgres
    environment:
      POSTGRES_DB: "${config.postgres.database}"
      POSTGRES_USER: "${config.postgres.username}"
      POSTGRES_PASSWORD: "${config.postgres.password}"
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
      # Deaktiviere Kerberos für einfache Authentifizierung
      POSTGRES_HOST_AUTH_METHOD: "md5"
    ports:
      - "${config.postgres.port}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: |
      sh -c "
        # Starte PostgreSQL im Hintergrund
        docker-entrypoint.sh postgres &
        POSTGRES_PID=\$!
        
        # Warte bis PostgreSQL bereit ist
        until pg_isready -U ${config.postgres.username} -d postgres; do
          echo 'Warte auf PostgreSQL...'
          sleep 2
        done
        
        # Lade Init-Script von der App herunter
        echo 'Lade Init-Script von der App...'
        wget -O /docker-entrypoint-initdb.d/init-chef-numbers.sql ${frontendUrl}/init-scripts/init-chef-numbers.sql
        
        # Init-Script wird automatisch von Docker ausgeführt
        echo 'Init-Script bereit für automatische Ausführung...'
        
        # Warte auf PostgreSQL-Prozess
        wait \$POSTGRES_PID
      "
    networks:
      - chef_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${config.postgres.username} -d ${config.postgres.database} || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 60s

  # PostgREST API mit CORS-Unterstützung
  postgrest:
    image: postgrest/postgrest:v12.2.0
    container_name: chef_numbers_postgrest
    environment:
      # Einfache und robuste Datenbankverbindung
      PGRST_DB_URI: "postgres://${config.postgres.username}:${config.postgres.password}@postgres:5432/${config.postgres.database}"
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: ${config.postgres.username}
      PGRST_DB_USE_LEGACY_GUCS: "false"
      PGRST_JWT_SECRET: "${jwtSecret}"
      PGRST_CORS_ALLOWED_ORIGINS: "*"
      PGRST_CORS_ALLOWED_METHODS: "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      PGRST_CORS_ALLOWED_HEADERS: "Content-Type, Authorization, X-Requested-With"
      PGRST_CORS_EXPOSED_HEADERS: "Content-Range, Content-Location"
      PGRST_CORS_ALLOW_CREDENTIALS: "true"
      PGRST_CORS_MAX_AGE: "3600"
      # Deaktiviere Kerberos für einfache Authentifizierung
      PGRST_DB_EXTRA_SEARCH_PATH: "public"
    ports:
      - "${config.postgrest.port}:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - chef_network

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: chef_numbers_minio
    environment:
      MINIO_ROOT_USER: "${config.minio.accessKey}"
      MINIO_ROOT_PASSWORD: "${config.minio.secretKey}"
      # MinIO Parity-Konfiguration für Single-Disk-Setup
      MINIO_STORAGE_CLASS_STANDARD: "EC:0"  # 0 Paritätsblöcke für Single-Disk
      MINIO_STORAGE_CLASS_RRS: "EC:0"       # 0 Paritätsblöcke für Single-Disk
    ports:
      - "${config.minio.port}:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data:Z
    command: server /data --console-address ":9001"
    networks:
      - chef_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # MinIO Bucket Initialization
  minio-init:
    image: minio/mc:latest
    container_name: chef_numbers_minio_init
    depends_on:
      - minio
    environment:
      MINIO_ROOT_USER: "${config.minio.accessKey}"
      MINIO_ROOT_PASSWORD: "${config.minio.secretKey}"
    entrypoint: >
      /bin/sh -c "
      echo '🪣 Warte auf MinIO-Server...';
      sleep 10;
      echo '🔧 Konfiguriere MinIO-Client...';
      mc alias set minio http://minio:9000 ${config.minio.accessKey} ${config.minio.secretKey};
      echo '📦 Erstelle Bucket: ${config.minio.bucket}';
      mc mb minio/${config.minio.bucket} --ignore-existing;
      echo '✅ Bucket erfolgreich erstellt!';
      mc ls minio/;
      echo '🎉 MinIO-Initialisierung abgeschlossen!';
      echo '🗑️ Container wird automatisch entfernt...';
      "
    networks:
      - chef_network
    restart: "no"

volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local

networks:
  chef_network:
    driver: bridge
`;
  },

  // Validiert die Docker-Konfiguration
  validateConfig(config: DockerComposeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // PostgreSQL Validierung
    if (!config.postgres.host) errors.push('PostgreSQL Host ist erforderlich');
    if (!config.postgres.port) errors.push('PostgreSQL Port ist erforderlich');
    if (!config.postgres.database) errors.push('PostgreSQL Datenbankname ist erforderlich');
    if (!config.postgres.username) errors.push('PostgreSQL Benutzername ist erforderlich');
    if (!config.postgres.password) errors.push('PostgreSQL Passwort ist erforderlich');
    
    // Port Validierung
    const postgresPort = parseInt(config.postgres.port);
    if (isNaN(postgresPort) || postgresPort < 1 || postgresPort > 65535) {
      errors.push('PostgreSQL Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    // PostgREST ist immer aktiviert
    if (!config.postgrest.port) errors.push('PostgREST Port ist erforderlich');
    
    const postgrestPort = parseInt(config.postgrest.port);
    if (isNaN(postgrestPort) || postgrestPort < 1 || postgrestPort > 65535) {
      errors.push('PostgREST Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    // Prüfe auf Port-Konflikte
    if (postgresPort === postgrestPort) {
      errors.push('PostgreSQL und PostgREST können nicht denselben Port verwenden');
    }
    
    // MariaDB Validierung
    if (!config.mariadb.host) errors.push('MariaDB Host ist erforderlich');
    if (!config.mariadb.port) errors.push('MariaDB Port ist erforderlich');
    if (!config.mariadb.database) errors.push('MariaDB Datenbankname ist erforderlich');
    if (!config.mariadb.username) errors.push('MariaDB Benutzername ist erforderlich');
    if (!config.mariadb.password) errors.push('MariaDB Passwort ist erforderlich');
    
    const mariadbPort = parseInt(config.mariadb.port);
    if (isNaN(mariadbPort) || mariadbPort < 1 || mariadbPort > 65535) {
      errors.push('MariaDB Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    // MySQL Validierung
    if (!config.mysql.host) errors.push('MySQL Host ist erforderlich');
    if (!config.mysql.port) errors.push('MySQL Port ist erforderlich');
    if (!config.mysql.database) errors.push('MySQL Datenbankname ist erforderlich');
    if (!config.mysql.username) errors.push('MySQL Benutzername ist erforderlich');
    if (!config.mysql.password) errors.push('MySQL Passwort ist erforderlich');
    if (!config.mysql.prismaPort) errors.push('MySQL Prisma API Port ist erforderlich');
    
    const mysqlPort = parseInt(config.mysql.port);
    const mysqlPrismaPort = parseInt(config.mysql.prismaPort);
    if (isNaN(mysqlPort) || mysqlPort < 1 || mysqlPort > 65535) {
      errors.push('MySQL Port muss eine gültige Portnummer sein (1-65535)');
    }
    if (isNaN(mysqlPrismaPort) || mysqlPrismaPort < 1 || mysqlPrismaPort > 65535) {
      errors.push('MySQL Prisma API Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    // Prüfe auf Port-Konflikte zwischen MySQL und Prisma
    if (mysqlPort === mysqlPrismaPort) {
      errors.push('MySQL und Prisma API können nicht denselben Port verwenden');
    }
    
    // Prisma API ist immer aktiviert für MariaDB
    if (!config.mariadb.prismaPort) errors.push('MariaDB Prisma API Port ist erforderlich');
    
    const mariadbPrismaPort = parseInt(config.mariadb.prismaPort);
    if (isNaN(mariadbPrismaPort) || mariadbPrismaPort < 1 || mariadbPrismaPort > 65535) {
      errors.push('MariaDB Prisma API Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    // Prüfe auf Port-Konflikte zwischen MariaDB und Prisma
    if (mariadbPort === mariadbPrismaPort) {
      errors.push('MariaDB und Prisma API können nicht denselben Port verwenden');
    }
    
    // MinIO Validierung
    if (!config.minio.host) errors.push('MinIO Host ist erforderlich');
    if (!config.minio.port) errors.push('MinIO Port ist erforderlich');
    if (!config.minio.consolePort) errors.push('MinIO Console Port ist erforderlich');
    if (!config.minio.accessKey) errors.push('MinIO Access Key ist erforderlich');
    if (!config.minio.secretKey) errors.push('MinIO Secret Key ist erforderlich');
    if (!config.minio.bucket) errors.push('MinIO Bucket Name ist erforderlich');
    
    const minioPort = parseInt(config.minio.port);
    const minioConsolePort = parseInt(config.minio.consolePort);
    
    if (isNaN(minioPort) || minioPort < 1 || minioPort > 65535) {
      errors.push('MinIO Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    if (isNaN(minioConsolePort) || minioConsolePort < 1 || minioConsolePort > 65535) {
      errors.push('MinIO Console Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    // Prüfe auf Port-Konflikte zwischen MinIO Ports
    if (minioPort === minioConsolePort) {
      errors.push('MinIO API Port und Console Port können nicht identisch sein');
    }
    
    // Frontend Validierung
    if (!config.frontend.host) errors.push('Frontend Host ist erforderlich');
    if (!config.frontend.port) errors.push('Frontend Port ist erforderlich');
    
    const frontendPort = parseInt(config.frontend.port);
    if (isNaN(frontendPort) || frontendPort < 1 || frontendPort > 65535) {
      errors.push('Frontend Port muss eine gültige Portnummer sein (1-65535)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Generiert eine dynamische PostgreSQL-Init-Script-Datei
  generatePostgreSQLInitScriptFile(config: DockerComposeConfig): GeneratedDockerCompose {
    const content = `-- Chef Numbers Database Initialization Script
-- Wird beim ersten Start der PostgreSQL-Datenbank ausgeführt
-- MIT API-Funktionen für direkten Frontend-Zugriff
-- Dynamisch generiert für Benutzer: ${config.postgres.username}

-- Erstelle Rollen für PostgreSQL
DO $$
BEGIN
    -- Standard-Benutzer postgres erstellen (falls nicht vorhanden)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE ROLE postgres WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD '${config.postgres.password}';
        RAISE NOTICE 'Standard-Benutzer postgres erstellt';
    ELSE
        RAISE NOTICE 'Standard-Benutzer postgres existiert bereits';
    END IF;

-- Konfigurierter Benutzer erstellen (falls nicht vorhanden)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${config.postgres.username}') THEN
        CREATE ROLE ${config.postgres.username} WITH LOGIN PASSWORD '${config.postgres.password}';
        RAISE NOTICE 'Benutzer ${config.postgres.username} erstellt';
    ELSE
        RAISE NOTICE 'Benutzer ${config.postgres.username} existiert bereits';
    END IF;
    
    -- Anon Role (für öffentliche API-Zugriffe)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    
    -- Authenticated Role (für authentifizierte Benutzer)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    
    -- Service Role (für Admin-Operationen)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
END
$$;

-- Datenbank erstellen (falls nicht vorhanden)
SELECT 'CREATE DATABASE ${config.postgres.database} OWNER ${config.postgres.username}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${config.postgres.database}')\\gexec

-- Berechtigungen vergeben
GRANT ALL PRIVILEGES ON DATABASE ${config.postgres.database} TO ${config.postgres.username};
GRANT ALL PRIVILEGES ON DATABASE ${config.postgres.database} TO postgres;

-- Verbindung zur neuen Datenbank
\\c ${config.postgres.database}

-- Setze Berechtigungen
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, ${config.postgres.username};
GRANT ALL ON SCHEMA public TO service_role, ${config.postgres.username};

-- Erstelle Chef Numbers Tabellen
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    supplier_id UUID,
    supplier_article_number VARCHAR(100),
    bundle_unit VARCHAR(50),
    bundle_price DECIMAL(10,2),
    bundle_ean_code VARCHAR(20),
    content DECIMAL(10,3),
    content_unit VARCHAR(50),
    content_ean_code VARCHAR(20),
    price_per_unit DECIMAL(10,4),
    allergens TEXT[],
    additives TEXT[],
    ingredients TEXT,
    nutrition_info JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    website VARCHAR(255),
    address JSONB,
    phone_numbers JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    portions INTEGER,
    preparation_time INTEGER,
    difficulty INTEGER,
    ingredients JSONB,
    used_recipes JSONB,
    preparation_steps JSONB,
    material_costs DECIMAL(10,2),
    markup_percentage DECIMAL(5,2),
    vat_rate DECIMAL(5,2),
    selling_price DECIMAL(10,2),
    total_nutrition_info JSONB,
    allergens TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS design (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100),
    colors JSONB,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS einkaufs_liste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artikel_name VARCHAR(255) NOT NULL,
    menge DECIMAL(10,3),
    einheit VARCHAR(50),
    lieferant VARCHAR(255),
    preis DECIMAL(10,2),
    bestelldatum TIMESTAMP,
    lieferdatum TIMESTAMP,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS inventur_liste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artikel_name VARCHAR(255) NOT NULL,
    kategorie VARCHAR(100),
    soll_bestand DECIMAL(10,3),
    ist_bestand DECIMAL(10,3),
    einheit VARCHAR(50),
    preis DECIMAL(10,2),
    inventur_datum TIMESTAMP,
    differenz DECIMAL(10,3),
    bemerkung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    last_modified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS system_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_articles_supplier_id ON articles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_einkaufs_liste_status ON einkaufs_liste(status);
CREATE INDEX IF NOT EXISTS idx_inventur_liste_kategorie ON inventur_liste(kategorie);

-- Setze Berechtigungen für Tabellen
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, ${config.postgres.username};
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, ${config.postgres.username};

-- Aktiviere Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE design ENABLE ROW LEVEL SECURITY;
ALTER TABLE einkaufs_liste ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventur_liste ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- Erstelle RLS-Policies (erlaube alle Operationen für alle Rollen)
CREATE POLICY "Enable all operations for all users" ON articles FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON suppliers FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON recipes FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON design FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON einkaufs_liste FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON inventur_liste FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON system_info FOR ALL USING (true);

-- Füge System-Informationen hinzu
INSERT INTO system_info (key, value, description) VALUES 
    ('app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
    ('version', '1.0.0', 'Aktuelle Version'),
    ('database_created', CURRENT_TIMESTAMP::text, 'Datum der Datenbankerstellung'),
    ('connection_tested_at', CURRENT_TIMESTAMP::text, 'Letzter Verbindungstest'),
    ('postgresql_version', '1.0.0', 'PostgreSQL Self-Hosted Version'),
    ('setup_completed', 'true', 'Initial Setup abgeschlossen'),
    ('configured_user', '${config.postgres.username}', 'Konfigurierter PostgreSQL-Benutzer')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Erstelle Funktion für SQL-Ausführung (für Schema-Updates)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Erstelle Funktion für SQL-Ausführung mit Rückgabe (für PostgREST)
CREATE OR REPLACE FUNCTION exec_sql_with_result(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE sql INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Erstelle Funktion für Schema-Versionierung
CREATE OR REPLACE FUNCTION update_schema_version(version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO system_info (key, value, description) 
    VALUES ('schema_version', version, 'Aktuelle Schema-Version')
    ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP;
END;
$$;

-- Setze initiale Schema-Version
SELECT update_schema_version('1.0.0');

-- Erstelle Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Füge updated_at Trigger zu allen Tabellen hinzu
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_design_updated_at BEFORE UPDATE ON design FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_einkaufs_liste_updated_at BEFORE UPDATE ON einkaufs_liste FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventur_liste_updated_at BEFORE UPDATE ON inventur_liste FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Setze Berechtigungen für alle Funktionen
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon, authenticated, service_role, ${config.postgres.username};
GRANT EXECUTE ON FUNCTION exec_sql_with_result(text) TO anon, authenticated, service_role, ${config.postgres.username};
GRANT EXECUTE ON FUNCTION update_schema_version(text) TO anon, authenticated, service_role, ${config.postgres.username};

-- Berechtigungen für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${config.postgres.username};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${config.postgres.username};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${config.postgres.username};

-- Erfolgsmeldung
SELECT 'PostgreSQL-Initialisierung erfolgreich abgeschlossen!' as status;
SELECT 'Verfügbare Benutzer:' as info;
SELECT rolname as benutzer FROM pg_roles WHERE rolcanlogin = true;
`;
    
    return {
      content,
      filename: 'init-chef-numbers.sql',
      services: ['postgres'],
      ports: { postgres: config.postgres.port }
    };
  },

  // Generiert eine Portainer-kompatible Docker-Compose-Datei
  generatePortainerCompose(config: DockerComposeConfig): GeneratedDockerCompose {
    const baseCompose = dockerComposeGenerator.generateDockerCompose(config);
    
    // Füge Portainer-spezifische Kommentare hinzu
    const portainerContent = `# 🍴 The Chef's Numbers - Docker-Compose für Portainer.io
# Generiert am: ${new Date().toLocaleString('de-DE')}
# 
# Anleitung:
# 1. Kopieren Sie diese Datei
# 2. Öffnen Sie Portainer.io → Stacks → Add stack
# 3. Fügen Sie den Inhalt ein und starten Sie den Stack
#
# Services:
# - PostgreSQL: Port ${config.postgres.port}
# - PostgREST: Port ${config.postgrest.port}
# - MinIO: Port ${config.minio.port} (Web-UI: 9001)
#
# Nach dem Start:
# - PostgreSQL: postgresql://${config.postgres.username}:${config.postgres.password}@localhost:${config.postgres.port}/${config.postgres.database}
# - PostgREST: http://localhost:${config.postgrest.port}
# - MinIO: http://localhost:${config.minio.port} (${config.minio.accessKey}/${config.minio.secretKey})

${baseCompose.content}`;
    
    return {
      ...baseCompose,
      content: portainerContent,
      filename: 'portainer-chef-numbers-stack.yml'
    };
  },

  // Generiert eine .env Datei für die Docker-Compose (OPTIONAL)
  // Diese Datei ist nicht mehr erforderlich, da alle Werte direkt in der Docker-Compose-Datei stehen
  generateEnvFile(config: DockerComposeConfig): string {
    // Generiere JWT-Secret aus PostgreSQL-Passwort
    const jwtSecret = templateEngine.functions.generateJWTSecret(config);
    
    return `# The Chef's Numbers - Docker Environment Variables (OPTIONAL)
# Generiert am: ${new Date().toLocaleString('de-DE')}
# 
# HINWEIS: Diese .env-Datei ist NICHT erforderlich!
# Alle Werte sind bereits direkt in der docker-compose.yml definiert.
# Diese Datei dient nur als Referenz oder für erweiterte Konfigurationen.

# PostgreSQL Konfiguration
POSTGRES_DB=${config.postgres.database}
POSTGRES_USER=${config.postgres.username}
POSTGRES_PASSWORD=${config.postgres.password}
POSTGRES_PORT=${config.postgres.port}

# PostgREST Konfiguration
PGREST_PORT=${config.postgrest.port}
PGREST_JWT_SECRET=${jwtSecret}

# MinIO Konfiguration
MINIO_ROOT_USER=${config.minio.accessKey}
MINIO_ROOT_PASSWORD=${config.minio.secretKey}
MINIO_PORT=${config.minio.port}
MINIO_BUCKET=${config.minio.bucket}
MINIO_USE_SSL=${config.minio.useSSL}

# Netzwerk Konfiguration
NETWORK_NAME=chef-numbers-network
`;
  },

  // Generiert eine Start-Anleitung
  generateStartInstructions(config: DockerComposeConfig): string {
    const services = dockerComposeGenerator.generateDockerCompose(config).services;
    
    return `# 🚀 The Chef's Numbers - Start-Anleitung

## 📋 Übersicht
Diese Docker-Compose-Datei startet folgende Services:
${services.map(service => `- **${service}**: ${dockerComposeGenerator.getServiceDescription(service, config)}`).join('\n')}

## 🔧 Voraussetzungen
- Docker und Docker Compose installiert
- Ports ${Object.values(dockerComposeGenerator.generateDockerCompose(config).ports).join(', ')} verfügbar
- Mindestens 2GB freier Speicherplatz

## 🚀 Start-Befehle

### Lokaler Start (Docker Compose)
\`\`\`bash
# 1. Datei speichern als docker-compose.yml
# 2. Im Terminal ausführen:

# WICHTIG: Bei PostgreSQL-Problemen das Volume löschen:
docker volume rm chef_numbers_postgres_data

# Dann Container starten:
docker-compose up -d

# 3. Logs anzeigen:
docker-compose logs -f postgres

# 4. Services stoppen:
docker-compose down
\`\`\`

### Portainer.io Start
1. Öffnen Sie Portainer.io → **Stacks**
2. Klicken Sie auf **Add stack**
3. Kopieren Sie den Docker-Compose Inhalt
4. Klicken Sie auf **Deploy the stack**

## 🌐 Service-URLs nach dem Start
${dockerComposeGenerator.generateServiceUrls(config)}

## 🔍 Troubleshooting
- **Port bereits belegt**: Ändern Sie die Ports in der Konfiguration
- **Container startet nicht**: Prüfen Sie die Logs mit \`docker-compose logs\`
- **Datenbank-Verbindung fehlgeschlagen**: Warten Sie 30 Sekunden nach dem Start

## 📊 Monitoring
- **Container-Status**: \`docker-compose ps\`
- **Ressourcen-Verbrauch**: \`docker stats\`
- **Logs anzeigen**: \`docker-compose logs [service-name]\`
`;
  },

  // Hilfsfunktionen
  getServiceDescription(service: string, config: DockerComposeConfig): string {
    switch (service) {
      case 'postgres':
        return `PostgreSQL Datenbank auf Port ${config.postgres.port}`;
      case 'postgrest':
        return `PostgREST API auf Port ${config.postgrest.port}`;
      case 'mariadb':
        return `MariaDB Datenbank auf Port ${config.mariadb.port}`;
      case 'mysql':
        return `MySQL Datenbank auf Port ${config.mysql.port}`;
      case 'prisma-api':
        // Prisma-Port hängt vom Service-Typ ab - wird dynamisch bestimmt
        return `Prisma REST API (Port wird service-spezifisch konfiguriert)`;
      case 'minio':
        return `MinIO Object Storage auf Port ${config.minio.port}`;
      case 'minio-init':
        return `MinIO Bucket-Initialisierung (erstellt Bucket: ${config.minio.bucket})`;
      default:
        return 'Unbekannter Service';
    }
  },

  generateServiceUrls(config: DockerComposeConfig): string {
    const urls = [
      `- **PostgreSQL**: \`postgresql://${config.postgres.username}:${config.postgres.password}@localhost:${config.postgres.port}/${config.postgres.database}\``,
      `- **PostgREST API**: \`http://localhost:${config.postgrest.port}\``
    ];
    
    urls.push(`- **MinIO**: \`http://localhost:${config.minio.port}\` (Web-UI: \`http://localhost:${config.minio.consolePort}\`)`);
    
    return urls.join('\n');
  }
};
