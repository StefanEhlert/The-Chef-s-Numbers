import React, { useState } from 'react';
import { FaTimes as FaClose, FaDownload, FaInfoCircle, FaCheck, FaExclamationTriangle, FaDocker, FaServer, FaCopy } from 'react-icons/fa';
import { dockerComposeGenerator, DockerComposeConfig } from '../services/dockerComposeGenerator';

interface DockerSetupModalProps {
  show: boolean;
  onClose: () => void;
  onRestartTest: () => void;
  colors: any;
  dockerConfig: DockerComposeConfig;
  serviceType?: 'postgresql' | 'mariadb' | 'mysql' | 'minio' | 'all';
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
      case 'minio':
        return {
          title: 'MinIO Object Storage Setup',
          description: 'MinIO Object Storage Container',
          services: ['MinIO'],
          filename: 'docker-compose-minio.yml',
          icon: '📦'
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

  // Service-spezifischer Button-Text
  const getTestButtonText = () => {
    switch (serviceType) {
      case 'postgresql':
        return 'PostgreSQL-Verbindungstest erneut starten';
      case 'mariadb':
        return 'MariaDB-Verbindungstest erneut starten';
      case 'mysql':
        return 'MySQL-Verbindungstest erneut starten';
      case 'minio':
        return 'MinIO-Verbindungstest erneut starten';
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
    } else if (serviceType === 'minio') {
      const result = await dockerComposeGenerator.generateServiceSpecificCompose('minio', dockerConfig);
      dockerComposeContent = result.content;
      filename = result.filename;
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
      } else if (serviceType === 'minio') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('minio', dockerConfig);
        dockerComposeContent = result.content;
        filename = result.filename;
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
      } else if (serviceType === 'minio') {
        const result = await dockerComposeGenerator.generateServiceSpecificCompose('minio', dockerConfig);
        dockerComposeContent = result.content;
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
                          <li>Navigieren Sie zum Ordner mit der heruntergeladenen Datei</li>
                          <li>Führen Sie aus: <code>docker-compose up -d</code></li>
                          <li>Warten Sie bis alle Container gestartet sind</li>
                          <li>Prüfen Sie mit: <code>docker-compose ps</code></li>
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
                          {serviceType === 'minio' && (
                            <>
                              <li>MinIO API wird auf Port {dockerConfig.minio.port} verfügbar sein</li>
                              <li>MinIO Web-UI wird auf Port {dockerConfig.minio.consolePort} verfügbar sein</li>
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
                          <li>Kopieren Sie den Inhalt der {serviceConfig.filename}</li>
                          <li>Fügen Sie ihn in das Web-Editor ein</li>
                          <li>Klicken Sie "Deploy the stack"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-success mt-3" style={{ backgroundColor: colors.accent + '20', borderColor: colors.accent }}>
                  <FaCheck className="me-2" />
                  <strong>Nach der Installation:</strong> Starten Sie den Verbindungstest erneut, um die Datenbank zu konfigurieren.
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer" style={{ borderTopColor: colors.cardBorder }}>
            {showInstructions && (
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
