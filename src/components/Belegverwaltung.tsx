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
  FaExclamationTriangle,
  FaEye
} from 'react-icons/fa';
import { Receipt, ReceiptPaymentStatus, Supplier as SupplierType } from '../types';
import BelegModal from './BelegModal';
import ReceiptReviewModal from './ReceiptReviewModal';
import SupplierSelectionModal from './SupplierSelectionModal';
import { storageLayer } from '../services/storageLayer';
import { AccountingSettings, OCRApiConfig, OCRApiProvider } from '../types/accounting';
import type { AccountingChartId } from '../constants/accountingTemplates';
import { analyzeDocumentWithAzureFormRecognizer } from '../services/azureFormRecognizerService';
import { analyzeDocumentWithTaggun } from '../services/taggunOCRService';
import { OCRResult, enrichReceiptData, addOcrNameToSupplier } from '../services/ocrTypes';
import { generateId } from '../utils/storageUtils';
import { useAppContext } from '../contexts/AppContext';

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
  onUpdateReceipt: (receipt: Receipt, options?: { suppressQuotaError?: boolean }) => void | Promise<void>;
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
  onUpdateReceiptImagePath?: (newPath: string) => Promise<void>; // Callback zum Aktualisieren des receiptImagePath
}> = ({ receiptImagePath, onUpdateReceiptImagePath, ...props }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageExtension, setImageExtension] = useState<string | undefined>(undefined);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false); // Markiert fehlgeschlagenes Laden
  const loadingRef = useRef<string | null>(null); // Verhindert doppeltes Laden

  useEffect(() => {
    const loadImage = async () => {
      if (!receiptImagePath) {
        setImageUrl(undefined);
        setImageLoadFailed(false);
        return;
      }

      // Verhindere doppeltes Laden: Prüfe ob bereits für diesen Pfad geladen wird
      if (loadingRef.current === receiptImagePath) {
        return; // Bereits am Laden für diesen Pfad
      }

      loadingRef.current = receiptImagePath;
      setIsLoadingImage(true);
      setImageLoadFailed(false); // Reset bei neuem Laden-Versuch
      try {
        const result = await storageLayer.loadImage(receiptImagePath);
        if (result) {
          setImageUrl(result.url);
          setImageExtension(result.extension);
          setImageLoadFailed(false);
          
          // Aktualisiere receiptImagePath im Receipt mit der gefundenen Endung, falls noch nicht vorhanden
          // WICHTIG: Normalisiere Pfad zuerst (entferne falsche Extensions)
          const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
          let normalizedPath = receiptImagePath;
          
          // Entferne doppelte Pfad-Teile
          if (normalizedPath.includes('.pictures/')) {
            normalizedPath = normalizedPath.substring(0, normalizedPath.indexOf('.pictures/'));
          }
          
          // Entferne ungültige Extensions
          const lastDotIndex = normalizedPath.lastIndexOf('.');
          if (lastDotIndex > 0 && normalizedPath.lastIndexOf('/') < lastDotIndex) {
            const potentialExt = normalizedPath.substring(lastDotIndex + 1).toLowerCase();
            if (!validExtensions.includes(potentialExt)) {
              normalizedPath = normalizedPath.substring(0, lastDotIndex);
            }
          }
          
          // Prüfe ob Extension bereits vorhanden ist (nur gültige Extensions prüfen)
          const hasValidExtension = validExtensions.some(ext => normalizedPath.toLowerCase().endsWith(`.${ext}`));
          
          if (result.extension && validExtensions.includes(result.extension.toLowerCase()) && !hasValidExtension && onUpdateReceiptImagePath) {
            const updatedPath = `${normalizedPath}.${result.extension}`;
            console.log('💾 [ReceiptReviewModalWithImage] Aktualisiere receiptImagePath mit Endung:', updatedPath);
            // Aktualisiere Receipt im Hintergrund (nicht-blockierend)
            onUpdateReceiptImagePath(updatedPath).catch(err => {
              console.warn('⚠️ [ReceiptReviewModalWithImage] Fehler beim Aktualisieren des receiptImagePath:', err);
            });
          }
        } else {
          // Bild nicht gefunden - markiere als fehlgeschlagen
          setImageUrl(undefined);
          setImageLoadFailed(true);
        }
      } catch (error) {
        console.error('❌ [ReceiptReviewModalWithImage] Fehler beim Laden des Belegbildes:', error);
        setImageUrl(undefined);
        setImageLoadFailed(true);
      } finally {
        setIsLoadingImage(false);
        loadingRef.current = null; // Reset nach Abschluss
      }
    };

    // Lade Bild nur wenn receiptImagePath vorhanden ist
    if (props.show && receiptImagePath) {
      loadImage();
    } else {
      setImageUrl(undefined);
      setImageLoadFailed(false);
      loadingRef.current = null; // Reset wenn Modal geschlossen oder kein Pfad
    }
  }, [props.show, receiptImagePath, onUpdateReceiptImagePath]);

  // Normalisiere Pfad vor Anzeige (entferne falsche Extensions)
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
  
  // Prüfe ob receiptImagePath vorhanden ist - wenn nicht, zeige Modal trotzdem (Fallback)
  if (!receiptImagePath) {
    // Modal wird auch ohne Bild angezeigt - Fallback-Modus
    return (
      <ReceiptReviewModal
        {...props}
        receiptImage={undefined} // Kein Bild vorhanden
        receiptImagePath={undefined}
      />
    );
  }
  
  let displayPath: string = receiptImagePath;
  
  // Entferne doppelte Pfad-Teile
  if (displayPath.includes('.pictures/')) {
    displayPath = displayPath.substring(0, displayPath.indexOf('.pictures/'));
  }
  
  // Füge Extension nur hinzu, wenn gültig und noch nicht vorhanden
  const hasValidExtension = validExtensions.some(ext => displayPath.toLowerCase().endsWith(`.${ext}`));
  const finalPath = (imageExtension && validExtensions.includes(imageExtension.toLowerCase()) && !hasValidExtension)
    ? `${displayPath}.${imageExtension}`
    : displayPath;
  
  return (
    <ReceiptReviewModal
      {...props}
      receiptImage={imageUrl}
      receiptImagePath={imageLoadFailed ? undefined : finalPath} // Entferne receiptImagePath wenn Laden fehlgeschlagen ist
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
  
  // Supplier-Auswahl Modal States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [pendingOcrResult, setPendingOcrResult] = useState<{ ocrResult: OCRResult; provider: OCRApiProvider; file: File } | null>(null);
  
  // App Context für articles
  const { state } = useAppContext();
  

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

  const truncateText = (text: string | undefined, maxLength: number = 50): string => {
    if (!text || text.trim() === '') {
      return '—';
    }
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  const openModalForReceipt = async (receipt: Receipt) => {
    // Wenn Beleg nicht abgeschlossen ist (isCompleted === false), öffne ReceiptReviewModal
    if (!receipt.isCompleted) {
      let processedData = receipt.processedOcrData;
      
      // Prüfe, ob processedOcrData fehlt oder leer ist (articles: [] oder kein articles-Array)
      const hasEmptyProcessedData = !processedData || 
        !processedData.articles || 
        !Array.isArray(processedData.articles) || 
        processedData.articles.length === 0;
      
      // Wenn processedOcrData fehlt oder leer ist, aber ocrResult vorhanden ist, erstelle processedOcrData
      if (hasEmptyProcessedData && receipt.ocrResult) {
        console.log('📝 Erstelle processedOcrData aus ocrResult für Beleg:', receipt.id, '(processedOcrData fehlt oder ist leer)');
        try {
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
          
          processedData = enrichReceiptData(
            receipt.ocrResult, 
            suppliers.map(s => ({ id: s.id, name: s.name, recognizedNames: s.recognizedNames })),
            state.articles || [],
            receipt.ocrProvider,
            undefined, // accountingAccounts - wird optional verwendet
            selectedChartId
          );
          
          // Aktualisiere den Beleg mit processedOcrData
          const updatedReceipt: Receipt = {
            ...receipt,
            processedOcrData: processedData,
            isDirty: true
          };
          await onUpdateReceipt(updatedReceipt);
          
          // Verwende den aktualisierten Beleg
          receipt = updatedReceipt;
          console.log('✅ processedOcrData erfolgreich erstellt mit', processedData.articles?.length || 0, 'Artikeln');
        } catch (error) {
          console.error('❌ Fehler beim Erstellen von processedOcrData:', error);
        }
      }
      // Fallback: Wenn processedOcrData leer ist, aber receiptDetails.lineItems vorhanden ist, konvertiere lineItems zu articles
      else if (hasEmptyProcessedData && receipt.receiptDetails?.lineItems && receipt.receiptDetails.lineItems.length > 0) {
        console.log('📝 Konvertiere receiptDetails.lineItems zu processedOcrData.articles für Beleg:', receipt.id, `(${receipt.receiptDetails.lineItems.length} lineItems gefunden)`);
        try {
          // Konvertiere ReceiptLineItem[] zu ReceiptArticle[]
          const restoredArticles = receipt.receiptDetails.lineItems.map((lineItem) => {
            const unit = lineItem.unit || 'Stück';
            return {
              name: lineItem.description || '',
              nameOCR: lineItem.description || '',
              price: lineItem.total || 0,
              quantity: lineItem.quantity || 1,
              unit: unit,
              category: '',
              supplierId: receipt.supplierId || processedData?.supplierId || '',
              supplierArticleNumber: '',
              bundleUnit: unit,
              bundlePrice: lineItem.total || 0,
              bundleEanCode: '',
              content: 1,
              contentUnit: unit,
              contentEanCode: '',
              pricePerUnit: lineItem.unitPrice || 0,
              vatRate: lineItem.vatRate || 19,
              taxAccount: lineItem.taxAccount,
              allergens: [],
              additives: [],
              ingredients: '',
              nutrition: {
                calories: 0,
                kilojoules: 0,
                protein: 0,
                fat: 0,
                carbohydrates: 0,
                fiber: 0,
                sugar: 0,
                salt: 0,
                alcohol: undefined
              },
              openFoodFactsCode: '',
              notes: '',
              linkedArticleId: lineItem.articleId
            };
          });
          
          // Aktualisiere processedOcrData mit wiederhergestellten Artikeln
          const totalAmount = restoredArticles.reduce((sum, article) => sum + (article.price || 0), 0);
          processedData = {
            ...(processedData || {}),
            articles: restoredArticles,
            totalArticles: restoredArticles.length,
            totalAmount: totalAmount,
            supplierId: receipt.supplierId || processedData?.supplierId,
            date: receipt.receiptDate || processedData?.date,
            receiptNumber: receipt.receiptNumber || processedData?.receiptNumber,
            vat7: processedData?.vat7 || 0,
            vat19: processedData?.vat19 || 0,
            isCompleted: processedData?.isCompleted || false
          };
          
          // Aktualisiere den Beleg mit wiederhergestelltem processedOcrData
          const updatedReceipt: Receipt = {
            ...receipt,
            processedOcrData: processedData,
            isDirty: true
          };
          await onUpdateReceipt(updatedReceipt);
          
          // Verwende den aktualisierten Beleg
          receipt = updatedReceipt;
          console.log('✅ processedOcrData erfolgreich aus lineItems wiederhergestellt mit', restoredArticles.length, 'Artikeln');
        } catch (error) {
          console.error('❌ Fehler beim Wiederherstellen von processedOcrData aus lineItems:', error);
        }
      }
      
      // Stelle sicher, dass processedOcrData mindestens ein leeres Objekt ist (für reduziert gespeicherte Belege ohne ocrResult und ohne lineItems)
      if (!receipt.processedOcrData) {
        receipt.processedOcrData = {
          articles: [],
          totalArticles: 0,
          totalAmount: 0,
          vat7: 0,
          vat19: 0,
          isCompleted: false
        };
        console.warn('⚠️ processedOcrData wurde als leeres Objekt erstellt (kein ocrResult und keine lineItems verfügbar)');
      }
      
      // Öffne ReceiptReviewModal für nicht abgeschlossene Belege
      const articleCount = receipt.processedOcrData?.articles?.length || 0;
      console.log('📝 Öffne ReceiptReviewModal für Beleg:', receipt.id, 'isCompleted:', receipt.isCompleted, 'hasProcessedOcrData:', !!receipt.processedOcrData, 'articleCount:', articleCount);
      setReviewReceipt(receipt);
      setShowReceiptReview(true);
      // Stelle sicher, dass BelegModal geschlossen ist
      setIsModalOpen(false);
      setModalReceipt(null);
      return;
    }
    
    // Wenn Beleg abgeschlossen ist (isCompleted === true), öffne BelegModal
    console.log('📝 Öffne BelegModal für Beleg:', receipt.id, 'isCompleted:', receipt.isCompleted);
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

  const handleEditReceipt = async (receipt: Receipt) => {
    let processedData = receipt.processedOcrData;
    
    // Prüfe, ob processedOcrData fehlt oder leer ist (articles: [] oder kein articles-Array)
    const hasEmptyProcessedData = !processedData || 
      !processedData.articles || 
      !Array.isArray(processedData.articles) || 
      processedData.articles.length === 0;
    
    // Wenn processedOcrData fehlt oder leer ist, aber ocrResult vorhanden ist, erstelle processedOcrData
    if (hasEmptyProcessedData && receipt.ocrResult) {
      console.log('📝 Erstelle processedOcrData aus ocrResult für Beleg:', receipt.id, '(processedOcrData fehlt oder ist leer)');
      try {
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
        
        processedData = enrichReceiptData(
          receipt.ocrResult, 
          suppliers.map(s => ({ id: s.id, name: s.name, recognizedNames: s.recognizedNames })),
          state.articles || [],
          receipt.ocrProvider,
          undefined, // accountingAccounts - wird optional verwendet
          selectedChartId
        );
        
        // Aktualisiere den Beleg mit processedOcrData
        const updatedReceipt: Receipt = {
          ...receipt,
          processedOcrData: processedData,
          isDirty: true
        };
        await onUpdateReceipt(updatedReceipt);
        
        // Verwende den aktualisierten Beleg
        receipt = updatedReceipt;
        console.log('✅ processedOcrData erfolgreich erstellt mit', processedData.articles?.length || 0, 'Artikeln');
      } catch (error) {
        console.error('❌ Fehler beim Erstellen von processedOcrData:', error);
      }
    }
    
    // Öffne ReceiptReviewModal
    const articleCount = receipt.processedOcrData?.articles?.length || 0;
    console.log('📝 Öffne ReceiptReviewModal für Beleg:', receipt.id, 'articleCount:', articleCount);
    setReviewReceipt(receipt);
    setShowReceiptReview(true);
    // Stelle sicher, dass BelegModal geschlossen ist
    setIsModalOpen(false);
    setModalReceipt(null);
  };

  const handleOpenReceiptReview = async (receipt: Receipt) => {
    let processedData = receipt.processedOcrData;
    
    // Prüfe, ob processedOcrData fehlt oder leer ist (articles: [] oder kein articles-Array)
    const hasEmptyProcessedData = !processedData || 
      !processedData.articles || 
      !Array.isArray(processedData.articles) || 
      processedData.articles.length === 0;
    
    // Wenn processedOcrData fehlt oder leer ist, aber ocrResult vorhanden ist, erstelle processedOcrData
    if (hasEmptyProcessedData && receipt.ocrResult) {
      console.log('📝 Erstelle processedOcrData aus ocrResult für Beleg:', receipt.id, '(processedOcrData fehlt oder ist leer)');
      try {
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
        
        processedData = enrichReceiptData(
          receipt.ocrResult, 
          suppliers.map(s => ({ id: s.id, name: s.name, recognizedNames: s.recognizedNames })),
          state.articles || [],
          receipt.ocrProvider,
          undefined, // accountingAccounts - wird optional verwendet
          selectedChartId
        );
        
        // Aktualisiere den Beleg mit processedOcrData
        const updatedReceipt: Receipt = {
          ...receipt,
          processedOcrData: processedData,
          isDirty: true
        };
        await onUpdateReceipt(updatedReceipt);
        
        // Verwende den aktualisierten Beleg
        receipt = updatedReceipt;
        console.log('✅ processedOcrData erfolgreich erstellt mit', processedData.articles?.length || 0, 'Artikeln');
      } catch (error) {
        console.error('❌ Fehler beim Erstellen von processedOcrData:', error);
      }
    }
    
    // Öffne ReceiptReviewModal direkt
    const articleCount = receipt.processedOcrData?.articles?.length || 0;
    console.log('📝 Öffne ReceiptReviewModal für Beleg:', receipt.id, 'articleCount:', articleCount);
    setReviewReceipt(receipt);
    setShowReceiptReview(true);
    // Stelle sicher, dass BelegModal geschlossen ist
    setIsModalOpen(false);
    setModalReceipt(null);
  };

  const handleOpenReceiptViewer = (receipt: Receipt) => {
    // Öffne BelegModal für Anzeige
    console.log('📝 Öffne BelegModal für Beleg:', receipt.id);
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

  // Lade verfügbare OCR-Provider aus localOptions/KI-Provider (unabhängig von Datenbank)
  const loadAvailableProviders = useCallback(async () => {
    try {
      // Migration: Versuche bestehende Configs aus accountingSettings zu migrieren
      const { loadKIProviderConfigs, migrateKIProviderConfigsFromAccountingSettings } = await import('../utils/kiProviderConfig');
      await migrateKIProviderConfigsFromAccountingSettings();
      
      const ocrConfigs = loadKIProviderConfigs();
      
      if (ocrConfigs && ocrConfigs.length > 0) {
        // Filtere nur Provider mit vollständiger Konfiguration
        const configuredProviders = ocrConfigs.filter(
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

      // Konvertiere zu ExtendedReceiptData für Feldzuordnung (mit articles und ocrProvider)
      const enriched = enrichReceiptData(
        ocrResult, 
        suppliers.map(s => ({ id: s.id, name: s.name, recognizedNames: s.recognizedNames })),
        state.articles || [],
        provider,
        undefined, // accountingAccounts - wird optional verwendet
        selectedChartId
      );
      
      // Wenn kein Supplier gefunden wurde, öffne Modal
      if (!enriched.supplierId) {
        setPendingOcrResult({ ocrResult, provider, file });
        setShowSupplierModal(true);
        setIsProcessingOCR(false);
        return;
      }
      
      // Supplier gefunden - Update Supplier mit recognizedNames falls nötig
      const foundSupplier = suppliers.find(s => s.id === enriched.supplierId);
      if (foundSupplier && ocrResult.supplier) {
        const updatedSupplier = addOcrNameToSupplier(foundSupplier, ocrResult.supplier);
        if (updatedSupplier.recognizedNames !== foundSupplier.recognizedNames) {
          // TODO: Supplier aktualisieren in DB
          console.log('📝 Supplier recognizedNames aktualisiert:', updatedSupplier.recognizedNames);
        }
      }
      
      // Erstelle neuen Beleg mit OCR-Daten
      await createReceiptFromEnriched(enriched, ocrResult, provider, file);
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
      case 'gemini':
        return 'Automatische Lieferantendaten-Erfassung';
      default:
        return '';
    }
  };

  // Handler für Supplier-Auswahl im Modal
  const handleSupplierSelect = async (supplier: SupplierType) => {
    if (!pendingOcrResult) return;
    
    const { ocrResult, provider, file } = pendingOcrResult;
    
    // Update Supplier mit recognizedNames falls nötig
    const updatedSupplier = addOcrNameToSupplier(supplier, ocrResult.supplier || '');
    if (updatedSupplier.recognizedNames !== supplier.recognizedNames) {
      // Speichere Supplier mit aktualisierten recognizedNames in DB
      try {
        const supplierToSave = {
          ...updatedSupplier,
          updatedAt: new Date()
        };
        await storageLayer.save('suppliers', [supplierToSave]);
        console.log('✅ Supplier recognizedNames gespeichert:', updatedSupplier.recognizedNames);
      } catch (error) {
        console.error('❌ Fehler beim Speichern des Suppliers:', error);
      }
    }
    
    // enrichReceiptData erneut aufrufen (jetzt sollte Supplier gefunden werden)
    // Füge Supplier temporär zur Liste hinzu, falls noch nicht vorhanden
    const suppliersWithSelected = suppliers.find(s => s.id === supplier.id)
      ? suppliers.map(s => s.id === supplier.id ? updatedSupplier : s)
      : [...suppliers, updatedSupplier];
    
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
    
    const enriched = enrichReceiptData(
      ocrResult,
      suppliersWithSelected.map(s => ({ id: s.id, name: s.name, recognizedNames: s.recognizedNames })),
      state.articles || [],
      provider,
      undefined, // accountingAccounts - wird optional verwendet
      selectedChartId
    );
    
    // Stelle sicher, dass supplierId gesetzt ist (falls enrichReceiptData ihn nicht gefunden hat)
    if (!enriched.supplierId && supplier.id) {
      enriched.supplierId = supplier.id;
    }
    
    // Erstelle neuen Beleg mit OCR-Daten
    await createReceiptFromEnriched(enriched, ocrResult, provider, file, supplier.id);
    
    // Modal schließen
    setShowSupplierModal(false);
    setPendingOcrResult(null);
  };

  // Handler für Supplier-Erstellung im Modal
  const handleCreateSupplier = async (supplierName: string) => {
    if (!pendingOcrResult) return;
    
    // Erstelle neuen Supplier
    const newSupplier: SupplierType = {
      id: generateId(),
      name: supplierName,
      address: {
        street: '',
        zipCode: '',
        city: '',
        country: 'Deutschland'
      },
      phoneNumbers: [],
      recognizedNames: pendingOcrResult.ocrResult.supplier && pendingOcrResult.ocrResult.supplier.toLowerCase().trim() !== supplierName.toLowerCase().trim()
        ? [pendingOcrResult.ocrResult.supplier]
        : undefined,
      isDirty: true,
      isNew: true,
      syncStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Speichere neuen Supplier in DB
    try {
      await storageLayer.save('suppliers', [newSupplier]);
      console.log('✅ Neuer Supplier gespeichert:', newSupplier.name);
    } catch (error) {
      console.error('❌ Fehler beim Speichern des neuen Suppliers:', error);
    }
    
    // Verwende neuen Supplier
    await handleSupplierSelect(newSupplier);
  };

  // Hilfsfunktion: Erstelle Beleg aus enriched data
  const createReceiptFromEnriched = async (
    enriched: any,
    ocrResult: OCRResult,
    provider: OCRApiProvider,
    file: File,
    selectedSupplierId?: string
  ) => {
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
    // Verwende selectedSupplierId falls vorhanden, sonst enriched.supplierId
    const finalSupplierId = selectedSupplierId || enriched.supplierId || '';
    const newReceipt: Receipt = {
      id: receiptId,
      supplierId: finalSupplierId,
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
      ocrResult: ocrResult,
      ocrProvider: provider,
      processedOcrData: enriched,
      isDirty: true,
      isNew: true,
      syncStatus: 'pending',
      createdAt: today,
      updatedAt: today
    };

    // Speichere Belegbild (versuche es, aber blockiere nicht, wenn es fehlschlägt)
    try {
      const imagePath = `pictures/receipts/${receiptId}`;
      const imageSaved = await storageLayer.saveImage(imagePath, file);
      if (imageSaved) {
        newReceipt.receiptImagePath = imagePath;
        console.log('✅ [OCR] Belegbild erfolgreich gespeichert:', imagePath);
      } else {
        console.warn('⚠️ [OCR] Belegbild konnte nicht gespeichert werden, aber Beleg wird trotzdem gespeichert');
      }
    } catch (imageError) {
      console.error('❌ [OCR] Fehler beim Speichern des Belegbildes:', imageError);
      console.warn('⚠️ [OCR] Beleg wird trotzdem ohne Bild gespeichert');
      // Beleg wird auch ohne Bild gespeichert - das ist beabsichtigt
    }

    // Speichere Beleg (immer, auch ohne Bild)
    // Unterdrücke Fehlermeldung beim ersten Speichern nach OCR
    try {
      await onUpdateReceipt(newReceipt, { suppressQuotaError: true });
      console.log('✅ [OCR] Beleg erfolgreich gespeichert (mit oder ohne Bild)');
    } catch (receiptError) {
      console.error('❌ [OCR] Fehler beim Speichern des Belegs:', receiptError);
      throw receiptError; // Beleg-Speicherung ist kritisch - Fehler weiterwerfen
    }
    
    // Öffne automatisch ReceiptReviewModal für Bearbeitung
    setReviewReceipt(newReceipt);
    setShowReceiptReview(true);
  };

  // Druck-Funktion für Beleg mit Kontierungstabelle
  const handlePrintReceipt = async (receipt: Receipt) => {
    try {
      // Lade Belegbild
      let imageUrl: string | undefined | null;
      if (receipt.receiptImagePath) {
        try {
          const imageResult = await storageLayer.loadImage(receipt.receiptImagePath);
          if (imageResult) {
            imageUrl = imageResult.url;
          }
        } catch (error) {
          console.error('Fehler beim Laden des Belegbildes:', error);
          alert('Fehler beim Laden des Belegbildes. Bitte versuchen Sie es erneut.');
          return;
        }
      }

      if (!imageUrl) {
        alert('Kein Belegbild gefunden. Bitte stellen Sie sicher, dass ein Bild vorhanden ist.');
        return;
      }

      // Erstelle Kontierungstabelle aus accounting
      const taxAccountTotals = receipt.accounting && receipt.accounting.length > 0
        ? receipt.accounting.map(entry => ({
            accountNumber: entry.accountNumber || '',
            accountName: entry.accountName || '',
            total: entry.amount || 0
          }))
        : [];

      if (taxAccountTotals.length === 0) {
        alert('Keine Kontierungseinträge vorhanden. Bitte fügen Sie zuerst Kontierungseinträge hinzu.');
        return;
      }

      // Lade Position aus processedOcrData oder verwende Standard-Wert
      const printListPosition = receipt.processedOcrData?.printListPosition || { x: 50, y: 50 };

      // Lade Bildgröße für Position-Berechnung
      const img = new Image();
      img.src = imageUrl;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
      });

      const imageWidth = img.naturalWidth;
      const imageHeight = img.naturalHeight;

      // Berechne Position in Prozent
      const positionPercentX = (printListPosition.x / imageWidth) * 100;
      const positionPercentY = (printListPosition.y / imageHeight) * 100;

      // Öffne Druckvorschau
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Pop-up-Blocker verhindert das Öffnen der Druckvorschau. Bitte erlauben Sie Pop-ups für diese Seite.');
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Beleg mit Steuerkonten-Summen</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              @page {
                margin: 0;
                size: auto;
                orphans: 0;
                widows: 0;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                min-height: 100%;
              }
              @media print {
                html, body {
                  margin: 0; 
                  padding: 0;
                  width: 100%;
                  height: auto;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .print-container {
                  position: relative;
                  width: 100%;
                  margin: 0;
                  padding: 0;
                }
                .receipt-image { 
                  width: 100%; 
                  height: auto;
                  display: block;
                  max-width: 100%;
                }
                .tax-account-list {
                  position: absolute;
                  left: ${positionPercentX}%;
                  top: ${positionPercentY}%;
                  transform: translate(0, 0);
                  background: white !important;
                  padding: 6px;
                  border: 1px solid #000;
                  font-family: Arial, sans-serif;
                  font-size: 7px;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  min-width: 120px;
                  z-index: 1000;
                }
                .tax-account-title {
                  font-weight: bold;
                  margin-bottom: 5px;
                  font-size: 8px;
                }
                .tax-account-item {
                  margin: 3px 0;
                  padding: 2px 0;
                  border-bottom: 1px solid #ccc;
                }
                .tax-account-item:last-child {
                  border-bottom: none;
                }
              }
              body {
                margin: 0;
                padding: 0;
                min-height: 100%;
              }
              .print-container {
                position: relative;
                display: block;
                width: 100%;
                margin: 0;
                padding: 0;
                min-height: 100%;
              }
              .receipt-image {
                width: 100%;
                height: auto;
                display: block;
                max-width: 100%;
              }
              .tax-account-list {
                position: absolute;
                left: ${positionPercentX}%;
                top: ${positionPercentY}%;
                transform: translate(0, 0);
                background: rgba(255, 255, 255, 0.95);
                padding: 6px;
                border: 1px solid #000;
                font-family: Arial, sans-serif;
                font-size: 7px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                min-width: 120px;
                z-index: 1000;
              }
              .tax-account-title {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 8px;
              }
              .tax-account-item {
                margin: 3px 0;
                padding: 2px 0;
                border-bottom: 1px solid #ccc;
              }
              .tax-account-item:last-child {
                border-bottom: none;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${imageUrl}" alt="Beleg" class="receipt-image" />
              <div class="tax-account-list">
                <div class="tax-account-title">Artikelsummen nach Steuerkonten:</div>
                ${taxAccountTotals.map(item => `
                  <div class="tax-account-item">
                    ${item.total.toFixed(2).replace('.', ',')} € - ${item.accountNumber} - ${item.accountName}
                  </div>
                `).join('')}
              </div>
            </div>
            <script>
              // Warte bis Bild geladen ist, dann drucken
              (function() {
                let printCalled = false;
                
                function callPrintOnce() {
                  if (!printCalled) {
                    printCalled = true;
                    setTimeout(function() {
                      window.print();
                    }, 300);
                  }
                }
                
                const img = document.querySelector('.receipt-image');
                if (img) {
                  if (img.complete) {
                    callPrintOnce();
                  } else {
                    img.onload = callPrintOnce;
                    img.onerror = callPrintOnce;
                  }
                } else {
                  callPrintOnce();
                }
              })();
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      console.error('Fehler beim Drucken des Beleges:', error);
      alert('Fehler beim Drucken des Beleges. Bitte versuchen Sie es erneut.');
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
                  <th>Notizen</th>
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
                    <td colSpan={10} className="text-center py-4" style={{ color: colors.textSecondary }}>
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
                      <td style={{ maxWidth: '200px' }} title={receipt.notes || ''}>
                        {truncateText(receipt.notes, 50)}
                      </td>
                      <td>{receipt.lineItemCount ?? receipt.receiptDetails?.lineItems?.length ?? 0}</td>
                      <td>{formatPrice(totalGross)}</td>
                      <td className="text-center">
                        {receipt.isCompleted ? (
                          <span className="status-icon text-success" title="Fertig bearbeitet">
                            <FaCheckCircle color="#28a745" />
                          </span>
                        ) : (
                          <span className="status-icon text-warning" title="Unvollständige Artikel">
                            <FaExclamationTriangle color={colors.accent || '#ffc107'} />
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-link btn-action"
                            title="Bearbeiten"
                            onClick={() => handleOpenReceiptReview(receipt)}
                          >
                            <FaPencilAlt />
                          </button>
                          <button
                            className="btn btn-link btn-action"
                            title="Anzeigen"
                            onClick={() => handleOpenReceiptViewer(receipt)}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="btn btn-link btn-action"
                            title="Drucken"
                            onClick={() => handlePrintReceipt(receipt)}
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
        onEdit={handleEditReceipt}
      />

      {/* ReceiptReviewModal für Belege in Bearbeitung */}
      {reviewReceipt && (() => {
        const processedData = reviewReceipt.processedOcrData || {
          articles: [],
          totalArticles: 0,
          totalAmount: 0,
          vat7: 0,
          vat19: 0,
          isCompleted: false
        };
        const articleCount = processedData.articles?.length || 0;
        console.log('📋 [Belegverwaltung] Übergebe Daten an ReceiptReviewModal:', {
          receiptId: reviewReceipt.id,
          hasProcessedOcrData: !!reviewReceipt.processedOcrData,
          articleCount: articleCount,
          hasOcrResult: !!reviewReceipt.ocrResult,
          processedDataKeys: Object.keys(processedData)
        });
        
        return (
          <ReceiptReviewModalWithImage
            key={reviewReceipt.id}
            show={showReceiptReview}
            onClose={() => {
              setShowReceiptReview(false);
              setReviewReceipt(null);
            }}
            receiptData={processedData}
            suppliers={suppliers.map(s => ({
            id: s.id,
            name: s.name,
            contactPerson: s.contactPerson || '',
            email: s.email || '',
            phoneNumbers: s.phoneNumbers.map(p => ({ type: p.type, number: p.number })),
            address: s.address,
            website: s.website || '',
            notes: s.notes || '',
            recognizedNames: s.recognizedNames || [] // WICHTIG: recognizedNames muss mit übergeben werden!
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
          onUpdateReceiptImagePath={async (newPath: string) => {
            // Aktualisiere receiptImagePath nur lokal im State (kein persistentes Speichern)
            // Das Bild wurde bereits beim ersten Speichern nach OCR gespeichert
            // Diese Aktualisierung dient nur zur Pfad-Ergänzung mit Extension
            const updatedReceipt: Receipt = {
              ...reviewReceipt,
              receiptImagePath: newPath
            };
            // Nur lokal speichern, kein persistentes Speichern (verhindert unnötige Speichervorgänge)
            setReviewReceipt(updatedReceipt);
            console.log('💾 [ReceiptReviewModalWithImage] receiptImagePath lokal aktualisiert (ohne persistentes Speichern):', newPath);
          }}
          onUpdateReceiptData={async (updatedData) => {
            // Aktualisiere processedOcrData nur lokal im State (kein persistentes Speichern)
            // Finales Speichern erfolgt nur über onSaveReceipt beim Schließen
            const updatedReceipt: Receipt = {
              ...reviewReceipt,
              processedOcrData: updatedData
            };
            // Nur lokal speichern, kein persistentes Speichern (verhindert unnötige Speichervorgänge)
            setReviewReceipt(updatedReceipt);
            console.log('💾 [ReceiptReviewModalWithImage] processedOcrData lokal aktualisiert (ohne persistentes Speichern)');
          }}
          onSaveReceipt={async (receiptUpdate) => {
            // Finales Speichern beim Schließen des Modals - HIER wird die Fehlermeldung angezeigt
            console.log('💾 [Belegverwaltung] onSaveReceipt aufgerufen:', {
              receiptId: reviewReceipt.id,
              hasProcessedOcrData: !!receiptUpdate.processedOcrData,
              articleCount: receiptUpdate.processedOcrData?.articles?.length || 0,
              hasReceiptDetails: !!receiptUpdate.receiptDetails
            });
            // Aktualisiere Receipt mit den neuen Daten
            const updatedReceipt: Receipt = {
              ...reviewReceipt,
              ...(receiptUpdate.processedOcrData && { processedOcrData: receiptUpdate.processedOcrData }),
              ...(receiptUpdate.receiptDetails && { 
                receiptDetails: receiptUpdate.receiptDetails,
                lineItemCount: receiptUpdate.receiptDetails.lineItems.length
              }),
              ...(receiptUpdate.accounting && { accounting: receiptUpdate.accounting }),
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
            
            // Finales persistentes Speichern - Fehlermeldung wird hier angezeigt (wenn nötig)
            await onUpdateReceipt(updatedReceipt, { suppressQuotaError: false });
            setReviewReceipt(updatedReceipt);
            
            // Wenn abgeschlossen, schließe Modal
            if (receiptUpdate.isCompleted) {
              setShowReceiptReview(false);
              setReviewReceipt(null);
            }
          }}
        />
        );
      })()}

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
                                {config.provider === 'azure' ? 'Azure Form Recognizer' : config.provider === 'taggun' ? 'Taggun.io' : 'Google Gemini'}
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

      {/* Supplier-Auswahl Modal */}
      <SupplierSelectionModal
        show={showSupplierModal}
        onClose={() => {
          setShowSupplierModal(false);
          setPendingOcrResult(null);
        }}
        suppliers={suppliers}
        initialSearchTerm={pendingOcrResult?.ocrResult.supplier || ''}
        colors={colors}
        onSelectSupplier={handleSupplierSelect}
        onCreateSupplier={handleCreateSupplier}
      />
    </div>
  );
};

export default Belegverwaltung;

