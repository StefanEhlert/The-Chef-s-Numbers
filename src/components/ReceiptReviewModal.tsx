import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FaTimes, FaSave, FaEdit, FaPlus, FaImage, FaEuroSign, FaSearch, FaCheck, FaCalculator, FaCoins, FaExclamationTriangle, FaCopy, FaPrint, FaCheckCircle, FaClock, FaPercent, FaCode, FaMinus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ExtendedReceiptData, ReceiptArticle } from '../services/ocrTypes';
import { useArticleForm, Supplier } from '../hooks/useArticleForm';
import { Supplier as SupplierType, PhoneType, ReceiptLineItem } from '../types';
import { ArticleCategory, Unit, Article } from '../types';
import { categoryManager } from '../utils/categoryManager';
import { VAT_RATES, SKR3_TAX_ACCOUNTS } from '../constants/articleConstants';
import { useAppContext } from '../contexts/AppContext';
import { storageLayer } from '../services/storageLayer';
import { UUIDUtils } from '../utils/uuidUtils';
import { AccountingAccount, AccountingSettings, VatRate } from '../types/accounting';
import { AccountingChartId } from '../constants/accountingTemplates';
import CalculatorModal from './ui/CalculatorModal';
import PriceConverterModal from './ui/PriceConverterModal';

interface ReceiptReviewModalProps {
  show: boolean;
  onClose: () => void;
  receiptData: ExtendedReceiptData;
  suppliers: Supplier[];
  colors: any;
  onSave?: (articles: ReceiptArticle[]) => void;
  onNewSupplier?: (supplierName: string) => void;
  receiptImage?: File | string; // Bild als File oder URL
  receiptImagePath?: string; // Vollständiger Dateipfad
  onUpdateReceiptData?: (updatedData: ExtendedReceiptData) => void; // Callback zum Aktualisieren der Receipt-Daten
  receiptId?: string; // ID des Receipts für Updates
  originalOcrResult?: any; // Originales OCR-Ergebnis vom Provider
  onSaveReceipt?: (receiptUpdate: { processedOcrData?: ExtendedReceiptData; receiptDetails?: any; isCompleted?: boolean }) => Promise<void>; // Callback zum Speichern des Receipts
}

