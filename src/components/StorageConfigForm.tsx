/**
 * StorageConfigForm.tsx
 * Konfigurationsformulare für Storage-Management
 * Ausgelagert aus StorageManagement.tsx für bessere Wartbarkeit
 */

import React, { useState } from 'react';
import { 
  validateHostname, 
  validatePostgreSQLUsername, 
  validatePostgreSQLDatabaseName,
  validatePasswordStrength,
  validateMinIOAccessKey,
  validateMinIOSecretKey,
  validateMinIOBucketName,
  generateSecurePassword,
  generateMinIOSecretKey
} from './ValidationHelpers';
import { 
  pingHost, 
  checkPortAvailability,
  performFullPostgreSQLTest,
  performFullMinIOTest,
  type DatabaseConfig,
  type MinIOConfig
} from './ConnectionTester';
import { StorageSchema } from '../types/storageSchema';

interface StorageConfigFormProps {
  storageSchema: any; // Temporär any verwenden um Interface-Konflikte zu vermeiden
  onUpdateSchema: (updates: any) => void; // Temporär any verwenden
  colors: any;
  onShowMessage: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

/**
 * PostgreSQL-Konfigurationsformular
 */
export const PostgreSQLConfigForm: React.FC<StorageConfigFormProps> = ({ 
  storageSchema, 
  onUpdateSchema, 
  colors, 
  onShowMessage 
}) => {
  const [pingResults, setPingResults] = useState<{[key: string]: any}>({});
  const [portResults, setPortResults] = useState<{[key: string]: any}>({});
  const [pingingHosts, setPingingHosts] = useState<{[key: string]: boolean}>({});
  const [checkingPorts, setCheckingPorts] = useState<{[key: string]: boolean}>({});
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  const updateConnection = (updates: any) => {
    onUpdateSchema({
      connections: {
        ...storageSchema.connections,
        postgres: { ...storageSchema.connections.postgres, ...updates }
      }
    });
  };

  const handlePingHost = async (hostname: string, hostKey: string) => {
    setPingingHosts(prev => ({ ...prev, [hostKey]: true }));
    
    try {
      const result = await pingHost(hostname);
      setPingResults(prev => ({ ...prev, [hostKey]: result }));
      
      // Auto-Hide nach 10 Sekunden
      setTimeout(() => {
        setPingResults(prev => ({ ...prev, [hostKey]: null }));
      }, 10000);
    } catch (error) {
      setPingResults(prev => ({ 
        ...prev, 
        [hostKey]: { success: false, message: 'Ping fehlgeschlagen' } 
      }));
      
      setTimeout(() => {
        setPingResults(prev => ({ ...prev, [hostKey]: null }));
      }, 10000);
    } finally {
      setPingResults(prev => ({ ...prev, [hostKey]: false }));
    }
  };

  const handleCheckPort = async (hostname: string, port: string, portKey: string) => {
    setCheckingPorts(prev => ({ ...prev, [portKey]: true }));
    
    try {
      const result = await checkPortAvailability(hostname, port);
      setPortResults(prev => ({ ...prev, [portKey]: result }));
      
      setTimeout(() => {
        setPortResults(prev => ({ ...prev, [portKey]: null }));
      }, 10000);
    } catch (error) {
      setPortResults(prev => ({ 
        ...prev, 
        [portKey]: { success: false, message: 'Port-Prüfung fehlgeschlagen' } 
      }));
      
      setTimeout(() => {
        setPortResults(prev => ({ ...prev, [portKey]: null }));
      }, 10000);
    } finally {
      setCheckingPorts(prev => ({ ...prev, [portKey]: false }));
    }
  };

  const handleFullConnectionTest = async () => {
    try {
      onShowMessage('Test läuft...', 'PostgreSQL-Verbindungstest wird durchgeführt...', 'info');
      
      const result = await performFullPostgreSQLTest(
        storageSchema.connections.postgres,
        storageSchema.connections.postgrest.port,
        (progress) => console.log(progress)
      );
      
      if (result.success) {
        onShowMessage('Test erfolgreich', result.message, 'success');
      } else {
        onShowMessage('Test fehlgeschlagen', result.message, 'error');
      }
    } catch (error) {
      onShowMessage('Test fehlgeschlagen', `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 'error');
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <div className="card-header" style={{ backgroundColor: colors.header, color: colors.text }}>
              <h5 className="mb-0">
                <i className="fas fa-database me-2"></i>
                PostgreSQL-Konfiguration
              </h5>
            </div>
            <div className="card-body" style={{ color: colors.text }}>
              {/* Host/IP-Adresse */}
              <div className="mb-3">
                <label className="form-label">Host/IP-Adresse</label>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${storageSchema.connections.postgres?.host && !validateHostname(storageSchema.connections.postgres.host).isValid ? 'is-invalid' : ''}`}
                    value={storageSchema.connections.postgres?.host || ''}
                    onChange={(e) => {
                      updateConnection({ host: e.target.value });
                      setPingResults(prev => ({ ...prev, 'postgres-host': null }));
                    }}
                    placeholder="localhost"
                    style={{
                      backgroundColor: !storageSchema.connections.postgres?.host ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => handlePingHost(storageSchema.connections.postgres?.host || '', 'postgres-host')}
                    disabled={!storageSchema.connections.postgres?.host || pingingHosts['postgres-host']}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    {pingingHosts['postgres-host'] ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-wifi"></i>
                    )}
                  </button>
                </div>
                
                {/* Ping-Ergebnis */}
                {pingResults['postgres-host'] && (
                  <div className={`alert ${pingResults['postgres-host'].success ? 'alert-success' : 'alert-danger'} mt-2`}>
                    {pingResults['postgres-host'].message}
                  </div>
                )}
                
                {/* Validierung */}
                {storageSchema.connections.postgres?.host && !validateHostname(storageSchema.connections.postgres.host).isValid && (
                  <div className="invalid-feedback">
                    {validateHostname(storageSchema.connections.postgres.host).message}
                  </div>
                )}
                {storageSchema.connections.postgres?.host && validateHostname(storageSchema.connections.postgres.host).isValid && (
                  <div className="valid-feedback">
                    {validateHostname(storageSchema.connections.postgres.host).message}
                  </div>
                )}
              </div>

              {/* Port */}
              <div className="mb-3">
                <label className="form-label">Port</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={storageSchema.connections.postgres?.port || ''}
                    onChange={(e) => {
                      updateConnection({ port: e.target.value });
                      setPortResults(prev => ({ ...prev, 'postgres-port': null }));
                    }}
                    placeholder="5432"
                    style={{
                      backgroundColor: !storageSchema.connections.postgres?.port ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => handleCheckPort(
                      storageSchema.connections.postgres?.host || '', 
                      storageSchema.connections.postgres?.port || '', 
                      'postgres-port'
                    )}
                    disabled={checkingPorts['postgres-port'] || !storageSchema.connections.postgres?.host || !storageSchema.connections.postgres?.port}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    {checkingPorts['postgres-port'] ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-network-wired"></i>
                    )}
                  </button>
                </div>
                
                {/* Port-Ergebnis */}
                {portResults['postgres-port'] && (
                  <div className={`alert ${portResults['postgres-port'].success ? 'alert-success' : 'alert-danger'} mt-2`}>
                    {portResults['postgres-port'].message}
                  </div>
                )}
              </div>

              {/* PostgREST Port */}
              <div className="mb-3">
                <label className="form-label">PostgREST Port</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={storageSchema.connections.postgrest?.port || ''}
                    onChange={(e) => {
                      onUpdateSchema({
                        connections: {
                          ...storageSchema.connections,
                          postgrest: { port: e.target.value }
                        }
                      });
                      setPortResults(prev => ({ ...prev, 'postgrest-port': null }));
                    }}
                    placeholder="3000"
                    style={{
                      backgroundColor: !storageSchema.connections.postgrest?.port ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => handleCheckPort(
                      storageSchema.connections.postgres?.host || '', 
                      storageSchema.connections.postgrest?.port || '', 
                      'postgrest-port'
                    )}
                    disabled={checkingPorts['postgrest-port'] || !storageSchema.connections.postgres?.host || !storageSchema.connections.postgrest?.port}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    {checkingPorts['postgrest-port'] ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-network-wired"></i>
                    )}
                  </button>
                </div>
                
                {/* Port-Ergebnis */}
                {portResults['postgrest-port'] && (
                  <div className={`alert ${portResults['postgrest-port'].success ? 'alert-success' : 'alert-danger'} mt-2`}>
                    {portResults['postgrest-port'].message}
                  </div>
                )}
              </div>

              {/* Benutzername */}
              <div className="mb-3">
                <label className="form-label">Benutzername</label>
                <input
                  type="text"
                  className={`form-control ${storageSchema.connections.postgres?.username && !validatePostgreSQLUsername(storageSchema.connections.postgres.username).isValid ? 'is-invalid' : ''}`}
                  value={storageSchema.connections.postgres?.username || ''}
                  onChange={(e) => updateConnection({ username: e.target.value })}
                  placeholder="postgres"
                  style={{
                    backgroundColor: !storageSchema.connections.postgres?.username ? colors.accent + '20' : undefined,
                    border: `1px solid ${colors.cardBorder}`
                  }}
                />
                {storageSchema.connections.postgres?.username && !validatePostgreSQLUsername(storageSchema.connections.postgres.username).isValid && (
                  <div className="invalid-feedback">
                    {validatePostgreSQLUsername(storageSchema.connections.postgres.username).message}
                  </div>
                )}
                {storageSchema.connections.postgres?.username && validatePostgreSQLUsername(storageSchema.connections.postgres.username).isValid && (
                  <div className="valid-feedback">
                    {validatePostgreSQLUsername(storageSchema.connections.postgres.username).message}
                  </div>
                )}
              </div>

              {/* Datenbankname */}
              <div className="mb-3">
                <label className="form-label">Datenbankname</label>
                <input
                  type="text"
                  className={`form-control ${storageSchema.connections.postgres?.database && !validatePostgreSQLDatabaseName(storageSchema.connections.postgres.database).isValid ? 'is-invalid' : ''}`}
                  value={storageSchema.connections.postgres?.database || ''}
                  onChange={(e) => updateConnection({ database: e.target.value })}
                  placeholder="chef_numbers"
                  style={{
                    backgroundColor: !storageSchema.connections.postgres?.database ? colors.accent + '20' : undefined,
                    border: `1px solid ${colors.cardBorder}`
                  }}
                />
                {storageSchema.connections.postgres?.database && !validatePostgreSQLDatabaseName(storageSchema.connections.postgres.database).isValid && (
                  <div className="invalid-feedback">
                    {validatePostgreSQLDatabaseName(storageSchema.connections.postgres.database).message}
                  </div>
                )}
                {storageSchema.connections.postgres?.database && validatePostgreSQLDatabaseName(storageSchema.connections.postgres.database).isValid && (
                  <div className="valid-feedback">
                    {validatePostgreSQLDatabaseName(storageSchema.connections.postgres.database).message}
                  </div>
                )}
              </div>

              {/* Passwort */}
              <div className="mb-3">
                <label className="form-label">Passwort</label>
                <div className="input-group">
                  <input
                    type={showPasswords['postgres-password'] ? 'text' : 'password'}
                    className="form-control"
                    value={storageSchema.connections.postgres?.password || ''}
                    onChange={(e) => updateConnection({ password: e.target.value })}
                    placeholder="Passwort eingeben"
                    style={{
                      backgroundColor: !storageSchema.connections.postgres?.password ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, 'postgres-password': !prev['postgres-password'] }))}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    <i className={`fas ${showPasswords['postgres-password'] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => updateConnection({ password: generateSecurePassword() })}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    <i className="fas fa-dice"></i>
                  </button>
                </div>
                
                {/* Passwort-Stärke */}
                {storageSchema.connections.postgres?.password && (
                  <div className="mt-2">
                    {(() => {
                      const validation = validatePasswordStrength(storageSchema.connections.postgres.password);
                      const strengthClass = validation.strength === 'strong' ? 'success' : 
                                          validation.strength === 'medium' ? 'warning' : 'danger';
                      return (
                        <div className={`alert alert-${strengthClass} mb-0`}>
                          <small>{validation.message}</small>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Verbindungstest */}
              <div className="mb-3">
                <button
                  className="btn btn-primary"
                  onClick={handleFullConnectionTest}
                  style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
                >
                  <i className="fas fa-plug me-2"></i>
                  Verbindung testen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MinIO-Konfigurationsformular
 */
export const MinIOConfigForm: React.FC<StorageConfigFormProps> = ({ 
  storageSchema, 
  onUpdateSchema, 
  colors, 
  onShowMessage 
}) => {
  const [pingResults, setPingResults] = useState<{[key: string]: any}>({});
  const [portResults, setPortResults] = useState<{[key: string]: any}>({});
  const [pingingHosts, setPingingHosts] = useState<{[key: string]: boolean}>({});
  const [checkingPorts, setCheckingPorts] = useState<{[key: string]: boolean}>({});
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  const updateConnection = (updates: any) => {
    onUpdateSchema({
      connections: {
        ...storageSchema.connections,
        minio: { ...storageSchema.connections.minio, ...updates }
      }
    });
  };

  const handlePingHost = async (hostname: string, hostKey: string) => {
    setPingingHosts(prev => ({ ...prev, [hostKey]: true }));
    
    try {
      const result = await pingHost(hostname);
      setPingResults(prev => ({ ...prev, [hostKey]: result }));
      
      setTimeout(() => {
        setPingResults(prev => ({ ...prev, [hostKey]: null }));
      }, 10000);
    } catch (error) {
      setPingResults(prev => ({ 
        ...prev, 
        [hostKey]: { success: false, message: 'Ping fehlgeschlagen' } 
      }));
      
      setTimeout(() => {
        setPingResults(prev => ({ ...prev, [hostKey]: null }));
      }, 10000);
    } finally {
      setPingResults(prev => ({ ...prev, [hostKey]: false }));
    }
  };

  const handleCheckPort = async (hostname: string, port: string, portKey: string) => {
    setCheckingPorts(prev => ({ ...prev, [portKey]: true }));
    
    try {
      const result = await checkPortAvailability(hostname, port);
      setPortResults(prev => ({ ...prev, [portKey]: result }));
      
      setTimeout(() => {
        setPortResults(prev => ({ ...prev, [portKey]: null }));
      }, 10000);
    } catch (error) {
      setPortResults(prev => ({ 
        ...prev, 
        [portKey]: { success: false, message: 'Port-Prüfung fehlgeschlagen' } 
      }));
      
      setTimeout(() => {
        setPortResults(prev => ({ ...prev, [portKey]: null }));
      }, 10000);
    } finally {
      setCheckingPorts(prev => ({ ...prev, [portKey]: false }));
    }
  };

  const handleFullConnectionTest = async () => {
    try {
      onShowMessage('Test läuft...', 'MinIO-Verbindungstest wird durchgeführt...', 'info');
      
      const result = await performFullMinIOTest(
        storageSchema.connections.minio,
        (progress) => console.log(progress)
      );
      
      if (result.success) {
        onShowMessage('Test erfolgreich', result.message, 'success');
      } else {
        onShowMessage('Test fehlgeschlagen', result.message, 'error');
      }
    } catch (error) {
      onShowMessage('Test fehlgeschlagen', `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 'error');
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <div className="card-header" style={{ backgroundColor: colors.header, color: colors.text }}>
              <h5 className="mb-0">
                <i className="fas fa-hdd me-2"></i>
                MinIO-Konfiguration
              </h5>
            </div>
            <div className="card-body" style={{ color: colors.text }}>
              {/* Host/IP-Adresse */}
              <div className="mb-3">
                <label className="form-label">Host/IP-Adresse</label>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${storageSchema.connections.minio?.host && !validateHostname(storageSchema.connections.minio.host).isValid ? 'is-invalid' : ''}`}
                    value={storageSchema.connections.minio?.host || ''}
                    onChange={(e) => {
                      updateConnection({ host: e.target.value });
                      setPingResults(prev => ({ ...prev, 'minio-host': null }));
                    }}
                    placeholder="localhost"
                    style={{
                      backgroundColor: !storageSchema.connections.minio?.host ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => handlePingHost(storageSchema.connections.minio?.host || '', 'minio-host')}
                    disabled={!storageSchema.connections.minio?.host || pingingHosts['minio-host']}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    {pingingHosts['minio-host'] ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-wifi"></i>
                    )}
                  </button>
                </div>
                
                {/* Ping-Ergebnis */}
                {pingResults['minio-host'] && (
                  <div className={`alert ${pingResults['minio-host'].success ? 'alert-success' : 'alert-danger'} mt-2`}>
                    {pingResults['minio-host'].message}
                  </div>
                )}
                
                {/* Validierung */}
                {storageSchema.connections.minio?.host && !validateHostname(storageSchema.connections.minio.host).isValid && (
                  <div className="invalid-feedback">
                    {validateHostname(storageSchema.connections.minio.host).message}
                  </div>
                )}
                {storageSchema.connections.minio?.host && validateHostname(storageSchema.connections.minio.host).isValid && (
                  <div className="valid-feedback">
                    {validateHostname(storageSchema.connections.minio.host).message}
                  </div>
                )}
              </div>

              {/* Port */}
              <div className="mb-3">
                <label className="form-label">Port</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={storageSchema.connections.minio?.port || ''}
                    onChange={(e) => {
                      updateConnection({ port: e.target.value });
                      setPortResults(prev => ({ ...prev, 'minio-port': null }));
                    }}
                    placeholder="9000"
                    style={{
                      backgroundColor: !storageSchema.connections.minio?.port ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => handleCheckPort(
                      storageSchema.connections.minio?.host || '', 
                      storageSchema.connections.minio?.port || '', 
                      'minio-port'
                    )}
                    disabled={checkingPorts['minio-port'] || !storageSchema.connections.minio?.host || !storageSchema.connections.minio?.port}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    {checkingPorts['minio-port'] ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-network-wired"></i>
                    )}
                  </button>
                </div>
                
                {/* Port-Ergebnis */}
                {portResults['minio-port'] && (
                  <div className={`alert ${portResults['minio-port'].success ? 'alert-success' : 'alert-danger'} mt-2`}>
                    {portResults['minio-port'].message}
                  </div>
                )}
              </div>

              {/* Console Port */}
              <div className="mb-3">
                <label className="form-label">Console Port</label>
                <input
                  type="text"
                  className="form-control"
                  value={storageSchema.connections.minio?.consolePort || ''}
                  onChange={(e) => updateConnection({ consolePort: e.target.value })}
                  placeholder="9001"
                  style={{
                    backgroundColor: !storageSchema.connections.minio?.consolePort ? colors.accent + '20' : undefined,
                    border: `1px solid ${colors.cardBorder}`
                  }}
                />
              </div>

              {/* Access Key */}
              <div className="mb-3">
                <label className="form-label">Access Key</label>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${storageSchema.connections.minio?.accessKey && !validateMinIOAccessKey(storageSchema.connections.minio.accessKey).isValid ? 'is-invalid' : ''}`}
                    value={storageSchema.connections.minio?.accessKey || ''}
                    onChange={(e) => updateConnection({ accessKey: e.target.value })}
                    placeholder="Access Key eingeben"
                    style={{
                      backgroundColor: !storageSchema.connections.minio?.accessKey ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => updateConnection({ accessKey: 'chef_access_key' })}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    <i className="fas fa-key"></i>
                  </button>
                </div>
                {storageSchema.connections.minio?.accessKey && !validateMinIOAccessKey(storageSchema.connections.minio.accessKey).isValid && (
                  <div className="invalid-feedback">
                    {validateMinIOAccessKey(storageSchema.connections.minio.accessKey).message}
                  </div>
                )}
                {storageSchema.connections.minio?.accessKey && validateMinIOAccessKey(storageSchema.connections.minio.accessKey).isValid && (
                  <div className="valid-feedback">
                    {validateMinIOAccessKey(storageSchema.connections.minio.accessKey).message}
                  </div>
                )}
              </div>

              {/* Secret Key */}
              <div className="mb-3">
                <label className="form-label">Secret Key</label>
                <div className="input-group">
                  <input
                    type={showPasswords['minio-secret'] ? 'text' : 'password'}
                    className={`form-control ${storageSchema.connections.minio?.secretKey && !validateMinIOSecretKey(storageSchema.connections.minio.secretKey).isValid ? 'is-invalid' : ''}`}
                    value={storageSchema.connections.minio?.secretKey || ''}
                    onChange={(e) => updateConnection({ secretKey: e.target.value })}
                    placeholder="Secret Key eingeben"
                    style={{
                      backgroundColor: !storageSchema.connections.minio?.secretKey ? colors.accent + '20' : undefined,
                      border: `1px solid ${colors.cardBorder}`
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, 'minio-secret': !prev['minio-secret'] }))}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    <i className={`fas ${showPasswords['minio-secret'] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => updateConnection({ secretKey: generateMinIOSecretKey() })}
                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                  >
                    <i className="fas fa-dice"></i>
                  </button>
                </div>
                {storageSchema.connections.minio?.secretKey && !validateMinIOSecretKey(storageSchema.connections.minio.secretKey).isValid && (
                  <div className="invalid-feedback">
                    {validateMinIOSecretKey(storageSchema.connections.minio.secretKey).message}
                  </div>
                )}
                {storageSchema.connections.minio?.secretKey && validateMinIOSecretKey(storageSchema.connections.minio.secretKey).isValid && (
                  <div className="valid-feedback">
                    {validateMinIOSecretKey(storageSchema.connections.minio.secretKey).message}
                  </div>
                )}
              </div>

              {/* Bucket Name */}
              <div className="mb-3">
                <label className="form-label">Bucket Name</label>
                <input
                  type="text"
                  className={`form-control ${storageSchema.connections.minio?.bucket && !validateMinIOBucketName(storageSchema.connections.minio.bucket).isValid ? 'is-invalid' : ''}`}
                  value={storageSchema.connections.minio?.bucket || ''}
                  onChange={(e) => updateConnection({ bucket: e.target.value })}
                  placeholder="chef-images"
                  style={{
                    backgroundColor: !storageSchema.connections.minio?.bucket ? colors.accent + '20' : undefined,
                    border: `1px solid ${colors.cardBorder}`
                  }}
                />
                {storageSchema.connections.minio?.bucket && !validateMinIOBucketName(storageSchema.connections.minio.bucket).isValid && (
                  <div className="invalid-feedback">
                    {validateMinIOBucketName(storageSchema.connections.minio.bucket).message}
                  </div>
                )}
                {storageSchema.connections.minio?.bucket && validateMinIOBucketName(storageSchema.connections.minio.bucket).isValid && (
                  <div className="valid-feedback">
                    {validateMinIOBucketName(storageSchema.connections.minio.bucket).message}
                  </div>
                )}
              </div>

              {/* Verbindungstest */}
              <div className="mb-3">
                <button
                  className="btn btn-primary"
                  onClick={handleFullConnectionTest}
                  style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
                >
                  <i className="fas fa-plug me-2"></i>
                  Verbindung testen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
