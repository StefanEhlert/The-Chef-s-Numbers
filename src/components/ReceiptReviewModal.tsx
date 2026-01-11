import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FaTimes, FaSave, FaEdit, FaPlus, FaImage, FaEuroSign, FaSearch, FaCheck, FaCalculator, FaCoins, FaExclamationTriangle, FaCopy, FaPrint, FaPercent, FaCode, FaMinus, FaChevronLeft, FaChevronRight, FaBan } from 'react-icons/fa';
import { ExtendedReceiptData, ReceiptArticle } from '../services/ocrTypes';
import { useArticleForm, Supplier } from '../hooks/useArticleForm';
import { Supplier as SupplierType, PhoneType, ReceiptLineItem, ReceiptAccountingEntry } from '../types';
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
import ReceiptImageViewer from './ReceiptImageViewer';

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
  onSaveReceipt?: (receiptUpdate: { processedOcrData?: ExtendedReceiptData; receiptDetails?: any; accounting?: ReceiptAccountingEntry[]; isCompleted?: boolean }) => Promise<void>; // Callback zum Speichern des Receipts
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
  const [showArticleSearchModal, setShowArticleSearchModal] = useState<boolean>(false);
  const [articleSearchTerm, setArticleSearchTerm] = useState<string>('');
  const [currentArticles, setCurrentArticles] = useState<Article[]>([]); // Aktuelle Artikel aus storageLayer
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
  
  // Mouse-Move Handler für Resize (nur noch für linkes Panel)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        e.preventDefault();
        e.stopPropagation();
        const deltaX = e.clientX - resizeStartXRef.current;
        const newWidth = Math.max(200, Math.min(600, resizeStartLeftWidthRef.current + deltaX));
        setLeftPanelWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (isResizingLeft) {
        setIsResizingLeft(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Speichere Breiten NICHT automatisch - nur beim Speichern des Beleges
      }
    };
    
    if (isResizingLeft) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingLeft, leftPanelWidth, rightPanelWidth, onUpdateReceiptData]);
  
  // Speichere Breiten NICHT automatisch - nur beim Speichern des Beleges
  // useEffect entfernt, um Datenlast zu reduzieren
  
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
  
  // Bildansicht State (für Druck-Preview benötigt)
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
  const prevPositionRef = useRef<{ x: number; y: number } | null>(null); // Referenz für vorherige Position zum Vermeiden von Endlosschleifen
  const prevCompletedRef = useRef<boolean | null>(null); // Referenz für vorherigen Fertig-Status zum Vermeiden von Endlosschleifen
  const prevImageZoomRef = useRef<number>(receiptData.imageZoom ?? 1); // Aktueller Zoom-Wert (wird beim Speichern verwendet)
  const prevImagePositionRef = useRef<{ x: number; y: number }>(receiptData.imagePosition ?? { x: 0, y: 0 }); // Aktuelle Bildposition (wird beim Speichern verwendet)
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
  const previousQuantityRef = useRef<number>(1);
  const previousLinkedArticleIdRef = useRef<string | undefined>(undefined);
  const isLinkingRef = useRef<boolean>(false);
  const isChangingArticleRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

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
      // Artikelname
      article.name &&
      article.name.trim() !== '' &&
      // Kategorie
      article.category &&
      article.category.trim() !== '' &&
      // Steuerkonto
      article.taxAccount &&
      article.taxAccount.trim() !== '' &&
      // MwSt-Satz
      article.vatRate !== undefined &&
      article.vatRate !== null &&
      // Gebindeeinheit
      article.bundleUnit &&
      article.bundleUnit.trim() !== '' &&
      // Gebinde-Preis
      article.bundlePrice &&
      article.bundlePrice > 0 &&
      // Inhalt
      article.content &&
      article.content > 0 &&
      // InhaltEinheit
      article.contentUnit &&
      article.contentUnit.trim() !== ''
    );
  };

  const isArticleComplete = (article: ReceiptArticle): boolean => {
    return isArticleValid(article);
  };

  // Bestimme den Status eines Artikels für die Anzeige
  const getArticleStatus = (article: ReceiptArticle): 'ignore' | 'warning' | 'linked' | 'new' => {
    // Priorität 1: excludeFromUpdate hat Vorrang
    if (article.excludeFromUpdate) {
      return 'ignore';
    }
    
    // Priorität 2: Validierung fehlgeschlagen
    if (!isArticleValid(article)) {
      return 'warning';
    }
    
    // Priorität 3: Artikel ist verlinkt
    if (article.linkedArticleId) {
      return 'linked';
    }
    
    // Priorität 4: Artikel ist vollständig aber nicht verlinkt (wird neu angelegt)
    return 'new';
  };

  // Validierung für einzelne Felder
  const isFieldInvalid = (fieldName: string, value: any): boolean => {
    switch (fieldName) {
      case 'name':
        return !value || value.trim() === '';
      case 'category':
        return !value || value.trim() === '';
      case 'taxAccount':
        return !value || value.trim() === '';
      case 'vatRate':
        return value === undefined || value === null;
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
        // console.log(`✅ Kategorie automatisch erkannt: "${matchingCategory}" (aus Wort: "${longestWord}")`);
      }
    }
  };

  // Artikelwechsel: Price-Berechnung und Formular-Füllung
  useEffect(() => {
    // Wichtig: Nur ausführen wenn Modal geöffnet ist!
    if (!show) return;
    
    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
      const selectedArticle = editedArticles[selectedArticleIndex];
      
      // Aktualisiere previousQuantityRef bei Artikelwechsel
      previousQuantityRef.current = selectedArticle.quantity || 1;
      
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
  useEffect(() => {
    if (!show) return;
    
    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
      const selectedArticle = editedArticles[selectedArticleIndex];
      const currentLinkedArticleId = selectedArticle.linkedArticleId;
      
      // Prüfe, ob sich die linkedArticleId geändert hat
      if (previousLinkedArticleIdRef.current !== currentLinkedArticleId && currentLinkedArticleId) {
        // console.log('🔄 [LINK-CHANGE] linkedArticleId geändert, aktualisiere Formular:', {
        //   previous: previousLinkedArticleIdRef.current,
        //   current: currentLinkedArticleId,
        //   articleName: selectedArticle.name
        // });
        
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
      // console.warn('⚠️ Kein Steuerkonto ausgewählt');
      return;
    }
    const updatedArticles = editedArticles.map(article => ({
      ...article,
      taxAccount: selectedTaxAccount
    }));
    setEditedArticles(updatedArticles);
    // console.log(`✅ Steuerkonto ${selectedTaxAccount} auf alle ${updatedArticles.length} Artikel angewendet`);
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
    
    // console.log('✅ Neuer Artikel hinzugefügt an Position', selectedArticleIndex);
  }, [editedArticles, selectedArticleIndex, receiptSupplierId, selectedTaxAccount, receiptVatRate, setArticleForm, setBundlePriceInput, setContentInput, setPricePerUnitInput, setArticleSearchTerm]);

  // Funktion zum Entfernen des aktuell ausgewählten Artikels
  const handleRemoveArticle = useCallback(() => {
    if (editedArticles.length <= 1) {
      // console.warn('⚠️ Kann nicht den letzten Artikel entfernen');
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
    
    // console.log('✅ Artikel entfernt von Position', selectedArticleIndex);
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

  // Handler für Auswahl eines recognizedName (wenn supplierId bereits vorhanden)
  const handleRecognizedNameSelect = async (recognizedName: string) => {
    if (!receiptSupplierId) return;
    
    // Finde den aktuellen Lieferanten
    const currentSupplier = suppliers.find(s => s.id === receiptSupplierId) || 
                           state.suppliers.find(s => s.id === receiptSupplierId);
    
    if (!currentSupplier) {
      console.warn('⚠️ Lieferant nicht gefunden:', receiptSupplierId);
      return;
    }
    
    // Aktualisiere den Namen des Lieferanten
    const updatedSupplier = {
      ...currentSupplier,
      name: recognizedName,
      isDirty: true,
      updatedAt: new Date()
    };
    
    // Speichere über StorageLayer
    const success = await storageLayer.save('suppliers', [updatedSupplier]);
    if (success) {
      // Aktualisiere globalen State
      dispatch({ 
        type: 'UPDATE_SUPPLIER', 
        payload: { id: currentSupplier.id, supplier: updatedSupplier }
      });
      
      // Aktualisiere auch den Suchbegriff
      setReceiptSupplierSearchTerm(recognizedName);
      
      console.log('✅ Lieferantenname aktualisiert:', recognizedName);
    } else {
      console.error('❌ Fehler beim Speichern des Lieferanten');
    }
    
    setShowSupplierDropdown(false);
  };
  
  // Handler für Änderung der Netto-Preise Checkbox
  const handleNettoPricesChange = async (checked: boolean) => {
    // console.log('🔄 [NETTO-PREISE] Checkbox geändert:', checked);
    // console.log('🔄 [NETTO-PREISE] Aktueller State vor Update:', nettoPrices);
    
    // Setze State sofort
    setNettoPrices(checked);
    
    // Aktualisiere Lieferant, wenn einer ausgewählt ist
    if (receiptSupplierId) {
      try {
        // Verwende State statt props, falls props nicht aktualisiert wurden
        const supplierFromState = state.suppliers.find(s => s.id === receiptSupplierId);
        const supplier = supplierFromState || suppliers.find(s => s.id === receiptSupplierId);
        
        if (supplier) {
          // console.log('🔄 [NETTO-PREISE] Aktualisiere Lieferant:', supplier.name, 'von', supplier.nettoPrices, 'zu', checked);
          
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
            // console.log('✅ Netto-Preise Einstellung im Lieferanten aktualisiert:', checked);
          } else {
            // console.error('❌ Fehler beim Speichern des Lieferanten');
          }
        } else {
          // console.warn('⚠️ [NETTO-PREISE] Lieferant nicht gefunden:', receiptSupplierId);
        }
      } catch (error) {
        // console.error('❌ Fehler beim Aktualisieren der Netto-Preise Einstellung:', error);
      }
    } else {
      // console.log('ℹ️ [NETTO-PREISE] Kein Lieferant ausgewählt, nur State aktualisiert');
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
      setReceiptDate('');
      setReceiptNumber('');
      setArticleSearchTerm('');
    }
  }, [show]);

  // Aktualisiere editedArticles wenn articleForm sich ändert
  useEffect(() => {
    // Wichtig: Nur ausführen wenn Modal geöffnet ist!
    if (!show) return;
    
    // WICHTIG: Überspringe Sync während Verlinkung, um Endlosschleife zu vermeiden!
    if (isLinkingRef.current) {
      // console.log('⏭️ [SYNC] Überspringe Sync - Verlinkung läuft gerade');
      return;
    }
    
    // WICHTIG: Überspringe Sync während Artikelwechsel, um zu verhindern, dass alte Formularwerte
    // in den neuen Artikel geschrieben werden
    if (isChangingArticleRef.current) {
      // console.log('⏭️ [SYNC] Überspringe Sync - Artikelwechsel läuft gerade');
      return;
    }
    
    if (editedArticles.length > 0 && selectedArticleIndex < editedArticles.length) {
      const currentArticle = editedArticles[selectedArticleIndex];
      
      // WICHTIG: Wenn articleForm gerade zurückgesetzt wurde (leerer Name),
      // aber der Artikel bereits einen Namen hat, dann nicht synchronisieren!
      // Der Artikelwechsel-Effect sollte zuerst laufen und articleForm mit den korrekten Daten füllen.
      if (!articleForm.name && currentArticle.name) {
        // console.log('⏭️ [SYNC] Überspringe Sync - articleForm wird gerade initialisiert');
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

  // Lade AccountingAccounts und vatRates beim Öffnen
  useEffect(() => {
    if (show) {
      const loadAccountingData = async () => {
        try {
          // Lade AccountingSettings für selectedChartId und vatRates
          const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
          let chartId: AccountingChartId = 'skr03';
          if (settings && settings.length > 0) {
            const firstSettings = settings[0];
            if (firstSettings.selectedChartId) {
              chartId = firstSettings.selectedChartId;
              setSelectedChartId(chartId);
            }
            if (firstSettings.vatRates && firstSettings.vatRates.length > 0) {
              setVatRates(firstSettings.vatRates);
            }
          }
          
          // Lade AccountingAccounts und filtere direkt beim Laden
          const accounts = await storageLayer.load<AccountingAccount>('accountingAccounts');
          if (accounts) {
            // Filtere nur aktive Konten für den ausgewählten Chart direkt beim Laden
            const activeAccounts = accounts.filter(acc => 
              acc.status === 'active' && 
              acc.chartId === chartId
            );
            setAccountingAccounts(activeAccounts);
          }
        } catch (error) {
          // // console.error('❌ Fehler beim Laden der Accounting-Daten:', error);
        }
      };
      
      loadAccountingData();
        }
  }, [show]);

  // Lade aktuelle Artikel aus storageLayer beim Öffnen des Such-Modals
  useEffect(() => {
    if (showArticleSearchModal) {
      const loadCurrentArticles = async () => {
        try {
          const articles = await storageLayer.load<Article>('articles');
          if (articles) {
            setCurrentArticles(articles);
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden der Artikel aus storageLayer:', error);
          // Fallback auf State, falls storageLayer fehlschlägt
          setCurrentArticles(state.articles);
        }
      };
      
      loadCurrentArticles();
    }
  }, [showArticleSearchModal, state.articles]);
    
  // Aktualisiere Refs, wenn sich Props ändern
  useEffect(() => {
    receiptDataRef.current = receiptData;
    onUpdateReceiptDataRef.current = onUpdateReceiptData;
  }, [receiptData, onUpdateReceiptData]);

  // Initialisiere editedArticles beim Öffnen
  useEffect(() => {
    if (show) {
      console.log('📋 [ReceiptReviewModal] Modal geöffnet, initialisiere Daten:', {
        receiptId: receiptId,
        hasReceiptData: !!receiptData,
        articleCount: receiptData?.articles?.length || 0,
        receiptDataKeys: receiptData ? Object.keys(receiptData) : [],
        articles: receiptData?.articles?.slice(0, 3) || []
      });
      
      const isFirstInit = !isInitializedRef.current;
      isInitializedRef.current = true;
      
      // Reset Refs
      previousLinkedArticleIdRef.current = undefined;
      previousQuantityRef.current = 1;
      isLinkingRef.current = false;
      
      // Setze articleForm zurück, bevor wir neue Daten laden!
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
      
      // Verwende Artikel direkt aus receiptData (keine Normalisierung mehr)
      const articlesToSet = receiptData?.articles || [];
      console.log('📋 [ReceiptReviewModal] Setze editedArticles:', articlesToSet.length, 'Artikel');
      setEditedArticles(articlesToSet);
      setSelectedArticleIndex(0);
      
      // Setze Belegdatum und Belegnummer aus receiptData
      setReceiptDate(receiptData.date || '');
      setReceiptNumber(receiptData.receiptNumber || '');
      
      // Setze Lieferant direkt aus receiptData
      if (receiptData.supplierId) {
        setReceiptSupplierId(receiptData.supplierId);
        // Finde Lieferanten-Namen für Anzeige
        const suppliersToUse = state.suppliers.length > 0 ? state.suppliers : suppliers;
        const supplier = suppliersToUse.find(s => s.id === receiptData.supplierId);
        if (supplier) {
          setReceiptSupplierSearchTerm(supplier.name);
          // Übernehme nettoPrices vom Lieferanten - nur beim ersten Öffnen
          if (isFirstInit) {
            const supplierNettoPrices = (supplier as any).nettoPrices || false;
            setNettoPrices(supplierNettoPrices);
          }
        } else {
          // Lieferant-ID existiert nicht mehr
          setReceiptSupplierId('');
          setReceiptSupplierSearchTerm('');
          setNettoPrices(false);
        }
      } else {
        // Kein Lieferant vorhanden
        setReceiptSupplierId('');
        setReceiptSupplierSearchTerm('');
        setNettoPrices(false);
    }
    }
    
    // Fülle Formular mit dem ersten Artikel nach dem Initialisieren
    // (außerhalb des if-Blocks, damit es immer ausgeführt wird)
    if (show && receiptData.articles && receiptData.articles.length > 0) {
      const firstArticle = receiptData.articles[0];
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
        
        // console.log('✅ [INIT] Formular mit erstem Artikel befüllt:', {
        //   name: firstArticle.name,
        //   category: firstArticle.category,
        //   quantity: firstArticle.quantity
        // });
    }
  }, [show, receiptData.articles, receiptData.supplier, receiptData.supplierId]); // suppliers entfernt, um Re-Render nach Speichern zu vermeiden


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
        // console.log('📄 [PDF-CHECK] PDF erkannt über receiptImagePath (.pdf Endung):', receiptImagePath);
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
            // console.log('📄 [PDF-CHECK] imageData aus LocalStorage:', imageData);
            if (imageData) {
              if (typeof imageData === 'object' && imageData.fileType === 'application/pdf') {
                // console.log('📄 [PDF-CHECK] PDF erkannt über gespeicherten fileType in LocalStorage:', receiptImagePath);
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
                  // console.log('📄 [PDF-CHECK] IndexedDB-Verweis gefunden, prüfe IndexedDB direkt...');
                  // Wir können hier nicht async machen, daher prüfen wir imageUrl
                }
              }
            }
          }
        }
      } catch (e) {
        // console.error('📄 [PDF-CHECK] Fehler beim Parsen von LocalStorage:', e);
      }
    }
    
    // Prüfe imageUrl (geladenes Bild) - für Blob URLs müssen wir receiptImagePath prüfen
    if (imageUrl) {
      const urlLower = imageUrl.toLowerCase();
      // Prüfe auf .pdf Endung oder PDF MIME-Type
      if (urlLower.endsWith('.pdf') || urlLower.includes('application/pdf') || urlLower.includes('data:application/pdf')) {
        // console.log('📄 [PDF-CHECK] PDF erkannt über imageUrl:', imageUrl.substring(0, 50));
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
                  // console.log('📄 [PDF-CHECK] PDF erkannt über fileType in IndexedDB-Verweis:', receiptImagePath);
                  return true;
                }
                // Wenn fileType nicht gespeichert ist, aber es ist ein IndexedDB-Verweis und eine Blob URL,
                // nehmen wir an, es könnte ein PDF sein (da PDFs als Blob URLs geladen werden)
                // Aber das ist nicht zuverlässig - besser: direkt aus IndexedDB lesen
                // console.log('📄 [PDF-CHECK] IndexedDB-Verweis ohne fileType, prüfe IndexedDB direkt...');
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
          // console.log('📄 [PDF-CHECK] PDF erkannt über receiptImage (String):', receiptImage.substring(0, 50));
          return true;
        }
      } else {
        if (receiptImage.type === 'application/pdf') {
          // console.log('📄 [PDF-CHECK] PDF erkannt über receiptImage (File):', receiptImage.name);
          return true;
        }
      }
    }
    
    // console.log('📄 [PDF-CHECK] Kein PDF erkannt - receiptImagePath:', receiptImagePath, 'imageUrl:', imageUrl?.substring(0, 50));
    return false;
  }, [receiptImage, imageUrl, receiptImagePath]);

  // Lade Bild-URL wenn receiptImage vorhanden
  useEffect(() => {
    // console.log('🖼️ [IMAGE] receiptImage geändert:', receiptImage);
    // console.log('📄 [IMAGE] receiptImagePath:', receiptImagePath);
    // console.log('🖼️ [IMAGE] Aktueller imageUrl:', imageUrl);
    
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
        // console.log('🖼️ [IMAGE] Konvertiere File zu URL:', receiptImage.name, receiptImage.type);
        const url = URL.createObjectURL(receiptImage);
        // console.log('🖼️ [IMAGE] URL erstellt:', url);
        setImageUrl(url);
        return () => {
          // Cleanup: URL freigeben
          // console.log('🖼️ [IMAGE] URL freigegeben');
          URL.revokeObjectURL(url);
        };
      }
    } else if (receiptImagePath) {
      // Wenn nur receiptImagePath vorhanden ist, wird das Bild von ReceiptReviewModalWithImage geladen
      // Wir müssen hier nichts tun, da ReceiptReviewModalWithImage receiptImage als String-URL setzt
      // console.log('📄 [IMAGE] Warte auf Bild-Laden durch ReceiptReviewModalWithImage...');
    } else {
      // console.log('🖼️ [IMAGE] Kein Bild vorhanden');
      setImageUrl('');
    }
  }, [receiptImage, receiptImagePath]);
  
  // Cleanup: Revoke Blob URLs wenn sie nicht mehr benötigt werden
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        // console.log('🖼️ [IMAGE] Cleanup: Revoke Blob URL');
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
      
      // console.log('📄 [PDF-CANVAS] Starte Rendering von PDF:', pdfUrl.substring(0, 50));
      
      // Lade PDF - konvertiere immer zu ArrayBuffer für bessere Kompatibilität
      let pdfData: ArrayBuffer;
      if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        // Für Blob-URLs und HTTP-URLs: Lade als ArrayBuffer
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Fehler beim Laden des PDFs: ${response.status} ${response.statusText}`);
        }
        pdfData = await response.arrayBuffer();
      } else {
        // Für Data URLs oder andere Formate
        const response = await fetch(pdfUrl);
        pdfData = await response.arrayBuffer();
      }
      
      // Warte kurz, um sicherzustellen, dass die Daten vollständig geladen sind
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: pdfData,
        // Zusätzliche Optionen für bessere Kompatibilität
        verbosity: 0, // Reduziere Logging
        stopAtErrors: false // Versuche trotz kleiner Fehler zu rendern
      });
      const pdf = await loadingTask.promise;
      // console.log('📄 [PDF-CANVAS] PDF geladen, Seiten:', pdf.numPages);

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
          // console.error(`❌ [PDF-CANVAS] Konnte Canvas-Context für Seite ${pageNum} nicht erstellen`);
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
        
        // console.log(`✅ [PDF-CANVAS] Seite ${pageNum}/${pdf.numPages} gerendert:`, canvas.width, 'x', canvas.height);
      }

      // console.log(`✅ [PDF-CANVAS] PDF erfolgreich gerendert: ${canvasUrls.length} Seiten`);
      return canvasUrls;
    } catch (error) {
      // console.error('❌ [PDF-CANVAS] Fehler beim Rendern des PDFs:', error);
      return [];
    }
  }, []);

  // PDF-Rendering für Anzeige wird jetzt in ReceiptImageViewer Komponente gehandhabt

  // Rendere PDF zu Canvas wenn PDF geladen wird und Druck-Preview geöffnet wird
  useEffect(() => {
    if (showPrintPreview && isPDF && imageUrl && pdfCanvasUrls.length === 0) {
      // console.log('📄 [PDF-CANVAS] Starte PDF-Rendering für Druck-Preview');
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
    
    // console.log(`🔄 [PREIS-UMRECHNUNG] Artikel "${article.name}": Brutto → Netto (${vatRate}%)`, {
    //   bundlePrice: `${bundlePriceBrutto.toFixed(2)} → ${bundlePriceNetto.toFixed(2)}`,
    //   pricePerUnit: `${pricePerUnitBrutto.toFixed(2)} → ${pricePerUnitNetto.toFixed(2)}`
    // });
    
    return {
      bundlePrice: bundlePriceNetto,
      pricePerUnit: pricePerUnitNetto
    };
  };

  // Hilfsfunktion: Prüfe, ob sich relevante Felder zwischen ReceiptArticle und Article unterscheiden
  const hasArticleChanged = (receiptArticle: ReceiptArticle, existingArticle: Article): boolean => {
    // Prüfe alle relevanten Felder
    if ((receiptArticle.name || '') !== (existingArticle.name || '')) return true;
    if ((receiptArticle.category || '') !== (existingArticle.category || '')) return true;
    if ((receiptArticle.supplierArticleNumber || '') !== (existingArticle.supplierArticleNumber || '')) return true;
    if ((receiptArticle.taxAccount || '') !== (existingArticle.accountingAccountNumber || '')) return true;
    if ((receiptArticle.bundleUnit || '') !== (existingArticle.bundleUnit || '')) return true;
    
    // Preise: Umrechnung zu Netto für Vergleich
    const { bundlePrice: receiptBundlePrice } = convertPricesToNetto(receiptArticle);
    if (Math.abs(receiptBundlePrice - (existingArticle.bundlePrice || 0)) > 0.01) return true; // Toleranz für Rundungsfehler
    
    if (Math.abs((receiptArticle.content || 0) - (existingArticle.content || 0)) > 0.0001) return true; // Toleranz für Rundungsfehler
    if ((receiptArticle.contentUnit || '') !== (existingArticle.contentUnit || '')) return true;
    if ((receiptArticle.notes || '') !== (existingArticle.notes || '')) return true;
    if ((receiptArticle.bundleEanCode || '') !== (existingArticle.bundleEanCode || '')) return true;
    if ((receiptArticle.contentEanCode || '') !== (existingArticle.contentEanCode || '')) return true;
    
    return false;
  };

  const handleSave = async () => {
    try {
      // Speichere immer processedOcrData mit aktuellen Werten
      // Inkludiere Zoom, Position und Panel-Breiten beim Speichern
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
        isCompleted: receiptData.isCompleted || false,
        printListPosition: printPreviewListPosition, // Aktuelle Druck-Position
        imageZoom: prevImageZoomRef.current ?? receiptData.imageZoom ?? 1, // Aktueller Zoom
        imagePosition: prevImagePositionRef.current ?? receiptData.imagePosition ?? { x: 0, y: 0 }, // Aktuelle Position
        leftPanelWidth: leftPanelWidth,
        rightPanelWidth: rightPanelWidth,
        autoLinkPerformed: receiptData.autoLinkPerformed
      };
      
      // Verarbeite Artikel: Verlinkte Artikel prüfen und vollständige, nicht verlinkte Artikel anlegen
      const articlesToSave: Article[] = [];
      const articlesToUpdate: Article[] = [];
      const updatedReceiptArticles: ReceiptArticle[] = [...editedArticles];

      // Lade aktuelle Artikel aus storageLayer
      let allArticlesFromStorage: Article[] = [];
      try {
        const loadedArticles = await storageLayer.load<Article>('articles');
        if (loadedArticles) {
          allArticlesFromStorage = loadedArticles;
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der Artikel aus storageLayer:', error);
        allArticlesFromStorage = state.articles;
      }

      // Verarbeite jeden Artikel
      for (let i = 0; i < editedArticles.length; i++) {
        const receiptArticle = editedArticles[i];
        
        // Ignoriere Artikel mit excludeFromUpdate oder unvollständige Artikel
        if (receiptArticle.excludeFromUpdate || !isArticleComplete(receiptArticle)) {
          continue;
        }

        // Fall 1: Artikel ist verlinkt - prüfe auf Änderungen
        if (receiptArticle.linkedArticleId) {
          const existingArticle = allArticlesFromStorage.find(a => a.id === receiptArticle.linkedArticleId);
          
          if (existingArticle) {
            // Prüfe, ob sich relevante Felder geändert haben
            if (hasArticleChanged(receiptArticle, existingArticle)) {
              // Füge OCR-Namen zu namesOCR hinzu, falls vorhanden
              const currentOCRName = receiptArticle.nameOCR;
              const existingNamesOCR = existingArticle.namesOCR || [];
              const updatedNamesOCR = currentOCRName && !existingNamesOCR.includes(currentOCRName)
                ? [...existingNamesOCR, currentOCRName]
                : existingNamesOCR;
              
              // Rechne Preise von Brutto zu Netto um, wenn nötig
              const { bundlePrice: convertedBundlePrice, pricePerUnit: convertedPricePerUnit } = convertPricesToNetto(receiptArticle);
              
              const updatedArticle: Article = {
                ...existingArticle,
                name: receiptArticle.name || existingArticle.name,
                namesOCR: updatedNamesOCR,
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
                accountingAccountNumber: receiptArticle.taxAccount || existingArticle.accountingAccountNumber,
                notes: receiptArticle.notes || existingArticle.notes,
                isDirty: true,
                syncStatus: 'pending'
              };
              
              articlesToUpdate.push(updatedArticle);
            }
          }
        } 
        // Fall 2: Artikel ist vollständig aber nicht verlinkt - lege neuen Artikel an und verlinke
        else {
          // Rechne Preise von Brutto zu Netto um, wenn nötig
          const { bundlePrice: convertedBundlePrice, pricePerUnit: convertedPricePerUnit } = convertPricesToNetto(receiptArticle);
          
          const newArticle: Article = {
            id: UUIDUtils.generateId(),
            name: receiptArticle.name || '',
            namesOCR: receiptArticle.nameOCR ? [receiptArticle.nameOCR] : [],
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
            accountingAccountNumber: receiptArticle.taxAccount || '',
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
          
          // Verlinke den ReceiptArticle mit dem neuen Artikel
          updatedReceiptArticles[i] = {
            ...receiptArticle,
            linkedArticleId: newArticle.id
          };
        }
      }

      // Speichere neue Artikel
      if (articlesToSave.length > 0) {
        const success = await storageLayer.save('articles', articlesToSave);
        if (!success) {
          throw new Error('Fehler beim Speichern der neuen Artikel');
        }
        
        // Aktualisiere globalen State
        articlesToSave.forEach(article => {
          dispatch({ type: 'ADD_ARTICLE', payload: article });
        });
      }

      // Aktualisiere bestehende Artikel
      if (articlesToUpdate.length > 0) {
        const success = await storageLayer.save('articles', articlesToUpdate);
        if (!success) {
          throw new Error('Fehler beim Aktualisieren der Artikel');
        }
        
        // Aktualisiere globalen State
        articlesToUpdate.forEach(article => {
          dispatch({ type: 'UPDATE_ARTICLE', payload: { id: article.id, article } });
        });
      }

      // Aktualisiere editedArticles mit verlinkten IDs
      const finalArticles = articlesToSave.length > 0 ? updatedReceiptArticles : editedArticles;
      if (articlesToSave.length > 0) {
        setEditedArticles(finalArticles);
      }

      // Prüfe, ob alle Artikel entweder verlinkt, vollständig oder ignoriert sind
      const allArticlesProcessed = finalArticles.every(article => {
        // Artikel ist ignoriert
        if (article.excludeFromUpdate) {
          return true;
        }
        // Artikel ist vollständig
        if (isArticleComplete(article)) {
          return true;
        }
        // Artikel ist verlinkt (auch wenn nicht vollständig)
        if (article.linkedArticleId) {
          return true;
        }
        // Artikel ist weder vollständig noch verlinkt noch ignoriert
        return false;
      });

      // Debug-Log für isCompleted-Prüfung
      console.log('🔍 [handleSave] isCompleted-Prüfung:', {
        totalArticles: finalArticles.length,
        allArticlesProcessed,
        articlesStatus: finalArticles.map(a => ({
          name: a.name,
          excludeFromUpdate: a.excludeFromUpdate,
          isComplete: isArticleComplete(a),
          linkedArticleId: a.linkedArticleId,
          status: a.excludeFromUpdate ? 'ignored' : (isArticleComplete(a) ? 'complete' : (a.linkedArticleId ? 'linked' : 'incomplete'))
        }))
      });

      // Setze isCompleted basierend auf dem Status aller Artikel
      const finalIsCompleted = allArticlesProcessed;
      
      // Erstelle accounting-Einträge aus taxAccountTotals
      const accountingEntries: ReceiptAccountingEntry[] = taxAccountTotals.map((item) => {
        const vatRate = extractVatRateFromAccountName(item.accountName);
        return {
          id: UUIDUtils.generateId(),
          accountNumber: item.accountNumber,
          accountName: item.accountName,
          amount: item.total,
          vatRate: vatRate !== null ? vatRate : undefined
        };
      });
      
      // Aktualisiere processedOcrData mit finalen Werten
      const finalReceiptData: ExtendedReceiptData = {
        ...updatedReceiptData,
        articles: finalArticles,
        isCompleted: finalIsCompleted
      };
      
      // Aktualisiere processedOcrData (Zwischenspeicherung)
      if (onUpdateReceiptData) {
        await onUpdateReceiptData(finalReceiptData);
      }
      
      // Speichere finalen Beleg (nur einmal am Ende)
      if (onSaveReceipt) {
        await onSaveReceipt({ 
          processedOcrData: finalReceiptData,
          accounting: accountingEntries,
          isCompleted: finalIsCompleted
        });
      }

      // Schließe das Modal nach erfolgreichem Speichern
      onClose();

    } catch (error: any) {
      console.error('❌ Fehler beim Speichern:', error);
      alert(`Fehler beim Speichern: ${error.message}`);
    }
  };

  // Bild-Drag und Wheel-Handler werden jetzt in ReceiptImageViewer Komponente gehandhabt

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
        // console.warn('⚠️ PDF-Canvas nicht verfügbar für Druck');
        return;
      }
    } else {
      // Für Bilder: Prüfe ob Bild und Größe verfügbar sind
    if (!printImageRef.current || !printPreviewImageSize) {
        // console.warn('⚠️ Bildgröße nicht verfügbar für Druck');
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

    // console.log('🖨️ Druck-Position:', {
    //   pixelPosition: printPreviewListPosition,
    //   imageSize: printPreviewImageSize,
    //   percentPosition: { x: positionPercentX, y: positionPercentY },
    //   isPDF: isPDF
    // });

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

  // Reset beim Öffnen, Wiederherstellen der Druck-Position
  // WICHTIG: Nur beim Öffnen (show wird true), nicht bei jeder receiptData-Änderung!
  useEffect(() => {
    if (show) {
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
      
      // Initialisiere Refs mit aktuellen Werten beim Öffnen
      prevImageZoomRef.current = receiptData.imageZoom ?? 1;
      prevImagePositionRef.current = receiptData.imagePosition ?? { x: 0, y: 0 };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]); // Nur bei show-Änderung, nicht bei receiptData-Änderungen!
  
  // Speichere Position NICHT automatisch - nur beim Speichern des Beleges
  // useEffect entfernt, um Datenlast zu reduzieren

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

  // Bild-Zoom und Position werden jetzt in ReceiptImageViewer Komponente verwaltet
  // und über Callbacks (onZoomChange, onPositionChange) zurückgegeben

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
                    {/* Zeile 1: Artikelbezeichnung mit Status */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-theme-primary" style={{ fontWeight: 'bold' }}>{article.name || 'Unbenannt'}</span>
                      <div className="d-flex align-items-center gap-2">
                        {(() => {
                          const status = getArticleStatus(article);
                          switch (status) {
                            case 'ignore':
                              return (
                                <FaBan 
                                  style={{ fontSize: '0.9rem', color: colors.textSecondary || '#6c757d' }} 
                                  title="Wird nicht mit den Stammdaten aktualisiert" 
                                />
                              );
                            case 'warning':
                              return (
                                <FaExclamationTriangle 
                                  style={{ fontSize: '0.9rem', color: colors.accent || '#ffc107' }} 
                                  title="Artikel ist noch nicht vollständig ausgefüllt" 
                                />
                              );
                            case 'linked':
                              return (
                                <FaCheck 
                                  style={{ fontSize: '0.9rem', color: '#28a745' }} 
                                  title="Mit Artikelstamm verknüpft" 
                                />
                              );
                            case 'new':
                              return (
                                <FaPlus 
                                  style={{ fontSize: '0.9rem', color: colors.primary || '#007bff' }} 
                                  title="Vollständig - wird als neuer Artikel angelegt" 
                                />
                              );
                            default:
                              return null;
                          }
                        })()}
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: '0.7em',
                            width: '1.2rem',
                            height: '1.2rem',
                            borderRadius: '50%',
                            backgroundColor: 'transparent',
                            border: `1px solid ${colors.text}`,
                            color: colors.text,
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1
                          }}
                        >
                          {article.vatRate === 7 ? '2' : article.vatRate === 19 ? '1' : article.vatRate === 0 ? '0' : `${article.vatRate || 19}%`}
                        </span>
                      </div>
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
                            <div className="px-2 mb-3 flex-shrink-0 w-full md:w-1/2">
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
                                    onFocus={() => {
                                      // Setze receiptSupplierSearchTerm zurück, damit alle recognizedNames angezeigt werden
                                      setReceiptSupplierSearchTerm('');
                                      
                                      // Debug: Logge Supplier-Info beim Öffnen des Dropdowns
                                      if (receiptSupplierId) {
                                        const currentSupplier = suppliers.find(s => s.id === receiptSupplierId) || 
                                                               state.suppliers.find(s => s.id === receiptSupplierId);
                                        console.log('🔍 [ReceiptReviewModal] Dropdown geöffnet - Supplier gefunden:', {
                                          id: currentSupplier?.id,
                                          name: currentSupplier?.name,
                                          recognizedNames: currentSupplier?.recognizedNames,
                                          recognizedNamesType: typeof currentSupplier?.recognizedNames,
                                          recognizedNamesIsArray: Array.isArray(currentSupplier?.recognizedNames),
                                          recognizedNamesLength: currentSupplier?.recognizedNames?.length,
                                          suppliersLength: suppliers.length,
                                          stateSuppliersLength: state.suppliers.length
                                        });
                                      } else {
                                        console.log('🔍 [ReceiptReviewModal] Dropdown geöffnet - Kein supplierId, zeige alle Lieferanten:', {
                                          suppliersLength: suppliers.length,
                                          stateSuppliersLength: state.suppliers.length
                                        });
                                      }
                                      setShowSupplierDropdown(true);
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => setShowSupplierDropdown(false), 200);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        // Hier könnte man die Navigation implementieren
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        
                                        // Wenn supplierId vorhanden: Suche in recognizedNames
                                        if (receiptSupplierId) {
                                          const currentSupplier = suppliers.find(s => s.id === receiptSupplierId) || 
                                                                 state.suppliers.find(s => s.id === receiptSupplierId);
                                          
                                          // Stelle sicher, dass recognizedNames ein Array ist
                                          let recognizedNamesArray: string[] = [];
                                          if (currentSupplier?.recognizedNames) {
                                            if (Array.isArray(currentSupplier.recognizedNames)) {
                                              recognizedNamesArray = currentSupplier.recognizedNames;
                                            } else if (typeof currentSupplier.recognizedNames === 'string') {
                                              // Falls es ein JSON-String ist, parse es
                                              try {
                                                recognizedNamesArray = JSON.parse(currentSupplier.recognizedNames);
                                              } catch (e) {
                                                console.warn('⚠️ [ReceiptReviewModal] Fehler beim Parsen von recognizedNames:', e);
                                              }
                                            }
                                          }
                                          
                                          if (currentSupplier && recognizedNamesArray.length > 0) {
                                            const filtered = recognizedNamesArray.filter((name: string) => 
                                              name.toLowerCase().includes(receiptSupplierSearchTerm.toLowerCase())
                                            );
                                            if (filtered.length > 0) {
                                              handleRecognizedNameSelect(filtered[0]);
                                            } else if (receiptSupplierSearchTerm === currentSupplier.name) {
                                              handleRecognizedNameSelect(currentSupplier.name);
                                            }
                                          }
                                        } else {
                                          // Kein supplierId: Suche in allen Lieferanten
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
                                      }
                                    }}
                                    placeholder="Lieferant für alle Artikel auswählen..."
                                    style={{
                                      fontStyle: !receiptSupplierId ? 'italic' : 'normal',
                                      color: !receiptSupplierId ? 'var(--theme-text-secondary)' : 'var(--theme-text)'
                                    }}
                                  />
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
                                    {(() => {
                                      // Wenn supplierId vorhanden: Zeige recognizedNames
                                      if (receiptSupplierId) {
                                        const supplierFromProps = suppliers.find(s => s.id === receiptSupplierId);
                                        const supplierFromState = state.suppliers.find(s => s.id === receiptSupplierId);
                                        const currentSupplier = supplierFromProps || supplierFromState;
                                        
                                        // Debug: Logge beide Quellen
                                        console.log('🔍 [ReceiptReviewModal] Supplier-Suche:', {
                                          receiptSupplierId,
                                          supplierFromProps: supplierFromProps ? {
                                            id: supplierFromProps.id,
                                            name: supplierFromProps.name,
                                            recognizedNames: supplierFromProps.recognizedNames,
                                            recognizedNamesType: typeof supplierFromProps.recognizedNames,
                                            recognizedNamesIsArray: Array.isArray(supplierFromProps.recognizedNames)
                                          } : null,
                                          supplierFromState: supplierFromState ? {
                                            id: supplierFromState.id,
                                            name: supplierFromState.name,
                                            recognizedNames: supplierFromState.recognizedNames,
                                            recognizedNamesType: typeof supplierFromState.recognizedNames,
                                            recognizedNamesIsArray: Array.isArray(supplierFromState.recognizedNames)
                                          } : null,
                                          currentSupplier: currentSupplier ? {
                                            id: currentSupplier.id,
                                            name: currentSupplier.name,
                                            recognizedNames: currentSupplier.recognizedNames,
                                            recognizedNamesType: typeof currentSupplier.recognizedNames,
                                            recognizedNamesIsArray: Array.isArray(currentSupplier.recognizedNames)
                                          } : null
                                        });
                                        
                                        // Stelle sicher, dass recognizedNames ein Array ist
                                        let recognizedNamesArray: string[] = [];
                                        if (currentSupplier?.recognizedNames) {
                                          if (Array.isArray(currentSupplier.recognizedNames)) {
                                            recognizedNamesArray = currentSupplier.recognizedNames;
                                          } else if (typeof currentSupplier.recognizedNames === 'string') {
                                            // Falls es ein JSON-String ist, parse es
                                            try {
                                              recognizedNamesArray = JSON.parse(currentSupplier.recognizedNames);
                                            } catch (e) {
                                              console.warn('⚠️ [ReceiptReviewModal] Fehler beim Parsen von recognizedNames:', e);
                                            }
                                          }
                                        }
                                        
                                        if (currentSupplier && recognizedNamesArray.length > 0) {
                                          // Filtere recognizedNames: entferne aktuellen Namen und filtere nach Suchbegriff
                                          const filteredNames = recognizedNamesArray
                                            .filter((name: string) => name !== currentSupplier.name) // Entferne aktuellen Namen
                                            .filter((name: string) => 
                                              receiptSupplierSearchTerm
                                                ? name.toLowerCase().includes(receiptSupplierSearchTerm.toLowerCase())
                                                : true
                                            );
                                          
                                          return filteredNames.length > 0 ? (
                                            <>
                                              {/* Zeige recognizedNames ohne den aktuellen Namen */}
                                              {filteredNames.map((name: string, index: number) => {
                                                return (
                                                  <div
                                                    key={`recognized-${index}`}
                                                    className="px-3 py-2 cursor-pointer"
                                                    onClick={() => handleRecognizedNameSelect(name)}
                                                    style={{
                                                      color: colors.text,
                                                      borderBottom: index < filteredNames.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                                                      cursor: 'pointer',
                                                      backgroundColor: receiptSupplierSearchTerm === name ? (colors.accent || colors.primary) + '20' : 'transparent'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      if (receiptSupplierSearchTerm !== name) {
                                                        e.currentTarget.style.backgroundColor = colors.secondary;
                                                      }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      if (receiptSupplierSearchTerm !== name) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                      }
                                                    }}
                                                  >
                                                    <div>{name}</div>
                                                    <small style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                                                      Erkannter Name
                                                    </small>
                                                  </div>
                                                );
                                              })}
                                            </>
                                          ) : (
                                            <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                              Kein erkanntes Name gefunden
                                            </div>
                                          );
                                        } else {
                                          // Keine recognizedNames vorhanden
                                          return (
                                            <div className="px-3 py-2" style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                                              Keine erkannten Namen für diesen Lieferanten vorhanden
                                            </div>
                                          );
                                        }
                                      } else {
                                        // Kein supplierId: Zeige alle Lieferanten
                                        return (
                                          <>
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
                                          </>
                                        );
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Belegdatum und Belegnummer */}
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
                            // Setze Suchbegriff auf längstes Wort aus Artikelname (name, nicht nameOCR) für automatische Zuordnung
                            const currentArticle = editedArticles[selectedArticleIndex];
                            const articleName = currentArticle.name || '';
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
                                      // console.log(`✅ MwSt-Satz ${extractedVatRate}% aus Kontonamen "${account.name}" ermittelt`);
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
                                      // console.log(`✅ MwSt-Satz ${extractedVatRate}% aus Kontonamen "${account.name}" ermittelt`);
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
                              {bundleUnitSearchTerm && !getFilteredBundleUnits().some(u => u.toLowerCase() === bundleUnitSearchTerm.toLowerCase()) && (
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
                              {contentUnitSearchTerm && !getFilteredContentUnits().some(u => u.toLowerCase() === contentUnitSearchTerm.toLowerCase()) && (
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
                  className="btn btn-outline-primary"
                  onClick={handleSave}
                >
                  <FaSave className="me-1" />
                  Beleg Speichern
                </button>
              </div>
            </div>
          </div>
          
          {/* Original-Beleg Viewer */}
          <ReceiptImageViewer
            imageUrl={imageUrl || (typeof receiptImage === 'string' ? receiptImage : undefined)}
            receiptImagePath={receiptImagePath}
            receiptImage={receiptImage}
            width={rightPanelWidth}
            onWidthChange={(newWidth) => {
              setRightPanelWidth(newWidth);
              if (onUpdateReceiptDataRef.current) {
                onUpdateReceiptDataRef.current({
                  ...receiptDataRef.current,
                  rightPanelWidth: newWidth
                });
              }
            }}
            showResizeHandle={!!imageUrl}
            taxAccountTotals={taxAccountTotals}
            onShowJson={() => setShowJsonDialog(true)}
            onShowPrintPreview={() => setShowPrintPreview(true)}
            colors={colors}
            showHeader={true}
            showFooter={true}
            showTaxAccountTotals={true}
            initialZoom={receiptData.imageZoom ?? 1}
            initialPosition={receiptData.imagePosition ?? { x: 0, y: 0 }}
            onZoomChange={(zoom) => {
              prevImageZoomRef.current = zoom;
              // Speichere nicht automatisch, nur beim Speichern des Beleges
            }}
            onPositionChange={(position) => {
              prevImagePositionRef.current = position;
              // Speichere nicht automatisch, nur beim Speichern des Beleges
            }}
          />
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
          articles={currentArticles}
          onSelectArticle={async (article) => {
            // Übernehme alle Werte des ausgewählten Artikels
            const currentArticle = editedArticles[selectedArticleIndex];
            const updatedArticles = [...editedArticles];
            
            // Lade Artikel direkt aus storageLayer (konsistent mit anderen Datenquellen wie Artikelformular)
            // Dies stellt sicher, dass wir immer die aktuellsten Daten haben, unabhängig von der Datenquelle
            let articleFromStorage: Article | null = null;
            try {
              const allArticlesFromStorage = await storageLayer.load<Article>('articles');
              articleFromStorage = allArticlesFromStorage?.find(a => a.id === article.id) || null;
            } catch (e) {
              console.error('❌ Fehler beim Laden über storageLayer:', e);
              throw new Error(`Fehler beim Laden des Artikels aus storageLayer: ${e}`);
            }
            
            // Verwende nur Artikel aus storageLayer (kein Fallback)
            if (!articleFromStorage) {
              console.error('❌ Artikel nicht in storageLayer gefunden:', article.id);
              throw new Error(`Artikel mit ID ${article.id} nicht in storageLayer gefunden`);
            }
            
            const articleToUse = articleFromStorage;
            
            // Verwende Einzelpreis aus dem Scan-Bereich (OCR-Daten)
            const scannedPrice = currentArticle.price || currentArticle.bundlePrice || 0;
            const scannedQuantity = currentArticle.quantity || articleToUse.content || 1;
            // Berechne Einzelpreis: Gesamtpreis / Menge
            const scannedPricePerUnit = scannedQuantity > 0 ? scannedPrice / scannedQuantity : scannedPrice;
            
            // Artikelnummer: OCR-Wert verwenden, wenn im Artikelstamm keine vorhanden
            const supplierArticleNumber = currentArticle.supplierArticleNumber || articleToUse.supplierArticleNumber || '';
            
            // Füge OCR-Namen zu namesOCR hinzu, wenn Artikel verknüpft wird
            const currentOCRName = currentArticle.nameOCR || currentArticle.name;
            let updatedNamesOCR = articleToUse.namesOCR || [];
            if (currentOCRName && !updatedNamesOCR.includes(currentOCRName)) {
              updatedNamesOCR = [...updatedNamesOCR, currentOCRName];
              
              // Aktualisiere den Artikel im State und speichere über StorageLayer
              dispatch({
                type: 'UPDATE_ARTICLE',
                payload: {
                  id: articleToUse.id,
                  article: {
                    ...articleToUse,
                    namesOCR: updatedNamesOCR
                  }
                }
              });
              
              // Speichere auch direkt über StorageLayer (wird später beim Speichern übernommen)
              storageLayer.save('articles', [{
                ...articleToUse,
                namesOCR: updatedNamesOCR
              }]).catch(err => console.error('Fehler beim Speichern von namesOCR:', err));
            }
            
            // content aus verlinktem Artikel übernehmen (content ist in articles immer vorhanden)
            // WICHTIG: Bei Verlinkung wird content immer aus dem Artikelstamm übernommen
            // Verwende articleToUse (aus LocalStorage, dann State, dann Modal) für korrekte Werte
            const contentValue = articleToUse.content;
            
            // Steuerkonto übernehmen
            const taxAccountValue = articleToUse.accountingAccountNumber || currentArticle.taxAccount;
            
            // vatRate aus Steuerkonto ermitteln, falls vorhanden
            let vatRateValue = currentArticle.vatRate || 19; // Standard MwSt
            if (taxAccountValue) {
              const account = accountingAccounts.find(acc => acc.number === taxAccountValue);
              if (account) {
                const extractedVatRate = extractVatRateFromAccountName(account.name);
                if (extractedVatRate !== null) {
                  vatRateValue = extractedVatRate;
                }
              }
            }
            
            // Berechne pricePerUnit neu: bundlePrice / content
            const calculatedPricePerUnit = scannedPricePerUnit > 0 && contentValue > 0
              ? scannedPricePerUnit / contentValue
              : 0;
            
            // WICHTIG: content muss NACH ...articleToUse gesetzt werden, damit es nicht überschrieben wird
            updatedArticles[selectedArticleIndex] = {
              // Alle Felder aus dem Artikel übernehmen (aus State, nicht aus Modal)
              ...articleToUse,
              // Artikel-ID für Verknüpfung
              linkedArticleId: articleToUse.id,
              // OCR-Daten beibehalten (Preis, Menge, etc. vom Beleg)
              name: articleToUse.name, // Verwende Namen aus Artikelstamm (wie in enrichReceiptData)
              nameOCR: currentArticle.nameOCR || currentArticle.name, // OCR-Namen beibehalten
              price: scannedPrice, // Gesamtpreis aus Scan-Bereich (für Anzeige)
              bundlePrice: scannedPricePerUnit, // Einzelpreis als Gebindepreis!
              quantity: currentArticle.quantity || articleToUse.content,
              unit: currentArticle.unit || articleToUse.contentUnit,
              ean: currentArticle.ean || articleToUse.bundleEanCode,
              // Artikelnummer: OCR-Wert wenn vorhanden, sonst aus Artikelstamm
              supplierArticleNumber: supplierArticleNumber,
              // Beleg-spezifische Daten beibehalten
              supplierId: receiptSupplierId || articleToUse.supplierId,
              // Felder aus Artikel übernehmen (wie in enrichReceiptData)
              category: articleToUse.category || currentArticle.category || '',
              taxAccount: taxAccountValue,
              bundleUnit: articleToUse.bundleUnit || currentArticle.bundleUnit || 'Stück',
              // WICHTIG: content muss explizit gesetzt werden, damit articleToUse.content verwendet wird
              content: contentValue, // Direkt aus articleToUse (aus State)
              contentUnit: articleToUse.contentUnit || currentArticle.contentUnit || 'Stück',
              bundleEanCode: articleToUse.bundleEanCode || currentArticle.bundleEanCode || '',
              contentEanCode: articleToUse.contentEanCode || currentArticle.contentEanCode || '',
              notes: articleToUse.notes || currentArticle.notes || '',
              vatRate: vatRateValue,
              pricePerUnit: calculatedPricePerUnit
            };
            setEditedArticles(updatedArticles);
            
            // Aktualisiere auch articleForm
            setArticleForm({
              name: articleToUse.name,
              category: articleToUse.category || '',
              supplierId: receiptSupplierId || articleToUse.supplierId || '',
              supplierArticleNumber: supplierArticleNumber,
              bundleUnit: articleToUse.bundleUnit || 'Stück',
              bundlePrice: scannedPricePerUnit, // Einzelpreis!
              bundleEanCode: articleToUse.bundleEanCode || currentArticle.bundleEanCode || '',
              content: contentValue, // Direkt aus articleToUse (aus State)
              contentUnit: articleToUse.contentUnit || 'Stück',
              contentEanCode: articleToUse.contentEanCode || '',
              pricePerUnit: calculatedPricePerUnit,
              allergens: articleToUse.allergens || [],
              additives: articleToUse.additives || [],
              ingredients: articleToUse.ingredients || '',
              nutrition: articleToUse.nutritionInfo ? {
                calories: articleToUse.nutritionInfo.calories || 0,
                kilojoules: articleToUse.nutritionInfo.kilojoules || 0,
                protein: articleToUse.nutritionInfo.protein || 0,
                fat: articleToUse.nutritionInfo.fat || 0,
                carbohydrates: articleToUse.nutritionInfo.carbohydrates || 0,
                fiber: articleToUse.nutritionInfo.fiber ?? 0,
                sugar: articleToUse.nutritionInfo.sugar ?? 0,
                salt: articleToUse.nutritionInfo.salt ?? 0,
                alcohol: articleToUse.nutritionInfo.alcohol
              } : {
                calories: 0, kilojoules: 0, protein: 0, fat: 0, carbohydrates: 0,
                fiber: 0, sugar: 0, salt: 0, alcohol: undefined
              },
              openFoodFactsCode: articleToUse.openFoodFactsCode || '',
              notes: articleToUse.notes || ''
            });
            
            // Aktualisiere Input-Felder
            setBundlePriceInput(scannedPricePerUnit.toFixed(2).replace('.', ','));
            setContentInput(contentValue.toFixed(2).replace('.', ',')); // Priorisiere gescannten, sonst verknüpften, sonst 1
            setPricePerUnitInput(calculatedPricePerUnit.toFixed(2).replace('.', ','));
            
            // Aktualisiere Steuerkonto im Formular, falls vorhanden
            if (taxAccountValue) {
              setSelectedTaxAccount(taxAccountValue);
              setTaxAccountSearchTerm('');
            }
            
            // Aktualisiere MwSt-Satz im Formular, falls ermittelt
            if (vatRateValue !== 19) {
              setReceiptVatRate(vatRateValue);
            }
            
            setShowArticleSearchModal(false);
            // console.log('✅ Artikel übernommen:', article.name, 'ID:', article.id, 'Einzelpreis aus Scan:', scannedPricePerUnit);
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

export {};