const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
  show,
  onClose,
  receiptData,
  suppliers,
  colors,
  onSave,
  onNewSupplier,
  receiptImage,
  receiptImagePath,
  onUpdateReceiptData,
  receiptId,
  onSaveReceipt,
  originalOcrResult
}) => {
  const [selectedArticleIndex, setSelectedArticleIndex] = useState<number>(0);
  const [editedArticles, setEditedArticles] = useState<ReceiptArticle[]>(receiptData.articles);
  const [receiptSupplierId, setReceiptSupplierId] = useState<string>(receiptData.supplierId || '');
  const [receiptSupplierSearchTerm, setReceiptSupplierSearchTerm] = useState<string>('');
  const [scannedSupplierName, setScannedSupplierName] = useState<string>(receiptData.supplier || '');
  const [hideScannedSupplierName, setHideScannedSupplierName] = useState<boolean>(false);
  const [showArticleSearchModal, setShowArticleSearchModal] = useState<boolean>(false);
  const [articleSearchTerm, setArticleSearchTerm] = useState<string>('');
  const [showJsonDialog, setShowJsonDialog] = useState<boolean>(false);
  const [receiptDate, setReceiptDate] = useState<string>(receiptData.date || '');
  const [receiptNumber, setReceiptNumber] = useState<string>(receiptData.receiptNumber || '');
  const [isCompleted, setIsCompleted] = useState<boolean>(receiptData.isCompleted || false);
  const [selectedTaxAccount, setSelectedTaxAccount] = useState<string>('');
  const [showTaxAccountDropdown, setShowTaxAccountDropdown] = useState<boolean>(false);
  const [taxAccountSearchTerm, setTaxAccountSearchTerm] = useState<string>('');
  const [selectedTaxAccountIndex, setSelectedTaxAccountIndex] = useState<number>(-1);
  const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<AccountingChartId>('skr03');
  const [vatRates, setVatRates] = useState<VatRate[]>(VAT_RATES);
  const [receiptVatRate, setReceiptVatRate] = useState<number>(19);
  const [showVatRateDropdown, setShowVatRateDropdown] = useState<boolean>(false);
  const [vatRateSearchTerm, setVatRateSearchTerm] = useState<string>('');
  const [selectedVatRateIndex, setSelectedVatRateIndex] = useState<number>(-1);
  const [nettoPrices, setNettoPrices] = useState<boolean>(false);
  const [showArticleCountControls, setShowArticleCountControls] = useState<boolean>(false);
  
  // Layout-Breiten (in Pixel)
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(receiptData.leftPanelWidth || 300);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(receiptData.rightPanelWidth || 400);
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartLeftWidthRef = useRef<number>(0);
  const resizeStartRightWidthRef = useRef<number>(0);
  
  // Resize-Handler für linkes Panel (Beleg-Übersicht)
  const handleLeftResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
    resizeStartXRef.current = e.clientX;
    resizeStartLeftWidthRef.current = leftPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftPanelWidth]);
  
  // Resize-Handler für rechtes Panel (Original-Beleg)
  const handleRightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
    resizeStartXRef.current = e.clientX;
    resizeStartRightWidthRef.current = rightPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [rightPanelWidth]);
  
  // Mouse-Move Handler für Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        e.preventDefault();
        e.stopPropagation();
        const deltaX = e.clientX - resizeStartXRef.current;
        const newWidth = Math.max(200, Math.min(600, resizeStartLeftWidthRef.current + deltaX));
        setLeftPanelWidth(newWidth);
      } else if (isResizingRight) {
        e.preventDefault();
        e.stopPropagation();
        const deltaX = resizeStartXRef.current - e.clientX; // Umgekehrt, da wir von rechts nach links ziehen
        const newWidth = Math.max(200, Math.min(800, resizeStartRightWidthRef.current + deltaX));
        setRightPanelWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (isResizingLeft || isResizingRight) {
        setIsResizingLeft(false);
        setIsResizingRight(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Speichere Breiten in processedOcrData
        if (onUpdateReceiptDataRef.current) {
          onUpdateReceiptDataRef.current({
            ...receiptDataRef.current,
            leftPanelWidth: leftPanelWidth,
            rightPanelWidth: rightPanelWidth
          });
        }
      }
    };
    
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingLeft, isResizingRight, leftPanelWidth, rightPanelWidth, onUpdateReceiptData]);
  
  // Speichere Breiten beim Ändern (debounced)
  useEffect(() => {
    // Prüfe ob Breiten sich geändert haben (nicht beim ersten Laden)
    if (prevLeftPanelWidthRef.current !== null && 
        prevRightPanelWidthRef.current !== null &&
        !isResizingLeft && 
        !isResizingRight && 
        onUpdateReceiptDataRef.current &&
        (prevLeftPanelWidthRef.current !== leftPanelWidth || 
         prevRightPanelWidthRef.current !== rightPanelWidth)) {
      const timeoutId = setTimeout(() => {
        if (onUpdateReceiptDataRef.current) {
          onUpdateReceiptDataRef.current({
            ...receiptDataRef.current,
            leftPanelWidth: leftPanelWidth,
            rightPanelWidth: rightPanelWidth
          });
        }
      }, 500); // Debounce: Speichere nach 500ms Inaktivität
      
      return () => clearTimeout(timeoutId);
    }
    // Aktualisiere Refs
    prevLeftPanelWidthRef.current = leftPanelWidth;
    prevRightPanelWidthRef.current = rightPanelWidth;
  }, [leftPanelWidth, rightPanelWidth, isResizingLeft, isResizingRight]);
  
  // Funktion: Ermittle vatRate aus Kontonamen
  const extractVatRateFromAccountName = useCallback((accountName: string): number | null => {
    if (!accountName) return null;
    
    // Suche nach MwSt-Sätzen im Kontonamen (z.B. "19%", "7%", "0%")
    // Prüfe zuerst auf explizite Prozentangaben
    const percentMatch = accountName.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      const rate = parseFloat(percentMatch[1]);
      // Prüfe ob es ein gültiger MwSt-Satz ist (0, 7, 19, etc.)
      if (rate === 0 || rate === 7 || rate === 19 || rate === 16 || rate === 5) {
        return rate;
      }
    }
    
    // Fallback: Suche nach Textmustern
    const nameLower = accountName.toLowerCase();
    if (nameLower.includes('19%') || nameLower.includes('19 %') || nameLower.includes('regelsatz')) {
      return 19;
    }
    if (nameLower.includes('7%') || nameLower.includes('7 %') || nameLower.includes('ermäßigt')) {
      return 7;
    }
    if (nameLower.includes('0%') || nameLower.includes('0 %') || nameLower.includes('mwst-frei') || nameLower.includes('steuerfrei')) {
      return 0;
    }
    if (nameLower.includes('16%') || nameLower.includes('16 %')) {
      return 16;
    }
    if (nameLower.includes('5%') || nameLower.includes('5 %')) {
      return 5;
    }
    
    return null;
  }, []);
  
  // Aktualisiere Steuerkonto und vatRate beim Artikelwechsel
  useEffect(() => {
    if (show && editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
      const selectedArticle = editedArticles[selectedArticleIndex];
      setSelectedTaxAccount(selectedArticle.taxAccount || '');
      setTaxAccountSearchTerm('');
      
      // Setze vatRate: zuerst aus Artikel, dann aus Steuerkonto, sonst Standard 19%
      if (selectedArticle.vatRate !== undefined) {
        setReceiptVatRate(selectedArticle.vatRate);
      } else if (selectedArticle.taxAccount) {
        // Versuche vatRate aus Steuerkonto zu ermitteln
        const account = accountingAccounts.find(acc => acc.number === selectedArticle.taxAccount) || 
                        SKR3_TAX_ACCOUNTS.find(acc => acc.number === selectedArticle.taxAccount);
        if (account) {
          const extractedVatRate = extractVatRateFromAccountName(account.name);
          if (extractedVatRate !== null) {
            setReceiptVatRate(extractedVatRate);
            // Aktualisiere auch den Artikel mit der ermittelten vatRate
            const updatedArticles = [...editedArticles];
            updatedArticles[selectedArticleIndex] = {
              ...selectedArticle,
              vatRate: extractedVatRate
            };
            setEditedArticles(updatedArticles);
          } else {
            setReceiptVatRate(19);
          }
        } else {
          setReceiptVatRate(19);
        }
      } else {
        setReceiptVatRate(19);
      }
    }
  }, [selectedArticleIndex, editedArticles, show, accountingAccounts, extractVatRateFromAccountName]);

  // Berechne Artikelsummen nach Steuerkonten gruppiert
  const taxAccountTotals = useMemo(() => {
    const totals: Array<{ accountNumber: string; accountName: string; total: number }> = [];
    const accountMap = new Map<string, number>();

    editedArticles.forEach(article => {
      const accountNumber = article.taxAccount || '';
      if (accountNumber) {
        const currentTotal = accountMap.get(accountNumber) || 0;
        // Berechne Gesamtpreis: bundlePrice * quantity (falls vorhanden)
        const articleTotal = (article.bundlePrice || 0) * (article.quantity || 1);
        accountMap.set(accountNumber, currentTotal + articleTotal);
      }
    });

    // Konvertiere Map zu Array und sortiere nach Kontonummer
    accountMap.forEach((total, accountNumber) => {
      const account = accountingAccounts.find(acc => acc.number === accountNumber) || 
                      SKR3_TAX_ACCOUNTS.find(acc => acc.number === accountNumber);
      totals.push({
        accountNumber,
        accountName: account?.name || 'Unbekanntes Konto',
        total
      });
    });

    // Sortiere nach Kontonummer
    totals.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));

    return totals;
  }, [editedArticles, accountingAccounts]);
  
  // Bildansicht States
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Druck-Preview States
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [printPreviewListPosition, setPrintPreviewListPosition] = useState<{ x: number; y: number }>(
    receiptData.printListPosition || { x: 50, y: 50 }
  ); // Position in Pixeln relativ zum Bild (aus State wiederhergestellt)
  const [printPreviewImageSize, setPrintPreviewImageSize] = useState<{ width: number; height: number } | null>(null); // Bildgröße für Skalierung
  const [isDraggingPrintList, setIsDraggingPrintList] = useState<boolean>(false);
  const printListDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const printImageRef = useRef<HTMLImageElement | null>(null);
  const printPdfRef = useRef<HTMLIFrameElement | null>(null);
  const printPdfCanvasRef = useRef<HTMLImageElement | null>(null);
  const [pdfCanvasUrls, setPdfCanvasUrls] = useState<string[]>([]); // Array von Canvas-URLs, eine pro Seite (für Druck)
  const [displayPdfCanvasUrls, setDisplayPdfCanvasUrls] = useState<string[]>([]); // Array von Canvas-URLs für Anzeige im Original-Beleg
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(0); // Aktuelle PDF-Seite für Anzeige
  const prevPositionRef = useRef<{ x: number; y: number } | null>(null); // Referenz für vorherige Position zum Vermeiden von Endlosschleifen
  const prevCompletedRef = useRef<boolean | null>(null); // Referenz für vorherigen Fertig-Status zum Vermeiden von Endlosschleifen
  const prevImageZoomRef = useRef<number | null>(null); // Referenz für vorherigen Zoom zum Vermeiden von Endlosschleifen
  const prevImagePositionRef = useRef<{ x: number; y: number } | null>(null); // Referenz für vorherige Bildposition zum Vermeiden von Endlosschleifen
  const receiptDataRef = useRef<ExtendedReceiptData>(receiptData); // Ref für receiptData, um Endlosschleifen zu vermeiden
  const onUpdateReceiptDataRef = useRef(onUpdateReceiptData); // Ref für onUpdateReceiptData, um Endlosschleifen zu vermeiden
  const prevLeftPanelWidthRef = useRef<number | null>(null); // Referenz für vorherige linke Panel-Breite
  const prevRightPanelWidthRef = useRef<number | null>(null); // Referenz für vorherige rechte Panel-Breite
  
  // Scan-Daten (aus OCR)
  const [scanTotals, setScanTotals] = useState<{
    totalAmount: number;
    vat7: number;
    vat19: number;
  }>({
    totalAmount: receiptData.totalAmount || 0,
    vat7: receiptData.vat7 || 0,
    vat19: receiptData.vat19 || 0
  });
  
  // App Context für Zugriff auf Artikel und Lieferanten
  const { state, dispatch } = useAppContext();

  // Refs für Dropdown-Positionierung
  const bundleUnitContainerRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const contentUnitContainerRef = useRef<HTMLDivElement>(null);
  const taxAccountDropdownRef = useRef<HTMLDivElement>(null);
  const taxAccountDropdownListRef = useRef<HTMLDivElement>(null);
  
  // Refs für Dropdown-Listen (für Scroll-Funktionalität)
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const bundleUnitDropdownRef = useRef<HTMLDivElement>(null);
  const contentUnitDropdownRef = useRef<HTMLDivElement>(null);
  const vatRateDropdownRef = useRef<HTMLDivElement>(null);
  const vatRateDropdownListRef = useRef<HTMLDivElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const vatRateInputRef = useRef<HTMLInputElement>(null);
  const bundleUnitInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const previousQuantityRef = useRef<number>(1);
  const previousLinkedArticleIdRef = useRef<string | undefined>(undefined);
  const isLinkingRef = useRef<boolean>(false);
  const isChangingArticleRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isInitializedRef = useRef<boolean>(false);
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);

  // Artikelformular-Hook für den rechten Bereich
  const {
    // State
    articleForm,
    showCategoryDropdown,
    categorySearchTerm,
    selectedCategoryIndex,
    showSupplierDropdown,
    supplierSearchTerm,
    selectedSupplierIndex,
    showBundleUnitDropdown,
    bundleUnitSearchTerm,
    selectedBundleUnitIndex,
    showContentUnitDropdown,
    contentUnitSearchTerm,
    selectedContentUnitIndex,
    showAdditivesDropdown,
    showAllergensDropdown,
    selectedVatRate,
    showPriceConverter,
    showCalculator,
    bundlePriceInput,
    contentInput,
    pricePerUnitInput,
    
    // Setters
    setArticleForm,
    setBundlePriceInput,
    setContentInput,
    setPricePerUnitInput,
    setShowCategoryDropdown,
    setSelectedCategoryIndex,
    setShowSupplierDropdown,
    setSelectedSupplierIndex,
    setShowBundleUnitDropdown,
    setSelectedBundleUnitIndex,
    setShowContentUnitDropdown,
    setSelectedContentUnitIndex,
    setSelectedVatRate,
    setShowPriceConverter,
    setShowCalculator,
    
    // Event-Handler
    handleCategorySelect,
    handleCategoryInputChange,
    handleCategoryInputBlur,
    handleCategoryKeyDown,
    handleArticleNameChange,
    handleSupplierSelect,
    handleSupplierInputChange,
    handleSupplierInputBlur,
    handleSupplierKeyDown,
    handleBundleUnitSelect,
    handleBundleUnitInputChange,
    handleBundleUnitInputBlur,
    handleBundleUnitKeyDown,
    handleContentUnitSelect,
    handleContentUnitInputChange,
    handleContentUnitInputBlur,
    handleContentUnitKeyDown,
    handleAdditiveToggle,
    handleAllergenToggle,
    handlePriceChange,
    handleContentChange,
    handleApplyGrossPrice,
    handleApplyNetPrice,
    handleCalculatorResult,
    calculatePricePerUnit,
    calculateGrossPrice,
    calculateNetPrice,
    formatPrice,
    getFilteredCategories,
    getFilteredSuppliers,
    getFilteredBundleUnits,
    getFilteredContentUnits,
    getSupplierName,
    
    // Konstanten
    CATEGORIES,
    UNITS,
    ADDITIVES,
    ALLERGENS
  } = useArticleForm(suppliers, onNewSupplier, []);

  // Hilfsfunktion: Finde das längste Wort in einem Text
  const getLongestWord = (text: string): string => {
    if (!text || !text.trim()) {
      return '';
    }
    
    // Teile Text in Wörter auf (nur alphanumerische Zeichen und Bindestriche)
    const words = text
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    if (words.length === 0) {
      return '';
    }
    
    // Finde das längste Wort
    const longestWord = words.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
    
    return longestWord;
  };

  // Formatierungsfunktion für Datum (tt.mm.jj)
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Nicht erkannt';
    
    try {
      // Versuche das Datum zu parsen (kann ISO-Format YYYY-MM-DD oder anderes Format sein)
      const date = new Date(dateString);
      
      // Prüfe ob Datum gültig ist
      if (isNaN(date.getTime())) {
        // Wenn kein gültiges Datum, versuche direkt zu formatieren wenn es bereits im Format YYYY-MM-DD ist
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const parts = dateString.split('-');
          return `${parts[2]}.${parts[1]}.${parts[0].substring(2)}`;
        }
        return dateString; // Fallback: original zurückgeben
      }
      
      // Formatiere als tt.mm.jj
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).substring(2);
      
      return `${day}.${month}.${year}`;
    } catch (error) {
      return dateString; // Fallback: original zurückgeben
    }
  };

  // Validierungsfunktionen
  const isArticleValid = (article: ReceiptArticle): boolean => {
    return !!(
      article.name &&
      article.name.trim() !== '' &&
      receiptSupplierId &&
      receiptSupplierId.trim() !== '' &&
      receiptSupplierSearchTerm &&
      receiptSupplierSearchTerm.trim() !== '' &&
      receiptSupplierSearchTerm !== 'Kein Lieferant ausgewählt!' &&
      article.bundleUnit &&
      article.bundleUnit.trim() !== '' &&
      article.bundlePrice &&
      article.bundlePrice > 0 &&
      article.content &&
      article.content > 0 &&
      article.contentUnit &&
      article.contentUnit.trim() !== ''
    );
  };

  const isArticleComplete = (article: ReceiptArticle): boolean => {
    return isArticleValid(article);
  };

  // Validierung für einzelne Felder
  const isFieldInvalid = (fieldName: string, value: any): boolean => {
    switch (fieldName) {
      case 'name':
        return !value || value.trim() === '';
      case 'supplier':
        return !receiptSupplierId || receiptSupplierSearchTerm === 'Kein Lieferant ausgewählt!';
      case 'bundleUnit':
        return !value || value.trim() === '';
      case 'bundlePrice':
        return !value || value <= 0;
      case 'content':
        return !value || value <= 0;
      case 'contentUnit':
        return !value || value.trim() === '';
      default:
        return false;
    }
  };

  // Wrapper für handleArticleNameChange mit automatischer Kategorieerkennung
  const handleArticleNameChangeWithCategory = (name: string) => {
    // Aktualisiere den Artikelnamen
    handleArticleNameChange(name);
    
    // Prüfe, ob das längste Wort mit einer Kategorie übereinstimmt
    const longestWord = getLongestWord(name);
    
    if (longestWord) {
      // Prüfe auf exakte Übereinstimmung mit einer Kategorie
      const matchingCategory = CATEGORIES.find(category => 
        category.toLowerCase() === longestWord.toLowerCase()
      );
      
      if (matchingCategory && articleForm.category !== matchingCategory) {
        // Kategorie automatisch setzen
        setArticleForm(prev => ({
          ...prev,
          category: matchingCategory
        }));
        console.log(`✅ Kategorie automatisch erkannt: "${matchingCategory}" (aus Wort: "${longestWord}")`);
      }
    }
  };

  // Automatische Verknüpfung beim Anwählen eines Artikels
  useEffect(() => {
    // Wichtig: Nur ausführen wenn Modal geöffnet ist!
    if (!show) return;
    
    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
      const selectedArticle = editedArticles[selectedArticleIndex];
      
      // Aktualisiere previousQuantityRef bei Artikelwechsel
      previousQuantityRef.current = selectedArticle.quantity || 1;
      
      console.log('🔍 [AUTO-LINK] Prüfe Artikel:', {
        name: selectedArticle.name,
        nameOCR: selectedArticle.nameOCR,
        supplierArticleNumber: selectedArticle.supplierArticleNumber,
        receiptSupplierId,
        linkedArticleId: selectedArticle.linkedArticleId
      });
      
      // Versuche automatische Verknüpfung wenn noch nicht verknüpft und Lieferant vorhanden
      if (!selectedArticle.linkedArticleId && receiptSupplierId) {
        let matchingArticles: Article[] = [];
        
        // Zuerst versuchen nach Lieferant + Artikelnummer zu suchen (höchste Priorität)
        if (selectedArticle.supplierArticleNumber) {
          console.log('🔍 [AUTO-LINK] Suche nach Lieferant + Artikelnummer:', {
            supplierId: receiptSupplierId,
            supplierArticleNumber: selectedArticle.supplierArticleNumber
          });
          
          matchingArticles = state.articles.filter(article => 
            article.supplierId === receiptSupplierId &&
            article.supplierArticleNumber === selectedArticle.supplierArticleNumber
          );
          
          console.log('📊 [AUTO-LINK] Treffer nach Artikelnummer:', matchingArticles.length, matchingArticles.map(a => ({ id: a.id, name: a.name })));
        }
        
        // Wenn kein Treffer und nameOCR vorhanden, suche nach nameOCR
        if (matchingArticles.length === 0 && selectedArticle.nameOCR) {
          const nameOCRLower = selectedArticle.nameOCR.toLowerCase().trim();
          console.log('🔍 [AUTO-LINK] Suche nach Lieferant + OCR-Name:', {
            supplierId: receiptSupplierId,
            nameOCR: selectedArticle.nameOCR,
            nameOCRLower
          });
          
          // Zeige alle Artikel des Lieferanten für Debugging
          const supplierArticles = state.articles.filter(a => a.supplierId === receiptSupplierId);
          console.log('📊 [AUTO-LINK] Alle Artikel des Lieferanten:', supplierArticles.length, supplierArticles.map(a => ({
            id: a.id,
            name: a.name,
            namesOCR: a.namesOCR
          })));
          
          matchingArticles = state.articles.filter(article => {
            if (article.supplierId !== receiptSupplierId) return false;
            
            // Suche in namesOCR Array
            if (article.namesOCR && article.namesOCR.length > 0) {
              const found = article.namesOCR.some((ocrName: string) => 
                ocrName.toLowerCase().trim() === nameOCRLower
              );
              if (found) {
                console.log('✅ [AUTO-LINK] OCR-Name gefunden in Artikel:', {
                  articleId: article.id,
                  articleName: article.name,
                  namesOCR: article.namesOCR,
                  searchedName: nameOCRLower
                });
              }
              return found;
            }
            
            return false;
          });
          
          console.log('📊 [AUTO-LINK] Treffer nach OCR-Name:', matchingArticles.length, matchingArticles.map(a => ({ id: a.id, name: a.name })));
        }
        
        // Wenn genau ein Treffer, automatisch verknüpfen
        if (matchingArticles.length === 1) {
          const linkedArticle = matchingArticles[0];
          const updatedArticles = [...editedArticles];
          
          // Übernehme Daten aus dem bestehenden Artikel
          updatedArticles[selectedArticleIndex] = {
            ...updatedArticles[selectedArticleIndex],
            linkedArticleId: linkedArticle.id,
            // WICHTIG: Übernehme Namen aus dem Artikelstamm, nicht aus OCR!
            name: linkedArticle.name || selectedArticle.name || '',
            // Übernehme wichtige Felder aus dem bestehenden Artikel
            category: linkedArticle.category || selectedArticle.category || '',
            bundleUnit: linkedArticle.bundleUnit || selectedArticle.bundleUnit || 'Stück',
            contentUnit: linkedArticle.contentUnit || selectedArticle.contentUnit || 'Stück',
            // Behalte Preise aus dem Scan (können sich geändert haben)
            bundlePrice: selectedArticle.bundlePrice || linkedArticle.bundlePrice || 0,
            pricePerUnit: selectedArticle.pricePerUnit || linkedArticle.pricePerUnit || 0,
            content: linkedArticle.content || selectedArticle.content || 1,
            // Übernehme weitere Felder aus dem bestehenden Artikel
            supplierArticleNumber: linkedArticle.supplierArticleNumber || selectedArticle.supplierArticleNumber || '',
            bundleEanCode: linkedArticle.bundleEanCode || selectedArticle.bundleEanCode || '',
            contentEanCode: linkedArticle.contentEanCode || selectedArticle.contentEanCode || '',
            allergens: linkedArticle.allergens || selectedArticle.allergens || [],
            additives: linkedArticle.additives || selectedArticle.additives || [],
            ingredients: linkedArticle.ingredients || selectedArticle.ingredients || '',
            nutrition: linkedArticle.nutritionInfo ? {
              calories: linkedArticle.nutritionInfo.calories || 0,
              kilojoules: linkedArticle.nutritionInfo.kilojoules || 0,
              protein: linkedArticle.nutritionInfo.protein || 0,
              fat: linkedArticle.nutritionInfo.fat || 0,
              carbohydrates: linkedArticle.nutritionInfo.carbohydrates || 0,
              fiber: linkedArticle.nutritionInfo.fiber ?? 0,
              sugar: linkedArticle.nutritionInfo.sugar ?? 0,
              salt: linkedArticle.nutritionInfo.salt ?? 0,
              alcohol: linkedArticle.nutritionInfo.alcohol
            } : (selectedArticle.nutrition || {
              calories: 0,
              kilojoules: 0,
              protein: 0,
              fat: 0,
              carbohydrates: 0,
              fiber: 0,
              sugar: 0,
              salt: 0,
              alcohol: undefined
            }),
            openFoodFactsCode: linkedArticle.openFoodFactsCode || selectedArticle.openFoodFactsCode || '',
            notes: linkedArticle.notes || selectedArticle.notes || ''
          };
          
          setEditedArticles(updatedArticles);
          console.log('✅ Automatische Verknüpfung:', linkedArticle.name, selectedArticle.supplierArticleNumber ? `(Art-Nr: ${selectedArticle.supplierArticleNumber})` : `(OCR-Name: ${selectedArticle.nameOCR})`);
          console.log('📋 [AUTO-LINK] Übernommene Daten:', {
            category: linkedArticle.category,
            bundleUnit: linkedArticle.bundleUnit,
            contentUnit: linkedArticle.contentUnit
          });
          return; // Früh beenden, damit der zweite Effect die Änderung verarbeitet
        } else if (matchingArticles.length > 1) {
          console.warn('⚠️ [AUTO-LINK] Mehrere Treffer gefunden:', matchingArticles.length, matchingArticles.map(a => ({ id: a.id, name: a.name })));
        } else {
          console.log('❌ [AUTO-LINK] Keine Treffer gefunden');
        }
      } else {
        if (selectedArticle.linkedArticleId) {
          console.log('ℹ️ [AUTO-LINK] Artikel bereits verknüpft:', selectedArticle.linkedArticleId);
        } else if (!receiptSupplierId) {
          console.log('ℹ️ [AUTO-LINK] Kein Lieferant ausgewählt, überspringe Verknüpfung');
        }
      }
      
      // Berechne price, falls er fehlt oder 0 ist
      const quantity = selectedArticle.quantity || 1;
      let calculatedPrice = selectedArticle.price;
      if (!calculatedPrice || calculatedPrice === 0) {
        // Berechne price aus bundlePrice und quantity
        if (selectedArticle.bundlePrice) {
          calculatedPrice = selectedArticle.bundlePrice * quantity;
        } else {
          calculatedPrice = 0;
        }
      }
      
      // Aktualisiere Artikel mit berechnetem price, falls nötig
      if (calculatedPrice !== selectedArticle.price) {
        const updatedArticles = [...editedArticles];
        updatedArticles[selectedArticleIndex] = {
          ...selectedArticle,
          price: calculatedPrice
        };
        setEditedArticles(updatedArticles);
      }
      
      // Fülle Artikelformular mit Daten des ausgewählten Artikels
      // Nur wenn sich die Daten tatsächlich unterscheiden
      const newFormData = {
        name: selectedArticle.name || '',
        category: selectedArticle.category || '',
        supplierId: receiptSupplierId || selectedArticle.supplierId || receiptData.supplierId || '',
        supplierArticleNumber: selectedArticle.supplierArticleNumber || '',
        bundleUnit: selectedArticle.bundleUnit || 'Stück',
        bundlePrice: selectedArticle.bundlePrice || 0,
        bundleEanCode: selectedArticle.bundleEanCode || '',
        // Bei neuen Artikeln (nicht verknüpft): content immer 1
        // Bei verknüpften Artikeln: content aus Artikel, aber mindestens 1
        content: selectedArticle.linkedArticleId ? (selectedArticle.content || 1) : 1,
        contentUnit: selectedArticle.contentUnit || 'Stück',
        contentEanCode: selectedArticle.contentEanCode || '',
        pricePerUnit: selectedArticle.pricePerUnit || 0,
        allergens: selectedArticle.allergens || [],
        additives: selectedArticle.additives || [],
        ingredients: selectedArticle.ingredients || '',
        nutrition: selectedArticle.nutrition || {
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
        openFoodFactsCode: selectedArticle.openFoodFactsCode || '',
        notes: selectedArticle.notes || ''
      };
      
      // Beim Artikelwechsel IMMER das Formular aktualisieren, auch wenn sich die Daten nicht unterscheiden
      // Dies verhindert, dass alte Formularwerte in den neuen Artikel geschrieben werden
      isChangingArticleRef.current = true;
      setArticleForm(newFormData);
      
      // Setze Flag nach kurzer Verzögerung zurück, damit Sync-Effect nicht sofort auslöst
      setTimeout(() => {
        isChangingArticleRef.current = false;
      }, 100);
      
      // Setze Suchbegriff für Artikel-Suche auf OCR-Namen (falls vorhanden) oder längstes Wort des Artikelnamens
      const searchTerm = selectedArticle.nameOCR || getLongestWord(selectedArticle.name || '');
      setArticleSearchTerm(searchTerm);
      
      // Aktualisiere auch Input-Felder mit deutschem Format
      // Für neue Artikel (nicht verknüpft): content immer 1, bundlePrice sollte bereits Einzelpreis sein
      const contentValue = selectedArticle.linkedArticleId ? (selectedArticle.content || 1) : 1;
      setBundlePriceInput((selectedArticle.bundlePrice || 0).toFixed(2).replace('.', ','));
      setContentInput(contentValue.toFixed(2).replace('.', ','));
      setPricePerUnitInput((selectedArticle.pricePerUnit || 0).toFixed(2).replace('.', ','));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArticleIndex, receiptSupplierId, show]); // editedArticles entfernt, um Endlosschleife zu vermeiden

  // Separater Effect: Reagiere auf Änderungen der linkedArticleId des aktuellen Artikels
  // (z.B. wenn autoLinkAllArticles einen Artikel verlinkt)
  useEffect(() => {
    if (!show) return;
    
    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
      const selectedArticle = editedArticles[selectedArticleIndex];
      const currentLinkedArticleId = selectedArticle.linkedArticleId;
      
      // Prüfe, ob sich die linkedArticleId geändert hat
      if (previousLinkedArticleIdRef.current !== currentLinkedArticleId && currentLinkedArticleId) {
        console.log('🔄 [LINK-CHANGE] linkedArticleId geändert, aktualisiere Formular:', {
          previous: previousLinkedArticleIdRef.current,
          current: currentLinkedArticleId,
          articleName: selectedArticle.name
        });
        
        // Setze Flag, um Sync-Effect während Verlinkung zu überspringen
        isLinkingRef.current = true;
        
        // Aktualisiere Ref
        previousLinkedArticleIdRef.current = currentLinkedArticleId;
        
        // Fülle Artikelformular mit Daten des verlinkten Artikels
        const newFormData = {
          name: selectedArticle.name || '',
          category: selectedArticle.category || '',
          supplierId: receiptSupplierId || selectedArticle.supplierId || receiptData.supplierId || '',
          supplierArticleNumber: selectedArticle.supplierArticleNumber || '',
          bundleUnit: selectedArticle.bundleUnit || 'Stück',
          bundlePrice: selectedArticle.bundlePrice || 0,
          bundleEanCode: selectedArticle.bundleEanCode || '',
          content: selectedArticle.linkedArticleId ? (selectedArticle.content || 1) : 1,
          contentUnit: selectedArticle.contentUnit || 'Stück',
          contentEanCode: selectedArticle.contentEanCode || '',
          pricePerUnit: selectedArticle.pricePerUnit || 0,
          vatRate: selectedArticle.vatRate || 19,
          allergens: selectedArticle.allergens || [],
          additives: selectedArticle.additives || [],
          ingredients: selectedArticle.ingredients || '',
          nutrition: selectedArticle.nutrition || {
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
          openFoodFactsCode: selectedArticle.openFoodFactsCode || '',
          notes: selectedArticle.notes || ''
        };
        
        setArticleForm(newFormData);
        
        // Aktualisiere Input-Felder
        const contentValue = selectedArticle.linkedArticleId ? (selectedArticle.content || 1) : 1;
        setBundlePriceInput((selectedArticle.bundlePrice || 0).toFixed(2).replace('.', ','));
        setContentInput(contentValue.toFixed(2).replace('.', ','));
        setPricePerUnitInput((selectedArticle.pricePerUnit || 0).toFixed(2).replace('.', ','));
        
        // Reset Flag nach kurzer Verzögerung, damit Sync-Effect nicht sofort auslöst
        setTimeout(() => {
          isLinkingRef.current = false;
        }, 100);
      } else if (previousLinkedArticleIdRef.current !== currentLinkedArticleId) {
        // Auch Ref aktualisieren wenn sich auf undefined ändert
        previousLinkedArticleIdRef.current = currentLinkedArticleId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedArticles, selectedArticleIndex, show]); // Reagiere nur auf editedArticles-Änderungen, nicht auf jeden Render

  // Funktion zum Anwenden des aktuellen MwSt-Satzes auf alle Artikel
  // ENTFERNT: vatRate wurde durch accountingAccountNumber ersetzt
  // const applyVatRateToAllArticles = () => {
  //   // Diese Funktion ist nicht mehr relevant, da vatRate entfernt wurde
  // };

  // Funktion zum Anwenden des aktuellen Steuerkontos auf alle Artikel
  const applyTaxAccountToAllArticles = () => {
    if (!selectedTaxAccount) {
      console.warn('⚠️ Kein Steuerkonto ausgewählt');
      return;
    }
    const updatedArticles = editedArticles.map(article => ({
      ...article,
      taxAccount: selectedTaxAccount
    }));
    setEditedArticles(updatedArticles);
    console.log(`✅ Steuerkonto ${selectedTaxAccount} auf alle ${updatedArticles.length} Artikel angewendet`);
  };

  // Funktion zum Hinzufügen eines neuen leeren Artikels vor dem aktuell ausgewählten Artikel
  const handleAddArticle = useCallback(() => {
    const newArticle: ReceiptArticle = {
      name: '',
      nameOCR: '',
      quantity: 1,
      bundleUnit: 'Stück',
      bundlePrice: 0,
      price: 0,
      pricePerUnit: 0,
      content: 1,
      contentUnit: 'Stück',
      supplierId: receiptSupplierId || '',
      taxAccount: selectedTaxAccount || '',
      vatRate: receiptVatRate || 19,
      category: '',
      supplierArticleNumber: '',
      bundleEanCode: '',
      contentEanCode: '',
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
      excludeFromUpdate: false
    };
    
    const updatedArticles = [...editedArticles];
    // Füge neuen Artikel vor dem aktuell ausgewählten Artikel ein
    updatedArticles.splice(selectedArticleIndex, 0, newArticle);
    setEditedArticles(updatedArticles);
    
    // Fülle Formular sofort mit den Werten des neuen Artikels
    const newFormData = {
      name: newArticle.name || '',
      category: newArticle.category || '',
      supplierId: receiptSupplierId || newArticle.supplierId || '',
      supplierArticleNumber: newArticle.supplierArticleNumber || '',
      bundleUnit: newArticle.bundleUnit || 'Stück',
      bundlePrice: newArticle.bundlePrice || 0,
      bundleEanCode: newArticle.bundleEanCode || '',
      content: newArticle.content || 1,
      contentUnit: newArticle.contentUnit || 'Stück',
      contentEanCode: newArticle.contentEanCode || '',
      pricePerUnit: newArticle.pricePerUnit || 0,
      allergens: newArticle.allergens || [],
      additives: newArticle.additives || [],
      ingredients: newArticle.ingredients || '',
      nutrition: newArticle.nutrition || {
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
      openFoodFactsCode: newArticle.openFoodFactsCode || '',
      notes: newArticle.notes || ''
    };
    
    // Setze Flag, um Sync-Effect während Artikelwechsel zu überspringen
    isChangingArticleRef.current = true;
    setArticleForm(newFormData);
    
    // Aktualisiere auch Input-Felder mit deutschem Format
    const contentValue = newArticle.content || 1;
    setBundlePriceInput((newArticle.bundlePrice || 0).toFixed(2).replace('.', ','));
    setContentInput(contentValue.toFixed(2).replace('.', ','));
    setPricePerUnitInput((newArticle.pricePerUnit || 0).toFixed(2).replace('.', ','));
    
    // Setze Suchbegriff zurück
    setArticleSearchTerm('');
    
    // Aktualisiere previousQuantityRef
    previousQuantityRef.current = newArticle.quantity || 1;
    
    // Setze Flag nach kurzer Verzögerung zurück
    setTimeout(() => {
      isChangingArticleRef.current = false;
    }, 100);
    
    console.log('✅ Neuer Artikel hinzugefügt an Position', selectedArticleIndex);
  }, [editedArticles, selectedArticleIndex, receiptSupplierId, selectedTaxAccount, receiptVatRate, setArticleForm, setBundlePriceInput, setContentInput, setPricePerUnitInput, setArticleSearchTerm]);

  // Funktion zum Entfernen des aktuell ausgewählten Artikels
  const handleRemoveArticle = useCallback(() => {
    if (editedArticles.length <= 1) {
      console.warn('⚠️ Kann nicht den letzten Artikel entfernen');
      return;
    }
    
    const updatedArticles = [...editedArticles];
    updatedArticles.splice(selectedArticleIndex, 1);
    setEditedArticles(updatedArticles);
    
    // Passe selectedArticleIndex an, falls nötig
    const newIndex = selectedArticleIndex >= updatedArticles.length 
      ? updatedArticles.length - 1 
      : selectedArticleIndex;
    setSelectedArticleIndex(newIndex);
    
    console.log('✅ Artikel entfernt von Position', selectedArticleIndex);
  }, [editedArticles, selectedArticleIndex]);

  // Handler für Lieferanten-Auswahl für alle Artikel
  const handleReceiptSupplierSelect = async (supplier: Supplier | null) => {
    if (supplier) {
      setReceiptSupplierId(supplier.id);
      setReceiptSupplierSearchTerm(supplier.name);
      
      // Übernehme nettoPrices vom Lieferanten
      const supplierNettoPrices = (supplier as any).nettoPrices || false;
      setNettoPrices(supplierNettoPrices);
      
      // Setze supplierId für alle Artikel
      const updatedArticles = editedArticles.map(article => ({
        ...article,
        supplierId: supplier.id
      }));
      setEditedArticles(updatedArticles);
      
      // Aktualisiere auch articleForm für den aktuell ausgewählten Artikel
      setArticleForm(prev => ({
        ...prev,
        supplierId: supplier.id
      }));
    } else {
      // Kein Lieferant ausgewählt
      setReceiptSupplierId('');
      setReceiptSupplierSearchTerm('');
      setNettoPrices(false); // Reset auf Brutto
      
      // Setze supplierId für alle Artikel auf leer
      const updatedArticles = editedArticles.map(article => ({
        ...article,
        supplierId: ''
      }));
      setEditedArticles(updatedArticles);
      
      // Aktualisiere auch articleForm für den aktuell ausgewählten Artikel
      setArticleForm(prev => ({
        ...prev,
        supplierId: ''
      }));
    }
    setShowSupplierDropdown(false);
  };
  
  // Handler für Änderung der Netto-Preise Checkbox
  const handleNettoPricesChange = async (checked: boolean) => {
    console.log('🔄 [NETTO-PREISE] Checkbox geändert:', checked);
    console.log('🔄 [NETTO-PREISE] Aktueller State vor Update:', nettoPrices);
    
    // Setze State sofort
    setNettoPrices(checked);
    
    // Aktualisiere Lieferant, wenn einer ausgewählt ist
    if (receiptSupplierId) {
      try {
        // Verwende State statt props, falls props nicht aktualisiert wurden
        const supplierFromState = state.suppliers.find(s => s.id === receiptSupplierId);
        const supplier = supplierFromState || suppliers.find(s => s.id === receiptSupplierId);
        
        if (supplier) {
          console.log('🔄 [NETTO-PREISE] Aktualisiere Lieferant:', supplier.name, 'von', supplier.nettoPrices, 'zu', checked);
          
          const updatedSupplier = {
            ...supplier,
            nettoPrices: checked,
            isDirty: true,
            updatedAt: new Date()
          };
          
          // Speichere über StorageLayer
          const success = await storageLayer.save('suppliers', [updatedSupplier]);
          if (success) {
            // Aktualisiere globalen State
            dispatch({ 
              type: 'UPDATE_SUPPLIER', 
              payload: { id: supplier.id, supplier: updatedSupplier }
            });
            console.log('✅ Netto-Preise Einstellung im Lieferanten aktualisiert:', checked);
          } else {
            console.error('❌ Fehler beim Speichern des Lieferanten');
          }
        } else {
          console.warn('⚠️ [NETTO-PREISE] Lieferant nicht gefunden:', receiptSupplierId);
        }
      } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Netto-Preise Einstellung:', error);
      }
    } else {
      console.log('ℹ️ [NETTO-PREISE] Kein Lieferant ausgewählt, nur State aktualisiert');
    }
  };

  // Reset aller States beim Schließen des Modals
  useEffect(() => {
    if (!show) {
      // Reset Initialisierungs-Flag
      isInitializedRef.current = false;
      // Setze articleForm zurück auf leere Werte
      setArticleForm({
        name: '',
        category: '',
        supplierId: '',
        supplierArticleNumber: '',
        bundleUnit: 'Stück',
        bundlePrice: 0,
        bundleEanCode: '',
        content: 1,
        contentUnit: 'Stück',
        contentEanCode: '',
        pricePerUnit: 0,
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
        notes: ''
      });
      // Reset Input-Felder
      setBundlePriceInput('0,00');
      setContentInput('1,00');
      setPricePerUnitInput('0,00');
      // Reset weitere States
      setSelectedArticleIndex(0);
      setReceiptSupplierId('');
      setReceiptSupplierSearchTerm('');
      setScannedSupplierName('');
      setHideScannedSupplierName(false);
      setReceiptDate('');
      setReceiptNumber('');
      setArticleSearchTerm('');
      console.log('🧹 [RESET] Alle States beim Schließen zurückgesetzt');
    }
  }, [show]);

  // Aktualisiere editedArticles wenn articleForm sich ändert
  useEffect(() => {
    // Wichtig: Nur ausführen wenn Modal geöffnet ist!
    if (!show) return;
    
    // WICHTIG: Überspringe Sync während Verlinkung, um Endlosschleife zu vermeiden!
    if (isLinkingRef.current) {
      console.log('⏭️ [SYNC] Überspringe Sync - Verlinkung läuft gerade');
      return;
    }
    
    // WICHTIG: Überspringe Sync während Artikelwechsel, um zu verhindern, dass alte Formularwerte
    // in den neuen Artikel geschrieben werden
    if (isChangingArticleRef.current) {
      console.log('⏭️ [SYNC] Überspringe Sync - Artikelwechsel läuft gerade');
      return;
    }
    
    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
      const currentArticle = editedArticles[selectedArticleIndex];
      
      // WICHTIG: Wenn articleForm gerade zurückgesetzt wurde (leerer Name),
      // aber der Artikel bereits einen Namen hat, dann nicht synchronisieren!
      // Der Artikelwechsel-Effect sollte zuerst laufen und articleForm mit den korrekten Daten füllen.
      if (!articleForm.name && currentArticle.name) {
        console.log('⏭️ [SYNC] Überspringe Sync - articleForm wird gerade initialisiert');
        return;
      }
      
      const updatedArticle = {
        ...currentArticle,
        ...articleForm,
        supplierId: receiptSupplierId, // Immer die receiptSupplierId verwenden
        taxAccount: selectedTaxAccount,
        vatRate: receiptVatRate
      };
      
      // Berechne price neu, wenn bundlePrice oder quantity vorhanden sind
      const quantity = updatedArticle.quantity || 1;
      if (updatedArticle.bundlePrice !== undefined) {
        updatedArticle.price = updatedArticle.bundlePrice * quantity;
      } else if (!updatedArticle.price && currentArticle.bundlePrice) {
        // Falls price fehlt, aber bundlePrice vorhanden ist, berechne price
        updatedArticle.price = currentArticle.bundlePrice * quantity;
      }
      
      // Nur aktualisieren, wenn sich Daten tatsächlich unterscheiden
      const articleChanged = JSON.stringify(currentArticle) !== JSON.stringify(updatedArticle);
      if (articleChanged) {
        const updatedArticles = [...editedArticles];
        updatedArticles[selectedArticleIndex] = updatedArticle;
        setEditedArticles(updatedArticles);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleForm, receiptSupplierId, selectedArticleIndex, show]); // show hinzugefügt

  // Funktion für automatische Verknüpfung aller Artikel
  const autoLinkAllArticles = (articles: ReceiptArticle[], supplierId: string) => {
    console.log('🔗 [AUTO-LINK-ALL] Starte Verknüpfung für', articles.length, 'Artikel mit Lieferant', supplierId);
    console.log('🔗 [AUTO-LINK-ALL] Verfügbare Artikel in state.articles:', state.articles.length);
    
    const updatedArticles = articles.map((article, index) => {
      // Überspringe bereits verknüpfte Artikel
      if (article.linkedArticleId) {
        console.log(`⏭️ [AUTO-LINK-ALL] Artikel ${index + 1} bereits verknüpft:`, article.linkedArticleId);
        return article;
      }
      
      console.log(`🔍 [AUTO-LINK-ALL] Prüfe Artikel ${index + 1}:`, {
        name: article.name,
        nameOCR: article.nameOCR,
        supplierArticleNumber: article.supplierArticleNumber
      });
      
      let matchingArticles: Article[] = [];
      
      // Zuerst versuchen nach Lieferant + Artikelnummer zu suchen (höchste Priorität)
      if (article.supplierArticleNumber) {
        matchingArticles = state.articles.filter(a => 
          a.supplierId === supplierId &&
          a.supplierArticleNumber === article.supplierArticleNumber
        );
        
        console.log(`📊 [AUTO-LINK-ALL] Artikel ${index + 1} - Treffer nach Artikelnummer:`, matchingArticles.length);
        
        if (matchingArticles.length === 1) {
          const linkedArticle = matchingArticles[0];
          console.log(`✅ [AUTO-LINK-ALL] Artikel ${index + 1} verknüpft per Artikelnummer:`, article.name, '->', linkedArticle.name);
          return {
            ...article,
            linkedArticleId: linkedArticle.id,
            // WICHTIG: Übernehme Namen aus dem Artikelstamm, nicht aus OCR!
            name: linkedArticle.name || article.name || '',
            // Übernehme wichtige Felder aus dem bestehenden Artikel
            category: linkedArticle.category || article.category || '',
            bundleUnit: linkedArticle.bundleUnit || article.bundleUnit || 'Stück',
            contentUnit: linkedArticle.contentUnit || article.contentUnit || 'Stück',
            // Behalte Preise aus dem Scan (können sich geändert haben)
            bundlePrice: article.bundlePrice || linkedArticle.bundlePrice || 0,
            pricePerUnit: article.pricePerUnit || linkedArticle.pricePerUnit || 0,
            // WICHTIG: content aus dem Scan hat Priorität (auch wenn 0), nur wenn nicht vorhanden, verwende linkedArticle.content
            content: article.content !== undefined && article.content !== null ? article.content : (linkedArticle.content !== undefined && linkedArticle.content !== null ? linkedArticle.content : 1),
            // Übernehme weitere Felder aus dem bestehenden Artikel
            supplierArticleNumber: linkedArticle.supplierArticleNumber || article.supplierArticleNumber || '',
            bundleEanCode: linkedArticle.bundleEanCode || article.bundleEanCode || '',
            contentEanCode: linkedArticle.contentEanCode || article.contentEanCode || '',
            allergens: linkedArticle.allergens || article.allergens || [],
            additives: linkedArticle.additives || article.additives || [],
            ingredients: linkedArticle.ingredients || article.ingredients || '',
            nutrition: linkedArticle.nutritionInfo ? {
              calories: linkedArticle.nutritionInfo.calories || 0,
              kilojoules: linkedArticle.nutritionInfo.kilojoules || 0,
              protein: linkedArticle.nutritionInfo.protein || 0,
              fat: linkedArticle.nutritionInfo.fat || 0,
              carbohydrates: linkedArticle.nutritionInfo.carbohydrates || 0,
              fiber: linkedArticle.nutritionInfo.fiber ?? 0,
              sugar: linkedArticle.nutritionInfo.sugar ?? 0,
              salt: linkedArticle.nutritionInfo.salt ?? 0,
              alcohol: linkedArticle.nutritionInfo.alcohol
            } : (article.nutrition || {
              calories: 0,
              kilojoules: 0,
              protein: 0,
              fat: 0,
              carbohydrates: 0,
              fiber: 0,
              sugar: 0,
              salt: 0,
              alcohol: undefined
            }),
            openFoodFactsCode: linkedArticle.openFoodFactsCode || article.openFoodFactsCode || '',
            notes: linkedArticle.notes || article.notes || ''
          };
        }
      }
      
      // Wenn kein Treffer und nameOCR vorhanden, suche nach nameOCR
      if (matchingArticles.length === 0 && article.nameOCR) {
        const nameOCRLower = article.nameOCR.toLowerCase().trim();
        console.log(`🔍 [AUTO-LINK-ALL] Artikel ${index + 1} - Suche nach OCR-Name:`, nameOCRLower);
        
        // Zeige alle Artikel des Lieferanten für Debugging
        const supplierArticles = state.articles.filter(a => a.supplierId === supplierId);
        console.log(`📊 [AUTO-LINK-ALL] Artikel ${index + 1} - Alle Artikel des Lieferanten:`, supplierArticles.length, supplierArticles.map(a => ({
          id: a.id,
          name: a.name,
          namesOCR: a.namesOCR
        })));
        
        matchingArticles = state.articles.filter(a => {
          if (a.supplierId !== supplierId) return false;
          
          // Suche in namesOCR Array
          if (a.namesOCR && a.namesOCR.length > 0) {
            const found = a.namesOCR.some((ocrName: string) => 
              ocrName.toLowerCase().trim() === nameOCRLower
            );
            if (found) {
              console.log(`✅ [AUTO-LINK-ALL] OCR-Name gefunden in Artikel:`, {
                articleId: a.id,
                articleName: a.name,
                namesOCR: a.namesOCR,
                searchedName: nameOCRLower
              });
            }
            return found;
          }
          
          return false;
        });
        
        console.log(`📊 [AUTO-LINK-ALL] Artikel ${index + 1} - Treffer nach OCR-Name:`, matchingArticles.length);
        
        if (matchingArticles.length === 1) {
          const linkedArticle = matchingArticles[0];
          console.log(`✅ [AUTO-LINK-ALL] Artikel ${index + 1} verknüpft per OCR-Name:`, article.nameOCR, '->', linkedArticle.name);
          return {
            ...article,
            linkedArticleId: linkedArticle.id,
            // WICHTIG: Übernehme Namen aus dem Artikelstamm, nicht aus OCR!
            name: linkedArticle.name || article.name || '',
            // Übernehme wichtige Felder aus dem bestehenden Artikel
            category: linkedArticle.category || article.category || '',
            bundleUnit: linkedArticle.bundleUnit || article.bundleUnit || 'Stück',
            contentUnit: linkedArticle.contentUnit || article.contentUnit || 'Stück',
            // Behalte Preise aus dem Scan (können sich geändert haben)
            bundlePrice: article.bundlePrice || linkedArticle.bundlePrice || 0,
            pricePerUnit: article.pricePerUnit || linkedArticle.pricePerUnit || 0,
            // WICHTIG: content aus dem Scan hat Priorität (auch wenn 0), nur wenn nicht vorhanden, verwende linkedArticle.content
            content: article.content !== undefined && article.content !== null ? article.content : (linkedArticle.content !== undefined && linkedArticle.content !== null ? linkedArticle.content : 1),
            // Übernehme weitere Felder aus dem bestehenden Artikel
            supplierArticleNumber: linkedArticle.supplierArticleNumber || article.supplierArticleNumber || '',
            bundleEanCode: linkedArticle.bundleEanCode || article.bundleEanCode || '',
            contentEanCode: linkedArticle.contentEanCode || article.contentEanCode || '',
            allergens: linkedArticle.allergens || article.allergens || [],
            additives: linkedArticle.additives || article.additives || [],
            ingredients: linkedArticle.ingredients || article.ingredients || '',
            nutrition: linkedArticle.nutritionInfo ? {
              calories: linkedArticle.nutritionInfo.calories || 0,
              kilojoules: linkedArticle.nutritionInfo.kilojoules || 0,
              protein: linkedArticle.nutritionInfo.protein || 0,
              fat: linkedArticle.nutritionInfo.fat || 0,
              carbohydrates: linkedArticle.nutritionInfo.carbohydrates || 0,
              fiber: linkedArticle.nutritionInfo.fiber ?? 0,
              sugar: linkedArticle.nutritionInfo.sugar ?? 0,
              salt: linkedArticle.nutritionInfo.salt ?? 0,
              alcohol: linkedArticle.nutritionInfo.alcohol
            } : (article.nutrition || {
              calories: 0,
              kilojoules: 0,
              protein: 0,
              fat: 0,
              carbohydrates: 0,
              fiber: 0,
              sugar: 0,
              salt: 0,
              alcohol: undefined
            }),
            openFoodFactsCode: linkedArticle.openFoodFactsCode || article.openFoodFactsCode || '',
            notes: linkedArticle.notes || article.notes || ''
          };
        } else if (matchingArticles.length > 1) {
          console.warn(`⚠️ [AUTO-LINK-ALL] Artikel ${index + 1} hat mehrere Treffer:`, matchingArticles.map(a => a.name));
        } else {
          console.log(`❌ [AUTO-LINK-ALL] Artikel ${index + 1} nicht gefunden:`, article.nameOCR);
        }
      }
      
      return article;
    });
    
    // Aktualisiere Artikel nur wenn sich etwas geändert hat
    const hasChanges = updatedArticles.some((article, index) => 
      article.linkedArticleId !== articles[index].linkedArticleId
    );
    
    if (hasChanges) {
      console.log('💾 [AUTO-LINK-ALL] Aktualisiere Artikelliste mit Verknüpfungen');
      setEditedArticles(updatedArticles);
    } else {
      console.log('ℹ️ [AUTO-LINK-ALL] Keine Verknüpfungen gefunden');
    }
    
    // Gib das aktualisierte Array zurück
    return updatedArticles;
  };

  // Lade AccountingAccounts und vatRates beim Öffnen
  useEffect(() => {
    if (show) {
      const loadAccountingData = async () => {
        try {
          // Lade AccountingSettings für selectedChartId und vatRates
          const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
          if (settings && settings.length > 0) {
            const firstSettings = settings[0];
            if (firstSettings.selectedChartId) {
              setSelectedChartId(firstSettings.selectedChartId);
            }
            if (firstSettings.vatRates && firstSettings.vatRates.length > 0) {
              setVatRates(firstSettings.vatRates);
            }
          }
          
          // Lade AccountingAccounts
          const accounts = await storageLayer.load<AccountingAccount>('accountingAccounts');
          if (accounts) {
            // Filtere nur aktive Konten für den ausgewählten Chart
            const activeAccounts = accounts.filter(acc => 
              acc.status === 'active' && 
              acc.chartId === (settings?.[0]?.selectedChartId || 'skr03')
            );
            setAccountingAccounts(activeAccounts);
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden der Accounting-Daten:', error);
        }
      };
      
      loadAccountingData();
    }
  }, [show]);

  // Aktualisiere Refs, wenn sich Props ändern
  useEffect(() => {
    receiptDataRef.current = receiptData;
    onUpdateReceiptDataRef.current = onUpdateReceiptData;
  }, [receiptData, onUpdateReceiptData]);

  // Initialisiere editedArticles beim Öffnen und finde passenden Lieferanten
  useEffect(() => {
    if (show) {
      const isFirstInit = !isInitializedRef.current;
      isInitializedRef.current = true;
      
      console.log('🚀 [INIT] Initialisiere ReceiptReviewModal mit', receiptData.articles.length, 'Artikeln', isFirstInit ? '(erstes Öffnen)' : '(Re-Render)');
      console.log('🚀 [INIT] Verfügbare Artikel in state.articles:', state.articles.length);
      
      // WICHTIG: Setze ZUERST editedArticles und selectedArticleIndex zurück,
      // damit der Sync-Effect nicht alte Daten überschreibt!
      setEditedArticles([]);
      setSelectedArticleIndex(0);
      
      // Reset Refs
      previousLinkedArticleIdRef.current = undefined;
      previousQuantityRef.current = 1;
      isLinkingRef.current = false;
      
      // Dann setze articleForm zurück, bevor wir neue Daten laden!
      // Das verhindert, dass alte Werte die neuen überschreiben
      setArticleForm({
        name: '',
        category: '',
        supplierId: '',
        supplierArticleNumber: '',
        bundleUnit: 'Stück',
        bundlePrice: 0,
        bundleEanCode: '',
        content: 1,
        contentUnit: 'Stück',
        contentEanCode: '',
        pricePerUnit: 0,
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
        notes: ''
      });
      // Reset Input-Felder
      setBundlePriceInput('0,00');
      setContentInput('1,00');
      setPricePerUnitInput('0,00');
      
      // Stelle sicher, dass content immer 1 ist und bundlePrice der Einzelpreis ist
      const normalizedArticles = receiptData.articles.map(article => {
        // Berechne Einzelpreis falls noch nicht korrekt gesetzt
        let bundlePrice = article.bundlePrice || 0;
        if (article.price && article.quantity && article.quantity > 0 && bundlePrice === article.price) {
          // Falls bundlePrice noch gleich Gesamtpreis ist, berechne Einzelpreis
          bundlePrice = article.price / article.quantity;
        }
        
        // Stelle sicher, dass nameOCR gesetzt ist (aus dem ursprünglichen Namen)
        const nameOCR = article.nameOCR || article.name || '';
        
        console.log('🔍 [INIT] Normalisiere Artikel:', {
          name: article.name,
          nameOCR: article.nameOCR,
          nameOCRSet: nameOCR
        });
        
        return {
          ...article,
          nameOCR: nameOCR, // Stelle sicher, dass nameOCR immer gesetzt ist
          bundlePrice: bundlePrice || article.pricePerUnit || 0,
          content: 1, // Immer 1 für Inhalt bei automatischer Übernahme
          contentUnit: article.contentUnit || 'Stück'
        };
      });
      
      setEditedArticles(normalizedArticles);
      setSelectedArticleIndex(0);
      setHideScannedSupplierName(false); // Reset beim Öffnen
      
      // Setze Belegdatum und Belegnummer aus receiptData
      setReceiptDate(receiptData.date || '');
      setReceiptNumber(receiptData.receiptNumber || '');
      
      // Setze erkannten Lieferantennamen
      if (receiptData.supplier) {
        setScannedSupplierName(receiptData.supplier);
      }
      
      // Finde passenden Lieferanten anhand des Namens
      if (receiptData.supplier) {
        console.log('🔍 [INIT] Suche nach Lieferant:', receiptData.supplier);
        // Verwende State statt Props, da State nach Speichern aktualisiert wird
        const suppliersToUse = state.suppliers.length > 0 ? state.suppliers : suppliers;
        // Prüfe zuerst auf exakte Übereinstimmung
        const exactMatch = suppliersToUse.find(s => 
          s.name.toLowerCase() === receiptData.supplier!.toLowerCase()
        );
        
        if (exactMatch) {
          console.log('✅ [INIT] Exakter Lieferant gefunden:', exactMatch.name);
          setReceiptSupplierId(exactMatch.id);
          setReceiptSupplierSearchTerm(exactMatch.name);
          
          // Übernehme nettoPrices vom Lieferanten - nur beim ersten Öffnen oder wenn Lieferant sich geändert hat
          if (isFirstInit || receiptSupplierId !== exactMatch.id) {
            const supplierNettoPrices = (exactMatch as any).nettoPrices || false;
            setNettoPrices(supplierNettoPrices);
            console.log('🔄 [INIT] nettoPrices vom Lieferanten übernommen:', supplierNettoPrices);
          } else {
            console.log('⏭️ [INIT] nettoPrices nicht überschrieben (bereits gesetzt)');
          }
          
          // Setze supplierId für alle Artikel (verwende bereits normalisierte Artikel)
          const updatedArticles = normalizedArticles.map(article => {
            // Stelle sicher, dass nameOCR gesetzt ist
            const nameOCR = article.nameOCR || article.name || '';
            
            return {
              ...article,
              nameOCR: nameOCR, // Stelle sicher, dass nameOCR immer gesetzt ist
              supplierId: exactMatch.id
            };
          });
          setEditedArticles(updatedArticles);
          
          // Versuche automatische Verknüpfung für alle Artikel nach Lieferanten-Auswahl
          // Nur wenn autoLinkPerformed noch nicht gesetzt ist
          if (!receiptData.autoLinkPerformed) {
            setTimeout(() => {
              console.log('🔍 [INIT] Starte automatische Verknüpfung für alle Artikel...');
              const linkedArticles = autoLinkAllArticles(updatedArticles, exactMatch.id);
              setEditedArticles(linkedArticles);
              
              // Setze Flag und speichere
              const updatedReceiptData: ExtendedReceiptData = {
                ...receiptData,
                autoLinkPerformed: true,
                articles: linkedArticles
              };
              
              if (onUpdateReceiptDataRef.current) {
                onUpdateReceiptDataRef.current(updatedReceiptData);
              }
            }, 100);
          } else {
            console.log('⏭️ [INIT] Automatische Verknüpfung wurde bereits durchgeführt, überspringe');
          }
        } else {
          // Schrittweise Volltextsuche mit Wort-für-Wort-Erweiterung
          const findSupplierByProgressiveSearch = (searchName: string): Supplier | null => {
            // Teile den Namen in Wörter auf (nur alphanumerische Zeichen)
            const words = searchName.toLowerCase()
              .split(/\s+/)
              .map(word => word.trim())
              .filter(word => word.length > 0);
            
            if (words.length === 0) {
              return null;
            }
            
            // Beginne mit dem ersten Wort
            for (let wordCount = 1; wordCount <= words.length; wordCount++) {
              // Baue Suchbegriff aus ersten N Wörtern
              const searchTerm = words.slice(0, wordCount).join(' ');
              
              // Suche alle Lieferanten, deren Name den Suchbegriff enthält
              // Verwende State statt Props, da State nach Speichern aktualisiert wird
              const suppliersToUse = state.suppliers.length > 0 ? state.suppliers : suppliers;
              const matches = suppliersToUse.filter(s => 
                s.name.toLowerCase().includes(searchTerm)
              );
              
              if (matches.length === 1) {
                // Eindeutiger Treffer gefunden!
                console.log(`✅ Eindeutiger Treffer gefunden mit "${searchTerm}":`, matches[0].name);
                return matches[0];
              } else if (matches.length === 0) {
                // Keine Treffer mehr möglich, da wir bereits alle Wörter verwendet haben
                // oder keine weiteren Treffer mit zusätzlichen Wörtern gefunden werden
                console.log(`❌ Keine Treffer mit "${searchTerm}"`);
                return null;
              } else {
                // Mehrere Treffer - weiter mit nächstem Wort
                console.log(`⚠️ ${matches.length} Treffer mit "${searchTerm}", erweitere Suche...`);
                // Wenn wir bereits alle Wörter verwendet haben, können wir nicht weiter suchen
                if (wordCount === words.length) {
                  // Kein eindeutiger Treffer möglich - gib null zurück
                  console.log(`❌ Kein eindeutiger Treffer möglich nach Verwendung aller Wörter`);
                  return null;
                }
              }
            }
            
            return null;
          };
          
          const matchingSupplier = findSupplierByProgressiveSearch(receiptData.supplier);
          
          if (matchingSupplier) {
            setReceiptSupplierId(matchingSupplier.id);
            setReceiptSupplierSearchTerm(matchingSupplier.name);
            
            // Übernehme nettoPrices vom Lieferanten - nur beim ersten Öffnen oder wenn Lieferant sich geändert hat
            if (isFirstInit || receiptSupplierId !== matchingSupplier.id) {
              const supplierNettoPrices = (matchingSupplier as any).nettoPrices || false;
              setNettoPrices(supplierNettoPrices);
              console.log('🔄 [INIT] nettoPrices vom Lieferanten übernommen:', supplierNettoPrices);
            } else {
              console.log('⏭️ [INIT] nettoPrices nicht überschrieben (bereits gesetzt)');
            }
            
            // Setze supplierId für alle Artikel (verwende bereits normalisierte Artikel)
            const updatedArticles = normalizedArticles.map(article => {
              // Stelle sicher, dass nameOCR gesetzt ist
              const nameOCR = article.nameOCR || article.name || '';
              
              return {
                ...article,
                nameOCR: nameOCR, // Stelle sicher, dass nameOCR immer gesetzt ist
                supplierId: matchingSupplier.id
              };
            });
            setEditedArticles(updatedArticles);
            
            // Versuche automatische Verknüpfung für alle Artikel nach Lieferanten-Auswahl
            // Nur wenn autoLinkPerformed noch nicht gesetzt ist
            if (!receiptData.autoLinkPerformed) {
              setTimeout(() => {
                console.log('🔍 [INIT] Starte automatische Verknüpfung für alle Artikel...');
                const linkedArticles = autoLinkAllArticles(updatedArticles, matchingSupplier.id);
                setEditedArticles(linkedArticles);
                
                // Setze Flag und speichere
                const updatedReceiptData: ExtendedReceiptData = {
                  ...receiptData,
                  autoLinkPerformed: true,
                  articles: linkedArticles
                };
                
                if (onUpdateReceiptDataRef.current) {
                  onUpdateReceiptDataRef.current(updatedReceiptData);
                }
              }, 100);
            } else {
              console.log('⏭️ [INIT] Automatische Verknüpfung wurde bereits durchgeführt, überspringe');
            }
          } else {
            // Kein Lieferant gefunden - setze auf "Kein Lieferant ausgewählt!"
            setReceiptSupplierId('');
            setReceiptSupplierSearchTerm('');
          }
        }
      } else if (receiptData.supplierId) {
        setReceiptSupplierId(receiptData.supplierId);
        // Verwende State statt Props, da State nach Speichern aktualisiert wird
        const suppliersToUse = state.suppliers.length > 0 ? state.suppliers : suppliers;
        const supplier = suppliersToUse.find(s => s.id === receiptData.supplierId);
        if (supplier) {
          setReceiptSupplierSearchTerm(supplier.name);
          setScannedSupplierName(supplier.name); // Kein Unterschied bei exakter ID-Übereinstimmung
          
          // Übernehme nettoPrices vom Lieferanten - nur beim ersten Öffnen oder wenn Lieferant sich geändert hat
          if (isFirstInit || receiptSupplierId !== receiptData.supplierId) {
            const supplierNettoPrices = (supplier as any).nettoPrices || false;
            setNettoPrices(supplierNettoPrices);
            console.log('🔄 [INIT] nettoPrices vom Lieferanten übernommen:', supplierNettoPrices);
          } else {
            console.log('⏭️ [INIT] nettoPrices nicht überschrieben (bereits gesetzt)');
          }
        } else {
          // Lieferant-ID existiert nicht mehr - setze auf "Kein Lieferant ausgewählt!"
          setReceiptSupplierId('');
          setReceiptSupplierSearchTerm('');
          setNettoPrices(false);
        }
      } else {
        // Kein Lieferant erkannt - setze auf "Kein Lieferant ausgewählt!"
        setReceiptSupplierId('');
        setReceiptSupplierSearchTerm('');
        setNettoPrices(false);
      }
    }
    
    // Fülle Formular mit dem ersten Artikel nach dem Initialisieren
    // (außerhalb des if-Blocks, damit es immer ausgeführt wird)
    if (show && receiptData.articles && receiptData.articles.length > 0) {
      // Erstelle normalizedArticles erneut, falls sie nicht im Scope sind
      const normalizedArticles = receiptData.articles.map(article => {
        // Berechne Einzelpreis falls noch nicht korrekt gesetzt
        let bundlePrice = article.bundlePrice || 0;
        if (article.price && article.quantity && article.quantity > 0 && bundlePrice === article.price) {
          // Falls bundlePrice noch gleich Gesamtpreis ist, berechne Einzelpreis
          bundlePrice = article.price / article.quantity;
        }
        
        // Stelle sicher, dass nameOCR gesetzt ist (aus dem ursprünglichen Namen)
        const nameOCR = article.nameOCR || article.name || '';
        
        return {
          ...article,
          nameOCR: nameOCR,
          bundlePrice: bundlePrice || article.pricePerUnit || 0,
          content: 1,
          contentUnit: article.contentUnit || 'Stück'
        };
      });
      
      if (normalizedArticles.length > 0) {
        const firstArticle = normalizedArticles[0];
        const initialFormData = {
          name: firstArticle.name || '',
          category: firstArticle.category || '',
          supplierId: receiptData.supplierId || firstArticle.supplierId || '',
          supplierArticleNumber: firstArticle.supplierArticleNumber || '',
          bundleUnit: firstArticle.bundleUnit || 'Stück',
          bundlePrice: firstArticle.bundlePrice || 0,
          bundleEanCode: firstArticle.bundleEanCode || '',
          content: firstArticle.linkedArticleId ? (firstArticle.content || 1) : 1,
          contentUnit: firstArticle.contentUnit || 'Stück',
          contentEanCode: firstArticle.contentEanCode || '',
          pricePerUnit: firstArticle.pricePerUnit || 0,
          allergens: firstArticle.allergens || [],
          additives: firstArticle.additives || [],
          ingredients: firstArticle.ingredients || '',
          nutrition: firstArticle.nutrition || {
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
          openFoodFactsCode: firstArticle.openFoodFactsCode || '',
          notes: firstArticle.notes || ''
        };
        
        setArticleForm(initialFormData);
        
        // Aktualisiere auch Input-Felder mit deutschem Format
        const contentValue = firstArticle.linkedArticleId ? (firstArticle.content || 1) : 1;
        setBundlePriceInput((firstArticle.bundlePrice || 0).toFixed(2).replace('.', ','));
        setContentInput(contentValue.toFixed(2).replace('.', ','));
        setPricePerUnitInput((firstArticle.pricePerUnit || 0).toFixed(2).replace('.', ','));
        
        // Setze Suchbegriff für Artikel-Suche
        const searchTerm = firstArticle.nameOCR || getLongestWord(firstArticle.name || '');
        setArticleSearchTerm(searchTerm);
        
        console.log('✅ [INIT] Formular mit erstem Artikel befüllt:', {
          name: firstArticle.name,
          category: firstArticle.category,
          quantity: firstArticle.quantity
        });
      }
    }
  }, [show, receiptData.articles, receiptData.supplier, receiptData.supplierId]); // suppliers entfernt, um Re-Render nach Speichern zu vermeiden

  // Aktualisiere Scan-Daten wenn sich receiptData ändert
  useEffect(() => {
    if (show && receiptData) {
      setScanTotals({
        totalAmount: receiptData.totalAmount || 0,
        vat7: receiptData.vat7 || 0,
        vat19: receiptData.vat19 || 0
      });
      // Aktualisiere Datum nur beim Öffnen, nicht bei jeder Änderung
      // (Belegnummer wird bereits im Initialisierungs-Effect gesetzt und sollte nicht überschrieben werden)
      // Datum kann auch manuell geändert werden, daher nur beim Öffnen setzen
    }
  }, [show, receiptData.totalAmount, receiptData.vat7, receiptData.vat19]);

  // Schließe Steuerkonto-Dropdown beim Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTaxAccountDropdown && taxAccountDropdownRef.current && !taxAccountDropdownRef.current.contains(event.target as Node)) {
        setShowTaxAccountDropdown(false);
      }
    };

    if (showTaxAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTaxAccountDropdown]);

  // Prüfe ob es ein PDF ist
  const isPDF = useMemo(() => {
    // Prüfe zuerst receiptImagePath (Dateipfad) - das ist am zuverlässigsten
    if (receiptImagePath) {
      const pathLower = receiptImagePath.toLowerCase();
      if (pathLower.endsWith('.pdf')) {
        console.log('📄 [PDF-CHECK] PDF erkannt über receiptImagePath (.pdf Endung):', receiptImagePath);
        return true;
      }
      
      // Prüfe auch in LocalStorage, ob der Dateityp gespeichert ist
      try {
        const imageStructureStr = localStorage.getItem('chef_images');
        if (imageStructureStr) {
          const imageStructure = JSON.parse(imageStructureStr);
          const pathParts = receiptImagePath.split('/');
          if (pathParts.length >= 3 && pathParts[0] === 'pictures') {
            const entityType = pathParts[1];
            const entityId = pathParts[2];
            const imageData = imageStructure?.pictures?.[entityType]?.[entityId];
            console.log('📄 [PDF-CHECK] imageData aus LocalStorage:', imageData);
            if (imageData) {
              if (typeof imageData === 'object' && imageData.fileType === 'application/pdf') {
                console.log('📄 [PDF-CHECK] PDF erkannt über gespeicherten fileType in LocalStorage:', receiptImagePath);
                return true;
              }
              // Prüfe auch, ob es ein IndexedDB-Verweis ist (dann müssen wir IndexedDB prüfen)
              if (typeof imageData === 'object' && imageData._indexedDB) {
                // Versuche direkt aus IndexedDB zu lesen (async, aber wir können es hier nicht awaiten)
                // Stattdessen prüfen wir, ob imageUrl eine Blob URL ist UND receiptImagePath vorhanden ist
                // Das deutet darauf hin, dass es aus IndexedDB geladen wurde
                if (imageUrl && imageUrl.startsWith('blob:')) {
                  // Wenn wir eine Blob URL haben und es ein IndexedDB-Verweis ist, 
                  // müssen wir den fileType aus IndexedDB lesen
                  // Da useMemo nicht async sein kann, prüfen wir stattdessen, ob wir den fileType
                  // aus dem bereits geladenen IndexedDB-Eintrag haben können
                  // Für jetzt: Wenn Blob URL vorhanden und IndexedDB-Verweis, nehmen wir an, es ist ein PDF
                  // (da wir wissen, dass PDFs in IndexedDB gespeichert werden)
                  console.log('📄 [PDF-CHECK] IndexedDB-Verweis gefunden, prüfe IndexedDB direkt...');
                  // Wir können hier nicht async machen, daher prüfen wir imageUrl
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('📄 [PDF-CHECK] Fehler beim Parsen von LocalStorage:', e);
      }
    }
    
    // Prüfe imageUrl (geladenes Bild) - für Blob URLs müssen wir receiptImagePath prüfen
    if (imageUrl) {
      const urlLower = imageUrl.toLowerCase();
      // Prüfe auf .pdf Endung oder PDF MIME-Type
      if (urlLower.endsWith('.pdf') || urlLower.includes('application/pdf') || urlLower.includes('data:application/pdf')) {
        console.log('📄 [PDF-CHECK] PDF erkannt über imageUrl:', imageUrl.substring(0, 50));
        return true;
      }
      // Für blob: URLs: Wenn receiptImagePath vorhanden ist und es ein IndexedDB-Verweis ist,
      // prüfen wir, ob der fileType in IndexedDB ein PDF ist
      if (urlLower.startsWith('blob:') && receiptImagePath) {
        // Versuche fileType aus IndexedDB zu lesen (async, aber wir können es hier nicht awaiten)
        // Stattdessen: Wenn Blob URL vorhanden und receiptImagePath vorhanden, 
        // prüfen wir, ob es ein IndexedDB-Verweis in LocalStorage ist
        try {
          const imageStructureStr = localStorage.getItem('chef_images');
          if (imageStructureStr) {
            const imageStructure = JSON.parse(imageStructureStr);
            const pathParts = receiptImagePath.split('/');
            if (pathParts.length >= 3 && pathParts[0] === 'pictures') {
              const entityType = pathParts[1];
              const entityId = pathParts[2];
              const imageData = imageStructure?.pictures?.[entityType]?.[entityId];
              if (imageData && typeof imageData === 'object' && imageData._indexedDB) {
                // Es ist ein IndexedDB-Verweis - prüfe, ob fileType gespeichert ist
                if (imageData.fileType === 'application/pdf') {
                  console.log('📄 [PDF-CHECK] PDF erkannt über fileType in IndexedDB-Verweis:', receiptImagePath);
                  return true;
                }
                // Wenn fileType nicht gespeichert ist, aber es ist ein IndexedDB-Verweis und eine Blob URL,
                // nehmen wir an, es könnte ein PDF sein (da PDFs als Blob URLs geladen werden)
                // Aber das ist nicht zuverlässig - besser: direkt aus IndexedDB lesen
                console.log('📄 [PDF-CHECK] IndexedDB-Verweis ohne fileType, prüfe IndexedDB direkt...');
              }
            }
          }
        } catch (e) {
          // Ignoriere Fehler
        }
      }
    }
    
    // Fallback zu receiptImage
    if (receiptImage) {
      if (typeof receiptImage === 'string') {
        const strLower = receiptImage.toLowerCase();
        if (strLower.endsWith('.pdf') || strLower.includes('application/pdf') || strLower.includes('data:application/pdf')) {
          console.log('📄 [PDF-CHECK] PDF erkannt über receiptImage (String):', receiptImage.substring(0, 50));
          return true;
        }
      } else {
        if (receiptImage.type === 'application/pdf') {
          console.log('📄 [PDF-CHECK] PDF erkannt über receiptImage (File):', receiptImage.name);
          return true;
        }
      }
    }
    
    console.log('📄 [PDF-CHECK] Kein PDF erkannt - receiptImagePath:', receiptImagePath, 'imageUrl:', imageUrl?.substring(0, 50));
    return false;
  }, [receiptImage, imageUrl, receiptImagePath]);

  // Lade Bild-URL wenn receiptImage vorhanden
  useEffect(() => {
    console.log('🖼️ [IMAGE] receiptImage geändert:', receiptImage);
    console.log('📄 [IMAGE] receiptImagePath:', receiptImagePath);
    console.log('🖼️ [IMAGE] Aktueller imageUrl:', imageUrl);
    
    // Wenn receiptImagePath vorhanden ist, aber receiptImage nicht, dann wird das Bild
    // von ReceiptReviewModalWithImage geladen und als receiptImage (String-URL) übergeben
    // In diesem Fall müssen wir nichts tun, da receiptImage bereits die URL ist
    
    if (receiptImage) {
      if (typeof receiptImage === 'string') {
        // Bereits eine URL (kann von ReceiptReviewModalWithImage kommen oder direkt übergeben)
        console.log('🖼️ [IMAGE] Verwende URL:', receiptImage.substring(0, 100) + (receiptImage.length > 100 ? '...' : ''));
        setImageUrl(receiptImage);
      } else {
        // File-Objekt - konvertiere zu URL
        console.log('🖼️ [IMAGE] Konvertiere File zu URL:', receiptImage.name, receiptImage.type);
        const url = URL.createObjectURL(receiptImage);
        console.log('🖼️ [IMAGE] URL erstellt:', url);
        setImageUrl(url);
        return () => {
          // Cleanup: URL freigeben
          console.log('🖼️ [IMAGE] URL freigegeben');
          URL.revokeObjectURL(url);
        };
      }
    } else if (receiptImagePath) {
      // Wenn nur receiptImagePath vorhanden ist, wird das Bild von ReceiptReviewModalWithImage geladen
      // Wir müssen hier nichts tun, da ReceiptReviewModalWithImage receiptImage als String-URL setzt
      console.log('📄 [IMAGE] Warte auf Bild-Laden durch ReceiptReviewModalWithImage...');
    } else {
      console.log('🖼️ [IMAGE] Kein Bild vorhanden');
      setImageUrl('');
    }
  }, [receiptImage, receiptImagePath]);
  
  // Cleanup: Revoke Blob URLs wenn sie nicht mehr benötigt werden
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        console.log('🖼️ [IMAGE] Cleanup: Revoke Blob URL');
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // Rendere PDF in Canvas für Druck - gibt Array von Canvas-URLs zurück (eine pro Seite)
  const renderPdfToCanvas = useCallback(async (pdfUrl: string): Promise<string[]> => {
    try {
      // Lade PDF.js dynamisch über CDN
      let pdfjsLib: any = (window as any).pdfjsLib;
      
      if (!pdfjsLib) {
        // Lade PDF.js von CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            pdfjsLib = (window as any).pdfjsLib || (window as any).pdfjs;
            if (!pdfjsLib) {
              reject(new Error('PDF.js konnte nicht geladen werden'));
              return;
            }
            // Setze Worker-Pfad
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            (window as any).pdfjsLib = pdfjsLib;
            resolve();
          };
          script.onerror = () => reject(new Error('Fehler beim Laden von PDF.js'));
          document.head.appendChild(script);
        });
      }
      
      console.log('📄 [PDF-CANVAS] Starte Rendering von PDF:', pdfUrl.substring(0, 50));
      
      // Lade PDF (konvertiere Blob URL zu ArrayBuffer falls nötig)
      let pdfData: any = pdfUrl;
      if (pdfUrl.startsWith('blob:')) {
        const response = await fetch(pdfUrl);
        pdfData = await response.arrayBuffer();
      }
      
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      console.log('📄 [PDF-CANVAS] PDF geladen, Seiten:', pdf.numPages);

      const scale = 2.0; // Höhere Auflösung für Druck
      const canvasUrls: string[] = [];
      
      // Rendere jede Seite in ein separates Canvas
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Erstelle Canvas für diese Seite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          console.error(`❌ [PDF-CANVAS] Konnte Canvas-Context für Seite ${pageNum} nicht erstellen`);
          continue;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Weißer Hintergrund
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rendere Seite auf Canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        } as any).promise;
        
        // Konvertiere Canvas zu Data URL
        const dataUrl = canvas.toDataURL('image/png');
        canvasUrls.push(dataUrl);
        
        console.log(`✅ [PDF-CANVAS] Seite ${pageNum}/${pdf.numPages} gerendert:`, canvas.width, 'x', canvas.height);
      }

      console.log(`✅ [PDF-CANVAS] PDF erfolgreich gerendert: ${canvasUrls.length} Seiten`);
      return canvasUrls;
    } catch (error) {
      console.error('❌ [PDF-CANVAS] Fehler beim Rendern des PDFs:', error);
      return [];
    }
  }, []);

  // Rendere PDF zu Canvas für Anzeige im Original-Beleg-Bereich
  useEffect(() => {
    if (show && isPDF && imageUrl && displayPdfCanvasUrls.length === 0) {
      console.log('📄 [PDF-CANVAS-DISPLAY] Starte PDF-Rendering für Anzeige');
      renderPdfToCanvas(imageUrl).then((canvasUrls) => {
        if (canvasUrls.length > 0) {
          setDisplayPdfCanvasUrls(canvasUrls);
          setCurrentPdfPage(0); // Starte mit erster Seite
          console.log(`✅ [PDF-CANVAS-DISPLAY] PDF erfolgreich gerendert: ${canvasUrls.length} Seiten`);
        }
      });
    }
    
    // Cleanup: Entferne Canvas URLs wenn Modal geschlossen wird
    if (!show && displayPdfCanvasUrls.length > 0) {
      setDisplayPdfCanvasUrls([]);
      setCurrentPdfPage(0);
    }
  }, [show, isPDF, imageUrl, displayPdfCanvasUrls.length, renderPdfToCanvas]);

  // Rendere PDF zu Canvas wenn PDF geladen wird und Druck-Preview geöffnet wird
  useEffect(() => {
    if (showPrintPreview && isPDF && imageUrl && pdfCanvasUrls.length === 0) {
      console.log('📄 [PDF-CANVAS] Starte PDF-Rendering für Druck-Preview');
      renderPdfToCanvas(imageUrl).then((canvasUrls) => {
        if (canvasUrls.length > 0) {
          setPdfCanvasUrls(canvasUrls);
          // Setze Größe basierend auf erster Seite
          const img = new Image();
          img.onload = () => {
            setPrintPreviewImageSize({
              width: img.width,
              height: img.height
            });
          };
          img.src = canvasUrls[0];
        }
      });
    }
    
    // Cleanup: Entferne Canvas URLs wenn Preview geschlossen wird
    if (!showPrintPreview && pdfCanvasUrls.length > 0) {
      setPdfCanvasUrls([]);
    }
  }, [showPrintPreview, isPDF, imageUrl, pdfCanvasUrls.length, renderPdfToCanvas]);

  // Berechne aktualisierte Beleg-Metadaten
  const calculateReceiptTotals = () => {
    const totalArticles = editedArticles.length;
    
    // Berechne Summe aller Artikelpreise: Menge × Gebindepreis (oder Preis falls vorhanden)
    const articlesTotal = editedArticles.reduce((sum, article) => {
      const quantity = article.quantity || 1;
      const price = article.price || (article.bundlePrice ? article.bundlePrice * quantity : 0);
      return sum + price;
    }, 0);
    
    // MwSt-Berechnung: Verwende vatRate jedes Artikels
    // Berücksichtige ob Preise Netto oder Brutto sind
    let vat7 = 0;
    let vat19 = 0;
    
    editedArticles.forEach(article => {
      const quantity = article.quantity || 1;
      const basePrice = article.price || (article.bundlePrice ? article.bundlePrice * quantity : 0);
      const vatRate = article.vatRate || 19; // Standard 19% falls nicht gesetzt
      
      if (vatRate === 0) {
        // Keine MwSt
        return;
      }
      
      let grossPrice: number;
      let netPrice: number;
      let vatAmount: number;
      
      if (nettoPrices) {
        // Preise sind Netto: berechne Brutto
        netPrice = basePrice;
        grossPrice = basePrice * (1 + vatRate / 100);
        vatAmount = grossPrice - netPrice;
      } else {
        // Preise sind Brutto: berechne Netto
        grossPrice = basePrice;
        netPrice = grossPrice / (1 + vatRate / 100);
        vatAmount = grossPrice - netPrice;
      }
      
      // Summiere nach MwSt-Satz
      if (Math.abs(vatRate - 7) < 0.01) {
        vat7 += vatAmount;
      } else if (Math.abs(vatRate - 19) < 0.01) {
        vat19 += vatAmount;
      }
      // Andere MwSt-Sätze werden aktuell nicht separat summiert
    });

    // Berechne Nettosumme und Rechnungsbetrag je nach Preisart
    let netSum: number;
    let grossTotal: number;
    
    if (nettoPrices) {
      // Bei Netto-Preisen: articlesTotal ist die Nettosumme
      netSum = articlesTotal;
      grossTotal = netSum + vat7 + vat19; // Rechnungsbetrag = Nettosumme + MwSt
    } else {
      // Bei Brutto-Preisen: articlesTotal ist der Rechnungsbetrag
      grossTotal = articlesTotal;
      netSum = grossTotal - vat7 - vat19; // Nettosumme = Rechnungsbetrag - MwSt
    }

    return { totalArticles, netSum, vat7, vat19, grossTotal };
  };
  
  // Berechnete Werte (aktualisiert sich automatisch bei Änderungen)
  const calculatedTotals = useMemo(() => {
    return calculateReceiptTotals();
  }, [editedArticles, nettoPrices]);
  
  // Prüfe, ob Werte sich von Scan-Daten unterscheiden
  const isDifferentFromScan = (field: 'grossTotal' | 'vat7' | 'vat19'): boolean => {
    if (field === 'grossTotal') {
      return Math.abs(calculatedTotals.grossTotal - scanTotals.totalAmount) > 0.01; // Toleranz für Rundungsfehler
    } else {
      const calculated = calculatedTotals[field];
      const scanned = scanTotals[field];
      return Math.abs(calculated - scanned) > 0.01; // Toleranz für Rundungsfehler
    }
  };

  // Berechne Anzahl der vollständigen Artikel (aktualisiert sich automatisch)
  const completeArticlesCount = useMemo(() => {
    return editedArticles.filter(article => 
      isArticleComplete(article)
    ).length;
  }, [editedArticles, receiptSupplierId, receiptSupplierSearchTerm]);

  // Hilfsfunktion: Rechne Preise von Brutto zu Netto um (wenn nötig)
  const convertPricesToNetto = (article: ReceiptArticle): { bundlePrice: number; pricePerUnit: number } => {
    const vatRate = article.vatRate || 19; // Standard 19% falls nicht gesetzt
    
    // Wenn bereits Netto-Preise, keine Umrechnung nötig
    if (nettoPrices || vatRate === 0) {
      return {
        bundlePrice: article.bundlePrice || 0,
        pricePerUnit: article.pricePerUnit || 0
      };
    }
    
    // Umrechnung von Brutto zu Netto: Netto = Brutto / (1 + MwSt-Satz/100)
    const bundlePriceBrutto = article.bundlePrice || 0;
    const pricePerUnitBrutto = article.pricePerUnit || 0;
    
    const bundlePriceNetto = bundlePriceBrutto / (1 + vatRate / 100);
    const pricePerUnitNetto = pricePerUnitBrutto / (1 + vatRate / 100);
    
    console.log(`🔄 [PREIS-UMRECHNUNG] Artikel "${article.name}": Brutto → Netto (${vatRate}%)`, {
      bundlePrice: `${bundlePriceBrutto.toFixed(2)} → ${bundlePriceNetto.toFixed(2)}`,
      pricePerUnit: `${pricePerUnitBrutto.toFixed(2)} → ${pricePerUnitNetto.toFixed(2)}`
    });
    
    return {
      bundlePrice: bundlePriceNetto,
      pricePerUnit: pricePerUnitNetto
    };
  };

  const handleSave = async () => {
    try {
      // Wenn Beleg noch nicht abgeschlossen ist, speichere nur processedOcrData
      if (!isCompleted) {
        console.log('💾 Speichere Beleg-Daten (noch nicht abgeschlossen)...');
        
        // Aktualisiere processedOcrData mit aktuellen Werten
        const updatedReceiptData: ExtendedReceiptData = {
          ...receiptData,
          supplier: receiptSupplierId ? suppliers.find(s => s.id === receiptSupplierId)?.name || receiptData.supplier : receiptData.supplier,
          supplierId: receiptSupplierId || receiptData.supplierId,
          date: receiptDate || receiptData.date,
          receiptNumber: receiptNumber || receiptData.receiptNumber,
          articles: editedArticles,
          totalArticles: editedArticles.length,
          totalAmount: calculatedTotals.grossTotal,
          vat7: calculatedTotals.vat7,
          vat19: calculatedTotals.vat19,
          isCompleted: false,
          printListPosition: receiptData.printListPosition,
          leftPanelWidth: leftPanelWidth,
          rightPanelWidth: rightPanelWidth,
          autoLinkPerformed: receiptData.autoLinkPerformed // Behalte Flag beim Speichern
        };
        
        // Aktualisiere über onUpdateReceiptData
        if (onUpdateReceiptData) {
          await onUpdateReceiptData(updatedReceiptData);
        }
        
        // Oder über onSaveReceipt wenn vorhanden
        if (onSaveReceipt) {
          await onSaveReceipt({ processedOcrData: updatedReceiptData });
        }
        
        console.log('✅ Beleg-Daten gespeichert');
        return; // Beende hier, da noch nicht abgeschlossen
      }
      
      // Wenn Beleg abgeschlossen ist, übernehme Artikel und speichere receiptDetails
      console.log('💾 Übernehme Artikel und schließe Beleg ab...');
      
      // Filtere vollständige Artikel für die Verarbeitung (ohne excludeFromUpdate)
      const completeArticles = editedArticles.filter(article => 
        isArticleComplete(article) && !article.excludeFromUpdate
      );
      
      // Alle vollständigen Artikel für receiptDetails (inklusive excludeFromUpdate)
      const allCompleteArticlesForReceipt = editedArticles.filter(article => 
        isArticleComplete(article)
      );

      if (allCompleteArticlesForReceipt.length === 0) {
        alert('Keine vollständigen Artikel zum Übernehmen gefunden.');
        return;
      }

      console.log(`💾 Übernehme ${completeArticles.length} vollständige Artikel (${allCompleteArticlesForReceipt.length} insgesamt für ReceiptDetails)...`);

      const articlesToSave: Article[] = [];
      const articlesToUpdate: Article[] = [];

      // Verarbeite jeden vollständigen Artikel
      for (const receiptArticle of completeArticles) {
        if (receiptArticle.linkedArticleId) {
          // Artikel aktualisieren: Finde bestehenden Artikel im State
          const existingArticle = state.articles.find(a => a.id === receiptArticle.linkedArticleId);
          
          if (existingArticle) {
            // Erstelle aktualisierten Artikel mit allen Feldern aus receiptArticle
            // Füge OCR-Namen zu namesOCR hinzu, falls vorhanden
            const currentOCRName = receiptArticle.nameOCR; // Nur nameOCR verwenden, nicht name als Fallback
            const existingNamesOCR = existingArticle.namesOCR || [];
            const updatedNamesOCR = currentOCRName && !existingNamesOCR.includes(currentOCRName)
              ? [...existingNamesOCR, currentOCRName]
              : existingNamesOCR;
            
            // Rechne Preise von Brutto zu Netto um, wenn nötig
            const { bundlePrice: convertedBundlePrice, pricePerUnit: convertedPricePerUnit } = convertPricesToNetto(receiptArticle);
            
            const updatedArticle: Article = {
              ...existingArticle,
              name: receiptArticle.name || existingArticle.name,
              namesOCR: updatedNamesOCR, // Füge OCR-Namen hinzu
              category: (receiptArticle.category || existingArticle.category) as ArticleCategory,
              supplierId: receiptSupplierId || existingArticle.supplierId,
              supplierArticleNumber: receiptArticle.supplierArticleNumber || existingArticle.supplierArticleNumber,
              bundleUnit: (receiptArticle.bundleUnit || existingArticle.bundleUnit) as Unit,
              bundlePrice: convertedBundlePrice,
              bundleEanCode: receiptArticle.bundleEanCode || existingArticle.bundleEanCode,
              content: receiptArticle.content !== undefined && receiptArticle.content !== null ? receiptArticle.content : existingArticle.content,
              contentUnit: (receiptArticle.contentUnit || existingArticle.contentUnit) as Unit,
              contentEanCode: receiptArticle.contentEanCode || existingArticle.contentEanCode,
              pricePerUnit: convertedPricePerUnit,
              accountingAccountNumber: receiptArticle.taxAccount || existingArticle.accountingAccountNumber, // SKR-Konto übernehmen
              allergens: receiptArticle.allergens || existingArticle.allergens,
              additives: receiptArticle.additives || existingArticle.additives,
              ingredients: receiptArticle.ingredients || existingArticle.ingredients,
              nutritionInfo: receiptArticle.nutrition || existingArticle.nutritionInfo,
              openFoodFactsCode: receiptArticle.openFoodFactsCode || existingArticle.openFoodFactsCode,
              notes: receiptArticle.notes || existingArticle.notes,
              isDirty: true,
              syncStatus: 'pending'
            };
            
            articlesToUpdate.push(updatedArticle);
            console.log(`📝 Aktualisiere Artikel: ${updatedArticle.name} (ID: ${updatedArticle.id})`);
          } else {
            console.warn(`⚠️ Verknüpfter Artikel mit ID ${receiptArticle.linkedArticleId} nicht gefunden. Wird als neuer Artikel angelegt.`);
            // Falls verknüpfter Artikel nicht gefunden, als neuen Artikel anlegen
            // Rechne Preise von Brutto zu Netto um, wenn nötig
            const { bundlePrice: convertedBundlePrice, pricePerUnit: convertedPricePerUnit } = convertPricesToNetto(receiptArticle);
            
            const newArticle: Article = {
              id: UUIDUtils.generateId(),
              name: receiptArticle.name || '',
              namesOCR: receiptArticle.nameOCR ? [receiptArticle.nameOCR] : [], // Initialisiere mit OCR-Namen
              category: (receiptArticle.category || '') as ArticleCategory,
              supplierId: receiptSupplierId || '',
              supplierArticleNumber: receiptArticle.supplierArticleNumber || '',
              bundleUnit: (receiptArticle.bundleUnit || '') as Unit,
              bundlePrice: convertedBundlePrice,
              bundleEanCode: receiptArticle.bundleEanCode || '',
              content: receiptArticle.content || 0,
              contentUnit: (receiptArticle.contentUnit || '') as Unit,
              contentEanCode: receiptArticle.contentEanCode || '',
              pricePerUnit: convertedPricePerUnit,
              accountingAccountNumber: receiptArticle.taxAccount, // SKR-Konto übernehmen
              allergens: receiptArticle.allergens || [],
              additives: receiptArticle.additives || [],
              ingredients: receiptArticle.ingredients || '',
              nutritionInfo: receiptArticle.nutrition || {
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
              openFoodFactsCode: receiptArticle.openFoodFactsCode || '',
              notes: receiptArticle.notes || '',
              isNew: true,
              isDirty: true,
              syncStatus: 'pending',
              alcohol: receiptArticle.nutrition?.alcohol
            };
            
            articlesToSave.push(newArticle);
            console.log(`➕ Lege neuen Artikel an: ${newArticle.name}`);
          }
        } else {
          // Neuen Artikel anlegen
          // Rechne Preise von Brutto zu Netto um, wenn nötig
          const { bundlePrice: convertedBundlePrice, pricePerUnit: convertedPricePerUnit } = convertPricesToNetto(receiptArticle);
          
          const newArticle: Article = {
            id: UUIDUtils.generateId(),
            name: receiptArticle.name || '',
            namesOCR: receiptArticle.nameOCR ? [receiptArticle.nameOCR] : [], // Initialisiere mit OCR-Namen
            category: (receiptArticle.category || '') as ArticleCategory,
            supplierId: receiptSupplierId || '',
            supplierArticleNumber: receiptArticle.supplierArticleNumber || '',
            bundleUnit: (receiptArticle.bundleUnit || '') as Unit,
            bundlePrice: convertedBundlePrice,
            bundleEanCode: receiptArticle.bundleEanCode || '',
            content: receiptArticle.content || 0,
            contentUnit: (receiptArticle.contentUnit || '') as Unit,
            contentEanCode: receiptArticle.contentEanCode || '',
            pricePerUnit: convertedPricePerUnit,
            accountingAccountNumber: receiptArticle.taxAccount, // SKR-Konto übernehmen
            allergens: receiptArticle.allergens || [],
            additives: receiptArticle.additives || [],
            ingredients: receiptArticle.ingredients || '',
            nutritionInfo: receiptArticle.nutrition || {
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
            openFoodFactsCode: receiptArticle.openFoodFactsCode || '',
            notes: receiptArticle.notes || '',
            isNew: true,
            isDirty: true,
            syncStatus: 'pending',
            alcohol: receiptArticle.nutrition?.alcohol
          };
          
          articlesToSave.push(newArticle);
          console.log(`➕ Lege neuen Artikel an: ${newArticle.name}`);
        }
      }

      // Speichere neue Artikel
      if (articlesToSave.length > 0) {
        console.log(`💾 Speichere ${articlesToSave.length} neue Artikel über StorageLayer...`);
        const success = await storageLayer.save('articles', articlesToSave);
        if (!success) {
          throw new Error('Fehler beim Speichern der neuen Artikel');
        }
        console.log('✅ Neue Artikel erfolgreich gespeichert');
        
        // Aktualisiere globalen State für neue Artikel
        articlesToSave.forEach(article => {
          dispatch({ type: 'ADD_ARTICLE', payload: article });
        });
      }

      // Aktualisiere bestehende Artikel
      if (articlesToUpdate.length > 0) {
        console.log(`💾 Aktualisiere ${articlesToUpdate.length} bestehende Artikel über StorageLayer...`);
        const success = await storageLayer.save('articles', articlesToUpdate);
        if (!success) {
          throw new Error('Fehler beim Aktualisieren der Artikel');
        }
        console.log('✅ Artikel erfolgreich aktualisiert');
        
        // Aktualisiere globalen State für geänderte Artikel
        articlesToUpdate.forEach(article => {
          dispatch({ type: 'UPDATE_ARTICLE', payload: { id: article.id, article } });
        });
      }

      // Erstelle receiptDetails mit article IDs
      // Warte kurz, damit die Artikel im State aktualisiert sind
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Sammle alle article IDs (sowohl neue als auch aktualisierte)
      const allArticleIds = new Map<string, string>();
      articlesToSave.forEach(article => {
        // Finde das passende ReceiptArticle
        const receiptArticle = completeArticles.find(ra => 
          ra.name === article.name && 
          (!ra.linkedArticleId || ra.linkedArticleId === article.id)
        );
        if (receiptArticle) {
          allArticleIds.set(receiptArticle.name + (receiptArticle.supplierArticleNumber || ''), article.id);
        }
      });
      articlesToUpdate.forEach(article => {
        allArticleIds.set(article.id, article.id);
      });
      
      const receiptDetails = {
        lineItems: allCompleteArticlesForReceipt.map((receiptArticle): ReceiptLineItem => {
          // Finde die article ID (nur für Artikel ohne excludeFromUpdate)
          let articleId: string | undefined;
          if (!receiptArticle.excludeFromUpdate) {
            if (receiptArticle.linkedArticleId) {
              articleId = receiptArticle.linkedArticleId;
            } else {
              // Suche in den neu gespeicherten Artikeln über Map
              const key = receiptArticle.name + (receiptArticle.supplierArticleNumber || '');
              articleId = allArticleIds.get(key);
            }
          }
          // Für Artikel mit excludeFromUpdate bleibt articleId undefined
          
          return {
            id: UUIDUtils.generateId(),
            articleId: articleId,
            description: receiptArticle.name || '',
            quantity: receiptArticle.quantity || 1,
            unit: receiptArticle.bundleUnit || 'Stück',
            unitPrice: receiptArticle.bundlePrice || 0,
            vatRate: receiptArticle.vatRate || 19,
            taxAccount: receiptArticle.taxAccount,
            total: (receiptArticle.bundlePrice || 0) * (receiptArticle.quantity || 1)
          };
        }),
        currency: 'EUR',
        totalNet: calculatedTotals.netSum,
        totalVat: calculatedTotals.vat7 + calculatedTotals.vat19,
        totalGross: calculatedTotals.grossTotal
      };
      
      // Aktualisiere Receipt mit receiptDetails und isCompleted=true
      // Speichere auch processedOcrData mit Layout-Breiten
      const finalProcessedOcrData: ExtendedReceiptData = {
        ...receiptData,
        supplier: receiptSupplierId ? suppliers.find(s => s.id === receiptSupplierId)?.name || receiptData.supplier : receiptData.supplier,
        supplierId: receiptSupplierId || receiptData.supplierId,
        date: receiptDate || receiptData.date,
        receiptNumber: receiptNumber || receiptData.receiptNumber,
        articles: editedArticles,
          totalArticles: editedArticles.length,
          totalAmount: calculatedTotals.grossTotal,
          vat7: calculatedTotals.vat7,
          vat19: calculatedTotals.vat19,
          isCompleted: true,
        printListPosition: receiptData.printListPosition,
        leftPanelWidth: leftPanelWidth,
        rightPanelWidth: rightPanelWidth
      };
      
      if (onSaveReceipt) {
        await onSaveReceipt({
          processedOcrData: finalProcessedOcrData,
          receiptDetails: receiptDetails,
          isCompleted: true
        });
      }
      
      // Callback aufrufen falls vorhanden
      if (onSave) {
        onSave(completeArticles);
      }

      console.log(`✅ Erfolgreich ${articlesToSave.length} neue und ${articlesToUpdate.length} aktualisierte Artikel übernommen.`);
      console.log(`✅ ReceiptDetails mit ${receiptDetails.lineItems.length} LineItems gespeichert.`);
      
      onClose();
    } catch (error: any) {
      console.error('❌ Fehler beim Übernehmen der Artikel:', error);
      alert(`Fehler beim Übernehmen der Artikel: ${error.message}`);
    }
  };

  // Handler für Bild-Drag
  const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Nur linke Maustaste
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    };
    e.preventDefault();
  };

  const handleImageMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setImagePosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  }, [isDragging]);

  const handleImageMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event-Listener für globales Mouse-Move und Mouse-Up
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleImageMouseMove);
      document.addEventListener('mouseup', handleImageMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleImageMouseMove);
        document.removeEventListener('mouseup', handleImageMouseUp);
      };
    }
  }, [isDragging, handleImageMouseMove, handleImageMouseUp]);

  // Event-Listener für Wheel-Event (nicht-passiv, damit preventDefault funktioniert)
  useEffect(() => {
    if (!show) return;
    
    // Prüfe ob ein Bild vorhanden ist (für normale Bilder) oder Canvas-URLs für PDFs
    const hasImage = !isPDF && imageUrl;
    const hasPdfCanvas = isPDF && displayPdfCanvasUrls.length > 0;
    
    if (!hasImage && !hasPdfCanvas) {
      console.log('⏭️ [WHEEL] Kein Bild/PDF-Canvas vorhanden, Wheel-Handler nicht registriert');
      return;
    }
    
    // Warte kurz, damit der Container gerendert ist
    const timeoutId = setTimeout(() => {
      const container = imageContainerRef.current;
      if (!container) {
        console.log('⚠️ [WHEEL] imageContainerRef.current ist null');
        return;
      }

      console.log('✅ [WHEEL] Registriere Wheel-Handler für Bildvergrößerung');

      const wheelHandler = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageZoom(prevZoom => {
          const newZoom = Math.max(0.5, Math.min(5, prevZoom + delta));
          return newZoom;
        });
      };

      // Speichere Handler in Ref für Cleanup
      wheelHandlerRef.current = wheelHandler;
      container.addEventListener('wheel', wheelHandler, { passive: false });
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      // Entferne Event-Listener falls vorhanden
      const container = imageContainerRef.current;
      const wheelHandler = wheelHandlerRef.current;
      if (container && wheelHandler) {
        console.log('🧹 [WHEEL] Entferne Wheel-Handler');
        container.removeEventListener('wheel', wheelHandler);
        wheelHandlerRef.current = null;
      }
    };
  }, [show, isPDF, imageUrl, displayPdfCanvasUrls.length]);

  // Scroll zu ausgewähltem Element in Category-Dropdown
  useEffect(() => {
    if (showCategoryDropdown && categoryDropdownRef.current && selectedCategoryIndex >= 0) {
      const dropdown = categoryDropdownRef.current;
      const selectedElement = dropdown.children[selectedCategoryIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedCategoryIndex, showCategoryDropdown]);

  // Scroll zu ausgewähltem Element in BundleUnit-Dropdown
  useEffect(() => {
    if (showBundleUnitDropdown && bundleUnitDropdownRef.current && selectedBundleUnitIndex >= 0) {
      const dropdown = bundleUnitDropdownRef.current;
      const selectedElement = dropdown.children[selectedBundleUnitIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedBundleUnitIndex, showBundleUnitDropdown]);

  // Scroll zu ausgewähltem Element in ContentUnit-Dropdown
  useEffect(() => {
    if (showContentUnitDropdown && contentUnitDropdownRef.current && selectedContentUnitIndex >= 0) {
      const dropdown = contentUnitDropdownRef.current;
      const selectedElement = dropdown.children[selectedContentUnitIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedContentUnitIndex, showContentUnitDropdown]);

  // Scroll zu ausgewähltem Element in TaxAccount-Dropdown
  useEffect(() => {
    if (showTaxAccountDropdown && taxAccountDropdownListRef.current && selectedTaxAccountIndex >= 0) {
      const dropdown = taxAccountDropdownListRef.current;
      const selectedElement = dropdown.children[selectedTaxAccountIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedTaxAccountIndex, showTaxAccountDropdown]);

  // Scroll zu ausgewähltem Element in VatRate-Dropdown
  useEffect(() => {
    if (showVatRateDropdown && vatRateDropdownListRef.current && selectedVatRateIndex >= 0) {
      const dropdown = vatRateDropdownListRef.current;
      const selectedElement = dropdown.children[selectedVatRateIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedVatRateIndex, showVatRateDropdown]);

  // Handler für Drag & Drop der Druck-Preview-Liste
  const handlePrintListMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Für PDFs verwenden wir das Canvas-Bild, für normale Bilder das img-Element
    const elementRef = isPDF && pdfCanvasUrls.length > 0 ? printPdfCanvasRef.current : printImageRef.current;
    if (e.button !== 0 || !elementRef || !printPreviewImageSize) return; // Nur linke Maustaste
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPrintList(true);
    
    // Berechne Position relativ zum Bild/PDF
    const elementRect = elementRef.getBoundingClientRect();
    const scaleX = printPreviewImageSize.width / elementRect.width;
    const scaleY = printPreviewImageSize.height / elementRect.height;
    
    // Aktuelle Position in Pixeln relativ zur angezeigten Größe
    const currentDisplayX = (printPreviewListPosition.x / scaleX);
    const currentDisplayY = (printPreviewListPosition.y / scaleY);
    
    printListDragStartRef.current = {
      x: e.clientX - elementRect.left - currentDisplayX,
      y: e.clientY - elementRect.top - currentDisplayY
    };
  }, [printPreviewListPosition, printPreviewImageSize, isPDF, pdfCanvasUrls.length]);

  const handlePrintListMouseMove = useCallback((e: MouseEvent) => {
    // Für PDFs verwenden wir das Canvas-Bild, für normale Bilder das img-Element
    const elementRef = isPDF && pdfCanvasUrls.length > 0 ? printPdfCanvasRef.current : printImageRef.current;
    if (!isDraggingPrintList || !elementRef || !printPreviewImageSize) return;
    
    // Berechne Position relativ zum Bild/PDF-Container
    const container = document.querySelector('[data-print-preview-container]') as HTMLElement;
    if (container && elementRef) {
      const rect = container.getBoundingClientRect();
      const elementRect = elementRef.getBoundingClientRect();
      
      // Berechne Position relativ zur angezeigten Größe
      const displayX = Math.max(0, Math.min(elementRect.width - 250, e.clientX - elementRect.left - printListDragStartRef.current.x));
      const displayY = Math.max(0, Math.min(elementRect.height - 200, e.clientY - elementRect.top - printListDragStartRef.current.y));
      
      // Konvertiere zur natürlichen Größe (Skalierung)
      const scaleX = printPreviewImageSize.width / elementRect.width;
      const scaleY = printPreviewImageSize.height / elementRect.height;
      
      const naturalX = displayX * scaleX;
      const naturalY = displayY * scaleY;
      
      setPrintPreviewListPosition({ 
        x: Math.max(0, Math.min(printPreviewImageSize.width - 250, naturalX)), 
        y: Math.max(0, Math.min(printPreviewImageSize.height - 200, naturalY))
      });
    } else {
      setPrintPreviewListPosition({
        x: e.clientX - printListDragStartRef.current.x,
        y: e.clientY - printListDragStartRef.current.y
      });
    }
  }, [isDraggingPrintList, printPreviewImageSize, isPDF, pdfCanvasUrls.length]);

  const handlePrintListMouseUp = useCallback(() => {
    setIsDraggingPrintList(false);
  }, []);

  // Event-Listener für globales Mouse-Move und Mouse-Up für Druck-Preview
  useEffect(() => {
    if (isDraggingPrintList) {
      document.addEventListener('mousemove', handlePrintListMouseMove);
      document.addEventListener('mouseup', handlePrintListMouseUp);
      return () => {
        document.removeEventListener('mousemove', handlePrintListMouseMove);
        document.removeEventListener('mouseup', handlePrintListMouseUp);
      };
    }
  }, [isDraggingPrintList, handlePrintListMouseMove, handlePrintListMouseUp]);

  // Druckfunktion
  const handlePrint = useCallback(() => {
    // Für PDFs: Verwende Canvas-URLs wenn verfügbar
    if (isPDF) {
      if (pdfCanvasUrls.length === 0 || !printPreviewImageSize) {
        console.warn('⚠️ PDF-Canvas nicht verfügbar für Druck');
        return;
      }
    } else {
      // Für Bilder: Prüfe ob Bild und Größe verfügbar sind
      if (!printImageRef.current || !printPreviewImageSize) {
        console.warn('⚠️ Bildgröße nicht verfügbar für Druck');
        return;
      }
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Berechne Position relativ zur Größe (in Prozent für Skalierung)
    const imageWidth = printPreviewImageSize.width;
    const imageHeight = printPreviewImageSize.height;
    const positionPercentX = (printPreviewListPosition.x / imageWidth) * 100;
    const positionPercentY = (printPreviewListPosition.y / imageHeight) * 100;

    console.log('🖨️ Druck-Position:', {
      pixelPosition: printPreviewListPosition,
      imageSize: printPreviewImageSize,
      percentPosition: { x: positionPercentX, y: positionPercentY },
      isPDF: isPDF
    });

    // Erstelle HTML-Inhalt für PDF (mehrere Canvas-Bilder, eine pro Seite) oder Bild
    let receiptContent: string;
    if (isPDF && pdfCanvasUrls.length > 0) {
      // Für PDFs: Erstelle ein Container pro Seite mit img-Element
      // Verwende die tatsächliche Bildhöhe für bessere Seitenumbrüche
      // Konvertiere Pixel-Höhe zu einer relativen Einheit für bessere Druckkompatibilität
      const pageHeightPx = printPreviewImageSize?.height || 1400;
      const pageWidthPx = printPreviewImageSize?.width || 1000;
      // Verwende eine feste Höhe in mm für bessere Browser-Kompatibilität
      const pageHeightMm = (pageHeightPx * 0.264583).toFixed(2); // Pixel zu mm (96 DPI)
      
      // Einfacher Ansatz: Jedes Bild in einem eigenen Div mit natürlicher Größe
      receiptContent = pdfCanvasUrls.map((url, index) => {
        const isFirstPage = index === 0;
        return `
          <div class="receipt-page-wrapper" style="${!isFirstPage ? 'page-break-before: always;' : ''}">
            <img 
              src="${url}" 
              alt="Beleg Seite ${index + 1}" 
              class="receipt-image receipt-page" 
              data-page-index="${index}" 
            />
          </div>
        `;
      }).join('');
    } else {
      receiptContent = `<img src="${imageUrl}" alt="Beleg" class="receipt-image" />`;
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
              .receipt-page-wrapper {
                page-break-inside: avoid;
                break-inside: avoid;
                width: 100%;
                display: block;
                position: relative;
                page-break-after: auto;
                max-height: 100vh; /* ANPASSBAR: Höhe der Seite - z.B. 100vh, 95vh, 297mm (A4) */
                overflow: hidden;
              }
              .receipt-page-wrapper:not(:first-child) {
                page-break-before: always;
              }
              .receipt-page {
                width: 100%;
                height: auto;
                max-height: 100vh; /* ANPASSBAR: Maximale Höhe des Images - z.B. 100vh, 95vh, 297mm (A4) */
                display: block;
                page-break-inside: avoid;
                break-inside: avoid;
                object-fit: contain;
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
            .receipt-page-wrapper {
              width: 100%;
              display: block;
              position: relative;
              margin-bottom: 0;
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
            ${isPDF && pdfCanvasUrls.length > 0 
              ? pdfCanvasUrls.map((url, index) => `
                <div class="receipt-page-wrapper" style="${index > 0 ? 'page-break-before: always;' : ''}">
                  <div style="position: relative; width: 100%;">
                    <img 
                      src="${url}" 
                      alt="Beleg Seite ${index + 1}" 
                      class="receipt-image receipt-page" 
                      data-page-index="${index}" 
                    />
                    ${index === 0 ? `
                      <div class="tax-account-list">
                        <div class="tax-account-title">Artikelsummen nach Steuerkonten:</div>
                        ${taxAccountTotals.map(item => `
                          <div class="tax-account-item">
                            ${item.total.toFixed(2).replace('.', ',')} € - ${item.accountNumber} - ${item.accountName}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')
              : `
                ${receiptContent}
                <div class="tax-account-list">
                  <div class="tax-account-title">Artikelsummen nach Steuerkonten:</div>
                  ${taxAccountTotals.map(item => `
                    <div class="tax-account-item">
                      ${item.total.toFixed(2).replace('.', ',')} € - ${item.accountNumber} - ${item.accountName}
                    </div>
                  `).join('')}
                </div>
              `
            }
          </div>
          <script>
            // Warte bis alle Bilder geladen sind, dann drucken (nur einmal)
            (function() {
              let printCalled = false;
              let loadedImages = 0;
              
              function callPrintOnce() {
                if (!printCalled) {
                  printCalled = true;
                  setTimeout(function() {
                    window.print();
                  }, 300);
                }
              }
              
              function checkAllLoaded() {
                loadedImages++;
                const totalImages = document.querySelectorAll('.receipt-image').length;
                if (loadedImages >= totalImages && totalImages > 0) {
                  callPrintOnce();
                }
              }
              
              // Warte bis DOM geladen ist
              if (document.readyState === 'complete') {
                const images = document.querySelectorAll('.receipt-image');
                if (images.length === 0) {
                  callPrintOnce();
                } else {
                  images.forEach(function(img) {
                    if (img.complete) {
                      checkAllLoaded();
                    } else {
                      img.onload = checkAllLoaded;
                      img.onerror = checkAllLoaded; // Auch bei Fehler weitermachen
                    }
                  });
                }
              } else {
                window.addEventListener('load', function() {
                  const images = document.querySelectorAll('.receipt-image');
                  if (images.length === 0) {
                    callPrintOnce();
                  } else {
                    images.forEach(function(img) {
                      if (img.complete) {
                        checkAllLoaded();
                      } else {
                        img.onload = checkAllLoaded;
                        img.onerror = checkAllLoaded;
                      }
                    });
                  }
                });
              }
            })();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }, [imageUrl, pdfCanvasUrls, taxAccountTotals, printPreviewListPosition, printPreviewImageSize, isPDF]);

  // Reset Zoom und Position beim Öffnen, Wiederherstellen der Druck-Position
  // WICHTIG: Nur beim Öffnen (show wird true), nicht bei jeder receiptData-Änderung!
  useEffect(() => {
    if (show) {
      // Wiederherstelle gespeicherte Bildansicht-Einstellungen
      if (receiptData.imageZoom !== undefined) {
        setImageZoom(receiptData.imageZoom);
        prevImageZoomRef.current = receiptData.imageZoom;
      } else {
        setImageZoom(1);
        prevImageZoomRef.current = 1;
      }
      
      if (receiptData.imagePosition) {
        setImagePosition(receiptData.imagePosition);
        prevImagePositionRef.current = receiptData.imagePosition;
      } else {
        setImagePosition({ x: 0, y: 0 });
        prevImagePositionRef.current = { x: 0, y: 0 };
      }
      
      // Wiederherstelle gespeicherte Druck-Position
      if (receiptData.printListPosition) {
        setPrintPreviewListPosition(receiptData.printListPosition);
      } else {
        setPrintPreviewListPosition({ x: 50, y: 50 });
      }
      
      // Wiederherstelle Layout-Breiten
      if (receiptData.leftPanelWidth !== undefined) {
        setLeftPanelWidth(receiptData.leftPanelWidth);
      } else {
        setLeftPanelWidth(300); // Standard-Breite
      }
      if (receiptData.rightPanelWidth !== undefined) {
        setRightPanelWidth(receiptData.rightPanelWidth);
      } else {
        setRightPanelWidth(400); // Standard-Breite
      }
      
      // Wiederherstelle Fertig-Status
      setIsCompleted(receiptData.isCompleted || false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]); // Nur bei show-Änderung, nicht bei receiptData-Änderungen!
  
  // Speichere Position beim Ändern (nur wenn sie sich wirklich geändert hat)
  useEffect(() => {
    // Prüfe ob Position sich geändert hat (nicht beim ersten Laden)
    if (prevPositionRef.current && 
        onUpdateReceiptData && 
        printPreviewListPosition &&
        (prevPositionRef.current.x !== printPreviewListPosition.x || 
         prevPositionRef.current.y !== printPreviewListPosition.y)) {
      // Aktualisiere nur die Position, nicht die gesamten Daten
      if (onUpdateReceiptDataRef.current) {
        onUpdateReceiptDataRef.current({
          ...receiptDataRef.current,
          printListPosition: printPreviewListPosition
        });
      }
    }
    prevPositionRef.current = printPreviewListPosition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printPreviewListPosition]); // Nur bei Änderung der Position, nicht bei jeder receiptData-Änderung

  // Speichere Fertig-Status beim Ändern
  useEffect(() => {
    // Prüfe ob Status sich geändert hat (nicht beim ersten Laden)
    if (prevCompletedRef.current !== null && 
        onUpdateReceiptData && 
        prevCompletedRef.current !== isCompleted) {
      // Aktualisiere nur den Status, nicht die gesamten Daten
      if (onUpdateReceiptDataRef.current) {
        onUpdateReceiptDataRef.current({
          ...receiptDataRef.current,
          isCompleted: isCompleted
        });
      }
    }
    prevCompletedRef.current = isCompleted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]); // Nur bei Änderung des Status, nicht bei jeder receiptData-Änderung

  // Speichere Bild-Zoom beim Ändern (nur wenn er sich wirklich geändert hat)
  useEffect(() => {
    // Prüfe ob Zoom sich geändert hat (nicht beim ersten Laden)
    if (prevImageZoomRef.current !== null && 
        onUpdateReceiptData && 
        prevImageZoomRef.current !== imageZoom) {
      // Aktualisiere nur den Zoom, nicht die gesamten Daten
      if (onUpdateReceiptDataRef.current) {
        onUpdateReceiptDataRef.current({
          ...receiptDataRef.current,
          imageZoom: imageZoom
        });
      }
    }
    prevImageZoomRef.current = imageZoom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageZoom]); // Nur bei Änderung des Zooms, nicht bei jeder receiptData-Änderung

  // Speichere Bild-Position beim Ändern (nur wenn sie sich wirklich geändert hat)
  useEffect(() => {
    // Prüfe ob Position sich geändert hat (nicht beim ersten Laden)
    if (prevImagePositionRef.current && 
        onUpdateReceiptData && 
        imagePosition &&
        (prevImagePositionRef.current.x !== imagePosition.x || 
         prevImagePositionRef.current.y !== imagePosition.y)) {
      // Aktualisiere nur die Position, nicht die gesamten Daten
      if (onUpdateReceiptDataRef.current) {
        onUpdateReceiptDataRef.current({
          ...receiptDataRef.current,
          imagePosition: imagePosition
        });
      }
    }
    prevImagePositionRef.current = imagePosition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePosition]); // Nur bei Änderung der Position, nicht bei jeder receiptData-Änderung

  if (!show) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full"
      style={{
        background: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        top: 56,
        height: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div className="w-100" style={{ maxWidth: '95%', maxHeight: '90vh' }}>
        <div className="d-flex" style={{ height: '100%', maxHeight: '90vh' }}>
          {/* Linke Seite: Artikel-Liste (Beleg-Übersicht) */}
          <div 
            className="card"
            style={{
              width: `${leftPanelWidth}px`,
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              maxHeight: '90vh',
              height: '90vh'
            }}
          >
            {/* Header - Fix */}
            <div 
              className="card-header"
              style={{ 
                flexShrink: 0,
                padding: '0.75rem'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0 form-label-themed">Beleg-Übersicht</h5>
                {/* Netto/Brutto Toggle-Button */}
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNettoPricesChange(!nettoPrices);
                  }}
                  style={{
                    color: nettoPrices ? (colors.accent || colors.primary) : colors.textSecondary,
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s ease'
                  }}
                  title={nettoPrices ? 'Netto-Preise (ohne MwSt) - Klicken für Brutto-Preise' : 'Brutto-Preise (mit MwSt) - Klicken für Netto-Preise'}
                >
                  {nettoPrices ? (
                    <FaPercent />
                  ) : (
                    <FaEuroSign />
                  )}
                </button>
              </div>
              {/* Lieferant • Belegdatum - Fix im Header */}
              <div 
                className="pt-2"
                style={{ borderTop: `1px solid var(--theme-card-border)` }}
              >
                <div className="text-theme-primary" style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {receiptData.supplier || 'Nicht erkannt'}
                  </span>
                  {receiptData.supplier && (receiptData.date || receiptDate) && ' • '}
                  <span style={{ fontWeight: 'bold' }}>
                    {formatDate(receiptDate || receiptData.date)}
                  </span>
                  {receiptNumber && (
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Belegnummer: {receiptNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollbarer Inhalt */}
            <div 
              className="card-body"
              style={{
                overflowY: 'auto',
                flex: 1,
                padding: '0.75rem'
              }}
            >

              {/* Artikel-Liste */}
              <div className="card-list">
                {editedArticles.map((article, index) => (
                  <div
                    key={index}
                    className={`list-group-item ${selectedArticleIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedArticleIndex(index)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const updatedArticles = [...editedArticles];
                      updatedArticles[index] = {
                        ...updatedArticles[index],
                        excludeFromUpdate: !updatedArticles[index].excludeFromUpdate
                      };
                      setEditedArticles(updatedArticles);
                    }}
                    style={{
                      opacity: article.excludeFromUpdate ? 0.5 : 1,
                      cursor: 'pointer'
                    }}
                    title={article.excludeFromUpdate ? 'Dieser Artikel wird nicht mit den Stammdaten aktualisiert' : 'Doppelklick zum Ausblenden beim Update'}
                  >
                    {/* Zeile 1: Artikelbezeichnung mit Verknüpfungs-Status */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-theme-primary" style={{ fontWeight: 'bold' }}>{article.name || 'Unbenannt'}</span>
                        {article.linkedArticleId && (
                          <FaCheck style={{ fontSize: '0.9rem', color: '#28a745' }} title="Mit Artikelstamm verknüpft" />
                        )}
                        {isArticleComplete(article) && !article.linkedArticleId && (
                          <FaExclamationTriangle style={{ fontSize: '0.9rem', color: colors.accent || '#ffc107' }} title="Vollständig - wird als neuer Artikel angelegt" />
                        )}
                      </div>
                      <span className="badge" style={{ fontSize: '0.7em', padding: '0.15rem 0.5rem' }}>
                        {article.vatRate === 7 ? '2' : article.vatRate === 19 ? '1' : article.vatRate === 0 ? '0' : `${article.vatRate || 19}%`}
                      </span>
                    </div>
                    
                    {/* Zeile 2: Menge x Gebindeeinheit à Einzelpreis = Gesamtpreis */}
                    <div className="text-sm text-muted">
                      {article.quantity || 1} × 1 {article.bundleUnit || 'Stück'} à {formatPrice(article.bundlePrice || 0)} = <strong>{formatPrice(article.price || 0)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer - Fix unten */}
            <div 
              className="card-footer"
              style={{
                flexShrink: 0
              }}
            >
              <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <div 
                  className="d-flex justify-content-between align-items-center"
                  onMouseEnter={() => setShowArticleCountControls(true)}
                  onMouseLeave={() => setShowArticleCountControls(false)}
                  style={{ position: 'relative' }}
                >
                  <span style={{ color: colors.textSecondary }}>Anzahl Einzelposten:</span>
                  <div className="d-flex align-items-center gap-2" style={{ position: 'relative' }}>
                    {showArticleCountControls && (
                      <>
                        <button
                          className="btn btn-link p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveArticle();
                          }}
                          disabled={editedArticles.length <= 1}
                          style={{ 
                            color: editedArticles.length <= 1 ? colors.textSecondary : colors.text,
                            cursor: editedArticles.length <= 1 ? 'not-allowed' : 'pointer',
                            padding: '0.125rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Artikel entfernen"
                        >
                          <FaMinus size={12} />
                        </button>
                      </>
                    )}
                    <strong style={{ color: colors.text, minWidth: '2rem', textAlign: 'center' }}>
                      {calculatedTotals.totalArticles}
                    </strong>
                    {showArticleCountControls && (
                      <button
                        className="btn btn-link p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddArticle();
                        }}
                        style={{ 
                          color: colors.text,
                          cursor: 'pointer',
                          padding: '0.125rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Neuen Artikel hinzufügen"
                      >
                        <FaPlus size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span style={{ color: colors.textSecondary }}>Nettosumme:</span>
                  <strong style={{ color: colors.text }}>
                    {formatPrice(calculatedTotals.netSum)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span style={{ color: colors.textSecondary }}>1 USt. 19%:</span>
                  <strong 
                    style={{ 
                      color: colors.text,
                      backgroundColor: isDifferentFromScan('vat19') ? (colors.accent || '#ffc107') + '40' : 'transparent',
                      padding: isDifferentFromScan('vat19') ? '0.125rem 0.25rem' : '0',
                      borderRadius: isDifferentFromScan('vat19') ? '0.25rem' : '0'
                    }}
                    title={isDifferentFromScan('vat19') ? `Scan: ${formatPrice(scanTotals.vat19)}` : ''}
                  >
                    {formatPrice(calculatedTotals.vat19)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span style={{ color: colors.textSecondary }}>2 USt. 7%:</span>
                  <strong 
                    style={{ 
                      color: colors.text,
                      backgroundColor: isDifferentFromScan('vat7') ? (colors.accent || '#ffc107') + '40' : 'transparent',
                      padding: isDifferentFromScan('vat7') ? '0.125rem 0.25rem' : '0',
                      borderRadius: isDifferentFromScan('vat7') ? '0.25rem' : '0'
                    }}
                    title={isDifferentFromScan('vat7') ? `Scan: ${formatPrice(scanTotals.vat7)}` : ''}
                  >
                    {formatPrice(calculatedTotals.vat7)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span style={{ color: colors.textSecondary }}>Rechnungsbetrag inkl. MwSt.:</span>
                  <strong 
                    style={{ 
                      color: colors.text,
                      backgroundColor: isDifferentFromScan('grossTotal') ? (colors.accent || '#ffc107') + '40' : 'transparent',
                      padding: isDifferentFromScan('grossTotal') ? '0.125rem 0.25rem' : '0',
                      borderRadius: isDifferentFromScan('grossTotal') ? '0.25rem' : '0'
                    }}
                    title={isDifferentFromScan('grossTotal') ? `Scan: ${formatPrice(scanTotals.totalAmount)}` : ''}
                  >
                    {formatPrice(calculatedTotals.grossTotal)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resize-Handle zwischen Beleg-Übersicht und Artikel bearbeiten */}
          <div
            onMouseDown={handleLeftResizeStart}
            style={{
              width: '8px',
              cursor: 'col-resize',
              backgroundColor: isResizingLeft ? colors.primary : 'transparent',
              flexShrink: 0,
              position: 'relative',
              margin: '0',
              transition: 'background-color 0.2s'
            }}
            title="Ziehen zum Anpassen der Breite"
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '2px',
                height: '40px',
                backgroundColor: colors.cardBorder || '#dee2e6',
                borderRadius: '1px'
              }}
            />
          </div>

          {/* Mitte: Artikelformular (Artikel bearbeiten) */}
          <div 
            className="card flex-grow-1"
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              height: '90vh',
              minWidth: '400px' // Minimale Breite für Artikelformular
            }}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 form-label-themed">
                Artikel bearbeiten: {editedArticles[selectedArticleIndex]?.name || 'Unbekannt'}
              </h5>
              <button
                className="btn btn-link p-0"
                onClick={onClose}
                style={{ color: colors.text }}
              >
                <FaTimes />
              </button>
            </div>
            <div 
              className="card-body"
              style={{
                overflowY: 'auto',
                flex: 1,
                minHeight: 0
              }}
            >
                      {/* Vollständiges Artikelformular */}
                      <form>
                        {/* Lieferant für alle Artikel */}
                        <div className="mb-4">
                          <div className="flex flex-wrap -mx-2">
                            {/* Lieferant */}
                            <div className={`px-2 mb-3 flex-shrink-0 ${
                              scannedSupplierName && !hideScannedSupplierName && scannedSupplierName.toLowerCase() !== (receiptSupplierId ? getSupplierName(receiptSupplierId).toLowerCase() : receiptSupplierSearchTerm.toLowerCase())
                                ? 'w-full md:w-1/2'
                                : !(scannedSupplierName && !hideScannedSupplierName && scannedSupplierName.toLowerCase() !== (receiptSupplierId ? getSupplierName(receiptSupplierId).toLowerCase() : receiptSupplierSearchTerm.toLowerCase()))
                                  ? 'w-full md:w-1/2'
                                  : 'w-full md:w-1/2'
                            }`}>
                              <label className="form-label form-label-themed">
                                Lieferant (für alle Artikel)
                              </label>
                              <div className="relative">
                                <div className="input-group">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={receiptSupplierId 
                                      ? (receiptSupplierSearchTerm || getSupplierName(receiptSupplierId))
                                      : (receiptSupplierSearchTerm || 'Kein Lieferant ausgewählt!')
                                    }
                                    onChange={(e) => {
                                      setReceiptSupplierSearchTerm(e.target.value);
                                      // Zeige Dropdown beim Tippen
                                      if (e.target.value.length >= 0) {
                                        setShowSupplierDropdown(true);
                                      }
                                    }}
                                    onFocus={() => setShowSupplierDropdown(true)}
                                    onBlur={() => {
                                      setTimeout(() => setShowSupplierDropdown(false), 200);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        // Hier könnte man die Navigation implementieren
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        // Wähle ersten passenden Lieferanten aus oder "Kein Lieferant"
                                        if (receiptSupplierSearchTerm === '' || receiptSupplierSearchTerm === 'Kein Lieferant ausgewählt!') {
                                          handleReceiptSupplierSelect(null);
                                        } else {
                                          const filtered = suppliers.filter(s => 
                                            s.name.toLowerCase().includes(receiptSupplierSearchTerm.toLowerCase())
                                          );
                                          if (filtered.length > 0) {
                                            handleReceiptSupplierSelect(filtered[0]);
                                          }
                                        }
                                      }
                                    }}
                                    placeholder="Lieferant für alle Artikel auswählen..."
                                    style={{
                                      fontStyle: !receiptSupplierId ? 'italic' : 'normal',
                                      color: !receiptSupplierId ? 'var(--theme-text-secondary)' : 'var(--theme-text)'
                                    }}
                                  />
                                  {receiptSupplierId && scannedSupplierName && !hideScannedSupplierName && scannedSupplierName.toLowerCase() !== getSupplierName(receiptSupplierId).toLowerCase() && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-input"
                                      onClick={() => {
                                        setHideScannedSupplierName(true);
                                      }}
                                      title="Gewählten Lieferanten übernehmen (erkannten Namen ignorieren)"
                                    >
                                      <FaCheck />
                                    </button>
                                  )}
                                </div>
                                {showSupplierDropdown && (
                                  <div className="absolute w-full" style={{
                                    top: '100%',
                                    left: 0,
                                    zIndex: 1000,
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    backgroundColor: colors.card,
                                    border: `1px solid ${colors.cardBorder}`,
                                    borderRadius: '0 0 0.375rem 0.375rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                  }}>
                                    {/* Option: Kein Lieferant ausgewählt */}
                                    <div
                                      className="px-3 py-2 cursor-pointer"
                                      onClick={() => handleReceiptSupplierSelect(null)}
                                      style={{
                                        color: colors.text,
                                        borderBottom: `1px solid ${colors.cardBorder}`,
                                        cursor: 'pointer',
                                        backgroundColor: !receiptSupplierId ? (colors.accent || colors.primary) + '20' : 'transparent',
                                        fontStyle: 'italic'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (receiptSupplierId) {
                                          e.currentTarget.style.backgroundColor = colors.secondary;
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (receiptSupplierId) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                      }}
                                    >
                                      Kein Lieferant ausgewählt!
                                    </div>
                                    
                                    {/* Gefilterte Lieferanten */}
                                    {(() => {
                                      const filteredSuppliers = receiptSupplierSearchTerm
                                        ? suppliers.filter(s => 
                                            s.name.toLowerCase().includes(receiptSupplierSearchTerm.toLowerCase())
                                          )
                                        : suppliers;
                                      
                                      return filteredSuppliers.length > 0 ? (
                                        filteredSuppliers.map((supplier) => (
                                          <div
                                            key={supplier.id}
                                            className="px-3 py-2 cursor-pointer"
                                            onClick={() => handleReceiptSupplierSelect(supplier)}
                                            style={{
                                              color: colors.text,
                                              borderBottom: `1px solid ${colors.cardBorder}`,
                                              cursor: 'pointer',
                                              backgroundColor: receiptSupplierId === supplier.id ? (colors.accent || colors.primary) + '20' : 'transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                              if (receiptSupplierId !== supplier.id) {
                                                e.currentTarget.style.backgroundColor = colors.secondary;
                                              }
                                            }}
                                            onMouseLeave={(e) => {
                                              if (receiptSupplierId !== supplier.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                              }
                                            }}
                                          >
                                            <div style={{ fontWeight: 'bold' }}>{supplier.name}</div>
                                            <small style={{ color: colors.accent || colors.primary }}>{supplier.contactPerson}</small>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                          Kein Lieferant gefunden
                                        </div>
                                      );
                                    })()}
                                    
                                    {/* Option: Neuen Lieferanten anlegen */}
                                    {receiptSupplierSearchTerm && !suppliers.some(s => s.name.toLowerCase() === receiptSupplierSearchTerm.toLowerCase()) && (
                                      <div
                                        className="px-3 py-2 cursor-pointer"
                                        onClick={() => {
                                          if (onNewSupplier) {
                                            onNewSupplier(receiptSupplierSearchTerm);
                                          }
                                        }}
                                        style={{
                                          color: colors.accent || colors.primary,
                                          borderTop: `2px solid ${colors.accent || colors.primary}`,
                                          borderBottom: `1px solid ${colors.cardBorder}`,
                                          cursor: 'pointer',
                                          fontWeight: 'bold'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = colors.secondary;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        "{receiptSupplierSearchTerm}" als neuen Lieferanten anlegen
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Erkannte Lieferantenname (wenn nicht exakt übereinstimmend und nicht ausgeblendet) */}
                            {scannedSupplierName && !hideScannedSupplierName && scannedSupplierName.toLowerCase() !== (receiptSupplierId ? getSupplierName(receiptSupplierId).toLowerCase() : receiptSupplierSearchTerm.toLowerCase()) && (
                              <div className="w-full md:w-1/2 px-2 mb-3 flex-shrink-0">
                                <label className="form-label form-label-themed">
                                  Erkannt (aus Beleg)
                                </label>
                                <div className="input-group">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={scannedSupplierName}
                                    onChange={(e) => setScannedSupplierName(e.target.value)}
                                    placeholder="Erkannt (aus Beleg)"
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-input"
                                    onClick={async () => {
                                      if (!scannedSupplierName.trim()) return;
                                      
                                      if (receiptSupplierId) {
                                        // Update vorhandenen Lieferanten
                                        const supplier = suppliers.find(s => s.id === receiptSupplierId);
                                        if (supplier) {
                                          const updatedSupplier = {
                                            ...supplier,
                                            name: scannedSupplierName.trim()
                                          };
                                          
                                          try {
                                            // Aktualisiere über StorageLayer
                                            const storageMode = localStorage.getItem('chef_storage_mode');
                                            if (storageMode === 'cloud') {
                                              const response = await fetch(`http://localhost:3001/api/v1/suppliers/${supplier.id}`, {
                                                method: 'PUT',
                                                headers: {
                                                  'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify(updatedSupplier)
                                              });
                                              
                                              if (!response.ok) {
                                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                              }
                                              
                                              const result = await response.json();
                                              updatedSupplier.id = result.data.id;
                                            }
                                            
                                            // Aktualisiere lokalen State
                                            dispatch({ 
                                              type: 'UPDATE_SUPPLIER', 
                                              payload: { id: supplier.id, supplier: updatedSupplier }
                                            });
                                            
                                            // Aktualisiere die Anzeige
                                            setReceiptSupplierSearchTerm(scannedSupplierName.trim());
                                            setReceiptSupplierId(supplier.id);
                                            
                                            console.log('✅ Lieferant aktualisiert:', scannedSupplierName.trim());
                                          } catch (error) {
                                            console.error('❌ Fehler beim Aktualisieren des Lieferanten:', error);
                                          }
                                        }
                                      } else {
                                        // Erstelle neuen Lieferanten
                                        const newSupplier: SupplierType = {
                                          id: UUIDUtils.generateId(),
                                          name: scannedSupplierName.trim(),
                                          contactPerson: '',
                                          email: '',
                                          phoneNumbers: [],
                                          address: {
                                            street: '',
                                            zipCode: '',
                                            city: '',
                                            country: 'Deutschland'
                                          },
                                          website: '',
                                          notes: '',
                                          isNew: true,
                                          isDirty: true,
                                          syncStatus: 'pending'
                                        };
                                        
                                        try {
                                          // Speichere über StorageLayer
                                          const success = await storageLayer.save('suppliers', [newSupplier]);
                                          
                                          if (!success) {
                                            throw new Error('Fehler beim Speichern des neuen Lieferanten');
                                          }
                                          
                                          // Aktualisiere globalen State
                                          dispatch({ 
                                            type: 'ADD_SUPPLIER', 
                                            payload: newSupplier 
                                          });
                                          
                                          // Konvertiere zu Supplier (useArticleForm Typ) für die Auswahl
                                          const supplierForSelection: Supplier = {
                                            id: newSupplier.id,
                                            name: newSupplier.name,
                                            contactPerson: newSupplier.contactPerson || '',
                                            email: newSupplier.email || '',
                                            phoneNumbers: newSupplier.phoneNumbers.map(phone => ({
                                              type: phone.type,
                                              number: phone.number
                                            })),
                                            address: newSupplier.address,
                                            website: newSupplier.website || '',
                                            notes: newSupplier.notes || ''
                                          };
                                          
                                          // Wähle den neuen Lieferanten aus
                                          handleReceiptSupplierSelect(supplierForSelection);
                                          
                                          console.log('✅ Neuer Lieferant erstellt:', scannedSupplierName.trim());
                                        } catch (error) {
                                          console.error('❌ Fehler beim Erstellen des neuen Lieferanten:', error);
                                        }
                                      }
                                    }}
                                    title={receiptSupplierId ? "Lieferantennamen übernehmen" : "Neuen Lieferanten erstellen"}
                                  >
                                    {receiptSupplierId ? (
                                      <FaCheck />
                                    ) : (
                                      <FaPlus />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Belegdatum und Belegnummer (ausgeblendet wenn erkanntes Feld sichtbar ist) */}
                            {!(scannedSupplierName && !hideScannedSupplierName && scannedSupplierName.toLowerCase() !== (receiptSupplierId ? getSupplierName(receiptSupplierId).toLowerCase() : receiptSupplierSearchTerm.toLowerCase())) && (
                              <>
                                <div className="w-full md:w-1/5 px-2 mb-3 flex-shrink-0">
                                  <label className="form-label form-label-themed">
                                    Belegdatum
                                  </label>
                                  <input
                                    type="date"
                                    className="form-control form-control-themed"
                                    value={receiptDate || receiptData.date || ''}
                                    onChange={(e) => {
                                      setReceiptDate(e.target.value);
                                    }}
                                    placeholder="Belegdatum"
                                  />
                                </div>
                                <div className="w-full md:w-[30%] px-2 mb-3 flex-shrink-0">
                                  <label className="form-label form-label-themed">
                                    Belegnummer
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control form-control-themed"
                                    value={receiptNumber}
                                    onChange={(e) => setReceiptNumber(e.target.value)}
                                    placeholder="Belegnummer"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                {/* Grunddaten */}
                <div className="mb-4">
                  <div className="w-full">
                    <h6 className="form-label-themed section-header">
                      Grunddaten
                    </h6>
                  </div>
                  <div className="flex flex-wrap -mx-2">
                    <div className="w-full md:w-2/12 px-2 mb-3">
                      <label className="form-label form-label-themed">
                        Menge
                      </label>
                      <input
                        ref={quantityInputRef}
                        type="number"
                        className="form-control form-control-themed text-center"
                        value={editedArticles[selectedArticleIndex]?.quantity || 1}
                        min="1"
                        step="1"
                        tabIndex={1}
                        onChange={(e) => {
                          const newQuantity = Math.max(1, Math.round(parseFloat(e.target.value) || 1));
                          const updatedArticles = [...editedArticles];
                          updatedArticles[selectedArticleIndex] = {
                            ...updatedArticles[selectedArticleIndex],
                            quantity: newQuantity
                          };
                          setEditedArticles(updatedArticles);
                          
                          // Berechne Gesamtpreis neu wenn Menge geändert wird
                          const currentArticle = updatedArticles[selectedArticleIndex];
                          if (currentArticle.bundlePrice) {
                            const newPrice = currentArticle.bundlePrice * newQuantity;
                            updatedArticles[selectedArticleIndex] = {
                              ...currentArticle,
                              price: newPrice
                            };
                            setEditedArticles(updatedArticles);
                          }
                          previousQuantityRef.current = newQuantity;
                        }}
                        onKeyDown={(e) => {
                          // Pfeiltasten: nur ganze Zahlen (step 1)
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            const currentQuantity = editedArticles[selectedArticleIndex]?.quantity || 1;
                            const newQuantity = e.key === 'ArrowUp' 
                              ? Math.floor(currentQuantity) + 1
                              : Math.max(1, Math.floor(currentQuantity) - 1);
                            const updatedArticles = [...editedArticles];
                            updatedArticles[selectedArticleIndex] = {
                              ...updatedArticles[selectedArticleIndex],
                              quantity: newQuantity
                            };
                            setEditedArticles(updatedArticles);
                            
                            // Berechne Gesamtpreis neu
                            const currentArticle = updatedArticles[selectedArticleIndex];
                            if (currentArticle.bundlePrice) {
                              const newPrice = currentArticle.bundlePrice * newQuantity;
                              updatedArticles[selectedArticleIndex] = {
                                ...currentArticle,
                                price: newPrice
                              };
                              setEditedArticles(updatedArticles);
                            }
                          }
                        }}
                        onWheel={(e) => {
                          // Mausrad: nur ganze Zahlen (step 1)
                          e.preventDefault();
                          const currentQuantity = editedArticles[selectedArticleIndex]?.quantity || 1;
                          const delta = e.deltaY > 0 ? -1 : 1;
                          const newQuantity = Math.max(1, Math.floor(currentQuantity) + delta);
                          const updatedArticles = [...editedArticles];
                          updatedArticles[selectedArticleIndex] = {
                            ...updatedArticles[selectedArticleIndex],
                            quantity: newQuantity
                          };
                          setEditedArticles(updatedArticles);
                          
                          // Berechne Gesamtpreis neu
                          const currentArticle = updatedArticles[selectedArticleIndex];
                          if (currentArticle.bundlePrice) {
                            const newPrice = currentArticle.bundlePrice * newQuantity;
                            updatedArticles[selectedArticleIndex] = {
                              ...currentArticle,
                              price: newPrice
                            };
                            setEditedArticles(updatedArticles);
                          }
                        }}
                      />
                    </div>
                    <div className="w-full md:w-5/12 px-2 mb-3">
                      <label className="form-label form-label-themed">
                        Artikelname
                      </label>
                      <div className="input-group">
                                <input
                                  type="text"
                                  className={`form-control form-control-themed ${isFieldInvalid('name', articleForm.name) ? 'is-invalid' : ''}`}
                                  value={articleForm.name}
                                  onChange={(e) => handleArticleNameChangeWithCategory(e.target.value)}
                                  onFocus={(e) => {
                                    // Cursor am Anfang positionieren, ohne Text zu markieren
                                    e.target.setSelectionRange(0, 0);
                                  }}
                                  tabIndex={2}
                                  required
                                />
                        <button
                          type="button"
                          className="btn btn-outline-input"
                          title="Artikel aus Bestand übernehmen"
                          onClick={() => {
                            // Setze Suchbegriff auf längstes Wort aus Artikelname für automatische Zuordnung
                            const currentArticle = editedArticles[selectedArticleIndex];
                            const articleName = currentArticle.nameOCR || currentArticle.name || '';
                            // Extrahiere das längste Wort aus dem Artikelnamen
                            const words = articleName.trim().split(/\s+/).filter(word => word.length > 0);
                            const longestWord = words.length > 0 
                              ? words.reduce((longest, word) => word.length > longest.length ? word : longest, words[0])
                              : '';
                            setArticleSearchTerm(longestWord);
                            setShowArticleSearchModal(true);
                          }}
                        >
                          <FaSearch />
                        </button>
                      </div>
                    </div>
                    <div className="w-full md:w-5/12 px-2 mb-3">
                      <label className="form-label form-label-themed">
                        Kategorie
                      </label>
                      <div className="relative" ref={categoryContainerRef}>
                        <input
                          type="text"
                          className="form-control"
                          value={articleForm.category}
                          onChange={(e) => handleCategoryInputChange(e.target.value)}
                          onFocus={() => {
                            setShowCategoryDropdown(true);
                            setSelectedCategoryIndex(0); // Initialisiere auf erste Option
                          }}
                          onBlur={handleCategoryInputBlur}
                          onKeyDown={handleCategoryKeyDown}
                          tabIndex={3}
                          placeholder="Kategorie auswählen oder eingeben..."
                        />
                        {showCategoryDropdown && (
                          <div 
                            ref={categoryDropdownRef}
                            className="absolute w-full" 
                            style={{
                            top: '100%',
                            left: 0,
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.cardBorder}`,
                            borderRadius: '0 0 0.375rem 0.375rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}>
                            {getFilteredCategories().length > 0 ? (
                              getFilteredCategories().map((category, index) => (
                                <div
                                  key={`category-dropdown-${index}-${category}`}
                                  className="dropdown-item"
                                  onClick={() => handleCategorySelect(category)}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedCategoryIndex === index ? (colors.accent || colors.primary) + '20' : 'transparent',
                                    color: colors.text,
                                    fontSize: '0.9rem',
                                    borderBottom: index < getFilteredCategories().length - 1 ? `1px solid ${colors.cardBorder}` : 'none'
                                  }}
                                  onMouseEnter={() => setSelectedCategoryIndex(index)}
                                >
                                  {category}
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '8px 12px', color: colors.textSecondary, fontSize: '0.9rem' }}>
                                Keine Kategorien gefunden
                              </div>
                            )}
                            
                            {/* Option für neue Kategorie */}
                            {categorySearchTerm && !categoryManager.categoryExists(categorySearchTerm) && (
                              <div
                                className="dropdown-item"
                                onClick={() => handleCategorySelect(categorySearchTerm)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  backgroundColor: selectedCategoryIndex === getFilteredCategories().length ? (colors.accent || colors.primary) + '20' : 'transparent',
                                  color: colors.accent || colors.primary,
                                  fontSize: '0.9rem',
                                  fontWeight: '500',
                                  borderTop: `2px solid ${colors.cardBorder}`,
                                  borderBottom: `1px solid ${colors.cardBorder}`
                                }}
                                onMouseEnter={() => {
                                  if (selectedCategoryIndex !== getFilteredCategories().length) {
                                    setSelectedCategoryIndex(getFilteredCategories().length);
                                  }
                                }}
                              >
                                <FaPlus style={{ marginRight: '8px', fontSize: '0.8rem' }} />
                                Neue Kategorie: "{categorySearchTerm}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-4/12 px-2 mb-3">
                      <label className="form-label">
                        Artikelnummer
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={articleForm.supplierArticleNumber}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, supplierArticleNumber: e.target.value }))}
                        tabIndex={4}
                      />
                    </div>
                    <div className="md:w-1/3 px-2 mb-3">
                      <label className="form-label block">
                        Steuerkonto ({selectedChartId.toUpperCase().replace(/SKR(\d)/, 'SKR $1')})
                      </label>
                      <div className="relative" ref={taxAccountDropdownRef}>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control form-control-themed"
                            tabIndex={5}
                            value={showTaxAccountDropdown || taxAccountSearchTerm ? taxAccountSearchTerm : (selectedTaxAccount ? (() => {
                              const account = accountingAccounts.find(acc => acc.number === selectedTaxAccount) || 
                                            SKR3_TAX_ACCOUNTS.find(acc => acc.number === selectedTaxAccount);
                              return account ? `${account.number} - ${account.name}` : selectedTaxAccount;
                            })() : '')}
                            onClick={() => {
                              setShowTaxAccountDropdown(true);
                              setSelectedTaxAccountIndex(0); // Initialisiere auf erste Option
                              if (selectedTaxAccount) {
                                // Setze das ausgewählte Konto zurück, damit der Benutzer neu suchen kann
                                setSelectedTaxAccount('');
                                setTaxAccountSearchTerm('');
                              }
                            }}
                            onFocus={() => {
                              setShowTaxAccountDropdown(true);
                              setSelectedTaxAccountIndex(0); // Initialisiere auf erste Option
                            }}
                            onChange={(e) => {
                              setTaxAccountSearchTerm(e.target.value);
                              setShowTaxAccountDropdown(true);
                              setSelectedTaxAccountIndex(0); // Reset auf erste Option bei Eingabe
                              // Setze das ausgewählte Konto zurück, wenn der Benutzer tippt
                              if (selectedTaxAccount) {
                                setSelectedTaxAccount('');
                              }
                            }}
                            onKeyDown={(e) => {
                              const accountsToShow = accountingAccounts.length > 0 ? accountingAccounts : SKR3_TAX_ACCOUNTS;
                              const filtered = accountsToShow.filter(account => {
                                if (!taxAccountSearchTerm) return true;
                                const searchLower = taxAccountSearchTerm.toLowerCase();
                                return account.number.toLowerCase().includes(searchLower) || 
                                       account.name.toLowerCase().includes(searchLower);
                              });

                              switch (e.key) {
                                case 'ArrowDown':
                                  e.preventDefault();
                                  setShowTaxAccountDropdown(true);
                                  setSelectedTaxAccountIndex(prev => {
                                    if (prev < filtered.length - 1) return prev + 1;
                                    return 0;
                                  });
                                  break;
                                
                                case 'ArrowUp':
                                  e.preventDefault();
                                  setShowTaxAccountDropdown(true);
                                  setSelectedTaxAccountIndex(prev => {
                                    if (prev > 0) return prev - 1;
                                    return filtered.length - 1;
                                  });
                                  break;
                                
                                case 'Enter':
                                  e.preventDefault();
                                  if (showTaxAccountDropdown && selectedTaxAccountIndex >= 0 && selectedTaxAccountIndex < filtered.length) {
                                    const account = filtered[selectedTaxAccountIndex];
                                    const newTaxAccount = account.number;
                                    setSelectedTaxAccount(newTaxAccount);
                                    setTaxAccountSearchTerm('');
                                    setShowTaxAccountDropdown(false);
                                    
                                    // Ermittle vatRate aus Kontonamen
                                    const extractedVatRate = extractVatRateFromAccountName(account.name);
                                    if (extractedVatRate !== null) {
                                      setReceiptVatRate(extractedVatRate);
                                      console.log(`✅ MwSt-Satz ${extractedVatRate}% aus Kontonamen "${account.name}" ermittelt`);
                                      // vatRate ermittelt: Fokus direkt zu Gebindeeinheit
                                      setTimeout(() => {
                                        if (bundleUnitInputRef.current) {
                                          bundleUnitInputRef.current.focus();
                                        }
                                      }, 100);
                                    } else {
                                      // Keine vatRate ermittelt: Fokus auf MwSt-Satz-Feld setzen
                                      setTimeout(() => {
                                        if (vatRateInputRef.current) {
                                          vatRateInputRef.current.focus();
                                        }
                                      }, 100);
                                    }
                                    
                                    // Speichere Steuerkonto und vatRate im aktuellen Artikel
                                    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
                                      const updatedArticles = [...editedArticles];
                                      updatedArticles[selectedArticleIndex] = {
                                        ...updatedArticles[selectedArticleIndex],
                                        taxAccount: newTaxAccount,
                                        vatRate: extractedVatRate !== null ? extractedVatRate : updatedArticles[selectedArticleIndex].vatRate || 19
                                      };
                                      setEditedArticles(updatedArticles);
                                    }
                                  } else if (!showTaxAccountDropdown) {
                                    setShowTaxAccountDropdown(true);
                                    setSelectedTaxAccountIndex(0);
                                  }
                                  break;
                                
                                case 'Escape':
                                  e.preventDefault();
                                  setShowTaxAccountDropdown(false);
                                  setTaxAccountSearchTerm('');
                                  setSelectedTaxAccountIndex(-1);
                                  break;
                                
                                case 'Tab':
                                  setShowTaxAccountDropdown(false);
                                  setSelectedTaxAccountIndex(-1);
                                  break;
                              }
                            }}
                            placeholder="Steuerkonto suchen..."
                            style={{ cursor: 'text' }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            title="Steuerkonto auf alle Artikel anwenden"
                            onClick={applyTaxAccountToAllArticles}
                          >
                            <FaCopy />
                          </button>
                        </div>
                        {showTaxAccountDropdown && (
                          <div 
                            ref={taxAccountDropdownListRef}
                            className="absolute" 
                            style={{
                              top: '100%',
                              left: 0,
                              right: 0,
                              width: '100%',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              zIndex: 10000,
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '0 0 0.375rem 0.375rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            {(() => {
                              // Verwende AccountingAccounts wenn verfügbar, sonst Fallback zu SKR3_TAX_ACCOUNTS
                              const accountsToShow = accountingAccounts.length > 0 ? accountingAccounts : SKR3_TAX_ACCOUNTS;
                              const filtered = accountsToShow.filter(account => {
                                if (!taxAccountSearchTerm) return true;
                                const searchLower = taxAccountSearchTerm.toLowerCase();
                                return account.number.toLowerCase().includes(searchLower) || 
                                       account.name.toLowerCase().includes(searchLower);
                              });
                              
                              return filtered.length > 0 ? (
                                filtered.map((account, index, filteredArray) => (
                                <div
                                  key={account.number}
                                  className="px-3 py-2 cursor-pointer"
                                  onClick={() => {
                                    const newTaxAccount = account.number;
                                    setSelectedTaxAccount(newTaxAccount);
                                    setTaxAccountSearchTerm('');
                                    setShowTaxAccountDropdown(false);
                                    
                                    // Ermittle vatRate aus Kontonamen
                                    const extractedVatRate = extractVatRateFromAccountName(account.name);
                                    if (extractedVatRate !== null) {
                                      setReceiptVatRate(extractedVatRate);
                                      console.log(`✅ MwSt-Satz ${extractedVatRate}% aus Kontonamen "${account.name}" ermittelt`);
                                      // vatRate ermittelt: Fokus direkt zu Gebindeeinheit
                                      setTimeout(() => {
                                        if (bundleUnitInputRef.current) {
                                          bundleUnitInputRef.current.focus();
                                        }
                                      }, 100);
                                    } else {
                                      // Keine vatRate ermittelt: Fokus auf MwSt-Satz-Feld setzen
                                      setTimeout(() => {
                                        if (vatRateInputRef.current) {
                                          vatRateInputRef.current.focus();
                                        }
                                      }, 100);
                                    }
                                    
                                    // Speichere Steuerkonto und vatRate im aktuellen Artikel
                                    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
                                      const updatedArticles = [...editedArticles];
                                      updatedArticles[selectedArticleIndex] = {
                                        ...updatedArticles[selectedArticleIndex],
                                        taxAccount: newTaxAccount,
                                        vatRate: extractedVatRate !== null ? extractedVatRate : updatedArticles[selectedArticleIndex].vatRate || 19
                                      };
                                      setEditedArticles(updatedArticles);
                                    }
                                  }}
                                    style={{
                                      color: colors.text,
                                      borderBottom: index < filteredArray.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                                      cursor: 'pointer',
                                      backgroundColor: selectedTaxAccountIndex === index ? (colors.accent || colors.primary) + '20' : (selectedTaxAccount === account.number ? (colors.accent || colors.primary) + '10' : 'transparent'),
                                      minHeight: '38px'
                                    }}
                                    onMouseEnter={() => {
                                      setSelectedTaxAccountIndex(index);
                                    }}
                                  >
                                    <div style={{ fontSize: '0.9rem', fontWeight: selectedTaxAccount === account.number ? 'bold' : 'normal' }}>
                                      <span style={{ display: 'inline-block', width: '50px', fontWeight: 'bold' }}>{account.number}</span>
                                      <span>{account.name}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2" style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                                  Keine Konten gefunden
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-1/3 px-2 mb-3">
                      <label className="form-label block">
                        MwSt-Satz
                      </label>
                      <div className="relative" ref={vatRateDropdownRef}>
                        <input
                          ref={vatRateInputRef}
                          type="text"
                          className="form-control form-control-themed"
                          tabIndex={6}
                          value={showVatRateDropdown || vatRateSearchTerm ? vatRateSearchTerm : (vatRates.find(r => r.value === receiptVatRate)?.label || `${receiptVatRate}%`)}
                          onClick={() => {
                            setShowVatRateDropdown(true);
                            setSelectedVatRateIndex(0);
                          }}
                          onFocus={() => {
                            setShowVatRateDropdown(true);
                            setSelectedVatRateIndex(0);
                          }}
                          onChange={(e) => {
                            setVatRateSearchTerm(e.target.value);
                            setShowVatRateDropdown(true);
                            setSelectedVatRateIndex(0);
                          }}
                          onKeyDown={(e) => {
                            const filtered = vatRates.filter(rate => {
                              if (!vatRateSearchTerm) return true;
                              const searchLower = vatRateSearchTerm.toLowerCase();
                              return rate.label.toLowerCase().includes(searchLower) || 
                                     rate.value.toString().includes(vatRateSearchTerm);
                            });

                            switch (e.key) {
                              case 'ArrowDown':
                                e.preventDefault();
                                setShowVatRateDropdown(true);
                                setSelectedVatRateIndex(prev => {
                                  if (prev < filtered.length - 1) return prev + 1;
                                  return 0;
                                });
                                break;
                              
                              case 'ArrowUp':
                                e.preventDefault();
                                setShowVatRateDropdown(true);
                                setSelectedVatRateIndex(prev => {
                                  if (prev > 0) return prev - 1;
                                  return filtered.length - 1;
                                });
                                break;
                              
                              case 'Enter':
                                e.preventDefault();
                                if (showVatRateDropdown && selectedVatRateIndex >= 0 && selectedVatRateIndex < filtered.length) {
                                  const rate = filtered[selectedVatRateIndex];
                                  const newVatRate = rate.value;
                                  setReceiptVatRate(newVatRate);
                                  setVatRateSearchTerm('');
                                  setShowVatRateDropdown(false);
                                  
                                  // Speichere vatRate im aktuellen Artikel
                                  if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
                                    const updatedArticles = [...editedArticles];
                                    updatedArticles[selectedArticleIndex] = {
                                      ...updatedArticles[selectedArticleIndex],
                                      vatRate: newVatRate
                                    };
                                    setEditedArticles(updatedArticles);
                                  }
                                } else if (!showVatRateDropdown) {
                                  setShowVatRateDropdown(true);
                                  setSelectedVatRateIndex(0);
                                }
                                break;
                              
                              case 'Escape':
                                e.preventDefault();
                                setShowVatRateDropdown(false);
                                setVatRateSearchTerm('');
                                setSelectedVatRateIndex(-1);
                                break;
                              
                              case 'Tab':
                                setShowVatRateDropdown(false);
                                setSelectedVatRateIndex(-1);
                                break;
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowVatRateDropdown(false);
                              setSelectedVatRateIndex(-1);
                            }, 200);
                          }}
                          placeholder="MwSt-Satz auswählen..."
                        />
                        {showVatRateDropdown && (
                          <div 
                            ref={vatRateDropdownListRef}
                            className="absolute w-full" 
                            style={{
                              top: '100%',
                              left: 0,
                              zIndex: 1000,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '0 0 0.375rem 0.375rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            {vatRates.filter(rate => {
                              if (!vatRateSearchTerm) return true;
                              const searchLower = vatRateSearchTerm.toLowerCase();
                              return rate.label.toLowerCase().includes(searchLower) || 
                                     rate.value.toString().includes(vatRateSearchTerm);
                            }).map((rate, index) => (
                              <div
                                key={rate.value}
                                className="px-3 py-2 cursor-pointer"
                                onClick={() => {
                                  const newVatRate = rate.value;
                                  setReceiptVatRate(newVatRate);
                                  setVatRateSearchTerm('');
                                  setShowVatRateDropdown(false);
                                  
                                  // Speichere vatRate im aktuellen Artikel
                                  if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
                                    const updatedArticles = [...editedArticles];
                                    updatedArticles[selectedArticleIndex] = {
                                      ...updatedArticles[selectedArticleIndex],
                                      vatRate: newVatRate
                                    };
                                    setEditedArticles(updatedArticles);
                                  }
                                }}
                                style={{
                                  color: colors.text,
                                  borderBottom: index < vatRates.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                                  cursor: 'pointer',
                                  backgroundColor: selectedVatRateIndex === index ? (colors.accent || colors.primary) + '20' : 'transparent',
                                  minHeight: '38px'
                                }}
                                onMouseEnter={() => {
                                  setSelectedVatRateIndex(index);
                                }}
                              >
                                {rate.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preise und Einheiten */}
                <div className="mb-4">
                  <div className="w-full">
                    <h6 className="section-header">
                      Preise und Einheiten
                    </h6>
                  </div>
                  <div className="flex flex-wrap -mx-2">
                    <div className="w-full md:w-1/2 px-2 mb-3">
                      <label className="form-label">
                        Gebindeeinheit & Preis
                      </label>
                      <div className="input-group">
                        {/* Statisches Feld mit "1" */}
                        <span className="input-group-text">
                          1
                        </span>
                        
                        {/* Gebindeeinheit Dropdown */}
                        <div className="relative" ref={bundleUnitContainerRef} style={{ width: '30%', flexShrink: 0 }}>
                          <input
                            ref={bundleUnitInputRef}
                            type="text"
                            className={`form-control form-control-themed ${isFieldInvalid('bundleUnit', articleForm.bundleUnit) ? 'is-invalid' : ''}`}
                            value={articleForm.bundleUnit}
                            onChange={(e) => handleBundleUnitInputChange(e.target.value)}
                            onFocus={(e) => {
                              setShowBundleUnitDropdown(true);
                              setSelectedBundleUnitIndex(0); // Initialisiere auf erste Option
                              // Markiere gesamten Text beim Fokus
                              setTimeout(() => {
                                e.target.select();
                              }, 0);
                            }}
                            onBlur={handleBundleUnitInputBlur}
                            onKeyDown={handleBundleUnitKeyDown}
                            tabIndex={7}
                            placeholder="Einheit..."
                          />
                          {showBundleUnitDropdown && bundleUnitContainerRef.current && (() => {
                            const rect = bundleUnitContainerRef.current.getBoundingClientRect();
                            return (
                              <div 
                                ref={bundleUnitDropdownRef}
                                className="bundle-unit-dropdown" 
                                style={{
                                  position: 'fixed',
                                  width: '200%',
                                  maxWidth: '300px',
                                  zIndex: 1001,
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  backgroundColor: colors.card,
                                  border: `1px solid ${colors.cardBorder}`,
                                  borderRadius: '0 0 0.375rem 0.375rem',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  top: `${rect.bottom}px`,
                                  left: `${rect.left}px`
                                }}
                              >
                              {getFilteredBundleUnits().length > 0 ? (
                                getFilteredBundleUnits().map((unit, index) => (
                                  <div
                                    key={`bundle-unit-${index}-${unit}`}
                                    className="px-3 py-2 cursor-pointer"
                                    onClick={() => handleBundleUnitSelect(unit)}
                                    style={{
                                      color: colors.text,
                                      borderBottom: `1px solid ${colors.cardBorder}`,
                                      cursor: 'pointer',
                                      backgroundColor: selectedBundleUnitIndex === index ? (colors.accent || colors.primary) + '20' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (selectedBundleUnitIndex !== index) {
                                        e.currentTarget.style.backgroundColor = colors.secondary;
                                      }
                                      setSelectedBundleUnitIndex(index);
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedBundleUnitIndex !== index) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }
                                    }}
                                  >
                                    {unit}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                  Keine Einheit gefunden
                                </div>
                              )}
                              {bundleUnitSearchTerm && !UNITS.includes(bundleUnitSearchTerm) && (
                                <div
                                  className="px-3 py-2 cursor-pointer"
                                  onClick={() => handleBundleUnitSelect(bundleUnitSearchTerm)}
                                  style={{
                                    color: colors.accent || colors.primary,
                                    borderTop: `2px solid ${colors.accent || colors.primary}`,
                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    backgroundColor: selectedBundleUnitIndex === getFilteredBundleUnits().length ? (colors.accent || colors.primary) + '20' : 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedBundleUnitIndex !== getFilteredBundleUnits().length) {
                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                    }
                                    setSelectedBundleUnitIndex(getFilteredBundleUnits().length);
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedBundleUnitIndex !== getFilteredBundleUnits().length) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                  }}
                                >
                                  "{bundleUnitSearchTerm}" hinzufügen
                                </div>
                              )}
                              </div>
                            );
                          })()}
                        </div>
                        {/* Ist-Gleich Zeichen */}
                        <span className="input-group-text">
                          =
                        </span>
                        
                        {/* Gebindepreis Input */}
                        <input
                          type="text"
                          className={`form-control form-control-themed text-end ${isFieldInvalid('bundlePrice', articleForm.bundlePrice) ? 'is-invalid' : ''}`}
                          value={bundlePriceInput}
                          onChange={(e) => {
                            setBundlePriceInput(e.target.value);
                            const value = parseFloat(e.target.value.replace(',', '.'));
                            if (!isNaN(value)) {
                              setArticleForm(prev => {
                                const newPricePerUnit = calculatePricePerUnit(value, prev.content);
                                setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                                return { 
                                  ...prev, 
                                  bundlePrice: value,
                                  pricePerUnit: newPricePerUnit
                                };
                              });
                              
                              // Berechne price neu: bundlePrice * quantity
                              const currentQuantity = editedArticles[selectedArticleIndex]?.quantity || 1;
                              const newPrice = value * currentQuantity;
                              const updatedArticles = [...editedArticles];
                              updatedArticles[selectedArticleIndex] = {
                                ...updatedArticles[selectedArticleIndex],
                                bundlePrice: value,
                                price: newPrice
                              };
                              setEditedArticles(updatedArticles);
                            }
                          }}
                          onBlur={() => {
                            // Formatiere als deutsche Zahl mit Komma
                            setArticleForm(prev => {
                              const formattedValue = (prev.bundlePrice || 0).toFixed(2).replace('.', ',');
                              setBundlePriceInput(formattedValue);
                              // Aktualisiere auch pricePerUnitInput
                              const newPricePerUnit = calculatePricePerUnit(prev.bundlePrice, prev.content);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                              return prev;
                            });
                          }}
                          onFocus={(e) => {
                            // Zeige unformatierte Zahl und markiere alles
                            setBundlePriceInput((articleForm.bundlePrice || 0).toString());
                            setTimeout(() => e.target.select(), 0);
                          }}
                          onKeyDown={(e) => {
                            // Pfeiltasten für Preis-Anpassung
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const newPrice = (articleForm.bundlePrice || 0) + 0.1;
                              setArticleForm(prev => ({ 
                                ...prev, 
                                bundlePrice: newPrice,
                                pricePerUnit: calculatePricePerUnit(newPrice, prev.content)
                              }));
                              setBundlePriceInput(newPrice.toString());
                              // Aktualisiere auch pricePerUnitInput
                              const newPricePerUnit = calculatePricePerUnit(newPrice, articleForm.content);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const newPrice = Math.max(0, (articleForm.bundlePrice || 0) - 0.1);
                              setArticleForm(prev => ({ 
                                ...prev, 
                                bundlePrice: newPrice,
                                pricePerUnit: calculatePricePerUnit(newPrice, prev.content)
                              }));
                              setBundlePriceInput(newPrice.toString());
                              // Aktualisiere auch pricePerUnitInput
                              const newPricePerUnit = calculatePricePerUnit(newPrice, articleForm.content);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                            }
                          }}
                          required
                        />
                        <span className="input-group-text">
                          <FaEuroSign />
                        </span>
                        
                        {/* Price Converter Button */}
                        <button
                          type="button"
                          className="btn btn-outline-input"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const input = bundleUnitContainerRef.current?.querySelector('input');
                            if (input && document.activeElement === input) {
                              input.blur();
                            }
                            setShowPriceConverter(true);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPriceConverter(true);
                          }}
                          tabIndex={-1}
                          title="Preis umrechnen"
                          style={{ zIndex: 1002, position: 'relative' }}
                        >
                          <FaCoins />
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 px-2 mb-3">
                      <label className="form-label">
                        Inhalt & Preis je Einheit
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className={`form-control form-control-themed text-end ${isFieldInvalid('content', articleForm.content) ? 'is-invalid' : ''}`}
                          value={contentInput}
                          tabIndex={8}
                          onChange={(e) => {
                            setContentInput(e.target.value);
                            const value = parseFloat(e.target.value.replace(',', '.'));
                            if (!isNaN(value)) {
                              setArticleForm(prev => {
                                const newPricePerUnit = calculatePricePerUnit(prev.bundlePrice, value);
                                setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                                return {
                                  ...prev,
                                  content: value,
                                  pricePerUnit: newPricePerUnit
                                };
                              });
                            }
                          }}
                          onBlur={() => {
                            setArticleForm(prev => {
                              const formattedValue = (prev.content || 0).toFixed(2).replace('.', ',');
                              setContentInput(formattedValue);
                              const newPricePerUnit = calculatePricePerUnit(prev.bundlePrice, prev.content);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                              return prev;
                            });
                          }}
                          onFocus={(e) => {
                            setContentInput((articleForm.content || 0).toString());
                            setTimeout(() => e.target.select(), 0);
                          }}
                          onKeyDown={(e) => {
                            // Pfeiltasten für Inhalt-Anpassung
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const newContent = (articleForm.content || 0) + 0.1;
                              setArticleForm(prev => ({
                                ...prev,
                                content: newContent,
                                pricePerUnit: calculatePricePerUnit(prev.bundlePrice, newContent)
                              }));
                              setContentInput(newContent.toString());
                              const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, newContent);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const newContent = Math.max(0, (articleForm.content || 0) - 0.1);
                              setArticleForm(prev => ({
                                ...prev,
                                content: newContent,
                                pricePerUnit: calculatePricePerUnit(prev.bundlePrice, newContent)
                              }));
                              setContentInput(newContent.toString());
                              const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, newContent);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                            }
                          }}
                          required
                        />
                        
                        {/* Inhaltseinheit Dropdown */}
                        <div className="relative" ref={contentUnitContainerRef} style={{ width: '25%', flexShrink: 0 }}>
                          <input
                            type="text"
                            className={`form-control form-control-themed ${isFieldInvalid('contentUnit', articleForm.contentUnit) ? 'is-invalid' : ''}`}
                            value={articleForm.contentUnit}
                            onChange={(e) => handleContentUnitInputChange(e.target.value)}
                            onFocus={() => {
                              setShowContentUnitDropdown(true);
                              setSelectedContentUnitIndex(0); // Initialisiere auf erste Option
                            }}
                            onBlur={(e) => {
                              handleContentUnitInputBlur();
                              // Zirkuläre Navigation: Nächsten Artikel auswählen und Fokus auf Menge setzen
                              setTimeout(() => {
                                if (editedArticles.length > 0) {
                                  // Berechne nächsten Artikel-Index (zirkulär)
                                  const nextIndex = (selectedArticleIndex + 1) % editedArticles.length;
                                  
                                  // Wähle nächsten Artikel aus
                                  setSelectedArticleIndex(nextIndex);
                                  
                                  // Setze Fokus auf Menge-Feld des neuen Artikels
                                  setTimeout(() => {
                                    if (quantityInputRef.current) {
                                      quantityInputRef.current.focus();
                                    }
                                  }, 100); // Kurze Verzögerung für State-Update
                                } else {
                                  // Fallback: Fokus zurück auf Menge
                                  if (quantityInputRef.current) {
                                    quantityInputRef.current.focus();
                                  }
                                }
                              }, 250); // Warte auf Blur-Handler
                            }}
                            onKeyDown={handleContentUnitKeyDown}
                            tabIndex={9}
                            placeholder="Einheit..."
                          />
                          {showContentUnitDropdown && contentUnitContainerRef.current && (() => {
                            const rect = contentUnitContainerRef.current.getBoundingClientRect();
                            return (
                              <div 
                                ref={contentUnitDropdownRef}
                                className="content-unit-dropdown" 
                                style={{
                                  position: 'fixed',
                                  width: '200%',
                                  maxWidth: '300px',
                                  zIndex: 1001,
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  backgroundColor: colors.card,
                                  border: `1px solid ${colors.cardBorder}`,
                                  borderRadius: '0 0 0.375rem 0.375rem',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  top: `${rect.bottom}px`,
                                  left: `${rect.left}px`
                                }}
                              >
                              {getFilteredContentUnits().length > 0 ? (
                                getFilteredContentUnits().map((unit, index) => (
                                  <div
                                    key={`content-unit-${index}-${unit}`}
                                    className="px-3 py-2 cursor-pointer"
                                    onClick={() => handleContentUnitSelect(unit)}
                                    style={{
                                      color: colors.text,
                                      borderBottom: `1px solid ${colors.cardBorder}`,
                                      cursor: 'pointer',
                                      backgroundColor: selectedContentUnitIndex === index ? (colors.accent || colors.primary) + '20' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (selectedContentUnitIndex !== index) {
                                        e.currentTarget.style.backgroundColor = colors.secondary;
                                      }
                                      setSelectedContentUnitIndex(index);
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedContentUnitIndex !== index) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }
                                    }}
                                  >
                                    {unit}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                  Keine Einheit gefunden
                                </div>
                              )}
                              {contentUnitSearchTerm && !UNITS.includes(contentUnitSearchTerm) && (
                                <div
                                  className="px-3 py-2 cursor-pointer"
                                  onClick={() => handleContentUnitSelect(contentUnitSearchTerm)}
                                  style={{
                                    color: colors.accent || colors.primary,
                                    borderTop: `2px solid ${colors.accent || colors.primary}`,
                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    backgroundColor: selectedContentUnitIndex === getFilteredContentUnits().length ? (colors.accent || colors.primary) + '20' : 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedContentUnitIndex !== getFilteredContentUnits().length) {
                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                    }
                                    setSelectedContentUnitIndex(getFilteredContentUnits().length);
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedContentUnitIndex !== getFilteredContentUnits().length) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                  }}
                                >
                                  "{contentUnitSearchTerm}" hinzufügen
                                </div>
                              )}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Ist-Gleich Zeichen */}
                        <span className="input-group-text">
                          =
                        </span>
                        
                        {/* Preis je Einheit Input */}
                        <input
                          type="text"
                          className="form-control text-end"
                          value={pricePerUnitInput}
                          onChange={(e) => {
                            setPricePerUnitInput(e.target.value);
                            const value = parseFloat(e.target.value.replace(',', '.'));
                            if (!isNaN(value) && value > 0 && articleForm.content > 0) {
                              // Berechne neuen Gebindepreis basierend auf Preis pro Einheit und Inhalt
                              const newBundlePrice = value * articleForm.content;
                              setArticleForm(prev => ({
                                ...prev,
                                pricePerUnit: value,
                                bundlePrice: newBundlePrice
                              }));
                              setBundlePriceInput(newBundlePrice.toFixed(2).replace('.', ','));
                            }
                          }}
                          onBlur={() => {
                            // Formatiere als deutsche Zahl mit Komma
                            const formattedValue = (articleForm.pricePerUnit || 0).toFixed(2).replace('.', ',');
                            setPricePerUnitInput(formattedValue);
                          }}
                          onFocus={(e) => {
                            // Zeige unformatierte Zahl und markiere alles
                            setPricePerUnitInput((articleForm.pricePerUnit || 0).toString());
                            setTimeout(() => e.target.select(), 0);
                          }}
                          onKeyDown={(e) => {
                            // Pfeiltasten für Preis pro Einheit-Anpassung
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const newPricePerUnit = (articleForm.pricePerUnit || 0) + 0.01;
                              const newBundlePrice = newPricePerUnit * articleForm.content;
                              setArticleForm(prev => ({
                                ...prev,
                                pricePerUnit: newPricePerUnit,
                                bundlePrice: newBundlePrice
                              }));
                              setPricePerUnitInput(newPricePerUnit.toString());
                              setBundlePriceInput(newBundlePrice.toFixed(2).replace('.', ','));
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const newPricePerUnit = Math.max(0, (articleForm.pricePerUnit || 0) - 0.01);
                              const newBundlePrice = newPricePerUnit * articleForm.content;
                              setArticleForm(prev => ({
                                ...prev,
                                pricePerUnit: newPricePerUnit,
                                bundlePrice: newBundlePrice
                              }));
                              setPricePerUnitInput(newPricePerUnit.toString());
                              setBundlePriceInput(newBundlePrice.toFixed(2).replace('.', ','));
                            }
                          }}
                          placeholder="0,00"
                          required
                          style={{ width: '20%', flexShrink: 0 }}
                        />
                        
                        {/* Euro Symbol */}
                        <span className="input-group-text">
                          €
                        </span>
                        
                        {/* Calculator Button */}
                        <button
                          type="button"
                          className="btn btn-outline-input"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const input = contentUnitContainerRef.current?.querySelector('input');
                            if (input && document.activeElement === input) {
                              input.blur();
                            }
                            setShowCalculator(true);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCalculator(true);
                          }}
                          tabIndex={-1}
                          title="Taschenrechner"
                          style={{ position: 'relative' }}
                        >
                          <FaCalculator />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EAN-Codes und Notizen */}
                <div className="mb-4">
                  <div className="flex flex-wrap -mx-2">
                    <div className="w-full md:w-1/2 px-2 mb-3">
                      <label className="form-label">Gebinde-EAN</label>
                      <input
                        type="text"
                        className="form-control"
                        value={articleForm.bundleEanCode || ''}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, bundleEanCode: e.target.value }))}
                      />
                    </div>
                    <div className="w-full md:w-1/2 px-2 mb-3">
                      <label className="form-label">Inhalt-EAN</label>
                      <input
                        type="text"
                        className="form-control"
                        value={articleForm.contentEanCode || ''}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, contentEanCode: e.target.value }))}
                      />
                    </div>
                    <div className="w-full px-2 mb-3">
                      <label className="form-label">Notizen</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={articleForm.notes || ''}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
              <button
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                <FaTimes className="me-1" />
                Abbrechen
              </button>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-link p-0"
                  onClick={() => setIsCompleted(!isCompleted)}
                  style={{ 
                    color: isCompleted ? '#28a745' : colors.textSecondary,
                    fontSize: '1.5rem',
                    transition: 'all 0.2s'
                  }}
                  title={isCompleted ? 'Beleg als fertig markiert' : 'Beleg als fertig markieren'}
                >
                  {isCompleted ? <FaCheckCircle /> : <FaClock />}
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleSave}
                  disabled={completeArticlesCount === 0}
                >
                  <FaSave className="me-1" />
                  {isCompleted 
                    ? (completeArticlesCount > 0 
                        ? `${completeArticlesCount} Artikel übernehmen`
                        : 'Keine vollständigen Artikel')
                    : 'Beleg Speichern'
                  }
                </button>
              </div>
            </div>
          </div>
          
          {/* Resize-Handle zwischen Artikel bearbeiten und Original-Beleg */}
          {imageUrl && (
            <>
              <div
                onMouseDown={handleRightResizeStart}
                style={{
                  width: '8px',
                  cursor: 'col-resize',
                  backgroundColor: isResizingRight ? colors.primary : 'transparent',
                  flexShrink: 0,
                  position: 'relative',
                  margin: '0',
                  transition: 'background-color 0.2s'
                }}
                title="Ziehen zum Anpassen der Breite"
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '2px',
                    height: '40px',
                    backgroundColor: colors.cardBorder || '#dee2e6',
                    borderRadius: '1px'
                  }}
                />
              </div>
              
              {/* Rechte Seite: Bildansicht (Original-Beleg) */}
              <div 
                className="card"
                style={{
                  width: `${rightPanelWidth}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  maxHeight: '90vh',
                  height: '90vh'
                }}
              >
              {/* Header */}
              <div 
                className="card-header"
                style={{ 
                  flexShrink: 0,
                  padding: '0.75rem'
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 form-label-themed">Original-Beleg</h5>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-link p-0"
                      onClick={() => setShowJsonDialog(true)}
                      style={{ color: colors.text }}
                      title="Scan-Ergebnis als JSON anzeigen"
                    >
                      <FaCode />
                    </button>
                    <button
                      className="btn btn-link p-0"
                      onClick={() => setShowPrintPreview(true)}
                      style={{ color: colors.text }}
                      title="Druck-Preview öffnen"
                    >
                      <FaPrint />
                    </button>
                    <button
                      className="btn btn-link p-0"
                      onClick={() => {
                        setImageZoom(1);
                        setImagePosition({ x: 0, y: 0 });
                      }}
                      style={{ color: colors.text }}
                      title="Zoom und Position zurücksetzen"
                    >
                      <FaImage />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bildansicht */}
              <div 
                ref={imageContainerRef}
                className="card-body"
                style={{
                  overflow: 'hidden',
                  flex: 1,
                  padding: '0.75rem',
                  position: 'relative',
                  backgroundColor: '#f5f5f5',
                  cursor: (isPDF && displayPdfCanvasUrls.length === 0) ? 'default' : (isDragging ? 'grabbing' : 'grab')
                }}
                onMouseDown={(isPDF && displayPdfCanvasUrls.length === 0) ? undefined : handleImageMouseDown}
              >
                {isPDF && displayPdfCanvasUrls.length > 0 ? (
                  // PDF als Canvas-Bild anzeigen (mit Zoom/Pan)
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) translate(-50%, -50%) scale(${imageZoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                  >
                    <img
                      src={displayPdfCanvasUrls[currentPdfPage]}
                      alt={`PDF-Beleg Seite ${currentPdfPage + 1}`}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        display: 'block',
                        userSelect: 'none',
                        pointerEvents: 'none'
                      }}
                      draggable={false}
                      onError={(e) => {
                        console.error('❌ [PDF-CANVAS] Fehler beim Laden des PDF-Canvas:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log(`✅ [PDF-CANVAS] PDF-Seite ${currentPdfPage + 1} erfolgreich geladen`);
                      }}
                    />
                  </div>
                ) : isPDF && !imageUrl ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    color: colors.text 
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p>PDF wird geladen...</p>
                    </div>
                  </div>
                ) : isPDF && imageUrl && displayPdfCanvasUrls.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    color: colors.text 
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p>PDF wird gerendert...</p>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) translate(-50%, -50%) scale(${imageZoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Original-Beleg"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        display: 'block',
                        userSelect: 'none',
                        pointerEvents: 'none'
                      }}
                      draggable={false}
                      onError={(e) => {
                        // Nur Fehler loggen wenn es kein PDF ist (PDFs werden im iframe geladen)
                        if (!isPDF) {
                          console.error('🖼️ [IMAGE] Fehler beim Laden des Bildes:', imageUrl);
                          e.currentTarget.style.display = 'none';
                        }
                      }}
                      onLoad={() => {
                        // Nur Loggen wenn es kein PDF ist
                        if (!isPDF) {
                          console.log('🖼️ [IMAGE] Bild erfolgreich geladen:', imageUrl);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Steuerkonto-Summen oberhalb des Footers */}
              {taxAccountTotals.length > 0 && (
                <div 
                  style={{
                    flexShrink: 0,
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    borderTop: `1px solid ${colors.cardBorder}`,
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: colors.text }}>
                    Artikelsummen nach Steuerkonten:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {taxAccountTotals.map((item) => (
                      <div 
                        key={item.accountNumber}
                        style={{
                          color: colors.text,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: colors.secondary + '80'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>
                          {item.total.toFixed(2).replace('.', ',')} €
                        </span>
                        {' - '}
                        <span style={{ fontWeight: 'bold' }}>{item.accountNumber}</span>
                        {' - '}
                        <span>{item.accountName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer mit Zoom-Anzeige und Seitennavigation für PDFs */}
              {(!isPDF || (isPDF && displayPdfCanvasUrls.length > 0)) && (
                <div 
                  className="card-footer"
                  style={{
                    flexShrink: 0,
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    color: colors.textSecondary
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <span>Zoom: {Math.round(imageZoom * 100)}%</span>
                      {isPDF && displayPdfCanvasUrls.length > 1 && (
                        <div className="d-flex align-items-center gap-2">
                          <button
                            onClick={() => {
                              if (currentPdfPage > 0) {
                                setCurrentPdfPage(currentPdfPage - 1);
                                // Reset Zoom und Position beim Seitenwechsel
                                setImageZoom(1);
                                setImagePosition({ x: 0, y: 0 });
                              }
                            }}
                            disabled={currentPdfPage === 0}
                            style={{
                              background: 'transparent',
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              color: colors.text,
                              cursor: currentPdfPage === 0 ? 'not-allowed' : 'pointer',
                              opacity: currentPdfPage === 0 ? 0.5 : 1
                            }}
                            title="Vorherige Seite"
                          >
                            <FaChevronLeft />
                          </button>
                          <span>
                            Seite {currentPdfPage + 1} von {displayPdfCanvasUrls.length}
                          </span>
                          <button
                            onClick={() => {
                              if (currentPdfPage < displayPdfCanvasUrls.length - 1) {
                                setCurrentPdfPage(currentPdfPage + 1);
                                // Reset Zoom und Position beim Seitenwechsel
                                setImageZoom(1);
                                setImagePosition({ x: 0, y: 0 });
                              }
                            }}
                            disabled={currentPdfPage === displayPdfCanvasUrls.length - 1}
                            style={{
                              background: 'transparent',
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              color: colors.text,
                              cursor: currentPdfPage === displayPdfCanvasUrls.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: currentPdfPage === displayPdfCanvasUrls.length - 1 ? 0.5 : 1
                            }}
                            title="Nächste Seite"
                          >
                            <FaChevronRight />
                          </button>
                        </div>
                      )}
                    </div>
                    <span>Zum Vergrößern/Verkleinern: Mausrad</span>
                  </div>
                  <div className="mt-1" style={{ fontSize: '0.75rem' }}>
                    <span>Zum Verschieben: Linke Maustaste gedrückt halten</span>
                  </div>
                </div>
              )}
              </div>
            </>
          )}
          {!imageUrl && receiptImage && (
            <div style={{ marginLeft: '1rem', padding: '1rem', color: colors.textSecondary }}>
              <small>Bild wird geladen...</small>
            </div>
          )}
        </div>
      </div>

      {/* Artikel-Such-Modal */}
      {showArticleSearchModal && (
        <ArticleSearchModal
          show={showArticleSearchModal}
          onClose={() => setShowArticleSearchModal(false)}
          supplierId={receiptSupplierId}
          searchTerm={articleSearchTerm}
          onSearchTermChange={setArticleSearchTerm}
          colors={colors}
          articles={state.articles}
          onSelectArticle={(article) => {
            // Übernehme alle Werte des ausgewählten Artikels
            const currentArticle = editedArticles[selectedArticleIndex];
            const updatedArticles = [...editedArticles];
            
            // Verwende Einzelpreis aus dem Scan-Bereich (OCR-Daten)
            const scannedPrice = currentArticle.price || currentArticle.bundlePrice || 0;
            const scannedQuantity = currentArticle.quantity || article.content || 1;
            // Berechne Einzelpreis: Gesamtpreis / Menge
            const scannedPricePerUnit = scannedQuantity > 0 ? scannedPrice / scannedQuantity : scannedPrice;
            
            // Artikelnummer: OCR-Wert verwenden, wenn im Artikelstamm keine vorhanden
            const supplierArticleNumber = currentArticle.supplierArticleNumber || article.supplierArticleNumber || '';
            
            // Füge OCR-Namen zu namesOCR hinzu, wenn Artikel verknüpft wird
            const currentOCRName = currentArticle.nameOCR || currentArticle.name;
            let updatedNamesOCR = article.namesOCR || [];
            if (currentOCRName && !updatedNamesOCR.includes(currentOCRName)) {
              updatedNamesOCR = [...updatedNamesOCR, currentOCRName];
              
              // Aktualisiere den Artikel im State, um OCR-Namen hinzuzufügen
              const updatedArticleInState = state.articles.find(a => a.id === article.id);
              if (updatedArticleInState) {
                dispatch({
                  type: 'UPDATE_ARTICLE',
                  payload: {
                    id: article.id,
                    article: {
                      ...updatedArticleInState,
                      namesOCR: updatedNamesOCR
                    }
                  }
                });
                
                // Speichere auch direkt über StorageLayer (wird später beim Speichern übernommen)
                storageLayer.save('articles', [{
                  ...updatedArticleInState,
                  namesOCR: updatedNamesOCR
                }]).catch(err => console.error('Fehler beim Speichern von namesOCR:', err));
              }
            }
            
            updatedArticles[selectedArticleIndex] = {
              // Alle Felder aus dem Artikel übernehmen
              ...article,
              // Artikel-ID für Verknüpfung
              linkedArticleId: article.id,
              // OCR-Daten beibehalten (Preis, Menge, etc. vom Beleg)
              name: article.name, // Verwende Namen aus Artikelstamm
              nameOCR: currentArticle.nameOCR || currentArticle.name, // OCR-Namen beibehalten
              price: scannedPrice, // Gesamtpreis aus Scan-Bereich (für Anzeige)
              bundlePrice: scannedPricePerUnit, // Einzelpreis als Gebindepreis!
              quantity: currentArticle.quantity || article.content,
              unit: currentArticle.unit || article.contentUnit,
              ean: currentArticle.ean || article.bundleEanCode,
              // Artikelnummer: OCR-Wert wenn vorhanden, sonst aus Artikelstamm
              supplierArticleNumber: supplierArticleNumber,
              // Beleg-spezifische Daten beibehalten
              supplierId: receiptSupplierId || article.supplierId,
              // Inhalt immer auf 1 setzen
              content: 1,
              contentUnit: 'Stück'
            };
            setEditedArticles(updatedArticles);
            
            // Berechne Preis pro Einheit (sollte gleich scannedPricePerUnit sein)
            const calculatedPricePerUnit = scannedPricePerUnit;
            
            // Aktualisiere auch articleForm
            setArticleForm({
              name: article.name,
              category: article.category || '',
              supplierId: receiptSupplierId || article.supplierId || '',
              supplierArticleNumber: supplierArticleNumber,
              bundleUnit: article.bundleUnit || 'Stück',
              bundlePrice: scannedPricePerUnit, // Einzelpreis!
              bundleEanCode: currentArticle.ean || article.bundleEanCode || '',
              content: 1, // Immer 1!
              contentUnit: 'Stück', // Immer Stück!
              contentEanCode: article.contentEanCode || '',
              pricePerUnit: calculatedPricePerUnit,
              allergens: article.allergens || [],
              additives: article.additives || [],
              ingredients: article.ingredients || '',
              nutrition: article.nutritionInfo || article.nutrition || {
                calories: 0, kilojoules: 0, protein: 0, fat: 0, carbohydrates: 0,
                fiber: 0, sugar: 0, salt: 0, alcohol: undefined
              },
              openFoodFactsCode: article.openFoodFactsCode || '',
              notes: article.notes || ''
            });
            
            // Aktualisiere Input-Felder
            setBundlePriceInput(scannedPricePerUnit.toFixed(2).replace('.', ','));
            setContentInput('1,00'); // Immer 1 für Inhalt
            setPricePerUnitInput(calculatedPricePerUnit.toFixed(2).replace('.', ','));
            
            setShowArticleSearchModal(false);
            console.log('✅ Artikel übernommen:', article.name, 'ID:', article.id, 'Einzelpreis aus Scan:', scannedPricePerUnit);
          }}
        />
      )}

      {/* Druck-Preview Modal */}
      {showPrintPreview && imageUrl && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPrintPreview(false);
            }
          }}
        >
          {/* Header */}
          <div 
            style={{
              backgroundColor: colors.card,
              padding: '1rem',
              borderBottom: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderRadius: '0.375rem 0.375rem 0 0'
            }}
          >
            <h5 style={{ margin: 0, color: colors.text }}>Druck-Preview</h5>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handlePrint}
                disabled={taxAccountTotals.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FaPrint />
                Drucken
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowPrintPreview(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FaTimes />
                Schließen
              </button>
            </div>
          </div>

          {/* Preview-Bereich */}
          <div 
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: '0 0 0.375rem 0.375rem',
              padding: '20px',
              overflow: 'auto',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}
          >
            {/* Beleg als Hintergrund */}
            <div 
              data-print-preview-container
              style={{ position: 'relative', maxWidth: '100%', display: 'inline-block' }}
            >
              {isPDF && pdfCanvasUrls.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {pdfCanvasUrls.map((url, index) => (
                    <img 
                      key={index}
                      ref={index === 0 ? printPdfCanvasRef : null}
                      src={url} 
                      alt={`PDF-Beleg Seite ${index + 1}`} 
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        display: 'block',
                        border: '1px solid #ddd'
                      }}
                      onLoad={(e) => {
                        if (index === 0) {
                          const img = e.currentTarget;
                          setPrintPreviewImageSize({
                            width: img.naturalWidth,
                            height: img.naturalHeight
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              ) : isPDF && pdfCanvasUrls.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '2rem',
                  color: colors.text 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p>PDF wird für Druck vorbereitet...</p>
                  </div>
                </div>
              ) : (
                <img 
                  ref={printImageRef}
                  src={imageUrl} 
                  alt="Beleg" 
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setPrintPreviewImageSize({
                      width: img.naturalWidth,
                      height: img.naturalHeight
                    });
                  }}
                />
              )}
              
              {/* Verschiebbare Artikelsummen-Liste */}
              {taxAccountTotals.length > 0 && ((isPDF && pdfCanvasUrls.length > 0 ? printPdfCanvasRef.current : printImageRef.current) && printPreviewImageSize) && (
                <div
                  onMouseDown={handlePrintListMouseDown}
                  style={{
                    position: 'absolute',
                    left: `${(printPreviewListPosition.x / printPreviewImageSize.width) * 100}%`,
                    top: `${(printPreviewListPosition.y / printPreviewImageSize.height) * 100}%`,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '13px',
                    border: '2px dashed #007bff',
                    borderRadius: '0.25rem',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '16px',
                    cursor: isDraggingPrintList ? 'grabbing' : 'grab',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    minWidth: '280px',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '10px', 
                    fontSize: '18px',
                    color: '#007bff',
                    borderBottom: '1px solid #007bff',
                    paddingBottom: '5px'
                  }}>
                    Artikelsummen nach Steuerkonten:
                  </div>
                  {taxAccountTotals.map((item) => (
                    <div 
                      key={item.accountNumber}
                      style={{
                        margin: '6px 0',
                        padding: '4px 0',
                        borderBottom: '1px solid #ddd',
                        fontSize: '14px'
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>
                        {item.total.toFixed(2).replace('.', ',')} €
                      </span>
                      {' - '}
                      <span style={{ fontWeight: 'bold' }}>{item.accountNumber}</span>
                      {' - '}
                      <span>{item.accountName}</span>
                    </div>
                  ))}
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '13px', 
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    💡 Zum Verschieben: Linke Maustaste gedrückt halten
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      <CalculatorModal
        show={showCalculator}
        onClose={() => setShowCalculator(false)}
        onResult={handleCalculatorResult}
        colors={colors}
      />

      {/* Price Converter Modal */}
      <PriceConverterModal
        show={showPriceConverter}
        onClose={() => setShowPriceConverter(false)}
        bundlePrice={articleForm.bundlePrice || 0}
        vatRate={selectedVatRate || 19}
        onApplyGrossPrice={(grossPrice: number) => {
          setArticleForm(prev => {
            const newPricePerUnit = calculatePricePerUnit(grossPrice, prev.content);
            setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
            return { 
              ...prev, 
              bundlePrice: grossPrice,
              pricePerUnit: newPricePerUnit
            };
          });
          setBundlePriceInput(grossPrice.toFixed(2).replace('.', ','));
          setShowPriceConverter(false);
        }}
        onApplyNetPrice={(netPrice: number) => {
          setArticleForm(prev => {
            const newPricePerUnit = calculatePricePerUnit(netPrice, prev.content);
            setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
            return { 
              ...prev, 
              bundlePrice: netPrice,
              pricePerUnit: newPricePerUnit
            };
          });
          setBundlePriceInput(netPrice.toFixed(2).replace('.', ','));
          setShowPriceConverter(false);
        }}
        onVatRateChange={(vatRate: number) => {
          setSelectedVatRate(vatRate);
        }}
        colors={colors}
      />
      
      {/* JSON-Dialog für Scan-Ergebnis */}
      {showJsonDialog && (
        <div 
          className="fixed top-0 left-0 w-full"
          style={{
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10001,
            top: 56,
            height: 'calc(100vh - 56px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowJsonDialog(false)}
        >
          <div 
            className="card"
            style={{
              maxWidth: '90%',
              width: '800px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 form-label-themed">
                <FaCode className="me-2" />
                Scan-Ergebnis (JSON)
              </h5>
              <button
                className="btn btn-link p-0"
                onClick={() => setShowJsonDialog(false)}
                style={{ color: colors.text }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="card-body" style={{ overflow: 'auto', flex: 1 }}>
              <pre
                style={{
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 'calc(90vh - 120px)',
                  overflow: 'auto'
                }}
              >
                {originalOcrResult ? JSON.stringify(originalOcrResult, null, 2) : JSON.stringify(receiptData, null, 2)}
              </pre>
            </div>
            <div className="card-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const jsonText = originalOcrResult ? JSON.stringify(originalOcrResult, null, 2) : JSON.stringify(receiptData, null, 2);
                  navigator.clipboard.writeText(jsonText);
                }}
                style={{ marginRight: '0.5rem' }}
              >
                <FaCopy className="me-1" />
                JSON kopieren
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowJsonDialog(false)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Artikel-Such-Modal Komponente
interface ArticleSearchModalProps {
  show: boolean;
  onClose: () => void;
  supplierId: string;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  colors: any;
  articles: any[];
  onSelectArticle: (article: any) => void;
}

const ArticleSearchModal: React.FC<ArticleSearchModalProps> = ({
  show,
  onClose,
  supplierId,
  searchTerm,
  onSearchTermChange,
  colors,
  articles,
  onSelectArticle
}) => {
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

  // Setze initialen Suchbegriff beim Öffnen des Modals oder wenn sich searchTerm ändert
  useEffect(() => {
    if (show) {
      setLocalSearchTerm(searchTerm || '');
    } else {
      // Reset beim Schließen
      setLocalSearchTerm('');
    }
  }, [show, searchTerm]); // Auch bei searchTerm-Änderung aktualisieren

  // Filtere Artikel nach Lieferant und Suchbegriff
  useEffect(() => {
    if (!show) return;

    let filtered = articles.filter(article => 
      article.supplierId === supplierId
    );

    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase().trim();
      // Teile Suchbegriff in Wörter auf für flexiblere Suche
      const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
      
      filtered = filtered.filter(article => {
        // Wenn nur ein Wort, suche nach exakter Phrase oder Teilstring
        if (searchWords.length === 1) {
          const searchWord = searchWords[0];
          return (
            article.name?.toLowerCase().includes(searchWord) ||
            article.namesOCR?.some((ocrName: string) => ocrName.toLowerCase().includes(searchWord)) ||
            article.supplierArticleNumber?.toLowerCase().includes(searchWord) ||
            article.bundleEanCode?.toLowerCase().includes(searchWord) ||
            article.category?.toLowerCase().includes(searchWord)
          );
        } else {
          // Bei mehreren Wörtern: alle Wörter müssen in mindestens einem Feld vorkommen
          const articleText = [
            article.name,
            ...(article.namesOCR || []),
            article.supplierArticleNumber,
            article.bundleEanCode,
            article.category
          ].filter(Boolean).join(' ').toLowerCase();
          
          // Prüfe, ob alle Suchwörter im kombinierten Text enthalten sind
          return searchWords.every(word => articleText.includes(word));
        }
      });
    }

    setFilteredArticles(filtered);
  }, [show, supplierId, localSearchTerm, articles]);

  if (!show) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full"
      style={{
        background: 'rgba(0,0,0,0.5)',
        zIndex: 10001,
        top: 56,
        height: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        style={{
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 form-label-themed">
            <FaSearch className="me-2" />
            Artikel aus Bestand auswählen
          </h5>
          <button
            className="btn btn-link p-0"
            onClick={onClose}
            style={{ color: colors.text }}
          >
            <FaTimes />
          </button>
        </div>
        <div className="card-body" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          {/* Suchfeld */}
          <div className="mb-3">
            <label className="form-label">Volltextsuche:</label>
            <input
              type="text"
              className="form-control"
              value={localSearchTerm}
              onChange={(e) => {
                setLocalSearchTerm(e.target.value);
                onSearchTermChange(e.target.value);
              }}
              placeholder="Artikelname, Artikelnummer, EAN, Kategorie..."
              autoFocus
            />
          </div>

          {/* Artikel-Liste */}
          <div>
            <div className="mb-2" style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              {filteredArticles.length} Artikel gefunden
            </div>
            {filteredArticles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => onSelectArticle(article)}
                    onMouseEnter={(e) => {
                      e.currentTarget.classList.add('hover');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.classList.remove('hover');
                    }}
                  >
                    <div className="card-body p-3">
                      <div style={{ fontWeight: 'bold', color: colors.text, marginBottom: '0.25rem' }}>
                        {article.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        {article.category && <span>Kategorie: {article.category}</span>}
                        {article.supplierArticleNumber && <span>{article.category ? ' • ' : ''}Art-Nr: {article.supplierArticleNumber}</span>}
                        {article.bundleEanCode && <span>{(article.category || article.supplierArticleNumber) ? ' • ' : ''}EAN: {article.bundleEanCode}</span>}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                        {article.bundlePrice && <span>Preis: {article.bundlePrice.toFixed(2).replace('.', ',')} €</span>}
                        {article.bundleUnit && <span>{article.bundlePrice ? ' • ' : ''}Einheit: {article.bundleUnit}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: colors.textSecondary }}>
                {localSearchTerm ? 'Keine Artikel gefunden' : supplierId ? 'Bitte Suchbegriff eingeben oder alle Artikel des Lieferanten anzeigen' : 'Bitte zuerst einen Lieferanten auswählen'}
              </div>
            )}
          </div>
        </div>
        <div className="card-footer d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            <FaTimes className="me-2" />
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptReviewModal;

