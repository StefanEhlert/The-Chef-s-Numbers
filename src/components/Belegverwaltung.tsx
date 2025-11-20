import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaCheck,
  FaTimes,
  FaMoneyBillWave,
  FaUndo,
  FaSortUp,
  FaSortDown,
  FaCheckCircle,
  FaClock,
  FaPencilAlt,
  FaPrint,
  FaBrain,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Receipt, ReceiptPaymentStatus, Supplier as SupplierType } from '../types';
import BelegModal from './BelegModal';
import ReceiptReviewModal from './ReceiptReviewModal';
import { storageLayer } from '../services/storageLayer';
import { AccountingSettings, OCRApiConfig, OCRApiProvider } from '../types/accounting';
import { analyzeDocumentWithAzureFormRecognizer } from '../services/azureFormRecognizerService';
import { analyzeDocumentWithTaggun } from '../services/taggunOCRService';
import { OCRResult, enrichReceiptData } from '../services/ocrTypes';
import { generateId } from '../utils/storageUtils';

interface BelegverwaltungProps {
  receipts: Receipt[];
  suppliers: SupplierType[];
  colors: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortField: 'receiptDate' | 'supplier' | 'dueDate' | 'paymentStatus' | 'lineItemCount' | 'totalGross';
  setSortField: (field: 'receiptDate' | 'supplier' | 'dueDate' | 'paymentStatus' | 'lineItemCount' | 'totalGross') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  selectedSupplier: string;
  setSelectedSupplier: (supplier: string) => void;
  selectedPaymentStatus: ReceiptPaymentStatus | '';
  setSelectedPaymentStatus: (status: ReceiptPaymentStatus | '') => void;
  completionFilter: 'all' | 'completed' | 'open';
  setCompletionFilter: (filter: 'all' | 'completed' | 'open') => void;
  filteredAndSortedReceipts: () => Receipt[];
  receiptSuppliers: string[];
  selectedReceipts: string[];
  handleSelectReceipt: (receiptId: string) => void;
  handleSelectAll: () => void;
  handleDeleteReceipts: (receiptIds?: string[]) => void | Promise<void>;
  handleBulkMarkAsPaid: () => void | Promise<void>;
  handleBulkMarkAsOpen: () => void | Promise<void>;
  onCreateReceipt: () => Promise<Receipt> | Receipt;
  onUpdateReceipt: (receipt: Receipt) => void | Promise<void>;
  formatPrice: (value: number | undefined) => string;
  getSupplierName: (supplierId: string) => string;
}

const paymentStatusOptions: ReceiptPaymentStatus[] = ['offen', 'teilweise', 'bezahlt', 'überfällig'];

// Wrapper-Komponente für ReceiptReviewModal mit Bild-Laden
const ReceiptReviewModalWithImage: React.FC<{
  show: boolean;
  onClose: () => void;
  receiptData: any;
  suppliers: any[];
  colors: any;
  onSave: (articles: any[]) => void | Promise<void>;
  onNewSupplier: (supplierName: string) => void | Promise<void>;
  receiptImagePath?: string;
  receiptId?: string;
  originalOcrResult?: any;
  onUpdateReceiptData?: (updatedData: any) => void | Promise<void>;
  onSaveReceipt?: (receiptUpdate: any) => Promise<void>;
}> = ({ receiptImagePath, ...props }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!receiptImagePath) {
        console.log('📄 [ReceiptReviewModalWithImage] Kein receiptImagePath vorhanden');
        setImageUrl(undefined);
        return;
      }

      console.log('📄 [ReceiptReviewModalWithImage] Starte Bild-Laden für:', receiptImagePath);
      setIsLoadingImage(true);
      try {
        const url = await storageLayer.loadImage(receiptImagePath);
        console.log('📄 [ReceiptReviewModalWithImage] loadImage Ergebnis:', url ? 'URL erhalten' : 'null');
        if (url) {
          setImageUrl(url);
          console.log('✅ [ReceiptReviewModalWithImage] Belegbild geladen:', receiptImagePath, 'URL-Typ:', url.substring(0, 20));
        } else {
          console.warn('⚠️ [ReceiptReviewModalWithImage] Belegbild konnte nicht geladen werden:', receiptImagePath);
          setImageUrl(undefined);
        }
      } catch (error) {
        console.error('❌ [ReceiptReviewModalWithImage] Fehler beim Laden des Belegbildes:', error);
        setImageUrl(undefined);
      } finally {
        setIsLoadingImage(false);
      }
    };

    if (props.show && receiptImagePath) {
      console.log('📄 [ReceiptReviewModalWithImage] Modal geöffnet, lade Bild...');
      loadImage();
    } else {
      console.log('📄 [ReceiptReviewModalWithImage] Modal geschlossen oder kein receiptImagePath');
      setImageUrl(undefined);
    }
  }, [props.show, receiptImagePath]);

  return (
    <ReceiptReviewModal
      {...props}
      receiptImage={imageUrl}
      receiptImagePath={receiptImagePath}
    />
  );
};

