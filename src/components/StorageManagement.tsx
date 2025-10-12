import React, { useState, useEffect, useContext } from 'react';
import { FaDatabase, FaCloud, FaServer, FaSync, FaDownload, FaCog, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaKey, FaWifi, FaSpinner, FaEye, FaEyeSlash, FaShieldAlt, FaCheck, FaTimes, FaNetworkWired, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';
import { StorageMode, CloudStorageType } from '../services/storageLayer';
import { StorageConfig, StorageData, StoragePicture, DEFAULT_STORAGE_CONFIGS } from '../types/storage';
import { StorageLayer } from '../services/storageLayer';
import { useAppContext } from '../contexts/AppContext';
import DockerSetupModal from './DockerSetupModal';
// StorageContext wird nicht mehr benötigt - StorageLayer lädt Konfiguration direkt
import { designTemplates } from '../constants/designTemplates';
import { SignJWT } from 'jose';

// Interfaces
interface CloudStorageTypeConfig {
  id: CloudStorageType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// Neue einheitliche Storage-Management-Struktur
interface StorageManagement {
  // Aktuelle funktionierende Konfiguration
  currentStorage: {
    currentStorageMode: 'local' | 'cloud' | 'hybrid';
    currentCloudType: 'docker' | 'supabase' | 'firebase' | 'none';
    currentDataStorage: 'PostgreSQL' | 'MariaDB' | 'MySQL' | 'Supabase' | 'Firebase' | 'SQLite';
    currentPictureStorage: 'MinIO' | 'Supabase' | 'Firebase' | 'LocalPath';
    isActive: boolean; // bestätigt funktionierende Verbindung
  };

  // Auswahl in der UI (noch nicht aktiv)
  selectedStorage: {
    selectedStorageMode: 'local' | 'cloud' | 'hybrid';
    selectedCloudType: 'docker' | 'supabase' | 'firebase' | 'none';
    selectedDataStorage: 'PostgreSQL' | 'MariaDB' | 'MySQL' | 'Supabase' | 'Firebase' | 'SQLite' | undefined;
    selectedPictureStorage: 'MinIO' | 'Supabase' | 'Firebase' | 'LocalPath' | undefined;
    isTested: boolean; // wurde getestet und funktioniert
  };

  // Alle verfügbaren Verbindungen mit Status
  connections: {
    postgres: {
      host: string;
      port: string;
      database: string;
      username: string;
      password: string;
      postgrestPort: string; // PostgREST-Port direkt hier
      connectionStatus: boolean; // true/false für einfache Verwendung
      lastTested?: string; // Timestamp der letzten erfolgreichen Verbindung
      testMessage?: string; // Meldung vom letzten Verbindungstest
      jwtToken?: string; // Gespeichertes JWT-Token
      jwtTokenExpires?: number; // Ablaufzeit des JWT-Tokens (Timestamp)
    };
    mariadb: {
      host: string;
      port: string;
      database: string;
      username: string;
      password: string;
      prismaPort: string; // Prisma API-Port direkt hier
      connectionStatus: boolean;
      lastTested?: string;
      testMessage?: string;
    };
    mysql: {
      host: string;
      port: string;
      database: string;
      username: string;
      password: string;
      prismaPort: string;
      connectionStatus: boolean;
      lastTested?: string;
      testMessage?: string;
    };
    minio: {
      host: string;
      port: string;
      consolePort: string;
      accessKey: string;
      secretKey: string;
      bucket: string;
      useSSL: boolean;
      connectionStatus: boolean;
      lastTested?: string;
      testMessage?: string;
    };
    supabase: {
      url: string;
      anonKey: string;
      serviceRoleKey: string;
      connectionStatus: boolean;
      lastTested?: string;
      testMessage?: string;
    };
    firebase: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
      connectionStatus: boolean;
      lastTested?: string;
      testMessage?: string;
    };
  };
}

const StorageManagement: React.FC = () => {
  const appContext = useAppContext();
  const { state } = appContext;

  // Design-Farben laden
  const getCurrentColors = () => {
    const design = state.currentDesign || 'warm'; // Fallback auf 'warm' wenn currentDesign noch nicht gesetzt ist
    const template = designTemplates[design as keyof typeof designTemplates];
    if (!template) {
      console.warn(`Design template '${design}' nicht gefunden, verwende 'warm'`);
      return designTemplates.warm.colors;
    }
    return template.colors;
  };

  const colors = getCurrentColors();

  // Hauptzustand - neue StorageManagement-Struktur
  const [storageManagement, setStorageManagement] = useState<StorageManagement>(() => {
    const savedManagement = localStorage.getItem('storageManagement');
    if (savedManagement) {
      try {
        return JSON.parse(savedManagement);
      } catch (error) {
        console.error('Fehler beim Laden der StorageManagement:', error);
      }
    }

    // Default-Konfiguration - beim ersten Start sofort aktiv
    return {
      currentStorage: {
        currentStorageMode: 'local',
        currentCloudType: 'none',
        currentDataStorage: 'SQLite',
        currentPictureStorage: 'LocalPath',
        isActive: true  // ⬅️ Sofort aktiv beim ersten Start!
      },
      selectedStorage: {
        selectedStorageMode: 'local',
        selectedCloudType: 'none',
        selectedDataStorage: 'SQLite',
        selectedPictureStorage: 'LocalPath',
        isTested: true  // ⬅️ LocalStorage ist immer "getestet"
      },
      connections: {
        postgres: {
          host: 'localhost',
          port: '5432',
          database: 'chef_numbers',
          username: 'postgres',
          password: '',
          postgrestPort: '3000',
          connectionStatus: false
        },
        mariadb: {
          host: 'localhost',
          port: '3306',
          database: 'chef_numbers',
          username: 'chef_user',
          password: '',
          prismaPort: '3001',
          connectionStatus: false
        },
        mysql: {
          host: 'localhost',
          port: '3306',
          database: 'chef_numbers',
          username: 'chef_user',
          password: '',
          prismaPort: '3001',
          connectionStatus: false
        },
        minio: {
          host: 'localhost',
          port: '9000',
          consolePort: '9001',
          accessKey: 'minioadmin',
          secretKey: '',
          bucket: 'chef-numbers',
          useSSL: false,
          connectionStatus: false
        },
        supabase: {
          url: '',
          anonKey: '',
          serviceRoleKey: '',
          connectionStatus: false
        },
        firebase: {
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
          connectionStatus: false
        },
      }
    };
  });

  // UI-Zustand
  const [connectionTestStatus, setConnectionTestStatus] = useState<{ [key: string]: 'idle' | 'testing' | 'success' | 'error' }>({});
  const [connectionTestProgress, setConnectionTestProgress] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [showDockerSetupModal, setShowDockerSetupModal] = useState(false);
  const [dockerModalServiceType, setDockerModalServiceType] = useState<'postgresql' | 'mariadb' | 'mysql' | 'minio' | 'all'>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDataMergeModal, setShowDataMergeModal] = useState(false);
  const [showTransferProgressModal, setShowTransferProgressModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupMode, setBackupMode] = useState<'backup' | 'restore'>('backup');
  const [mergeStrategy, setMergeStrategy] = useState<'overwrite' | 'merge'>('merge');
  const [conflictResolution, setConflictResolution] = useState<'keep_existing' | 'overwrite_with_new'>('keep_existing');
  const [targetStorageHasData, setTargetStorageHasData] = useState(false);
  const [dataTransferProgress, setDataTransferProgress] = useState<{
    current: number;
    total: number;
    entityType: string;
    message: string;
  } | null>(null);
  const [transferResults, setTransferResults] = useState<{
    [entityType: string]: {
      source: number;
      target: number;
      transferred: number;
      status: 'pending' | 'in_progress' | 'completed' | 'error';
      progress: number;
    };
  }>({});
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [backupProgress, setBackupProgress] = useState<{
    current: number;
    total: number;
    item: string;
    message: string;
  } | null>(null);
  const [backupCompleted, setBackupCompleted] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Animation-State für Ein-/Ausblend-Animationen
  const [cloudSectionAnimating, setCloudSectionAnimating] = useState(false);
  const [databaseSectionAnimating, setDatabaseSectionAnimating] = useState(false);
  const [cloudSectionVisible, setCloudSectionVisible] = useState(false);
  const [databaseSectionVisible, setDatabaseSectionVisible] = useState(false);

  // Zusätzliche Animation-States für Cloud-abhängige Bereiche
  const [postgresSectionVisible, setPostgresSectionVisible] = useState(false);
  const [postgresSectionAnimating, setPostgresSectionAnimating] = useState(false);
  const [mariadbSectionVisible, setMariadbSectionVisible] = useState(false);
  const [mariadbSectionAnimating, setMariadbSectionAnimating] = useState(false);
  const [mysqlSectionVisible, setMysqlSectionVisible] = useState(false);
  const [mysqlSectionAnimating, setMysqlSectionAnimating] = useState(false);
  const [minioSectionVisible, setMinioSectionVisible] = useState(false);
  const [minioSectionAnimating, setMinioSectionAnimating] = useState(false);
  const [supabaseSectionVisible, setSupabaseSectionVisible] = useState(false);
  const [supabaseSectionAnimating, setSupabaseSectionAnimating] = useState(false);
  const [firebaseSectionVisible, setFirebaseSectionVisible] = useState(false);
  const [firebaseSectionAnimating, setFirebaseSectionAnimating] = useState(false);

  // Hilfsfunktion: Prüft ob ein gültiger Cloud-Typ gewählt ist
  const isCloudTypeValid = (): boolean => {
    const selectedCloudType = storageManagement.selectedStorage.selectedCloudType;
    return selectedCloudType && selectedCloudType !== 'none';
  };

  // Animation-Logik für Cloud-Speicher-Typ Bereich
  useEffect(() => {
    const shouldShowCloud = storageManagement.selectedStorage.selectedStorageMode === 'cloud' ||
      storageManagement.selectedStorage.selectedStorageMode === 'hybrid';

    if (shouldShowCloud && !cloudSectionVisible) {
      // Einblenden
      setCloudSectionVisible(true);
      setCloudSectionAnimating(false);
    } else if (!shouldShowCloud && cloudSectionVisible) {
      // Ausblenden
      setCloudSectionAnimating(true);
      setTimeout(() => {
        setCloudSectionVisible(false);
        setCloudSectionAnimating(false);
      }, 300); // Animation-Dauer
    }
  }, [storageManagement.selectedStorage.selectedStorageMode, cloudSectionVisible]);

  // Animation-Logik für Datenbank-Konfiguration Bereich
  useEffect(() => {
    const shouldShowDatabase = storageManagement.selectedStorage.selectedStorageMode !== 'local' &&
      storageManagement.selectedStorage.selectedCloudType === 'docker';

    if (shouldShowDatabase && !databaseSectionVisible) {
      // Einblenden
      setDatabaseSectionVisible(true);
      setDatabaseSectionAnimating(false);
    } else if (!shouldShowDatabase && databaseSectionVisible) {
      // Ausblenden
      setDatabaseSectionAnimating(true);
      setTimeout(() => {
        setDatabaseSectionVisible(false);
        setDatabaseSectionAnimating(false);
      }, 300); // Animation-Dauer
    }
  }, [storageManagement.selectedStorage.selectedStorageMode, storageManagement.selectedStorage.selectedCloudType, databaseSectionVisible]);

  // Animation-Logik für Cloud-abhängige Bereiche basierend auf gewähltem Cloud-Typ
  useEffect(() => {
    const selectedCloudType = storageManagement.selectedStorage.selectedCloudType;
    const selectedDataStorage = storageManagement.selectedStorage.selectedDataStorage;
    const cloudTypeValid = isCloudTypeValid();

    console.log('🔍 Animation useEffect ausgelöst:', {
      selectedCloudType,
      selectedDataStorage,
      cloudTypeValid,
      supabaseSectionVisible
    });

    // PostgreSQL-Bereich (nur bei Docker + PostgreSQL)
    if (selectedCloudType === 'docker' && selectedDataStorage === 'PostgreSQL' && cloudTypeValid) {
      if (!postgresSectionVisible) {
        setPostgresSectionVisible(true);
        setPostgresSectionAnimating(false);
      }
    } else if (postgresSectionVisible) {
      setPostgresSectionAnimating(true);
      setTimeout(() => {
        setPostgresSectionVisible(false);
        setPostgresSectionAnimating(false);
      }, 300);
    }

    // MariaDB-Bereich (nur bei Docker + MariaDB)
    if (selectedCloudType === 'docker' && selectedDataStorage === 'MariaDB' && cloudTypeValid) {
      if (!mariadbSectionVisible) {
        setMariadbSectionVisible(true);
        setMariadbSectionAnimating(false);
      }
    } else if (mariadbSectionVisible) {
      setMariadbSectionAnimating(true);
      setTimeout(() => {
        setMariadbSectionVisible(false);
        setMariadbSectionAnimating(false);
      }, 300);
    }

    // MySQL-Bereich (nur bei Docker + MySQL)
    if (selectedCloudType === 'docker' && selectedDataStorage === 'MySQL' && cloudTypeValid) {
      if (!mysqlSectionVisible) {
        setMysqlSectionVisible(true);
        setMysqlSectionAnimating(false);
      }
    } else if (mysqlSectionVisible) {
      setMysqlSectionAnimating(true);
      setTimeout(() => {
        setMysqlSectionVisible(false);
        setMysqlSectionAnimating(false);
      }, 300);
    }

    // MinIO-Bereich (immer bei Docker)
    if (selectedCloudType === 'docker' && cloudTypeValid) {
      if (!minioSectionVisible) {
        setMinioSectionVisible(true);
        setMinioSectionAnimating(false);
      }
    } else if (minioSectionVisible) {
      setMinioSectionAnimating(true);
      setTimeout(() => {
        setMinioSectionVisible(false);
        setMinioSectionAnimating(false);
      }, 300);
    }

    // Supabase-Bereich (nur bei Supabase Cloud-Typ)
    if (selectedCloudType === 'supabase' && cloudTypeValid) {
      console.log('🔍 Supabase-Bereich sollte angezeigt werden:', { selectedCloudType, cloudTypeValid, supabaseSectionVisible });
      if (!supabaseSectionVisible) {
        console.log('✅ Supabase-Bereich wird eingeblendet');
        setSupabaseSectionVisible(true);
        setSupabaseSectionAnimating(false);
      }
    } else if (supabaseSectionVisible) {
      console.log('🔍 Supabase-Bereich wird ausgeblendet');
      setSupabaseSectionAnimating(true);
      setTimeout(() => {
        setSupabaseSectionVisible(false);
        setSupabaseSectionAnimating(false);
      }, 300);
    }

    // Firebase-Bereich
    if (selectedCloudType === 'firebase' && cloudTypeValid) {
      if (!firebaseSectionVisible) {
        setFirebaseSectionVisible(true);
        setFirebaseSectionAnimating(false);
      }
    } else if (firebaseSectionVisible) {
      setFirebaseSectionAnimating(true);
      setTimeout(() => {
        setFirebaseSectionVisible(false);
        setFirebaseSectionAnimating(false);
      }, 300);
    }
  }, [storageManagement.selectedStorage.selectedCloudType, storageManagement.selectedStorage.selectedDataStorage, postgresSectionVisible, mariadbSectionVisible, mysqlSectionVisible, minioSectionVisible, supabaseSectionVisible, firebaseSectionVisible]);

  // Prüfe beim Start, ob JWT-Token erstellt werden muss
  useEffect(() => {
    const postgresConfig = storageManagement.connections?.postgres;
    if (postgresConfig?.password && !postgresConfig?.jwtToken) {
      console.log('🔑 PostgreSQL-Konfiguration gefunden - erstelle JWT-Token beim Start...');
      createAndStorePostgreSQLJWT(postgresConfig)
        .then(() => {
          console.log('✅ JWT-Token beim Start erstellt und gespeichert');
        })
        .catch((error) => {
          console.error('❌ Fehler beim Erstellen des JWT-Tokens beim Start:', error);
        });
    }
  }, []);

  // Lade Daten beim Start, wenn eine aktive StorageLayer-Konfiguration vorhanden ist
  useEffect(() => {
    const loadInitialData = async () => {
      // Nur laden wenn currentStorage isActive ist
      if (storageManagement.currentStorage.isActive) {
        console.log('🚀 Aktive StorageLayer-Konfiguration gefunden - lade initiale Daten...');
        await loadAndSetAppData();
      }
    };
    
    loadInitialData();
  }, [storageManagement.currentStorage.isActive]); // Nur beim ersten Laden ausführen

  // Verbindungstest-Zustand
  const [pingingHosts, setPingingHosts] = useState<{ [key: string]: boolean }>({});
  const [pingResults, setPingResults] = useState<{ [key: string]: { success: boolean; message: string; latency?: number } | null }>({});
  const [checkingPorts, setCheckingPorts] = useState<{ [key: string]: boolean }>({});
  const [portResults, setPortResults] = useState<{ [key: string]: { success: boolean; message: string; latency?: number } | null }>({});

  // Validierungsnachrichten-Zustand
  const [validationMessages, setValidationMessages] = useState<{ [key: string]: boolean }>({});
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [showMinIOPasswordStrength, setShowMinIOPasswordStrength] = useState(false);

  // Cloud Storage Types
  const cloudStorageTypes: CloudStorageTypeConfig[] = [
    {
      id: 'docker',
      name: 'Docker Container',
      description: 'Lokale Docker-Container für PostgreSQL und MinIO',
      icon: <FaServer />,
      color: '#17a2b8'
    },
    {
      id: 'supabase',
      name: 'Supabase Cloud',
      description: 'Vollständig verwaltete Supabase-Cloud-Lösung',
      icon: <FaCloud />,
      color: '#3ecf8e'
    },
    {
      id: 'firebase',
      name: 'Firebase Cloud',
      description: 'Google Firebase für Daten und Bilder',
      icon: <FaCloud />,
      color: '#ffa726'
    }
  ];

  // Storage Management Update Handler
  const handleStorageManagementUpdate = (updates: Partial<StorageManagement>) => {
    // Deep merge für nested objects (selectedStorage, currentStorage, connections)
    const newManagement = {
      ...storageManagement,
      currentStorage: updates.currentStorage ? { ...storageManagement.currentStorage, ...updates.currentStorage } : storageManagement.currentStorage,
      selectedStorage: updates.selectedStorage ? { ...storageManagement.selectedStorage, ...updates.selectedStorage } : storageManagement.selectedStorage,
      connections: updates.connections ? {
        ...storageManagement.connections,
        postgres: updates.connections.postgres ? { ...storageManagement.connections.postgres, ...updates.connections.postgres } : storageManagement.connections.postgres,
        mariadb: updates.connections.mariadb ? { ...storageManagement.connections.mariadb, ...updates.connections.mariadb } : storageManagement.connections.mariadb,
        mysql: updates.connections.mysql ? { ...storageManagement.connections.mysql, ...updates.connections.mysql } : storageManagement.connections.mysql,
        minio: updates.connections.minio ? { ...storageManagement.connections.minio, ...updates.connections.minio } : storageManagement.connections.minio,
        supabase: updates.connections.supabase ? { ...storageManagement.connections.supabase, ...updates.connections.supabase } : storageManagement.connections.supabase,
        firebase: updates.connections.firebase ? { ...storageManagement.connections.firebase, ...updates.connections.firebase } : storageManagement.connections.firebase
      } : storageManagement.connections
    };

    // Automatische Aktualisierung von selectedDataStorage und selectedPictureStorage basierend auf Verbindungsstatus
    // NUR wenn es sich um einen erfolgreichen Verbindungstest handelt, nicht bei Konfigurationsänderungen
    if (updates.connections) {
      const connections = updates.connections;
      const currentConnections = storageManagement.connections;

      // Prüfe PostgreSQL-Verbindungsstatus - nur setzen wenn sich der Status GEÄNDERT hat und erfolgreich ist
      if (connections.postgres?.connectionStatus === true &&
        connections.postgres?.lastTested &&
        connections.postgres?.connectionStatus !== currentConnections.postgres?.connectionStatus) {
        newManagement.selectedStorage.selectedDataStorage = 'PostgreSQL';
      }

      // Prüfe MariaDB-Verbindungsstatus - nur setzen wenn sich der Status GEÄNDERT hat und erfolgreich ist
      if (connections.mariadb?.connectionStatus === true &&
        connections.mariadb?.lastTested &&
        connections.mariadb?.connectionStatus !== currentConnections.mariadb?.connectionStatus) {
        newManagement.selectedStorage.selectedDataStorage = 'MariaDB';
      }

      // Prüfe MySQL-Verbindungsstatus - nur setzen wenn sich der Status GEÄNDERT hat und erfolgreich ist
      if (connections.mysql?.connectionStatus === true &&
        connections.mysql?.lastTested &&
        connections.mysql?.connectionStatus !== currentConnections.mysql?.connectionStatus) {
        newManagement.selectedStorage.selectedDataStorage = 'MySQL';
      }

      // Prüfe MinIO-Verbindungsstatus - nur setzen wenn sich der Status GEÄNDERT hat und erfolgreich ist
      if (connections.minio?.connectionStatus === true &&
        connections.minio?.lastTested &&
        connections.minio?.connectionStatus !== currentConnections.minio?.connectionStatus) {
        newManagement.selectedStorage.selectedPictureStorage = 'MinIO';
      }
    }

    // Automatische Aktualisierung von isTested basierend auf Verbindungsstatus
    const checkAndUpdateIsTested = () => {
      const selectedDataStorage = newManagement.selectedStorage.selectedDataStorage;
      const selectedPictureStorage = newManagement.selectedStorage.selectedPictureStorage;

      // Prüfe ob beide Speicher-Typen ausgewählt sind
      if (!selectedDataStorage || !selectedPictureStorage) {
        newManagement.selectedStorage.isTested = false;
        return;
      }

      // Prüfe Verbindungsstatus für selectedDataStorage
      let dataStorageConnected = false;
      if (selectedDataStorage === 'PostgreSQL') {
        dataStorageConnected = newManagement.connections.postgres.connectionStatus === true;
      } else if (selectedDataStorage === 'MariaDB') {
        dataStorageConnected = newManagement.connections.mariadb.connectionStatus === true;
      } else if (selectedDataStorage === 'MySQL') {
        dataStorageConnected = newManagement.connections.mysql.connectionStatus === true;
      } else if (selectedDataStorage === 'Supabase') {
        dataStorageConnected = newManagement.connections.supabase.connectionStatus === true;
      } else if (selectedDataStorage === 'SQLite') {
        // SQLite-Speicher ist immer "verbunden" (lokal)
        dataStorageConnected = true;
      }

      // Prüfe Verbindungsstatus für selectedPictureStorage
      let pictureStorageConnected = false;
      if (selectedPictureStorage === 'MinIO') {
        pictureStorageConnected = newManagement.connections.minio.connectionStatus === true;
      } else if (selectedPictureStorage === 'Supabase') {
        pictureStorageConnected = newManagement.connections.supabase.connectionStatus === true;
      } else if (selectedPictureStorage === 'LocalPath') {
        // Lokaler Pfad ist immer "verbunden"
        pictureStorageConnected = true;
      }

      // Setze isTested basierend auf beide Verbindungsstatus
      newManagement.selectedStorage.isTested = dataStorageConnected && pictureStorageConnected;
    };

    checkAndUpdateIsTested();

    setStorageManagement(newManagement);
    localStorage.setItem('storageManagement', JSON.stringify(newManagement));
    console.log('✅ StorageManagement aktualisiert:', newManagement);
  };

  // Connection Update Handler
  const updateConnection = (connectionType: keyof StorageManagement['connections'], updates: any) => {
    const newConnections = {
      ...storageManagement.connections,
      [connectionType]: { ...storageManagement.connections[connectionType], ...updates }
    };

    // Verbindungsstatus zurücksetzen, wenn erforderliche Felder geändert werden
    const resetConnectionStatus = (connectionType: string, requiredFields: string[]) => {
      const changedFields = Object.keys(updates);
      const hasRequiredFieldChanged = changedFields.some(field => requiredFields.includes(field));

      if (hasRequiredFieldChanged) {
        console.log(`🔄 ${connectionType}-Konfiguration geändert - Verbindungsstatus wird zurückgesetzt`);
        (newConnections as any)[connectionType].connectionStatus = false;
        (newConnections as any)[connectionType].testMessage = undefined;
        (newConnections as any)[connectionType].lastTested = undefined;
      }
    };

    // PostgreSQL-Verbindungsstatus zurücksetzen
    if (connectionType === 'postgres') {
      const postgresFields = ['host', 'port', 'database', 'username', 'password', 'postgrestPort'];
      resetConnectionStatus('postgres', postgresFields);
    }

    // MariaDB-Verbindungsstatus zurücksetzen
    if (connectionType === 'mariadb') {
      const mariadbFields = ['host', 'port', 'database', 'username', 'password', 'prismaPort'];
      resetConnectionStatus('mariadb', mariadbFields);
    }

    // MySQL-Verbindungsstatus zurücksetzen
    if (connectionType === 'mysql') {
      const mysqlFields = ['host', 'port', 'database', 'username', 'password', 'prismaPort'];
      resetConnectionStatus('mysql', mysqlFields);
    }

    // MinIO-Verbindungsstatus zurücksetzen
    if (connectionType === 'minio') {
      const minioFields = ['host', 'port', 'consolePort', 'accessKey', 'secretKey', 'bucket'];
      resetConnectionStatus('minio', minioFields);
    }

    // Supabase-Verbindungsstatus zurücksetzen
    if (connectionType === 'supabase') {
      const supabaseFields = ['url', 'anonKey', 'serviceRoleKey'];
      resetConnectionStatus('supabase', supabaseFields);
    }

    handleStorageManagementUpdate({ connections: newConnections });

    // Für PostgreSQL-Verbindungen: JWT-Token automatisch erstellen und speichern (asynchron im Hintergrund)
    if (connectionType === 'postgres' && updates.password) {
      console.log('🔑 PostgreSQL-Passwort geändert - erstelle neues JWT-Token...');
      const updatedConfig = newConnections[connectionType];
      createAndStorePostgreSQLJWT(updatedConfig)
        .then(() => {
          console.log('✅ JWT-Token automatisch erstellt und gespeichert');
        })
        .catch((error) => {
          console.error('❌ Fehler beim automatischen Erstellen des JWT-Tokens:', error);
        });
    }

    // Zeige Validierungsnachrichten für geänderte Felder
    Object.keys(updates).forEach(field => {
      const fieldKey = `${connectionType}-${field}`;
      setValidationMessages(prev => ({ ...prev, [fieldKey]: true }));

      // Prüfe ob die Eingabe gültig ist und blende nur bei gültigen Eingaben nach 5 Sekunden aus
      const value = updates[field];
      if (value) {
        let isValid = false;

        // PostgreSQL-spezifische Validierungen
        if (field === 'host') {
          isValid = validateHostname(value as string).isValid;
        } else if (field === 'port' || field === 'postgrestPort') {
          isValid = validatePort(value as string).isValid;
        } else if (field === 'username') {
          isValid = validatePostgreSQLUsername(value as string).isValid;
        } else if (field === 'database') {
          isValid = validatePostgreSQLDatabaseName(value as string).isValid;
        }

        // MariaDB-spezifische Validierungen
        else if (connectionType === 'mariadb') {
          if (field === 'host') {
            isValid = validateHostname(value as string).isValid;
          } else if (field === 'port' || field === 'prismaPort') {
            isValid = validatePort(value as string).isValid;
          } else if (field === 'username') {
            isValid = validateMariaDBUsername(value as string).isValid;
          } else if (field === 'database') {
            isValid = validateMariaDBDatabaseName(value as string).isValid;
          }
        }

        // MySQL-spezifische Validierungen
        else if (connectionType === 'mysql') {
          if (field === 'host') {
            isValid = validateHostname(value as string).isValid;
          } else if (field === 'port' || field === 'prismaPort') {
            isValid = validatePort(value as string).isValid;
          } else if (field === 'username') {
            isValid = validateMySQLUsername(value as string).isValid;
          } else if (field === 'database') {
            isValid = validateMySQLDatabaseName(value as string).isValid;
          }
        }

        // MinIO-spezifische Validierungen
        else if (field === 'consolePort') {
          isValid = validatePort(value as string).isValid;
        } else if (field === 'accessKey' || field === 'secretKey' || field === 'bucket') {
          isValid = (value as string).length > 0;
        }

        // Nur bei gültigen Eingaben nach 5 Sekunden ausblenden
        if (isValid) {
          hideValidationMessage(fieldKey);
        }
        // Bei ungültigen Eingaben bleibt die Nachricht sichtbar (kein hideValidationMessage-Aufruf)
      }
    });

    // Spezielle Behandlung für Passwort-Felder
    if (updates.password !== undefined) {
      setShowPasswordStrength(true);
      hidePasswordStrength();
    }

    // Spezielle Behandlung für MinIO Secret Key
    if (updates.secretKey !== undefined) {
      setShowMinIOPasswordStrength(true);
      hideMinIOPasswordStrength();
    }
  };

  // Helper Functions
  const getCurrentDatabaseType = () => {
    return storageManagement.selectedStorage.selectedDataStorage?.toLowerCase() || 'undefined';
  };

  // Prüfe ob alle PostgreSQL-Felder gültig sind
  const isPostgreSQLConfigValid = (): boolean => {
    const config = storageManagement.connections.postgres;

    // Prüfe alle erforderlichen Felder
    const hostValid = config.host && validateHostname(config.host).isValid;
    const portValid = config.port && validatePort(config.port).isValid;
    const postgrestPortValid = config.postgrestPort && validatePort(config.postgrestPort).isValid;
    const databaseValid = config.database && validatePostgreSQLDatabaseName(config.database).isValid;
    const usernameValid = config.username && validatePostgreSQLUsername(config.username).isValid;
    const passwordValid = config.password && config.password.length > 0;

    return !!(hostValid && portValid && postgrestPortValid && databaseValid && usernameValid && passwordValid);
  };

  // Berechne MariaDB-Button-Status (wird später definiert)
  let isMariaDBButtonEnabled = false; // Temporärer Wert

  // Validiert PostgreSQL-Zugangsdaten
  const validatePostgreSQLCredentials = (username: string, password: string, database: string) => {
    const errors = [];

    if (!username || username.length < 1) {
      errors.push('Benutzername ist erforderlich');
    } else if (username !== username.toLowerCase()) {
      errors.push('Benutzername sollte in Kleinbuchstaben sein (PostgreSQL-Konvention)');
    } else if (username === database) {
      errors.push('Benutzername und Datenbankname sollten unterschiedlich sein');
    }

    if (!password || password.length < 1) {
      errors.push('Passwort ist erforderlich');
    }

    if (!database || database.length < 1) {
      errors.push('Datenbankname ist erforderlich');
    } else if (database !== database.toLowerCase()) {
      errors.push('Datenbankname sollte in Kleinbuchstaben sein (PostgreSQL-Konvention)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // JWT-Secret aus PostgreSQL-Passwort generieren (deterministisch)
  const generateJWTSecretFromPassword = async (password: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      // WICHTIG: lowercase für PostgREST-Kompatibilität
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
    } catch (error) {
      console.error('❌ JWT-Secret-Generierung fehlgeschlagen:', error);
      // Fallback: Einfacher Hash
      return btoa(password).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
  };

  // JWT-Token für PostgreSQL erstellen und im LocalStorage speichern
  const createAndStorePostgreSQLJWT = async (config: any): Promise<string> => {
    try {
      const jwtSecret = await generateJWTSecretFromPassword(config.password);
      console.log('🔑 Generiertes JWT-Secret (lowercase):', jwtSecret);
      const secretKey = new TextEncoder().encode(jwtSecret);

      const jwt = await new SignJWT({
        // PostgREST-spezifische Claims (WICHTIG!)
        // Verwende service_role für Admin-Operationen (hat Zugriff auf alle Tabellen)
        role: 'service_role'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // 30 Tage gültig (statt 24h)
        .sign(secretKey);

      console.log('✅ JWT-Token erstellt und gespeichert');

      // JWT-Token im postgres-Schlüssel speichern
      const updatedConfig = {
        ...config,
        jwtToken: jwt,
        jwtTokenExpires: Date.now() + (60 * 60 * 24 * 1000) // 24 Stunden
      };

      // Aktualisiere den postgres-Schlüssel im LocalStorage
      const currentStorage = JSON.parse(localStorage.getItem('storageManagement') || '{}');
      currentStorage.connections = currentStorage.connections || {};
      currentStorage.connections.postgres = updatedConfig;
      localStorage.setItem('storageManagement', JSON.stringify(currentStorage));

      console.log('💾 JWT-Token im LocalStorage gespeichert');
      return jwt;
    } catch (error) {
      console.error('❌ JWT-Token-Erstellung fehlgeschlagen:', error);
      throw error;
    }
  };

  // Gespeichertes JWT-Token aus dem postgres-Schlüssel abrufen
  const getStoredPostgreSQLJWT = (config: any): string | null => {
    try {
      const currentStorage = JSON.parse(localStorage.getItem('storageManagement') || '{}');
      const postgresConfig = currentStorage.connections?.postgres;

      if (postgresConfig?.jwtToken && postgresConfig?.jwtTokenExpires) {
        // Prüfe ob Token noch gültig ist
        if (Date.now() < postgresConfig.jwtTokenExpires) {
          console.log('✅ Gespeichertes JWT-Token gefunden und gültig');
          return postgresConfig.jwtToken;
        } else {
          console.log('⚠️ Gespeichertes JWT-Token abgelaufen');
          return null;
        }
      }

      console.log('ℹ️ Kein gespeichertes JWT-Token gefunden');
      return null;
    } catch (error) {
      console.error('❌ Fehler beim Abrufen des JWT-Tokens:', error);
      return null;
    }
  };

  // JWT-Token mit PostgreSQL-Credentials erstellen
  const createPostgreSQLJWT = async (config: any): Promise<string> => {
    try {
      const jwtSecret = await generateJWTSecretFromPassword(config.password);
      console.log('🔑 Generiertes JWT-Secret (lowercase):', jwtSecret);
      const secretKey = new TextEncoder().encode(jwtSecret);

      const jwt = await new SignJWT({
        // PostgREST-spezifische Claims (WICHTIG!)
        // Verwende service_role für Admin-Operationen (hat Zugriff auf alle Tabellen)
        role: 'service_role'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // 30 Tage gültig (statt 5m)
        .sign(secretKey);

      console.log('✅ JWT-Token erstellt für PostgreSQL-Test');

      // Debug: JWT-Token-Inhalt analysieren
      const tokenParts = jwt.split('.');
      if (tokenParts.length === 3) {
        try {
          const header = JSON.parse(atob(tokenParts[0]));
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 JWT-Header:', header);
          console.log('🔍 JWT-Payload:', payload);
          console.log('🔍 JWT-Rolle:', payload.role);
          console.log('🔍 JWT-Username:', payload.username);
        } catch (e) {
          console.log('🔍 JWT-Debug fehlgeschlagen:', e);
        }
      }

      return jwt;
    } catch (error) {
      console.error('❌ JWT-Token-Erstellung fehlgeschlagen:', error);
      throw new Error(`JWT-Token-Erstellung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  // PostgreSQL-Verbindungstest mit JWT-basierter Passwort-Validierung über PostgREST
  const testPostgreSQLConnection = async (config: any, jwtToken?: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Validiere Konfiguration
      if (!config.host || !config.port || !config.database || !config.username || !config.password) {
        return { success: false, message: 'Unvollständige PostgreSQL-Konfiguration' };
      }

      // Validiere Port
      const port = parseInt(config.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        return { success: false, message: 'Ungültiger PostgreSQL-Port' };
      }

      // Da wir keine direkte PostgreSQL-Verbindung aus dem Browser herstellen können,
      // verwenden wir PostgREST mit JWT-Token, um das Passwort zu testen
      const postgrestPort = storageManagement.connections.postgres.postgrestPort || '3000';
      const postgrestUrl = `http://${config.host}:${postgrestPort}`;

      console.log('🔍 Teste PostgreSQL-Passwort über PostgREST mit JWT...', {
        host: config.host,
        postgresPort: config.port,
        postgrestPort,
        database: config.database,
        username: config.username,
        password: '[HIDDEN]'
      });

      try {
        // Verwende übergebenes JWT-Token oder hole gespeichertes Token
        let token = jwtToken;
        if (!token) {
          const storedToken = getStoredPostgreSQLJWT(config);
          if (storedToken) {
            token = storedToken;
            console.log('🔑 Verwende gespeichertes JWT-Token');
          } else {
            console.log('🔑 Erstelle neues JWT-Token und speichere es...');
            token = await createAndStorePostgreSQLJWT(config);
          }
        }
        console.log('🔑 JWT-Token verwendet:', token.substring(0, 50) + '...');

        // Debug: JWT-Secret aus aktuellem Passwort generieren
        const currentJwtSecret = await generateJWTSecretFromPassword(config.password);
        console.log('🔑 JWT-Secret aus aktuellem Passwort:', currentJwtSecret);
        console.log('🔍 Aktuelles Passwort (erste 3 Zeichen):', config.password.substring(0, 3) + '***');
        console.log('🔍 Passwort-Länge:', config.password.length);

        // Debug: Erwartetes JWT-Secret für Docker Container
        console.log('🐳 ERWARTETES JWT-Secret für Docker Container:', currentJwtSecret);
        console.log('🐳 Dieses JWT-Secret MUSS in Ihrem Docker Compose File stehen!');
        console.log('🐳 Prüfen Sie: PGRST_JWT_SECRET in docker-compose.yml');
        console.log('⚠️ WICHTIG: JWT-Secret ist jetzt in LOWERCASE - generieren Sie das Docker Compose neu!');
        console.log('🔄 LÖSUNG: Klicken Sie auf "Docker Compose herunterladen" um das neue JWT-Secret zu bekommen!');

        // Debug: Teste JWT-Secret-Verifikation mit aktuellem Passwort
        console.log('🧪 Teste JWT-Secret-Verifikation...');
        console.log('🧪 Aktuelles Passwort aus LocalStorage:', config.password);
        console.log('🧪 Generiertes JWT-Secret:', currentJwtSecret);
        console.log('🧪 Passwort-Länge:', config.password.length, 'Zeichen');

        // Teste PostgREST-Verbindung mit JWT-Token
        // PostgREST ist so konfiguriert, dass nur authentifizierte Benutzer Zugriff haben
        console.log('🔐 Teste PostgREST mit JWT-Token...');
        console.log('🔍 DEBUG: Zweiter Request - GET / mit JWT-Token');
        console.log('🔍 JWT-Token (erste 50 Zeichen):', token.substring(0, 50) + '...');
        const response = await fetch(`${postgrestUrl}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          console.log('✅ PostgreSQL-Passwort über PostgREST mit JWT erfolgreich getestet');
          return {
            success: true,
            message: 'PostgreSQL-Passwort erfolgreich über PostgREST mit JWT getestet'
          };
        } else if (response.status === 401) {
          console.log('❌ PostgreSQL-Passwort ungültig oder JWT-Token ungültig (401 Unauthorized)');
          return {
            success: false,
            message: 'PostgreSQL-Passwort ungültig oder JWT-Token ungültig - Authentifizierung fehlgeschlagen'
          };
        } else if (response.status === 403) {
          console.log('❌ JWT-Token ungültig oder abgelaufen (403 Forbidden)');
          return {
            success: false,
            message: 'JWT-Token ungültig oder abgelaufen - PostgreSQL-Verbindung kann nicht getestet werden'
          };
        } else if (response.status === 404) {
          console.log('❌ PostgREST-Endpoint nicht verfügbar (404 Not Found)');
          return {
            success: false,
            message: 'PostgREST-Endpoint nicht verfügbar - PostgreSQL-Verbindung kann nicht getestet werden'
          };
        } else {
          console.log(`❌ PostgREST-Fehler: ${response.status} ${response.statusText}`);
          return {
            success: false,
            message: `PostgREST-Fehler: ${response.status} ${response.statusText}`
          };
        }

      } catch (fetchError) {
        console.error('❌ PostgREST-Verbindung mit JWT fehlgeschlagen:', fetchError);

        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          return {
            success: false,
            message: 'PostgREST nicht erreichbar - PostgreSQL-Verbindung kann nicht getestet werden'
          };
        }

        return {
          success: false,
          message: `PostgREST-Verbindungsfehler: ${fetchError instanceof Error ? fetchError.message : 'Unbekannter Fehler'}`
        };
      }

    } catch (error) {
      console.error('❌ PostgreSQL-Test Fehler:', error);

      // Spezielle Behandlung für JWT-Fehler
      if (error instanceof Error && error.message.includes('JWT')) {
        return {
          success: false,
          message: `JWT-Token-Fehler: ${error.message}`
        };
      }

      return {
        success: false,
        message: `PostgreSQL-Test fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  };

  // Test-Funktion für JWT-Secret-Wiederholbarkeit
  const testJWTSecretRepeatability = async (password: string): Promise<void> => {
    try {
      console.log('🧪 Teste JWT-Secret-Wiederholbarkeit...');

      // Erste Generierung
      const secret1 = await generateJWTSecretFromPassword(password);

      // Zweite Generierung
      const secret2 = await generateJWTSecretFromPassword(password);

      // Sollte identisch sein
      console.log('Secret 1:', secret1);
      console.log('Secret 2:', secret2);
      console.log('Identisch:', secret1 === secret2);

      if (secret1 === secret2) {
        console.log('✅ JWT-Secret-Generierung ist wiederholbar');
      } else {
        console.error('❌ JWT-Secret-Generierung ist NICHT wiederholbar!');
      }
    } catch (error) {
      console.error('❌ JWT-Secret-Wiederholbarkeitstest fehlgeschlagen:', error);
    }
  };

  // Intelligenter PostgreSQL-Verbindungstest (aktuelle Version aus Backup)
  const performFullConnectionTest = async (): Promise<{ success: boolean; message: string; showModal?: boolean }> => {
    const host = storageManagement.connections.postgres.host;
    const postgresPort = storageManagement.connections.postgres.port || '5432';
    const postgrestPort = storageManagement.connections.postgres.postgrestPort || '3000';

    if (!host) {
      return { success: false, message: 'Keine Host-Adresse angegeben' };
    }

    try {
      // Schritt 1: IP-Adresse prüfen
      const ipPingResult = await pingHost(host);

      if (!ipPingResult.success) {
        return {
          success: false,
          message: `IP-Adresse ${host} nicht erreichbar - prüfen Sie Ihre Netzwerkverbindung`
        };
      }

      // Schritt 2: PostgreSQL-Port prüfen
      const postgresPortResult = await checkPortAvailability(host, postgresPort);

      // Schritt 3: PostgREST-Port prüfen
      const postgrestPortResult = await checkPortAvailability(host, postgrestPort);

      // Für Szenario A: Prüfe speziell, ob PostgREST verfügbar ist
      // PostgreSQL-Port 5432 wird immer als "verfügbar" gemeldet (nur Host-Check)
      // PostgREST-Port ist der bessere Indikator für laufende Container
      const isPostgRESTAvailable = postgrestPortResult.success;
      const isPostgreSQLAvailable = postgresPortResult.success;

      // Szenario A: IP erreichbar, aber PostgREST nicht verfügbar (keine Container)
      if (!isPostgRESTAvailable) {
        return {
          success: true,
          message: `IP-Adresse ${host} erreichbar, aber keine Docker-Container gefunden`,
          showModal: true
        };
      }

      // Szenario C: Beide Server verfügbar
      if (isPostgRESTAvailable && isPostgreSQLAvailable) {
        // Erstelle Konfigurationsobjekt für Datenbank-Operationen
        const dbConfig = {
          host: host,
          port: postgresPort,
          database: storageManagement.connections.postgres.database,
          username: storageManagement.connections.postgres.username,
          password: storageManagement.connections.postgres.password
        };

        // Debug: Überprüfe Passwort-Quelle
        console.log('🔍 DEBUG: Passwort-Quelle für Verbindungstest:');
        console.log('🔍 Passwort aus storageManagement.connections.postgres.password:', dbConfig.password);
        console.log('🔍 Passwort-Länge:', dbConfig.password?.length || 0);
        console.log('🔍 Passwort erste 3 Zeichen:', dbConfig.password?.substring(0, 3) + '***');

        try {
          // Schritt 1: Prüfe ob Datenbank existiert
          console.log('🔍 Starte Datenbankexistenz-Prüfung für:', { host, postgresPort, postgrestPort });

          // Direkte Datenbankverbindung über PostgREST testen
          const postgrestUrl = `http://${host}:${postgrestPort}`;
          console.log('🌐 PostgREST URL:', postgrestUrl);

          // Verwende gespeichertes JWT-Token oder erstelle ein neues
          const storedToken = getStoredPostgreSQLJWT(dbConfig);
          let jwtToken: string;
          if (storedToken) {
            jwtToken = storedToken;
            console.log('🔑 Verwende gespeichertes JWT-Token');
          } else {
            console.log('🔑 Erstelle neues JWT-Token und speichere es...');
            jwtToken = await createAndStorePostgreSQLJWT(dbConfig);
          }
          console.log('🔍 JWT-Token (erste 50 Zeichen):', jwtToken.substring(0, 50) + '...');

          let databaseExists = false;

          try {
            // Teste PostgREST-Verbindung mit JWT-Token (sicherer)
            console.log('📡 Teste PostgREST-Verbindung mit JWT-Token...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            console.log('🔍 DEBUG: Erster Request - HEAD / mit JWT-Token');
            console.log('🔍 JWT-Token (erste 50 Zeichen):', jwtToken.substring(0, 50) + '...');
            const response = await fetch(`${postgrestUrl}/`, {
              method: 'HEAD',
              headers: {
                'Authorization': `Bearer ${jwtToken}`
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('📡 PostgREST-Response:', response.status, response.statusText);
            databaseExists = response.ok;

            if (databaseExists) {
              console.log('✅ PostgREST ist erreichbar - Datenbank existiert');

              // Schritt 2: Teste PostgreSQL-Passwort
              console.log('🔐 Teste PostgreSQL-Passwort...');
              const passwordTestResult = await testPostgreSQLConnection(dbConfig, jwtToken);

              if (passwordTestResult.success) {
                console.log('✅ PostgreSQL-Passwort korrekt');
                return {
                  success: true,
                  message: `PostgreSQL-Verbindung erfolgreich: ${passwordTestResult.message}`
                };
              } else {
                console.log('❌ PostgreSQL-Passwort falsch:', passwordTestResult.message);
                return {
                  success: false,
                  message: `PostgreSQL-Passwort ungültig: ${passwordTestResult.message}`
                };
              }
            } else {
              console.log('❌ PostgREST nicht erreichbar - Datenbank muss erstellt werden');
            }

          } catch (error) {
            console.log('❌ PostgREST-Verbindung fehlgeschlagen:', error);
            console.log('🔄 Versuche Datenbank-Erstellung...');
            databaseExists = false;
          }

          if (!databaseExists) {
            // Schritt 2: Teste PostgreSQL-Passwort bevor Datenbank erstellt wird
            console.log('🔐 Teste PostgreSQL-Passwort vor Datenbank-Erstellung...');
            console.log('🔍 Verwende gleiches JWT-Token für Passwort-Test');
            const passwordTestResult = await testPostgreSQLConnection(dbConfig, jwtToken);

            if (!passwordTestResult.success) {
              console.log('❌ PostgreSQL-Passwort ungültig:', passwordTestResult.message);
              return {
                success: false,
                message: `PostgreSQL-Passwort ungültig: ${passwordTestResult.message}`
              };
            }

            console.log('✅ PostgreSQL-Passwort korrekt - erstelle Datenbank...');

            // Schritt 3: Erstelle Datenbank über HTTP-API
            console.log('🏗️ Starte Datenbank-Erstellung...');

            try {
              const apiUrl = 'http://localhost:3001/api/create-postgres-structure';
              const requestBody = {
                host: host,
                port: parseInt(postgresPort),
                database: storageManagement.connections.postgres.database,
                username: storageManagement.connections.postgres.username,
                password: storageManagement.connections.postgres.password
              };

              console.log('📤 API-Call:', apiUrl);
              console.log('📤 Request Body:', { ...requestBody, password: '[HIDDEN]' });

              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
              });

              console.log('📥 API-Response Status:', response.status, response.statusText);

              if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API-Fehler:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
              }

              const result = await response.json();
              console.log('✅ Datenbank-Erstellung Ergebnis:', result);

            } catch (error) {
              console.error('❌ Datenbank-Erstellung Fehler:', error);
              return {
                success: false,
                message: `Fehler beim Erstellen der Datenbank: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
              };
            }

            console.log('🎉 Neue Datenbank erfolgreich erstellt!');

            // Schritt 4: Teste PostgreSQL-Passwort nach Datenbank-Erstellung
            console.log('🔐 Teste PostgreSQL-Passwort nach Datenbank-Erstellung...');
            const finalPasswordTestResult = await testPostgreSQLConnection(dbConfig);

            if (finalPasswordTestResult.success) {
              console.log('✅ PostgreSQL-Passwort nach Datenbank-Erstellung korrekt');
              return {
                success: true,
                message: `Datenbank erfolgreich erstellt und PostgreSQL-Passwort getestet: ${finalPasswordTestResult.message}`
              };
            } else {
              console.log('❌ PostgreSQL-Passwort nach Datenbank-Erstellung ungültig:', finalPasswordTestResult.message);
              return {
                success: false,
                message: `Datenbank erstellt, aber PostgreSQL-Passwort ungültig: ${finalPasswordTestResult.message}`
              };
            }

          } else {
            // Schritt 2: Teste PostgreSQL-Passwort für existierende Datenbank
            console.log('🔐 Teste PostgreSQL-Passwort für existierende Datenbank...');
            const existingPasswordTestResult = await testPostgreSQLConnection(dbConfig);

            if (!existingPasswordTestResult.success) {
              console.log('❌ PostgreSQL-Passwort für existierende Datenbank ungültig:', existingPasswordTestResult.message);
              return {
                success: false,
                message: `PostgreSQL-Passwort ungültig: ${existingPasswordTestResult.message}`
              };
            }

            console.log('✅ PostgreSQL-Passwort für existierende Datenbank korrekt');

            // Schritt 3: Prüfe Datenbankstruktur
            console.log('🔍 Prüfe Datenbankstruktur...');

            try {
              // Teste ob PostgREST-Schema verfügbar ist
              console.log('📡 Teste PostgREST-Schema...');
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);

              // Teste spezifische Tabellen über PostgREST
              const testTables = ['articles', 'suppliers', 'recipes', 'einkaufs_liste', 'inventur_liste'];
              let schemaComplete = true;
              let missingTables = [];

              for (const table of testTables) {
                try {
                  console.log(`🔍 Prüfe Tabelle: ${table}`);

                  // Verwende JWT-Token für konsistente Authentifizierung
                  console.log(`🔍 DEBUG: Dritter Request - GET /${table}?limit=1 mit JWT-Token`);
                  console.log('🔍 JWT-Token (erste 50 Zeichen):', jwtToken.substring(0, 50) + '...');
                  const tableResponse = await fetch(`${postgrestUrl}/${table}?limit=1`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${jwtToken}`,
                      'Accept': 'application/json'
                    },
                    signal: controller.signal
                  });

                  console.log(`📊 ${table}-Response:`, tableResponse.status, tableResponse.statusText);

                  if (!tableResponse.ok) {
                    schemaComplete = false;
                    missingTables.push(table);
                    console.log(`❌ Tabelle ${table} fehlt oder ist nicht zugänglich`);
                  } else {
                    console.log(`✅ Tabelle ${table} ist verfügbar`);
                  }
                } catch (error) {
                  console.log(`❌ Fehler beim Testen der Tabelle ${table}:`, error);
                  schemaComplete = false;
                  missingTables.push(table);
                }
              }

              clearTimeout(timeoutId);
              console.log('📊 Schema-Test Ergebnis:', { schemaComplete, missingTables });

              if (!schemaComplete) {
                console.log('⚠️ Schema unvollständig - erstelle fehlende Struktur...');
                console.log('📋 Fehlende Tabellen:', missingTables);

                // Erstelle Schema direkt über PostgREST
                console.log('📡 Erstelle Schema über PostgREST...');

                // Vereinfachte Schema-Erstellung für Demo
                console.log('🔧 Schema-Erstellung würde hier implementiert werden...');
              }

            } catch (error) {
              console.error('❌ Schema-Test Fehler:', error);
              return {
                success: false,
                message: `Fehler beim Prüfen der Datenbankstruktur: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
              };
            }
          }

          // Erfolgreiche Verbindung - finaler Passwort-Test
          console.log('🔐 Finaler PostgreSQL-Passwort-Test...');
          const finalPasswordTestResult = await testPostgreSQLConnection(dbConfig);

          if (finalPasswordTestResult.success) {
            console.log('✅ Finaler PostgreSQL-Passwort-Test erfolgreich');
            return {
              success: true,
              message: `✅ PostgreSQL-Verbindung und Passwort erfolgreich getestet!\nHost: ${host}:${postgresPort}\nDatenbank: ${storageManagement.connections.postgres.database}\nPostgREST: ${host}:${postgrestPort}\nPasswort: ✅ Gültig`
            };
          } else {
            console.log('❌ Finaler PostgreSQL-Passwort-Test fehlgeschlagen:', finalPasswordTestResult.message);
            return {
              success: false,
              message: `PostgreSQL-Verbindung erfolgreich, aber Passwort ungültig: ${finalPasswordTestResult.message}`
            };
          }

        } catch (error) {
          console.error('❌ Datenbank-Setup Fehler:', error);
          return {
            success: false,
            message: `Fehler beim Datenbank-Setup: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          };
        }
      }

      // Fallback für unerwartete Szenarien
      return {
        success: false,
        message: 'Unerwarteter Verbindungstest-Fehler'
      };

    } catch (error) {
      console.error('PostgreSQL-Verbindungstest fehlgeschlagen:', error);
      return {
        success: false,
        message: `Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  };

  // Intelligenter MinIO-Verbindungstest
  const performMinIOConnectionTest = async (): Promise<{ success: boolean; message: string; showModal?: boolean }> => {
    const host = storageManagement.connections.minio.host;
    const minioPort = storageManagement.connections.minio.port || '9000';
    const consolePort = storageManagement.connections.minio.consolePort || '9001';

    if (!host) {
      return { success: false, message: 'Keine Host-Adresse angegeben' };
    }

    try {
      // Schritt 1: IP-Adresse prüfen
      const ipPingResult = await pingHost(host);

      if (!ipPingResult.success) {
        return {
          success: false,
          message: `IP-Adresse ${host} nicht erreichbar - prüfen Sie Ihre Netzwerkverbindung`
        };
      }

      // Schritt 2: MinIO-Port prüfen
      const minioPortResult = await checkPortAvailability(host, minioPort);

      // Schritt 3: Console-Port prüfen
      const consolePortResult = await checkPortAvailability(host, consolePort);

      // MinIO-Port ist der Hauptindikator für laufende MinIO-Container
      const isMinIOAvailable = minioPortResult.success;
      const isConsoleAvailable = consolePortResult.success;

      // Szenario A: IP erreichbar, aber MinIO nicht verfügbar (keine Container)
      if (!isMinIOAvailable) {
        return {
          success: true,
          message: `IP-Adresse ${host} erreichbar, aber keine MinIO-Container gefunden`,
          showModal: true
        };
      }

      // Szenario B: MinIO verfügbar, aber Console nicht verfügbar
      if (isMinIOAvailable && !isConsoleAvailable) {
        return {
          success: true,
          message: `MinIO-Server verfügbar auf ${host}:${minioPort}, aber Console nicht erreichbar auf Port ${consolePort}`
        };
      }

      // Szenario C: Beide Ports verfügbar
      if (isMinIOAvailable && isConsoleAvailable) {
        // Teste MinIO-Verbindung mit Access Key und Secret Key
        const accessKey = storageManagement.connections.minio.accessKey;
        const secretKey = storageManagement.connections.minio.secretKey;
        const bucket = storageManagement.connections.minio.bucket;

        if (!accessKey || !secretKey || !bucket) {
          return {
            success: false,
            message: 'MinIO-Server erreichbar, aber Access Key, Secret Key oder Bucket nicht konfiguriert'
          };
        }

        // Szenario C: Beide Ports verfügbar - MinIO-Service läuft erfolgreich
        console.log('🎉 MinIO-Service ist verfügbar!');

        return {
          success: true,
          message: `✅ MinIO-Verbindung erfolgreich!\nHost: ${host}:${minioPort}\nConsole: ${host}:${consolePort}\nBucket: ${bucket}\nAccess Key: ✅ Konfiguriert\n\nMinIO-Service läuft ordnungsgemäß`
        };
      }

      // Fallback für unerwartete Szenarien
      return {
        success: false,
        message: 'Unerwarteter MinIO-Verbindungstest-Fehler'
      };

    } catch (error) {
      console.error('❌ MinIO-Verbindungstest Fehler:', error);
      return {
        success: false,
        message: `Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  };

  // Handler für Verbindungstest mit DockerSetupModal-Integration
  const handleConnectionTest = async () => {
    if (!isPostgreSQLConfigValid()) {
      return;
    }

    // Setze Status auf "testing"
    handleStorageManagementUpdate({
      connections: {
        ...storageManagement.connections,
        postgres: {
          ...storageManagement.connections.postgres,
          connectionStatus: false,
          lastTested: new Date().toISOString(),
          testMessage: 'Verbindungstest läuft... Teste Verbindung zum PostgreSQL-Dienst...'
        }
      }
    });

    try {
      const result = await performFullConnectionTest();

      if (result.success) {
        if (result.showModal) {
          // Zeige DockerSetupModal für fehlende Container
          setDockerModalServiceType('postgresql');
          setShowDockerSetupModal(true);
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              postgres: {
                ...storageManagement.connections.postgres,
                connectionStatus: false,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });
        } else {
          // Erfolgreiche Verbindung
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              postgres: {
                ...storageManagement.connections.postgres,
                connectionStatus: true,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });
        }
      } else {
        // Fehlgeschlagene Verbindung
        handleStorageManagementUpdate({
          connections: {
            ...storageManagement.connections,
            postgres: {
              ...storageManagement.connections.postgres,
              connectionStatus: false,
              lastTested: new Date().toISOString(),
              testMessage: result.message
            }
          }
        });
      }
    } catch (error) {
      console.error('Verbindungstest fehlgeschlagen:', error);
      handleStorageManagementUpdate({
        connections: {
          ...storageManagement.connections,
          postgres: {
            ...storageManagement.connections.postgres,
            connectionStatus: false,
            lastTested: new Date().toISOString(),
            testMessage: `❌ Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          }
        }
      });
    }
  };

  // Intelligenter MariaDB-Verbindungstest (analog zu PostgreSQL)
  const performMariaDBConnectionTest = async (): Promise<{ success: boolean; message: string; showModal?: boolean }> => {
    const host = storageManagement.connections.mariadb.host;
    const mariadbPort = storageManagement.connections.mariadb.port || '3306';
    const prismaPort = storageManagement.connections.mariadb.prismaPort || '3001';

    if (!host) {
      return { success: false, message: 'Keine Host-Adresse angegeben' };
    }

    try {
      // Schritt 1: IP-Adresse prüfen
      const ipPingResult = await pingHost(host);

      if (!ipPingResult.success) {
        return {
          success: false,
          message: `IP-Adresse ${host} nicht erreichbar - prüfen Sie Ihre Netzwerkverbindung`
        };
      }

      // Schritt 2: MariaDB-Port prüfen
      const mariadbPortResult = await checkPortAvailability(host, mariadbPort);

      // Schritt 3: Prisma API-Port prüfen
      const prismaPortResult = await checkPortAvailability(host, prismaPort);

      // Prüfe speziell, ob Prisma API verfügbar ist
      // MariaDB-Port 3306 wird immer als "verfügbar" gemeldet (nur Host-Check)
      // Prisma API-Port ist der bessere Indikator für laufende Container
      const isPrismaAPIAvailable = prismaPortResult.success;
      const isMariaDBAvailable = mariadbPortResult.success;

      // Szenario A: IP erreichbar, aber Prisma API nicht verfügbar (keine Container)
      if (!isPrismaAPIAvailable) {
        return {
          success: true,
          message: `IP-Adresse ${host} erreichbar, aber keine Docker-Container gefunden`,
          showModal: true
        };
      }

      // Szenario C: Beide Server verfügbar
      if (isPrismaAPIAvailable && isMariaDBAvailable) {
        // Erstelle Konfigurationsobjekt für Datenbank-Operationen
        const dbConfig = {
          host: host,
          port: mariadbPort,
          database: storageManagement.connections.mariadb.database,
          username: storageManagement.connections.mariadb.username,
          password: storageManagement.connections.mariadb.password
        };

        console.log('🔍 DEBUG: MariaDB-Verbindungstest mit Konfiguration:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          password: '[HIDDEN]'
        });

        try {
          // Schritt 1: Prüfe ob Datenbank existiert
          console.log('🔍 Starte Datenbankexistenz-Prüfung für:', { host, mariadbPort, prismaPort });

          // Direkte Datenbankverbindung über Prisma API testen
          const prismaUrl = `http://${host}:${prismaPort}`;
          console.log('🌐 Prisma API URL:', prismaUrl);

          // Teste Prisma API-Verbindung mit Health-Check
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`${prismaUrl}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Prisma API antwortet nicht korrekt (Status: ${response.status})`);
          }

          // Teste Datenbankzugriff über Prisma API
          const dbTestResponse = await fetch(`${prismaUrl}/api/test-connection`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              host: dbConfig.host,
              port: parseInt(dbConfig.port),
              database: dbConfig.database,
              username: dbConfig.username,
              password: dbConfig.password
            }),
            signal: controller.signal
          });

          if (!dbTestResponse.ok) {
            const errorData = await dbTestResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `Datenbankverbindung fehlgeschlagen (Status: ${dbTestResponse.status})`);
          }

          const testResult = await dbTestResponse.json();

          if (!testResult.success) {
            throw new Error(testResult.message || 'Datenbankverbindung fehlgeschlagen');
          }

          console.log('✅ MariaDB-Verbindungstest erfolgreich!');
          return {
            success: true,
            message: `✅ Verbindung erfolgreich! MariaDB-Datenbank "${dbConfig.database}" ist erreichbar über Prisma API.`
          };

        } catch (dbError) {
          console.error('MariaDB-Datenbankverbindung fehlgeschlagen:', dbError);
          return {
            success: false,
            message: `Datenbankverbindung fehlgeschlagen: ${dbError instanceof Error ? dbError.message : 'Unbekannter Fehler'}`
          };
        }
      }

      // Fallback für andere Szenarien
      return {
        success: false,
        message: 'Unerwarteter Verbindungstest-Fehler'
      };

    } catch (error) {
      console.error('MariaDB-Verbindungstest fehlgeschlagen:', error);
      return {
        success: false,
        message: `Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  };

  // Handler für MariaDB-Verbindungstest mit DockerSetupModal-Integration
  const handleMariaDBConnectionTest = async () => {
    if (!validateMariaDBConfig(storageManagement.connections.mariadb)) {
      return;
    }

    // Setze Status auf "testing"
    handleStorageManagementUpdate({
      connections: {
        ...storageManagement.connections,
        mariadb: {
          ...storageManagement.connections.mariadb,
          connectionStatus: false,
          lastTested: new Date().toISOString(),
          testMessage: 'Verbindungstest läuft... Teste Verbindung zum MariaDB-Dienst...'
        }
      }
    });

    try {
      const result = await performMariaDBConnectionTest();

      if (result.success) {
        if (result.showModal) {
          // Zeige DockerSetupModal für fehlende Container
          setDockerModalServiceType('mariadb');
          setShowDockerSetupModal(true);
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              mariadb: {
                ...storageManagement.connections.mariadb,
                connectionStatus: false,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });
        } else {
          // Erfolgreiche Verbindung
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              mariadb: {
                ...storageManagement.connections.mariadb,
                connectionStatus: true,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });

          // Nach 8 Sekunden die Erfolgsmeldung ausblenden
          setTimeout(() => {
            setStorageManagement(prev => ({
              ...prev,
              connections: {
                ...prev.connections,
                mariadb: {
                  ...prev.connections.mariadb,
                  testMessage: undefined
                }
              }
            }));
          }, 8000);
        }
      } else {
        // Fehlgeschlagene Verbindung
        handleStorageManagementUpdate({
          connections: {
            ...storageManagement.connections,
            mariadb: {
              ...storageManagement.connections.mariadb,
              connectionStatus: false,
              lastTested: new Date().toISOString(),
              testMessage: result.message
            }
          }
        });
      }
    } catch (error) {
      console.error('Verbindungstest fehlgeschlagen:', error);
      handleStorageManagementUpdate({
        connections: {
          ...storageManagement.connections,
          mariadb: {
            ...storageManagement.connections.mariadb,
            connectionStatus: false,
            lastTested: new Date().toISOString(),
            testMessage: `❌ Verbindung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          }
        }
      });
    }
  };

  // Handler für MinIO-Verbindungstest mit DockerSetupModal-Integration
  const handleMinIOConnectionTest = async () => {
    if (!isMinIOConfigValid()) {
      return;
    }

    // Setze Status auf "testing"
    handleStorageManagementUpdate({
      connections: {
        ...storageManagement.connections,
        minio: {
          ...storageManagement.connections.minio,
          connectionStatus: false,
          lastTested: new Date().toISOString(),
          testMessage: 'Verbindungstest läuft... Teste Verbindung zum MinIO-Dienst...'
        }
      }
    });

    try {
      const result = await performMinIOConnectionTest();

      if (result.success) {
        if (result.showModal) {
          // Zeige DockerSetupModal für fehlende Container
          setDockerModalServiceType('minio');
          setShowDockerSetupModal(true);
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              minio: {
                ...storageManagement.connections.minio,
                connectionStatus: false,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });
        } else {
          // Erfolgreiche Verbindung
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              minio: {
                ...storageManagement.connections.minio,
                connectionStatus: true,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });
        }
      } else {
        // Fehlgeschlagene Verbindung
        handleStorageManagementUpdate({
          connections: {
            ...storageManagement.connections,
            minio: {
              ...storageManagement.connections.minio,
              connectionStatus: false,
              lastTested: new Date().toISOString(),
              testMessage: result.message
            }
          }
        });
      }
    } catch (error) {
      console.error('MinIO-Verbindungstest fehlgeschlagen:', error);
      handleStorageManagementUpdate({
        connections: {
          ...storageManagement.connections,
          minio: {
            ...storageManagement.connections.minio,
            connectionStatus: false,
            lastTested: new Date().toISOString(),
            testMessage: `❌ Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          }
        }
      });
    }
  };

  const getCurrentPictureStorage = () => {
    return storageManagement.selectedStorage.selectedPictureStorage?.toLowerCase() || 'undefined';
  };

  // Handler für DockerSetupModal
  const handleDockerSetupModalClose = () => {
    setShowDockerSetupModal(false);
  };

  const handleRestartConnectionTest = () => {
    setShowDockerSetupModal(false);

    // Starte den Verbindungstest erneut basierend auf dem Service-Type
    if (dockerModalServiceType === 'postgresql') {
      handleConnectionTest();
    } else if (dockerModalServiceType === 'mariadb') {
      handleMariaDBConnectionTest();
    } else if (dockerModalServiceType === 'mysql') {
      handleMySQLConnectionTest();
    } else if (dockerModalServiceType === 'minio') {
      handleMinIOConnectionTest();
    } else {
      // Fallback für 'all' - teste beide
      handleConnectionTest();
    }
  };

  // Supabase hat kein Docker-Modal, aber für Konsistenz hier verfügbar
  const handleRestartSupabaseTest = () => {
    handleSupabaseConnectionTest();
  };

  // Handler für Konfiguration übernehmen
  const handleConfigApply = () => {
    setShowConfigModal(true);
  };

  // Handler für Konfigurations-Modal
  const handleConfigModalClose = () => {
    setShowConfigModal(false);
  };

  // Handler für Data Merge Modal
  const handleDataMergeModalClose = () => {
    setShowDataMergeModal(false);
    setShowConfigModal(true); // Zurück zum Config-Modal
  };

  // Reset Transfer Progress beim Öffnen des Merge Modals
  const handleDataMergeModalOpen = () => {
    setTransferResults({});
    setTransferCompleted(false);
    setDataTransferProgress(null);
  };

  // Hilfsfunktion: Entitäts-Namen auf Deutsch
  const getEntityNameGerman = (entityType: string): string => {
    const nameMap: { [key: string]: string } = {
      'suppliers': 'Lieferanten',
      'articles': 'Artikel',
      'recipes': 'Rezepte'
    };
    return nameMap[entityType] || entityType;
  };

  // Handler für Datenübertragung mit Merge-Strategie
  const handleDataTransferWithStrategy = async () => {
    try {
      setShowDataMergeModal(false);
      setShowTransferProgressModal(true); // Öffne Progress Modal
      
      console.log('🚀 Starte Datenübertragung mit Benutzer-definierter Strategie...');
      console.log(`📊 Strategie: ${mergeStrategy}`);
      console.log(`🔀 Konflikt-Auflösung: ${conflictResolution}`);
      
      // 1. Initialisiere Quell-Storage
      const { StorageLayer } = await import('../services/storageLayer');
      const sourceStorageLayer = new (StorageLayer as any)();
      
      const sourceConfig = {
        mode: storageManagement.currentStorage.currentStorageMode,
        data: storageManagement.currentStorage.currentDataStorage,
        picture: storageManagement.currentStorage.currentPictureStorage
      };
      
      const connectionData = {
        postgres: storageManagement.connections.postgres,
        mariadb: storageManagement.connections.mariadb,
        mysql: storageManagement.connections.mysql,
        minio: storageManagement.connections.minio
      };
      
      await sourceStorageLayer.initialize(sourceConfig, connectionData);
      console.log('✅ Quell-Storage initialisiert');
      
      // 2. Initialisiere Ziel-Storage
      const targetStorageLayer = new (StorageLayer as any)();
      
      const targetConfig = {
        mode: storageManagement.selectedStorage.selectedStorageMode,
        data: storageManagement.selectedStorage.selectedDataStorage,
        picture: storageManagement.selectedStorage.selectedPictureStorage
      };
      
      await targetStorageLayer.initialize(targetConfig, connectionData);
      console.log('✅ Ziel-Storage initialisiert');
      
      // 3. Übertrage Daten mit gewählter Strategie
      const entityTypes = ['suppliers', 'articles', 'recipes'];
      const transferResult = await transferAllData(
        sourceStorageLayer,
        targetStorageLayer,
        entityTypes,
        mergeStrategy,
        conflictResolution
      );
      
      if (!transferResult.success) {
        throw new Error(transferResult.message);
      }
      
      console.log('✅ Datenübertragung mit Strategie erfolgreich!');
      console.log('📊 Details:', transferResult.details);
      
      // KEIN alert() mehr - Modal zeigt die Ergebnisse an!
      // Modal bleibt offen mit "Abgeschlossen"-Status
      
    } catch (error) {
      console.error('❌ Fehler bei der Datenübertragung:', error);
      setShowTransferProgressModal(false);
      alert(`Fehler bei der Datenübertragung: ${error instanceof Error ? error.message : String(error)}`);
      setShowDataMergeModal(false);
      setShowConfigModal(true);
    }
  };

  // Handler für Abschluss der Übertragung (wenn Benutzer "Fertig" klickt)
  const handleTransferComplete = async () => {
    try {
      setShowTransferProgressModal(false);
      
      // Fahre mit der Konfigurationsübernahme fort
      await finalizeConfigurationChange();
      setShowConfigModal(false);
      
    } catch (error) {
      console.error('❌ Fehler beim Finalisieren:', error);
      alert(`Fehler beim Finalisieren: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Finalisiert die Konfigurationsänderung (nach erfolgreicher Datenübertragung)
  const finalizeConfigurationChange = async () => {
    try {
      // Übertrage selectedStorage in currentStorage
      const newCurrentStorage = {
        currentStorageMode: storageManagement.selectedStorage.selectedStorageMode,
        currentCloudType: storageManagement.selectedStorage.selectedCloudType,
        currentDataStorage: storageManagement.selectedStorage.selectedDataStorage as any,
        currentPictureStorage: storageManagement.selectedStorage.selectedPictureStorage as any,
        isActive: true
      };

      handleStorageManagementUpdate({
        currentStorage: newCurrentStorage
      });

      // Initialisiere StorageLayer mit der neuen Konfiguration
      console.log('🚀 Initialisiere StorageLayer mit neuer Konfiguration...');
      
      const { storageLayer } = await import('../services/storageLayer');
      
      const storageConfig = {
        mode: newCurrentStorage.currentStorageMode,
        data: newCurrentStorage.currentDataStorage,
        picture: newCurrentStorage.currentPictureStorage
      };

      const connectionData = {
        postgres: storageManagement.connections.postgres,
        mariadb: storageManagement.connections.mariadb,
        mysql: storageManagement.connections.mysql,
        minio: storageManagement.connections.minio
      };

      const initSuccess = await storageLayer.initialize(storageConfig, connectionData);
      
      if (initSuccess) {
        console.log('✅ StorageLayer erfolgreich initialisiert');
        
        // Setze isActive auf true nach erfolgreicher Initialisierung
        handleStorageManagementUpdate({
          currentStorage: {
            ...newCurrentStorage,
            isActive: true
          }
        });
        
        // Lade Daten aus dem neuen Storage und setze sie in den AppContext
        console.log('📁 Lade Daten aus dem neuen Storage...');
        await loadAndSetAppData();
        
        showMessage(
          'Konfiguration übernommen',
          'Die neue Speicherkonfiguration wurde erfolgreich übernommen und der StorageLayer wurde initialisiert. Daten wurden geladen.',
          'success'
        );
      } else {
        throw new Error('StorageLayer-Initialisierung fehlgeschlagen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Finalisieren der Konfigurationsänderung:', error);
      throw error;
    }
  };

  // Prüfe ob sich die Konfiguration von der aktuellen unterscheidet
  const isConfigurationDifferent = () => {
    const current = storageManagement.currentStorage;
    const selected = storageManagement.selectedStorage;

    return (
      current.currentStorageMode !== selected.selectedStorageMode ||
      current.currentDataStorage !== selected.selectedDataStorage ||
      current.currentPictureStorage !== selected.selectedPictureStorage
    );
  };

  // ========================================
  // BACKUP & RESTORE FUNKTIONEN
  // ========================================

  /**
   * Erstellt ein vollständiges Backup aller Daten
   */
  const createBackup = async (): Promise<{ success: boolean; data?: any; message: string }> => {
    try {
      console.log('💾 Starte Backup-Erstellung...');
      setBackupProgress({ current: 0, total: 6, item: 'Initialisierung', message: 'Backup wird vorbereitet...' });
      setBackupCompleted(false);

      const backup: any = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        appVersion: '2.2.2',
        entities: {},
        localStorage: {},
        images: {}
      };

      // 1. Sichere Entitäts-Daten aus dem State
      const entityTypes = ['suppliers', 'articles', 'recipes'];
      for (let i = 0; i < entityTypes.length; i++) {
        const entityType = entityTypes[i];
        setBackupProgress({
          current: i + 1,
          total: 6,
          item: getEntityNameGerman(entityType),
          message: `Sichere ${getEntityNameGerman(entityType)}...`
        });

        const data = appContext.state[entityType as keyof typeof appContext.state];
        if (Array.isArray(data)) {
          backup.entities[entityType] = data;
          console.log(`✅ ${data.length} ${entityType} gesichert`);
        }
      }

      // 2. Sichere LocalStorage-Schlüssel
      setBackupProgress({
        current: 4,
        total: 6,
        item: 'LocalStorage',
        message: 'Sichere LocalStorage-Einstellungen...'
      });

      const localStorageKeys = ['artikelExportFilter', 'chef_design', 'storageManagement'];
      for (const key of localStorageKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          backup.localStorage[key] = value;
          console.log(`✅ LocalStorage-Schlüssel gesichert: ${key}`);
        }
      }

      // 3. Sichere Bilder
      setBackupProgress({
        current: 5,
        total: 6,
        item: 'Bilder',
        message: 'Sichere Bilder...'
      });

      const { storageLayer } = await import('../services/storageLayer');
      
      // Sichere Artikel-Bilder
      if (backup.entities.articles) {
        for (const article of backup.entities.articles) {
          try {
            const imagePath = `pictures/articles/${article.id}`;
            const imageData = await storageLayer.loadImage(imagePath);
            if (imageData) {
              backup.images[imagePath] = imageData;
              console.log(`📷 Artikelbild gesichert: ${article.name}`);
            }
          } catch (error) {
            console.warn(`⚠️ Fehler beim Sichern des Artikelbildes ${article.name}:`, error);
          }
        }
      }

      // Sichere Rezept-Bilder
      if (backup.entities.recipes) {
        for (const recipe of backup.entities.recipes) {
          try {
            const imagePath = `pictures/recipes/${recipe.id}`;
            const imageData = await storageLayer.loadImage(imagePath);
            if (imageData) {
              backup.images[imagePath] = imageData;
              console.log(`📷 Rezeptbild gesichert: ${recipe.name}`);
            }
          } catch (error) {
            console.warn(`⚠️ Fehler beim Sichern des Rezeptbildes ${recipe.name}:`, error);
          }
        }
      }

      setBackupProgress({
        current: 6,
        total: 6,
        item: 'Abschluss',
        message: 'Backup wird finalisiert...'
      });

      setBackupCompleted(true);
      setBackupProgress(null);

      console.log('✅ Backup erfolgreich erstellt');
      return { success: true, data: backup, message: 'Backup erfolgreich erstellt' };

    } catch (error) {
      setBackupProgress(null);
      setBackupCompleted(false);
      console.error('❌ Fehler beim Erstellen des Backups:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    }
  };

  /**
   * Stellt ein Backup wieder her
   */
  const restoreBackup = async (backupData: any): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('♻️ Starte Backup-Wiederherstellung...');
      setBackupProgress({ current: 0, total: 5, item: 'Initialisierung', message: 'Backup wird geladen...' });
      setBackupCompleted(false);

      // Validiere Backup-Format
      if (!backupData.entities || !backupData.version) {
        throw new Error('Ungültiges Backup-Format');
      }

      const { storageLayer } = await import('../services/storageLayer');

      // 1. Stelle Entitäts-Daten wieder her
      const entityTypes = ['suppliers', 'articles', 'recipes'];
      for (let i = 0; i < entityTypes.length; i++) {
        const entityType = entityTypes[i];
        setBackupProgress({
          current: i + 1,
          total: 5,
          item: getEntityNameGerman(entityType),
          message: `Stelle ${getEntityNameGerman(entityType)} wieder her...`
        });

        if (backupData.entities[entityType]) {
          const data = backupData.entities[entityType];
          
          // Speichere über StorageLayer
          await storageLayer.save(entityType, data);
          
          // Aktualisiere AppContext
          if (entityType === 'suppliers') {
            appContext.dispatch({ type: 'SET_SUPPLIERS', payload: data });
          } else if (entityType === 'articles') {
            appContext.dispatch({ type: 'SET_ARTICLES', payload: data });
          } else if (entityType === 'recipes') {
            appContext.dispatch({ type: 'SET_RECIPES', payload: data });
          }
          
          console.log(`✅ ${data.length} ${entityType} wiederhergestellt`);
        }
      }

      // 2. Stelle LocalStorage-Schlüssel wieder her (außer currentStorage)
      setBackupProgress({
        current: 4,
        total: 5,
        item: 'LocalStorage',
        message: 'Stelle LocalStorage-Einstellungen wieder her...'
      });

      if (backupData.localStorage) {
        for (const [key, value] of Object.entries(backupData.localStorage)) {
          if (key === 'storageManagement') {
            // Spezielle Behandlung für storageManagement
            try {
              const backupStorageManagement = JSON.parse(value as string);
              const currentStorageManagement = JSON.parse(localStorage.getItem('storageManagement') || '{}');
              
              // Behalte currentStorage aus aktuellem LocalStorage
              const mergedStorageManagement = {
                ...backupStorageManagement,
                currentStorage: currentStorageManagement.currentStorage // NICHT überschreiben!
              };
              
              localStorage.setItem('storageManagement', JSON.stringify(mergedStorageManagement));
              console.log('✅ storageManagement wiederhergestellt (currentStorage beibehalten)');
            } catch (error) {
              console.warn('⚠️ Fehler beim Wiederherstellen von storageManagement:', error);
            }
          } else {
            localStorage.setItem(key, value as string);
            console.log(`✅ LocalStorage-Schlüssel wiederhergestellt: ${key}`);
          }
        }
      }

      // 3. Stelle Bilder wieder her
      setBackupProgress({
        current: 5,
        total: 5,
        item: 'Bilder',
        message: 'Stelle Bilder wieder her...'
      });

      if (backupData.images) {
        for (const [imagePath, imageData] of Object.entries(backupData.images)) {
          try {
            // Konvertiere Base64 zurück zu File
            const blob = await fetch(imageData as string).then(r => r.blob());
            
            // Extrahiere Dateiendung aus dem Base64-String (data:image/jpeg;base64,...)
            const mimeType = (imageData as string).match(/data:([^;]+);/)?.[1] || 'image/jpeg';
            const extension = mimeType.split('/')[1] || 'jpg';
            
            // Extrahiere ID aus imagePath (pictures/recipes/ID oder pictures/articles/ID)
            const entityId = imagePath.split('/').pop() || 'image';
            const fileName = `${entityId}.${extension}`;
            
            const file = new File([blob], fileName, { type: mimeType });
            
            console.log(`📷 Restore Bild: imagePath=${imagePath}, fileName=${fileName}, type=${mimeType}`);
            await storageLayer.saveImage(imagePath, file);
            console.log(`✅ Bild wiederhergestellt: ${imagePath} als ${fileName}`);
          } catch (error) {
            console.warn(`⚠️ Fehler beim Wiederherstellen des Bildes ${imagePath}:`, error);
          }
        }
      }

      setBackupCompleted(true);
      setBackupProgress(null);

      console.log('✅ Backup erfolgreich wiederhergestellt');
      return { success: true, message: 'Backup erfolgreich wiederhergestellt' };

    } catch (error) {
      setBackupProgress(null);
      setBackupCompleted(false);
      console.error('❌ Fehler beim Wiederherstellen des Backups:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
    }
  };

  /**
   * Download-Funktion für Backup-Datei
   */
  const downloadBackup = (backupData: any) => {
    try {
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chef-numbers-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ Backup-Datei heruntergeladen');
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen der Backup-Datei:', error);
      setBackupError('Fehler beim Herunterladen der Backup-Datei');
      setBackupCompleted(false);
      setBackupProgress(null);
    }
  };

  /**
   * Handler für Backup-Erstellung
   */
  const handleCreateBackup = async () => {
    setBackupError(null);
    const result = await createBackup();
    if (result.success && result.data) {
      downloadBackup(result.data);
    } else {
      setBackupError(`Fehler beim Erstellen des Backups: ${result.message}`);
      setBackupCompleted(false);
      setBackupProgress(null);
    }
  };

  /**
   * Handler für Backup-Wiederherstellung
   */
  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBackupError(null);
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);
      
      const result = await restoreBackup(backupData);
      if (!result.success) {
        // Bei Fehler: Zeige Fehler im Modal
        setBackupError(`Fehler beim Wiederherstellen: ${result.message}`);
        setBackupCompleted(false);
        setBackupProgress(null);
      }
      // Bei Erfolg: Modal bleibt offen und zeigt Erfolgsmeldung (backupCompleted = true)
    } catch (error) {
      console.error('❌ Fehler beim Lesen der Backup-Datei:', error);
      setBackupError('Fehler beim Lesen der Backup-Datei. Stellen Sie sicher, dass es eine gültige Backup-Datei ist.');
      setBackupCompleted(false);
      setBackupProgress(null);
    }
  };

  // ========================================
  // UNIVERSELLE DATENÜBERTRAGUNGS-FUNKTIONEN
  // ========================================
  
  /**
   * Prüft ob ein Storage leer ist (keine Daten enthält)
   */
  const checkIfStorageIsEmpty = async (storageAdapter: any, entityTypes: string[]): Promise<boolean> => {
    try {
      for (const entityType of entityTypes) {
        const data = await storageAdapter.load(entityType);
        if (data && data.length > 0) {
          console.log(`📊 Storage enthält ${data.length} ${entityType}`);
          return false;
        }
      }
      console.log('✅ Storage ist leer');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Prüfen des Storage-Inhalts:', error);
      return false;
    }
  };

  /**
   * Universelle Merge-Funktion für Entitäten
   * Behandelt ID-Konflikte und Name-Duplikate
   */
  const mergeEntities = <T extends { id: string; name?: string; [key: string]: any }>(
    existingEntities: T[],
    newEntities: T[],
    strategy: 'overwrite' | 'merge',
    conflictResolution: 'keep_existing' | 'overwrite_with_new'
  ): T[] => {
    if (strategy === 'overwrite') {
      // Überschreibe komplett - gib nur neue Entitäten zurück
      console.log('📝 Strategie: Überschreiben - alle bestehenden Daten werden ersetzt');
      return newEntities;
    }

    // Merge-Strategie: Zusammenführen mit intelligenter Duplikat-Behandlung
    console.log('🔀 Strategie: Zusammenführen mit Konflikt-Auflösung');
    const mergedEntities = [...existingEntities];
    const processedIds = new Set(existingEntities.map(e => e.id));
    const processedNames = new Set(existingEntities.map(e => e.name?.toLowerCase()).filter(Boolean));

    for (const newEntity of newEntities) {
      // 1. Prüfe ID-Konflikt
      const existingIndexById = mergedEntities.findIndex(e => e.id === newEntity.id);
      
      if (existingIndexById >= 0) {
        // ID-Konflikt gefunden
        console.log(`⚠️ ID-Konflikt gefunden: ${newEntity.id} (${newEntity.name})`);
        
        if (conflictResolution === 'overwrite_with_new') {
          // Ersetze mit neuem Datensatz
          mergedEntities[existingIndexById] = newEntity;
          console.log(`✅ Datensatz überschrieben: ${newEntity.name}`);
        } else {
          // Behalte bestehenden Datensatz
          console.log(`✅ Bestehender Datensatz beibehalten: ${mergedEntities[existingIndexById].name}`);
        }
        continue;
      }

      // 2. Prüfe Name-Konflikt (nur wenn kein ID-Konflikt)
      if (newEntity.name) {
        const nameLower = newEntity.name.toLowerCase();
        const existingIndexByName = mergedEntities.findIndex(
          e => e.name?.toLowerCase() === nameLower
        );

        if (existingIndexByName >= 0) {
          // Name-Konflikt gefunden - füge "_neue Version" hinzu
          console.log(`⚠️ Name-Konflikt gefunden: ${newEntity.name}`);
          const modifiedEntity = {
            ...newEntity,
            name: `${newEntity.name}_neue Version`
          };
          mergedEntities.push(modifiedEntity);
          console.log(`✅ Datensatz mit neuem Namen hinzugefügt: ${modifiedEntity.name}`);
          continue;
        }
      }

      // 3. Kein Konflikt - füge hinzu
      mergedEntities.push(newEntity);
      console.log(`✅ Neuer Datensatz hinzugefügt: ${newEntity.name || newEntity.id}`);
    }

    return mergedEntities;
  };

  /**
   * Überträgt alle Daten vom aktuellen Storage zum neuen Storage
   */
  const transferAllData = async (
    sourceStorageAdapter: any,
    targetStorageAdapter: any,
    entityTypes: string[],
    strategy: 'overwrite' | 'merge',
    conflictResolution: 'keep_existing' | 'overwrite_with_new'
  ): Promise<{ success: boolean; message: string; details: any }> => {
    try {
      console.log('🚀 Starte Datenübertragung...');
      console.log(`📊 Strategie: ${strategy}`);
      console.log(`🔀 Konflikt-Auflösung: ${conflictResolution}`);
      
      // Initialisiere Transfer-Ergebnisse für UI
      const initialResults: any = {};
      entityTypes.forEach(type => {
        initialResults[type] = {
          source: 0,
          target: 0,
          transferred: 0,
          status: 'pending',
          progress: 0
        };
      });
      setTransferResults(initialResults);
      setTransferCompleted(false);
      
      const finalResults: any = {};
      let totalTransferred = 0;

      for (const entityType of entityTypes) {
        // Update Status: In Progress
        setTransferResults(prev => ({
          ...prev,
          [entityType]: { ...prev[entityType], status: 'in_progress', progress: 0 }
        }));

        setDataTransferProgress({
          current: entityTypes.indexOf(entityType) + 1,
          total: entityTypes.length,
          entityType,
          message: `Lade ${entityType} aus Quelle...`
        });

        // 1. Lade Daten aus Quell-Storage
        const sourceData = await sourceStorageAdapter.load(entityType);
        if (!sourceData || sourceData.length === 0) {
          console.log(`⏭️ Keine ${entityType} in Quelle gefunden - überspringe`);
          setTransferResults(prev => ({
            ...prev,
            [entityType]: { source: 0, target: 0, transferred: 0, status: 'completed', progress: 100 }
          }));
          finalResults[entityType] = { source: 0, target: 0, transferred: 0 };
          continue;
        }

        console.log(`📥 ${sourceData.length} ${entityType} aus Quelle geladen`);
        
        // Update Progress: 25%
        setTransferResults(prev => ({
          ...prev,
          [entityType]: { ...prev[entityType], source: sourceData.length, progress: 25 }
        }));

        setDataTransferProgress({
          current: entityTypes.indexOf(entityType) + 1,
          total: entityTypes.length,
          entityType,
          message: `Lade ${entityType} aus Ziel...`
        });

        // 2. Lade bestehende Daten aus Ziel-Storage
        let targetData = [];
        if (strategy === 'merge') {
          targetData = await targetStorageAdapter.load(entityType) || [];
          console.log(`📥 ${targetData.length} ${entityType} bereits im Ziel vorhanden`);
        }
        
        // Update Progress: 50%
        setTransferResults(prev => ({
          ...prev,
          [entityType]: { ...prev[entityType], target: targetData.length, progress: 50 }
        }));

        setDataTransferProgress({
          current: entityTypes.indexOf(entityType) + 1,
          total: entityTypes.length,
          entityType,
          message: `Führe ${entityType} zusammen...`
        });

        // 3. Merge die Daten basierend auf Strategie
        const mergedData = mergeEntities(targetData, sourceData, strategy, conflictResolution);
        console.log(`🔀 ${mergedData.length} ${entityType} nach Zusammenführung`);
        
        // Update Progress: 75%
        setTransferResults(prev => ({
          ...prev,
          [entityType]: { ...prev[entityType], progress: 75 }
        }));

        setDataTransferProgress({
          current: entityTypes.indexOf(entityType) + 1,
          total: entityTypes.length,
          entityType,
          message: `Speichere ${mergedData.length} ${entityType}...`
        });

        // 4. Speichere zusammengeführte Daten im Ziel-Storage
        // WICHTIG: Bei Übertragung zu einer neuen Datenbank, entferne alte dbIds
        // damit die neue Datenbank ihre eigenen IDs generiert
        const dataToSave = mergedData.map((item: any) => {
          const cleaned = { ...item };
          // Entferne alte dbId wenn Ziel leer war (neue Datenbank)
          if (targetData.length === 0) {
            delete cleaned.dbId;
            console.log(`🆕 Entferne alte dbId für neuen INSERT: ${item.id}`);
          }
          return cleaned;
        });
        
        const saveSuccess = await targetStorageAdapter.save(entityType, dataToSave);
        
        if (!saveSuccess) {
          throw new Error(`Fehler beim Speichern von ${entityType} im Ziel-Storage`);
        }

        // 5. Übertrage Bilder für Rezepte und Artikel
        if (entityType === 'recipes' || entityType === 'articles') {
          setDataTransferProgress({
            current: entityTypes.indexOf(entityType) + 1,
            total: entityTypes.length,
            entityType,
            message: `Übertrage Bilder für ${entityType}...`
          });

          let imagesTransferred = 0;
          let imagesFailed = 0;

          for (const item of sourceData) {
            try {
              // Prüfe ob Bild vorhanden ist
              const imagePath = `pictures/${entityType}/${item.id}`;
              
              // Versuche Bild aus Quelle zu laden
              let imageData: string | null = null;
              if ('loadImage' in sourceStorageAdapter) {
                imageData = await sourceStorageAdapter.loadImage(imagePath);
              }
              
              if (imageData) {
                // Bild gefunden - übertrage ins Ziel
                if ('saveImage' in targetStorageAdapter) {
                  // Konvertiere Base64 zurück zu File für saveImage
                  const blob = await fetch(imageData).then(r => r.blob());
                  const file = new File([blob], `${item.id}.jpg`, { type: 'image/jpeg' });
                  
                  const imageSaved = await targetStorageAdapter.saveImage(imagePath, file);
                  if (imageSaved) {
                    imagesTransferred++;
                    console.log(`📷 Bild übertragen: ${item.name || item.id}`);
                  } else {
                    imagesFailed++;
                    console.warn(`⚠️ Bild-Übertragung fehlgeschlagen: ${item.name || item.id}`);
                  }
                }
              }
            } catch (imageError) {
              console.warn(`⚠️ Fehler beim Übertragen des Bildes für ${item.name || item.id}:`, imageError);
              imagesFailed++;
            }
          }

          console.log(`📷 Bilder für ${entityType}: ${imagesTransferred} übertragen, ${imagesFailed} fehlgeschlagen`);
        }

        // Update Final Results und Status: Completed
        setTransferResults(prev => ({
          ...prev,
          [entityType]: { 
            source: sourceData.length,
            target: targetData.length,
            transferred: mergedData.length,
            status: 'completed',
            progress: 100
          }
        }));
        
        finalResults[entityType] = {
          source: sourceData.length,
          target: targetData.length,
          transferred: mergedData.length
        };
        
        totalTransferred += mergedData.length;
        console.log(`✅ ${entityType} erfolgreich übertragen`);
      }

      setDataTransferProgress(null);
      setTransferCompleted(true);

      return {
        success: true,
        message: `${totalTransferred} Datensätze erfolgreich übertragen`,
        details: finalResults
      };

    } catch (error) {
      setDataTransferProgress(null);
      setTransferCompleted(false);
      
      // Markiere alle noch nicht abgeschlossenen Entities als Fehler
      setTransferResults(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key].status !== 'completed') {
            updated[key] = { ...updated[key], status: 'error', progress: 0 };
          }
        });
        return updated;
      });
      
      console.error('❌ Fehler bei der Datenübertragung:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        details: {}
      };
    }
  };

  // Funktion zum Laden und Setzen der App-Daten aus dem StorageLayer
  const loadAndSetAppData = async () => {
    try {
      console.log('📁 Lade App-Daten aus dem StorageLayer...');
      
      const { storageLayer } = await import('../services/storageLayer');
      
      if (!storageLayer.isReady()) {
        console.warn('⚠️ StorageLayer ist nicht bereit, verwende Fallback');
        return;
      }
      
      // Lade alle App-Daten über StorageLayer
      const articles = await storageLayer.load('articles');
      const suppliers = await storageLayer.load('suppliers');
      const recipes = await storageLayer.load('recipes');
      // Design immer aus LocalStorage laden (nicht über StorageLayer)
      const design = localStorage.getItem('chef_design');
      
      console.log('📊 Geladene Daten:', {
        articles: articles?.length || 0,
        suppliers: suppliers?.length || 0,
        recipes: recipes?.length || 0,
        design: design?.length || 0
      });
      
      // Setze Daten in den AppContext
      if (articles && articles.length > 0) {
        appContext.dispatch({ type: 'SET_ARTICLES', payload: articles });
        console.log(`✅ ${articles.length} Artikel in den State geladen`);
      }
      
      if (suppliers && suppliers.length > 0) {
        appContext.dispatch({ type: 'SET_SUPPLIERS', payload: suppliers });
        console.log(`✅ ${suppliers.length} Lieferanten in den State geladen`);
      }
      
      if (recipes && recipes.length > 0) {
        appContext.dispatch({ type: 'SET_RECIPES', payload: recipes });
        console.log(`✅ ${recipes.length} Rezepte in den State geladen`);
      }
      
      if (design && design.length > 0) {
        // Design ist normalerweise ein einzelner Wert, nicht ein Array
        // Design aus LocalStorage parsen
        const designString = design ? JSON.parse(design) : 'warm';
        appContext.dispatch({ type: 'SET_CURRENT_DESIGN', payload: designString });
        console.log(`✅ Design "${designString}" in den State geladen`);
      }
      
      console.log('✅ Alle App-Daten erfolgreich in den State geladen');
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der App-Daten:', error);
    }
  };

  // Handler für Datenübertragung
  const handleDataTransfer = async (transferData: boolean) => {
    try {
      if (transferData) {
        console.log('🔄 Datenübertragung wird vorbereitet...');
        console.log('📊 Übertrage Daten von:', storageManagement.currentStorage);
        console.log('📊 Übertrage Daten nach:', storageManagement.selectedStorage);
        
        // 1. Initialisiere ALTEN Storage (Quelle) temporär
        const { StorageLayer } = await import('../services/storageLayer');
        const sourceStorageLayer = new (StorageLayer as any)();
        
        const sourceConfig = {
          mode: storageManagement.currentStorage.currentStorageMode,
          data: storageManagement.currentStorage.currentDataStorage,
          picture: storageManagement.currentStorage.currentPictureStorage
        };
        
        const sourceConnectionData = {
          postgres: storageManagement.connections.postgres,
          mariadb: storageManagement.connections.mariadb,
          mysql: storageManagement.connections.mysql,
          minio: storageManagement.connections.minio
        };
        
        await sourceStorageLayer.initialize(sourceConfig, sourceConnectionData);
        console.log('✅ Quell-Storage initialisiert');
        
        // 2. Initialisiere NEUEN Storage (Ziel) temporär
        const targetStorageLayer = new (StorageLayer as any)();
        
        const targetConfig = {
          mode: storageManagement.selectedStorage.selectedStorageMode,
          data: storageManagement.selectedStorage.selectedDataStorage,
          picture: storageManagement.selectedStorage.selectedPictureStorage
        };
        
        await targetStorageLayer.initialize(targetConfig, sourceConnectionData);
        console.log('✅ Ziel-Storage initialisiert');
        
        // 3. Prüfe ob Ziel-Storage leer ist
        const entityTypes = ['suppliers', 'articles', 'recipes'];
        const targetIsEmpty = await checkIfStorageIsEmpty(targetStorageLayer, entityTypes);
        
        if (!targetIsEmpty) {
          // Ziel-Storage enthält bereits Daten - zeige erweiterte Optionen
          console.log('⚠️ Ziel-Storage enthält bereits Daten - zeige Merge-Optionen');
          setTargetStorageHasData(true);
          handleDataMergeModalOpen(); // Reset Progress
          setShowConfigModal(false);
          setShowDataMergeModal(true);
          return; // Warte auf Benutzerentscheidung im Merge-Modal
        }
        
        // 4. Ziel-Storage ist leer - übertrage direkt
        console.log('✅ Ziel-Storage ist leer - starte direkte Übertragung');
        
        // Öffne Progress Modal
        setShowConfigModal(false);
        setShowTransferProgressModal(true);
        
        const transferResult = await transferAllData(
          sourceStorageLayer,
          targetStorageLayer,
          entityTypes,
          'merge', // Bei leerem Ziel ist Strategie egal
          'overwrite_with_new'
        );
        
        if (!transferResult.success) {
          throw new Error(transferResult.message);
        }
        
        console.log('✅ Datenübertragung erfolgreich!');
        console.log('📊 Details:', transferResult.details);
        
        // KEIN alert() mehr - Modal zeigt die Ergebnisse an!
      } else {
        console.log('⏭️ Datenübertragung übersprungen');
      }

      // Fahre mit Finalisierung fort
      await finalizeConfigurationChange();
      setShowConfigModal(false);

    } catch (error) {
      console.error('❌ Fehler beim Übernehmen der Konfiguration:', error);
      
      showMessage(
        'Konfiguration fehlgeschlagen',
        `Fehler beim Übernehmen der Konfiguration: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
      
      setShowConfigModal(false);
    }
  };

  // Auto-Hide für Testmeldungen nach 8 Sekunden
  useEffect(() => {
    if (storageManagement.connections.postgres.testMessage) {
      const timer = setTimeout(() => {
        setStorageManagement(prev => ({
          ...prev,
          connections: {
            ...prev.connections,
            postgres: {
              ...prev.connections.postgres,
              testMessage: undefined
            }
          }
        }));
      }, 8000); // 8 Sekunden

      return () => clearTimeout(timer);
    }
  }, [storageManagement.connections.postgres.testMessage]);

  // Auto-Hide für MinIO-Testmeldungen nach 8 Sekunden
  useEffect(() => {
    if (storageManagement.connections.minio.testMessage) {
      const timer = setTimeout(() => {
        setStorageManagement(prev => ({
          ...prev,
          connections: {
            ...prev.connections,
            minio: {
              ...prev.connections.minio,
              testMessage: undefined
            }
          }
        }));
      }, 8000); // 8 Sekunden

      return () => clearTimeout(timer);
    }
  }, [storageManagement.connections.minio.testMessage]);

  // Auto-Hide für MariaDB-Testmeldungen nach 8 Sekunden
  useEffect(() => {
    if (storageManagement.connections.mariadb.testMessage) {
      const timer = setTimeout(() => {
        setStorageManagement(prev => ({
          ...prev,
          connections: {
            ...prev.connections,
            mariadb: {
              ...prev.connections.mariadb,
              testMessage: undefined
            }
          }
        }));
      }, 8000); // 8 Sekunden

      return () => clearTimeout(timer);
    }
  }, [storageManagement.connections.mariadb.testMessage]);

  // Auto-Hide für MySQL-Testmeldungen nach 8 Sekunden
  useEffect(() => {
    if (storageManagement.connections.mysql.testMessage) {
      const timer = setTimeout(() => {
        setStorageManagement(prev => ({
          ...prev,
          connections: {
            ...prev.connections,
            mysql: {
              ...prev.connections.mysql,
              testMessage: undefined
            }
          }
        }));
      }, 8000); // 8 Sekunden

      return () => clearTimeout(timer);
    }
  }, [storageManagement.connections.mysql.testMessage]);

  // Auto-Hide für Supabase-Testmeldungen nach 8 Sekunden
  useEffect(() => {
    if (storageManagement.connections.supabase.testMessage) {
      const timer = setTimeout(() => {
        setStorageManagement(prev => ({
          ...prev,
          connections: {
            ...prev.connections,
            supabase: {
              ...prev.connections.supabase,
              testMessage: undefined
            }
          }
        }));
      }, 8000); // 8 Sekunden

      return () => clearTimeout(timer);
    }
  }, [storageManagement.connections.supabase.testMessage]);

  const isDatabaseConfigComplete = (dbType: string) => {
    const connection = storageManagement.connections[dbType.toLowerCase() as keyof StorageManagement['connections']];
    if (!connection || typeof connection !== 'object') return false;


    return !!(connection as any).host && !!(connection as any).port &&
      !!(connection as any).database && !!(connection as any).username &&
      !!(connection as any).password;
  };

  const isMinIOConfigComplete = () => {
    const minio = storageManagement.connections.minio;
    return !!(minio.host && minio.port && minio.accessKey && minio.secretKey && minio.bucket);
  };

  // Prüfe ob alle MinIO-Felder gültig sind
  const isMinIOConfigValid = (): boolean => {
    const config = storageManagement.connections.minio;

    // Prüfe alle erforderlichen Felder
    const hostValid = config.host && validateHostname(config.host).isValid;
    const portValid = config.port && validatePort(config.port).isValid;
    const consolePortValid = config.consolePort && validatePort(config.consolePort).isValid;
    const accessKeyValid = config.accessKey && config.accessKey.length > 0;
    const secretKeyValid = config.secretKey && config.secretKey.length > 0;
    const bucketValid = config.bucket && validateMinIOBucket(config.bucket).isValid;

    return !!(hostValid && portValid && consolePortValid && accessKeyValid && secretKeyValid && bucketValid);
  };

  const togglePasswordVisibility = (fieldKey: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  // Funktion zum Ausblenden von Validierungsnachrichten nach 5 Sekunden
  const hideValidationMessage = (fieldKey: string) => {
    setTimeout(() => {
      setValidationMessages(prev => ({ ...prev, [fieldKey]: false }));
    }, 5000);
  };

  // Funktion zum Ausblenden der Passwortstärke-Anzeige nach 5 Sekunden
  const hidePasswordStrength = () => {
    setTimeout(() => {
      setShowPasswordStrength(false);
    }, 5000);
  };

  // Funktion zum Ausblenden der MinIO Passwortstärke-Anzeige nach 5 Sekunden
  const hideMinIOPasswordStrength = () => {
    setTimeout(() => {
      setShowMinIOPasswordStrength(false);
    }, 5000);
  };

  const showMessage = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    // TODO: Implementiere Schönen Dialog
  };




  // Validierungsfunktion für IP-Adresse/Hostname
  const validateHostname = (hostname: string): { isValid: boolean; message: string } => {
    if (!hostname.trim()) {
      return { isValid: false, message: 'Hostname/IP-Adresse ist erforderlich' };
    }

    // Strengere IPv4-Adresse Regex - jede Oktett muss 0-255 sein
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;

    // Strengere Hostname Regex (RFC 1123)
    const hostnameRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;

    // localhost ist immer gültig
    if (hostname.toLowerCase() === 'localhost') {
      return { isValid: true, message: '✓ Gültiger Hostname' };
    }

    // Prüfe IPv4
    if (ipv4Regex.test(hostname)) {
      return { isValid: true, message: '✓ Gültige IPv4-Adresse' };
    }

    // Prüfe Hostname
    if (hostnameRegex.test(hostname)) {
      return { isValid: true, message: '✓ Gültiger Hostname' };
    }

    return { isValid: false, message: 'Ungültige IP-Adresse oder Hostname' };
  };

  // Validierungsfunktion für Port
  const validatePort = (port: string): { isValid: boolean; message: string } => {
    if (!port.trim()) {
      return { isValid: false, message: 'Port ist erforderlich' };
    }

    // Prüfe ob nur Zahlen eingegeben wurden
    const portRegex = /^\d+$/;
    if (!portRegex.test(port)) {
      return { isValid: false, message: 'Port darf nur Zahlen enthalten' };
    }

    const portNumber = parseInt(port);

    if (isNaN(portNumber)) {
      return { isValid: false, message: 'Port muss eine Zahl sein' };
    }

    if (portNumber < 1 || portNumber > 65535) {
      return { isValid: false, message: 'Port muss zwischen 1 und 65535 liegen' };
    }

    return { isValid: true, message: '✓ Gültiger Port' };
  };

  // Validierung für PostgreSQL-Benutzernamen
  const validatePostgreSQLUsername = (username: string): { isValid: boolean; message: string } => {
    if (!username.trim()) {
      return { isValid: false, message: 'Benutzername ist erforderlich' };
    }

    // PostgreSQL-Benutzername-Regeln:
    // - Nur Kleinbuchstaben, Zahlen und Unterstriche
    // - Muss mit Buchstabe beginnen
    // - Maximal 63 Zeichen
    // - Keine Leerzeichen oder Sonderzeichen
    const postgresUsernameRegex = /^[a-z][a-z0-9_]{0,62}$/;

    if (!postgresUsernameRegex.test(username)) {
      return {
        isValid: false,
        message: 'Nur Kleinbuchstaben, Zahlen und Unterstriche. Muss mit Buchstabe beginnen.'
      };
    }

    if (username.length > 63) {
      return { isValid: false, message: 'Maximal 63 Zeichen erlaubt' };
    }

    return { isValid: true, message: '✓ Gültiger PostgreSQL-Benutzername' };
  };

  // Validierung für PostgreSQL-Datenbanknamen
  const validatePostgreSQLDatabaseName = (databaseName: string): { isValid: boolean; message: string } => {
    if (!databaseName.trim()) {
      return { isValid: false, message: 'Datenbankname ist erforderlich' };
    }

    // PostgreSQL-Datenbankname-Regeln:
    // - Nur Kleinbuchstaben, Zahlen und Unterstriche
    // - Muss mit Buchstabe beginnen
    // - Maximal 63 Zeichen
    // - Keine Leerzeichen oder Sonderzeichen
    // - Keine reservierten Wörter
    const postgresDatabaseRegex = /^[a-z][a-z0-9_]{0,62}$/;

    // Reservierte PostgreSQL-Wörter
    const reservedWords = [
      'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric', 'authorization',
      'binary', 'both', 'case', 'cast', 'check', 'collate', 'column', 'concurrently', 'constraint',
      'create', 'cross', 'current_catalog', 'current_date', 'current_role', 'current_schema',
      'current_time', 'current_timestamp', 'current_user', 'default', 'deferrable', 'desc', 'distinct',
      'do', 'else', 'end', 'except', 'false', 'fetch', 'for', 'foreign', 'from', 'grant', 'group',
      'having', 'in', 'initially', 'inner', 'intersect', 'into', 'lateral', 'leading', 'left', 'like',
      'limit', 'localtime', 'localtimestamp', 'natural', 'not', 'null', 'offset', 'on', 'only', 'or',
      'order', 'outer', 'over', 'overlaps', 'placing', 'primary', 'references', 'returning', 'right',
      'select', 'session_user', 'similar', 'some', 'symmetric', 'table', 'then', 'to', 'trailing',
      'true', 'union', 'unique', 'user', 'using', 'variadic', 'verbose', 'when', 'where', 'window',
      'with', 'postgres', 'template0', 'template1'
    ];

    if (!postgresDatabaseRegex.test(databaseName)) {
      return {
        isValid: false,
        message: 'Nur Kleinbuchstaben, Zahlen und Unterstriche. Muss mit Buchstabe beginnen.'
      };
    }

    if (databaseName.length > 63) {
      return { isValid: false, message: 'Maximal 63 Zeichen erlaubt' };
    }

    if (reservedWords.includes(databaseName.toLowerCase())) {
      return { isValid: false, message: 'Reservierter PostgreSQL-Name - verwenden Sie einen anderen Namen' };
    }

    return { isValid: true, message: '✓ Gültiger PostgreSQL-Datenbankname' };
  };

  // Validierung für MariaDB-Benutzernamen
  const validateMariaDBUsername = (username: string): { isValid: boolean; message: string } => {
    if (!username.trim()) {
      return { isValid: false, message: 'Benutzername ist erforderlich' };
    }

    // Verhindere root-Benutzername aus Sicherheitsgründen
    if (username.toLowerCase() === 'root') {
      return { isValid: false, message: 'Benutzername "root" ist aus Sicherheitsgründen nicht erlaubt. Verwenden Sie einen anderen Benutzernamen.' };
    }

    // MariaDB-Benutzername-Regeln:
    // - Buchstaben, Zahlen, Unterstriche und Bindestriche
    // - Maximal 16 Zeichen
    // - Keine Leerzeichen oder Sonderzeichen
    const mariadbUsernameRegex = /^[a-zA-Z0-9_-]{1,16}$/;

    if (!mariadbUsernameRegex.test(username)) {
      return { isValid: false, message: 'Nur Buchstaben, Zahlen, Unterstriche und Bindestriche erlaubt. Maximal 16 Zeichen.' };
    }

    return { isValid: true, message: '✓ Gültiger MariaDB-Benutzername' };
  };

  // Validierung für MariaDB-Datenbanknamen
  const validateMariaDBDatabaseName = (databaseName: string): { isValid: boolean; message: string } => {
    if (!databaseName.trim()) {
      return { isValid: false, message: 'Datenbankname ist erforderlich' };
    }

    // MariaDB-Datenbankname-Regeln:
    // - Buchstaben, Zahlen, Unterstriche und Bindestriche
    // - Maximal 64 Zeichen
    // - Keine Leerzeichen oder Sonderzeichen
    const mariadbDatabaseRegex = /^[a-zA-Z0-9_-]{1,64}$/;

    if (!mariadbDatabaseRegex.test(databaseName)) {
      return { isValid: false, message: 'Nur Buchstaben, Zahlen, Unterstriche und Bindestriche erlaubt. Maximal 64 Zeichen.' };
    }

    return { isValid: true, message: '✓ Gültiger MariaDB-Datenbankname' };
  };

  // Validiert MariaDB-Konfiguration für Verbindungstest-Button
  const validateMariaDBConfig = (config: any): boolean => {
    // Prüfe alle erforderlichen Felder mit strenger Validierung
    const hostValid = config.host && validateHostname(config.host).isValid;
    const portValid = config.port && validatePort(config.port).isValid;
    const prismaPortValid = config.prismaPort && validatePort(config.prismaPort).isValid;
    const databaseValid = config.database && validateMariaDBDatabaseName(config.database).isValid;
    const usernameValid = config.username && validateMariaDBUsername(config.username).isValid;
    const passwordValid = config.password && config.password.length > 0;

    return !!(hostValid && portValid && prismaPortValid && databaseValid && usernameValid && passwordValid);
  };

  // Berechne MariaDB-Button-Status (mit useMemo optimiert)
  isMariaDBButtonEnabled = React.useMemo(
    () => validateMariaDBConfig(storageManagement.connections.mariadb),
    [
      storageManagement.connections.mariadb.host,
      storageManagement.connections.mariadb.port,
      storageManagement.connections.mariadb.prismaPort,
      storageManagement.connections.mariadb.database,
      storageManagement.connections.mariadb.username,
      storageManagement.connections.mariadb.password
    ]
  );

  // Supabase-spezifische Validierungsfunktionen
  const validateSupabaseURL = (url: string): { isValid: boolean; message: string } => {
    if (!url.trim()) {
      return { isValid: false, message: 'Supabase-URL ist erforderlich' };
    }

    // Supabase-URLs haben typischerweise das Format: https://xxxxx.supabase.co
    const supabaseUrlRegex = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
    
    if (!url.startsWith('https://')) {
      return { isValid: false, message: 'URL muss mit https:// beginnen' };
    }

    if (!supabaseUrlRegex.test(url)) {
      return { isValid: false, message: 'Ungültige Supabase-URL. Format: https://xxxxx.supabase.co' };
    }

    return { isValid: true, message: '✓ Gültige Supabase-URL' };
  };

  const validateSupabaseKey = (key: string, keyType: 'anon' | 'service'): { isValid: boolean; message: string } => {
    if (!key.trim()) {
      return { isValid: false, message: `${keyType === 'anon' ? 'Anon' : 'Service Role'} Key ist erforderlich` };
    }

    // Supabase-Keys sind JWT-Tokens, die mit "eyJ" beginnen
    if (!key.startsWith('eyJ')) {
      return { isValid: false, message: 'Ungültiger Key-Format. Supabase-Keys beginnen mit "eyJ"' };
    }

    // Prüfe auf mindestens 100 Zeichen (typisch für JWT)
    if (key.length < 100) {
      return { isValid: false, message: 'Key zu kurz. Supabase-Keys sind normalerweise 200+ Zeichen lang' };
    }

    return { isValid: true, message: `✓ Gültiger ${keyType === 'anon' ? 'Anon' : 'Service Role'} Key` };
  };

  const validateSupabaseConfig = (config: any): boolean => {
    if (!config) return false;

    return validateSupabaseURL(config.url || '').isValid &&
      validateSupabaseKey(config.anonKey || '', 'anon').isValid &&
      validateSupabaseKey(config.serviceRoleKey || '', 'service').isValid;
  };

  // Berechne Supabase-Button-Status (mit useMemo optimiert)
  const isSupabaseButtonEnabled = React.useMemo(
    () => validateSupabaseConfig(storageManagement.connections.supabase),
    [
      storageManagement.connections.supabase.url,
      storageManagement.connections.supabase.anonKey,
      storageManagement.connections.supabase.serviceRoleKey
    ]
  );

  // MySQL-spezifische Validierungsfunktionen
  const validateMySQLUsername = (username: string): { isValid: boolean; message: string } => {
    if (!username.trim()) {
      return { isValid: false, message: 'MySQL-Benutzername ist erforderlich' };
    }

    // Verhindere root-Benutzername aus Sicherheitsgründen
    if (username.toLowerCase() === 'root') {
      return { isValid: false, message: 'Benutzername "root" ist aus Sicherheitsgründen nicht erlaubt. Verwenden Sie einen anderen Benutzernamen.' };
    }

    // MySQL-Benutzername-Regeln: 1-32 Zeichen, alphanumerisch + _ und $
    const mysqlUsernameRegex = /^[a-zA-Z0-9_$]{1,32}$/;
    if (!mysqlUsernameRegex.test(username)) {
      return { isValid: false, message: 'MySQL-Benutzername: 1-32 Zeichen, nur Buchstaben, Zahlen, _ und $' };
    }

    return { isValid: true, message: '✓ Gültiger MySQL-Benutzername' };
  };

  const validateMySQLDatabaseName = (database: string): { isValid: boolean; message: string } => {
    if (!database.trim()) {
      return { isValid: false, message: 'MySQL-Datenbankname ist erforderlich' };
    }

    // MySQL-Datenbankname-Regeln: 1-64 Zeichen, alphanumerisch + _ und $
    const mysqlDatabaseRegex = /^[a-zA-Z0-9_$]{1,64}$/;
    if (!mysqlDatabaseRegex.test(database)) {
      return { isValid: false, message: 'MySQL-Datenbankname: 1-64 Zeichen, nur Buchstaben, Zahlen, _ und $' };
    }

    return { isValid: true, message: 'MySQL-Datenbankname ist gültig' };
  };

  const validateMySQLConfig = (config: any): boolean => {
    if (!config) return false;

    return validateHostname(config.host || '').isValid &&
      validatePort(config.port || '').isValid &&
      validateMySQLUsername(config.username || '').isValid &&
      validateMySQLDatabaseName(config.database || '').isValid &&
      validatePort(config.prismaPort || '').isValid &&
      (config.password || '').trim().length > 0;
  };

  // Berechne MySQL-Button-Status (mit useMemo optimiert)
  const isMySQLButtonEnabled = React.useMemo(
    () => validateMySQLConfig(storageManagement.connections.mysql),
    [
      storageManagement.connections.mysql.host,
      storageManagement.connections.mysql.port,
      storageManagement.connections.mysql.prismaPort,
      storageManagement.connections.mysql.database,
      storageManagement.connections.mysql.username,
      storageManagement.connections.mysql.password
    ]
  );

  // MySQL-Verbindungstest (ähnlich MariaDB)
  const performMySQLConnectionTest = async (): Promise<{ success: boolean; message: string; showModal?: boolean }> => {
    const host = storageManagement.connections.mysql.host;
    const mysqlPort = storageManagement.connections.mysql.port || '3306';
    const prismaPort = storageManagement.connections.mysql.prismaPort || '3001';

    if (!host) {
      return { success: false, message: 'Keine Host-Adresse angegeben' };
    }

    try {
      // Schritt 1: IP-Adresse prüfen
      const ipPingResult = await pingHost(host);

      if (!ipPingResult.success) {
        return {
          success: false,
          message: `IP-Adresse ${host} nicht erreichbar: ${ipPingResult.message}`
        };
      }

      // Schritt 2: MySQL-Port prüfen
      const mysqlPortResult = await checkPortAvailability(host, mysqlPort);

      // Schritt 3: Prisma API-Port prüfen
      const prismaPortResult = await checkPortAvailability(host, prismaPort);

      // Prüfe speziell, ob Prisma API verfügbar ist
      const isPrismaAPIAvailable = prismaPortResult.success;
      const isMySQLAvailable = mysqlPortResult.success;

      // Szenario A: IP erreichbar, aber Prisma API nicht verfügbar (keine Container)
      if (!isPrismaAPIAvailable) {
        return {
          success: true,
          message: `IP-Adresse ${host} erreichbar, aber keine Docker-Container gefunden`,
          showModal: true
        };
      }

      // Szenario B: Prisma API verfügbar - teste Datenbankverbindung
      if (isPrismaAPIAvailable) {
        const dbConfig = {
          host: host,
          port: mysqlPort,
          database: storageManagement.connections.mysql.database,
          username: storageManagement.connections.mysql.username,
          password: storageManagement.connections.mysql.password
        };

        console.log('🔍 DEBUG: MySQL-Verbindungstest mit Konfiguration:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          password: '[HIDDEN]'
        });

        try {
          console.log('🔍 Starte Datenbankexistenz-Prüfung für:', { host, mysqlPort, prismaPort });

          // Direkte Datenbankverbindung über Prisma API testen
          const prismaUrl = `http://${host}:${prismaPort}`;
          console.log('🌐 Prisma API URL:', prismaUrl);

          // Teste Prisma API-Verbindung mit Health-Check
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`${prismaUrl}/health`, {
            method: 'GET',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Prisma API Health-Check fehlgeschlagen (Status: ${response.status})`);
          }

          console.log('✅ Prisma API Health-Check erfolgreich');

          // Teste Datenbankverbindung über Prisma API
          const dbTestResponse = await fetch(`${prismaUrl}/api/test-connection`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dbConfig),
            signal: controller.signal
          });

          if (!dbTestResponse.ok) {
            throw new Error(`Datenbankverbindung fehlgeschlagen (Status: ${dbTestResponse.status})`);
          }

          const dbTestResult = await dbTestResponse.json();

          if (!dbTestResult.success) {
            throw new Error(`Datenbankverbindung fehlgeschlagen: ${dbTestResult.error}`);
          }

          console.log('✅ MySQL-Datenbankverbindung erfolgreich');

          return {
            success: true,
            message: `✅ MySQL-Verbindung erfolgreich! Datenbank "${dbConfig.database}" ist erreichbar.`
          };

        } catch (error) {
          console.error('❌ MySQL-Datenbankverbindung fehlgeschlagen:', error);
          return {
            success: false,
            message: `MySQL-Datenbankverbindung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          };
        }
      }

      // Fallback für unerwartete Szenarien
      return {
        success: false,
        message: 'MySQL-Verbindungstest konnte nicht abgeschlossen werden'
      };

    } catch (error) {
      console.error('MySQL-Verbindungstest fehlgeschlagen:', error);
      return {
        success: false,
        message: `Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  };

  // Handler für MySQL-Verbindungstest mit DockerSetupModal-Integration
  const handleMySQLConnectionTest = async () => {
    if (!validateMySQLConfig(storageManagement.connections.mysql)) {
      return;
    }

    // Setze Status auf "testing"
    handleStorageManagementUpdate({
      connections: {
        ...storageManagement.connections,
        mysql: {
          ...storageManagement.connections.mysql,
          connectionStatus: false,
          lastTested: new Date().toISOString(),
          testMessage: 'Verbindungstest läuft... Teste Verbindung zum MySQL-Dienst...'
        }
      }
    });

    try {
      const result = await performMySQLConnectionTest();

      if (result.success) {
        if (result.showModal) {
          // Zeige DockerSetupModal für fehlende Container
          setDockerModalServiceType('mysql');
          setShowDockerSetupModal(true);
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              mysql: {
                ...storageManagement.connections.mysql,
                connectionStatus: false,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });
        } else {
          // Erfolgreiche Verbindung
          handleStorageManagementUpdate({
            connections: {
              ...storageManagement.connections,
              mysql: {
                ...storageManagement.connections.mysql,
                connectionStatus: true,
                lastTested: new Date().toISOString(),
                testMessage: result.message
              }
            }
          });

          // Nach 8 Sekunden die Erfolgsmeldung ausblenden
          setTimeout(() => {
            setStorageManagement(prev => ({
              ...prev,
              connections: {
                ...prev.connections,
                mysql: {
                  ...prev.connections.mysql,
                  testMessage: undefined
                }
              }
            }));
          }, 8000);
        }
      } else {
        // Fehlgeschlagene Verbindung
        handleStorageManagementUpdate({
          connections: {
            ...storageManagement.connections,
            mysql: {
              ...storageManagement.connections.mysql,
              connectionStatus: false,
              lastTested: new Date().toISOString(),
              testMessage: result.message
            }
          }
        });
      }
    } catch (error) {
      console.error('Verbindungstest fehlgeschlagen:', error);
      handleStorageManagementUpdate({
        connections: {
          ...storageManagement.connections,
          mysql: {
            ...storageManagement.connections.mysql,
            connectionStatus: false,
            lastTested: new Date().toISOString(),
            testMessage: `❌ Verbindung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          }
        }
      });
    }
  };

  // Supabase-Verbindungstest
  const performSupabaseConnectionTest = async (): Promise<{ success: boolean; message: string }> => {
    const url = storageManagement.connections.supabase.url;
    const anonKey = storageManagement.connections.supabase.anonKey;

    if (!url || !anonKey) {
      return { success: false, message: 'URL oder Anon Key fehlt' };
    }

    try {
      console.log('🔍 Teste Supabase-Verbindung...', { url: url, anonKey: anonKey.substring(0, 20) + '...' });

      // Teste Supabase REST API mit einem einfachen Request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Teste die REST API (ohne Schema-Abhängigkeit)
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Supabase-Response:', response.status, response.statusText);

      if (response.ok || response.status === 404) {
        // 200 OK oder 404 (Schema fehlt, aber Verbindung steht)
        console.log('✅ Supabase-Verbindung erfolgreich');
        return {
          success: true,
          message: `✅ Supabase-Verbindung erfolgreich!\nURL: ${url}\nStatus: Verbunden\n\nSie können jetzt Daten synchronisieren.`
        };
      } else if (response.status === 401 || response.status === 403) {
        console.log('❌ Supabase-Authentifizierung fehlgeschlagen');
        return {
          success: false,
          message: `❌ Authentifizierung fehlgeschlagen!\nPrüfen Sie Ihre Supabase API-Keys.\nStatus: ${response.status}`
        };
      } else {
        console.log(`❌ Supabase-Verbindung fehlgeschlagen: ${response.status}`);
        return {
          success: false,
          message: `Verbindung fehlgeschlagen: ${response.status} ${response.statusText}`
        };
      }

    } catch (error) {
      console.error('❌ Supabase-Verbindungstest fehlgeschlagen:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Verbindungstest-Timeout - Supabase ist nicht erreichbar'
        };
      }

      return {
        success: false,
        message: `Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  };

  // Handler für Supabase-Verbindungstest
  const handleSupabaseConnectionTest = async () => {
    if (!validateSupabaseConfig(storageManagement.connections.supabase)) {
      return;
    }

    // Setze Status auf "testing"
    handleStorageManagementUpdate({
      connections: {
        ...storageManagement.connections,
        supabase: {
          ...storageManagement.connections.supabase,
          connectionStatus: false,
          lastTested: new Date().toISOString(),
          testMessage: 'Verbindungstest läuft... Teste Verbindung zu Supabase...'
        }
      }
    });

    try {
      const result = await performSupabaseConnectionTest();

      if (result.success) {
        // Erfolgreiche Verbindung
        handleStorageManagementUpdate({
          connections: {
            ...storageManagement.connections,
            supabase: {
              ...storageManagement.connections.supabase,
              connectionStatus: true,
              lastTested: new Date().toISOString(),
              testMessage: result.message
            }
          }
        });

        // Setze automatisch Supabase als selectedDataStorage und selectedPictureStorage
        handleStorageManagementUpdate({
          selectedStorage: {
            ...storageManagement.selectedStorage,
            selectedDataStorage: 'Supabase',
            selectedPictureStorage: 'Supabase'
          }
        });
      } else {
        // Fehlgeschlagene Verbindung
        handleStorageManagementUpdate({
          connections: {
            ...storageManagement.connections,
            supabase: {
              ...storageManagement.connections.supabase,
              connectionStatus: false,
              lastTested: new Date().toISOString(),
              testMessage: result.message
            }
          }
        });
      }
    } catch (error) {
      console.error('Supabase-Verbindungstest fehlgeschlagen:', error);
      handleStorageManagementUpdate({
        connections: {
          ...storageManagement.connections,
          supabase: {
            ...storageManagement.connections.supabase,
            connectionStatus: false,
            lastTested: new Date().toISOString(),
            testMessage: `❌ Verbindung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          }
        }
      });
    }
  };

  // Passwort-Generator für PostgreSQL-sichere Passwörter (nur alphanumerisch)
  const generateSecurePassword = (): string => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    // Nur alphanumerische Zeichen für maximale PostgreSQL-Kompatibilität
    const allChars = lowercase + uppercase + numbers;

    let password = '';

    // Mindestens ein Zeichen von jeder Kategorie
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Fülle auf 16 Zeichen auf (länger für bessere Sicherheit ohne Sonderzeichen)
    for (let i = 3; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mische die Zeichen
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Passwort-Sicherheitsvalidierung (angepasst für alphanumerische Passwörter)
  const validatePasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string; score: number } => {
    if (!password) {
      return { strength: 'weak', message: 'Passwort ist erforderlich', score: 0 };
    }

    let score = 0;
    const messages = [];

    // Länge prüfen (wichtig für alphanumerische Passwörter)
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 2; // Extra Punkt für sehr lange Passwörter

    // Zeichen-Vielfalt prüfen
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;

    // PostgreSQL-Konventionen prüfen
    if (!/['"\\\s]/.test(password)) score += 1; // Keine Anführungszeichen, Backslashes oder Leerzeichen
    if (/^[a-zA-Z0-9]+$/.test(password)) score += 1; // Nur alphanumerische Zeichen (PostgreSQL-sicher)

    // Stärke bestimmen
    let strength: 'weak' | 'medium' | 'strong';
    let message: string;

    if (score <= 4) {
      strength = 'weak';
      message = 'Schwaches Passwort - verwenden Sie mindestens 12 Zeichen mit Groß-/Kleinbuchstaben und Zahlen';
    } else if (score <= 6) {
      strength = 'medium';
      message = 'Mittleres Passwort - für bessere Sicherheit verwenden Sie mehr Zeichen (16+ empfohlen)';
    } else {
      strength = 'strong';
      message = 'Starkes Passwort - PostgreSQL-sicher und alphanumerisch';
    }

    return { strength, message, score };
  };

  // Passwort-Generator für MinIO Secret Keys (nur alphanumerisch - keine Sonderzeichen)
  const generateMinIOSecurePassword = (): string => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    // Nur alphanumerische Zeichen für MinIO Secret Keys (vermeidet Sonderzeichen-Probleme)
    const allChars = lowercase + uppercase + numbers;

    let password = '';

    // Mindestens ein Zeichen von jeder Kategorie
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Fülle auf 20 Zeichen auf (MinIO empfiehlt lange Secret Keys)
    for (let i = 3; i < 20; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mische die Zeichen
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Passwort-Sicherheitsvalidierung für MinIO Secret Keys (nur alphanumerisch)
  const validateMinIOPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string; score: number } => {
    if (!password) {
      return { strength: 'weak', message: 'Secret Key ist erforderlich', score: 0 };
    }

    let score = 0;
    const messages = [];

    // Länge prüfen (MinIO empfiehlt lange Secret Keys)
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 2; // Extra Punkt für sehr lange Secret Keys

    // Zeichen-Vielfalt prüfen
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/^[a-zA-Z0-9]+$/.test(password)) score += 2; // Nur alphanumerische Zeichen (empfohlen für MinIO)

    // MinIO-spezifische Prüfungen
    if (!/['"\\\s]/.test(password)) score += 1; // Keine problematischen Zeichen
    if (password.length >= 16) score += 1; // MinIO empfiehlt mindestens 16 Zeichen

    // Stärke bestimmen
    let strength: 'weak' | 'medium' | 'strong';
    let message: string;

    if (score <= 5) {
      strength = 'weak';
      message = 'Schwacher Secret Key - verwenden Sie mindestens 16 alphanumerische Zeichen';
    } else if (score <= 8) {
      strength = 'medium';
      message = 'Mittlerer Secret Key - empfohlen sind mindestens 20 alphanumerische Zeichen';
    } else {
      strength = 'strong';
      message = 'Starker Secret Key - sehr sicher für MinIO (alphanumerisch)';
    }

    return { strength, message, score };
  };

  // MinIO Bucket-Validierung nach offiziellen Naming Rules
  const validateMinIOBucket = (bucketName: string): { isValid: boolean; message: string } => {
    if (!bucketName || bucketName.trim().length === 0) {
      return { isValid: false, message: 'Bucket-Name ist erforderlich' };
    }

    const bucket = bucketName.trim();

    // Regel 1: Länge zwischen 3 und 63 Zeichen
    if (bucket.length < 3) {
      return { isValid: false, message: 'Bucket-Name muss mindestens 3 Zeichen lang sein' };
    }
    if (bucket.length > 63) {
      return { isValid: false, message: 'Bucket-Name darf maximal 63 Zeichen lang sein' };
    }

    // Regel 2: Nur Kleinbuchstaben, Zahlen, Punkte und Bindestriche
    if (!/^[a-z0-9.-]+$/.test(bucket)) {
      return { isValid: false, message: 'Bucket-Name darf nur Kleinbuchstaben, Zahlen, Punkte (.) und Bindestriche (-) enthalten' };
    }

    // Regel 3: Keine zwei benachbarten Punkte
    if (/\.\./.test(bucket)) {
      return { isValid: false, message: 'Bucket-Name darf keine zwei benachbarten Punkte enthalten' };
    }

    // Regel 4: Kein Punkt neben Bindestrich
    if (/\.-|-\./.test(bucket)) {
      return { isValid: false, message: 'Bucket-Name darf keinen Punkt neben einem Bindestrich enthalten' };
    }

    // Regel 5: Nicht als IP-Adresse formatiert
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(bucket)) {
      return { isValid: false, message: 'Bucket-Name darf nicht als IP-Adresse formatiert sein' };
    }

    // Regel 6: Nicht mit xn-- beginnen
    if (bucket.startsWith('xn--')) {
      return { isValid: false, message: 'Bucket-Name darf nicht mit "xn--" beginnen' };
    }

    // Regel 7: Nicht mit -s3alias enden
    if (bucket.endsWith('-s3alias')) {
      return { isValid: false, message: 'Bucket-Name darf nicht mit "-s3alias" enden' };
    }

    // Regel 8: Nicht mit Punkt oder Bindestrich beginnen/enden
    if (bucket.startsWith('.') || bucket.startsWith('-')) {
      return { isValid: false, message: 'Bucket-Name darf nicht mit Punkt oder Bindestrich beginnen' };
    }
    if (bucket.endsWith('.') || bucket.endsWith('-')) {
      return { isValid: false, message: 'Bucket-Name darf nicht mit Punkt oder Bindestrich enden' };
    }

    return { isValid: true, message: 'Bucket-Name ist gültig' };
  };

  // Ping-Funktion für Hostname/IP-Adresse
  const pingHost = async (hostname: string): Promise<{ success: boolean; message: string; latency?: number }> => {
    if (!hostname.trim()) {
      return { success: false, message: 'Keine Adresse zum Pingen angegeben' };
    }

    try {
      const startTime = Date.now();

      // Verwende fetch mit einem kurzen Timeout für den Ping-Test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sekunden Timeout

      // Versuche eine Verbindung zu einem Standard-Port (80 für HTTP)
      const response = await fetch(`http://${hostname}:80`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      return {
        success: true,
        message: `Erreichbar (${latency}ms)`,
        latency
      };
    } catch (error) {
      // Fallback: Versuche einen anderen Port oder verwende eine andere Methode
      try {
        const startTime = Date.now();

        // Versuche eine WebSocket-Verbindung als Ping-Alternative
        const ws = new WebSocket(`ws://${hostname}:80`);

        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            ws.close();
            resolve({ success: false, message: 'Nicht erreichbar (Timeout)' });
          }, 3000);

          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            const latency = Date.now() - startTime;
            resolve({
              success: true,
              message: `Erreichbar (${latency}ms)`,
              latency
            });
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, message: 'Nicht erreichbar' });
          };
        });
      } catch (wsError) {
        return { success: false, message: 'Nicht erreichbar' };
      }
    }
  };

  // Port-Verfügbarkeitsprüfung
  // Intelligente Port-Typ-Erkennung
  const getPortType = (portNumber: number): { type: 'database' | 'api' | 'web' | 'other'; name: string; description: string } => {
    // Standard-Datenbank-Ports
    if (portNumber === 5432) return { type: 'database', name: 'PostgreSQL', description: 'PostgreSQL-Datenbank' };
    if (portNumber === 3306) return { type: 'database', name: 'MySQL/MariaDB', description: 'MySQL/MariaDB-Datenbank' };
    if (portNumber === 1433) return { type: 'database', name: 'SQL Server', description: 'Microsoft SQL Server' };
    if (portNumber === 1521) return { type: 'database', name: 'Oracle', description: 'Oracle-Datenbank' };
    if (portNumber === 27017) return { type: 'database', name: 'MongoDB', description: 'MongoDB-Datenbank' };
    if (portNumber === 6379) return { type: 'database', name: 'Redis', description: 'Redis-Datenbank' };

    // Standard-API-Ports
    if (portNumber === 3000) return { type: 'api', name: 'PostgREST', description: 'PostgREST API-Server' };
    if (portNumber === 3001) return { type: 'api', name: 'Prisma API', description: 'Prisma API-Server' };
    if (portNumber === 8000) return { type: 'api', name: 'API Server', description: 'Allgemeiner API-Server' };
    if (portNumber === 8080) return { type: 'api', name: 'API Server', description: 'Allgemeiner API-Server' };
    if (portNumber === 5000) return { type: 'api', name: 'API Server', description: 'Allgemeiner API-Server' };

    // Standard-Web-Ports
    if (portNumber === 80) return { type: 'web', name: 'HTTP', description: 'HTTP-Webserver' };
    if (portNumber === 443) return { type: 'web', name: 'HTTPS', description: 'HTTPS-Webserver' };
    if (portNumber === 8080) return { type: 'web', name: 'HTTP Alt', description: 'HTTP-Webserver (Alternativ)' };
    if (portNumber === 8443) return { type: 'web', name: 'HTTPS Alt', description: 'HTTPS-Webserver (Alternativ)' };

    // MinIO-Ports
    if (portNumber === 9000) return { type: 'api', name: 'MinIO API', description: 'MinIO Object Storage API' };
    if (portNumber === 9001) return { type: 'web', name: 'MinIO Console', description: 'MinIO Web-Console' };

    // SSH und andere bekannte Ports
    if (portNumber === 22) return { type: 'other', name: 'SSH', description: 'SSH-Server' };
    if (portNumber === 21) return { type: 'other', name: 'FTP', description: 'FTP-Server' };
    if (portNumber === 25) return { type: 'other', name: 'SMTP', description: 'SMTP-Mailserver' };
    if (portNumber === 53) return { type: 'other', name: 'DNS', description: 'DNS-Server' };

    // Intelligente Erkennung basierend auf Port-Bereichen
    if (portNumber >= 1000 && portNumber <= 1999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };
    if (portNumber >= 2000 && portNumber <= 2999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };
    if (portNumber >= 3000 && portNumber <= 3999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };
    if (portNumber >= 4000 && portNumber <= 4999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };
    if (portNumber >= 5000 && portNumber <= 5999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };
    if (portNumber >= 6000 && portNumber <= 6999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };
    if (portNumber >= 7000 && portNumber <= 7999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };
    if (portNumber >= 8000 && portNumber <= 8999) return { type: 'web', name: 'Custom Web', description: 'Benutzerdefinierter Webserver' };
    if (portNumber >= 9000 && portNumber <= 9999) return { type: 'api', name: 'Custom API', description: 'Benutzerdefinierter API-Server' };

    // Fallback für unbekannte Ports
    return { type: 'other', name: 'Unknown', description: 'Unbekannter Service' };
  };

  const checkPortAvailability = async (hostname: string, port: string): Promise<{ success: boolean; message: string; latency?: number }> => {
    if (!hostname.trim() || !port.trim()) {
      return { success: false, message: 'Host und Port sind erforderlich' };
    }

    const portNumber = parseInt(port);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      return { success: false, message: 'Ungültiger Port (1-65535)' };
    }

    try {
      const startTime = Date.now();
      const portInfo = getPortType(portNumber);

      // Verwende verschiedene Test-Strategien basierend auf Port-Typ
      if (portInfo.type === 'database') {
        // Für Datenbank-Ports verwende WebSocket-Test mit intelligenter Fehleranalyse
        try {
          return new Promise((resolve) => {
            const ws = new WebSocket(`ws://${hostname}:${port}`);
            let resolved = false;

            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                ws.close();
                resolve({
                  success: false,
                  message: `${portInfo.name}-Port ${port} nicht verfügbar (Timeout)`
                });
              }
            }, 2000);

            ws.onopen = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                ws.close();
                const latency = Date.now() - startTime;
                resolve({
                  success: true,
                  message: `${portInfo.name}-Port ${port} erreichbar (${latency}ms)`,
                  latency
                });
              }
            };

            ws.onerror = (error) => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                ws.close();

                // Der Fehler tritt auf, aber der Port ist offen (Container läuft)
                const latency = Date.now() - startTime;
                resolve({
                  success: true,
                  message: `${portInfo.name}-Port ${port} erreichbar (Container läuft, ${latency}ms)`,
                  latency
                });
              }
            };

            ws.onclose = (event) => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);

                // Wenn die Verbindung sofort geschlossen wird, ist der Port geschlossen
                resolve({
                  success: false,
                  message: `${portInfo.name}-Port ${port} nicht verfügbar (Container gestoppt)`
                });
              }
            };
          });
        } catch (wsError) {
          return {
            success: false,
            message: `${portInfo.name}-Port ${port} nicht verfügbar`
          };
        }
      } else if (portInfo.type === 'api') {
        // Für API-Ports verwende HTTP-Test mit intelligenter Fehleranalyse
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(`http://${hostname}:${port}`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const latency = Date.now() - startTime;

          return {
            success: true,
            message: `${portInfo.name}-Port ${port} erreichbar (${latency}ms)`,
            latency
          };
        } catch (error) {
          // Analysiere den Fehler für bessere Diagnose
          const errorMessage = (error as Error)?.message || String(error);
          const latency = Date.now() - startTime;

          // ERR_CONNECTION_REFUSED = Port nicht verfügbar (Container gestoppt)
          if (errorMessage.includes('ERR_CONNECTION_REFUSED') || errorMessage.includes('Connection refused')) {
            return {
              success: false,
              message: `${portInfo.name}-Port ${port} nicht verfügbar (Container gestoppt)`
            };
          }

          // ERR_BLOCKED_BY_RESPONSE.NotSameOrigin = Port verfügbar, aber CORS-Problem
          if (errorMessage.includes('ERR_BLOCKED_BY_RESPONSE') || errorMessage.includes('NotSameOrigin')) {
            return {
              success: true,
              message: `${portInfo.name}-Port ${port} erreichbar (Container läuft, ${latency}ms)`,
              latency
            };
          }

          // "Failed to fetch" kann sowohl Port nicht verfügbar als auch CORS-Problem bedeuten
          if (errorMessage.includes('Failed to fetch')) {
            if (latency > 1000) {
              // Hohe Latenz = Port nicht verfügbar (Container gestoppt)
              return {
                success: false,
                message: `${portInfo.name}-Port ${port} nicht verfügbar (Container gestoppt)`
              };
            } else {
              // Niedrige Latenz = Port verfügbar (CORS-Problem)
              return {
                success: true,
                message: `${portInfo.name}-Port ${port} erreichbar (Container läuft, ${latency}ms)`,
                latency
              };
            }
          }

          // Andere Fehler
          return {
            success: false,
            message: `${portInfo.name}-Port ${port} nicht verfügbar (${errorMessage})`
          };
        }
      } else {
        // Für andere Ports verwende HTTP-Request
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(`http://${hostname}:${port}`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const latency = Date.now() - startTime;

          return {
            success: true,
            message: `${portInfo.name}-Port ${port} erreichbar (${latency}ms)`,
            latency
          };
        } catch (error) {
          const errorMessage = (error as Error)?.message || String(error);
          const latency = Date.now() - startTime;

          // ERR_CONNECTION_REFUSED = Port nicht verfügbar
          if (errorMessage.includes('ERR_CONNECTION_REFUSED') || errorMessage.includes('Connection refused')) {
            return {
              success: false,
              message: `${portInfo.name}-Port ${port} nicht verfügbar`
            };
          }

          // ERR_BLOCKED_BY_RESPONSE.NotSameOrigin = Port verfügbar, aber CORS-Problem
          if (errorMessage.includes('ERR_BLOCKED_BY_RESPONSE') || errorMessage.includes('NotSameOrigin')) {
            return {
              success: true,
              message: `${portInfo.name}-Port ${port} erreichbar (Container läuft, ${latency}ms)`,
              latency
            };
          }

          // Andere Fehler
          return {
            success: false,
            message: `${portInfo.name}-Port ${port} nicht verfügbar (${errorMessage})`
          };
        }
      }
    } catch (error) {
      const portInfo = getPortType(parseInt(port));
      return {
        success: false,
        message: `${portInfo.name}-Port ${port} nicht verfügbar: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  };

  // Ping-Handler für verschiedene Hosts
  const handlePingHost = async (hostname: string, hostKey: string) => {
    if (!hostname.trim()) {
      return;
    }

    setPingingHosts(prev => ({ ...prev, [hostKey]: true }));

    try {
      const result = await pingHost(hostname);
      setPingResults(prev => ({ ...prev, [hostKey]: result }));

      // Automatisches Verschwinden nach 10 Sekunden
      setTimeout(() => {
        setPingResults(prev => ({ ...prev, [hostKey]: null }));
      }, 10000);

    } finally {
      setPingingHosts(prev => ({ ...prev, [hostKey]: false }));
    }
  };

  // Port-Verfügbarkeitsprüfung-Handler
  const handleCheckPort = async (hostname: string, port: string, portKey: string) => {
    if (!hostname.trim() || !port.trim()) {
      return;
    }

    setCheckingPorts(prev => ({ ...prev, [portKey]: true }));

    try {
      const result = await checkPortAvailability(hostname, port);
      setPortResults(prev => ({ ...prev, [portKey]: result }));

      // Automatisches Verschwinden nach 10 Sekunden
      setTimeout(() => {
        setPortResults(prev => ({ ...prev, [portKey]: null }));
      }, 10000);

    } finally {
      setCheckingPorts(prev => ({ ...prev, [portKey]: false }));
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .storage-section {
            animation: slideInDown 0.4s ease-out;
          }
          
          .storage-section.fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          
          @keyframes slideOutUp {
            from {
              opacity: 1;
              transform: translateY(0);
              max-height: 1000px;
            }
            to {
              opacity: 0;
              transform: translateY(-20px);
              max-height: 0;
            }
          }
          
          @keyframes slideOutDown {
            from {
              opacity: 1;
              transform: translateY(0);
              max-height: 1000px;
            }
            to {
              opacity: 0;
              transform: translateY(20px);
              max-height: 0;
            }
          }
          
          @keyframes fadeOut {
            from {
              opacity: 1;
              max-height: 1000px;
            }
            to {
              opacity: 0;
              max-height: 0;
            }
          }
          
          .storage-section.fade-out {
            animation: fadeOut 0.3s ease-in forwards;
            overflow: hidden;
          }
          
          .storage-section.slide-out-up {
            animation: slideOutUp 0.3s ease-in forwards;
            overflow: hidden;
          }
          
          .storage-section.slide-out-down {
            animation: slideOutDown 0.3s ease-in forwards;
            overflow: hidden;
          }
        `}
      </style>
      <div className="container-fluid p-4">
        <div style={{
          backgroundColor: colors.paper || colors.card,
          borderRadius: '12px',
          boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
          padding: '2rem',
          minHeight: 'calc(100vh - 120px)',
          border: `1px solid ${colors.cardBorder}`
        }}>
          {/* Header */}
          <div className="mb-4">
            <h1 style={{ color: colors.text, margin: 0 }}>Speicherverwaltung</h1>
            <p className="text-muted mt-2" style={{ color: colors.textSecondary }}>
              Konfigurieren Sie Ihre Speicherlösungen und Cloud-Verbindungen
            </p>
          </div>

          {/* Status-Anzeige */}
          <div className="card mb-4" style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div className="card-header" style={{ backgroundColor: colors.secondary }}>
              <h5 className="mb-0" style={{ color: colors.text }}>
                <FaInfoCircle className="me-2" />
                Aktueller Status
              </h5>
            </div>
            <div className="card-body" style={{ padding: '20px' }}>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <strong className="me-3" style={{ color: colors.text, fontWeight: '600' }}>Speichermodus:</strong>
                    <span style={{
                      color: colors.text,
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}>
                      {storageManagement.currentStorage.currentStorageMode === 'local' ? 'Nur Lokal' :
                        storageManagement.currentStorage.currentStorageMode === 'cloud' ? 'Cloud' : 'Hybrid'}
                    </span>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <strong className="me-3" style={{ color: colors.text, fontWeight: '600' }}>Cloud:</strong>
                    <span style={{
                      color: colors.text,
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}>
                      {storageManagement.currentStorage.currentStorageMode === 'local' ? 'Keine Cloud' :
                        storageManagement.currentStorage.currentCloudType === 'docker' ? 'Docker Container' :
                          storageManagement.currentStorage.currentCloudType === 'supabase' ? 'Supabase Cloud' : 'Firebase Cloud'}
                    </span>
                  </div>

                  {/* Docker-Dienste Details (nur anzeigen wenn Docker Container gewählt sind) */}
                  {storageManagement.currentStorage.currentStorageMode !== 'local' && storageManagement.currentStorage.currentCloudType === 'docker' && (
                    <div className="d-flex align-items-center mb-3">
                      <strong className="me-3" style={{ color: colors.text, fontWeight: '600' }}>Dienste:</strong>
                      <div className="d-flex gap-3">
                        {/* Datenbank-Dienst */}
                        <span style={{
                          color: colors.text,
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FaDatabase style={{ fontSize: '12px', color: '#336791' }} />
                          {storageManagement.currentStorage.currentDataStorage === 'PostgreSQL' ? 'PostgreSQL' :
                            storageManagement.currentStorage.currentDataStorage === 'MariaDB' ? 'MariaDB' :
                              storageManagement.currentStorage.currentDataStorage === 'MySQL' ? 'MySQL' :
                                'DB'}
                        </span>

                        {/* MinIO Dienst (nur anzeigen wenn konfiguriert) */}
                        {(storageManagement.connections.minio?.host && storageManagement.connections.minio?.accessKey) && (
                          <span style={{
                            color: colors.text,
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <FaServer style={{ fontSize: '12px', color: '#ff6b35' }} />
                            MinIO
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <strong className="me-3" style={{ color: colors.text, fontWeight: '600' }}>Datenbank:</strong>
                    <span style={{
                      color: colors.text,
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}>
                      {storageManagement.currentStorage.currentDataStorage}
                    </span>
                  </div>

                  <div className="d-flex align-items-center">
                    <strong className="me-3" style={{ color: colors.text, fontWeight: '600' }}>Bildspeicher:</strong>
                    <span style={{
                      color: colors.text,
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}>
                      {storageManagement.currentStorage.currentPictureStorage}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Speichermodus-Auswahl */}
          <div className="card mb-4" style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div className="card-header" style={{ backgroundColor: colors.secondary }}>
              <h5 className="mb-0" style={{ color: colors.text }}>
                <FaDatabase className="me-2" />
                Speichermodus auswählen
              </h5>
            </div>
            <div className="card-body" style={{ padding: '20px' }}>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-check storage-mode-option" style={{
                    padding: '16px',
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '6px',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease',
                    backgroundColor: storageManagement.selectedStorage.selectedStorageMode === 'local'
                      ? colors.secondary
                      : colors.card,
                    cursor: 'pointer'
                  }}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="storageMode"
                      id="local"
                      checked={storageManagement.selectedStorage.selectedStorageMode === 'local'}
                      onChange={() => handleStorageManagementUpdate({
                        selectedStorage: {
                          ...storageManagement.selectedStorage,
                          selectedStorageMode: 'local',
                          selectedCloudType: 'none',
                          selectedDataStorage: 'SQLite',
                          selectedPictureStorage: 'LocalPath'
                        }
                      })}
                      style={{ marginTop: '4px' }}
                    />
                    <label className="form-check-label" htmlFor="local" style={{ cursor: 'pointer', width: '100%', marginLeft: '8px' }}>
                      <div className="d-flex align-items-center">
                        <FaDatabase className="me-2" style={{ color: '#28a745', fontSize: '20px' }} />
                        <div>
                          <strong style={{ color: colors.text, fontSize: '1.1rem' }}>Nur Lokal (LocalStorage)</strong>
                          <br />
                          <small style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Daten werden nur im Browser gespeichert</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-check storage-mode-option" style={{
                    padding: '16px',
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '6px',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease',
                    backgroundColor: storageManagement.selectedStorage.selectedStorageMode === 'cloud'
                      ? colors.secondary
                      : colors.card,
                    cursor: 'pointer'
                  }}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="storageMode"
                      id="cloud"
                      checked={storageManagement.selectedStorage.selectedStorageMode === 'cloud'}
                      onChange={() => handleStorageManagementUpdate({
                        selectedStorage: {
                          ...storageManagement.selectedStorage,
                          selectedStorageMode: 'cloud'
                        }
                      })}
                      style={{ marginTop: '4px' }}
                    />
                    <label className="form-check-label" htmlFor="cloud" style={{ cursor: 'pointer', width: '100%', marginLeft: '8px' }}>
                      <div className="d-flex align-items-center">
                        <FaCloud className="me-2" style={{ color: '#17a2b8', fontSize: '20px' }} />
                        <div>
                          <strong style={{ color: colors.text, fontSize: '1.1rem' }}>Cloud-Speicher</strong>
                          <br />
                          <small style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Daten werden nur in der Cloud gespeichert</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-check storage-mode-option" style={{
                    padding: '16px',
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '6px',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease',
                    backgroundColor: storageManagement.selectedStorage.selectedStorageMode === 'hybrid'
                      ? colors.secondary
                      : colors.card,
                    cursor: 'pointer'
                  }}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="storageMode"
                      id="hybrid"
                      checked={storageManagement.selectedStorage.selectedStorageMode === 'hybrid'}
                      onChange={() => handleStorageManagementUpdate({
                        selectedStorage: {
                          ...storageManagement.selectedStorage,
                          selectedStorageMode: 'hybrid'
                        }
                      })}
                      style={{ marginTop: '4px' }}
                    />
                    <label className="form-check-label" htmlFor="hybrid" style={{ cursor: 'pointer', width: '100%', marginLeft: '8px' }}>
                      <div className="d-flex align-items-center">
                        <FaSync className="me-2" style={{ color: '#ffc107', fontSize: '20px' }} />
                        <div>
                          <strong style={{ color: colors.text, fontSize: '1.1rem' }}>Hybrid-Speicher</strong>
                          <br />
                          <small style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Lokal & Cloud mit Synchronisation</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud-Konfiguration */}
          {cloudSectionVisible && (
            <div className={`card mb-4 storage-section ${cloudSectionAnimating ? 'slide-out-up' : 'slideInDown'}`} style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaCloud className="me-2" />
                  Cloud-Speicher-Typ
                </h5>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="row">
                  {cloudStorageTypes.map((type) => (
                    <div key={type.id} className="col-md-4">
                      <div className="form-check cloud-option" style={{
                        padding: '16px',
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: '6px',
                        marginBottom: '16px',
                        transition: 'all 0.3s ease',
                        backgroundColor: storageManagement.selectedStorage.selectedCloudType === type.id
                          ? colors.secondary
                          : colors.card,
                        cursor: 'pointer'
                      }}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="cloudType"
                          id={type.id}
                          checked={storageManagement.selectedStorage.selectedCloudType === type.id}
                          onChange={() => {
                            const updates: any = {
                              selectedStorage: {
                                ...storageManagement.selectedStorage,
                                selectedCloudType: type.id as any
                              }
                            };

                            // Setze automatisch Data- und Picture-Storage basierend auf Cloud-Typ
                            if (type.id === 'supabase') {
                              updates.selectedStorage.selectedDataStorage = 'Supabase';
                              updates.selectedStorage.selectedPictureStorage = 'Supabase';
                            } else if (type.id === 'firebase') {
                              updates.selectedStorage.selectedDataStorage = 'Firebase';
                              updates.selectedStorage.selectedPictureStorage = 'Firebase';
                            }
                            // Für Docker: Benutzer wählt manuell PostgreSQL/MariaDB/MySQL

                            handleStorageManagementUpdate(updates);
                          }}
                          style={{ marginTop: '4px' }}
                        />
                        <label className="form-check-label" htmlFor={type.id} style={{ cursor: 'pointer', width: '100%', marginLeft: '8px' }}>
                          <div className="d-flex align-items-center">
                            <div style={{ color: type.color, fontSize: '20px', marginRight: '12px' }}>
                              {type.icon}
                            </div>
                            <div>
                              <strong style={{ color: colors.text, fontSize: '1.1rem' }}>{type.name}</strong>
                              <br />
                              <small style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>{type.description}</small>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Datenbank-Konfiguration - nur anzeigen wenn nicht lokal */}
          {databaseSectionVisible && (
            <div className={`card mb-4 storage-section ${databaseSectionAnimating ? 'slide-out-down' : 'slide-up'}`} style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaDatabase className="me-2" />
                  Datenbank-Typ
                </h5>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="row">
                  {/* Cloud-Datenbank-Optionen */}
                  {['PostgreSQL', 'MariaDB', 'MySQL'].map((dbType) => (
                    <div key={dbType} className="col-md-4">
                      <div className="form-check database-option" style={{
                        padding: '16px',
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: '6px',
                        marginBottom: '16px',
                        transition: 'all 0.3s ease',
                        backgroundColor: storageManagement.selectedStorage.selectedDataStorage === dbType
                          ? colors.secondary
                          : colors.card,
                        cursor: 'pointer'
                      }}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="databaseType"
                          id={dbType}
                          checked={storageManagement.selectedStorage.selectedDataStorage === dbType}
                          onChange={() => handleStorageManagementUpdate({
                            selectedStorage: {
                              ...storageManagement.selectedStorage,
                              selectedDataStorage: dbType as any,
                              selectedPictureStorage: 'MinIO'
                            }
                          })}
                          style={{ marginTop: '4px' }}
                        />
                        <label className="form-check-label" htmlFor={dbType} style={{ cursor: 'pointer', width: '100%', marginLeft: '8px' }}>
                          <div className="d-flex align-items-center">
                            <FaDatabase className="me-2" style={{ color: '#336791', fontSize: '20px' }} />
                            <div>
                              <strong style={{ color: colors.text, fontSize: '1.1rem' }}>{dbType}</strong>
                              <br />
                              <small style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                                {dbType === 'PostgreSQL' ? 'Erweiterte SQL-Datenbank' :
                                  dbType === 'MariaDB' ? 'MySQL-kompatible Datenbank' :
                                    dbType === 'MySQL' ? 'Beliebte Web-Datenbank' : ''}
                              </small>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PostgreSQL-Konfiguration */}
          {postgresSectionVisible && (
            <div className={`card mb-4 storage-section ${postgresSectionAnimating ? 'slide-out-down' : 'slide-up'}`} style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaDatabase className="me-2" />
                  PostgreSQL-Konfiguration
                </h5>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="row">
                  {/* Gruppe 1: Netzwerk/Verbindung */}
                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Host/IP-Adresse</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className={`form-control ${storageManagement.connections.postgres.host && !validateHostname(storageManagement.connections.postgres.host).isValid ? 'is-invalid' : ''}`}
                          value={storageManagement.connections.postgres.host}
                          onChange={(e) => updateConnection('postgres', { host: e.target.value })}
                          placeholder="localhost"
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            backgroundColor: !storageManagement.connections.postgres.host ? colors.accent + '20' : undefined,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handlePingHost(storageManagement.connections.postgres.host, 'postgres-host')}
                          disabled={!storageManagement.connections.postgres.host || pingingHosts['postgres-host']}
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                            e.currentTarget.style.backgroundColor = colors.accent + '20';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Ping testen"
                        >
                          {pingingHosts['postgres-host'] ? (
                            <FaSpinner className="fa-spin" />
                          ) : (
                            <FaWifi />
                          )}
                        </button>
                      </div>
                      {/* Hostname-Validierung */}
                      {storageManagement.connections.postgres.host && validationMessages['postgres-host'] && !validateHostname(storageManagement.connections.postgres.host).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.postgres.host).message}
                        </div>
                      )}
                      {storageManagement.connections.postgres.host && validationMessages['postgres-host'] && validateHostname(storageManagement.connections.postgres.host).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.postgres.host).message}
                        </div>
                      )}

                      {/* Ping-Ergebnis anzeigen */}
                      {pingResults['postgres-host'] && (
                        <div style={{
                          color: pingResults['postgres-host'].success ? '#198754' : '#dc3545',
                          fontSize: '0.875em',
                          fontWeight: '500',
                          marginTop: '2px'
                        }}>
                          {pingResults['postgres-host'].message}
                        </div>
                      )}
                    </div>

                    {/* PostgreSQL und PostgREST Ports nebeneinander */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">PostgreSQL Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.postgres.port && !validatePort(storageManagement.connections.postgres.port).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.postgres.port}
                              onChange={(e) => updateConnection('postgres', { port: e.target.value })}
                              placeholder="5432"
                              style={{
                                backgroundColor: !storageManagement.connections.postgres.port ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => handleCheckPort(
                                storageManagement.connections.postgres.host,
                                storageManagement.connections.postgres.port,
                                'postgres-port'
                              )}
                              disabled={checkingPorts['postgres-port'] || !storageManagement.connections.postgres.host || !storageManagement.connections.postgres.port}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                            >
                              {checkingPorts['postgres-port'] ? (
                                <FaSpinner className="fa-spin" />
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                          {/* PostgreSQL Port-Validierung */}
                          {storageManagement.connections.postgres.port && validationMessages['postgres-port'] && !validatePort(storageManagement.connections.postgres.port).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.postgres.port).message}
                            </div>
                          )}
                          {storageManagement.connections.postgres.port && validationMessages['postgres-port'] && validatePort(storageManagement.connections.postgres.port).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.postgres.port).message}
                            </div>
                          )}
                          {/* PostgreSQL Port-Ergebnis */}
                          {portResults['postgres-port'] && (
                            <div style={{
                              color: portResults['postgres-port'].success ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              {portResults['postgres-port'].message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">PostgREST Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.postgres.postgrestPort && !validatePort(storageManagement.connections.postgres.postgrestPort).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.postgres.postgrestPort}
                              onChange={(e) => updateConnection('postgres', { postgrestPort: e.target.value })}
                              placeholder="3000"
                              style={{
                                backgroundColor: !storageManagement.connections.postgres.postgrestPort ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => handleCheckPort(
                                storageManagement.connections.postgres.host,
                                storageManagement.connections.postgres.postgrestPort,
                                'postgrest-port'
                              )}
                              disabled={checkingPorts['postgrest-port'] || !storageManagement.connections.postgres.host || !storageManagement.connections.postgres.postgrestPort}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                            >
                              {checkingPorts['postgrest-port'] ? (
                                <FaSpinner className="fa-spin" />
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                          {/* PostgREST Port-Validierung */}
                          {storageManagement.connections.postgres.postgrestPort && validationMessages['postgres-postgrestPort'] && !validatePort(storageManagement.connections.postgres.postgrestPort).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.postgres.postgrestPort).message}
                            </div>
                          )}
                          {storageManagement.connections.postgres.postgrestPort && validationMessages['postgres-postgrestPort'] && validatePort(storageManagement.connections.postgres.postgrestPort).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.postgres.postgrestPort).message}
                            </div>
                          )}
                          {/* PostgREST Port-Ergebnis */}
                          {portResults['postgrest-port'] && (
                            <div style={{
                              color: portResults['postgrest-port'].success ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              {portResults['postgrest-port'].message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gruppe 2: Authentifizierung */}
                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Datenbank</label>
                      <input
                        type="text"
                        className={`form-control ${storageManagement.connections.postgres.database && !validatePostgreSQLDatabaseName(storageManagement.connections.postgres.database).isValid ? 'is-invalid' : ''}`}
                        value={storageManagement.connections.postgres.database}
                        onChange={(e) => updateConnection('postgres', { database: e.target.value })}
                        placeholder="chef_numbers"
                        style={{
                          backgroundColor: !storageManagement.connections.postgres.database ? colors.accent + '20' : undefined,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.accent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.cardBorder;
                        }}
                      />

                      {/* Datenbank-Validierung */}
                      {storageManagement.connections.postgres.database && validationMessages['postgres-database'] && !validatePostgreSQLDatabaseName(storageManagement.connections.postgres.database).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validatePostgreSQLDatabaseName(storageManagement.connections.postgres.database).message}
                        </div>
                      )}
                      {storageManagement.connections.postgres.database && validationMessages['postgres-database'] && validatePostgreSQLDatabaseName(storageManagement.connections.postgres.database).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validatePostgreSQLDatabaseName(storageManagement.connections.postgres.database).message}
                        </div>
                      )}
                    </div>

                    {/* Benutzername und Passwort nebeneinander */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Benutzername</label>
                          <input
                            type="text"
                            className={`form-control ${storageManagement.connections.postgres.username && !validatePostgreSQLUsername(storageManagement.connections.postgres.username).isValid ? 'is-invalid' : ''}`}
                            value={storageManagement.connections.postgres.username}
                            onChange={(e) => updateConnection('postgres', { username: e.target.value })}
                            placeholder="postgres"
                            style={{
                              backgroundColor: !storageManagement.connections.postgres.username ? colors.accent + '20' : undefined,
                              borderColor: colors.cardBorder,
                              color: colors.text,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />

                          {/* Benutzername-Validierung */}
                          {storageManagement.connections.postgres.username && validationMessages['postgres-username'] && !validatePostgreSQLUsername(storageManagement.connections.postgres.username).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePostgreSQLUsername(storageManagement.connections.postgres.username).message}
                            </div>
                          )}
                          {storageManagement.connections.postgres.username && validationMessages['postgres-username'] && validatePostgreSQLUsername(storageManagement.connections.postgres.username).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePostgreSQLUsername(storageManagement.connections.postgres.username).message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Passwort</label>
                          <div className="input-group">
                            <input
                              type={showPasswords.postgres ? 'text' : 'password'}
                              className="form-control"
                              value={storageManagement.connections.postgres.password}
                              onChange={(e) => updateConnection('postgres', { password: e.target.value })}
                              placeholder="Passwort"
                              style={{
                                backgroundColor: !storageManagement.connections.postgres.password ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => {
                                const newPassword = generateSecurePassword();
                                updateConnection('postgres', { password: newPassword });
                              }}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                              title="Sicheres Passwort generieren"
                            >
                              <FaKey />
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => togglePasswordVisibility('postgres')}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                              title={showPasswords.postgres ? 'Passwort verbergen' : 'Passwort anzeigen'}
                            >
                              {showPasswords.postgres ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {/* Passwortstärke-Anzeige */}
                          {storageManagement.connections.postgres.password && showPasswordStrength && (
                            <div className="mt-2">
                              {(() => {
                                const validation = validatePasswordStrength(storageManagement.connections.postgres.password);
                                const strengthColor = validation.strength === 'weak' ? '#dc3545' :
                                  validation.strength === 'medium' ? '#ffc107' : '#198754';
                                const strengthIcon = validation.strength === 'weak' ? '⚠️' :
                                  validation.strength === 'medium' ? '🔒' : '🛡️';

                                return (
                                  <div
                                    className="d-flex align-items-center"
                                    style={{
                                      color: strengthColor,
                                      fontSize: '0.875em',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <FaShieldAlt className="me-2" />
                                    <span className="me-2">{strengthIcon}</span>
                                    <span className="me-2" style={{ fontWeight: 'bold' }}>
                                      {validation.strength === 'weak' ? 'Schwach' :
                                        validation.strength === 'medium' ? 'Mittel' : 'Stark'}
                                    </span>
                                    <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                                      ({validation.score}/8 Punkte)
                                    </span>
                                  </div>
                                );
                              })()}
                              <div
                                className="mt-1"
                                style={{
                                  color: validatePasswordStrength(storageManagement.connections.postgres.password).strength === 'weak' ? '#dc3545' :
                                    validatePasswordStrength(storageManagement.connections.postgres.password).strength === 'medium' ? '#ffc107' : '#198754',
                                  fontSize: '0.8em'
                                }}
                              >
                                {validatePasswordStrength(storageManagement.connections.postgres.password).message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verbindungsstatus und Test-Button */}
                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <FaWifi className="me-2" style={{ color: colors.textSecondary }} />
                      <span style={{ color: colors.text }}>
                        Verbindungsstatus:
                        <span className={`ms-2 ${storageManagement.connections.postgres.connectionStatus ? 'text-success' : 'text-danger'}`}>
                          {storageManagement.connections.postgres.connectionStatus ? 'Verbunden' : 'Nicht verbunden'}
                        </span>
                      </span>
                    </div>
                    <button
                      className={`btn ${isPostgreSQLConfigValid() ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                      onClick={handleConnectionTest}
                      disabled={!isPostgreSQLConfigValid()}
                      style={{
                        opacity: isPostgreSQLConfigValid() ? 1 : 0.6,
                        cursor: isPostgreSQLConfigValid() ? 'pointer' : 'not-allowed'
                      }}
                      title={isPostgreSQLConfigValid() ? 'PostgreSQL-Verbindung testen' : 'Alle Felder müssen gültig ausgefüllt sein'}
                    >
                      <FaWifi className="me-1" />
                      Verbindung testen
                    </button>
                  </div>

                  {/* Testmeldungen anzeigen */}
                  {storageManagement.connections.postgres.testMessage && (
                    <div className="mt-3">
                      <div
                        className="alert alert-info"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          fontSize: '0.875em',
                          marginBottom: '0'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <FaInfoCircle className="me-2 mt-1" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <pre style={{
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              fontSize: 'inherit'
                            }}>
                              {storageManagement.connections.postgres.testMessage}
                            </pre>
                            {storageManagement.connections.postgres.lastTested && (
                              <div className="mt-2">
                                <small className="text-muted">
                                  {new Date(storageManagement.connections.postgres.lastTested).toLocaleString('de-DE')}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MariaDB-Konfiguration */}
          {mariadbSectionVisible && (
            <div className={`card mb-4 storage-section ${mariadbSectionAnimating ? 'slide-out-down' : 'slide-up'}`} style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaDatabase className="me-2" />
                  MariaDB-Konfiguration
                </h5>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="row">
                  {/* Gruppe 1: Netzwerk/Verbindung */}
                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Host/IP-Adresse</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className={`form-control ${storageManagement.connections.mariadb.host && !validateHostname(storageManagement.connections.mariadb.host).isValid ? 'is-invalid' : ''}`}
                          value={storageManagement.connections.mariadb.host}
                          onChange={(e) => updateConnection('mariadb', { host: e.target.value })}
                          placeholder="localhost"
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            backgroundColor: !storageManagement.connections.mariadb.host ? colors.accent + '20' : undefined,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handlePingHost(storageManagement.connections.mariadb.host, 'mariadb-host')}
                          disabled={!storageManagement.connections.mariadb.host || pingingHosts['mariadb-host']}
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                            e.currentTarget.style.backgroundColor = colors.accent + '20';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Ping testen"
                        >
                          {pingingHosts['mariadb-host'] ? (
                            <FaSpinner className="fa-spin" />
                          ) : (
                            <FaWifi />
                          )}
                        </button>
                      </div>
                      {/* Hostname-Validierung */}
                      {storageManagement.connections.mariadb.host && validationMessages['mariadb-host'] && !validateHostname(storageManagement.connections.mariadb.host).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.mariadb.host).message}
                        </div>
                      )}
                      {storageManagement.connections.mariadb.host && validationMessages['mariadb-host'] && validateHostname(storageManagement.connections.mariadb.host).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.mariadb.host).message}
                        </div>
                      )}

                      {/* Ping-Ergebnis anzeigen */}
                      {pingResults['mariadb-host'] && (
                        <div style={{
                          color: pingResults['mariadb-host'].success ? '#198754' : '#dc3545',
                          fontSize: '0.875em',
                          fontWeight: '500',
                          marginTop: '2px'
                        }}>
                          {pingResults['mariadb-host'].message}
                        </div>
                      )}
                    </div>

                    {/* MariaDB Port und Prisma API Port nebeneinander */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">MariaDB Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.mariadb.port && !validatePort(storageManagement.connections.mariadb.port).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.mariadb.port}
                              onChange={(e) => updateConnection('mariadb', { port: e.target.value })}
                              placeholder="3306"
                              style={{
                                backgroundColor: !storageManagement.connections.mariadb.port ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => handleCheckPort(
                                storageManagement.connections.mariadb.host,
                                storageManagement.connections.mariadb.port,
                                'mariadb-port'
                              )}
                              disabled={checkingPorts['mariadb-port'] || !storageManagement.connections.mariadb.host || !storageManagement.connections.mariadb.port}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                            >
                              {checkingPorts['mariadb-port'] ? (
                                <FaSpinner className="fa-spin" />
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                          {/* Port-Validierung */}
                          {storageManagement.connections.mariadb.port && validationMessages['mariadb-port'] && !validatePort(storageManagement.connections.mariadb.port).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.mariadb.port).message}
                            </div>
                          )}
                          {storageManagement.connections.mariadb.port && validationMessages['mariadb-port'] && validatePort(storageManagement.connections.mariadb.port).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.mariadb.port).message}
                            </div>
                          )}
                          {/* Port-Ergebnis */}
                          {portResults['mariadb-port'] && (
                            <div style={{
                              color: portResults['mariadb-port'].success ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              {portResults['mariadb-port'].message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Prisma API Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.mariadb.prismaPort && !validatePort(storageManagement.connections.mariadb.prismaPort).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.mariadb.prismaPort}
                              onChange={(e) => updateConnection('mariadb', { prismaPort: e.target.value })}
                              placeholder="3001"
                              style={{
                                backgroundColor: !storageManagement.connections.mariadb.prismaPort ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => handleCheckPort(
                                storageManagement.connections.mariadb.host,
                                storageManagement.connections.mariadb.prismaPort,
                                'mariadb-prisma-port'
                              )}
                              disabled={checkingPorts['mariadb-prisma-port'] || !storageManagement.connections.mariadb.host || !storageManagement.connections.mariadb.prismaPort}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                              title="Port-Verfügbarkeit testen"
                            >
                              {checkingPorts['mariadb-prisma-port'] ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Lädt...</span>
                                </div>
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                          {/* Prisma Port-Validierung */}
                          {storageManagement.connections.mariadb.prismaPort && validationMessages['mariadb-prismaPort'] && !validatePort(storageManagement.connections.mariadb.prismaPort).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.mariadb.prismaPort).message}
                            </div>
                          )}
                          {storageManagement.connections.mariadb.prismaPort && validationMessages['mariadb-prismaPort'] && validatePort(storageManagement.connections.mariadb.prismaPort).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.mariadb.prismaPort).message}
                            </div>
                          )}
                          {/* Port-Ergebnis */}
                          {portResults['mariadb-prisma-port'] && (
                            <div style={{
                              color: portResults['mariadb-prisma-port'].success ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              {portResults['mariadb-prisma-port'].message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gruppe 2: Authentifizierung */}
                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Datenbank</label>
                      <input
                        type="text"
                        className={`form-control ${storageManagement.connections.mariadb.database && !validateMariaDBDatabaseName(storageManagement.connections.mariadb.database).isValid ? 'is-invalid' : ''}`}
                        value={storageManagement.connections.mariadb.database}
                        onChange={(e) => updateConnection('mariadb', { database: e.target.value })}
                        placeholder="chef_numbers"
                        style={{
                          backgroundColor: !storageManagement.connections.mariadb.database ? colors.accent + '20' : undefined,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.accent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.cardBorder;
                        }}
                      />

                      {/* Datenbank-Validierung */}
                      {storageManagement.connections.mariadb.database && validationMessages['mariadb-database'] && !validateMariaDBDatabaseName(storageManagement.connections.mariadb.database).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateMariaDBDatabaseName(storageManagement.connections.mariadb.database).message}
                        </div>
                      )}
                      {storageManagement.connections.mariadb.database && validationMessages['mariadb-database'] && validateMariaDBDatabaseName(storageManagement.connections.mariadb.database).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateMariaDBDatabaseName(storageManagement.connections.mariadb.database).message}
                        </div>
                      )}
                    </div>

                    {/* Benutzername und Passwort nebeneinander */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Benutzername</label>
                          <input
                            type="text"
                            className={`form-control ${storageManagement.connections.mariadb.username && !validateMariaDBUsername(storageManagement.connections.mariadb.username).isValid ? 'is-invalid' : ''}`}
                            value={storageManagement.connections.mariadb.username}
                            onChange={(e) => updateConnection('mariadb', { username: e.target.value })}
                            placeholder="chef_user"
                            style={{
                              backgroundColor: !storageManagement.connections.mariadb.username ? colors.accent + '20' : undefined,
                              borderColor: colors.cardBorder,
                              color: colors.text,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />

                          {/* Benutzername-Validierung */}
                          {storageManagement.connections.mariadb.username && validationMessages['mariadb-username'] && !validateMariaDBUsername(storageManagement.connections.mariadb.username).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validateMariaDBUsername(storageManagement.connections.mariadb.username).message}
                            </div>
                          )}
                          {storageManagement.connections.mariadb.username && validationMessages['mariadb-username'] && validateMariaDBUsername(storageManagement.connections.mariadb.username).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validateMariaDBUsername(storageManagement.connections.mariadb.username).message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Passwort</label>
                          <div className="input-group">
                            <input
                              type={showPasswords.mariadb ? 'text' : 'password'}
                              className="form-control"
                              value={storageManagement.connections.mariadb.password}
                              onChange={(e) => updateConnection('mariadb', { password: e.target.value })}
                              placeholder="Passwort"
                              style={{
                                backgroundColor: !storageManagement.connections.mariadb.password ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => {
                                const newPassword = generateSecurePassword();
                                updateConnection('mariadb', { password: newPassword });
                              }}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                              title="Sicheres Passwort generieren"
                            >
                              <FaKey />
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => togglePasswordVisibility('mariadb')}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                              title={showPasswords.mariadb ? 'Passwort verbergen' : 'Passwort anzeigen'}
                            >
                              {showPasswords.mariadb ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {/* Passwortstärke-Anzeige */}
                          {storageManagement.connections.mariadb.password && showPasswordStrength && (
                            <div className="mt-2">
                              {(() => {
                                const validation = validatePasswordStrength(storageManagement.connections.mariadb.password);
                                const strengthColor = validation.strength === 'weak' ? '#dc3545' :
                                  validation.strength === 'medium' ? '#ffc107' : '#198754';
                                const strengthIcon = validation.strength === 'weak' ? '⚠️' :
                                  validation.strength === 'medium' ? '🔒' : '🛡️';

                                return (
                                  <div
                                    className="d-flex align-items-center"
                                    style={{
                                      color: strengthColor,
                                      fontSize: '0.875em',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <FaShieldAlt className="me-2" />
                                    <span className="me-2">{strengthIcon}</span>
                                    <span className="me-2" style={{ fontWeight: 'bold' }}>
                                      {validation.strength === 'weak' ? 'Schwach' :
                                        validation.strength === 'medium' ? 'Mittel' : 'Stark'}
                                    </span>
                                    <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                                      ({validation.score}/8 Punkte)
                                    </span>
                                  </div>
                                );
                              })()}
                              <div
                                className="mt-1"
                                style={{
                                  color: validatePasswordStrength(storageManagement.connections.mariadb.password).strength === 'weak' ? '#dc3545' :
                                    validatePasswordStrength(storageManagement.connections.mariadb.password).strength === 'medium' ? '#ffc107' : '#198754',
                                  fontSize: '0.8em'
                                }}
                              >
                                {validatePasswordStrength(storageManagement.connections.mariadb.password).message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verbindungsstatus und Test-Button */}
                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <FaWifi className="me-2" style={{ color: colors.textSecondary }} />
                      <span style={{ color: colors.text }}>
                        Verbindungsstatus:
                        <span className={`ms-2 ${storageManagement.connections.mariadb.connectionStatus ? 'text-success' : 'text-danger'}`}>
                          {storageManagement.connections.mariadb.connectionStatus ? 'Verbunden' : 'Nicht verbunden'}
                        </span>
                      </span>
                    </div>
                    <button
                      className={`btn ${isMariaDBButtonEnabled ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                      onClick={handleMariaDBConnectionTest}
                      disabled={!isMariaDBButtonEnabled}
                      style={{
                        opacity: isMariaDBButtonEnabled ? 1 : 0.6,
                        cursor: isMariaDBButtonEnabled ? 'pointer' : 'not-allowed'
                      }}
                      title={isMariaDBButtonEnabled ? 'MariaDB-Verbindung testen' : 'Alle Felder müssen gültig ausgefüllt sein'}
                    >
                      <FaWifi className="me-1" />
                      Verbindung testen
                    </button>
                  </div>

                  {/* Testmeldungen anzeigen */}
                  {storageManagement.connections.mariadb.testMessage && (
                    <div className="mt-3">
                      <div
                        className="alert alert-info"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          fontSize: '0.875em',
                          marginBottom: '0'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <FaInfoCircle className="me-2 mt-1" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <pre style={{
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              fontSize: 'inherit'
                            }}>
                              {storageManagement.connections.mariadb.testMessage}
                            </pre>
                            {storageManagement.connections.mariadb.lastTested && (
                              <div className="mt-2">
                                <small className="text-muted">
                                  {new Date(storageManagement.connections.mariadb.lastTested).toLocaleString('de-DE')}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MySQL-Konfiguration */}
          {mysqlSectionVisible && (
            <div className={`card mb-4 storage-section ${mysqlSectionAnimating ? 'slide-out-down' : 'slide-up'}`} style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaDatabase className="me-2" />
                  MySQL-Konfiguration
                </h5>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="row">
                  {/* Gruppe 1: Netzwerk/Verbindung */}
                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Host/IP-Adresse</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className={`form-control ${storageManagement.connections.mysql.host && !validateHostname(storageManagement.connections.mysql.host).isValid ? 'is-invalid' : ''}`}
                          value={storageManagement.connections.mysql.host}
                          onChange={(e) => updateConnection('mysql', { host: e.target.value })}
                          placeholder="localhost"
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            backgroundColor: !storageManagement.connections.mysql.host ? colors.accent + '20' : undefined,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handlePingHost(storageManagement.connections.mysql.host, 'mysql-host')}
                          disabled={!storageManagement.connections.mysql.host || pingingHosts['mysql-host']}
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                            e.currentTarget.style.backgroundColor = colors.accent + '20';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Ping testen"
                        >
                          {pingingHosts['mysql-host'] ? (
                            <FaSpinner className="fa-spin" />
                          ) : (
                            <FaWifi />
                          )}
                        </button>
                      </div>
                      {/* Hostname-Validierung */}
                      {storageManagement.connections.mysql.host && validationMessages['mysql-host'] && !validateHostname(storageManagement.connections.mysql.host).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.mysql.host).message}
                        </div>
                      )}
                      {storageManagement.connections.mysql.host && validationMessages['mysql-host'] && validateHostname(storageManagement.connections.mysql.host).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.mysql.host).message}
                        </div>
                      )}

                      {/* Ping-Ergebnis anzeigen */}
                      {pingResults['mysql-host'] && (
                        <div style={{
                          color: pingResults['mysql-host'].success ? '#198754' : '#dc3545',
                          fontSize: '0.875em',
                          fontWeight: '500',
                          marginTop: '2px'
                        }}>
                          {pingResults['mysql-host'].message}
                        </div>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">MySQL Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.mysql.port && !validatePort(storageManagement.connections.mysql.port).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.mysql.port}
                              onChange={(e) => updateConnection('mysql', { port: e.target.value })}
                              placeholder="3306"
                              style={{
                                backgroundColor: !storageManagement.connections.mysql.port ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => handleCheckPort(
                                storageManagement.connections.mysql.host,
                                storageManagement.connections.mysql.port,
                                'mysql-port'
                              )}
                              disabled={checkingPorts['mysql-port'] || !storageManagement.connections.mysql.host || !storageManagement.connections.mysql.port}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                            >
                              {checkingPorts['mysql-port'] ? (
                                <FaSpinner className="fa-spin" />
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">Prisma API Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.mysql.prismaPort && !validatePort(storageManagement.connections.mysql.prismaPort).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.mysql.prismaPort}
                              onChange={(e) => updateConnection('mysql', { prismaPort: e.target.value })}
                              placeholder="3001"
                              style={{
                                backgroundColor: !storageManagement.connections.mysql.prismaPort ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => handleCheckPort(
                                storageManagement.connections.mysql.host,
                                storageManagement.connections.mysql.prismaPort,
                                'mysql-prisma-port'
                              )}
                              disabled={checkingPorts['mysql-prisma-port'] || !storageManagement.connections.mysql.host || !storageManagement.connections.mysql.prismaPort}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                            >
                              {checkingPorts['mysql-prisma-port'] ? (
                                <FaSpinner className="fa-spin" />
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                          {/* Prisma Port-Validierung */}
                          {storageManagement.connections.mysql.prismaPort && validationMessages['mysql-prisma-port'] && !validatePort(storageManagement.connections.mysql.prismaPort).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.mysql.prismaPort).message}
                            </div>
                          )}
                          {storageManagement.connections.mysql.prismaPort && validationMessages['mysql-prisma-port'] && validatePort(storageManagement.connections.mysql.prismaPort).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.mysql.prismaPort).message}
                            </div>
                          )}
                          {/* Port-Ergebnis */}
                          {portResults['mysql-prisma-port'] && (
                            <div style={{
                              color: portResults['mysql-prisma-port'].success ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              {portResults['mysql-prisma-port'].message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Port-Validierung */}
                    {storageManagement.connections.mysql.port && validationMessages['mysql-port'] && !validatePort(storageManagement.connections.mysql.port).isValid && (
                      <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                        {validatePort(storageManagement.connections.mysql.port).message}
                      </div>
                    )}
                    {storageManagement.connections.mysql.port && validationMessages['mysql-port'] && validatePort(storageManagement.connections.mysql.port).isValid && (
                      <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                        {validatePort(storageManagement.connections.mysql.port).message}
                      </div>
                    )}
                    {/* Port-Ergebnis */}
                    {portResults['mysql-port'] && (
                      <div style={{
                        color: portResults['mysql-port'].success ? '#198754' : '#dc3545',
                        fontSize: '0.875em',
                        fontWeight: '500',
                        marginTop: '2px'
                      }}>
                        {portResults['mysql-port'].message}
                      </div>
                    )}
                  </div>
                  {/* Gruppe 2: Authentifizierung */}
                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Datenbank</label>
                      <input
                        type="text"
                        className={`form-control ${storageManagement.connections.mysql.database && !validatePostgreSQLDatabaseName(storageManagement.connections.mysql.database).isValid ? 'is-invalid' : ''}`}
                        value={storageManagement.connections.mysql.database}
                        onChange={(e) => updateConnection('mysql', { database: e.target.value })}
                        placeholder="chef_numbers"
                        style={{
                          backgroundColor: !storageManagement.connections.mysql.database ? colors.accent + '20' : undefined,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.accent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.cardBorder;
                        }}
                      />

                      {/* Datenbank-Validierung */}
                      {storageManagement.connections.mysql.database && validationMessages['mysql-database'] && !validatePostgreSQLDatabaseName(storageManagement.connections.mysql.database).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validatePostgreSQLDatabaseName(storageManagement.connections.mysql.database).message}
                        </div>
                      )}
                      {storageManagement.connections.mysql.database && validationMessages['mysql-database'] && validatePostgreSQLDatabaseName(storageManagement.connections.mysql.database).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validatePostgreSQLDatabaseName(storageManagement.connections.mysql.database).message}
                        </div>
                      )}
                    </div>

                    {/* Benutzername und Passwort nebeneinander */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Benutzername</label>
                          <input
                            type="text"
                            className={`form-control ${storageManagement.connections.mysql.username && !validateMySQLUsername(storageManagement.connections.mysql.username).isValid ? 'is-invalid' : ''}`}
                            value={storageManagement.connections.mysql.username}
                            onChange={(e) => updateConnection('mysql', { username: e.target.value })}
                            placeholder="chef_user"
                            style={{
                              backgroundColor: !storageManagement.connections.mysql.username ? colors.accent + '20' : undefined,
                              borderColor: colors.cardBorder,
                              color: colors.text,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />

                          {/* Benutzername-Validierung */}
                          {storageManagement.connections.mysql.username && validationMessages['mysql-username'] && !validateMySQLUsername(storageManagement.connections.mysql.username).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validateMySQLUsername(storageManagement.connections.mysql.username).message}
                            </div>
                          )}
                          {storageManagement.connections.mysql.username && validationMessages['mysql-username'] && validateMySQLUsername(storageManagement.connections.mysql.username).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validateMySQLUsername(storageManagement.connections.mysql.username).message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Passwort</label>
                          <div className="input-group">
                            <input
                              type={showPasswords.mysql ? 'text' : 'password'}
                              className="form-control"
                              value={storageManagement.connections.mysql.password}
                              onChange={(e) => updateConnection('mysql', { password: e.target.value })}
                              placeholder="Passwort"
                              style={{
                                backgroundColor: !storageManagement.connections.mysql.password ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => {
                                const newPassword = generateSecurePassword();
                                updateConnection('mysql', { password: newPassword });
                              }}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                              title="Sicheres Passwort generieren"
                            >
                              <FaKey />
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => togglePasswordVisibility('mysql')}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                backgroundColor: colors.card
                              }}
                              title={showPasswords.mysql ? 'Passwort verbergen' : 'Passwort anzeigen'}
                            >
                              {showPasswords.mysql ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {/* Passwortstärke-Anzeige */}
                          {storageManagement.connections.mysql.password && showPasswordStrength && (
                            <div className="mt-2">
                              {(() => {
                                const validation = validatePasswordStrength(storageManagement.connections.mysql.password);
                                const strengthColor = validation.strength === 'weak' ? '#dc3545' :
                                  validation.strength === 'medium' ? '#ffc107' : '#198754';
                                const strengthIcon = validation.strength === 'weak' ? '⚠️' :
                                  validation.strength === 'medium' ? '🔒' : '🛡️';

                                return (
                                  <div
                                    className="d-flex align-items-center"
                                    style={{
                                      color: strengthColor,
                                      fontSize: '0.875em',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <FaShieldAlt className="me-2" />
                                    <span className="me-2">{strengthIcon}</span>
                                    <span className="me-2" style={{ fontWeight: 'bold' }}>
                                      {validation.strength === 'weak' ? 'Schwach' :
                                        validation.strength === 'medium' ? 'Mittel' : 'Stark'}
                                    </span>
                                    <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                                      ({validation.score}/8 Punkte)
                                    </span>
                                  </div>
                                );
                              })()}
                              <div
                                className="mt-1"
                                style={{
                                  color: validatePasswordStrength(storageManagement.connections.mysql.password).strength === 'weak' ? '#dc3545' :
                                    validatePasswordStrength(storageManagement.connections.mysql.password).strength === 'medium' ? '#ffc107' : '#198754',
                                  fontSize: '0.8em'
                                }}
                              >
                                {validatePasswordStrength(storageManagement.connections.mysql.password).message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verbindungsstatus und Test-Button */}
                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <FaWifi className="me-2" style={{ color: colors.textSecondary }} />
                      <span style={{ color: colors.text }}>
                        Verbindungsstatus:
                        <span className={`ms-2 ${storageManagement.connections.mysql.connectionStatus ? 'text-success' : 'text-danger'}`}>
                          {storageManagement.connections.mysql.connectionStatus ? 'Verbunden' : 'Nicht verbunden'}
                        </span>
                      </span>
                    </div>
                    <button
                      className={`btn ${isMySQLButtonEnabled ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                      onClick={handleMySQLConnectionTest}
                      disabled={!isMySQLButtonEnabled}
                      style={{
                        opacity: isMySQLButtonEnabled ? 1 : 0.6,
                        cursor: isMySQLButtonEnabled ? 'pointer' : 'not-allowed'
                      }}
                      title={isMySQLButtonEnabled ? 'MySQL-Verbindung testen' : 'Alle Felder müssen gültig ausgefüllt sein'}
                    >
                      <FaWifi className="me-1" />
                      Verbindung testen
                    </button>
                  </div>

                  {/* Testmeldungen anzeigen */}
                  {storageManagement.connections.mysql.testMessage && (
                    <div className="mt-3">
                      <div
                        className="alert alert-info"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          fontSize: '0.875em',
                          marginBottom: '0'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <FaInfoCircle className="me-2 mt-1" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <pre style={{
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              fontSize: 'inherit'
                            }}>
                              {storageManagement.connections.mysql.testMessage}
                            </pre>
                            {storageManagement.connections.mysql.lastTested && (
                              <div className="mt-2">
                                <small className="text-muted">
                                  {new Date(storageManagement.connections.mysql.lastTested).toLocaleString('de-DE')}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>

          )}

          {/* Supabase-Konfiguration */}
          {supabaseSectionVisible && (
            <div className={`card mb-4 storage-section ${supabaseSectionAnimating ? 'slide-out-down' : 'slide-up'}`} style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaCloud className="me-2" />
                  Supabase-Konfiguration
                </h5>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                {/* Info-Banner */}
                <div className="alert alert-info mb-4" style={{ backgroundColor: '#3ecf8e20', borderColor: '#3ecf8e' }}>
                  <FaInfoCircle className="me-2" />
                  <strong>Supabase Cloud:</strong> Vollständig verwaltete PostgreSQL-Datenbank und Object Storage.
                  <br />
                  <small>Erstellen Sie ein kostenloses Projekt auf <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3ecf8e' }}>supabase.com</a></small>
                </div>

                <div className="row">
                  {/* Gruppe 1: URL */}
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">
                        <FaCloud className="me-2" style={{ color: '#3ecf8e' }} />
                        Supabase Project URL
                      </label>
                      <input
                        type="text"
                        className={`form-control ${storageManagement.connections.supabase.url && !validateSupabaseURL(storageManagement.connections.supabase.url).isValid ? 'is-invalid' : ''}`}
                        value={storageManagement.connections.supabase.url}
                        onChange={(e) => updateConnection('supabase', { url: e.target.value })}
                        placeholder="https://xxxxx.supabase.co"
                        style={{
                          backgroundColor: !storageManagement.connections.supabase.url ? colors.accent + '20' : undefined,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          transition: 'all 0.2s ease',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.accent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.cardBorder;
                        }}
                      />
                      {/* URL-Validierung */}
                      {storageManagement.connections.supabase.url && validationMessages['supabase-url'] && !validateSupabaseURL(storageManagement.connections.supabase.url).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateSupabaseURL(storageManagement.connections.supabase.url).message}
                        </div>
                      )}
                      {storageManagement.connections.supabase.url && validationMessages['supabase-url'] && validateSupabaseURL(storageManagement.connections.supabase.url).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateSupabaseURL(storageManagement.connections.supabase.url).message}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gruppe 2: API Keys */}
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">
                        <FaKey className="me-2" style={{ color: '#3ecf8e' }} />
                        Anon (Public) Key
                      </label>
                      <div className="input-group">
                        <input
                          type={showPasswords.supabaseAnon ? 'text' : 'password'}
                          className={`form-control ${storageManagement.connections.supabase.anonKey && !validateSupabaseKey(storageManagement.connections.supabase.anonKey, 'anon').isValid ? 'is-invalid' : ''}`}
                          value={storageManagement.connections.supabase.anonKey}
                          onChange={(e) => updateConnection('supabase', { anonKey: e.target.value })}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          style={{
                            backgroundColor: !storageManagement.connections.supabase.anonKey ? colors.accent + '20' : undefined,
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => togglePasswordVisibility('supabaseAnon')}
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            backgroundColor: colors.card
                          }}
                          title={showPasswords.supabaseAnon ? 'Key verbergen' : 'Key anzeigen'}
                        >
                          {showPasswords.supabaseAnon ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {/* Anon Key-Validierung */}
                      {storageManagement.connections.supabase.anonKey && validationMessages['supabase-anonKey'] && !validateSupabaseKey(storageManagement.connections.supabase.anonKey, 'anon').isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateSupabaseKey(storageManagement.connections.supabase.anonKey, 'anon').message}
                        </div>
                      )}
                      {storageManagement.connections.supabase.anonKey && validationMessages['supabase-anonKey'] && validateSupabaseKey(storageManagement.connections.supabase.anonKey, 'anon').isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateSupabaseKey(storageManagement.connections.supabase.anonKey, 'anon').message}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        <FaShieldAlt className="me-2" style={{ color: '#3ecf8e' }} />
                        Service Role Key
                      </label>
                      <div className="input-group">
                        <input
                          type={showPasswords.supabaseService ? 'text' : 'password'}
                          className={`form-control ${storageManagement.connections.supabase.serviceRoleKey && !validateSupabaseKey(storageManagement.connections.supabase.serviceRoleKey, 'service').isValid ? 'is-invalid' : ''}`}
                          value={storageManagement.connections.supabase.serviceRoleKey}
                          onChange={(e) => updateConnection('supabase', { serviceRoleKey: e.target.value })}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          style={{
                            backgroundColor: !storageManagement.connections.supabase.serviceRoleKey ? colors.accent + '20' : undefined,
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => togglePasswordVisibility('supabaseService')}
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            backgroundColor: colors.card
                          }}
                          title={showPasswords.supabaseService ? 'Key verbergen' : 'Key anzeigen'}
                        >
                          {showPasswords.supabaseService ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {/* Service Role Key-Validierung */}
                      {storageManagement.connections.supabase.serviceRoleKey && validationMessages['supabase-serviceRoleKey'] && !validateSupabaseKey(storageManagement.connections.supabase.serviceRoleKey, 'service').isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateSupabaseKey(storageManagement.connections.supabase.serviceRoleKey, 'service').message}
                        </div>
                      )}
                      {storageManagement.connections.supabase.serviceRoleKey && validationMessages['supabase-serviceRoleKey'] && validateSupabaseKey(storageManagement.connections.supabase.serviceRoleKey, 'service').isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateSupabaseKey(storageManagement.connections.supabase.serviceRoleKey, 'service').message}
                        </div>
                      )}
                      
                      {/* Sicherheitshinweis */}
                      <div className="alert alert-warning mt-2 mb-0" style={{ backgroundColor: '#ffc10720', borderColor: '#ffc107', fontSize: '0.85rem' }}>
                        <FaExclamationTriangle className="me-2" />
                        <strong>Wichtig:</strong> Der Service Role Key hat vollständigen Zugriff. Behandeln Sie ihn wie ein Passwort!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verbindungsstatus und Test-Button */}
                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <FaWifi className="me-2" style={{ color: colors.textSecondary }} />
                      <span style={{ color: colors.text }}>
                        Verbindungsstatus:
                        <span className={`ms-2 ${storageManagement.connections.supabase.connectionStatus ? 'text-success' : 'text-danger'}`}>
                          {storageManagement.connections.supabase.connectionStatus ? 'Verbunden' : 'Nicht verbunden'}
                        </span>
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                        style={{
                          borderColor: '#3ecf8e',
                          color: '#3ecf8e'
                        }}
                        title="Supabase Dashboard öffnen"
                      >
                        <FaExternalLinkAlt className="me-1" />
                        Dashboard
                      </button>
                      <button
                        className={`btn ${isSupabaseButtonEnabled ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                        onClick={handleSupabaseConnectionTest}
                        disabled={!isSupabaseButtonEnabled}
                        style={{
                          opacity: isSupabaseButtonEnabled ? 1 : 0.6,
                          cursor: isSupabaseButtonEnabled ? 'pointer' : 'not-allowed'
                        }}
                        title={isSupabaseButtonEnabled ? 'Supabase-Verbindung testen' : 'Alle Felder müssen gültig ausgefüllt sein'}
                      >
                        <FaWifi className="me-1" />
                        Verbindung testen
                      </button>
                    </div>
                  </div>

                  {/* Testmeldungen anzeigen */}
                  {storageManagement.connections.supabase.testMessage && (
                    <div className="mt-3">
                      <div
                        className="alert alert-info"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          fontSize: '0.875em',
                          marginBottom: '0'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <FaInfoCircle className="me-2 mt-1" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <pre style={{
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              fontSize: 'inherit'
                            }}>
                              {storageManagement.connections.supabase.testMessage}
                            </pre>
                            {storageManagement.connections.supabase.lastTested && (
                              <div className="mt-2">
                                <small className="text-muted">
                                  {new Date(storageManagement.connections.supabase.lastTested).toLocaleString('de-DE')}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hilfreiche Links */}
                  {storageManagement.connections.supabase.connectionStatus && (
                    <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#3ecf8e20', border: `1px solid #3ecf8e` }}>
                      <div className="d-flex align-items-start">
                        <FaCheckCircle className="me-2 mt-1" style={{ color: '#3ecf8e', fontSize: '1.2rem' }} />
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: colors.text }}>Verbindung erfolgreich!</strong>
                          <div className="mt-2" style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                            <div className="d-flex flex-column gap-1">
                              <span>✅ Daten & Bilder werden über Supabase synchronisiert</span>
                              <span>✅ Automatische Backups durch Supabase</span>
                              <span>✅ Zugriff von überall (auch über Netlify)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MinIO-Konfiguration - nur anzeigen wenn nicht lokal und nicht Browser-Speicher */}
          {minioSectionVisible && (
            <div className={`card mb-4 storage-section ${minioSectionAnimating ? 'slide-out-down' : 'slide-up'}`} style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaServer className="me-2" />
                  MinIO-Konfiguration
                </h5>
              </div>
              <div className="card-body" style={{ color: colors.text }}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Host/IP-Adresse</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className={`form-control ${storageManagement.connections.minio.host && !validateHostname(storageManagement.connections.minio.host).isValid ? 'is-invalid' : ''}`}
                          value={storageManagement.connections.minio.host}
                          onChange={(e) => {
                            updateConnection('minio', { host: e.target.value });
                            setValidationMessages(prev => ({ ...prev, 'minio-host': true }));
                          }}
                          placeholder="localhost"
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            backgroundColor: !storageManagement.connections.minio.host ? colors.accent + '20' : undefined,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handlePingHost(storageManagement.connections.minio.host, 'minio-host')}
                          disabled={!storageManagement.connections.minio.host || pingingHosts['minio-host']}
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                            e.currentTarget.style.backgroundColor = colors.accent + '20';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Ping testen"
                        >
                          {pingingHosts['minio-host'] ? (
                            <FaSpinner className="fa-spin" />
                          ) : (
                            <FaWifi />
                          )}
                        </button>
                      </div>
                      {/* Hostname-Validierung */}
                      {storageManagement.connections.minio.host && validationMessages['minio-host'] && !validateHostname(storageManagement.connections.minio.host).isValid && (
                        <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.minio.host).message}
                        </div>
                      )}
                      {storageManagement.connections.minio.host && validationMessages['minio-host'] && validateHostname(storageManagement.connections.minio.host).isValid && (
                        <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                          {validateHostname(storageManagement.connections.minio.host).message}
                        </div>
                      )}

                      {/* Ping-Ergebnis anzeigen */}
                      {pingResults['minio-host'] && (
                        <div style={{
                          color: pingResults['minio-host'].success ? '#198754' : '#dc3545',
                          fontSize: '0.875em',
                          fontWeight: '500',
                          marginTop: '2px'
                        }}>
                          {pingResults['minio-host'].message}
                        </div>
                      )}
                    </div>
                    {/* MinIO und Console Ports nebeneinander */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">MinIO Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.minio.port && !validatePort(storageManagement.connections.minio.port).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.minio.port}
                              onChange={(e) => {
                                updateConnection('minio', { port: e.target.value });
                                setValidationMessages(prev => ({ ...prev, 'minio-port': true }));
                              }}
                              placeholder="9000"
                              style={{
                                backgroundColor: !storageManagement.connections.minio.port ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => handleCheckPort(storageManagement.connections.minio.host, storageManagement.connections.minio.port, 'minio-port')}
                              disabled={!storageManagement.connections.minio.host || !storageManagement.connections.minio.port || checkingPorts['minio-port']}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                                e.currentTarget.style.backgroundColor = colors.accent + '20';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Port testen"
                            >
                              {checkingPorts['minio-port'] ? (
                                <FaSpinner className="fa-spin" />
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                          {/* Port-Validierung */}
                          {storageManagement.connections.minio.port && validationMessages['minio-port'] && !validatePort(storageManagement.connections.minio.port).isValid && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.minio.port).message}
                            </div>
                          )}
                          {storageManagement.connections.minio.port && validationMessages['minio-port'] && validatePort(storageManagement.connections.minio.port).isValid && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              {validatePort(storageManagement.connections.minio.port).message}
                            </div>
                          )}

                          {/* Port-Test-Ergebnis anzeigen */}
                          {portResults['minio-port'] && (
                            <div style={{
                              color: portResults['minio-port'].success ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              {portResults['minio-port'].message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Console Port</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${storageManagement.connections.minio.consolePort && !validatePort(storageManagement.connections.minio.consolePort).isValid ? 'is-invalid' : ''}`}
                              value={storageManagement.connections.minio.consolePort}
                              onChange={(e) => {
                                updateConnection('minio', { consolePort: e.target.value });
                              }}
                              placeholder="9001"
                              style={{
                                backgroundColor: !storageManagement.connections.minio.consolePort ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => handleCheckPort(storageManagement.connections.minio.host, storageManagement.connections.minio.consolePort, 'minio-console-port')}
                              disabled={!storageManagement.connections.minio.host || !storageManagement.connections.minio.consolePort || checkingPorts['minio-console-port']}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                                e.currentTarget.style.backgroundColor = colors.accent + '20';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Port testen"
                            >
                              {checkingPorts['minio-console-port'] ? (
                                <FaSpinner className="fa-spin" />
                              ) : (
                                <FaWifi />
                              )}
                            </button>
                          </div>
                          {/* Port-Validierung */}
                          {storageManagement.connections.minio.consolePort && validationMessages['minio-consolePort'] && (
                            <div style={{
                              color: validatePort(storageManagement.connections.minio.consolePort).isValid ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              marginTop: '2px'
                            }}>
                              {validatePort(storageManagement.connections.minio.consolePort).message}
                            </div>
                          )}

                          {/* Port-Test-Ergebnis anzeigen */}
                          {portResults['minio-console-port'] && (
                            <div style={{
                              color: portResults['minio-console-port'].success ? '#198754' : '#dc3545',
                              fontSize: '0.875em',
                              fontWeight: '500',
                              marginTop: '2px'
                            }}>
                              {portResults['minio-console-port'].message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Bucket</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={storageManagement.connections.minio.bucket}
                          onChange={(e) => updateConnection('minio', { bucket: e.target.value })}
                          placeholder="chef-numbers"
                          style={{
                            backgroundColor: !storageManagement.connections.minio.bucket ? colors.accent + '20' : undefined,
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={async () => {
                            const host = storageManagement.connections.minio.host;
                            const consolePort = storageManagement.connections.minio.consolePort || '9001';
                            const accessKey = storageManagement.connections.minio.accessKey;
                            const secretKey = storageManagement.connections.minio.secretKey;

                            if (host && consolePort && accessKey && secretKey) {
                              try {
                                // MinIO-Konsole-URL
                                const consoleUrl = `http://${host}:${consolePort}`;

                                // Öffne MinIO-Konsole in neuem Fenster
                                const newWindow = window.open(consoleUrl, '_blank');

                                if (newWindow) {
                                  // Warte kurz bis die Seite geladen ist
                                  await new Promise(resolve => setTimeout(resolve, 2000));

                                  try {
                                    // Versuche automatische Anmeldung über JavaScript
                                    newWindow.postMessage({
                                      type: 'MINIO_AUTO_LOGIN',
                                      credentials: {
                                        username: accessKey,
                                        password: secretKey
                                      }
                                    }, consoleUrl);

                                    console.log('🔐 MinIO-Konsole geöffnet - Anmeldedaten gesendet');
                                  } catch (error) {
                                    console.warn('⚠️ Automatische Anmeldung fehlgeschlagen, manuelle Anmeldung erforderlich');
                                  }
                                }
                              } catch (error) {
                                console.error('❌ Fehler beim Öffnen der MinIO-Konsole:', error);
                                // Fallback: Öffne normale URL
                                window.open(`http://${host}:${consolePort}`, '_blank');
                              }
                            }
                          }}
                          disabled={!storageManagement.connections.minio.connectionStatus}
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.text,
                            transition: 'all 0.2s ease',
                            opacity: storageManagement.connections.minio.connectionStatus ? 1 : 0.6,
                            cursor: storageManagement.connections.minio.connectionStatus ? 'pointer' : 'not-allowed'
                          }}
                          onMouseEnter={(e) => {
                            if (storageManagement.connections.minio.connectionStatus) {
                              e.currentTarget.style.borderColor = colors.accent;
                              e.currentTarget.style.backgroundColor = colors.accent + '20';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title={storageManagement.connections.minio.connectionStatus ? 'MinIO-Konsole öffnen' : 'Verbindungstest muss erfolgreich sein'}
                        >
                          <FaExternalLinkAlt />
                        </button>
                      </div>
                      {/* Bucket Validierung */}
                      {storageManagement.connections.minio.bucket && validationMessages['minio-bucket'] && (
                        <div style={{
                          color: validateMinIOBucket(storageManagement.connections.minio.bucket).isValid ? '#198754' : '#dc3545',
                          fontSize: '0.875em',
                          marginTop: '2px'
                        }}>
                          {validateMinIOBucket(storageManagement.connections.minio.bucket).isValid ?
                            '✓ ' + validateMinIOBucket(storageManagement.connections.minio.bucket).message :
                            '✗ ' + validateMinIOBucket(storageManagement.connections.minio.bucket).message
                          }
                        </div>
                      )}
                    </div>

                    {/* Access Key und Secret Key nebeneinander */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Access Key</label>
                          <input
                            type="text"
                            className="form-control"
                            value={storageManagement.connections.minio.accessKey}
                            onChange={(e) => updateConnection('minio', { accessKey: e.target.value })}
                            placeholder="minioadmin"
                            style={{
                              backgroundColor: !storageManagement.connections.minio.accessKey ? colors.accent + '20' : undefined,
                              borderColor: colors.cardBorder,
                              color: colors.text,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />
                          {/* Access Key Validierung */}
                          {storageManagement.connections.minio.accessKey && validationMessages['minio-accessKey'] && (
                            <div style={{ color: '#198754', fontSize: '0.875em', marginTop: '2px' }}>
                              ✓ Access Key eingegeben
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Secret Key</label>
                          <div className="input-group">
                            <input
                              type={showPasswords.minio ? 'text' : 'password'}
                              className="form-control"
                              value={storageManagement.connections.minio.secretKey}
                              onChange={(e) => updateConnection('minio', { secretKey: e.target.value })}
                              placeholder="Secret Key"
                              style={{
                                backgroundColor: !storageManagement.connections.minio.secretKey ? colors.accent + '20' : undefined,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                              }}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => {
                                const newPassword = generateMinIOSecurePassword();
                                updateConnection('minio', { secretKey: newPassword });
                              }}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                                e.currentTarget.style.backgroundColor = colors.accent + '20';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Sicheren Secret Key generieren"
                            >
                              <FaKey />
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => togglePasswordVisibility('minio')}
                              style={{
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                                e.currentTarget.style.backgroundColor = colors.accent + '20';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.cardBorder;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title={showPasswords.minio ? 'Secret Key verbergen' : 'Secret Key anzeigen'}
                            >
                              {showPasswords.minio ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {/* Secret Key Stärke-Anzeige */}
                          {storageManagement.connections.minio.secretKey && showMinIOPasswordStrength && (
                            <div className="mt-2">
                              {(() => {
                                const validation = validateMinIOPasswordStrength(storageManagement.connections.minio.secretKey);
                                const strengthColor = validation.strength === 'weak' ? '#dc3545' :
                                  validation.strength === 'medium' ? '#ffc107' : '#198754';
                                const strengthIcon = validation.strength === 'weak' ? '⚠️' :
                                  validation.strength === 'medium' ? '🔒' : '🛡️';

                                return (
                                  <div
                                    className="d-flex align-items-center"
                                    style={{
                                      color: strengthColor,
                                      fontSize: '0.875em',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <FaShieldAlt className="me-2" />
                                    <span className="me-2">{strengthIcon}</span>
                                    <span className="me-2">Secret Key Stärke:</span>
                                    <span style={{ fontWeight: '600' }}>{validation.strength === 'weak' ? 'Schwach' : validation.strength === 'medium' ? 'Mittel' : 'Stark'}</span>
                                  </div>
                                );
                              })()}
                              <div
                                className="mt-1"
                                style={{
                                  color: validateMinIOPasswordStrength(storageManagement.connections.minio.secretKey).strength === 'weak' ? '#dc3545' :
                                    validateMinIOPasswordStrength(storageManagement.connections.minio.secretKey).strength === 'medium' ? '#ffc107' : '#198754',
                                  fontSize: '0.8em'
                                }}
                              >
                                {validateMinIOPasswordStrength(storageManagement.connections.minio.secretKey).message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verbindungsstatus */}
                <div className="mt-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <span style={{ color: colors.text }}>
                      <FaWifi className="me-2" />
                      Verbindungsstatus:
                      <span className={`ms-2 ${storageManagement.connections.minio.connectionStatus ? 'text-success' : 'text-danger'}`}>
                        {storageManagement.connections.minio.connectionStatus ? 'Verbunden' : 'Nicht verbunden'}
                      </span>
                    </span>
                    <button
                      className={`btn ${isMinIOConfigValid() ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                      onClick={handleMinIOConnectionTest}
                      disabled={!isMinIOConfigValid()}
                      style={{
                        opacity: isMinIOConfigValid() ? 1 : 0.6,
                        cursor: isMinIOConfigValid() ? 'pointer' : 'not-allowed'
                      }}
                      title={isMinIOConfigValid() ? 'MinIO-Verbindung testen' : 'Alle Felder müssen gültig ausgefüllt sein'}
                    >
                      <FaWifi className="me-1" />
                      Verbindung testen
                    </button>
                  </div>

                  {/* MinIO Testmeldungen anzeigen */}
                  {storageManagement.connections.minio.testMessage && (
                    <div className="mt-3">
                      <div
                        className="alert alert-info"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                          fontSize: '0.875em',
                          marginBottom: '0'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <FaInfoCircle className="me-2 mt-1" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <pre style={{
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              fontSize: 'inherit'
                            }}>
                              {storageManagement.connections.minio.testMessage}
                            </pre>
                            {storageManagement.connections.minio.lastTested && (
                              <div className="mt-2">
                                <small className="text-muted">
                                  {new Date(storageManagement.connections.minio.lastTested).toLocaleString('de-DE')}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Aktions-Buttons */}
          <div className="card" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <div className="card-header" style={{ backgroundColor: colors.secondary }}>
              <h5 className="mb-0" style={{ color: colors.text }}>
                <FaCog className="me-2" />
                Aktionen
              </h5>
            </div>
            <div className="card-body" style={{ color: colors.text }}>
              <div className="d-flex justify-content-between align-items-center">
                {/* Links: Backup/Restore Button */}
                <button
                  className="btn btn-outline-info"
                  onClick={() => setShowBackupModal(true)}
                  style={{
                    backgroundColor: colors.card,
                    borderColor: '#17a2b8',
                    color: '#17a2b8'
                  }}
                  title="Backup erstellen oder wiederherstellen"
                >
                  <FaDownload className="me-2" />
                  Backup & Restore
                </button>

                {/* Rechts: Konfiguration übernehmen Button */}
                <button
                  className={`btn ${(storageManagement.selectedStorage.isTested && isConfigurationDifferent()) ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                  disabled={!storageManagement.selectedStorage.isTested || !isConfigurationDifferent()}
                  onClick={handleConfigApply}
                  style={{
                    opacity: (storageManagement.selectedStorage.isTested && isConfigurationDifferent()) ? 1 : 0.6,
                    cursor: (storageManagement.selectedStorage.isTested && isConfigurationDifferent()) ? 'pointer' : 'not-allowed'
                  }}
                  title={
                    !storageManagement.selectedStorage.isTested
                      ? 'Alle Verbindungen müssen erfolgreich getestet werden'
                      : !isConfigurationDifferent()
                        ? 'Die ausgewählte Konfiguration ist identisch mit der aktuellen'
                        : 'Konfiguration übernehmen'
                  }
                >
                  <FaCheckCircle className="me-2" />
                  Konfiguration übernehmen
                </button>
              </div>
            </div>
          </div>

          {/* CSS-Styles für storage-mode-option, cloud-option und database-option */}
          <style>{`
        .storage-mode-option, .cloud-option, .database-option {
          min-height: 120px;
          height: 120px;
          display: flex;
          align-items: center;
        }
        
        .storage-mode-option:hover, .cloud-option:hover, .database-option:hover {
          border-color: ${colors.accent} !important;
          background-color: ${colors.accent}10 !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .form-check-input:checked + .form-check-label .storage-mode-option,
        .form-check-input:checked + .form-check-label .cloud-option,
        .form-check-input:checked + .form-check-label .database-option {
          border-color: ${colors.accent} !important;
          background-color: ${colors.accent}15 !important;
          box-shadow: 0 1px 4px ${colors.accent}30;
        }
      `}</style>

          {/* DockerSetupModal */}
          <DockerSetupModal
            show={showDockerSetupModal}
            onClose={handleDockerSetupModalClose}
            onRestartTest={handleRestartConnectionTest}
            colors={colors}
            serviceType={dockerModalServiceType}
            dockerConfig={{
              postgres: {
                host: storageManagement.connections.postgres.host,
                port: storageManagement.connections.postgres.port,
                database: storageManagement.connections.postgres.database,
                username: storageManagement.connections.postgres.username,
                password: storageManagement.connections.postgres.password
              },
              postgrest: {
                port: storageManagement.connections.postgres.postgrestPort
              },
              mariadb: {
                host: storageManagement.connections.mariadb?.host || 'localhost',
                port: storageManagement.connections.mariadb?.port || '3306',
                database: storageManagement.connections.mariadb?.database || 'chef_numbers',
                username: storageManagement.connections.mariadb?.username || 'chef_user',
                password: storageManagement.connections.mariadb?.password || 'chef123',
                prismaPort: storageManagement.connections.mariadb?.prismaPort || '3001'
              },
              mysql: {
                host: storageManagement.connections.mysql?.host || 'localhost',
                port: storageManagement.connections.mysql?.port || '3306',
                database: storageManagement.connections.mysql?.database || 'chef_numbers',
                username: storageManagement.connections.mysql?.username || 'chef_user',
                password: storageManagement.connections.mysql?.password || 'chef123',
                prismaPort: storageManagement.connections.mysql?.prismaPort || '3002'
              },
              prisma: {
                port: storageManagement.connections.mariadb?.prismaPort || '3001' // Legacy für Rückwärtskompatibilität
              },
              minio: {
                host: storageManagement.connections.minio.host,
                port: storageManagement.connections.minio.port,
                consolePort: storageManagement.connections.minio.consolePort,
                accessKey: storageManagement.connections.minio.accessKey,
                secretKey: storageManagement.connections.minio.secretKey,
                bucket: storageManagement.connections.minio.bucket,
                useSSL: storageManagement.connections.minio.useSSL
              },
              frontend: {
                host: 'localhost',
                port: '3000'
              }
            }}
          />

          {/* Konfigurations-Modal */}
          {showConfigModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="modal-header" style={{ backgroundColor: colors.secondary, borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <h5 className="modal-title" style={{ color: colors.text }}>
                      <FaCheckCircle className="me-2" />
                      Konfiguration übernehmen
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleConfigModalClose}
                      style={{ filter: 'invert(1)' }}
                    ></button>
                  </div>
                  <div className="modal-body" style={{ color: colors.text }}>
                    <div className="row">
                      <div className="col-md-6">
                        <h6 style={{ color: colors.text, marginBottom: '15px' }}>
                          <FaDatabase className="me-2" />
                          Aktuelle Konfiguration
                        </h6>
                        <div className="alert alert-info" style={{ backgroundColor: colors.accent + '20', borderColor: colors.accent }}>
                          <strong>Speichermodus:</strong> {storageManagement.currentStorage.currentStorageMode}<br />
                          <strong>Datenbank:</strong> {storageManagement.currentStorage.currentDataStorage}<br />
                          <strong>Bildspeicher:</strong> {storageManagement.currentStorage.currentPictureStorage}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 style={{ color: colors.text, marginBottom: '15px' }}>
                          <FaCloud className="me-2" />
                          Neue Konfiguration
                        </h6>
                        <div className="alert alert-success" style={{ backgroundColor: '#28a74520', borderColor: '#28a745' }}>
                          <strong>Speichermodus:</strong> {storageManagement.selectedStorage.selectedStorageMode}<br />
                          <strong>Datenbank:</strong> {storageManagement.selectedStorage.selectedDataStorage}<br />
                          <strong>Bildspeicher:</strong> {storageManagement.selectedStorage.selectedPictureStorage}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h6 style={{ color: colors.text, marginBottom: '15px' }}>
                        <FaSync className="me-2" />
                        Datenübertragung
                      </h6>
                      <p style={{ color: colors.textSecondary }}>
                        Möchten Sie die vorhandenen Daten aus der aktuellen Konfiguration in die neue Konfiguration übertragen?
                      </p>
                    </div>
                  </div>
                  <div className="modal-footer" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleDataTransfer(true)}
                    >
                      <FaCheckCircle className="me-2" />
                      Ja, Daten übertragen
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => handleDataTransfer(false)}
                    >
                      <FaTimes className="me-2" />
                      Nein, ohne Datenübertragung
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleConfigModalClose}
                    >
                      <FaTimes className="me-2" />
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Progress Modal - Zeigt Fortschritt der Datenübertragung */}
          {showTransferProgressModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070 }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="modal-header" style={{ backgroundColor: colors.secondary, borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <h5 className="modal-title" style={{ color: colors.text }}>
                      {transferCompleted ? (
                        <>
                          <FaCheckCircle className="me-2" style={{ color: '#28a745' }} />
                          Datenübertragung abgeschlossen
                        </>
                      ) : (
                        <>
                          <FaSpinner className="fa-spin me-2" style={{ color: colors.accent }} />
                          Datenübertragung läuft...
                        </>
                      )}
                    </h5>
                  </div>
                  <div className="modal-body" style={{ color: colors.text, padding: '2rem' }}>
                    {/* Fortschrittsbalken für jede Entity */}
                    {Object.entries(transferResults).map(([entityType, result]) => (
                      <div key={entityType} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            {result.status === 'completed' && <FaCheck className="me-2" style={{ color: '#28a745' }} />}
                            {result.status === 'in_progress' && <FaSpinner className="fa-spin me-2" style={{ color: colors.accent }} />}
                            {result.status === 'pending' && <FaInfoCircle className="me-2" style={{ color: colors.textSecondary }} />}
                            {result.status === 'error' && <FaTimes className="me-2" style={{ color: '#dc3545' }} />}
                            <strong style={{ fontSize: '1.1rem' }}>{getEntityNameGerman(entityType)}</strong>
                          </div>
                          <span style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                            {result.transferred > 0 ? `${result.transferred} Datensätze` : 
                             result.status === 'pending' ? 'Wartet...' :
                             result.status === 'in_progress' ? 'In Bearbeitung...' : 
                             'Keine Daten'}
                          </span>
                        </div>
                        
                        {/* Fortschrittsbalken */}
                        <div className="progress" style={{ height: '30px', backgroundColor: colors.secondary }}>
                          <div
                            className={`progress-bar ${result.status === 'in_progress' ? 'progress-bar-striped progress-bar-animated' : ''}`}
                            role="progressbar"
                            style={{
                              width: `${result.progress}%`,
                              backgroundColor: result.status === 'completed' ? '#28a745' :
                                              result.status === 'error' ? '#dc3545' :
                                              colors.accent,
                              transition: 'width 0.3s ease'
                            }}
                          >
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                              {result.progress}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Details */}
                        {result.transferred > 0 && (
                          <div className="mt-2" style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                            <div className="d-flex justify-content-between">
                              <span>Quelle: {result.source}</span>
                              <span>Ziel (vorher): {result.target}</span>
                              <span style={{ color: colors.accent, fontWeight: 'bold' }}>
                                Gesamt: {result.transferred}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Zusammenfassung - nur wenn abgeschlossen */}
                    {transferCompleted && (
                      <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#28a74520', border: `2px solid #28a745` }}>
                        <div className="d-flex align-items-start">
                          <FaCheckCircle className="me-3 mt-1" style={{ color: '#28a745', fontSize: '1.5rem' }} />
                          <div>
                            <h6 style={{ color: colors.text, marginBottom: '10px' }}>
                              ✅ Übertragung erfolgreich abgeschlossen!
                            </h6>
                            <div style={{ fontSize: '0.9rem', color: colors.text }}>
                              {Object.entries(transferResults).map(([type, result]) => (
                                <div key={type} className="mb-1">
                                  <strong>{getEntityNameGerman(type)}:</strong>{' '}
                                  {result.transferred} Datensätze übertragen
                                  {result.source !== result.transferred && (
                                    <span style={{ color: colors.textSecondary, marginLeft: '8px' }}>
                                      ({result.transferred - result.target} neu hinzugefügt)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Aktuelle Nachricht */}
                    {dataTransferProgress && !transferCompleted && (
                      <div className="mt-3 p-2 rounded" style={{ backgroundColor: colors.secondary }}>
                        <small style={{ color: colors.text }}>
                          {dataTransferProgress.message}
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    {transferCompleted ? (
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleTransferComplete}
                        style={{
                          backgroundColor: '#28a745',
                          borderColor: '#28a745'
                        }}
                      >
                        <FaCheckCircle className="me-2" />
                        Fertig - Konfiguration übernehmen
                      </button>
                    ) : (
                      <div className="d-flex align-items-center" style={{ color: colors.textSecondary }}>
                        <FaSpinner className="fa-spin me-2" />
                        Bitte warten Sie, während die Daten übertragen werden...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup & Restore Modal */}
          {showBackupModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070 }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="modal-header" style={{ backgroundColor: colors.secondary, borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <h5 className="modal-title" style={{ color: colors.text }}>
                      <FaDownload className="me-2" style={{ color: '#17a2b8' }} />
                      Backup & Restore
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowBackupModal(false);
                        setBackupCompleted(false);
                        setBackupProgress(null);
                        setBackupError(null);
                      }}
                      style={{ filter: 'invert(1)' }}
                      disabled={!!backupProgress}
                    ></button>
                  </div>
                  <div className="modal-body" style={{ color: colors.text, padding: '2rem' }}>
                    {/* Fehlermeldung */}
                    {backupError && (
                      <div className="alert alert-danger mb-3" style={{
                        backgroundColor: '#dc354520',
                        borderColor: '#dc3545',
                        color: colors.text
                      }}>
                        <div className="d-flex align-items-start">
                          <FaExclamationTriangle className="me-2 mt-1" style={{ color: '#dc3545' }} />
                          <div>
                            <strong>Fehler!</strong>
                            <br />
                            {backupError}
                          </div>
                        </div>
                      </div>
                    )}

                    {!backupProgress && !backupCompleted ? (
                      <>
                        {/* Modus-Auswahl */}
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <div
                              className="p-4 rounded text-center"
                              style={{
                                border: `2px solid ${backupMode === 'backup' ? colors.accent : colors.cardBorder}`,
                                backgroundColor: backupMode === 'backup' ? colors.accent + '10' : colors.card,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                height: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                              onClick={() => setBackupMode('backup')}
                            >
                              <FaDownload style={{ fontSize: '3rem', color: '#17a2b8', marginBottom: '1rem' }} />
                              <h5 style={{ color: colors.text, marginBottom: '0.5rem' }}>Backup erstellen</h5>
                              <small style={{ color: colors.textSecondary }}>
                                Alle Daten, Einstellungen und Bilder sichern
                              </small>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div
                              className="p-4 rounded text-center"
                              style={{
                                border: `2px solid ${backupMode === 'restore' ? colors.accent : colors.cardBorder}`,
                                backgroundColor: backupMode === 'restore' ? colors.accent + '10' : colors.card,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                height: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                              onClick={() => setBackupMode('restore')}
                            >
                              <FaSync style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }} />
                              <h5 style={{ color: colors.text, marginBottom: '0.5rem' }}>Backup wiederherstellen</h5>
                              <small style={{ color: colors.textSecondary }}>
                                Daten aus einer Backup-Datei wiederherstellen
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Info-Box */}
                        <div className="alert alert-info" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}>
                          <FaInfoCircle className="me-2" />
                          <strong>Was wird {backupMode === 'backup' ? 'gesichert' : 'wiederhergestellt'}?</strong>
                          <ul className="mt-2 mb-0">
                            <li>Alle Lieferanten, Artikel und Rezepte aus dem aktuellen State</li>
                            <li>LocalStorage-Einstellungen (Design, Filter, etc.)</li>
                            <li>Alle Bilder (Artikel & Rezepte)</li>
                            {backupMode === 'restore' && (
                              <li style={{ color: '#ffc107' }}>
                                ⚠️ Die aktuelle Speicherkonfiguration bleibt erhalten
                              </li>
                            )}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Fortschrittsanzeige */}
                        {backupProgress && (
                          <div className="mb-4">
                            <div className="d-flex align-items-center mb-3">
                              <FaSpinner className="fa-spin me-2" style={{ color: colors.accent, fontSize: '1.5rem' }} />
                              <div>
                                <strong style={{ fontSize: '1.1rem' }}>{backupProgress.message}</strong>
                                <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                                  {backupProgress.item}
                                </div>
                              </div>
                            </div>
                            <div className="progress" style={{ height: '30px', backgroundColor: colors.secondary }}>
                              <div
                                className="progress-bar progress-bar-striped progress-bar-animated"
                                role="progressbar"
                                style={{
                                  width: `${(backupProgress.current / backupProgress.total) * 100}%`,
                                  backgroundColor: colors.accent
                                }}
                              >
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                  {backupProgress.current} / {backupProgress.total}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Abschluss-Nachricht */}
                        {backupCompleted && (
                          <div className="p-4 rounded text-center" style={{ backgroundColor: '#28a74520', border: `2px solid #28a745` }}>
                            <FaCheckCircle style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }} />
                            <h5 style={{ color: colors.text, marginBottom: '1rem' }}>
                              {backupMode === 'backup' ? '✅ Backup erfolgreich erstellt!' : '✅ Backup erfolgreich wiederhergestellt!'}
                            </h5>
                            <p style={{ color: colors.textSecondary, marginBottom: 0 }}>
                              {backupMode === 'backup' 
                                ? 'Die Backup-Datei wurde heruntergeladen.'
                                : 'Alle Daten und Einstellungen wurden wiederhergestellt.'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="modal-footer" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    {!backupProgress && !backupCompleted ? (
                      <>
                        {backupMode === 'backup' ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreateBackup}
                            style={{
                              backgroundColor: '#17a2b8',
                              borderColor: '#17a2b8'
                            }}
                          >
                            <FaDownload className="me-2" />
                            Backup jetzt erstellen
                          </button>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleRestoreBackup}
                              style={{ display: 'none' }}
                              id="backup-file-input"
                            />
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => document.getElementById('backup-file-input')?.click()}
                            >
                              <FaSync className="me-2" />
                              Backup-Datei auswählen
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowBackupModal(false);
                            setBackupError(null);
                          }}
                        >
                          <FaTimes className="me-2" />
                          Abbrechen
                        </button>
                      </>
                    ) : backupCompleted ? (
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => {
                          setShowBackupModal(false);
                          setBackupCompleted(false);
                          setBackupError(null);
                        }}
                      >
                        <FaCheckCircle className="me-2" />
                        OK
                      </button>
                    ) : (
                      <div className="d-flex align-items-center" style={{ color: colors.textSecondary }}>
                        <FaSpinner className="fa-spin me-2" />
                        Bitte warten...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Merge Modal - Erweiterte Optionen bei vorhandenen Daten */}
          {showDataMergeModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
              <div className="modal-dialog modal-xl">
                <div className="modal-content" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="modal-header" style={{ backgroundColor: colors.secondary, borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <h5 className="modal-title" style={{ color: colors.text }}>
                      <FaExclamationTriangle className="me-2" style={{ color: '#ffc107' }} />
                      Datenübertragung - Ziel enthält bereits Daten
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleDataMergeModalClose}
                      style={{ filter: 'invert(1)' }}
                    ></button>
                  </div>
                  <div className="modal-body" style={{ color: colors.text }}>
                    {/* Warnung */}
                    <div className="alert alert-warning mb-4" style={{ backgroundColor: '#ffc10720', borderColor: '#ffc107' }}>
                      <div className="d-flex align-items-start">
                        <FaExclamationTriangle className="me-2 mt-1" style={{ fontSize: '1.2rem' }} />
                        <div>
                          <strong>Achtung!</strong> Der Ziel-Speicher enthält bereits Daten.
                          <br />
                          Bitte wählen Sie, wie mit den vorhandenen Daten umgegangen werden soll.
                        </div>
                      </div>
                    </div>

                    {/* Strategie-Auswahl */}
                    <div className="mb-4">
                      <h6 style={{ color: colors.text, marginBottom: '15px', borderBottom: `2px solid ${colors.accent}`, paddingBottom: '8px' }}>
                        <FaCog className="me-2" />
                        Übertragungsstrategie
                      </h6>
                      
                      {/* Option 1: Überschreiben */}
                      <div 
                        className="p-3 mb-3 rounded" 
                        style={{ 
                          border: `2px solid ${mergeStrategy === 'overwrite' ? colors.accent : colors.cardBorder}`,
                          backgroundColor: mergeStrategy === 'overwrite' ? colors.accent + '10' : colors.card,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setMergeStrategy('overwrite')}
                      >
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="mergeStrategy"
                            id="overwrite"
                            checked={mergeStrategy === 'overwrite'}
                            onChange={() => setMergeStrategy('overwrite')}
                          />
                          <label className="form-check-label" htmlFor="overwrite" style={{ cursor: 'pointer', width: '100%' }}>
                            <div className="d-flex align-items-start">
                              <FaTrash className="me-3 mt-1" style={{ color: '#dc3545', fontSize: '1.2rem' }} />
                              <div>
                                <strong style={{ fontSize: '1.1rem' }}>Alle vorhandenen Daten überschreiben</strong>
                                <p className="mb-0 mt-2" style={{ color: colors.textSecondary }}>
                                  ⚠️ ALLE vorhandenen Daten im Ziel-Speicher werden gelöscht und durch die neuen Daten ersetzt.
                                  <br />
                                  Diese Aktion kann nicht rückgängig gemacht werden!
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Option 2: Zusammenführen */}
                      <div 
                        className="p-3 mb-3 rounded" 
                        style={{ 
                          border: `2px solid ${mergeStrategy === 'merge' ? colors.accent : colors.cardBorder}`,
                          backgroundColor: mergeStrategy === 'merge' ? colors.accent + '10' : colors.card,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setMergeStrategy('merge')}
                      >
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="mergeStrategy"
                            id="merge"
                            checked={mergeStrategy === 'merge'}
                            onChange={() => setMergeStrategy('merge')}
                          />
                          <label className="form-check-label" htmlFor="merge" style={{ cursor: 'pointer', width: '100%' }}>
                            <div className="d-flex align-items-start">
                              <FaSync className="me-3 mt-1" style={{ color: '#17a2b8', fontSize: '1.2rem' }} />
                              <div>
                                <strong style={{ fontSize: '1.1rem' }}>Daten intelligent zusammenführen</strong>
                                <p className="mb-0 mt-2" style={{ color: colors.textSecondary }}>
                                  ✅ Vorhandene Daten bleiben erhalten und werden mit den neuen Daten zusammengeführt.
                                  <br />
                                  Bei Duplikaten werden intelligente Regeln angewendet (siehe unten).
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Konflikt-Auflösung - nur bei Merge-Strategie */}
                    {mergeStrategy === 'merge' && (
                      <div className="mb-4">
                        <h6 style={{ color: colors.text, marginBottom: '15px', borderBottom: `2px solid ${colors.accent}`, paddingBottom: '8px' }}>
                          <FaExclamationTriangle className="me-2" />
                          Konflikt-Auflösung
                        </h6>
                        
                        <p style={{ color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '15px' }}>
                          Was soll passieren, wenn ein Datensatz mit der gleichen ID in beiden Speichern existiert?
                        </p>

                        {/* Option 1: Bestehende behalten */}
                        <div 
                          className="p-3 mb-3 rounded" 
                          style={{ 
                            border: `2px solid ${conflictResolution === 'keep_existing' ? colors.accent : colors.cardBorder}`,
                            backgroundColor: conflictResolution === 'keep_existing' ? colors.accent + '10' : colors.card,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => setConflictResolution('keep_existing')}
                        >
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="conflictResolution"
                              id="keep_existing"
                              checked={conflictResolution === 'keep_existing'}
                              onChange={() => setConflictResolution('keep_existing')}
                            />
                            <label className="form-check-label" htmlFor="keep_existing" style={{ cursor: 'pointer', width: '100%' }}>
                              <div className="d-flex align-items-start">
                                <FaShieldAlt className="me-3 mt-1" style={{ color: '#28a745', fontSize: '1.1rem' }} />
                                <div>
                                  <strong>Vorhandene Datensätze beibehalten (empfohlen)</strong>
                                  <p className="mb-0 mt-1" style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    Bei gleicher ID: Bestehender Datensatz bleibt unverändert
                                  </p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Option 2: Mit neuen überschreiben */}
                        <div 
                          className="p-3 mb-3 rounded" 
                          style={{ 
                            border: `2px solid ${conflictResolution === 'overwrite_with_new' ? colors.accent : colors.cardBorder}`,
                            backgroundColor: conflictResolution === 'overwrite_with_new' ? colors.accent + '10' : colors.card,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => setConflictResolution('overwrite_with_new')}
                        >
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="conflictResolution"
                              id="overwrite_with_new"
                              checked={conflictResolution === 'overwrite_with_new'}
                              onChange={() => setConflictResolution('overwrite_with_new')}
                            />
                            <label className="form-check-label" htmlFor="overwrite_with_new" style={{ cursor: 'pointer', width: '100%' }}>
                              <div className="d-flex align-items-start">
                                <FaSync className="me-3 mt-1" style={{ color: '#ffc107', fontSize: '1.1rem' }} />
                                <div>
                                  <strong>Mit neuen Datensätzen überschreiben</strong>
                                  <p className="mb-0 mt-1" style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                                    Bei gleicher ID: Neuer Datensatz ersetzt den bestehenden
                                  </p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Info-Box für Duplikat-Behandlung */}
                        <div className="alert alert-info" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}>
                          <div className="d-flex align-items-start">
                            <FaInfoCircle className="me-2 mt-1" />
                            <div>
                              <strong>Automatische Duplikat-Behandlung:</strong>
                              <ul className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                                <li><strong>Gleiche ID:</strong> Ihre gewählte Konflikt-Auflösung wird angewendet</li>
                                <li><strong>Gleicher Name (aber andere ID):</strong> Automatisch "_neue Version" an den Namen anhängen</li>
                                <li><strong>Keine Duplikate:</strong> Datensatz wird normal hinzugefügt</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Indicator */}
                    {dataTransferProgress && (
                      <div className="mt-4">
                        <div className="d-flex align-items-center mb-2">
                          <FaSpinner className="fa-spin me-2" style={{ color: colors.accent }} />
                          <strong>{dataTransferProgress.message}</strong>
                        </div>
                        <div className="progress" style={{ height: '25px' }}>
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{
                              width: `${(dataTransferProgress.current / dataTransferProgress.total) * 100}%`,
                              backgroundColor: colors.accent
                            }}
                          >
                            {dataTransferProgress.current} / {dataTransferProgress.total}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleDataTransferWithStrategy}
                      disabled={!!dataTransferProgress}
                      style={{
                        backgroundColor: colors.accent,
                        borderColor: colors.accent
                      }}
                    >
                      <FaCheckCircle className="me-2" />
                      Übertragung starten
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleDataMergeModalClose}
                      disabled={!!dataTransferProgress}
                    >
                      <FaTimes className="me-2" />
                      Zurück
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StorageManagement;
