import React, { useState, useEffect, useRef } from 'react';
import { FaCog, FaCode, FaDatabase, FaSync, FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash, FaUpload, FaFileInvoice, FaSpinner, FaTimes, FaCheck, FaCopy } from 'react-icons/fa';
import { analyzeDocumentWithAzureFormRecognizer, validateDocumentFile } from '../services/azureFormRecognizerService';
import { analyzeDocumentWithTaggun } from '../services/taggunOCRService';
import { OCRResult, enrichReceiptData, ExtendedReceiptData } from '../services/ocrTypes';
import { useAppContext } from '../contexts/AppContext';
import { storageLayer } from '../services/storageLayer';
import { AccountingSettings } from '../types/accounting';
import type { AccountingChartId } from '../constants/accountingTemplates';
import ReceiptReviewModal from './ReceiptReviewModal';

const DevelopmentPage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    schemaComparison: true,
    azureOCR: true,
    phase1: false,
    phase2: false,
    phase3: false
  });
  const [currentSchema, setCurrentSchema] = useState<any>(null);
  const [previousSchema, setPreviousSchema] = useState<any>(null);
  const [schemaChanges, setSchemaChanges] = useState<any>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  
  // OCR States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(''); // Vollständiger Dateipfad
  const [ocrProvider, setOcrProvider] = useState<'azure' | 'taggun'>('azure'); // OCR-Provider-Auswahl
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showReceiptReview, setShowReceiptReview] = useState(false);
  const [enrichedReceiptData, setEnrichedReceiptData] = useState<ExtendedReceiptData | null>(null);
  const [savedResults, setSavedResults] = useState<Array<{ id: string; timestamp: string; fileName: string; result: OCRResult; enriched: ExtendedReceiptData }>>([]);
  const [showJSONModal, setShowJSONModal] = useState(false);
  const [selectedJSONData, setSelectedJSONData] = useState<{ result: OCRResult; enriched: ExtendedReceiptData } | null>(null);
  const [activeJSONTab, setActiveJSONTab] = useState<'result' | 'enriched' | 'raw'>('result');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptImageFile, setReceiptImageFile] = useState<File | null>(null); // Speichere Bild separat für Modal
  
  // App Context für Suppliers
  const { state } = useAppContext();
  
  // Key für localStorage
  const SAVED_RESULTS_KEY = 'azure_ocr_saved_results';

  const colors = {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    background: '#ffffff',
    card: '#ffffff',
    cardBorder: '#dee2e6',
    text: '#212529',
    textSecondary: '#6c757d'
  };

  // Lade Schema-Daten und gespeicherte OCR-Ergebnisse beim Start
  useEffect(() => {
    loadSchemas();
    loadSavedResults();
  }, []);

  // Debug: Logge Modal-Props beim Öffnen
  useEffect(() => {
    if (showReceiptReview && enrichedReceiptData) {
      console.log('🔍 [MODAL-DEBUG] Modal wird geöffnet:', {
        receiptImageFile: receiptImageFile ? { name: receiptImageFile.name, type: receiptImageFile.type, size: receiptImageFile.size } : null,
        receiptImagePath: selectedFilePath,
        enrichedArticles: enrichedReceiptData.articles?.length || 0,
        supplier: enrichedReceiptData.supplier
      });
    }
  }, [showReceiptReview, enrichedReceiptData, receiptImageFile, selectedFilePath]);
  
  // Lade gespeicherte OCR-Ergebnisse aus localStorage
  const loadSavedResults = () => {
    try {
      const saved = localStorage.getItem(SAVED_RESULTS_KEY);
      if (saved) {
        const results = JSON.parse(saved);
        setSavedResults(results);
        console.log('📂 Geladene gespeicherte OCR-Ergebnisse:', results.length);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden gespeicherter OCR-Ergebnisse:', error);
    }
  };
  
  // Speichere OCR-Ergebnis
  const saveOCRResult = (result: OCRResult, enriched: ExtendedReceiptData) => {
    try {
      const newEntry = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        fileName: selectedFile?.name || 'Unbekannt',
        result: result,
        enriched: enriched
      };
      
      const updated = [...savedResults, newEntry];
      // Behalte nur die letzten 20 Ergebnisse
      const limited = updated.slice(-20);
      setSavedResults(limited);
      localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(limited));
      console.log('💾 OCR-Ergebnis gespeichert:', newEntry.id);
    } catch (error) {
      console.error('❌ Fehler beim Speichern des OCR-Ergebnisses:', error);
    }
  };
  
  // Lösche gespeichertes Ergebnis
  const deleteSavedResult = (id: string) => {
    try {
      const updated = savedResults.filter(r => r.id !== id);
      setSavedResults(updated);
      localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(updated));
      console.log('🗑️ OCR-Ergebnis gelöscht:', id);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des OCR-Ergebnisses:', error);
    }
  };
  
  // Öffne gespeichertes Ergebnis
  const openSavedResult = (savedEntry: { id: string; timestamp: string; fileName: string; result: OCRResult; enriched: ExtendedReceiptData }) => {
    setOcrResult(savedEntry.result);
    setEnrichedReceiptData(savedEntry.enriched);
    setShowReceiptReview(true);
    console.log('📂 Gespeichertes OCR-Ergebnis geöffnet:', savedEntry.id);
  };

  const loadSchemas = async () => {
    setIsLoadingSchema(true);
    try {
      // Lade aktuelles Schema
      const currentSchemaModule = await import('../schemas/generated/autoGeneratedSchema');
      let currentDefs = currentSchemaModule.AUTO_GENERATED_SCHEMA_DEFINITIONS;
      
      // Lade zusätzlich die neuen Accounting-Tabellen, falls sie noch nicht im Schema sind
      try {
        const accountingTypes = await import('../types/accounting');
        const baseTypes = await import('../types');
        
        // Prüfe und füge fehlende Tabellen hinzu
        const expectedTables = [
          { name: 'AccountingAccount', tableName: 'accounting_accounts' },
          { name: 'AccountingSettings', tableName: 'accounting_settings' }
        ];
        
        expectedTables.forEach(({ name, tableName }) => {
          if (!currentDefs[name]) {
            // Erstelle eine Platzhalter-Definition für Tabellen, die noch nicht generiert wurden
            currentDefs = {
              ...currentDefs,
              [name]: {
                tableName: tableName,
                interfaceName: name,
                columns: [
                  {
                    name: 'id',
                    type: 'UUID',
                    nullable: false,
                    primary: false,
                    description: 'Frontend-ID',
                    tsType: 'string'
                  },
                  {
                    name: 'db_id',
                    type: 'UUID',
                    nullable: false,
                    primary: true,
                    defaultValue: 'gen_random_uuid()',
                    description: 'Datenbank-ID (Primary Key)',
                    tsType: 'string'
                  }
                ],
                baseInterfaces: ['BaseEntity']
              }
            };
            console.log(`⚠️ Tabelle ${name} noch nicht im generierten Schema, Platzhalter hinzugefügt`);
          }
        });
      } catch (error) {
        console.warn('⚠️ Fehler beim Laden der Accounting-Typen:', error);
      }
      
      setCurrentSchema(currentDefs);

      // Lade vorheriges Schema (wenn vorhanden)
      try {
        const previousDefs = await fetch('/schemas/generated/autoSchemaDefinitions.json')
          .then(res => res.json())
          .catch(() => null);
        setPreviousSchema(previousDefs);

        // Vergleiche Schemas
        if (previousDefs) {
          const changes = compareSchemas(previousDefs, currentDefs);
          setSchemaChanges(changes);
        }
      } catch (error) {
        console.log('Kein vorheriges Schema gefunden (erste Generierung)');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Schemas:', error);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const compareSchemas = (previous: any, current: any) => {
    const changes: any = {
      newTables: [],
      removedTables: [],
      changedTables: [],
      totalChanges: 0
    };

    // Neue Tabellen
    changes.newTables = Object.keys(current).filter(k => !previous[k]);
    
    // Entfernte Tabellen
    changes.removedTables = Object.keys(previous).filter(k => !current[k]);

    // Geänderte Tabellen
    for (const [tableName, currentDef] of Object.entries(current) as any) {
      if (previous[tableName]) {
        const prevDef = previous[tableName];
        const tableChanges: any = {
          name: tableName,
          newColumns: [],
          removedColumns: [],
          changedColumns: []
        };

        // Neue Spalten
        const newColumns = currentDef.columns.filter(
          (col: any) => !prevDef.columns.find((c: any) => c.name === col.name)
        );
        tableChanges.newColumns = newColumns;

        // Geänderte Spalten
        const changedColumns = currentDef.columns.filter((currentCol: any) => {
          const prevCol = prevDef.columns.find((c: any) => c.name === currentCol.name);
          if (!prevCol) return false;
          return (
            prevCol.type !== currentCol.type ||
            prevCol.nullable !== currentCol.nullable ||
            prevCol.defaultValue !== currentCol.defaultValue
          );
        });
        tableChanges.changedColumns = changedColumns;

        // Entfernte Spalten
        const removedColumns = prevDef.columns.filter(
          (prevCol: any) => !currentDef.columns.find((c: any) => c.name === prevCol.name)
        );
        tableChanges.removedColumns = removedColumns;

        if (newColumns.length > 0 || changedColumns.length > 0 || removedColumns.length > 0) {
          changes.changedTables.push(tableChanges);
        }
      }
    }

    changes.totalChanges = changes.newTables.length + 
                          changes.removedTables.length + 
                          changes.changedTables.length;

    return changes;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // OCR Handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validiere Datei
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setOcrError(validation.error || 'Ungültige Datei');
      setSelectedFile(null);
      setSelectedFilePath('');
      return;
    }

    setSelectedFile(file);
    // Speichere vollständigen Dateipfad (falls verfügbar)
    // In Browser-Umgebung haben wir nur den Dateinamen, nicht den vollständigen Pfad
    // Aber wir speichern den Dateinamen als Pfad-Ersatz
    setSelectedFilePath(file.name);
    setOcrError(null);
    setOcrResult(null);
    console.log('📄 Datei ausgewählt:', file.name, file.type, file.size);
    console.log('📄 Dateipfad:', file.name);
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) {
      setOcrError('Bitte wählen Sie zuerst eine Datei aus');
      return;
    }

    setIsProcessing(true);
    setOcrError(null);
    setOcrResult(null);
    setEnrichedReceiptData(null);

    try {
      let result: OCRResult;
      
      if (ocrProvider === 'taggun') {
        console.log('🚀 Starte Taggun Analyse...');
        result = await analyzeDocumentWithTaggun(selectedFile);
        console.log('✅ Taggun Analyse erfolgreich:', result);
      } else {
        console.log('🚀 Starte Azure Form Recognizer Analyse...');
        result = await analyzeDocumentWithAzureFormRecognizer(selectedFile);
        console.log('✅ Azure Form Recognizer Analyse erfolgreich:', result);
      }
      
      if (result.error) {
        setOcrError(result.error);
      } else {
        setOcrResult(result);
        
        // Speichere Bild separat für Modal
        if (selectedFile) {
          console.log('🖼️ Speichere Bild für Modal:', selectedFile.name, selectedFile.type, selectedFile.size);
          setReceiptImageFile(selectedFile);
        } else {
          console.warn('⚠️ Keine Datei zum Speichern vorhanden');
        }
        
        // Logge Dateipfad
        console.log('📄 Dateipfad gespeichert:', selectedFilePath);
        
        // Debug: Prüfe Artikel
        console.log('📋 OCR-Result Artikel:', result.articles?.length || 0, 'Artikel');
        if (result.articles && result.articles.length > 0) {
          console.log('📋 Erste 3 Artikel:', result.articles.slice(0, 3));
        } else {
          console.warn('⚠️ Keine Artikel im OCR-Result gefunden!');
        }
        
        // Lade selectedChartId aus accountingSettings
        let selectedChartId: AccountingChartId = 'skr03';
        try {
          const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
          if (settings && settings.length > 0 && settings[0].selectedChartId) {
            selectedChartId = settings[0].selectedChartId;
          }
        } catch (e) {
          // Fallback zu 'skr03' bei Fehler
        }
        
        // Reichere Daten mit allen Artikelformular-Feldern an
        const enriched = enrichReceiptData(
          result, 
          (state.suppliers || []).map(s => ({ id: s.id, name: s.name, recognizedNames: s.recognizedNames })),
          state.articles || [],
          ocrProvider,
          undefined, // accountingAccounts - wird optional verwendet
          selectedChartId
        );
        setEnrichedReceiptData(enriched);
        console.log('✅ Beleg-Daten angereichert:', enriched);
        console.log('📋 Enriched Artikel:', enriched.articles?.length || 0, 'Artikel');
        if (enriched.articles && enriched.articles.length > 0) {
          console.log('📋 Erste 3 enriched Artikel:', enriched.articles.slice(0, 3));
        } else {
          console.warn('⚠️ Keine Artikel nach Anreicherung!');
        }
        
        // Speichere Ergebnis automatisch
        saveOCRResult(result, enriched);
      }
    } catch (error: any) {
      console.error(`❌ ${ocrProvider === 'taggun' ? 'Taggun' : 'Azure Form Recognizer'} Fehler:`, error);
      setOcrError(error.message || 'Unbekannter Fehler bei der Analyse');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearResults = () => {
    setSelectedFile(null);
    setSelectedFilePath('');
    setReceiptImageFile(null);
    setOcrResult(null);
    setOcrError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <div className="card-header" style={{ backgroundColor: colors.primary, color: 'white' }}>
              <h2 className="mb-0">
                Entwicklungsseite - Schema-Migration System
              </h2>
            </div>
            <div className="card-body">
              <p className="mb-3" style={{ color: colors.textSecondary }}>
                Diese Seite dient zum Testen des neuen idempotenten Schema-Migrations-Systems.
              </p>

              {/* Hosting-Environment Test-Override */}
              <div className="alert alert-info mb-4" style={{ backgroundColor: '#17a2b820', borderColor: '#17a2b8' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="flex-grow-1">
                    <h6 className="mb-2 d-flex align-items-center">
                      <FaCog className="me-2" style={{ color: '#17a2b8' }} />
                      Hosting-Environment Simulator
                    </h6>
                    <p className="mb-2" style={{ fontSize: '0.9rem', color: colors.text }}>
                      Aktuell erkannt: <strong>{
                        (() => {
                          const hostname = window.location.hostname;
                          const isLocal = 
                            hostname === 'localhost' ||
                            hostname === '127.0.0.1' ||
                            hostname.startsWith('192.168.') ||
                            hostname.startsWith('10.') ||
                            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
                            hostname.endsWith('.local');
                          return isLocal ? 'Lokal gehostet' : 'Cloud gehostet';
                        })()
                      }</strong> (Hostname: {window.location.hostname})
                    </p>
                    <p className="mb-0" style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                      Simulieren Sie Cloud-Hosting, um die Selfhosting-Ansicht in der StorageManagement-Seite zu testen.
                    </p>
                  </div>
                  <div className="ms-3">
                    <div className="form-check form-switch" style={{ fontSize: '1.2rem' }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="hostingOverride"
                        checked={(() => {
                          const override = localStorage.getItem('hostingEnvironmentOverride');
                          return override === 'cloud';
                        })()}
                        onChange={(e) => {
                          if (e.target.checked) {
                            localStorage.setItem('hostingEnvironmentOverride', 'cloud');
                            console.log('🔧 Hosting-Environment Override: cloud');
                          } else {
                            localStorage.removeItem('hostingEnvironmentOverride');
                            console.log('🔧 Hosting-Environment Override entfernt');
                          }
                          // Seite neu laden, damit StorageManagement die Änderung mitbekommt
                          window.location.reload();
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label" htmlFor="hostingOverride" style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <strong>Cloud-Hosting simulieren</strong>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schema-Vergleich */}
      {!isLoadingSchema && currentSchema && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div 
                className="card-header d-flex justify-content-between align-items-center" 
                style={{ backgroundColor: colors.info, color: 'white', cursor: 'pointer' }}
                onClick={() => toggleSection('schemaComparison')}
              >
                <h5 className="mb-0 d-flex align-items-center">
                  <FaDatabase className="me-2" />
                  Schema-Vergleich & Migration Control Center
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-sm btn-outline-light"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSchemas();
                    }}
                    disabled={isLoadingSchema}
                  >
                    <FaSync className="me-1" />
                    Aktualisieren
                  </button>
                  {expandedSections.schemaComparison ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              {expandedSections.schemaComparison && (
                <div className="card-body">
                  {/* Übersicht */}
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <div className="text-center p-3" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
                        <div className="h4 mb-0" style={{ color: colors.primary }}>{Object.keys(currentSchema).length}</div>
                        <small style={{ color: colors.textSecondary }}>Aktuelle Tabellen</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
                        <div className="h4 mb-0" style={{ color: colors.success }}>
                          {Object.values(currentSchema).reduce((sum: number, def: any) => sum + def.columns.length, 0)}
                        </div>
                        <small style={{ color: colors.textSecondary }}>Gesamte Spalten</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
                        <div className="h4 mb-0" style={{ color: schemaChanges?.totalChanges ? colors.warning : colors.success }}>
                          {schemaChanges?.totalChanges || 0}
                        </div>
                        <small style={{ color: colors.textSecondary }}>Schema-Änderungen</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center p-3" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
                        <div className="h4 mb-0" style={{ color: schemaChanges?.totalChanges === 0 ? colors.success : colors.warning }}>
                          {schemaChanges?.totalChanges === 0 ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        </div>
                        <small style={{ color: colors.textSecondary }}>Status</small>
                      </div>
                    </div>
                  </div>

                  {/* Schema-Änderungen anzeigen */}
                  {schemaChanges && schemaChanges.totalChanges > 0 && (
                    <div className="alert alert-info mb-3">
                      <h6>🔄 Schema-Änderungen erkannt:</h6>
                      {schemaChanges.newTables.length > 0 && (
                        <div className="mb-2">
                          <strong className="text-success">📋 Neue Tabellen:</strong> {schemaChanges.newTables.join(', ')}
                        </div>
                      )}
                      {schemaChanges.removedTables.length > 0 && (
                        <div className="mb-2">
                          <strong className="text-danger">🗑️ Entfernte Tabellen:</strong> {schemaChanges.removedTables.join(', ')}
                        </div>
                      )}
                      {schemaChanges.changedTables.length > 0 && (
                        <div>
                          <strong className="text-warning">🔧 Geänderte Tabellen:</strong>
                          <ul className="mb-0 mt-2">
                            {schemaChanges.changedTables.map((table: any) => (
                              <li key={table.name}>
                                <strong>{table.name}</strong>:
                                {table.newColumns.length > 0 && (
                                  <span className="text-success ms-2">
                                    +{table.newColumns.length} neue Spalten: {table.newColumns.map((c: any) => c.name).join(', ')}
                                  </span>
                                )}
                                {table.changedColumns.length > 0 && (
                                  <span className="text-warning ms-2">
                                    {table.changedColumns.length} geänderte: {table.changedColumns.map((c: any) => c.name).join(', ')}
                                  </span>
                                )}
                                {table.removedColumns.length > 0 && (
                                  <span className="text-danger ms-2">
                                    -{table.removedColumns.length} entfernte: {table.removedColumns.map((c: any) => c.name).join(', ')}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {schemaChanges && schemaChanges.totalChanges === 0 && (
                    <div className="alert alert-success">
                      <FaCheckCircle className="me-2" />
                      <strong>Keine Schema-Änderungen!</strong> Das Schema ist aktuell und entspricht den TypeScript-Interfaces.
                    </div>
                  )}

                  {/* Aktuelle Tabellen-Übersicht */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Aktuelle Tabellen:</h6>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        const schemaJSON = JSON.stringify(currentSchema, null, 2);
                        navigator.clipboard.writeText(schemaJSON);
                        alert('Schema-Definitionen in Zwischenablage kopiert!');
                      }}
                    >
                      <FaCode className="me-1" />
                      Schema als JSON kopieren
                    </button>
                  </div>
                  
                  {/* Warnung für Tabellen, die noch nicht vollständig generiert wurden */}
                  {Object.entries(currentSchema).some(([_, def]: [string, any]) => def.columns.length <= 2) && (
                    <div className="alert alert-warning mb-3">
                      <FaExclamationTriangle className="me-2" />
                      <strong>Hinweis:</strong> Einige Tabellen (AccountingAccount, AccountingSettings) 
                      sind noch nicht vollständig im generierten Schema enthalten. 
                      Bitte führen Sie die Schema-Generierung aus, um vollständige Definitionen zu erhalten.
                    </div>
                  )}
                  
                  <div className="row">
                    {Object.entries(currentSchema).map(([interfaceName, definition]: [string, any]) => {
                      const isPlaceholder = definition.columns.length <= 2 && 
                        ['AccountingAccount', 'AccountingSettings'].includes(interfaceName);
                      
                      return (
                      <div key={interfaceName} className="col-md-6 mb-3">
                          <div className="card" style={{ 
                            backgroundColor: colors.light, 
                            border: `1px solid ${isPlaceholder ? colors.warning : colors.cardBorder}`,
                            opacity: isPlaceholder ? 0.8 : 1
                          }}>
                          <div className="card-body">
                            <h6 className="mb-2" style={{ color: colors.text }}>
                              <FaDatabase className="me-2" style={{ color: colors.primary }} />
                              {interfaceName} → {definition.tableName}
                                {isPlaceholder && (
                                  <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>
                                    Platzhalter
                                  </span>
                                )}
                            </h6>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="badge bg-primary">{definition.columns.length} Spalten</span>
                              <span className="badge bg-success">
                                {definition.columns.filter((col: any) => col.primary).length} PK
                              </span>
                            </div>
                            
                              {isPlaceholder ? (
                                <div className="alert alert-warning mb-0" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                                  <small>
                                    Diese Tabelle ist im TypeScript-Code definiert, aber noch nicht vollständig im generierten Schema enthalten. 
                                    Bitte führen Sie die Schema-Generierung aus.
                                  </small>
                                </div>
                              ) : (
                                /* Detaillierte Spaltenliste */
                            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              <table className="table table-sm table-striped table-bordered mb-0">
                                <thead className="table-primary">
                                  <tr>
                                    <th style={{ fontSize: '0.75rem', color: 'white' }}>Spalte</th>
                                    <th style={{ fontSize: '0.75rem', color: 'white' }}>Typ</th>
                                    <th style={{ fontSize: '0.75rem', color: 'white' }}>Nullable</th>
                                    <th style={{ fontSize: '0.75rem', color: 'white' }}>PK</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {definition.columns.map((col: any, idx: number) => (
                                    <tr key={idx}>
                                      <td style={{ fontSize: '0.75rem' }}>
                                        <code>{col.name}</code>
                                      </td>
                                      <td style={{ fontSize: '0.75rem' }}>
                                        <span className="badge bg-info" style={{ fontSize: '0.65rem' }}>{col.type}</span>
                                      </td>
                                      <td style={{ fontSize: '0.75rem' }}>
                                        {col.nullable ? (
                                          <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>NULL</span>
                                        ) : (
                                          <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>NOT NULL</span>
                                        )}
                                      </td>
                                      <td style={{ fontSize: '0.75rem' }}>
                                        {col.primary ? (
                                          <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>PK</span>
                                        ) : (
                                          <span>-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                              )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Azure Form Recognizer Test Bereich */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <div 
              className="card-header d-flex justify-content-between align-items-center" 
              style={{ backgroundColor: '#8B5CF6', color: 'white', cursor: 'pointer' }}
              onClick={() => toggleSection('azureOCR')}
            >
              <h5 className="mb-0 d-flex align-items-center">
                <FaFileInvoice className="me-2" />
                OCR-Dokumentenanalyse Test
              </h5>
              <div className="d-flex align-items-center gap-2">
                {expandedSections.azureOCR ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
            {expandedSections.azureOCR && (
              <div className="card-body">
                <p className="mb-3" style={{ color: colors.textSecondary }}>
                  Testen Sie verschiedene OCR-Provider zur automatischen Analyse von Belegen und Rechnungen.
                  <br />
                  <strong>Unterstützt:</strong> JPEG, PNG, BMP, TIFF, PDF (max. 10MB für Taggun, 50MB für Azure)
                  <br />
                  <small className="text-success">
                    ✅ PDF-Dateien werden direkt unterstützt!
                  </small>
                </p>

                {/* Gespeicherte Ergebnisse Liste */}
                {savedResults.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Gespeicherte Ergebnisse ({savedResults.length}):</label>
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: '4px',
                      padding: '0.5rem'
                    }}>
                      {savedResults.map((saved) => (
                        <div
                          key={saved.id}
                          className="d-flex justify-content-between align-items-center mb-2 p-2"
                          style={{
                            backgroundColor: colors.light,
                            borderRadius: '4px',
                            border: `1px solid ${colors.cardBorder}`
                          }}
                        >
                          <div className="flex-grow-1">
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: colors.text }}>
                              {saved.fileName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                              {new Date(saved.timestamp).toLocaleString('de-DE')}
                              {' • '}
                              {saved.result.articles?.length || 0} Artikel
                              {saved.result.supplier && ` • ${saved.result.supplier}`}
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openSavedResult(saved)}
                              title="Ergebnis öffnen"
                            >
                              <FaFileInvoice className="me-1" />
                              Öffnen
                            </button>
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => {
                                setSelectedJSONData({ result: saved.result, enriched: saved.enriched });
                                setActiveJSONTab('result');
                                setShowJSONModal(true);
                              }}
                              title="JSON anzeigen"
                            >
                              <FaCode className="me-1" />
                              JSON
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteSavedResult(saved.id)}
                              title="Ergebnis löschen"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OCR-Provider-Auswahl */}
                <div className="mb-3">
                  <label className="form-label fw-bold">OCR-Provider:</label>
                  <div className="d-flex gap-2">
                    <button
                      className={`btn ${ocrProvider === 'azure' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setOcrProvider('azure')}
                      disabled={isProcessing}
                    >
                      Azure Form Recognizer
                    </button>
                    <button
                      className={`btn ${ocrProvider === 'taggun' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setOcrProvider('taggun')}
                      disabled={isProcessing}
                    >
                      Taggun.io
                    </button>
                  </div>
                </div>

                {/* Datei-Auswahl */}
                <div className="mb-3">
                  <label className="form-label fw-bold">1. Dokument auswählen:</label>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      accept="image/jpeg,image/jpg,image/png,image/bmp,image/tiff,application/pdf"
                      onChange={handleFileSelect}
                      disabled={isProcessing}
                    />
                    {selectedFile && (
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-info">
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </span>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={handleClearResults}
                          disabled={isProcessing}
                        >
                          <FaTimes className="me-1" />
                          Zurücksetzen
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedFilePath && (
                    <small className="text-muted mt-1 d-block">
                      Dateipfad: {selectedFilePath}
                    </small>
                  )}
                </div>

                {/* Analyse-Button */}
                <div className="mb-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleAnalyzeDocument}
                    disabled={!selectedFile || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <FaSpinner className="me-2 fa-spin" />
                        Analysiere...
                      </>
                    ) : (
                      <>
                        <FaUpload className="me-2" />
                        Dokument analysieren
                      </>
                    )}
                  </button>
                </div>

                {/* Fehler-Anzeige */}
                {ocrError && (
                  <div className="alert alert-danger mb-3">
                    <strong>Fehler:</strong> {ocrError}
                  </div>
                )}

                {/* Ergebnis-Anzeige */}
                {ocrResult && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">2. Analyse-Ergebnis (JSON):</label>
                    <textarea
                      className="form-control"
                      rows={20}
                      readOnly
                      value={JSON.stringify(ocrResult, null, 2)}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        backgroundColor: colors.light
                      }}
                    />
                    <div className="mt-2 d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {ocrResult.articles?.length || 0} Artikel extrahiert
                        {ocrResult.supplier && ` • Lieferant: ${ocrResult.supplier}`}
                        {ocrResult.date && ` • Datum: ${ocrResult.date}`}
                      </small>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(ocrResult, null, 2));
                            alert('JSON in Zwischenablage kopiert!');
                          }}
                        >
                          <FaCode className="me-1" />
                          JSON kopieren
                        </button>
                        {enrichedReceiptData && enrichedReceiptData.articles.length > 0 && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => setShowReceiptReview(true)}
                          >
                            <FaCheck className="me-1" />
                            Beleg überprüfen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Response (falls vorhanden) */}
                {ocrResult?.rawResponse && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">3. Raw Response von Mistral:</label>
                    <textarea
                      className="form-control"
                      rows={10}
                      readOnly
                      value={ocrResult.rawResponse}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        backgroundColor: colors.light
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Review Modal */}
      {enrichedReceiptData && (
        <ReceiptReviewModal
          show={showReceiptReview}
          onClose={() => setShowReceiptReview(false)}
          receiptData={enrichedReceiptData}
          suppliers={state.suppliers || []}
          colors={colors}
          receiptImage={receiptImageFile || undefined}
          receiptImagePath={selectedFilePath}
          onSave={(articles) => {
            console.log('💾 Artikel aus Beleg gespeichert:', articles);
            // Hier könnten die Artikel in die Datenbank übernommen werden
            setShowReceiptReview(false);
          }}
          onUpdateReceiptData={(updatedData) => {
            // Aktualisiere enrichedReceiptData mit der neuen Position
            setEnrichedReceiptData(updatedData);
            // Aktualisiere auch in gespeicherten Ergebnissen, falls vorhanden
            if (savedResults.length > 0) {
              const updatedResults = savedResults.map(result => {
                if (result.enriched === enrichedReceiptData || 
                    (result.enriched.date === updatedData.date && 
                     result.enriched.receiptNumber === updatedData.receiptNumber)) {
                  return {
                    ...result,
                    enriched: updatedData
                  };
                }
                return result;
              });
              setSavedResults(updatedResults);
              // Speichere auch in localStorage
              try {
                localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(updatedResults));
              } catch (error) {
                console.error('❌ Fehler beim Speichern der aktualisierten Position:', error);
              }
            }
          }}
        />
      )}

      {/* JSON Viewer Modal */}
      {showJSONModal && selectedJSONData && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
          onClick={() => setShowJSONModal(false)}
        >
          <div 
            style={{
              backgroundColor: colors.card,
              borderRadius: '8px',
              border: `1px solid ${colors.cardBorder}`,
              width: '90%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h5 className="mb-0" style={{ color: colors.text }}>
                <FaCode className="me-2" />
                JSON-Daten der gespeicherten Ergebnisse
              </h5>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setShowJSONModal(false)}
                title="Schließen"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1rem', overflow: 'auto', flex: 1 }}>
              {/* Tabs */}
              <div className="mb-3">
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeJSONTab === 'result' ? 'active' : ''}`}
                      onClick={() => setActiveJSONTab('result')}
                      style={{ 
                        backgroundColor: activeJSONTab === 'result' ? colors.primary : 'transparent',
                        color: activeJSONTab === 'result' ? 'white' : colors.text,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      OCR Result
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeJSONTab === 'enriched' ? 'active' : ''}`}
                      onClick={() => setActiveJSONTab('enriched')}
                      style={{ 
                        backgroundColor: activeJSONTab === 'enriched' ? colors.primary : 'transparent',
                        color: activeJSONTab === 'enriched' ? 'white' : colors.text,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Enriched Data
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeJSONTab === 'raw' ? 'active' : ''}`}
                      onClick={() => setActiveJSONTab('raw')}
                      style={{ 
                        backgroundColor: activeJSONTab === 'raw' ? colors.primary : 'transparent',
                        color: activeJSONTab === 'raw' ? 'white' : colors.text,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Raw Response
                    </button>
                  </li>
                </ul>
              </div>

              {/* JSON Display */}
              <div style={{ position: 'relative' }}>
                <pre 
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '4px',
                    border: `1px solid ${colors.cardBorder}`,
                    overflow: 'auto',
                    maxHeight: '60vh',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {(() => {
                    let contentToDisplay: any;
                    
                    if (activeJSONTab === 'result') {
                      contentToDisplay = selectedJSONData.result;
                    } else if (activeJSONTab === 'enriched') {
                      contentToDisplay = selectedJSONData.enriched;
                    } else if (activeJSONTab === 'raw') {
                      // Versuche rawResponse zu parsen falls vorhanden
                      const rawResponse = selectedJSONData.result?.rawResponse || selectedJSONData.enriched?.rawResponse;
                      if (rawResponse) {
                        try {
                          // Versuche als JSON zu parsen
                          contentToDisplay = JSON.parse(rawResponse);
                        } catch (e) {
                          // Falls nicht parsbar, zeige als String
                          contentToDisplay = rawResponse;
                        }
                      } else {
                        contentToDisplay = { error: 'Keine rawResponse gefunden' };
                      }
                    }
                    
                    return JSON.stringify(contentToDisplay, null, 2);
                  })()}
                </pre>
                <button
                  className="btn btn-sm btn-outline-primary"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px'
                  }}
                  onClick={() => {
                    let jsonString: string;
                    
                    if (activeJSONTab === 'result') {
                      jsonString = JSON.stringify(selectedJSONData.result, null, 2);
                    } else if (activeJSONTab === 'enriched') {
                      jsonString = JSON.stringify(selectedJSONData.enriched, null, 2);
                    } else {
                      const rawResponse = selectedJSONData.result?.rawResponse || selectedJSONData.enriched?.rawResponse;
                      if (rawResponse) {
                        try {
                          const parsed = JSON.parse(rawResponse);
                          jsonString = JSON.stringify(parsed, null, 2);
                        } catch (e) {
                          jsonString = rawResponse;
                        }
                      } else {
                        jsonString = 'Keine rawResponse gefunden';
                      }
                    }
                    
                    navigator.clipboard.writeText(jsonString);
                    alert('JSON in Zwischenablage kopiert!');
                  }}
                  title="JSON kopieren"
                >
                  <FaCopy className="me-1" />
                  Kopieren
                </button>
              </div>

              {/* Info */}
              <div className="mt-3 p-2" style={{ backgroundColor: colors.light, borderRadius: '4px' }}>
                <small style={{ color: colors.textSecondary }}>
                  <strong>Hinweis:</strong> Dieser JSON-String zeigt die vollständigen Datenstrukturen der gespeicherten OCR-Ergebnisse.
                  <br />
                  <strong>OCR Result:</strong> Rohdaten direkt von Azure Form Recognizer.
                  <br />
                  <strong>Enriched Data:</strong> Angereicherte Daten mit Artikelformular-Feldern.
                  <br />
                  <strong>Raw Response:</strong> Vollständige, formatierte Azure API-Antwort (besser lesbar).
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentPage;
