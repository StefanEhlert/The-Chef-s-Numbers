import React, { useEffect, useState, useRef } from 'react';
import { 
  FaTimes, 
  FaSave, 
  FaCalculator, 
  FaEuroSign, 
  FaCheck, 
  FaArrowLeft,
  FaTimes as FaClose,
  FaPlus,
  FaSearch,
  FaImage,
  FaUpload,
  FaTrash,
  FaSpinner,
  FaPercentage,
  FaCoins,
  FaCamera
} from 'react-icons/fa';
import { useArticleForm, Supplier } from '../hooks/useArticleForm';
import { useAppContext } from '../contexts/AppContext';
import { suggestCategory } from '../utils/helpers';
import { UUIDUtils } from '../utils/uuidUtils';
import { categoryManager } from '../utils/categoryManager';
import { validateEANCode, formatEANCode } from '../utils/eanValidator';
import NutritionSearch from './NutritionSearch';
import { searchByEANCode } from '../services/nutritionAPI';
import Calculator from './Calculator';
import DuplicateArticleModal from './ui/DuplicateArticleModal';
import BarcodeScanner from './BarcodeScanner';
import { NutritionData, ExtendedProductData } from '../services/nutritionAPI';
import { storageLayer } from '../services/storageLayer';
import { Article, ArticleCategory, Unit } from '../types';

interface ArtikelformularProps {
  show: boolean;
  onClose: () => void;
  colors: any;
  suppliers: Supplier[];
  articles: Article[];
  onReset: () => void;
  onNewSupplier?: (supplierName: string) => void;
}