const Belegverwaltung: React.FC<BelegverwaltungProps> = ({
  receipts,
  suppliers,
  colors,
  searchTerm,
  setSearchTerm,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  selectedSupplier,
  setSelectedSupplier,
  selectedPaymentStatus,
  setSelectedPaymentStatus,
  completionFilter,
  setCompletionFilter,
  filteredAndSortedReceipts,
  receiptSuppliers,
  selectedReceipts,
  handleSelectReceipt,
  handleSelectAll,
  handleDeleteReceipts,
  handleBulkMarkAsPaid,
  handleBulkMarkAsOpen,
  onCreateReceipt,
  onUpdateReceipt,
  formatPrice,
  getSupplierName
}) => {
  const [modalReceipt, setModalReceipt] = useState<Receipt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceiptReview, setShowReceiptReview] = useState(false);
  const [reviewReceipt, setReviewReceipt] = useState<Receipt | null>(null);
  
  // OCR Provider-Auswahl States
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<OCRApiConfig[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedProviderRef = useRef<OCRApiProvider | null>(null);
  

  const filteredReceipts = useMemo(
    () => filteredAndSortedReceipts(),
    [
      receipts,
      searchTerm,
      selectedSupplier,
      selectedPaymentStatus,
      completionFilter,
      sortField,
      sortDirection,
      filteredAndSortedReceipts
    ]
  );

  const isAllSelected =
    filteredReceipts.length > 0 && selectedReceipts.length === filteredReceipts.length;

  const formatDate = (value?: string) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const openModalForReceipt = async (receipt: Receipt) => {
    // Wenn Beleg nicht abgeschlossen ist, prüfe ob processedOcrData vorhanden ist
    if (!receipt.isCompleted) {
      let processedData = receipt.processedOcrData;
      
      // Wenn processedOcrData fehlt, aber ocrResult vorhanden ist, erstelle processedOcrData
      if (!processedData && receipt.ocrResult) {
        console.log('📝 Erstelle processedOcrData aus ocrResult für Beleg:', receipt.id);
        try {
          processedData = enrichReceiptData(receipt.ocrResult, suppliers.map(s => ({ id: s.id, name: s.name })));
          
          // Aktualisiere den Beleg mit processedOcrData
          const updatedReceipt: Receipt = {
            ...receipt,
            processedOcrData: processedData,
            isDirty: true
          };
          await onUpdateReceipt(updatedReceipt);
          
          // Verwende den aktualisierten Beleg
          receipt = updatedReceipt;
        } catch (error) {
          console.error('❌ Fehler beim Erstellen von processedOcrData:', error);
        }
      }
      
      // Wenn processedOcrData vorhanden ist, öffne ReceiptReviewModal
      if (processedData) {
        console.log('📝 Öffne ReceiptReviewModal für Beleg:', receipt.id, 'processedOcrData vorhanden:', !!processedData);
        setReviewReceipt(receipt);
        setShowReceiptReview(true);
        // Stelle sicher, dass BelegModal geschlossen ist
        setIsModalOpen(false);
        setModalReceipt(null);
        return;
      }
    }
    
    // Sonst öffne normales BelegModal
    console.log('📝 Öffne BelegModal für Beleg:', receipt.id, 'isCompleted:', receipt.isCompleted, 'processedOcrData:', !!receipt.processedOcrData);
    setModalReceipt({
      ...receipt,
      receiptDetails: {
        totalGross: receipt.receiptDetails?.totalGross ?? 0,
        totalNet: receipt.receiptDetails?.totalNet ?? 0,
        totalVat: receipt.receiptDetails?.totalVat ?? 0,
        currency: receipt.receiptDetails?.currency ?? 'EUR',
        lineItems: receipt.receiptDetails?.lineItems ?? []
      }
    });
    setIsModalOpen(true);
    // Stelle sicher, dass ReceiptReviewModal geschlossen ist
    setShowReceiptReview(false);
    setReviewReceipt(null);
  };

  const handleCreate = async () => {
    const receipt = await onCreateReceipt();
    openModalForReceipt(receipt);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalReceipt(null);
  };

  const handleModalSave = async (updatedReceipt: Receipt) => {
    await onUpdateReceipt({
      ...updatedReceipt,
      lineItemCount: updatedReceipt.receiptDetails?.lineItems?.length ?? updatedReceipt.lineItemCount
    });
    handleModalClose();
  };

  const paymentStatusLabel = (status: ReceiptPaymentStatus) => {
    switch (status) {
      case 'offen':
        return 'Offen';
      case 'teilweise':
        return 'Teilweise bezahlt';
      case 'bezahlt':
        return 'Bezahlt';
      case 'überfällig':
        return 'Überfällig';
      default:
        return status;
    }
  };

  const sortOptions = useMemo(
    () => [
      { value: 'receiptDate', field: 'receiptDate', label: 'Belegdatum' },
      { value: 'dueDate', field: 'dueDate', label: 'Fälligkeit' },
      { value: 'supplier', field: 'supplier', label: 'Lieferant' },
      { value: 'paymentStatus', field: 'paymentStatus', label: 'Zahlstatus' },
      { value: 'lineItemCount', field: 'lineItemCount', label: 'Positionen' },
      { value: 'totalGross', field: 'totalGross', label: 'Bruttosumme' }
    ],
    []
  );

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(event.target.value as BelegverwaltungProps['sortField']);
  };

  // Lade verfügbare OCR-Provider
  const loadAvailableProviders = useCallback(async () => {
    try {
      const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
      if (settings && settings.length > 0) {
        const firstSettings = settings[0];
        if (firstSettings.ocrApiConfigs && firstSettings.ocrApiConfigs.length > 0) {
          // Filtere nur Provider mit vollständiger Konfiguration
          const configuredProviders = firstSettings.ocrApiConfigs.filter(
            (config) => 
              config.isActive && 
              config.apiEndpoint && 
              config.apiEndpoint.trim() !== '' && 
              config.apiKey && 
              config.apiKey.trim() !== ''
          );
          setAvailableProviders(configuredProviders);
        } else {
          setAvailableProviders([]);
        }
      } else {
        setAvailableProviders([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der OCR-Provider:', error);
      setAvailableProviders([]);
    }
  }, []);

  useEffect(() => {
    loadAvailableProviders();
  }, [loadAvailableProviders]);

  // Provider-Auswahl Dialog öffnen
  const handleOcrScanClick = () => {
    loadAvailableProviders();
    setShowProviderDialog(true);
  };

  // Provider auswählen und Dateiauswahl öffnen
  const handleProviderSelect = (provider: OCRApiProvider) => {
    selectedProviderRef.current = provider;
    setShowProviderDialog(false);
    // Öffne Dateiauswahldialog
    fileInputRef.current?.click();
  };

  // Datei ausgewählt - starte OCR-Analyse
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const provider = selectedProviderRef.current;
    if (!provider) {
      setOcrError('Kein Provider ausgewählt');
      return;
    }

    setIsProcessingOCR(true);
    setOcrError(null);

    try {
      let ocrResult: OCRResult;

      // Führe OCR-Analyse durch
      if (provider === 'azure') {
        ocrResult = await analyzeDocumentWithAzureFormRecognizer(file);
      } else if (provider === 'taggun') {
        ocrResult = await analyzeDocumentWithTaggun(file);
      } else {
        throw new Error(`Unbekannter Provider: ${provider}`);
      }

      if (ocrResult.error) {
        setOcrError(ocrResult.error);
        setIsProcessingOCR(false);
        return;
      }

      // Konvertiere zu ExtendedReceiptData für Feldzuordnung
      const enriched = enrichReceiptData(ocrResult, suppliers.map(s => ({ id: s.id, name: s.name })));
      
      // Erstelle neuen Beleg mit OCR-Daten
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;

      // Berechne Netto- und MwSt-Beträge
      const totalGross = enriched.totalAmount || 0;
      const totalVat = (enriched.vat7 || 0) + (enriched.vat19 || 0);
      const totalNet = totalGross - totalVat;

      // Erstelle neuen Receipt
      const receiptId = generateId();
      const newReceipt: Receipt = {
        id: receiptId,
        supplierId: enriched.supplierId || '',
        bookingNumber: '',
        receiptDate: enriched.date || dateString,
        receiptNumber: enriched.receiptNumber || '',
        receiptDetails: {
          lineItems: [],
          currency: 'EUR',
          totalNet: totalNet,
          totalVat: totalVat,
          totalGross: totalGross
        },
        dueDate: '',
        paymentStatus: 'offen',
        lineItemCount: enriched.articles.length,
        accounting: [],
        isCompleted: false,
        notes: '',
        ocrResult: ocrResult, // Speichere OCR-Ergebnis als JSON (Original, bleibt unverändert)
        ocrProvider: provider, // Speichere verwendeten Provider
        processedOcrData: enriched, // Verarbeitete OCR-Daten für ReceiptReviewModal
        isDirty: true,
        isNew: true,
        syncStatus: 'pending',
        createdAt: today,
        updatedAt: today
      };

      // Speichere Belegbild
      try {
        const imagePath = `pictures/receipts/${receiptId}`;
        console.log('📷 [OCR] Speichere Belegbild:', {
          path: imagePath,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        const imageSaved = await storageLayer.saveImage(imagePath, file);
        if (imageSaved) {
          newReceipt.receiptImagePath = imagePath;
          console.log('✅ [OCR] Belegbild erfolgreich gespeichert:', imagePath);
        } else {
          console.warn('⚠️ [OCR] Belegbild konnte nicht gespeichert werden (saveImage returned false)');
        }
      } catch (imageError) {
        console.error('❌ [OCR] Fehler beim Speichern des Belegbildes:', imageError);
        // Bildfehler soll das Beleg-Speichern nicht verhindern
      }
      
      console.log('📋 [OCR] Receipt vor dem Speichern:', {
        id: newReceipt.id,
        receiptImagePath: newReceipt.receiptImagePath,
        hasOcrResult: !!newReceipt.ocrResult,
        hasProcessedOcrData: !!newReceipt.processedOcrData
      });

      // Speichere Beleg direkt
      await onUpdateReceipt(newReceipt);

      console.log('✅ Beleg mit OCR-Daten erstellt und gespeichert:', newReceipt.id);
      
      // Öffne automatisch ReceiptReviewModal für Bearbeitung
      setReviewReceipt(newReceipt);
      setShowReceiptReview(true);
    } catch (error: any) {
      console.error('Fehler bei OCR-Analyse:', error);
      setOcrError(error.message || 'Fehler bei der OCR-Analyse');
    } finally {
      setIsProcessingOCR(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Provider-Beschreibungen
  const getProviderDescription = (provider: OCRApiProvider): string => {
    switch (provider) {
      case 'azure':
        return 'Gut für Rechnungen';
      case 'taggun':
        return 'Beste Ergebnisse für Belege';
      default:
        return '';
    }
  };

  return (
    <div className="container-fluid p-4 pt-0">
      <div className="page belegverwaltung">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ color: colors.text, margin: 0 }}>Belegverwaltung</h1>
            <p className="mb-0" style={{ color: colors.textSecondary || colors.text }}>
              Verwalten Sie Ihre erfassten Belege inklusive Zahlstatus, Kontierung und Bearbeitungsstand.
            </p>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 align-items-center">
              <div className="md:col-span-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Belege durchsuchen..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-input"
                    title="Neuen Beleg anlegen"
                    onClick={handleCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 d-none d-md-block"></div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleOcrScanClick}
                  disabled={isProcessingOCR}
                >
                  {isProcessingOCR ? (
                    <>
                      <FaSpinner className="me-2" style={{ animation: 'spin 1s linear infinite' }} />
                      Verarbeitung...
                    </>
                  ) : (
                    <>
                      <FaBrain className="me-2" />
                      OCR Scan mit KI
                    </>
                  )}
                </button>
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => {
                    /* Placeholder für E-Rechnung */
                  }}
                >
                  + E-Rechnung
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 align-items-stretch">
              <div className="md:col-span-4">
                <select
                  className="form-select"
                  value={selectedSupplier}
                  onChange={(event) => setSelectedSupplier(event.target.value)}
                  style={{ borderColor: colors.cardBorder, color: colors.text }}
                >
                  <option value="">Alle Lieferanten</option>
                  {receiptSuppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  className="form-select"
                  value={selectedPaymentStatus}
                  onChange={(event) =>
                    setSelectedPaymentStatus(event.target.value as ReceiptPaymentStatus | '')
                  }
                  style={{ borderColor: colors.cardBorder, color: colors.text }}
                >
                  <option value="">Alle Zahlstatus</option>
                  {paymentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {paymentStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  className="form-select"
                  value={completionFilter}
                  onChange={(event) => setCompletionFilter(event.target.value as 'all' | 'completed' | 'open')}
                  style={{ borderColor: colors.cardBorder, color: colors.text }}
                >
                  <option value="all">Alle Zustände</option>
                  <option value="open">In Bearbeitung</option>
                  <option value="completed">Fertig bearbeitet</option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <div className="w-full md:w-auto" style={{ minWidth: '220px' }}>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={sortField}
                      onChange={handleSortChange}
                      style={{ borderColor: colors.cardBorder, color: colors.text }}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-input"
                      title={sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      style={{ width: '46px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                      {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedReceipts.length > 0 && (
          <div
            className="alert alert-info mb-3"
            style={{
              backgroundColor: colors.secondary,
              borderColor: colors.cardBorder,
              color: colors.text
            }}
          >
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <span>{selectedReceipts.length} Belege ausgewählt</span>
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-success btn-sm" onClick={handleBulkMarkAsPaid}>
                  <FaMoneyBillWave className="me-1" />
                  Als bezahlt markieren
                </button>
                <button className="btn btn-outline-primary btn-sm" onClick={handleBulkMarkAsOpen}>
                  <FaUndo className="me-1" />
                  Als offen markieren
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReceipts()}>
                  <FaTrash className="me-1" />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table table-hover modern-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: '48px' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Nr.</th>
                  <th>
                    <span className="table-header-label">
                      Datum
                      {sortField === 'receiptDate' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </span>
                  </th>
                  <th>R-Nummer</th>
                  <th>
                    <span className="table-header-label">
                      Lieferant
                      {sortField === 'supplier' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </span>
                  </th>
                  <th>
                    <span className="table-header-label">
                      Zahlung
                      {sortField === 'paymentStatus' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </span>
                  </th>
                  <th>
                    <span className="table-header-label">
                      Fälligkeit
                      {sortField === 'dueDate' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </span>
                  </th>
                  <th>
                    <span className="table-header-label">
                      Pos.
                      {sortField === 'lineItemCount' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </span>
                  </th>
                  <th>
                    <span className="table-header-label">
                      Summe
                      {sortField === 'totalGross' && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </span>
                  </th>
                  <th className="text-center">Zustand</th>
                  <th style={{ width: '140px' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-4" style={{ color: colors.textSecondary }}>
                      Keine Belege gefunden. Nutzen Sie den Button &quot;Neuer Beleg&quot;, um einen Beleg anzulegen.
                    </td>
                  </tr>
                )}

                {filteredReceipts.map((receipt) => {
                  const supplierName = receipt.supplierId ? getSupplierName(receipt.supplierId) : 'Unbekannt';
                  const totalGross = receipt.receiptDetails?.totalGross ?? 0;

                  return (
                    <tr
                      key={receipt.id}
                      className="table-row-clickable"
                      onDoubleClick={() => openModalForReceipt(receipt)}
                      title="Doppelklick zum Bearbeiten"
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedReceipts.includes(receipt.id)}
                          onChange={() => handleSelectReceipt(receipt.id)}
                        />
                      </td>
                      <td>{receipt.bookingNumber || '—'}</td>
                      <td>{formatDate(receipt.receiptDate)}</td>
                      <td>{receipt.receiptNumber || '—'}</td>
                      <td>{supplierName}</td>
                      <td>
                        <span
                          className="badge badge-status"
                          style={{
                            backgroundColor:
                              receipt.paymentStatus === 'bezahlt'
                                ? '#28a745'
                                : receipt.paymentStatus === 'überfällig'
                                ? '#dc3545'
                                : receipt.paymentStatus === 'teilweise'
                                ? '#fd7e14'
                                : colors.accent
                          }}
                        >
                          {paymentStatusLabel(receipt.paymentStatus || 'offen')}
                        </span>
                      </td>
                      <td>{formatDate(receipt.dueDate)}</td>
                      <td>{receipt.lineItemCount ?? receipt.receiptDetails?.lineItems?.length ?? 0}</td>
                      <td>{formatPrice(totalGross)}</td>
                      <td className="text-center">
                        {receipt.isCompleted ? (
                          <span className="status-icon text-success" title="Fertig bearbeitet">
                            <FaCheckCircle color="#28a745" />
                          </span>
                        ) : (
                          <span className="status-icon text-warning" title="In Arbeit">
                            <FaClock />
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-link btn-action"
                            title="Bearbeiten"
                            onClick={() => openModalForReceipt(receipt)}
                          >
                            <FaPencilAlt />
                          </button>
                          <button
                            className="btn btn-link btn-action"
                            title="Drucken"
                            onClick={() => {
                              console.log('Drucken für Beleg:', receipt.receiptNumber || receipt.id);
                            }}
                          >
                            <FaPrint />
                          </button>
                          <button
                            className="btn btn-link btn-action btn-danger"
                            title="Löschen"
                            onClick={() => handleDeleteReceipts([receipt.id])}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BelegModal
        show={isModalOpen && !!modalReceipt && !showReceiptReview}
        colors={colors}
        suppliers={suppliers}
        receipt={modalReceipt}
        paymentStatusOptions={paymentStatusOptions}
        paymentStatusLabel={paymentStatusLabel}
        onClose={handleModalClose}
        onChange={setModalReceipt}
        onSave={handleModalSave}
      />

      {/* ReceiptReviewModal für Belege in Bearbeitung */}
      {reviewReceipt && reviewReceipt.processedOcrData && (
        <ReceiptReviewModalWithImage
          show={showReceiptReview}
          onClose={() => {
            setShowReceiptReview(false);
            setReviewReceipt(null);
          }}
          receiptData={reviewReceipt.processedOcrData}
          suppliers={suppliers.map(s => ({
            id: s.id,
            name: s.name,
            contactPerson: s.contactPerson || '',
            email: s.email || '',
            phoneNumbers: s.phoneNumbers.map(p => ({ type: p.type, number: p.number })),
            address: s.address,
            website: s.website || '',
            notes: s.notes || ''
          }))}
          colors={colors}
          onSave={async (articles) => {
            // Wird später implementiert - Artikel werden hier übernommen
            console.log('Artikel übernommen:', articles);
          }}
          onNewSupplier={async (supplierName: string) => {
            // Wird später implementiert
            console.log('Neuer Lieferant:', supplierName);
          }}
          receiptImagePath={reviewReceipt.receiptImagePath}
          receiptId={reviewReceipt.id}
          originalOcrResult={reviewReceipt.ocrResult}
          onUpdateReceiptData={async (updatedData) => {
            // Aktualisiere processedOcrData im Receipt
            const updatedReceipt: Receipt = {
              ...reviewReceipt,
              processedOcrData: updatedData,
              isDirty: true
            };
            await onUpdateReceipt(updatedReceipt);
            setReviewReceipt(updatedReceipt);
          }}
          onSaveReceipt={async (receiptUpdate) => {
            // Aktualisiere Receipt mit den neuen Daten
            const updatedReceipt: Receipt = {
              ...reviewReceipt,
              ...(receiptUpdate.processedOcrData && { processedOcrData: receiptUpdate.processedOcrData }),
              ...(receiptUpdate.receiptDetails && { 
                receiptDetails: receiptUpdate.receiptDetails,
                lineItemCount: receiptUpdate.receiptDetails.lineItems.length
              }),
              ...(receiptUpdate.isCompleted !== undefined && { isCompleted: receiptUpdate.isCompleted }),
              // Aktualisiere auch Belegfelder aus processedOcrData
              ...(receiptUpdate.processedOcrData && {
                supplierId: receiptUpdate.processedOcrData.supplierId || reviewReceipt.supplierId,
                receiptDate: receiptUpdate.processedOcrData.date || reviewReceipt.receiptDate,
                receiptNumber: receiptUpdate.processedOcrData.receiptNumber || reviewReceipt.receiptNumber
              }),
              isDirty: true,
              updatedAt: new Date()
            };
            
            await onUpdateReceipt(updatedReceipt);
            setReviewReceipt(updatedReceipt);
            
            // Wenn abgeschlossen, schließe Modal
            if (receiptUpdate.isCompleted) {
              setShowReceiptReview(false);
              setReviewReceipt(null);
            }
          }}
        />
      )}

      {/* Versteckter File Input für OCR */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Provider-Auswahl Dialog */}
      {showProviderDialog && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowProviderDialog(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.cardBorder}`
              }}
            >
              <div
                className="modal-header d-flex align-items-center"
                style={{ 
                  backgroundColor: colors.secondary, 
                  borderBottom: `1px solid ${colors.cardBorder}`,
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  paddingLeft: '1rem',
                }}
              >
                <FaBrain className="me-2" style={{ color: colors.text }} />
                <h5 className="modal-title mb-0" style={{ color: colors.text }}>
                  KI-Provider auswählen
                </h5>
                <button
                  type="button"
                  className="btn-close ms-auto"
                  onClick={() => setShowProviderDialog(false)}
                  style={{ filter: 'invert(1)' }}
                />
              </div>
              <div className="modal-body" style={{ color: colors.text, padding: '1.5rem' }}>
                {availableProviders.length === 0 ? (
                  <div className="text-center py-4">
                    <FaBrain className="mb-3" style={{ fontSize: '3rem', opacity: 0.3 }} />
                    <p>Keine konfigurierten KI-Provider gefunden.</p>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                      Bitte konfigurieren Sie mindestens einen Provider in den Einstellungen.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {availableProviders.map((config) => (
                      <div
                        key={config.id}
                        className="card"
                        style={{
                          backgroundColor: colors.paper || colors.card,
                          border: `1px solid ${colors.cardBorder}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.primary;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.cardBorder;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => handleProviderSelect(config.provider)}
                      >
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <FaBrain className="me-3" style={{ fontSize: '1.5rem', color: colors.primary }} />
                            <div className="flex-grow-1">
                              <h6 className="mb-1" style={{ color: colors.text }}>
                                {config.provider === 'azure' ? 'Azure Form Recognizer' : 'Taggun.io'}
                              </h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                                {getProviderDescription(config.provider)}
                              </p>
                            </div>
                            <FaCheck className="ms-2" style={{ color: colors.primary }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR Fehler-Anzeige */}
      {ocrError && (
        <div
          className="alert alert-danger alert-dismissible fade show position-fixed"
          style={{
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px'
          }}
          role="alert"
        >
          <FaExclamationTriangle className="me-2" />
          {ocrError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setOcrError(null)}
          />
        </div>
      )}

    </div>
  );
};

export default Belegverwaltung;

