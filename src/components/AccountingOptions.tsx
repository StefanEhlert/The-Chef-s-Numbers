import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaBalanceScale, FaTrash, FaExclamationTriangle, FaTimes, FaKey, FaBrain, FaEye, FaEyeSlash } from 'react-icons/fa';
import { designTemplates } from '../constants/designTemplates';
import { systemAccountingCharts, AccountingChartId, getAccountsByChartId } from '../constants/accountingTemplates';
import { logger } from '../utils/logger';
import { storageLayer } from '../services/storageLayer';
import { AccountingAccount, AccountingChart, AccountingSettings, OCRApiConfig, OCRApiProvider } from '../types';
import { generateId } from '../utils/storageUtils';

type ThemeColors = typeof designTemplates['warm']['colors'];

interface AccountingOptionsProps {
  colors: ThemeColors;
}

interface AccountFormState {
  id: string | null;
  number: string;
  name: string;
  category: string;
  vatTag: string;
  notes: string;
  origin: 'system' | 'user';
}

interface ConfirmationDialogProps {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  colors: ThemeColors;
}

// Bestätigungsdialog für Löschvorgänge
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  show,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  colors
}) => {
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
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          backgroundColor: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          maxWidth: '500px',
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="card-header d-flex justify-content-between align-items-center"
          style={{
            backgroundColor: colors.secondary,
            borderBottom: `1px solid ${colors.cardBorder}`
          }}
        >
          <h5 className="mb-0 form-label-themed d-flex align-items-center" style={{ flex: 1 }}>
            <FaExclamationTriangle
              className="me-2"
              style={{ color: colors.accent, fontSize: '1.2rem', flexShrink: 0 }}
            />
            <span>{title}</span>
          </h5>
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={onCancel}
            style={{ color: colors.text, textDecoration: 'none', flexShrink: 0, marginLeft: 'auto' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div
          className="card-body"
          style={{
            color: colors.text,
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 120px)',
            padding: '1.5rem'
          }}
        >
          <div style={{ whiteSpace: 'pre-line', color: colors.textSecondary }}>{message}</div>
        </div>

        {/* Footer */}
        <div
          className="card-footer d-flex justify-content-end gap-2"
          style={{
            borderTop: `1px solid ${colors.cardBorder}`,
            backgroundColor: colors.card
          }}
        >
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="btn btn-outline-primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountingOptions: React.FC<AccountingOptionsProps> = ({ colors }) => {
  const [charts, setCharts] = useState<AccountingChart[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<AccountingChartId>('skr03');
  const [allAccounts, setAllAccounts] = useState<AccountingAccount[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AccountFormState>({
    id: null,
    number: '',
    name: '',
    category: '',
    vatTag: '',
    notes: '',
    origin: 'user'
  });
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const allAccountsRef = useRef<AccountingAccount[]>([]);
  const kontodetailsRef = useRef<HTMLDivElement>(null);
  const kontenuebersichtRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const isCreatingNewRef = useRef<boolean>(false); // Flag, um zu verhindern, dass beim "Neu anlegen" automatisch ein Konto geladen wird
  
  // Refs für OCR API-Keys Gruppe
  const ocrDetailsRef = useRef<HTMLDivElement>(null);
  const ocrListRef = useRef<HTMLDivElement>(null);
  const [ocrMaxHeight, setOcrMaxHeight] = useState<number | undefined>(undefined);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // OCR API-Konfiguration State
  const [ocrApiConfigs, setOcrApiConfigs] = useState<OCRApiConfig[]>([]);
  const [selectedOcrProvider, setSelectedOcrProvider] = useState<OCRApiProvider | ''>('');
  const [ocrApiFormState, setOcrApiFormState] = useState<{
    apiEndpoint: string;
    apiKey: string;
  }>({
    apiEndpoint: '',
    apiKey: ''
  });
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const defaultCharts: AccountingChart[] = useMemo(() => {
    return systemAccountingCharts.map((definition) => ({
      id: `chart-${definition.id}`,
      chartId: definition.id,
      label: definition.label,
      description: definition.description,
      origin: definition.origin,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }, []);

  const filteredAccounts = useMemo(() => {
    return allAccounts.filter(
      (account) => account.chartId === selectedChartId && account.status === 'active'
    );
  }, [allAccounts, selectedChartId]);

  const groupedAccounts = useMemo(() => {
    return filteredAccounts.reduce<Record<string, AccountingAccount[]>>((groups, account) => {
      const category = account.category || 'Weitere';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(account);
      return groups;
    }, {});
  }, [filteredAccounts]);

  const resetForm = useCallback(
    (overrides: Partial<AccountFormState> = {}) => {
      setFormState({
        id: null,
        number: '',
        name: '',
        category: '',
        vatTag: '',
        notes: '',
        origin: 'user',
        ...overrides
      });
    },
    []
  );

  const seedFromTemplate = useCallback(
    async (chartId: AccountingChartId) => {
      try {
        setIsLoading(true);
        
        // Prüfe, ob Konten für diesen SKR bereits vorhanden sind
        const existingAccountsForChart = allAccountsRef.current.filter(
          (account) => account.chartId === chartId && account.origin === 'system'
        );
        
        if (existingAccountsForChart.length > 0) {
          const chartLabel =
            charts.find((chart) => chart.chartId === chartId)?.label ||
            chartId.toUpperCase();
          setStatusMessage(`Kontenrahmen ${chartLabel} wurde bereits übertragen (${existingAccountsForChart.length} Konten vorhanden).`);
          logger.info('AccountingOptions', 'Konten bereits vorhanden', {
            chartId,
            count: existingAccountsForChart.length
          });
          return;
        }

        // Lade Konten aus Konstanten
        const templateAccounts = getAccountsByChartId(chartId);

        if (!templateAccounts.length) {
          setStatusMessage('Für diesen Kontenrahmen konnten keine Vorlagen gefunden werden.');
          return;
        }

        const chartLabel =
          charts.find((chart) => chart.chartId === chartId)?.label ||
          chartId.toUpperCase();

        // Füge neue Konten zu bestehenden hinzu (behalte benutzerdefinierte Konten)
        const mergedAccounts: AccountingAccount[] = [
          ...allAccountsRef.current,
          ...templateAccounts
        ];

        const success = await storageLayer.save('accountingAccounts', mergedAccounts);
        if (success) {
          setAllAccounts(mergedAccounts);
          setStatusMessage(`Kontenrahmen ${chartLabel} wurde übertragen (${templateAccounts.length} Konten).`);
          logger.info('AccountingOptions', 'Vorlage geladen', {
            chartId,
            count: templateAccounts.length
          });
        } else {
          setStatusMessage('Beim Speichern der Vorlagenkonten ist ein Fehler aufgetreten.');
        }
      } catch (error) {
        logger.error('AccountingOptions', 'Vorlageladen fehlgeschlagen', error as Error);
        setStatusMessage('Vorlage konnte nicht geladen werden. Bitte erneut versuchen.');
      } finally {
        setIsLoading(false);
      }
    },
    [charts]
  );

  // Hilfsfunktionen für selectedChart-Speicherung in accountingSettings
  const loadSelectedChart = async (): Promise<AccountingChartId> => {
    try {
      // Lade aus accountingSettings
      const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
      if (settings && settings.length > 0 && settings[0].selectedChartId) {
        return settings[0].selectedChartId;
      }
      
      // Migration: Prüfe alte localOptions (kann später entfernt werden)
      try {
        const localOptionsStr = localStorage.getItem('localOptions');
        if (localOptionsStr) {
          const localOptions = JSON.parse(localOptionsStr);
          if (localOptions?.accountingCharts?.selectedChart) {
            const selectedChart = localOptions.accountingCharts.selectedChart;
            // Migriere zu accountingSettings
            await saveSelectedChart(selectedChart);
            return selectedChart;
          }
        }
      } catch (e) {
        // Ignoriere Fehler bei Migration
      }
    } catch (error) {
      console.error('Fehler beim Laden des ausgewählten Kontenrahmens:', error);
    }
    return defaultCharts[0]?.chartId || 'skr03';
  };

  const saveSelectedChart = async (chartId: AccountingChartId) => {
    try {
      const existingSettings = await storageLayer.load<AccountingSettings>('accountingSettings');
      let settings: AccountingSettings;
      
      if (existingSettings && existingSettings.length > 0) {
        settings = {
          ...existingSettings[0],
          selectedChartId: chartId,
          updatedAt: new Date()
        };
      } else {
        settings = {
          id: generateId(),
          selectedChartId: chartId,
          updatedAt: new Date()
        };
      }
      
      await storageLayer.save('accountingSettings', [settings]);
    } catch (error) {
      console.error('Fehler beim Speichern des ausgewählten Kontenrahmens:', error);
    }
  };

  const loadCharts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Charts kommen aus Konstanten, müssen nicht aus der DB geladen werden
      setCharts(defaultCharts);
      logger.info('AccountingOptions', 'Systemkontenrahmen geladen', { count: defaultCharts.length });

      // Lade ausgewählten Chart aus accountingSettings
      const selectedChart = await loadSelectedChart();
      setSelectedChartId(selectedChart);
    } catch (error) {
      logger.error('AccountingOptions', 'Charts laden fehlgeschlagen', error as Error);
      setStatusMessage('Kontenrahmen konnten nicht geladen werden.');
      setCharts(defaultCharts);
      setSelectedChartId(defaultCharts[0]?.chartId || 'skr03');
    } finally {
      setIsLoading(false);
    }
  }, [defaultCharts]);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedAccounts = await storageLayer.load<AccountingAccount>('accountingAccounts');
      if (storedAccounts) {
        setAllAccounts(storedAccounts);
      } else {
        setAllAccounts([]);
      }
    } catch (error) {
      logger.error('AccountingOptions', 'Konten laden fehlgeschlagen', error as Error);
      setStatusMessage('Konten konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistSelectedChart = useCallback(
    async (chartId: AccountingChartId) => {
      await saveSelectedChart(chartId);
    },
    []
  );

  useEffect(() => {
    logger.info('AccountingOptions', 'Seite initialisiert', {});
    loadCharts();
  }, [loadCharts]);

  useEffect(() => {
    allAccountsRef.current = allAccounts;
  }, [allAccounts]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedChartId) {
      persistSelectedChart(selectedChartId);
    }
  }, [selectedChartId, persistSelectedChart]);

  useEffect(() => {
    // Lade automatisch das erste Konto nur, wenn:
    // 1. Konten vorhanden sind
    // 2. Kein Konto ausgewählt ist
    // 3. Der Benutzer nicht explizit "Neu anlegen" gedrückt hat
    if (filteredAccounts.length > 0 && !selectedAccountId && !isCreatingNewRef.current) {
      const [firstAccount] = filteredAccounts;
      if (firstAccount) {
        setSelectedAccountId(firstAccount.id);
        resetForm({
          id: firstAccount.id,
          number: firstAccount.number,
          name: firstAccount.name,
          category: firstAccount.category,
          vatTag: firstAccount.vatTag || '',
          notes: firstAccount.notes || '',
          origin: firstAccount.origin
        });
      }
    }
    // Reset des Flags nach dem Rendern
    if (isCreatingNewRef.current) {
      isCreatingNewRef.current = false;
    }
  }, [filteredAccounts, selectedAccountId, resetForm]);

  // Messe die Höhe der Kontodetails und setze max-height für Kontenübersicht
  useEffect(() => {
    const updateMaxHeight = () => {
      if (kontodetailsRef.current) {
        // Messe die Höhe des Kontodetails-Containers (inkl. Padding)
        const kontodetailsHeight = kontodetailsRef.current.offsetHeight;
        setMaxHeight(kontodetailsHeight);
      }
    };

    // Initiale Messung nach kurzer Verzögerung (damit DOM gerendert ist)
    const initialTimeout = setTimeout(updateMaxHeight, 100);

    // Erneute Messung nach weiteren Verzögerungen (für dynamische Inhalte)
    const timeoutId = setTimeout(updateMaxHeight, 300);

    // Resize Observer für dynamische Änderungen
    const resizeObserver = new ResizeObserver(() => {
      updateMaxHeight();
    });

    if (kontodetailsRef.current) {
      resizeObserver.observe(kontodetailsRef.current);
    }

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [formState, filteredAccounts, selectedAccountId]);

  const handleToggleCategory = useCallback(
    (category: string) => {
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: !prev[category]
      }));
    },
    []
  );

  const handleSelectAccount = useCallback(
    (account: AccountingAccount) => {
      setSelectedAccountId(account.id);
      resetForm({
        id: account.id,
        number: account.number,
        name: account.name,
        category: account.category,
        vatTag: account.vatTag || '',
        notes: account.notes || '',
        origin: account.origin
      });
    },
    [resetForm]
  );

  const handleChartChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const chartId = event.target.value as AccountingChartId;
    isCreatingNewRef.current = false; // Flag zurücksetzen, damit das erste Konto automatisch geladen wird
    setSelectedChartId(chartId);
    setSelectedAccountId(null);
    resetForm();
    
    // Prüfe automatisch, ob Konten für diesen SKR bereits vorhanden sind
    const existingAccountsForChart = allAccountsRef.current.filter(
      (account) => account.chartId === chartId && account.origin === 'system'
    );
    
    // Wenn keine Konten vorhanden sind, übertrage sie automatisch
    if (existingAccountsForChart.length === 0) {
      await seedFromTemplate(chartId);
    }
  }, [resetForm, seedFromTemplate]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleNewAccount = useCallback(() => {
    isCreatingNewRef.current = true; // Flag setzen, damit kein automatisches Laden stattfindet
    setSelectedAccountId(null);
    setStatusMessage(''); // Statusmeldung zurücksetzen
    resetForm(); // Alle Felder werden geleert
  }, [resetForm]);

  const handleSaveAccount = useCallback(async () => {
    if (!formState.number || !formState.name) {
      setStatusMessage('Bitte Kontonummer und Bezeichnung angeben.');
      return;
    }

    // Prüfe auf doppelte Kontonummer im selben SKR
    const duplicateAccount = allAccounts.find(
      (acc) =>
        acc.number === formState.number &&
        acc.chartId === selectedChartId &&
        acc.id !== formState.id // Ignoriere das aktuelle Konto beim Bearbeiten
    );

    if (duplicateAccount) {
      setStatusMessage(`Ein Konto mit der Nummer "${formState.number}" existiert bereits in diesem Kontenrahmen.`);
      return;
    }

    const accountId = formState.id ?? generateId();
    const account: AccountingAccount = {
      id: accountId,
      chartId: selectedChartId,
      templateId: formState.origin === 'system' ? formState.id ?? undefined : undefined,
      number: formState.number,
      name: formState.name,
      category: formState.category || 'Weitere',
      vatTag: formState.vatTag || undefined,
      origin: formState.origin,
      status: 'active',
      notes: formState.notes || undefined,
      createdAt: formState.id ? undefined : new Date(),
      updatedAt: new Date()
    };

    try {
      const success = await storageLayer.save('accountingAccounts', [account]);
      if (success) {
        setAllAccounts((prev) => {
          const existingIndex = prev.findIndex((item) => item.id === account.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = account;
            return updated;
          }
          return [...prev, account];
        });
        setSelectedAccountId(account.id);
        resetForm({
          id: account.id,
          number: account.number,
          name: account.name,
          category: account.category,
          vatTag: account.vatTag || '',
          notes: account.notes || '',
          origin: account.origin
        });
        setStatusMessage('Konto wurde gespeichert.');
      } else {
        setStatusMessage('Konto konnte nicht gespeichert werden.');
      }
    } catch (error) {
      logger.error('AccountingOptions', 'Konto speichern fehlgeschlagen', error as Error);
      setStatusMessage('Beim Speichern des Kontos ist ein Fehler aufgetreten.');
    }
  }, [formState, resetForm, selectedChartId, allAccounts]);

  const handleDeleteAccount = useCallback(() => {
    if (!formState.id) {
      setStatusMessage('Kein Konto zum Löschen ausgewählt.');
      return;
    }
    setShowDeleteConfirm(true);
  }, [formState.id]);

  const confirmDeleteAccount = useCallback(async () => {
    if (!formState.id) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      // Markiere das Konto als gelöscht (soft delete)
      const accountToDelete = allAccounts.find((acc) => acc.id === formState.id);
      if (!accountToDelete) {
        setStatusMessage('Konto nicht gefunden.');
        setShowDeleteConfirm(false);
        return;
      }

      const deletedAccount: AccountingAccount = {
        ...accountToDelete,
        status: 'archived',
        updatedAt: new Date()
      };

      const success = await storageLayer.save('accountingAccounts', [deletedAccount]);
      if (success) {
        setAllAccounts((prev) => prev.filter((acc) => acc.id !== formState.id));
        setSelectedAccountId(null);
        setStatusMessage('Konto wurde gelöscht.');
        resetForm();
        isCreatingNewRef.current = true; // Verhindere automatisches Laden
      } else {
        setStatusMessage('Konto konnte nicht gelöscht werden.');
      }
    } catch (error) {
      logger.error('AccountingOptions', 'Konto löschen fehlgeschlagen', error as Error);
      setStatusMessage('Beim Löschen des Kontos ist ein Fehler aufgetreten.');
    } finally {
      setShowDeleteConfirm(false);
    }
  }, [formState.id, allAccounts, resetForm]);

  // OCR API-Konfiguration Funktionen
  // Hilfsfunktion zum Speichern von OCR-Konfigurationen in accountingSettings
  const saveOcrApiConfigsToSettings = useCallback(async (configs: OCRApiConfig[]) => {
    try {
      const existingSettings = await storageLayer.load<AccountingSettings>('accountingSettings');
      let settings: AccountingSettings;
      
      if (existingSettings && existingSettings.length > 0) {
        settings = {
          ...existingSettings[0],
          ocrApiConfigs: configs,
          updatedAt: new Date()
        };
      } else {
        settings = {
          id: generateId(),
          ocrApiConfigs: configs,
          updatedAt: new Date()
        };
      }
      
      await storageLayer.save('accountingSettings', [settings]);
    } catch (error) {
      logger.error('AccountingOptions', 'OCR-Konfigurationen in Settings speichern fehlgeschlagen', error as Error);
      throw error;
    }
  }, []);

  const loadOcrApiConfigs = useCallback(async () => {
    try {
      // Lade aus accountingSettings
      const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
      if (settings && settings.length > 0) {
        const firstSettings = settings[0];
        if (firstSettings.ocrApiConfigs && firstSettings.ocrApiConfigs.length > 0) {
          setOcrApiConfigs(firstSettings.ocrApiConfigs);
          return;
        }
      }
      
      // Migration: Prüfe alte ocrApiConfigs (kann später entfernt werden)
      try {
        const oldConfigs = await storageLayer.load<OCRApiConfig>('ocrApiConfigs');
        if (oldConfigs && oldConfigs.length > 0) {
          // Migriere zu accountingSettings
          await saveOcrApiConfigsToSettings(oldConfigs);
          setOcrApiConfigs(oldConfigs);
          return;
        }
      } catch (e) {
        // Ignoriere Fehler bei Migration
      }
      
      setOcrApiConfigs([]);
    } catch (error) {
      logger.error('AccountingOptions', 'OCR API-Konfigurationen laden fehlgeschlagen', error as Error);
      setOcrStatusMessage('API-Konfigurationen konnten nicht geladen werden.');
    }
  }, [saveOcrApiConfigsToSettings]);

  const handleOcrProviderSelect = useCallback((provider: OCRApiProvider) => {
    setSelectedOcrProvider(provider);
    
    // Lade vorhandene Konfiguration für diesen Provider
    const existingConfig = ocrApiConfigs.find((config) => config.provider === provider);
    if (existingConfig) {
      setOcrApiFormState({
        apiEndpoint: existingConfig.apiEndpoint || '',
        apiKey: existingConfig.apiKey || ''
      });
    } else {
      // Setze Standardwerte basierend auf Provider
      if (provider === 'azure') {
        setOcrApiFormState({
          apiEndpoint: 'https://the-chef-numbers.cognitiveservices.azure.com/',
          apiKey: ''
        });
      } else if (provider === 'taggun') {
        setOcrApiFormState({
          apiEndpoint: 'https://api.taggun.io/api/receipt/v1/verbose/file',
          apiKey: ''
        });
      } else if (provider === 'gemini') {
        setOcrApiFormState({
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
          apiKey: ''
        });
      } else {
        setOcrApiFormState({
          apiEndpoint: '',
          apiKey: ''
        });
      }
    }
    setOcrStatusMessage('');
  }, [ocrApiConfigs]);

  const saveOcrApiConfig = useCallback(async (formState: { apiEndpoint: string; apiKey: string }) => {
    if (!selectedOcrProvider) {
      return;
    }

    if (!formState.apiEndpoint.trim() || !formState.apiKey.trim()) {
      return; // Speichere nicht, wenn Felder leer sind
    }

    try {
      const existingConfig = ocrApiConfigs.find((config) => config.provider === selectedOcrProvider);
      const configId = existingConfig?.id || generateId();
      
      const config: OCRApiConfig = {
        id: configId,
        provider: selectedOcrProvider,
        apiEndpoint: formState.apiEndpoint.trim(),
        apiKey: formState.apiKey.trim(),
        isActive: existingConfig?.isActive ?? true,
        createdAt: existingConfig?.createdAt || new Date(),
        updatedAt: new Date()
      };

      const updatedConfigs = existingConfig
        ? ocrApiConfigs.map((c) => (c.id === configId ? config : c))
        : [...ocrApiConfigs, config];

      // Speichere in accountingSettings statt ocrApiConfigs
      await saveOcrApiConfigsToSettings(updatedConfigs);
      setOcrApiConfigs(updatedConfigs);
      setOcrStatusMessage('API-Konfiguration wurde gespeichert.');
      logger.info('AccountingOptions', 'OCR API-Konfiguration gespeichert', { provider: selectedOcrProvider });
      
      // Entferne die Erfolgsmeldung nach 3 Sekunden
      setTimeout(() => {
        setOcrStatusMessage('');
      }, 3000);
    } catch (error) {
      logger.error('AccountingOptions', 'OCR API-Konfiguration speichern fehlgeschlagen', error as Error);
      setOcrStatusMessage('Beim Speichern der API-Konfiguration ist ein Fehler aufgetreten.');
    }
  }, [selectedOcrProvider, ocrApiConfigs]);

  const handleOcrApiFormChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const newFormState = {
      ...ocrApiFormState,
      [name]: value
    };
    
    setOcrApiFormState(newFormState);
    
    // Lösche vorheriges Timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Setze neues Timeout für automatisches Speichern (nach 500ms Pause)
    saveTimeoutRef.current = setTimeout(() => {
      saveOcrApiConfig(newFormState);
    }, 500);
  }, [ocrApiFormState, saveOcrApiConfig]);

  useEffect(() => {
    loadOcrApiConfigs();
  }, [loadOcrApiConfigs]);

  // Cleanup für Save-Timeout beim Unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Messe die Höhe der OCR-Details und setze max-height für OCR-Liste
  useEffect(() => {
    const updateOcrMaxHeight = () => {
      if (ocrDetailsRef.current) {
        const ocrDetailsHeight = ocrDetailsRef.current.offsetHeight;
        setOcrMaxHeight(ocrDetailsHeight);
      }
    };

    const initialTimeout = setTimeout(updateOcrMaxHeight, 100);
    const timeoutId = setTimeout(updateOcrMaxHeight, 300);

    const resizeObserver = new ResizeObserver(() => {
      updateOcrMaxHeight();
    });

    if (ocrDetailsRef.current) {
      resizeObserver.observe(ocrDetailsRef.current);
    }

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [ocrApiFormState, selectedOcrProvider, ocrStatusMessage]);

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: colors.background, minHeight: 'calc(100vh - 120px)' }}>
      <div
        style={{
          backgroundColor: colors.paper || colors.card,
          borderRadius: '12px',
          boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
          padding: '2rem',
          border: `1px solid ${colors.cardBorder}`,
          color: colors.text
        }}
      >
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: colors.text, marginBottom: '0.5rem' }}>Optionen für Buchhaltung und Steuern</h1>
          
        </header>

        {/* SKR-Gruppe mit 2-spaltigem Layout */}
        <div className="card mb-4" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div className="card-header d-flex align-items-center" style={{ backgroundColor: colors.secondary }}>
            <FaBalanceScale className="me-2" style={{ color: colors.text }} />
            <h5 className="mb-0" style={{ color: colors.text }}>
              Kontenrahmen (SKR) festlegen und Konten bearbeiten
            </h5>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            {/* SKR-Auswahl */}
            <div className="mb-4">
              <label className="form-label" style={{ color: colors.text, fontWeight: 600 }}>
                Kontenrahmen auswählen
              </label>
              <select
                className="form-select"
                value={selectedChartId}
                onChange={handleChartChange}
                style={{ width: '50%' }}
              >
                {charts
                  .filter((chart) => chart.isActive)
                  .map((chart) => {
                    // Beschreibung für die Dropdown-Auswahl
                    let description = '';
                    if (chart.chartId === 'skr03') {
                      description = 'für Unternehmen mit Einnahmen-Überschuss-Rechnung';
                    } else if (chart.chartId === 'skr04') {
                      description = 'für Bilanzen und Gewinn- und Verlust-Rechnungen';
                    } else if (chart.description) {
                      description = chart.description;
                    }
                    
                    return (
                      <option key={chart.chartId} value={chart.chartId}>
                        {chart.label} - {description}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* 2-spaltiges Layout: Liste links, Felder rechts */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch">
              {/* Linke Spalte: Kontenübersicht */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <h6 style={{ fontSize: '1rem', color: colors.text, fontWeight: 600 }}>
                  Kontenübersicht
                </h6>
                <div
                  ref={kontenuebersichtRef}
                  style={{
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '8px',
                    backgroundColor: colors.paper || colors.card,
                    padding: '1rem',
                    paddingRight: '0.5rem',
                    overflow: 'hidden',
                    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
                    position: 'relative'
                  }}
                >
                  <div
                    className="accounting-scroll-container"
                    style={{
                      height: '100%',
                      overflowY: 'auto',
                      paddingRight: '0.5rem',
                      marginRight: '-0.5rem',
                      // Firefox Scrollbar
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${colors.cardBorder} ${colors.paper || colors.card}`
                    }}
                  >
                    {Object.entries(groupedAccounts).length === 0 && (
                      <p style={{ color: colors.textSecondary || colors.text }}>Keine Konten vorhanden.</p>
                    )}
                    {Object.entries(groupedAccounts).map(([category, accounts]) => {
                      const isExpanded = expandedCategories[category] ?? true;
                      return (
                        <div key={category} style={{ marginBottom: '0.75rem' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: colors.text,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onClick={() => handleToggleCategory(category)}
                          >
                            <span>{isExpanded ? '▼' : '►'}</span>
                            <span>{category}</span>
                          </button>
                          {isExpanded && (
                            <ul style={{ listStyle: 'none', margin: 0, paddingLeft: '1.5rem' }}>
                              {accounts
                                .sort((a, b) => a.number.localeCompare(b.number))
                                .map((account) => (
                                  <li key={account.id} style={{ marginBottom: '0.25rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectAccount(account)}
                                      className="btn btn-link"
                                      style={{
                                        textDecoration: selectedAccountId === account.id ? 'underline' : 'none',
                                        color: selectedAccountId === account.id ? colors.accent : colors.text,
                                        padding: 0
                                      }}
                                    >
                                      {account.number} – {account.name}
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rechte Spalte: Kontodetails */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <h6 style={{ fontSize: '1rem', color: colors.text, fontWeight: 600 }}>
                  Kontodetails
                </h6>
                <div
                  ref={kontodetailsRef}
                  style={{
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '8px',
                    backgroundColor: colors.paper || colors.card,
                    padding: '1.5rem'
                  }}
                >
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label" style={{ color: colors.text }}>Kontonummer</label>
                      <input
                        className="form-control"
                        name="number"
                        value={formState.number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label" style={{ color: colors.text }}>Bezeichnung</label>
                      <input
                        className="form-control"
                        name="name"
                        value={formState.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: colors.text }}>Kategorie</label>
                      <input
                        className="form-control"
                        name="category"
                        value={formState.category}
                        onChange={handleInputChange}
                        placeholder="z.B. Erträge"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: colors.text }}>USt / VSt</label>
                      <select
                        className="form-select"
                        name="vatTag"
                        value={formState.vatTag}
                        onChange={handleInputChange}
                      >
                        <option value="">Ohne Zuordnung</option>
                        <option value="ust19">Umsatzsteuer 19%</option>
                        <option value="ust7">Umsatzsteuer 7%</option>
                        <option value="vst19">Vorsteuer 19%</option>
                        <option value="vst7">Vorsteuer 7%</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={{ color: colors.text }}>Notizen</label>
                      <textarea
                        className="form-control"
                        name="notes"
                        rows={3}
                        value={formState.notes}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Status-/Fehlermeldungen */}
                  {statusMessage && (
                    <div
                      className={`alert ${statusMessage.includes('Fehler') || statusMessage.includes('existiert bereits') ? 'alert-danger' : 'alert-success'} mt-3 mb-0`}
                      role="alert"
                      style={{
                        backgroundColor: statusMessage.includes('Fehler') || statusMessage.includes('existiert bereits')
                          ? 'rgba(220, 53, 69, 0.1)'
                          : 'rgba(25, 135, 84, 0.1)',
                        borderColor: statusMessage.includes('Fehler') || statusMessage.includes('existiert bereits')
                          ? 'rgba(220, 53, 69, 0.3)'
                          : 'rgba(25, 135, 84, 0.3)',
                        color: colors.text
                      }}
                    >
                      {statusMessage}
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-4 justify-content-end">
                    <button
                      className="btn btn-outline-primary"
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={!formState.id}
                      style={{
                        opacity: !formState.id ? 0.5 : 1,
                        cursor: !formState.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <FaTrash className="me-2" />
                      Löschen
                    </button>
                    <button className="btn btn-outline-primary" type="button" onClick={handleNewAccount}>
                      Neu anlegen
                    </button>
                    <button className="btn btn-outline-primary" type="button" onClick={handleSaveAccount}>
                      Übernehmen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OCR API-Keys Gruppe */}
        <div className="card mb-4" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div className="card-header d-flex align-items-center" style={{ backgroundColor: colors.secondary }}>
            <FaBrain className="me-2" style={{ color: colors.text }} />
            <h5 className="mb-0" style={{ color: colors.text }}>
              API-Keys für Beleg-OCR & KI-Provider
            </h5>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            {/* 2-spaltiges Layout: Liste links, Felder rechts */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch">
              {/* Linke Spalte: Provider-Liste */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <h6 style={{ fontSize: '1rem', color: colors.text, fontWeight: 600 }}>
                  KI-Provider
                </h6>
                <div
                  ref={ocrListRef}
                  style={{
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '8px',
                    backgroundColor: colors.paper || colors.card,
                    padding: '1rem',
                    paddingRight: '0.5rem',
                    overflow: 'hidden',
                    height: ocrMaxHeight ? `${ocrMaxHeight}px` : undefined,
                    minHeight: ocrMaxHeight ? `${ocrMaxHeight}px` : undefined,
                    position: 'relative',
                    flex: 1
                  }}
                >
                  <div
                    className="accounting-scroll-container"
                    style={{
                      height: '100%',
                      overflowY: 'auto',
                      paddingRight: '0.5rem',
                      marginRight: '-0.5rem',
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${colors.cardBorder} ${colors.paper || colors.card}`,
                      minHeight: 0
                    }}
                  >
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      <li style={{ marginBottom: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOcrProviderSelect('azure')}
                          className="btn btn-link"
                          style={{
                            textDecoration: selectedOcrProvider === 'azure' ? 'underline' : 'none',
                            color: selectedOcrProvider === 'azure' ? colors.accent : colors.text,
                            padding: 0,
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          Azure Form Recognizer - Gut für Rechnungen
                        </button>
                      </li>
                      <li style={{ marginBottom: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOcrProviderSelect('taggun')}
                          className="btn btn-link"
                          style={{
                            textDecoration: selectedOcrProvider === 'taggun' ? 'underline' : 'none',
                            color: selectedOcrProvider === 'taggun' ? colors.accent : colors.text,
                            padding: 0,
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          Taggun.io - Beste Ergebnisse für Belege
                        </button>
                      </li>
                      <li style={{ marginBottom: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOcrProviderSelect('gemini')}
                          className="btn btn-link"
                          style={{
                            textDecoration: selectedOcrProvider === 'gemini' ? 'underline' : 'none',
                            color: selectedOcrProvider === 'gemini' ? colors.accent : colors.text,
                            padding: 0,
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          Google Gemini - Automatische Lieferantendaten-Erfassung
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Rechte Spalte: Provider-Details */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <h6 style={{ fontSize: '1rem', color: colors.text, fontWeight: 600 }}>
                  API-Konfiguration
                </h6>
                <div
                  ref={ocrDetailsRef}
                  style={{
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '8px',
                    backgroundColor: colors.paper || colors.card,
                    padding: '1.5rem',
                    flex: 1
                  }}
                >
                  {selectedOcrProvider ? (
                    <>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label" style={{ color: colors.text }}>
                            API-Endpunkt
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="apiEndpoint"
                            value={ocrApiFormState.apiEndpoint}
                            onChange={handleOcrApiFormChange}
                            placeholder={
                              selectedOcrProvider === 'azure'
                                ? 'https://your-resource.cognitiveservices.azure.com/'
                                : selectedOcrProvider === 'taggun'
                                ? 'https://api.taggun.io/api/receipt/v1/verbose/file'
                                : selectedOcrProvider === 'gemini'
                                ? 'https://generativelanguage.googleapis.com/v1beta'
                                : ''
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label" style={{ color: colors.text }}>
                            API-Key
                          </label>
                          <div className="input-group">
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              className="form-control"
                              name="apiKey"
                              value={ocrApiFormState.apiKey}
                              onChange={handleOcrApiFormChange}
                              placeholder="Ihr API-Key"
                            />
                            <button
                              className="btn btn-outline-input"
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              title={showApiKey ? 'API-Key verbergen' : 'API-Key anzeigen'}
                              style={{
                                borderLeft: 'none',
                                borderColor: colors.cardBorder
                              }}
                            >
                              {showApiKey ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Status-/Fehlermeldungen */}
                      {ocrStatusMessage && (
                        <div
                          className={`alert ${ocrStatusMessage.includes('Fehler') || ocrStatusMessage.includes('konnte nicht') ? 'alert-danger' : 'alert-success'} mt-3 mb-0`}
                          role="alert"
                          style={{
                            backgroundColor: ocrStatusMessage.includes('Fehler') || ocrStatusMessage.includes('konnte nicht')
                              ? 'rgba(220, 53, 69, 0.1)'
                              : 'rgba(25, 135, 84, 0.1)',
                            borderColor: ocrStatusMessage.includes('Fehler') || ocrStatusMessage.includes('konnte nicht')
                              ? 'rgba(220, 53, 69, 0.3)'
                              : 'rgba(25, 135, 84, 0.3)',
                            color: colors.text
                          }}
                        >
                          {ocrStatusMessage}
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ color: colors.textSecondary || colors.text }}>
                      Bitte wählen Sie einen KI-Provider aus der Liste aus.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section style={{ marginTop: '2.5rem' }}>
          <h3 style={{ color: colors.text, marginBottom: '1rem' }}>Ausblick</h3>
          <div
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '8px',
              padding: '1.5rem',
              color: colors.text
            }}
          >
            <p style={{ marginBottom: '1rem' }}>
              Weitere Automatismen wie DATEV-Export, GoBD-Prüfroutinen oder ein Abgleich mit TSE-Daten
              werden hier integriert, sobald die Stammdaten vollständig gepflegt sind.
            </p>
            <p style={{ margin: 0, color: colors.textSecondary || colors.text }}>
              Hinweis: Alle Einstellungen werden später mit dem Storage-Layer synchronisiert, damit Ihre Steuerberatung
              jederzeit auf konsistente Daten zugreifen kann.
            </p>
          </div>
        </section>
      </div>

      {/* Bestätigungsdialog für Löschvorgänge */}
      <ConfirmationDialog
        show={showDeleteConfirm}
        title="Konto löschen"
        message={`Möchten Sie das Konto "${formState.number} – ${formState.name}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        cancelText="Abbrechen"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
        colors={colors}
      />
    </div>
  );
};

export default AccountingOptions;

