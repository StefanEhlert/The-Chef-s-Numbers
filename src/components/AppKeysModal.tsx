/**
 * AppKeysModal.tsx
 * Modal für App-Keys Export/Import
 * Ermöglicht die Weitergabe von Datenbank-Konfigurationen und Grundeinstellungen
 */

import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaKey, FaDatabase, FaBrain, FaCheckCircle, FaDownload, FaUpload, FaEye, FaEyeSlash, FaSpinner, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import { AppKeysConfigItem, AppKeysExportData, EncryptedAppKeysFile } from '../types/appKeys';
import { getAvailableConfigItems } from '../utils/appKeysHelpers';
import { encryptData, decryptData } from '../utils/appKeysEncryption';

interface AppKeysModalProps {
  show: boolean;
  onClose: () => void;
  colors: any;
  storageManagement: any;
}

const AppKeysModal: React.FC<AppKeysModalProps> = ({
  show,
  onClose,
  colors,
  storageManagement
}) => {
  const [configItems, setConfigItems] = useState<AppKeysConfigItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [mode, setMode] = useState<'select' | 'export' | 'import'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lade verfügbare Konfigurations-Items beim Öffnen des Modals
  useEffect(() => {
    if (show) {
      loadConfigItems();
    }
  }, [show]);

  // Lade Konfigurations-Items
  const loadConfigItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Lade localOptions
      const localOptionsStr = localStorage.getItem('localOptions');
      const localOptions = localOptionsStr ? JSON.parse(localOptionsStr) : null;

      // Hole verfügbare Items (OCR-Configs werden jetzt direkt aus localOptions geladen, accountingSettings nicht mehr benötigt)
      const items = await getAvailableConfigItems(storageManagement, null, localOptions);
      setConfigItems(items);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('❌ Fehler beim Laden der Konfigurations-Items:', error);
      setError('Fehler beim Laden der Konfigurations-Items: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Item-Auswahl
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Toggle Alle auswählen/abwählen
  const toggleAllSelection = () => {
    if (selectedItems.size === configItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(configItems.map(item => item.id)));
    }
  };

  // Export-Funktion
  const handleExport = async () => {
    if (selectedItems.size === 0) {
      setError('Bitte wählen Sie mindestens eine Konfiguration aus.');
      return;
    }

    if (!password) {
      setError('Bitte geben Sie ein Passwort ein.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Erstelle Export-Daten
      const exportData: AppKeysExportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          databases: {},
          ocrApis: {},
          appSettings: {}
        }
      };

      // Sammle Daten für ausgewählte Items
      const selectedItemsArray = Array.from(selectedItems);
      
      // Mappe currentDataStorage zu Datenbank-ID
      const dataStorageToDbId: Record<string, string> = {
        'PostgreSQL': 'postgresql',
        'MariaDB': 'mariadb',
        'MySQL': 'mysql',
        'CouchDB': 'couchdb',
        'Supabase': 'supabase',
        'Firebase': 'firebase'
      };
      
      // Prüfe welche Datenbank aktuell aktiv ist (currentStorage)
      const currentDataStorage = storageManagement?.currentStorage?.currentDataStorage;
      const currentStorageMode = storageManagement?.currentStorage?.currentStorageMode;
      const currentPictureStorage = storageManagement?.currentStorage?.currentPictureStorage;
      const isActive = storageManagement?.currentStorage?.isActive;
      
      // Markiere aktive Datenbank, wenn sie in den ausgewählten Items enthalten ist
      if (isActive && currentDataStorage && dataStorageToDbId[currentDataStorage]) {
        const activeDbId = dataStorageToDbId[currentDataStorage];
        if (selectedItems.has(activeDbId)) {
          exportData.activeDatabase = activeDbId;
          exportData.activeStorageMode = currentStorageMode;
          exportData.activePictureStorage = currentPictureStorage;
        }
      }
      
      for (const itemId of selectedItemsArray) {
        const item = configItems.find(i => i.id === itemId);
        if (!item) continue;

        if (item.type === 'database') {
          if (!exportData.data.databases) {
            exportData.data.databases = {};
          }
          const dbKey = item.id as keyof typeof exportData.data.databases;
          exportData.data.databases[dbKey] = item.data;
        } else if (item.type === 'ocrApi') {
          if (!exportData.data.ocrApis) {
            exportData.data.ocrApis = {};
          }
          if (item.provider) {
            exportData.data.ocrApis[item.provider] = item.data;
          }
        } else if (item.type === 'appSettings') {
          exportData.data.appSettings = {
            localOptions: item.data
          };
        }
      }

      // Verschlüssele Daten
      const jsonData = JSON.stringify(exportData);
      const { encrypted, salt, iv } = await encryptData(jsonData, password);

      // Erstelle verschlüsselte Datei
      const encryptedFile: EncryptedAppKeysFile = {
        version: '1.0.0',
        encrypted,
        salt,
        iv
      };

      // Erstelle Blob und Download
      const blob = new Blob([JSON.stringify(encryptedFile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `chef-numbers-app-keys-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('App-Keys erfolgreich exportiert!');
      setPassword('');
      setConfirmPassword('');
      
      // Schließe Modal nach kurzer Verzögerung
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('❌ Fehler beim Export:', error);
      setError('Fehler beim Export: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };

  // Import-Funktion
  const handleImport = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    if (!importPassword) {
      setError('Bitte geben Sie das Passwort ein.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const file = fileInputRef.current.files[0];
      const fileText = await file.text();
      const encryptedFile: EncryptedAppKeysFile = JSON.parse(fileText);

      // Entschlüssele Daten
      const decryptedJson = await decryptData(
        encryptedFile.encrypted,
        importPassword,
        encryptedFile.salt,
        encryptedFile.iv
      );
      const exportData: AppKeysExportData = JSON.parse(decryptedJson);

      // Importiere Daten
      const updates: any = {
        connections: {}
      };

      // Datenbank-Konfigurationen
      if (exportData.data.databases) {
        const databases = exportData.data.databases;
        
        if (databases.postgresql) {
          updates.connections.postgres = databases.postgresql;
        }
        if (databases.mariadb) {
          updates.connections.mariadb = databases.mariadb;
        }
        if (databases.mysql) {
          updates.connections.mysql = databases.mysql;
        }
        if (databases.couchdb) {
          updates.connections.couchdb = databases.couchdb;
        }
        if (databases.supabase) {
          updates.connections.supabase = databases.supabase;
        }
        if (databases.firebase) {
          updates.connections.firebase = databases.firebase;
        }
      }

      // Speichere storageManagement
      const currentStorageManagement = JSON.parse(localStorage.getItem('storageManagement') || '{}');
      const mergedConnections = {
        ...currentStorageManagement.connections,
        ...(Object.keys(updates.connections).length > 0 ? updates.connections : {})
      };
      
      let newStorageManagement = {
        ...currentStorageManagement,
        connections: mergedConnections
      };
      
      // Prüfe ob eine aktive Datenbank im Export markiert war
      if (exportData.activeDatabase && exportData.activeStorageMode && exportData.activePictureStorage) {
        // Mappe Datenbank-ID zurück zu currentDataStorage
        const dbIdToDataStorage: Record<string, string> = {
          'postgresql': 'PostgreSQL',
          'mariadb': 'MariaDB',
          'mysql': 'MySQL',
          'couchdb': 'CouchDB',
          'supabase': 'Supabase',
          'firebase': 'Firebase'
        };
        
        const activeDataStorage = dbIdToDataStorage[exportData.activeDatabase];
        
        // Mappe Datenbank-ID zu Connection-Key (postgresql -> postgres)
        const dbIdToConnectionKey: Record<string, string> = {
          'postgresql': 'postgres',
          'mariadb': 'mariadb',
          'mysql': 'mysql',
          'couchdb': 'couchdb',
          'supabase': 'supabase',
          'firebase': 'firebase'
        };
        
        const connectionKey = dbIdToConnectionKey[exportData.activeDatabase];
        if (activeDataStorage && connectionKey && updates.connections[connectionKey]) {
          // Erstelle activeConnections Snapshot
          const activeConnections: any = {};
          
          // Datenbank-Verbindung
          activeConnections[connectionKey] = updates.connections[connectionKey];
          
          // Bildspeicher-Verbindung
          if (exportData.activePictureStorage === 'MinIO' && updates.connections.minio) {
            activeConnections.minio = updates.connections.minio;
          } else if (exportData.activePictureStorage === 'Supabase' && activeConnections.supabase) {
            // Supabase wird bereits oben gesetzt
          } else if (exportData.activePictureStorage === 'Firebase' && activeConnections.firebase) {
            // Firebase wird bereits oben gesetzt
          }
          
          // Bestimme Cloud-Type basierend auf Datenbank
          let activeCloudType: 'docker' | 'supabase' | 'firebase' | 'none' = 'none';
          if (exportData.activeStorageMode === 'cloud') {
            if (exportData.activeDatabase === 'supabase') {
              activeCloudType = 'supabase';
            } else if (exportData.activeDatabase === 'firebase') {
              activeCloudType = 'firebase';
            } else if (['postgresql', 'mariadb', 'mysql', 'couchdb'].includes(exportData.activeDatabase)) {
              activeCloudType = 'docker';
            }
          }
          
          // Setze currentStorage
          newStorageManagement.currentStorage = {
            currentStorageMode: exportData.activeStorageMode,
            currentCloudType: activeCloudType,
            currentDataStorage: activeDataStorage as any,
            currentPictureStorage: exportData.activePictureStorage as any,
            isActive: true,
            activeConnections: activeConnections
          };
          
          // Setze auch selectedStorage entsprechend
          newStorageManagement.selectedStorage = {
            ...(newStorageManagement.selectedStorage || {}),
            selectedStorageMode: exportData.activeStorageMode,
            selectedCloudType: activeCloudType,
            selectedDataStorage: activeDataStorage as any,
            selectedPictureStorage: exportData.activePictureStorage as any,
            isTested: true
          };
          
          console.log('✅ Aktive Datenbank als currentStorage gesetzt:', exportData.activeDatabase);
        }
      }
      
      if (Object.keys(updates.connections).length > 0 || newStorageManagement.currentStorage) {
        localStorage.setItem('storageManagement', JSON.stringify(newStorageManagement));
      }

      // OCR-API-Konfigurationen - speichere in localOptions/KI-Provider
      if (exportData.data.ocrApis && Object.keys(exportData.data.ocrApis).length > 0) {
        const { loadKIProviderConfigs, saveKIProviderConfigs } = await import('../utils/kiProviderConfig');
        
        const existingOcrConfigs = loadKIProviderConfigs();
        const importedOcrConfigs = Object.values(exportData.data.ocrApis);
        
        // Merge OCR-Configs (ersetze bestehende mit gleichem Provider)
        const mergedOcrConfigs = [...existingOcrConfigs];
        for (const importedConfig of importedOcrConfigs) {
          const existingIndex = mergedOcrConfigs.findIndex(c => c.provider === importedConfig.provider);
          if (existingIndex >= 0) {
            mergedOcrConfigs[existingIndex] = importedConfig;
          } else {
            mergedOcrConfigs.push(importedConfig);
          }
        }

        saveKIProviderConfigs(mergedOcrConfigs);
      }

      // App-Einstellungen
      if (exportData.data.appSettings?.localOptions) {
        const currentLocalOptionsStr = localStorage.getItem('localOptions');
        const currentLocalOptions = currentLocalOptionsStr ? JSON.parse(currentLocalOptionsStr) : {};
        const mergedLocalOptions = {
          ...currentLocalOptions,
          ...exportData.data.appSettings.localOptions
        };
        localStorage.setItem('localOptions', JSON.stringify(mergedLocalOptions));
      }

      setSuccess('App-Keys erfolgreich importiert! Die Seite wird automatisch neu geladen...');
      setImportPassword('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Schließe Modal und führe Reload durch
      setTimeout(() => {
        handleReset();
        onClose();
        // Automatisches Reload nach kurzer Verzögerung
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }, 1000);
    } catch (error) {
      console.error('❌ Fehler beim Import:', error);
      if (error instanceof Error && error.message.includes('Falsches Passwort')) {
        setError('Falsches Passwort oder beschädigte Datei.');
      } else {
        setError('Fehler beim Import: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset-Modus
  const handleReset = () => {
    setMode('select');
    setPassword('');
    setConfirmPassword('');
    setImportPassword('');
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Icon für Item-Typ
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <FaDatabase className="me-2" style={{ color: colors.accent }} />;
      case 'ocrApi':
        return <FaBrain className="me-2" style={{ color: colors.accent }} />;
      case 'appSettings':
        return <FaCheckCircle className="me-2" style={{ color: colors.accent }} />;
      default:
        return null;
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-full"
      style={{
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1060,
        top: 56,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          backgroundColor: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          maxWidth: '800px',
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary, borderBottom: `1px solid ${colors.cardBorder}` }}>
          <h5 className="mb-0 form-label-themed d-flex align-items-center" style={{ flex: 1, color: colors.text }}>
            <FaKey className="me-2" style={{ color: colors.accent }} />
            App-Keys
          </h5>
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={onClose}
            style={{ color: colors.text, textDecoration: 'none', flexShrink: 0, marginLeft: 'auto' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="card-body" style={{ color: colors.text, overflowY: 'auto', maxHeight: 'calc(90vh - 180px)', padding: '1.5rem' }}>
          {isLoading && (
            <div className="text-center mb-3">
              <FaSpinner className="fa-spin me-2" style={{ color: colors.accent }} />
              <span>Lade Konfigurationen...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-3" style={{ backgroundColor: '#f8d7da', borderColor: '#f5c6cb', color: '#721c24' }}>
              <FaExclamationTriangle className="me-2" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success d-flex align-items-center mb-3" style={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb', color: '#155724' }}>
              <FaCheckCircle className="me-2" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'select' && (
            <>
              <div className="mb-3">
                <p style={{ color: colors.textSecondary, marginBottom: '1rem' }}>
                  Wählen Sie die Konfigurationen aus, die Sie exportieren möchten. Nur vollständige Konfigurationen werden angezeigt.
                </p>
                
                {configItems.length === 0 && !isLoading && (
                  <div className="alert alert-info" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                    <FaExclamationTriangle className="me-2" />
                    Keine vollständigen Konfigurationen gefunden.
                  </div>
                )}

                {configItems.length > 0 && (
                  <>
                    <div className="mb-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={toggleAllSelection}
                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                      >
                        {selectedItems.size === configItems.length ? 'Alle abwählen' : 'Alle auswählen'}
                      </button>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {configItems.map((item) => (
                        <div
                          key={item.id}
                          className="d-flex align-items-center mb-2 p-2 rounded"
                          style={{
                            backgroundColor: selectedItems.has(item.id) ? colors.accent + '20' : colors.secondary,
                            border: `1px solid ${selectedItems.has(item.id) ? colors.accent : colors.cardBorder}`,
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleItemSelection(item.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                          />
                          {getItemIcon(item.type)}
                          <span style={{ flex: 1, color: colors.text }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="d-flex gap-2 justify-content-between mt-4">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setMode('import')}
                    disabled={isLoading}
                    style={{ borderColor: colors.accent, color: colors.accent }}
                  >
                    <FaUpload className="me-2" />
                    Schlüssel einlesen
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setMode('export')}
                    disabled={selectedItems.size === 0 || isLoading}
                    style={{
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                      color: '#fff',
                      opacity: selectedItems.size === 0 ? 0.5 : 1
                    }}
                  >
                    <FaDownload className="me-2" />
                    Schlüssel erzeugen
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  style={{ borderColor: colors.cardBorder, color: colors.text }}
                >
                  Abbrechen
                </button>
              </div>
            </>
          )}

          {mode === 'export' && (
            <>
              <div className="mb-3">
                <h6 style={{ color: colors.text, marginBottom: '1rem' }}>Passwort für Verschlüsselung</h6>
                <div className="mb-3">
                  <label className="form-label" style={{ color: colors.text }}>
                    Passwort (mindestens 8 Zeichen)
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        color: colors.text
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ borderColor: colors.cardBorder, color: colors.text }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: colors.text }}>
                    Passwort bestätigen
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        color: colors.text
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ borderColor: colors.cardBorder, color: colors.text }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-between">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExport}
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword || password.length < 8}
                  style={{
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                    color: '#fff',
                    opacity: (!password || !confirmPassword || password !== confirmPassword || password.length < 8) ? 0.5 : 1
                  }}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Exportiere...
                    </>
                  ) : (
                    <>
                      <FaDownload className="me-2" />
                      Exportieren
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                  style={{ borderColor: colors.cardBorder, color: colors.text }}
                >
                  Zurück
                </button>
              </div>
            </>
          )}

          {mode === 'import' && (
            <>
              <div className="mb-3">
                <h6 style={{ color: colors.text, marginBottom: '1rem' }}>Datei auswählen und Passwort eingeben</h6>
                <div className="mb-3">
                  <label className="form-label" style={{ color: colors.text }}>
                    App-Keys Datei
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control"
                    accept=".json"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: colors.text }}>
                    Passwort
                  </label>
                  <div className="input-group">
                    <input
                      type={showImportPassword ? 'text' : 'password'}
                      className="form-control"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        color: colors.text
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowImportPassword(!showImportPassword)}
                      style={{ borderColor: colors.cardBorder, color: colors.text }}
                    >
                      {showImportPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-between">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={isLoading || !importPassword || !fileInputRef.current?.files?.[0]}
                  style={{
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                    color: '#fff',
                    opacity: (!importPassword || !fileInputRef.current?.files?.[0]) ? 0.5 : 1
                  }}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Importiere...
                    </>
                  ) : (
                    <>
                      <FaUpload className="me-2" />
                      Importieren
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                  style={{ borderColor: colors.cardBorder, color: colors.text }}
                >
                  Zurück
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppKeysModal;
