import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FaTimes, FaSave, FaEdit, FaPlus, FaImage, FaEuroSign, FaSearch, FaCheck, FaCalculator, FaCoins, FaExclamationTriangle, FaCopy } from 'react-icons/fa';
import { ExtendedReceiptData, ReceiptArticle } from '../services/ocrTypes';
import { useArticleForm, Supplier } from '../hooks/useArticleForm';
import { Supplier as SupplierType, PhoneType } from '../types';
import { ArticleCategory, Unit, Article } from '../types';
import { categoryManager } from '../utils/categoryManager';
import { VAT_RATES } from '../constants/articleConstants';
import { useAppContext } from '../contexts/AppContext';
import { storageLayer } from '../services/storageLayer';
import { UUIDUtils } from '../utils/uuidUtils';
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
}

const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
  show,
  onClose,
  receiptData,
  suppliers,
  colors,
  onSave,
  onNewSupplier,
  receiptImage
}) => {
  const [selectedArticleIndex, setSelectedArticleIndex] = useState<number>(0);
  const [editedArticles, setEditedArticles] = useState<ReceiptArticle[]>(receiptData.articles);
  const [receiptSupplierId, setReceiptSupplierId] = useState<string>(receiptData.supplierId || '');
  const [receiptSupplierSearchTerm, setReceiptSupplierSearchTerm] = useState<string>('');
  const [scannedSupplierName, setScannedSupplierName] = useState<string>(receiptData.supplier || '');
  const [hideScannedSupplierName, setHideScannedSupplierName] = useState<boolean>(false);
  const [showArticleSearchModal, setShowArticleSearchModal] = useState<boolean>(false);
  const [articleSearchTerm, setArticleSearchTerm] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(receiptData.date || '');
  const [receiptNumber, setReceiptNumber] = useState<string>(receiptData.receiptNumber || '');
  
  // Bildansicht States
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  
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
  const previousQuantityRef = useRef<number>(1);
  const previousLinkedArticleIdRef = useRef<string | undefined>(undefined);
  const isLinkingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    showVatRateDropdown,
    selectedVatRateIndex,
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
    setShowVatRateDropdown,
    setSelectedVatRateIndex,
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
    handleVatRateChange,
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
            vatRate: linkedArticle.vatRate !== undefined ? linkedArticle.vatRate : (selectedArticle.vatRate || 19),
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
            contentUnit: linkedArticle.contentUnit,
            vatRate: linkedArticle.vatRate
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
      
      // Nur aktualisieren, wenn sich Daten tatsächlich unterscheiden
      const formChanged = JSON.stringify(articleForm) !== JSON.stringify(newFormData);
      if (formChanged) {
        setArticleForm(newFormData);
      }
      
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
  const applyVatRateToAllArticles = () => {
    const currentVatRate = articleForm.vatRate || 19;
    const updatedArticles = editedArticles.map(article => ({
      ...article,
      vatRate: currentVatRate
    }));
    setEditedArticles(updatedArticles);
    console.log(`✅ MwSt-Satz ${currentVatRate}% auf alle ${updatedArticles.length} Artikel angewendet`);
  };

  // Handler für Lieferanten-Auswahl für alle Artikel
  const handleReceiptSupplierSelect = (supplier: Supplier | null) => {
    if (supplier) {
      setReceiptSupplierId(supplier.id);
      setReceiptSupplierSearchTerm(supplier.name);
      
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

  // Reset aller States beim Schließen des Modals
  useEffect(() => {
    if (!show) {
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
        vatRate: 19,
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
        supplierId: receiptSupplierId // Immer die receiptSupplierId verwenden
      };
      
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
            vatRate: linkedArticle.vatRate !== undefined ? linkedArticle.vatRate : (article.vatRate || 19),
            // Behalte Preise aus dem Scan (können sich geändert haben)
            bundlePrice: article.bundlePrice || linkedArticle.bundlePrice || 0,
            pricePerUnit: article.pricePerUnit || linkedArticle.pricePerUnit || 0,
            content: linkedArticle.content || article.content || 1,
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
            vatRate: linkedArticle.vatRate !== undefined ? linkedArticle.vatRate : (article.vatRate || 19),
            // Behalte Preise aus dem Scan (können sich geändert haben)
            bundlePrice: article.bundlePrice || linkedArticle.bundlePrice || 0,
            pricePerUnit: article.pricePerUnit || linkedArticle.pricePerUnit || 0,
            content: linkedArticle.content || article.content || 1,
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
  };

  // Initialisiere editedArticles beim Öffnen und finde passenden Lieferanten
  useEffect(() => {
    if (show) {
      console.log('🚀 [INIT] Initialisiere ReceiptReviewModal mit', receiptData.articles.length, 'Artikeln');
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
        vatRate: 19,
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
        // Prüfe zuerst auf exakte Übereinstimmung
        const exactMatch = suppliers.find(s => 
          s.name.toLowerCase() === receiptData.supplier!.toLowerCase()
        );
        
        if (exactMatch) {
          console.log('✅ [INIT] Exakter Lieferant gefunden:', exactMatch.name);
          setReceiptSupplierId(exactMatch.id);
          setReceiptSupplierSearchTerm(exactMatch.name);
          
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
          setTimeout(() => {
            console.log('🔍 [INIT] Starte automatische Verknüpfung für alle Artikel...');
            autoLinkAllArticles(updatedArticles, exactMatch.id);
          }, 100);
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
              const matches = suppliers.filter(s => 
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
            setTimeout(() => {
              console.log('🔍 [INIT] Starte automatische Verknüpfung für alle Artikel...');
              autoLinkAllArticles(updatedArticles, matchingSupplier.id);
            }, 100);
          } else {
            // Kein Lieferant gefunden - setze auf "Kein Lieferant ausgewählt!"
            setReceiptSupplierId('');
            setReceiptSupplierSearchTerm('');
          }
        }
      } else if (receiptData.supplierId) {
        setReceiptSupplierId(receiptData.supplierId);
        const supplier = suppliers.find(s => s.id === receiptData.supplierId);
        if (supplier) {
          setReceiptSupplierSearchTerm(supplier.name);
          setScannedSupplierName(supplier.name); // Kein Unterschied bei exakter ID-Übereinstimmung
        } else {
          // Lieferant-ID existiert nicht mehr - setze auf "Kein Lieferant ausgewählt!"
          setReceiptSupplierId('');
          setReceiptSupplierSearchTerm('');
        }
      } else {
        // Kein Lieferant erkannt - setze auf "Kein Lieferant ausgewählt!"
        setReceiptSupplierId('');
        setReceiptSupplierSearchTerm('');
      }
    }
  }, [show, receiptData.articles, receiptData.supplier, receiptData.supplierId, suppliers]);

  // Aktualisiere Scan-Daten wenn sich receiptData ändert
  useEffect(() => {
    if (show && receiptData) {
      setScanTotals({
        totalAmount: receiptData.totalAmount || 0,
        vat7: receiptData.vat7 || 0,
        vat19: receiptData.vat19 || 0
      });
    }
  }, [show, receiptData]);

  // Lade Bild-URL wenn receiptImage vorhanden
  useEffect(() => {
    console.log('🖼️ [IMAGE] receiptImage geändert:', receiptImage);
    if (receiptImage) {
      if (typeof receiptImage === 'string') {
        // Bereits eine URL
        console.log('🖼️ [IMAGE] Verwende URL:', receiptImage);
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
    } else {
      console.log('🖼️ [IMAGE] Kein Bild vorhanden');
      setImageUrl('');
    }
  }, [receiptImage]);

  // Berechne aktualisierte Beleg-Metadaten
  const calculateReceiptTotals = () => {
    const totalArticles = editedArticles.length;
    
    // Berechne Gesamtpreis: Menge × Gebindepreis (oder Preis falls vorhanden)
    const totalAmount = editedArticles.reduce((sum, article) => {
      const quantity = article.quantity || 1;
      const price = article.price || (article.bundlePrice ? article.bundlePrice * quantity : 0);
      return sum + price;
    }, 0);
    
    const vat19 = editedArticles.reduce((sum, article) => {
      const vatRate = article.vatRate || 19;
      if (vatRate === 19) {
        const quantity = article.quantity || 1;
        const grossPrice = article.price || (article.bundlePrice ? article.bundlePrice * quantity : 0);
        const netPrice = grossPrice / 1.19;
        return sum + (grossPrice - netPrice);
      }
      return sum;
    }, 0);
    
    const vat7 = editedArticles.reduce((sum, article) => {
      const vatRate = article.vatRate || 19;
      if (vatRate === 7) {
        const quantity = article.quantity || 1;
        const grossPrice = article.price || (article.bundlePrice ? article.bundlePrice * quantity : 0);
        const netPrice = grossPrice / 1.07;
        return sum + (grossPrice - netPrice);
      }
      return sum;
    }, 0);

    return { totalArticles, totalAmount, vat7, vat19 };
  };
  
  // Berechnete Werte (aktualisiert sich automatisch bei Änderungen)
  const calculatedTotals = useMemo(() => {
    return calculateReceiptTotals();
  }, [editedArticles]);
  
  // Prüfe, ob Werte sich von Scan-Daten unterscheiden
  const isDifferentFromScan = (field: 'totalAmount' | 'vat7' | 'vat19'): boolean => {
    const calculated = calculatedTotals[field];
    const scanned = scanTotals[field];
    return Math.abs(calculated - scanned) > 0.01; // Toleranz für Rundungsfehler
  };

  // Berechne Anzahl der vollständigen Artikel (aktualisiert sich automatisch)
  const completeArticlesCount = useMemo(() => {
    return editedArticles.filter(article => 
      isArticleComplete(article)
    ).length;
  }, [editedArticles, receiptSupplierId, receiptSupplierSearchTerm]);

  const handleSave = async () => {
    try {
      // Filtere nur vollständige Artikel
      const completeArticles = editedArticles.filter(article => 
        isArticleComplete(article)
      );

      if (completeArticles.length === 0) {
        alert('Keine vollständigen Artikel zum Übernehmen gefunden.');
        return;
      }

      console.log(`💾 Übernehme ${completeArticles.length} vollständige Artikel...`);

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
            
            const updatedArticle: Article = {
              ...existingArticle,
              name: receiptArticle.name || existingArticle.name,
              namesOCR: updatedNamesOCR, // Füge OCR-Namen hinzu
              category: (receiptArticle.category || existingArticle.category) as ArticleCategory,
              supplierId: receiptSupplierId || existingArticle.supplierId,
              supplierArticleNumber: receiptArticle.supplierArticleNumber || existingArticle.supplierArticleNumber,
              bundleUnit: (receiptArticle.bundleUnit || existingArticle.bundleUnit) as Unit,
              bundlePrice: receiptArticle.bundlePrice || existingArticle.bundlePrice,
              bundleEanCode: receiptArticle.bundleEanCode || existingArticle.bundleEanCode,
              content: receiptArticle.content || existingArticle.content,
              contentUnit: (receiptArticle.contentUnit || existingArticle.contentUnit) as Unit,
              contentEanCode: receiptArticle.contentEanCode || existingArticle.contentEanCode,
              pricePerUnit: receiptArticle.pricePerUnit || existingArticle.pricePerUnit,
              vatRate: receiptArticle.vatRate !== undefined ? receiptArticle.vatRate : existingArticle.vatRate,
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
            const newArticle: Article = {
              id: UUIDUtils.generateId(),
              name: receiptArticle.name || '',
              namesOCR: receiptArticle.nameOCR ? [receiptArticle.nameOCR] : [], // Initialisiere mit OCR-Namen
              category: (receiptArticle.category || '') as ArticleCategory,
              supplierId: receiptSupplierId || '',
              supplierArticleNumber: receiptArticle.supplierArticleNumber || '',
              bundleUnit: (receiptArticle.bundleUnit || '') as Unit,
              bundlePrice: receiptArticle.bundlePrice || 0,
              bundleEanCode: receiptArticle.bundleEanCode || '',
              content: receiptArticle.content || 0,
              contentUnit: (receiptArticle.contentUnit || '') as Unit,
              contentEanCode: receiptArticle.contentEanCode || '',
              pricePerUnit: receiptArticle.pricePerUnit || 0,
              vatRate: receiptArticle.vatRate || 19,
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
          const newArticle: Article = {
            id: UUIDUtils.generateId(),
            name: receiptArticle.name || '',
            namesOCR: receiptArticle.nameOCR ? [receiptArticle.nameOCR] : [], // Initialisiere mit OCR-Namen
            category: (receiptArticle.category || '') as ArticleCategory,
            supplierId: receiptSupplierId || '',
            supplierArticleNumber: receiptArticle.supplierArticleNumber || '',
            bundleUnit: (receiptArticle.bundleUnit || '') as Unit,
            bundlePrice: receiptArticle.bundlePrice || 0,
            bundleEanCode: receiptArticle.bundleEanCode || '',
            content: receiptArticle.content || 0,
            contentUnit: (receiptArticle.contentUnit || '') as Unit,
            contentEanCode: receiptArticle.contentEanCode || '',
            pricePerUnit: receiptArticle.pricePerUnit || 0,
            vatRate: receiptArticle.vatRate || 19,
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

      // Callback aufrufen falls vorhanden
      if (onSave) {
        onSave(completeArticles);
      }

      console.log(`✅ Erfolgreich ${articlesToSave.length} neue und ${articlesToUpdate.length} aktualisierte Artikel übernommen.`);
      
      onClose();
    } catch (error: any) {
      console.error('❌ Fehler beim Übernehmen der Artikel:', error);
      alert(`Fehler beim Übernehmen der Artikel: ${error.message}`);
    }
  };

  // Handler für Bild-Zoom und Drag
  const handleImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(5, imageZoom + delta));
    setImageZoom(newZoom);
  };

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

  // Reset Zoom und Position beim Öffnen
  useEffect(() => {
    if (show) {
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [show]);

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
          {/* Linke Seite: Artikel-Liste */}
          <div 
            className="card"
            style={{
              width: '300px',
              backgroundColor: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              marginRight: '1rem',
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
              </div>
              {/* Lieferant • Belegdatum - Fix im Header */}
              <div 
                className="pt-2"
                style={{ borderTop: `1px solid var(--theme-card-border)` }}
              >
                <div style={{ fontSize: '0.9rem', color: colors.text }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {receiptData.supplier || 'Nicht erkannt'}
                  </span>
                  {receiptData.supplier && (receiptData.date || receiptDate) && ' • '}
                  <span style={{ fontWeight: 'bold' }}>
                    {formatDate(receiptDate || receiptData.date)}
                  </span>
                  {receiptNumber && (
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
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
              <div className="mb-3">
                {editedArticles.map((article, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedArticleIndex(index)}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: selectedArticleIndex === index ? (colors.accent || colors.primary) + '20' : colors.light,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedArticleIndex !== index) {
                        e.currentTarget.style.backgroundColor = colors.secondary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedArticleIndex !== index) {
                        e.currentTarget.style.backgroundColor = colors.light;
                      }
                    }}
                  >
                    {/* Zeile 1: Artikelbezeichnung mit Verknüpfungs-Status */}
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: colors.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {article.name || 'Unbenannt'}
                      {article.linkedArticleId && (
                        <FaCheck style={{ color: '#28a745', fontSize: '0.9rem' }} title="Mit Artikelstamm verknüpft" />
                      )}
                      {isArticleComplete(article) && !article.linkedArticleId && (
                        <FaExclamationTriangle style={{ color: colors.accent || '#ffc107', fontSize: '0.9rem' }} title="Vollständig - wird als neuer Artikel angelegt" />
                      )}
                    </div>
                    
                    {/* Zeile 2: Menge x Gebindeeinheit à Einzelpreis = Gesamtpreis MwSt-Rate */}
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem', color: colors.textSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        {article.quantity || 1} × 1 {article.bundleUnit || 'Stück'} à {formatPrice(article.bundlePrice || 0)} = <strong>{formatPrice(article.price || 0)}</strong>
                      </span>
                      <span style={{ fontWeight: 'bold', color: colors.text }}>
                        {(() => {
                          // Mappe MwSt-Satz auf Rate: 19% = 1, 7% = 2
                          const vatRate = article.vatRate || 19;
                          return vatRate === 7 ? '2' : '1';
                        })()}
                      </span>
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
                <div className="d-flex justify-content-between">
                  <span style={{ color: colors.textSecondary }}>Anzahl Einzelposten:</span>
                  <strong style={{ color: colors.text }}>{calculatedTotals.totalArticles}</strong>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span style={{ color: colors.textSecondary }}>Gesamtsumme:</span>
                  <strong 
                    style={{ 
                      color: colors.text,
                      backgroundColor: isDifferentFromScan('totalAmount') ? (colors.accent || '#ffc107') + '40' : 'transparent',
                      padding: isDifferentFromScan('totalAmount') ? '0.125rem 0.25rem' : '0',
                      borderRadius: isDifferentFromScan('totalAmount') ? '0.25rem' : '0'
                    }}
                    title={isDifferentFromScan('totalAmount') ? `Scan: ${formatPrice(scanTotals.totalAmount)}` : ''}
                  >
                    {formatPrice(calculatedTotals.totalAmount)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span style={{ color: colors.textSecondary }}>2 USt 7%:</span>
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
                  <span style={{ color: colors.textSecondary }}>1 USt 19%:</span>
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
              </div>
            </div>
          </div>

          {/* Rechte Seite: Artikelformular */}
          <div 
            className="card flex-grow-1"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              height: '90vh'
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
                        type="number"
                        className="form-control form-control-themed text-center"
                        value={editedArticles[selectedArticleIndex]?.quantity || 1}
                        onInput={(e) => {
                          // Erkenne Stepper-Pfeile: Vergleiche mit vorherigem Wert
                          const input = e.target as HTMLInputElement;
                          const newValue = parseFloat(input.value);
                          const previousValue = previousQuantityRef.current;
                          
                          if (!isNaN(newValue)) {
                            // Wenn die Änderung genau 0.01 oder sehr klein ist (Stepper-Pfeil mit altem step),
                            // oder wenn der Wert sich um genau 1 geändert hat (Stepper-Pfeil mit step="1"),
                            // aber der neue Wert keine ganze Zahl ist, dann runden wir auf ganze Zahlen
                            const diff = Math.abs(newValue - previousValue);
                            
                            // Stepper-Pfeil erkannt: wenn die Änderung sehr klein ist (0.01) ODER
                            // wenn der neue Wert keine ganze Zahl ist und sich um ~1 geändert hat
                            if ((diff > 0 && diff < 0.1) || (diff >= 0.9 && diff <= 1.1 && newValue % 1 !== 0)) {
                              const roundedValue = Math.round(newValue);
                              input.value = roundedValue.toString();
                              const updatedArticles = [...editedArticles];
                              updatedArticles[selectedArticleIndex] = {
                                ...updatedArticles[selectedArticleIndex],
                                quantity: roundedValue
                              };
                              setEditedArticles(updatedArticles);
                              
                              // Berechne Gesamtpreis neu
                              const currentArticle = updatedArticles[selectedArticleIndex];
                              if (currentArticle.bundlePrice) {
                                const newPrice = currentArticle.bundlePrice * roundedValue;
                                updatedArticles[selectedArticleIndex] = {
                                  ...currentArticle,
                                  price: newPrice
                                };
                                setEditedArticles(updatedArticles);
                              }
                              previousQuantityRef.current = roundedValue;
                            } else {
                              previousQuantityRef.current = newValue;
                            }
                          }
                        }}
                        onChange={(e) => {
                          const newQuantity = parseFloat(e.target.value) || 1;
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
                        min="0.01"
                        step="1"
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
                                  required
                                />
                        <button
                          type="button"
                          className="btn btn-outline-input"
                          title="Artikel aus Bestand übernehmen"
                          onClick={() => {
                            // Setze Suchbegriff auf OCR-Namen für automatische Zuordnung
                            const currentArticle = editedArticles[selectedArticleIndex];
                            const searchTerm = currentArticle.nameOCR || currentArticle.name || '';
                            setArticleSearchTerm(searchTerm);
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
                          onFocus={() => setShowCategoryDropdown(true)}
                          onBlur={handleCategoryInputBlur}
                          onKeyDown={handleCategoryKeyDown}
                          placeholder="Kategorie auswählen oder eingeben..."
                        />
                        {showCategoryDropdown && (
                          <div className="absolute w-full" style={{
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
                        Lieferanten-Artikelnummer
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={articleForm.supplierArticleNumber}
                        onChange={(e) => setArticleForm(prev => ({ ...prev, supplierArticleNumber: e.target.value }))}
                      />
                    </div>
                    <div className="md:w-1/6 px-2 mb-3">
                      <label className="form-label text-center block">
                        MwSt-Satz
                      </label>
                      <div className="relative">
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control form-control-themed text-center"
                            value={`${articleForm.vatRate}%`}
                            onClick={() => setShowVatRateDropdown(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setShowVatRateDropdown(!showVatRateDropdown);
                              }
                            }}
                            readOnly
                            style={{ cursor: 'pointer' }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            title="MwSt-Satz auf alle Artikel anwenden"
                            onClick={applyVatRateToAllArticles}
                          >
                            <FaCopy />
                          </button>
                        </div>
                        {showVatRateDropdown && (
                          <div className="absolute" style={{
                            top: '100%',
                            right: 0,
                            width: '200px',
                            zIndex: 1000,
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.cardBorder}`,
                            borderRadius: '0 0 0.375rem 0.375rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}>
                            {VAT_RATES.map((vatRate, index) => (
                              <div
                                key={vatRate.value}
                                className="px-3 py-2 cursor-pointer flex justify-between items-center"
                                onClick={() => {
                                  handleVatRateChange(vatRate.value);
                                  setShowVatRateDropdown(false);
                                }}
                                style={{
                                  color: colors.text,
                                  borderBottom: index < VAT_RATES.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                                  cursor: 'pointer',
                                  backgroundColor: selectedVatRateIndex === index ? (colors.accent || colors.primary) + '20' : 'transparent',
                                  minHeight: '38px'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedVatRateIndex !== index) {
                                    e.currentTarget.style.backgroundColor = (colors.accent || colors.primary) + '10';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedVatRateIndex !== index) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <span>{vatRate.label}</span>
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
                            type="text"
                            className={`form-control form-control-themed ${isFieldInvalid('bundleUnit', articleForm.bundleUnit) ? 'is-invalid' : ''}`}
                            value={articleForm.bundleUnit}
                            onChange={(e) => handleBundleUnitInputChange(e.target.value)}
                            onFocus={() => setShowBundleUnitDropdown(true)}
                            onBlur={handleBundleUnitInputBlur}
                            onKeyDown={handleBundleUnitKeyDown}
                            placeholder="Einheit..."
                          />
                          {showBundleUnitDropdown && bundleUnitContainerRef.current && (() => {
                            const rect = bundleUnitContainerRef.current.getBoundingClientRect();
                            return (
                              <div className="bundle-unit-dropdown" style={{
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
                              }}>
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
                            onFocus={() => setShowContentUnitDropdown(true)}
                            onBlur={handleContentUnitInputBlur}
                            onKeyDown={handleContentUnitKeyDown}
                            placeholder="Einheit..."
                          />
                          {showContentUnitDropdown && contentUnitContainerRef.current && (() => {
                            const rect = contentUnitContainerRef.current.getBoundingClientRect();
                            return (
                              <div className="content-unit-dropdown" style={{
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
                              }}>
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
                          style={{ zIndex: 1002, position: 'relative' }}
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
            <div className="card-footer d-flex justify-content-between">
              <button
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                <FaTimes className="me-1" />
                Abbrechen
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={handleSave}
                disabled={completeArticlesCount === 0}
              >
                <FaSave className="me-1" />
                {completeArticlesCount > 0 
                  ? `${completeArticlesCount} Artikel übernehmen`
                  : 'Keine vollständigen Artikel'
                }
              </button>
            </div>
          </div>
          
          {/* Rechte Seite: Bildansicht */}
          {imageUrl && (
            <div 
              className="card"
              style={{
                width: '400px',
                backgroundColor: colors.card,
                border: `1px solid ${colors.cardBorder}`,
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '1rem',
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

              {/* Bildansicht */}
              <div 
                className="card-body"
                style={{
                  overflow: 'hidden',
                  flex: 1,
                  padding: '0.75rem',
                  position: 'relative',
                  backgroundColor: '#f5f5f5',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onWheel={handleImageWheel}
                onMouseDown={handleImageMouseDown}
              >
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
                      console.error('🖼️ [IMAGE] Fehler beim Laden des Bildes:', imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('🖼️ [IMAGE] Bild erfolgreich geladen:', imageUrl);
                    }}
                  />
                </div>
              </div>

              {/* Footer mit Zoom-Anzeige */}
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
                  <span>Zoom: {Math.round(imageZoom * 100)}%</span>
                  <span>Zum Vergrößern/Verkleinern: Mausrad</span>
                </div>
                <div className="mt-1" style={{ fontSize: '0.75rem' }}>
                  <span>Zum Verschieben: Linke Maustaste gedrückt halten</span>
                </div>
              </div>
            </div>
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
              vatRate: article.vatRate || 19,
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
        vatRate={selectedVatRate || articleForm.vatRate || 19}
        onApplyGrossPrice={(grossPrice: number) => {
          setArticleForm(prev => {
            const newPricePerUnit = calculatePricePerUnit(grossPrice, prev.content);
            setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
            return { 
              ...prev, 
              bundlePrice: grossPrice,
              vatRate: selectedVatRate || prev.vatRate,
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
              vatRate: selectedVatRate || prev.vatRate,
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

  // Setze initialen Suchbegriff nur beim Öffnen des Modals
  useEffect(() => {
    if (show) {
      setLocalSearchTerm(searchTerm || '');
    } else {
      // Reset beim Schließen
      setLocalSearchTerm('');
    }
  }, [show]); // Nur bei show-Änderung, nicht bei searchTerm

  // Filtere Artikel nach Lieferant und Suchbegriff
  useEffect(() => {
    if (!show) return;

    let filtered = articles.filter(article => 
      article.supplierId === supplierId
    );

    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase();
      filtered = filtered.filter(article => 
        article.name?.toLowerCase().includes(searchLower) ||
        // Suche auch in namesOCR Array
        article.namesOCR?.some((ocrName: string) => ocrName.toLowerCase().includes(searchLower)) ||
        article.supplierArticleNumber?.toLowerCase().includes(searchLower) ||
        article.bundleEanCode?.toLowerCase().includes(searchLower) ||
        article.category?.toLowerCase().includes(searchLower)
      );
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
          maxHeight: '90vh',
          backgroundColor: colors.card,
          border: `1px solid ${colors.cardBorder}`
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
                      backgroundColor: colors.light,
                      border: `1px solid ${colors.cardBorder}`,
                      transition: 'all 0.2s'
                    }}
                    onClick={() => onSelectArticle(article)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.secondary;
                      e.currentTarget.style.borderColor = colors.accent || colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.light;
                      e.currentTarget.style.borderColor = colors.cardBorder;
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

