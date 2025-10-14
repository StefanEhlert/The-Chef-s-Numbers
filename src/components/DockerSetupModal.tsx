import React, { useState } from 'react';
import { FaTimes as FaClose, FaDownload, FaInfoCircle, FaCheck, FaExclamationTriangle, FaDocker, FaServer, FaCopy } from 'react-icons/fa';
import { dockerComposeGenerator, DockerComposeConfig } from '../services/dockerComposeGenerator';

interface DockerSetupModalProps {
  show: boolean;
  onClose: () => void;
  onRestartTest: () => void;
  colors: any;
  dockerConfig: DockerComposeConfig;
  serviceType?: 'postgresql' | 'mariadb' | 'mysql' | 'couchdb' | 'minio' | 'frontend' | 'all';
}

const DockerSetupModal: React.FC<DockerSetupModalProps> = ({
  show,
  onClose,
  onRestartTest,
  colors,
  dockerConfig,
  serviceType = 'all'
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  // Service-spezifische Konfiguration
  const getServiceConfig = () => {
    switch (serviceType) {
      case 'postgresql':
        return {
          title: 'PostgreSQL & PostgREST Setup',
          description: 'PostgreSQL-Datenbank und PostgREST-API Container',
          services: ['PostgreSQL', 'PostgREST'],
          filename: 'docker-compose-postgresql.yml',
          icon: '🗄️'
        };
      case 'mariadb':
        return {
          title: 'MariaDB & Prisma API Setup',
          description: 'MariaDB-Datenbank und Prisma API Container',
          services: ['MariaDB', 'Prisma API'],
          filename: 'docker-compose-mariadb.yml',
          icon: '🗄️'
        };
      case 'mysql':
        return {
          title: 'MySQL & Prisma API Setup',
          description: 'MySQL-Datenbank und Prisma API Container',
          services: ['MySQL', 'Prisma API'],
          filename: 'docker-compose-mysql.yml',
          icon: '🗄️'
        };
      case 'couchdb':
        return {
          title: 'CouchDB Setup',
          description: 'CouchDB NoSQL-Dokumentendatenbank Container',
          services: ['CouchDB', 'CouchDB Init'],
          filename: 'docker-compose-couchdb.yml',
          icon: '🗄️'
        };
      case 'minio':
        return {
          title: 'MinIO Object Storage Setup',
          description: 'MinIO Object Storage Container',
          services: ['MinIO'],
          filename: 'docker-compose-minio.yml',
          icon: '📦'
        };
      case 'frontend':
        return {
          title: 'Frontend Selfhosting Setup',
          description: 'The Chef\'s Numbers React Frontend',
          services: ['Frontend (React + Nginx)'],
          filename: 'docker-compose-frontend.yml',
          icon: '🎨'
        };
      default:
        return {
          title: 'Docker-Container Setup',
          description: 'Alle Services (PostgreSQL, PostgREST, MinIO)',
          services: ['PostgreSQL', 'PostgREST', 'MinIO'],
          filename: 'docker-compose-chef-numbers.yml',
          icon: '🐳'
        };
    }
  };

  const serviceConfig = getServiceConfig();

  // Frontend Docker Compose Content Generator
  const getFrontendDockerCompose = () => {
    return `# ============================================
# The Chef's Numbers - Frontend Docker Compose
# Stellt nur die React App bereit
# ============================================

version: '3.8'

services:
  frontend:
    # Fertiges Docker Image von GitHub Container Registry
    # KEIN Build nötig - Image wird automatisch heruntergeladen!
    image: ghcr.io/stefanehlert/the-chef-s-numbers:latest
    
    # Container-Name
    container_name: chef-numbers-frontend
    
    # Port-Mapping (Host:Container)
    # Zugriff über: http://localhost:3000
    ports:
      - "3000:80"
    
    # Umgebungsvariablen (optional)
    environment:
      - REACT_APP_VERSION=2.3.0
    
    # Neustart-Policy
    # unless-stopped = startet automatisch nach System-Reboot
    restart: unless-stopped
    
    # Health Check
    # Prüft ob Container gesund ist
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3
    
    # Labels für bessere Organisation
    labels:
      - "com.chefnumbers.component=frontend"
      - "com.chefnumbers.version=2.3.0"
      - "com.chefnumbers.description=The Chef's Numbers React Frontend"

# ============================================
# Hinweise zur Verwendung:
# ============================================
# 
# 1. Erstmaliger Start:
#    docker-compose -f docker-compose-frontend.yml up -d
#
# 2. Neustart:
#    docker-compose -f docker-compose-frontend.yml restart
#
# 3. Stoppen:
#    docker-compose -f docker-compose-frontend.yml down
#
# 4. Logs ansehen:
#    docker-compose -f docker-compose-frontend.yml logs -f
#
# 5. Update (neue Version):
#    docker-compose -f docker-compose-frontend.yml pull
#    docker-compose -f docker-compose-frontend.yml up -d
#
# ============================================
`;
  };

  // Service-spezifischer Button-Text
  const getTestButtonText = () => {
    switch (serviceType) {
      case 'postgresql':
        return 'PostgreSQL-Verbindungstest erneut starten';
      case 'mariadb':
        return 'MariaDB-Verbindungstest erneut starten';
      case 'mysql':
        return 'MySQL-Verbindungstest erneut starten';
      case 'couchdb':
        return 'CouchDB-Verbindungstest erneut starten';
      case 'minio':
        return 'MinIO-Verbindungstest erneut starten';
      case 'frontend':
        return null; // Kein Test-Button beim Frontend
      default:
        return 'Verbindungstest erneut starten';
    }
  };

  const handleDownloadDockerCompose = async () => {
    let dockerComposeContent: string;
    let filename: string;

    if (serviceType === 'postgresql') {
      const result = await dockerComposeGenerator.generateServiceSpecificCompose('postgresql', dockerConfig);
      dockerComposeContent = result.content;
      filename = result.filename;
    } else if (serviceType === 'mariadb') {
      const result = await dockerComposeGenerator.generateServiceSpecificCompose('mariadb', dockerConfig);
      dockerComposeContent = result.content;
      filename = result.filename;
    } else if (serviceType === 'mysql') {
      const result = await dockerComposeGenerator.generateServiceSpecificCompose('mysql', dockerConfig);
      dockerComposeContent = result.content;
      filename = result.filename;
    } else if (serviceType === 'couchdb') {
      const result = await dockerComposeGenerator.generateServiceSpecificCompose('couchdb', dockerConfig);
      dockerComposeContent = result.content;
      filename = result.filename;
    } else if (serviceType === 'minio') {
      const result = await dockerComposeGenerator.generateServiceSpecificCompose('minio', dockerConfig);
      dockerComposeContent = result.content;
      filename = result.filename;
    } else if (serviceType === 'frontend') {
      dockerComposeContent = getFrontendDockerCompose();
      filename = 'docker-compose-frontend.yml';
    } else {
      // Alle Services
      dockerComposeContent = dockerComposeGenerator.generateDockerComposeContent(dockerConfig);
      filename = 'docker-compose-chef-numbers.yml';
    }

    const blob = new Blob([dockerComposeContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloadedFile(filename);
    setShowInstructions(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      let dockerComposeContent: string;
      let filename: string;

      if (serviceType === 'postgresql') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('postgresql', dockerConfig);
        dockerComposeContent = result.content;
        filename = result.filename;
      } else if (serviceType === 'mariadb') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('mariadb', dockerConfig);
        dockerComposeContent = result.content;
        filename = result.filename;
      } else if (serviceType === 'mysql') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('mysql', dockerConfig);
        dockerComposeContent = result.content;
        filename = result.filename;
      } else if (serviceType === 'couchdb') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('couchdb', dockerConfig);
        dockerComposeContent = result.content;
        filename = result.filename;
      } else if (serviceType === 'minio') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('minio', dockerConfig);
        dockerComposeContent = result.content;
        filename = result.filename;
      } else if (serviceType === 'frontend') {
        dockerComposeContent = getFrontendDockerCompose();
        filename = 'docker-compose-frontend.yml';
      } else {
        // Alle Services
        dockerComposeContent = dockerComposeGenerator.generateDockerComposeContent(dockerConfig);
        filename = 'docker-compose-chef-numbers.yml';
      }
      
      // Kopiere in die Zwischenablage
      await navigator.clipboard.writeText(dockerComposeContent);
      
      setDownloadedFile(`${filename} (Zwischenablage)`);
      setShowInstructions(true);
    } catch (error) {
      console.error('Fehler beim Kopieren in die Zwischenablage:', error);
      
      // Fallback für ältere Browser
      let dockerComposeContent: string;
      if (serviceType === 'postgresql') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('postgresql', dockerConfig);
        dockerComposeContent = result.content;
      } else if (serviceType === 'mariadb') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('mariadb', dockerConfig);
        dockerComposeContent = result.content;
      } else if (serviceType === 'mysql') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('mysql', dockerConfig);
        dockerComposeContent = result.content;
      } else if (serviceType === 'couchdb') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('couchdb', dockerConfig);
        dockerComposeContent = result.content;
      } else if (serviceType === 'minio') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('minio', dockerConfig);
        dockerComposeContent = result.content;
      } else if (serviceType === 'frontend') {
        dockerComposeContent = getFrontendDockerCompose();
      } else {
        dockerComposeContent = dockerComposeGenerator.generateDockerComposeContent(dockerConfig);
      }
      
      const textArea = document.createElement('textarea');
      textArea.value = dockerComposeContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setDownloadedFile(`${serviceConfig.filename} (Zwischenablage)`);
      setShowInstructions(true);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <div className="modal-header" style={{ borderBottomColor: colors.cardBorder }}>
            <h5 className="modal-title" style={{ color: colors.text }}>
              <FaDocker className="me-2" />
              {serviceConfig.icon} {serviceConfig.title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              style={{ filter: 'invert(1)' }}
            />
          </div>
          
          <div className="modal-body" style={{ color: colors.text }}>
            <div className="alert alert-info" style={{ backgroundColor: colors.accent + '20', borderColor: colors.accent }}>
              <FaInfoCircle className="me-2" />
              <strong>IP-Adresse erreichbar, aber keine Docker-Container gefunden</strong><br />
              Die angegebene IP-Adresse ist erreichbar, aber {serviceConfig.services.join(' und ')} {serviceConfig.services.length === 1 ? 'ist' : 'sind'} nicht verfügbar. 
              Dies deutet darauf hin, dass noch keine Docker-Container installiert sind.
            </div>

            <div className="mb-4">
              <h6 className="mb-3">
                <FaDownload className="me-2" />
                Docker Compose-Datei herunterladen
              </h6>
              <p className="text-muted mb-3">
                Laden Sie die vorkonfigurierte Docker Compose-Datei herunter, um {serviceConfig.description.toLowerCase()} zu starten.
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadDockerCompose}
                  style={{
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                    color: 'white'
                  }}
                >
                  <FaDownload className="me-2" />
                  Herunterladen
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleCopyToClipboard}
                  style={{
                    borderColor: colors.accent,
                    color: colors.accent
                  }}
                >
                  <FaCopy className="me-2" />
                  In Zwischenablage kopieren
                </button>
              </div>
            </div>

            {showInstructions && (
              <div className="mt-4">
                <h6 className="mb-3">
                  <FaCheck className="me-2 text-success" />
                  Datei heruntergeladen: {downloadedFile}
                </h6>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="card" style={{ backgroundColor: colors.paper, borderColor: colors.cardBorder }}>
                      <div className="card-header" style={{ backgroundColor: colors.card, borderBottomColor: colors.cardBorder }}>
                        <h6 className="mb-0" style={{ color: colors.text }}>
                          <FaDocker className="me-2" />
                          Docker Installation
                        </h6>
                      </div>
                      <div className="card-body">
                        <ol className="mb-0" style={{ fontSize: '0.9em' }}>
                          <li>Öffnen Sie ein Terminal/Command Prompt</li>
                          <li>
                            <strong>Option A:</strong> Datei direkt herunterladen:
                            <div className="alert alert-dark mt-2 mb-2" style={{ backgroundColor: '#2b2b2b', border: 'none', padding: '8px 12px' }}>
                              <code style={{ color: '#00ff00', fontFamily: 'monospace', fontSize: '0.85em' }}>
                                wget https://raw.githubusercontent.com/StefanEhlert/The-Chef-s-Numbers/main/{serviceConfig.filename}
                              </code>
                              <div className="mt-1">oder</div>
                              <code style={{ color: '#00ff00', fontFamily: 'monospace', fontSize: '0.85em' }}>
                                curl -O https://raw.githubusercontent.com/StefanEhlert/The-Chef-s-Numbers/main/{serviceConfig.filename}
                              </code>
                            </div>
                            <strong>Option B:</strong> Navigieren Sie zum Ordner mit der heruntergeladenen Datei
                          </li>
                          <li>Führen Sie aus: <code style={{ backgroundColor: colors.secondary, padding: '2px 6px', borderRadius: '3px' }}>docker-compose -f {serviceConfig.filename} up -d</code></li>
                          <li>Warten Sie bis alle Container gestartet sind</li>
                          <li>Prüfen Sie mit: <code style={{ backgroundColor: colors.secondary, padding: '2px 6px', borderRadius: '3px' }}>docker-compose -f {serviceConfig.filename} ps</code></li>
                          {serviceType === 'postgresql' && (
                            <>
                              <li>PostgreSQL wird auf Port {dockerConfig.postgres.port} verfügbar sein</li>
                              <li>PostgREST API wird auf Port {dockerConfig.postgrest.port} verfügbar sein</li>
                            </>
                          )}
                          {serviceType === 'mariadb' && (
                            <>
                              <li>MariaDB wird auf Port {dockerConfig.mariadb.port} verfügbar sein</li>
                              <li>Prisma API wird auf Port {dockerConfig.mariadb.prismaPort} verfügbar sein</li>
                            </>
                          )}
                          {serviceType === 'mysql' && (
                            <>
                              <li>MySQL wird auf Port {dockerConfig.mysql.port} verfügbar sein</li>
                              <li>Prisma API wird auf Port {dockerConfig.mysql.prismaPort} verfügbar sein</li>
                            </>
                          )}
                          {serviceType === 'couchdb' && dockerConfig.couchdb && (
                            <>
                              <li>CouchDB wird auf Port {dockerConfig.couchdb.port} verfügbar sein</li>
                              <li>Öffnen Sie: <code style={{ backgroundColor: colors.secondary, padding: '2px 6px', borderRadius: '3px' }}>http://localhost:{dockerConfig.couchdb.port}/_utils</code></li>
                            </>
                          )}
                          {serviceType === 'minio' && (
                            <>
                              <li>MinIO API wird auf Port {dockerConfig.minio.port} verfügbar sein</li>
                              <li>MinIO Web-UI wird auf Port {dockerConfig.minio.consolePort} verfügbar sein</li>
                            </>
                          )}
                          {serviceType === 'frontend' && (
                            <>
                              <li>Frontend wird auf Port 3000 verfügbar sein</li>
                              <li>Öffnen Sie: <code style={{ backgroundColor: colors.secondary, padding: '2px 6px', borderRadius: '3px' }}>http://localhost:3000</code></li>
                            </>
                          )}
                        </ol>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card" style={{ backgroundColor: colors.paper, borderColor: colors.cardBorder }}>
                      <div className="card-header" style={{ backgroundColor: colors.card, borderBottomColor: colors.cardBorder }}>
                        <h6 className="mb-0" style={{ color: colors.text }}>
                          <FaServer className="me-2" />
                          Portainer Installation
                        </h6>
                      </div>
                      <div className="card-body">
                        <ol className="mb-0" style={{ fontSize: '0.9em' }}>
                          <li>Öffnen Sie Portainer in Ihrem Browser</li>
                          <li>Gehen Sie zu "Stacks" → "Add stack"</li>
                          <li>Geben Sie einen Namen ein (z.B. <code style={{ backgroundColor: colors.secondary, padding: '2px 6px', borderRadius: '3px' }}>
                            {serviceType === 'frontend' ? 'chef-numbers-frontend' : 
                             serviceType === 'postgresql' ? 'chef-numbers-postgresql' :
                             serviceType === 'mariadb' ? 'chef-numbers-mariadb' :
                             serviceType === 'mysql' ? 'chef-numbers-mysql' :
                             serviceType === 'couchdb' ? 'chef-numbers-couchdb' :
                             serviceType === 'minio' ? 'chef-numbers-minio' : 'chef-numbers'}
                          </code>)</li>
                          <li>Kopieren Sie den Inhalt der {serviceConfig.filename} <strong>in die Zwischenablage</strong></li>
                          <li>Fügen Sie ihn in den Web-Editor ein</li>
                          <li>Klicken Sie "Deploy the stack"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {serviceType !== 'frontend' && (
                  <div className="alert alert-success mt-3" style={{ backgroundColor: colors.accent + '20', borderColor: colors.accent }}>
                    <FaCheck className="me-2" />
                    <strong>Nach der Installation:</strong> Starten Sie den Verbindungstest erneut, um die Datenbank zu konfigurieren.
                  </div>
                )}
                
                {serviceType === 'frontend' && (
                  <div className="alert alert-info mt-3" style={{ backgroundColor: '#17a2b820', borderColor: '#17a2b8' }}>
                    <FaInfoCircle className="me-2" />
                    <strong>Nach der Installation:</strong> Öffnen Sie <code>http://localhost:3000</code> im Browser und wählen Sie Ihre Datenbank aus.
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="modal-footer" style={{ borderTopColor: colors.cardBorder }}>
            {showInstructions && getTestButtonText() && (
              <button
                className="btn btn-outline-primary me-2"
                onClick={onRestartTest}
                style={{
                  borderColor: colors.accent,
                  color: colors.accent
                }}
              >
                {getTestButtonText()}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{
                backgroundColor: colors.cardBorder,
                borderColor: colors.cardBorder,
                color: colors.text
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DockerSetupModal;