const Artikelformular: React.FC<ArtikelformularProps> = ({
  show,
  onClose,
  colors,
  suppliers,
  articles,
  onReset,
  onNewSupplier
}) => {
  const { state, dispatch } = useAppContext();
  const [showNutritionSearch, setShowNutritionSearch] = useState(false);
  const [isFromRecipeForm, setIsFromRecipeForm] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [existingArticle, setExistingArticle] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [articleImage, setArticleImage] = useState<string | null>(null);
  const [eanSearchResult, setEanSearchResult] = useState<any>(null);
  const [isSearchingEAN, setIsSearchingEAN] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState<'bundle' | 'content'>('bundle');
  const [formWidth, setFormWidth] = useState<number | null>(null); // null = responsive, number = feste Breite in %
  const [isResizing, setIsResizing] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true); // Verhindert Transition beim ersten Öffnen
  const [currentArticleIdInModal, setCurrentArticleIdInModal] = useState<string | null>(null); // Artikel-ID für Bild-Modal
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null); // Ausgewähltes Bild, das beim Schließen gespeichert werden soll
  const [imageNeedsDeletion, setImageNeedsDeletion] = useState(false); // Flag: Bild soll beim Schließen gelöscht werden

  // Lade gespeicherte Breite
  const loadSavedWidth = (): number => {
    try {
      // Lade aus neuer zentraler Struktur
      const localOptionsStr = localStorage.getItem('localOptions');
      if (localOptionsStr) {
        const localOptions = JSON.parse(localOptionsStr);
        if (localOptions?.formWidth?.articleFormWidth) {
          const width = parseFloat(localOptions.formWidth.articleFormWidth);
          if (!isNaN(width) && width >= 40 && width <= 90) {
            return width;
          }
        }
      }
      
      // Migration: Prüfe alten Key (kann später entfernt werden)
      const oldKey = localStorage.getItem('articleFormWidth');
      if (oldKey) {
        const width = parseFloat(oldKey);
        if (!isNaN(width) && width >= 40 && width <= 90) {
          // Migriere zu neuer Struktur
          saveWidth(width);
          // Lösche alten Key
          localStorage.removeItem('articleFormWidth');
          return width;
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Breite:', error);
    }
    return 60; // Fallback auf Standardbreite
  };

  // Speichere Breite
  const saveWidth = (width: number) => {
    try {
      // Lade bestehende localOptions
      const localOptionsStr = localStorage.getItem('localOptions');
      let localOptions: any = {};
      
      if (localOptionsStr) {
        try {
          localOptions = JSON.parse(localOptionsStr);
        } catch (e) {
          // Falls Parsing fehlschlägt, starte mit leerem Objekt
          localOptions = {};
        }
      }
      
      // Stelle sicher, dass formWidth-Objekt existiert
      if (!localOptions.formWidth) {
        localOptions.formWidth = {};
      }
      
      // Speichere Breite
      localOptions.formWidth.articleFormWidth = width.toString();
      
      // Speichere zurück
      localStorage.setItem('localOptions', JSON.stringify(localOptions));
    } catch (error) {
      console.error('Fehler beim Speichern der Breite:', error);
    }
  };
  
  const articleNameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(60);
  const bundleUnitContainerRef = useRef<HTMLDivElement>(null);
  const contentUnitContainerRef = useRef<HTMLDivElement>(null);
  const accountingAccountContainerRef = useRef<HTMLDivElement>(null);
  
  // Hilfsfunktion: Gibt die aktuelle Artikel-ID zurück (oder generiert eine temporäre)
  const getCurrentArticleId = (): string => {
    // Wenn wir einen Artikel bearbeiten, verwende dessen ID
    if (state.editingArticle?.id) {
      return state.editingArticle.id;
    }
    // Wenn editingArticle aus dem Hook vorhanden ist, verwende dessen ID
    if (editingArticle?.id) {
      return editingArticle.id;
    }
    // Sonst generiere eine temporäre ID (wird beim Speichern des Artikels verwendet)
    if (!currentArticleIdInModal) {
      const tempId = UUIDUtils.generateId();
      setCurrentArticleIdInModal(tempId);
      return tempId;
    }
    return currentArticleIdInModal;
  };

  // Bild-Upload-Funktion für Artikel - zeigt nur Vorschau, speichert beim Schließen
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine gültige Bilddatei aus.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB Limit
      alert('Die Bilddatei ist zu groß. Maximum: 10MB');
      return;
    }

    try {
      // Stelle sicher, dass die temporäre ID gespeichert ist
      const articleId = getCurrentArticleId();
      if (!currentArticleIdInModal) {
        setCurrentArticleIdInModal(articleId);
      }
      
      // Speichere File für späteres Speichern beim Schließen
      setPendingImageFile(file);
      setImageNeedsDeletion(false); // Neues Bild wird gespeichert, nicht gelöscht
      
      // Zeige Base64-Vorschau
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setArticleImage(imageData);
        console.log('✅ Artikelbild-Vorschau geladen (wird beim Schließen gespeichert)');
      };
      reader.onerror = () => {
        alert('Fehler beim Laden der Bilddatei');
        setPendingImageFile(null);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('❌ Fehler beim Laden des Bildes:', error);
      alert('Fehler beim Laden des Bildes');
      setPendingImageFile(null);
    }
  };

  // Bild löschen - markiert zum Löschen beim Schließen
  const handleRemoveImage = () => {
    // Entferne Bild aus der Anzeige
    setArticleImage(null);
    setPendingImageFile(null);
    setImageNeedsDeletion(true); // Markiere zum Löschen beim Schließen
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('🗑️ Artikelbild zum Löschen markiert (wird beim Schließen gelöscht)');
  };

  // Barcode-Scanner Handler
  const handleBarcodeDetected = (code: string) => {
    console.log('📷 EAN-Code gescannt:', code);
    
    if (scannerTargetField === 'bundle') {
      setArticleForm(prev => ({ ...prev, bundleEanCode: code }));
    } else {
      setArticleForm(prev => ({ ...prev, contentEanCode: code }));
    }
    
    setShowBarcodeScanner(false);
    
    // Automatische Validierung und Suche
    const validation = validateEANCode(code);
    if (validation.isValid && validation.normalizedCode) {
      if (scannerTargetField === 'bundle') {
        setArticleForm(prev => ({ ...prev, bundleEanCode: validation.normalizedCode }));
      } else {
        setArticleForm(prev => ({ ...prev, contentEanCode: validation.normalizedCode }));
      }
      searchEANCode(validation.normalizedCode);
    }
  };

  // Lade gespeichertes Bild beim Öffnen des Modals
  const openImageModal = async () => {
    console.log('🖼️ Öffne Artikel-Bild-Modal');
    
    // Reset States beim Öffnen (aber NICHT articleImage - bleibt im State)
    setPendingImageFile(null);
    setImageNeedsDeletion(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Setze aktuelle Artikel-ID für das Modal
    const articleId = getCurrentArticleId();
    setCurrentArticleIdInModal(articleId);
    
    // Prüfe zuerst, ob bereits ein Bild im State ist (z.B. nach kürzlichem Speichern)
    if (articleImage) {
      console.log('📷 Verwende Bild aus State (wurde kürzlich gespeichert)');
      setIsImageLoading(false);
      setShowImageModal(true);
      return;
    }
    
    // Nur wenn kein Bild im State ist, lade vom Storage
    setIsImageLoading(true);
    try {
      const imagePath = `pictures/articles/${articleId}`;
      const imageData = await storageLayer.loadImage(imagePath);
      if (imageData && imageData.url) {
        setArticleImage(imageData.url);
        console.log('📷 Gespeichertes Artikelbild vom Storage geladen');
      } else {
        setArticleImage(null);
        console.log('📷 Kein gespeichertes Artikelbild gefunden');
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Artikelbildes:', error);
      setArticleImage(null);
    } finally {
      setIsImageLoading(false);
    }
    
    setShowImageModal(true);
  };

  // Modal schließen - speichert oder löscht Bild je nach Aktion
  const closeImageModal = async () => {
    const articleId = getCurrentArticleId();
    
    try {
      // Wenn ein neues Bild hochgeladen wurde, speichere es
      if (pendingImageFile && articleId) {
        setIsImageSaving(true);
        const imagePath = `pictures/articles/${articleId}`;
        console.log('📤 Speichere Artikelbild beim Schließen...', { articleId, imagePath });
        
        const success = await storageLayer.saveImage(imagePath, pendingImageFile);
        if (success) {
          console.log('✅ Artikelbild erfolgreich gespeichert');
          // WICHTIG: articleImage bleibt im State (Base64-Vorschau), damit es beim erneuten Öffnen sofort angezeigt wird
          // Das Bild wird im Hintergrund zu Supabase hochgeladen, aber der State zeigt sofort die Vorschau
        } else {
          console.error('❌ Fehler beim Speichern des Bildes');
          alert('Fehler beim Speichern des Bildes. Bitte versuchen Sie es erneut.');
          // Bei Fehler: State zurücksetzen
          setArticleImage(null);
        }
        setIsImageSaving(false);
      }
      
      // Wenn Bild gelöscht werden soll
      if (imageNeedsDeletion && articleId) {
        setIsImageSaving(true);
        const imagePath = `pictures/articles/${articleId}`;
        console.log('🗑️ Lösche Artikelbild beim Schließen...', { articleId, imagePath });
        
        await storageLayer.deleteImage(imagePath);
        console.log('✅ Artikelbild erfolgreich gelöscht');
        // State zurücksetzen, da Bild gelöscht wurde
        setArticleImage(null);
        setIsImageSaving(false);
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern/Löschen des Bildes:', error);
      setIsImageSaving(false);
      // Bei Fehler: State zurücksetzen
      if (imageNeedsDeletion) {
        setArticleImage(null);
      }
    } finally {
      // Reset States (aber NICHT articleImage - bleibt für sofortige Anzeige beim erneuten Öffnen)
      setPendingImageFile(null);
      setImageNeedsDeletion(false);
      setShowImageModal(false);
      console.log('🖼️ Artikel-Bild-Modal geschlossen (Bild bleibt im State für schnelle Anzeige)');
    }
  };



  // ESC-Taste zum Schließen des NutritionSearch-Modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showNutritionSearch) {
        setShowNutritionSearch(false);
      }
    };

    if (showNutritionSearch) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNutritionSearch]);

  // EAN-Code-Suche bei Open Food Facts
  const searchEANCode = async (eanCode: string) => {
    if (!eanCode) return;
    
    setIsSearchingEAN(true);
    try {
      const result = await searchByEANCode(eanCode);
      if (result) {
        setEanSearchResult(result);
        setShowNutritionSearch(true);
      }
    } catch (error) {
      console.error('EAN-Suche fehlgeschlagen:', error);
    } finally {
      setIsSearchingEAN(false);
    }
  };
  
  // Hilfsfunktion zur Validierung der erforderlichen Felder
  const isFormValid = () => {
    return !!(
      articleForm.name &&
      articleForm.supplierId &&
      articleForm.bundleUnit &&
      articleForm.bundlePrice &&
      articleForm.content &&
      articleForm.contentUnit &&
      articleForm.pricePerUnit
    );
  };
  const {
    // State
    articleForm,
    editingArticle,
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
    showPriceConverter,
    selectedVatRate,
    showAccountingAccountDropdown,
    accountingAccountSearchTerm,
    selectedAccountingAccountIndex,
    accountingAccounts,
    showCalculator,
    bundlePriceInput,
    contentInput,
    pricePerUnitInput,

    // Setters
    setArticleForm,
    setBundlePriceInput,
    setContentInput,
    setPricePerUnitInput,
    setShowPriceConverter,
    setSelectedVatRate,
    setShowAccountingAccountDropdown,
    setAccountingAccountSearchTerm,
    setSelectedAccountingAccountIndex,
    loadAccountingAccounts,
    setShowCalculator,
    setShowCategoryDropdown,
    setSelectedCategoryIndex,
    setShowSupplierDropdown,
    setSelectedSupplierIndex,
    setShowBundleUnitDropdown,
    setSelectedBundleUnitIndex,
    setShowContentUnitDropdown,
    setSelectedContentUnitIndex,

    // Hilfsfunktionen
    calculatePricePerUnit,
    calculateGrossPrice,
    calculateNetPrice,
    calculateKilojoules,
    formatPrice,
    formatAdditivesDisplay,
    formatAllergensDisplay,
    getSupplierName,
    getFilteredCategories,
    getFilteredSuppliers,
    getFilteredBundleUnits,
    getFilteredContentUnits,
    getFilteredAccountingAccounts,

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
    handleAccountingAccountSelect,
    handleAccountingAccountInputChange,
    handleAccountingAccountInputBlur,
    handleAccountingAccountKeyDown,
    handleApplyGrossPrice,
    handleApplyNetPrice,
    handleCalculatorResult,
    handleAdditivesDropdownToggle,
    handleAllergensDropdownToggle,

    // Utility-Funktionen
    resetForm,
    setArticleForEditing,

    // Konstanten
    CATEGORIES,
    UNITS,
    ADDITIVES,
    ALLERGENS
  } = useArticleForm(suppliers, onNewSupplier, articles);

  // Debug-Log für articleForm Änderungen
  useEffect(() => {
    console.log('🔍 Artikelformular - articleForm geändert:', articleForm);
    console.log('🔍 Artikelformular - pricePerUnit:', articleForm.pricePerUnit);
  }, [articleForm]);

  // Synchronisiere mit dem globalen editingArticle State
  useEffect(() => {
    if (state.editingArticle) {
      console.log('🔍 Lade Artikel zum Bearbeiten:', {
        name: state.editingArticle.name,
        hasImage: !!state.editingArticle.image,
        imageValue: state.editingArticle.image
      });
      
      // Prüfe ob es ein anderer Artikel ist (andere ID)
      const isDifferentArticle = articleImage && 
                                 state.editingArticle.id && 
                                 currentArticleIdInModal && 
                                 state.editingArticle.id !== currentArticleIdInModal;
      
      if (isDifferentArticle) {
        // Neuer Artikel - lösche Bild aus State
        console.log('🔄 Neuer Artikel geladen - lösche Bild aus State');
        setArticleImage(null);
        setCurrentArticleIdInModal(null);
      }
      
      setArticleForEditing(state.editingArticle);
      setIsFromRecipeForm(false);
      
      // Bild wird erst beim Öffnen des Bild-Modals geladen
      console.log('🖼️ Artikel geladen - Bild wird erst beim Öffnen des Modals geladen');
    } else if (state.newArticleName && !editingArticle) {
      // Wenn ein neuer Artikelname gesetzt ist, verwende ihn
      setArticleForm(prev => ({
        ...prev,
        name: state.newArticleName
      }));
      setIsFromRecipeForm(true);
      // Lösche den newArticleName aus dem Context
      dispatch({ type: 'SET_NEW_ARTICLE_NAME', payload: '' });
    }
  }, [state.editingArticle, state.newArticleName, setArticleForEditing, editingArticle, dispatch]);

  // Lade AccountingAccounts beim Öffnen des Formulars
  useEffect(() => {
    if (show) {
      loadAccountingAccounts();
    }
  }, [show, loadAccountingAccounts]);

  // Verhindere Scrolling im Hintergrund
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  // Fokus auf Artikelname-Feld setzen
  useEffect(() => {
    if (show && articleNameRef.current) {
      // Kurze Verzögerung, um sicherzustellen, dass das Modal vollständig gerendert ist
      setTimeout(() => {
        articleNameRef.current?.focus();
      }, 100);
    }
  }, [show]);

  // Positioniere Bundle-Unit-Dropdown
  useEffect(() => {
    if (showBundleUnitDropdown && bundleUnitContainerRef.current) {
      const rect = bundleUnitContainerRef.current.getBoundingClientRect();
      const dropdown = bundleUnitContainerRef.current.querySelector('.bundle-unit-dropdown') as HTMLElement;
      if (dropdown) {
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.left = `${rect.left}px`;
      }
    }
  }, [showBundleUnitDropdown]);

  // Positioniere Content-Unit-Dropdown
  useEffect(() => {
    if (showContentUnitDropdown && contentUnitContainerRef.current) {
      const rect = contentUnitContainerRef.current.getBoundingClientRect();
      const dropdown = contentUnitContainerRef.current.querySelector('.content-unit-dropdown') as HTMLElement;
      if (dropdown) {
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.left = `${rect.left}px`;
      }
    }
  }, [showContentUnitDropdown]);

  // Passe die Breite des AccountingAccount-Dropdowns dynamisch an
  useEffect(() => {
    if (showAccountingAccountDropdown && accountingAccountContainerRef.current) {
      const updateDropdownWidth = () => {
        const input = accountingAccountContainerRef.current?.querySelector('input');
        const dropdown = accountingAccountContainerRef.current?.querySelector('.accounting-account-dropdown') as HTMLElement;
        if (input && dropdown) {
          const inputWidth = input.offsetWidth;
          const isSmallScreen = window.innerWidth < 768;
          dropdown.style.width = isSmallScreen ? '400px' : `${inputWidth}px`;
        }
      };

      // Initiale Berechnung nach kurzer Verzögerung (damit DOM gerendert ist)
      const timeoutId = setTimeout(updateDropdownWidth, 10);

      // Bei Resize aktualisieren
      window.addEventListener('resize', updateDropdownWidth);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateDropdownWidth);
      };
    }
  }, [showAccountingAccountDropdown]);

  // Positioniere Additives-Dropdown
  useEffect(() => {
    if (!showAdditivesDropdown) return;

    const updatePosition = () => {
      const container = document.querySelector('.ingredients-dropdown-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const dropdown = container.querySelector('.additives-dropdown') as HTMLElement;
        if (dropdown) {
          dropdown.style.top = `${rect.bottom}px`;
          dropdown.style.left = `${rect.left}px`;
          dropdown.style.width = `${rect.width}px`;
        }
      }
    };

    // Initiale Positionierung
    updatePosition();

    // Bei Scroll und Resize aktualisieren
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showAdditivesDropdown]);

  // Positioniere Allergens-Dropdown
  useEffect(() => {
    if (!showAllergensDropdown) return;

    const updatePosition = () => {
      const container = document.querySelector('.allergens-dropdown-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const dropdown = container.querySelector('.allergens-dropdown') as HTMLElement;
        if (dropdown) {
          dropdown.style.top = `${rect.bottom}px`;
          dropdown.style.left = `${rect.left}px`;
          dropdown.style.width = `${rect.width}px`;
        }
      }
    };

    // Initiale Positionierung
    updatePosition();

    // Bei Scroll und Resize aktualisieren
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showAllergensDropdown]);

  // Debug-Log für showPriceConverter State
  useEffect(() => {
    console.log('🔵 showPriceConverter State changed to:', showPriceConverter);
  }, [showPriceConverter]);

  // Initialisiere Breite beim Öffnen - lade gespeicherte Breite oder verwende 60%
  useEffect(() => {
    if (show && formWidth === null) {
      // Setze sofort ohne Transition beim ersten Öffnen
      setIsInitialMount(true);
      const savedWidth = loadSavedWidth();
      setFormWidth(savedWidth);
      // Nach dem ersten Render die Transition wieder aktivieren
      const timer = setTimeout(() => {
        setIsInitialMount(false);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!show) {
      // Zurücksetzen beim Schließen (Breite bleibt aber gespeichert)
      setFormWidth(null);
      setIsInitialMount(true); // Beim nächsten Öffnen wieder ohne Transition
    }
  }, [show, formWidth]);

  // Resize-Handling
  useEffect(() => {
    if (!isResizing) return;

    // Ändere Cursor während des Resizings
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!formContainerRef.current) return;
      
      const container = formContainerRef.current.parentElement?.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const deltaX = e.clientX - resizeStartX.current;
      const containerWidth = containerRect.width;
      const deltaWidthPercent = (deltaX / containerWidth) * 100;
      
      // Da das Modal zentriert ist, muss die Breitenänderung verdoppelt werden,
      // damit sich der rechte Rand mit der Maus bewegt (beide Ränder bewegen sich um die Hälfte)
      const newWidth = Math.min(Math.max(resizeStartWidth.current + (deltaWidthPercent * 2), 40), 90); // Min 40%, Max 90%
      
      setFormWidth(newWidth);
      saveWidth(newWidth); // Speichere die neue Breite
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Wenn das Modal geöffnet wird, aber formWidth noch null ist, verwende gespeicherte Breite als Fallback
  // Das verhindert, dass das Modal zunächst mit 100% Breite rendert
  const effectiveWidth = show && formWidth === null ? loadSavedWidth() : formWidth;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Speichere Startposition und aktuelle Breite
    resizeStartX.current = e.clientX;
    const currentWidth = formWidth !== null ? formWidth : (show ? loadSavedWidth() : 60);
    resizeStartWidth.current = currentWidth;
    
    setIsResizing(true);
  };

  if (!show) return null;

  const handleSave = async () => {
    try {
      // Duplikat-Prüfung VOR dem Speichern
      const duplicateCheck = articles.find(existingArticle => {
        // Gleicher Name beim gleichen Lieferanten (case-insensitive)
        const sameNameSameSupplier = existingArticle.name.toLowerCase() === articleForm.name.toLowerCase() && 
                                   existingArticle.supplierId === articleForm.supplierId;
        
        // Nicht der gleiche Artikel (wenn wir bearbeiten)
        const notSameArticle = !editingArticle || existingArticle.id !== editingArticle.id;
        
        return sameNameSameSupplier && notSameArticle;
      });

      if (duplicateCheck) {
        // Duplikat gefunden - zeige Modal
        const supplierName = suppliers.find(s => s.id === duplicateCheck.supplierId)?.name || 'Unbekannt';
        setDuplicateMessage(`Ein Artikel mit dem Namen "${duplicateCheck.name}" existiert bereits beim Lieferanten "${supplierName}".`);
        setExistingArticle(duplicateCheck);
        setShowDuplicateModal(true);
        return;
      }

      // Erstelle Artikel mit Hybrid-ID-System
      // Verwende temporäre ID aus Bild-Modal, falls vorhanden (für neue Artikel mit Bild)
      const articleId = editingArticle 
        ? editingArticle.id 
        : (currentArticleIdInModal || UUIDUtils.generateId());
      
      const articleToSave: Article = {
        ...articleForm,
        id: articleId, // Frontend-ID (eindeutig) - verwendet temporäre ID falls vorhanden
        dbId: editingArticle?.dbId, // DB-ID falls vorhanden (für Updates)
        isNew: !editingArticle,
        isDirty: true,
        syncStatus: 'pending',
        category: articleForm.category as ArticleCategory, // Type-Assertion für category
        bundleUnit: articleForm.bundleUnit as Unit, // Type-Assertion für bundleUnit
        contentUnit: articleForm.contentUnit as Unit, // Type-Assertion für contentUnit
        nutritionInfo: articleForm.nutrition,
        alcohol: articleForm.nutrition.alcohol // Separates alcohol Feld
        // Keine Timestamps - werden von PostgreSQL automatisch gesetzt (created_at, updated_at)
      };
      
      console.log('💾 Speichere Artikel über StorageLayer:', {
        name: articleToSave.name,
        id: articleToSave.id,
        isNew: articleToSave.isNew,
        hasDbId: !!articleToSave.dbId
      });
      
      // Speichere über StorageLayer
      const success = await storageLayer.save('articles', [articleToSave]);
      
      if (!success) {
        throw new Error('Fehler beim Speichern des Artikels');
      }
      
      console.log('✅ Artikel erfolgreich über StorageLayer gespeichert');
      
      // Aktualisiere den globalen State
      if (editingArticle) {
        // Bestehender Artikel wird bearbeitet
        dispatch({ type: 'UPDATE_ARTICLE', payload: { id: editingArticle.id, article: articleToSave } });
      } else {
        // Neuer Artikel wird hinzugefügt
        dispatch({ type: 'ADD_ARTICLE', payload: articleToSave });
      }
      
      // Bild-Speicherung erfolgt jetzt direkt im Bild-Modal, nicht mehr hier
      // Stelle nur sicher, dass die Artikel-ID im Formular gesetzt ist (falls temporäre ID verwendet wurde)
      if (currentArticleIdInModal && currentArticleIdInModal === articleToSave.id) {
        // Temporäre ID wurde verwendet - alles ist bereits synchronisiert
        console.log('✅ Artikel-ID bereits synchronisiert mit Bild-Modal');
      }
      
      // Wenn erfolgreich, schließe das Modal
      resetForm();
      
      // Reset global editing state
      if (state.editingArticle) {
        onReset();
      }
      
      // Schließe das Modal nach dem Speichern
      onClose();
      
      // Wenn der Artikel aus dem Rezeptformular erstellt wurde, kehre dorthin zurück
      if (isFromRecipeForm) {
        dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: true });
        dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: false });
        setIsFromRecipeForm(false);
      }
      
    } catch (error: any) {
      console.error('❌ Fehler beim Speichern des Artikels:', error);
      
      // Andere Fehler
      alert(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
    setIsFromRecipeForm(false);
    // Reset Bild-States (beim Schließen des gesamten Formulars)
    setArticleImage(null);
    setCurrentArticleIdInModal(null);
    setPendingImageFile(null);
    setImageNeedsDeletion(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Reset global editing state
    if (state.editingArticle) {
      onReset();
    }
  };

  const handleDuplicateModalClose = () => {
    setShowDuplicateModal(false);
    setDuplicateMessage('');
    setExistingArticle(null);
  };

  const handleEditExistingArticle = () => {
    if (existingArticle) {
      // Setze den bestehenden Artikel zum Bearbeiten
      dispatch({ type: 'SET_EDITING_ARTICLE', payload: existingArticle });
      setShowDuplicateModal(false);
      setDuplicateMessage('');
      setExistingArticle(null);
      // Das Artikelformular bleibt offen und zeigt den bestehenden Artikel
    }
  };

  const handleNewSupplier = () => {
    if (onNewSupplier && supplierSearchTerm) {
      onNewSupplier(supplierSearchTerm);
    }
  };

  const handleNutritionDataFound = (nutritionData: NutritionData) => {
    setArticleForm(prev => ({
      ...prev,
      nutrition: {
        calories: nutritionData.calories,
        kilojoules: nutritionData.kilojoules,
        protein: nutritionData.protein,
        fat: nutritionData.fat,
        carbohydrates: nutritionData.carbohydrates,
        fiber: nutritionData.fiber || 0,
        sugar: nutritionData.sugar || 0,
        salt: nutritionData.salt || 0
      }
    }));
  };

  const handleExtendedDataFound = (extendedData: ExtendedProductData) => {
    setArticleForm(prev => ({
      ...prev,
      nutrition: {
        calories: extendedData.nutritionData.calories,
        kilojoules: extendedData.nutritionData.kilojoules,
        protein: extendedData.nutritionData.protein,
        fat: extendedData.nutritionData.fat,
        carbohydrates: extendedData.nutritionData.carbohydrates,
        fiber: extendedData.nutritionData.fiber || 0,
        sugar: extendedData.nutritionData.sugar || 0,
        salt: extendedData.nutritionData.salt || 0
      },
      allergens: extendedData.allergens,
      additives: extendedData.additives,
      ingredients: extendedData.ingredients || prev.ingredients // Übernehme Inhaltsstoffe aus den erweiterten Daten
    }));

    // Zeige eine Benachrichtigung in der Konsole
    console.log(`Erweiterte Daten übernommen: ${extendedData.allergens.length} Allergene, ${extendedData.additives.length} Zusatzstoffe`);
    if (extendedData.ingredients) {
      console.log(`Inhaltsstoffe übernommen: ${extendedData.ingredients}`);
    }
  };

  return (
    <>
      {/* Hauptmodal */}
      <div 
        className="fixed top-0 left-0 w-full h-full" 
        style={{
          background: 'rgba(0,0,0,0.5)',
          zIndex: (showPriceConverter || showCalculator) ? 3000 : 4000,
          top: 56
        }}
      >
        <div className="container-fluid h-full p-4">
          <div className="flex justify-center h-full">
            <div 
              ref={formContainerRef}
              className="relative"
              style={{ 
                width: effectiveWidth !== null ? `${effectiveWidth}%` : '100%',
                transition: (isResizing || isInitialMount) ? 'none' : 'width 0.3s ease'
              }}
            >
              <div className="card" style={{ backgroundColor: colors.card, maxHeight: 'calc(100vh - 120px)' }}>
                <div className="card-header flex justify-between items-center" style={{ backgroundColor: colors.secondary }}>
                  <h5 className="mb-0 form-label-themed">
                    {editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}
                  </h5>
                  <button
                    className="btn btn-link p-0"
                    onClick={handleClose}
                    style={{ color: colors.text, textDecoration: 'none' }}
                  >
                    <FaTimes />
                  </button>
                </div>
                                 <div 
                   className="card-body" 
                   style={{ 
                     overflowY: 'auto', 
                     maxHeight: 'calc(100vh - 180px)',
                     paddingBottom: '0',
                     borderBottom: 'none'
                   }}
                 >
                  <form>
                  {/* Grunddaten */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Grunddaten
                      </h6>
                    </div>
                    <div className="flex flex-wrap -mx-2">
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Artikelname
                        </label>
                        <div className="input-group">
                          <input
                            ref={articleNameRef}
                            type="text"
                            className="form-control form-control-themed"
                            value={articleForm.name}
                            onChange={(e) => handleArticleNameChange(e.target.value)}
                            tabIndex={1}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onClick={openImageModal}
                            tabIndex={-1}
                            title="Artikelbild verwalten"
                          >
                            <FaImage />
                          </button>
                        </div>
                      </div>
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label">
                          Kategorie
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className="form-control"
                            value={articleForm.category}
                            onChange={(e) => handleCategoryInputChange(e.target.value)}
                            onFocus={() => setShowCategoryDropdown(true)}
                            onBlur={handleCategoryInputBlur}
                            onKeyDown={handleCategoryKeyDown}
                            placeholder="Kategorie auswählen oder eingeben..."
                            tabIndex={2}
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
                                        backgroundColor: selectedCategoryIndex === index ? colors.accent + '20' : 'transparent',
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
                                      backgroundColor: selectedCategoryIndex === getFilteredCategories().length ? colors.accent + '20' : 'transparent',
                                      color: colors.accent,
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
                                    onMouseLeave={() => {
                                      if (selectedCategoryIndex !== getFilteredCategories().length) {
                                        setSelectedCategoryIndex(-1);
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
                      
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label">
                          Lieferant
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className="form-control"
                            value={supplierSearchTerm || (articleForm.supplierId ? getSupplierName(articleForm.supplierId) : '')}
                            onChange={(e) => handleSupplierInputChange(e.target.value)}
                            onFocus={() => setShowSupplierDropdown(true)}
                            onBlur={handleSupplierInputBlur}
                            onKeyDown={handleSupplierKeyDown}
                            placeholder="Lieferant auswählen oder eingeben..."
                            tabIndex={3}
                          />
                          {showSupplierDropdown && (
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
                              {getFilteredSuppliers().length > 0 ? (
                                getFilteredSuppliers().map((supplier, index) => (
                                  <div
                                    key={supplier.id}
                                    className="px-3 py-2 cursor-pointer"
                                    onClick={() => handleSupplierSelect(supplier)}
                                    style={{
                                      color: colors.text,
                                      borderBottom: `1px solid ${colors.cardBorder}`,
                                      cursor: 'pointer',
                                      backgroundColor: selectedSupplierIndex === index ? colors.accent + '20' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (selectedSupplierIndex !== index) {
                                        e.currentTarget.style.backgroundColor = colors.secondary;
                                      }
                                      setSelectedSupplierIndex(index);
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedSupplierIndex !== index) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }
                                    }}
                                  >
                                    <div style={{ fontWeight: 'bold' }}>{supplier.name}</div>
                                    <small style={{ color: colors.accent }}>{supplier.contactPerson}</small>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                  Kein Lieferant gefunden
                                </div>
                              )}
                              {supplierSearchTerm && !suppliers.some(s => s.name.toLowerCase() === supplierSearchTerm.toLowerCase()) && (
                                <div
                                  className="px-3 py-2 cursor-pointer"
                                  onClick={() => handleNewSupplier()}
                                  style={{
                                    color: colors.accent,
                                    borderTop: `2px solid ${colors.accent}`,
                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    backgroundColor: selectedSupplierIndex === getFilteredSuppliers().length ? colors.accent + '20' : 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedSupplierIndex !== getFilteredSuppliers().length) {
                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                    }
                                    setSelectedSupplierIndex(getFilteredSuppliers().length);
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedSupplierIndex !== getFilteredSuppliers().length) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                  }}
                                >
                                  "{supplierSearchTerm}" als neuen Lieferanten anlegen
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
                      <div className="md:w-1/6 px-2 mb-3">
                        <label className="form-label">
                          SKR-Konto
                        </label>
                        <div className="relative" ref={accountingAccountContainerRef}>
                          <input
                            type="text"
                            className="form-control text-center"
                            value={
                              showAccountingAccountDropdown && accountingAccountSearchTerm
                                ? accountingAccountSearchTerm
                                : articleForm.accountingAccountNumber || ''
                            }
                            onChange={(e) => handleAccountingAccountInputChange(e.target.value)}
                            onFocus={() => {
                              setShowAccountingAccountDropdown(true);
                              // Setze den Suchbegriff auf die aktuelle Kontonummer, wenn vorhanden
                              if (articleForm.accountingAccountNumber && !accountingAccountSearchTerm) {
                                setAccountingAccountSearchTerm(articleForm.accountingAccountNumber);
                              }
                            }}
                            onBlur={handleAccountingAccountInputBlur}
                            onKeyDown={handleAccountingAccountKeyDown}
                            placeholder="Kontonummer oder Name suchen..."
                            tabIndex={4}
                            style={{ textAlign: 'center' }}
                          />
                          {showAccountingAccountDropdown && (
                            <div className="absolute accounting-account-dropdown" style={{
                              top: '100%',
                              right: 0,
                              zIndex: 10000,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '0 0 0.375rem 0.375rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                              {getFilteredAccountingAccounts().length > 0 ? (
                                getFilteredAccountingAccounts().map((account, index) => (
                                  <div
                                    key={account.id}
                                    className="px-3 py-2 cursor-pointer"
                                    onClick={() => handleAccountingAccountSelect(account)}
                                    style={{
                                      color: colors.text,
                                      borderBottom: `1px solid ${colors.cardBorder}`,
                                      cursor: 'pointer',
                                      backgroundColor: selectedAccountingAccountIndex === index ? colors.accent + '20' : 'transparent'
                                    }}
                                    onMouseEnter={() => setSelectedAccountingAccountIndex(index)}
                                    onMouseLeave={() => {
                                      if (selectedAccountingAccountIndex !== index) {
                                        setSelectedAccountingAccountIndex(-1);
                                      }
                                    }}
                                  >
                                    <div style={{ fontWeight: 'bold' }}>{account.number}</div>
                                    <small style={{ color: colors.textSecondary }}>{account.name}</small>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                  Kein Konto gefunden
                                </div>
                              )}
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
                           <span className="input-group-text" style={{
                             backgroundColor: colors.cardBorder,
                             color: colors.text,
                             borderColor: colors.cardBorder,
                             minWidth: '40px',
                             justifyContent: 'center'
                           }}>
                             1
                           </span>
                           
                           {/* Gebindeeinheit Dropdown */}
                           <div className="relative" ref={bundleUnitContainerRef} style={{ width: '30%' }}> {/* 1/6 Breite */}
                             <input
                               type="text"
                               className="form-control"
                               value={articleForm.bundleUnit}
                               onChange={(e) => handleBundleUnitInputChange(e.target.value)}
                               onFocus={() => setShowBundleUnitDropdown(true)}
                               onBlur={handleBundleUnitInputBlur}
                               onKeyDown={handleBundleUnitKeyDown}
                               placeholder="Einheit..."
                               tabIndex={5}
                               style={{ borderRadius: 0 }}
                             />
                             {showBundleUnitDropdown && (
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
                                 boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
                                         backgroundColor: selectedBundleUnitIndex === index ? colors.accent + '20' : 'transparent'
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
                                       color: colors.accent,
                                       borderTop: `2px solid ${colors.accent}`,
                                       borderBottom: `1px solid ${colors.cardBorder}`,
                                       cursor: 'pointer',
                                       fontWeight: 'bold',
                                       backgroundColor: selectedBundleUnitIndex === getFilteredBundleUnits().length ? colors.accent + '20' : 'transparent'
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
                             )}
                           </div>
                           
                           {/* Ist-Gleich Zeichen */}
                           <span className="input-group-text" style={{
                             backgroundColor: colors.cardBorder,
                             color: colors.text,
                             borderColor: colors.cardBorder,
                             minWidth: '40px',
                             justifyContent: 'center'
                           }}>
                             =
                           </span>
                           
                           {/* Gebindepreis Input */}
                           <input
                             type="text"
                             className="form-control form-control-themed text-end"
                             value={bundlePriceInput}
                             onChange={(e) => {
                               setBundlePriceInput(e.target.value);
                               const value = parseFloat(e.target.value.replace(',', '.'));
                               if (!isNaN(value)) {
                                 setArticleForm(prev => {
                                   const newPricePerUnit = calculatePricePerUnit(value, prev.content);
                                   // Aktualisiere auch pricePerUnitInput
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
                             tabIndex={6}
                             style={{ borderRadius: 0 }}
                           />
                           
                           {/* Euro Symbol */}
                           <span className="input-group-text" style={{
                             backgroundColor: colors.cardBorder,
                             color: colors.text,
                             borderColor: colors.cardBorder,
                             minWidth: '40px',
                             justifyContent: 'center'
                           }}>
                             <FaEuroSign />
                           </span>
                           
                           {/* Price Converter Button */}
                           <button
                             type="button"
                             className="btn btn-outline-input"
                             onMouseDown={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               console.log('🔵 Price Converter Button mouseDown');
                               // Verhindere, dass onBlur das Dropdown schließt
                               const input = bundleUnitContainerRef.current?.querySelector('input');
                               if (input && document.activeElement === input) {
                                 input.blur();
                               }
                               // Öffne das Modal sofort bei mouseDown, nicht onClick
                               setShowPriceConverter(true);
                               console.log('🔵 showPriceConverter set to true via mouseDown');
                             }}
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               console.log('🔵 Price Converter Button clicked, setting showPriceConverter to true');
                               setShowPriceConverter(true);
                               console.log('🔵 showPriceConverter should now be:', true);
                             }}
                             tabIndex={-1}
                             title="Preis umrechnen"
                             style={{ zIndex: 1002, position: 'relative' }}
                           >
                             <FaCoins />
                           </button>
                         </div>
                       </div>
                      
                      {/* Inhalt und Einheiten */}
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label">
                          Inhalt & Preis je Einheit
                        </label>
                        <div className="input-group">
                          {/* Inhalt Input */}
                          <input
                            type="text"
                            className="form-control text-end"
                            value={contentInput}
                            onChange={(e) => {
                              setContentInput(e.target.value);
                              const value = parseFloat(e.target.value.replace(',', '.'));
                              if (!isNaN(value)) {
                                setArticleForm(prev => ({
                                  ...prev,
                                  content: value,
                                  pricePerUnit: calculatePricePerUnit(prev.bundlePrice, value)
                                }));
                                // Aktualisiere auch pricePerUnitInput
                                const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, value);
                                setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                              }
                            }}
                            onBlur={() => {
                              // Formatiere als deutsche Zahl mit Komma
                              const formattedValue = (articleForm.content || 0).toFixed(2).replace('.', ',');
                              setContentInput(formattedValue);
                              // Aktualisiere auch pricePerUnitInput
                              const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, articleForm.content);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                            }}
                            onFocus={(e) => {
                              // Zeige unformatierte Zahl und markiere alles
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
                                // Aktualisiere auch pricePerUnitInput
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
                                // Aktualisiere auch pricePerUnitInput
                                const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, newContent);
                                setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                              }
                            }}
                            required
                            tabIndex={7}
                          />
                          
                          {/* Inhaltseinheit Dropdown */}
                          <div className="relative" ref={contentUnitContainerRef} style={{ width: '25%' }}>
                            <input
                              type="text"
                              className="form-control"
                              value={articleForm.contentUnit}
                              onChange={(e) => handleContentUnitInputChange(e.target.value)}
                              onFocus={() => setShowContentUnitDropdown(true)}
                              onBlur={handleContentUnitInputBlur}
                              onKeyDown={handleContentUnitKeyDown}
                              placeholder="Einheit..."
                              tabIndex={8}
                              style={{ borderRadius: 0 }}
                            />
                            {showContentUnitDropdown && (
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
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
                                        backgroundColor: selectedContentUnitIndex === index ? colors.accent + '20' : 'transparent'
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
                                      color: colors.accent,
                                      borderTop: `2px solid ${colors.accent}`,
                                      borderBottom: `1px solid ${colors.cardBorder}`,
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      backgroundColor: selectedContentUnitIndex === getFilteredContentUnits().length ? colors.accent + '20' : 'transparent'
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
                            )}
                          </div>
                          
                          {/* Ist-Gleich Zeichen */}
                          <span className="input-group-text" style={{
                            backgroundColor: colors.cardBorder,
                            color: colors.text,
                            borderColor: colors.cardBorder,
                            minWidth: '40px',
                            justifyContent: 'center'
                          }}>
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
                            tabIndex={9}
                            style={{ borderRadius: 0, width: '20%' }}
                          />
                          
                          {/* Euro Symbol */}
                          <span className="input-group-text" style={{
                            backgroundColor: colors.cardBorder,
                            color: colors.text,
                            borderColor: colors.cardBorder,
                            minWidth: '40px',
                            justifyContent: 'center'
                          }}>
                            €
                          </span>
                          
                          {/* Calculator Button */}
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔵 Calculator Button mouseDown');
                              // Verhindere, dass onBlur das Dropdown schließt
                              const input = contentUnitContainerRef.current?.querySelector('input');
                              if (input && document.activeElement === input) {
                                input.blur();
                              }
                              // Öffne das Modal sofort bei mouseDown, nicht onClick
                              setShowCalculator(true);
                              console.log('🔵 showCalculator set to true via mouseDown');
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔵 Calculator Button clicked, setting showCalculator to true');
                              setShowCalculator(true);
                              console.log('🔵 showCalculator should now be:', true);
                            }}
                            tabIndex={-1}
                            title="Taschenrechner"
                            style={{ zIndex: 1002, position: 'relative' }}
                          >
                            <FaCalculator />
                          </button>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-1/3 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Gebinde-EAN
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            className={`form-control form-control-themed ${articleForm.bundleEanCode && !validateEANCode(articleForm.bundleEanCode).isValid ? 'is-invalid' : ''}`}
                            value={articleForm.bundleEanCode || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setArticleForm(prev => ({ ...prev, bundleEanCode: value }));
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              if (value) {
                                const validation = validateEANCode(value);
                                if (validation.isValid && validation.normalizedCode) {
                                  setArticleForm(prev => ({ ...prev, bundleEanCode: validation.normalizedCode }));
                                  // Automatische Suche bei Open Food Facts
                                  searchEANCode(validation.normalizedCode);
                                }
                              }
                            }}
                            placeholder="EAN-Code für Gebinde (z.B. Karton)"
                            maxLength={13}
                            tabIndex={-1}
                          />
                          
                          {/* Camera Button */}
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onClick={() => {
                              setScannerTargetField('bundle');
                              setShowBarcodeScanner(true);
                            }}
                            tabIndex={-1}
                            title="EAN-Code scannen"
                          >
                            <FaCamera />
                          </button>
                        </div>
                        {articleForm.bundleEanCode && !validateEANCode(articleForm.bundleEanCode).isValid && (
                          <div className="invalid-feedback" style={{ color: '#dc3545', fontSize: '0.875em' }}>
                            {validateEANCode(articleForm.bundleEanCode).message}
                          </div>
                        )}
                        {articleForm.bundleEanCode && validateEANCode(articleForm.bundleEanCode).isValid && (
                          <div className="valid-feedback" style={{ color: '#198754', fontSize: '0.875em' }}>
                            {validateEANCode(articleForm.bundleEanCode).format}: {formatEANCode(articleForm.bundleEanCode)}
                            {isSearchingEAN && (
                              <span className="ms-2">
                                <FaSpinner className="fa-spin" style={{ fontSize: '0.75em' }} />
                                <span className="ms-1">Suche bei Open Food Facts...</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-full md:w-1/3 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Inhalt-EAN
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            className={`form-control form-control-themed ${articleForm.contentEanCode && !validateEANCode(articleForm.contentEanCode).isValid ? 'is-invalid' : ''}`}
                            value={articleForm.contentEanCode || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setArticleForm(prev => ({ ...prev, contentEanCode: value }));
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              if (value) {
                                const validation = validateEANCode(value);
                                if (validation.isValid && validation.normalizedCode) {
                                  setArticleForm(prev => ({ ...prev, contentEanCode: validation.normalizedCode }));
                                  // Automatische Suche bei Open Food Facts
                                  searchEANCode(validation.normalizedCode);
                                }
                              }
                            }}
                            placeholder="EAN-Code für Inhalt (z.B. Flaschen)"
                            maxLength={13}
                            tabIndex={-1}
                          />
                          
                          {/* Camera Button für Inhalts-EAN */}
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onClick={() => {
                              setScannerTargetField('content');
                              setShowBarcodeScanner(true);
                            }}
                            tabIndex={-1}
                            title="EAN-Code scannen"
                          >
                            <FaCamera />
                          </button>
                        </div>
                        {articleForm.contentEanCode && !validateEANCode(articleForm.contentEanCode).isValid && (
                          <div className="invalid-feedback" style={{ color: '#dc3545', fontSize: '0.875em' }}>
                            {validateEANCode(articleForm.contentEanCode).message}
                          </div>
                        )}
                        {articleForm.contentEanCode && validateEANCode(articleForm.contentEanCode).isValid && (
                          <div className="valid-feedback" style={{ color: '#198754', fontSize: '0.875em' }}>
                            {validateEANCode(articleForm.contentEanCode).format}: {formatEANCode(articleForm.contentEanCode)}
                            {isSearchingEAN && (
                              <span className="ms-2">
                                <FaSpinner className="fa-spin" style={{ fontSize: '0.75em' }} />
                                <span className="ms-1">Suche bei Open Food Facts...</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-full md:w-1/3 px-2 mb-3 flex flex-col justify-start">
                        {/* Unsichtbarer Container mit gleicher Höhe wie EAN-Labels */}
                        <div style={{ 
                          height: '1.5em', 
                          visibility: 'hidden',
                          marginBottom: '0'
                        }}>
                          <label className="form-label form-label-themed">Platzhalter</label>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => {
                              console.log('Öffne Nährwert-Suche...');
                              setShowNutritionSearch(true);
                            }}
                            tabIndex={-1}
                          >
                            <FaSearch className="me-1" />
                            Nährwerte suchen
                          </button>
                        </div>
                      </div>
                      
                    </div>
                    </div>

                    
                    

                    {/* ZusatzstoffeInhaltsstoffe und Allergene */}
                    <div className="mb-4">
                      <div className="w-full">
                        <h6 className="form-label-themed section-header">
                          Zusatzstoffe, Inhaltsstoffe und Allergene
                        </h6>
                      </div>
                      <div className="flex flex-wrap -mx-2">
                      <div className="w-full md:w-5/12 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Zusatzstoffe
                        </label>
                        <div className="relative ingredients-dropdown-container" ref={(el) => {
                          if (el && showAdditivesDropdown) {
                            const rect = el.getBoundingClientRect();
                            const dropdown = el.querySelector('.additives-dropdown') as HTMLElement;
                            if (dropdown) {
                              dropdown.style.top = `${rect.bottom}px`;
                              dropdown.style.left = `${rect.left}px`;
                              dropdown.style.width = `${rect.width}px`;
                            }
                          }
                        }}>
                          <div
                            className="form-control"
                            onClick={handleAdditivesDropdownToggle}
                            tabIndex={-1}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              cursor: 'pointer',
                              minHeight: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          >
                            <span style={{ 
                              fontSize: '0.9rem',
                              color: articleForm.additives.length > 0 ? colors.text : colors.text + '80'
                            }}>
                              {formatAdditivesDisplay(articleForm.additives)}
                            </span>
                            <span style={{ marginLeft: 'auto', color: colors.text + '60' }}>
                              {showAdditivesDropdown ? '▲' : '▼'}
                            </span>
                          </div>
                          {showAdditivesDropdown && (
                            <div className="additives-dropdown" style={{
                              position: 'fixed',
                              zIndex: 1001,
                              maxHeight: '300px',
                              overflowY: 'auto',
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '0 0 0.375rem 0.375rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              padding: '0.5rem'
                            }}>
                              {ADDITIVES.map((additive, index) => (
                                <div key={`additive-${index}-${additive}`} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`additive-${additive}`}
                                    checked={Array.isArray(articleForm.additives) && articleForm.additives.includes(additive)}
                                    onChange={() => handleAdditiveToggle(additive)}
                                    style={{ accentColor: colors.accent }}
                                  />
                                  <label className="form-check-label" htmlFor={`additive-${additive}`} style={{ color: colors.text, fontSize: '0.9rem' }}>
                                    {additive}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-full md:w-5/12 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Allergene
                        </label>
                        <div className="position-relative allergens-dropdown-container" ref={(el) => {
                          if (el && showAllergensDropdown) {
                            const rect = el.getBoundingClientRect();
                            const dropdown = el.querySelector('.allergens-dropdown') as HTMLElement;
                            if (dropdown) {
                              dropdown.style.top = `${rect.bottom}px`;
                              dropdown.style.left = `${rect.left}px`;
                              dropdown.style.width = `${rect.width}px`;
                            }
                          }
                        }}>
                          <div
                            className="form-control"
                            onClick={handleAllergensDropdownToggle}
                            tabIndex={-1}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              cursor: 'pointer',
                              minHeight: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          >
                            <span style={{ 
                              fontSize: '0.9rem',
                              color: Array.isArray(articleForm.allergens) && articleForm.allergens.length > 0 ? colors.text : colors.text + '80'
                            }}>
                              {formatAllergensDisplay(articleForm.allergens)}
                            </span>
                            <span style={{ marginLeft: 'auto', color: colors.text + '60' }}>
                              {showAllergensDropdown ? '▲' : '▼'}
                            </span>
                          </div>
                          {showAllergensDropdown && (
                            <div className="allergens-dropdown" style={{
                              position: 'fixed',
                              zIndex: 1001,
                              maxHeight: '300px',
                              overflowY: 'auto',
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '0 0 0.375rem 0.375rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              padding: '0.5rem'
                            }}>
                              {ALLERGENS.map((allergen, index) => (
                                <div key={`allergen-${index}-${allergen}`} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`allergen-${allergen}`}
                                    checked={Array.isArray(articleForm.allergens) && articleForm.allergens.includes(allergen)}
                                    onChange={() => handleAllergenToggle(allergen)}
                                    style={{ accentColor: colors.accent }}
                                  />
                                  <label className="form-check-label" htmlFor={`allergen-${allergen}`} style={{ color: colors.text, fontSize: '0.9rem' }}>
                                    {allergen}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-full md:w-1/6 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Alkoholgehalt
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            className="form-control form-control-themed"
                            value={articleForm.nutrition.alcohol || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const alcoholValue = value === '' ? undefined : Math.round(parseFloat(value) * 100) / 100;
                              setArticleForm(prev => ({
                                ...prev,
                                nutrition: {
                                  ...prev.nutrition,
                                  alcohol: alcoholValue
                                }
                              }));
                            }}
                            placeholder="0.00"
                            min="0"
                            max="100"
                            step="0.01"
                            tabIndex={-1}
                          />
                          <span className="input-group-text" style={{ backgroundColor: colors.secondary, color: colors.text }}>
                            %
                          </span>
                        </div>
                      </div>
                      <div className="w-full mb-3">
                        <label className="form-label form-label-themed">
                          Inhaltsstoffe
                        </label>
                        <textarea
                          className="form-control form-control-themed"
                          value={articleForm.ingredients || ''}
                          onChange={(e) => setArticleForm(prev => ({ ...prev, ingredients: e.target.value }))}
                          placeholder="Komplette Liste aller Zutaten (z.B. Weizenmehl, Wasser, Salz, Hefe...)"
                          rows={3}
                          tabIndex={-1}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    </div>

                    {/* Nährwertangaben */}
                    <div className="mb-4">
                      <div className="w-full">
                        <h6 className="form-label-themed section-header">
                          Nährwertangaben (pro 100g/100ml)
                        </h6>
                      </div>
                      <div className="flex flex-wrap -mx-2">
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Kalorien (kcal)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-themed"
                          value={articleForm.nutrition.calories}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, calories: parseFloat(e.target.value) || 0 }
                          }))}
                          onBlur={(e) => {
                            const calories = parseFloat(e.target.value) || 0;
                            setArticleForm(prev => ({
                              ...prev,
                              nutrition: { 
                                ...prev.nutrition, 
                                calories: calories,
                                kilojoules: calculateKilojoules(calories)
                              }
                            }));
                          }}
                          tabIndex={-1}
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Kilojoule (kJ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-themed form-control-static"
                          value={articleForm.nutrition.kilojoules}
                          readOnly
                          tabIndex={-1}
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-themed"
                          value={articleForm.nutrition.protein}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, protein: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Fett (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-themed"
                          value={articleForm.nutrition.fat}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, fat: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Kohlenhydrate (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-themed"
                          value={articleForm.nutrition.carbohydrates}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, carbohydrates: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Ballaststoffe (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-themed"
                          value={articleForm.nutrition.fiber}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, fiber: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Zucker (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control form-control-themed"
                          value={articleForm.nutrition.sugar}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, sugar: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Salz (g)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-themed"
                          value={articleForm.nutrition.salt}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, salt: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                        />
                      </div>
                    </div>
                    </div>
                    
                    {/* Notizen */}
                    <div className="mb-4">
                      <h6 className="form-label-themed section-header">
                        Notizen
                      </h6>
                      <div className="mb-3">
                        <label className="form-label form-label-themed">
                          Notizen
                        </label>
                        <textarea
                          className="form-control form-control-themed"
                          rows={3}
                          value={articleForm.notes}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            notes: e.target.value
                          }))}
                          placeholder="Zusätzliche Notizen zum Artikel..."
                          tabIndex={-1}
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="card-footer flex justify-between" style={{ 
                  backgroundColor: colors.secondary,
                  borderTopColor: colors.cardBorder,
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}>
                  <button
                    className="btn-outline-secondary px-4 py-2 rounded"
                    onClick={handleClose}
                    tabIndex={10}
                  >
                    <FaArrowLeft className="mr-2" />
                    Abbrechen
                  </button>
                  <button
                    className="btn-outline-primary px-4 py-2 rounded"
                    onClick={handleSave}
                    disabled={!isFormValid()}
                    tabIndex={9}
                  >
                    <FaSave className="mr-2" />
                    {editingArticle ? 'Änderungen speichern' : 'Artikel speichern'}
                  </button>
                </div>
              </div>
              {/* Resize-Handle - nur auf größeren Bildschirmen sichtbar */}
              <div
                ref={resizeHandleRef}
                onMouseDown={handleResizeStart}
                className="hidden md:flex"
                style={{
                  position: 'absolute',
                  right: '-4px',
                  top: 0,
                  bottom: 0,
                  width: '8px',
                  cursor: 'ew-resize',
                  backgroundColor: 'transparent',
                  zIndex: 100,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent + '20';
                }}
                onMouseLeave={(e) => {
                  if (!isResizing) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    width: '3px',
                    height: '60px',
                    backgroundColor: isResizing ? colors.accent : colors.cardBorder,
                    borderRadius: '2px',
                    transition: isResizing ? 'none' : 'background-color 0.2s ease'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taschenrechner-Dialog */}
      {showCalculator && (
        <div 
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: 'calc(100vh - 56px)',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            padding: '1rem'
          }}
        >
          <div 
            className="card price-converter-modal" 
            style={{ 
              backgroundColor: colors.card,
              width: '400px',
              maxWidth: '90vw',
              flexShrink: 0,
              boxSizing: 'border-box',
              minWidth: '400px'
            }}
          >
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary, width: '100%' }}>
              <h5 className="mb-0 form-label-themed" style={{ flex: 1 }}>
                Taschenrechner
              </h5>
              <button
                className="btn btn-link p-0"
                onClick={() => setShowCalculator(false)}
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              >
                <FaClose />
              </button>
            </div>
            <div className="card-body">
              <Calculator onResult={handleCalculatorResult} colors={colors} />
            </div>
          </div>
        </div>
      )}

      {/* Preisumrechnungs-Dialog */}
      {showPriceConverter && (
        <div 
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: 'calc(100vh - 56px)',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            padding: '1rem'
          }}
        >
          <div 
            className="card price-converter-modal" 
            style={{ 
              backgroundColor: colors.card,
              width: '400px',
              maxWidth: '90vw',
              flexShrink: 0,
              boxSizing: 'border-box',
              minWidth: '400px'
            }}
          >
              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary, width: '100%' }}>
                <h5 className="mb-0" style={{ flex: 1 }}>
                  Brutto oder Netto übernehmen
                </h5>
                <button
                  className="btn btn-link p-0"
                  onClick={() => setShowPriceConverter(false)}
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                >
                  <FaClose />
                </button>
              </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <label className="form-label form-label-themed">
                        Aktueller Gebindepreis
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control form-control-themed form-control-static"
                          value={articleForm.bundlePrice.toFixed(2)}
                          readOnly
                          style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                        />
                        <span className="input-group-text">
                          <FaEuroSign />
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label form-label-themed">
                        MwSt-Satz
                      </label>
                      <select
                        className="form-select form-control-themed"
                        value={selectedVatRate}
                        onChange={(e) => setSelectedVatRate(parseFloat(e.target.value))}
                      >
                        <option value={7}>7% (ermäßigt)</option>
                        <option value={19}>19% (regulär)</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label form-label-themed">
                        Bruttopreis
                      </label>
                      <div className="input-group mb-2">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-themed form-control-static"
                          value={calculateGrossPrice(articleForm.bundlePrice, selectedVatRate).toFixed(2)}
                          readOnly
                          style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                        />
                        <span className="input-group-text">
                          <FaEuroSign />
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline-input"
                          onClick={handleApplyGrossPrice}
                          title="Bruttopreis übernehmen"
                        >
                          <FaCheck />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">
                        Nettopreis
                      </label>
                      <div className="input-group mb-2">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-static"
                          value={calculateNetPrice(articleForm.bundlePrice, selectedVatRate).toFixed(2)}
                          readOnly
                          style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                        />
                        <span className="input-group-text">
                          <FaEuroSign />
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline-input"
                          onClick={handleApplyNetPrice}
                          title="Nettopreis übernehmen"
                        >
                          <FaCheck />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer d-flex justify-content-center" style={{ 
                    backgroundColor: colors.secondary,
                    borderTop: `1px solid ${colors.cardBorder}`
                  }}>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPriceConverter(false)}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
        </div>
      )}

      {/* Bild-Modal */}
      {showImageModal && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
          onClick={closeImageModal}
        >
          <div 
            className="card"
            style={{
              backgroundColor: colors.card,
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'hidden',
              border: `1px solid ${colors.cardBorder}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary, width: '100%' }}>
              <h5 className="mb-0 form-label-themed" style={{ flex: 1 }}>
                Artikelbild verwalten
              </h5>
              <button
                className="btn btn-link p-0"
                onClick={closeImageModal}
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="card-body" style={{ overflow: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
              <div className="mb-3">
                <label className="form-label form-label-themed">
                  Artikelbild
                </label>
                <div 
                  className="border rounded d-flex align-items-center justify-content-center"
                  style={{
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.secondary,
                    height: '300px',
                    width: '100%',
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    overflow: 'hidden'
                  }}
                  onClick={() => document.getElementById('article-image-input')?.click()}
                  title="Klicken Sie, um ein Bild auszuwählen"
                >
                  {isImageLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <FaSpinner className="fa-spin" style={{ fontSize: '2rem', color: colors.accent }} />
                      <span className="ms-2 form-label-themed">Bild wird geladen...</span>
                    </div>
                  ) : isImageSaving ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <FaSpinner className="fa-spin" style={{ fontSize: '2rem', color: colors.accent }} />
                      <span className="ms-2 form-label-themed">Bild wird gespeichert...</span>
                    </div>
                  ) : articleImage ? (
                    <div className="position-relative w-100 h-100">
                      <img
                        src={articleImage}
                        alt="Artikelbild"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          backgroundColor: colors.secondary
                        }}
                      />
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                      >
                        <div className="text-center text-white">
                          <FaImage style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }} />
                          <div style={{ fontSize: '0.7rem' }}>
                            Bild ändern
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FaImage style={{ fontSize: '2rem', color: colors.cardBorder, marginBottom: '0.5rem' }} />
                      <div className="form-label-themed" style={{ fontSize: '0.8rem' }}>
                        Bild auswählen
                      </div>
                    </div>
                  )}
                </div>
                <input
                  id="article-image-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="card-footer flex justify-between" style={{ 
              backgroundColor: colors.secondary,
              borderTopColor: colors.cardBorder
            }}>
              <button
                type="button"
                className="btn-outline-secondary px-4 py-2 rounded"
                onClick={handleRemoveImage}
                disabled={isImageSaving || isImageLoading || !articleImage}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FaTrash />
                Bild entfernen
              </button>
              <button
                type="button"
                className="btn-outline-primary px-4 py-2 rounded"
                onClick={closeImageModal}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FaTimes />
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nährwert-Suche Modal */}
      {showNutritionSearch && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(2px)'
          }}
          // Modal schließt sich nur bei Auswahl eines Produkts oder Schließen-Button
          // NICHT beim Klick auf das Overlay
        >
          <div style={{ 
            maxWidth: '600px', 
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative',
            zIndex: 100000
          }}>
            <NutritionSearch
              articleName={articleForm.name}
              category={articleForm.category}
              articleId={state.editingArticle?.id}
              initialOpenFoodFactsCode={state.editingArticle?.openFoodFactsCode}
              onNutritionDataFound={handleNutritionDataFound}
              onExtendedDataFound={handleExtendedDataFound}
              onEANCodeFound={(eanCode, type) => {
                if (type === 'content') {
                  setArticleForm(prev => ({ ...prev, contentEanCode: eanCode }));
                } else {
                  setArticleForm(prev => ({ ...prev, bundleEanCode: eanCode }));
                }
              }}
              onOpenFoodFactsCodeFound={(code) => {
                console.log(`✅ Open Food Facts Code gespeichert: ${code}`);
                setArticleForm(prev => ({ ...prev, openFoodFactsCode: code }));
              }}
              onImageDownloaded={async (success) => {
                if (success) {
                  console.log('✅ Produktbild erfolgreich heruntergeladen und gespeichert!');
                  // Artikel-Bild im Modal neu laden, falls Modal geöffnet ist
                  if (showImageModal && currentArticleIdInModal) {
                    try {
                      const imagePath = `pictures/articles/${currentArticleIdInModal}`;
                      const imageData = await storageLayer.loadImage(imagePath);
                      if (imageData) {
                        setArticleImage(imageData.url);
                        console.log('📷 Artikelbild im Modal aktualisiert');
                      }
                    } catch (error) {
                      console.error('❌ Fehler beim Aktualisieren des Artikelbildes:', error);
                    }
                  }
                } else {
                  console.warn('⚠️ Produktbild konnte nicht heruntergeladen werden');
                }
              }}
              colors={colors}
              onClose={() => {
                setShowNutritionSearch(false);
                setEanSearchResult(null);
              }}
              eanSearchResult={eanSearchResult}
            />
          </div>
        </div>
      )}

      {/* Duplikat-Modal */}
      <DuplicateArticleModal
        show={showDuplicateModal}
        onClose={handleDuplicateModalClose}
        onEditExisting={handleEditExistingArticle}
        duplicateMessage={duplicateMessage}
        colors={colors}
      />

      {/* Barcode-Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onCodeDetected={handleBarcodeDetected}
        targetField={scannerTargetField}
        colors={colors}
      />
    </>
  );
};

export default Artikelformular; 