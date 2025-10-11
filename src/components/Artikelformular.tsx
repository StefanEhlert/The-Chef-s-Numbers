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
  FaSpinner
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
  
  const articleNameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State für das ausgewählte Bild-File
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Bild-Upload-Funktion für Artikel
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
      // Speichere das File für späteres Speichern
      setSelectedImageFile(file);
      
      // Bild in Base64 konvertieren und anzeigen
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setArticleImage(imageData);
        console.log('✅ Artikelbild geladen');
      };
      reader.onerror = () => {
        alert('Fehler beim Laden der Bilddatei');
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('❌ Fehler beim Laden des Bildes:', error);
      alert('Fehler beim Laden des Bildes');
    }
  };

  // Bild löschen
  const handleRemoveImage = () => {
    setArticleImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('🗑️ Artikelbild entfernt');
  };

  // Bild aus der Speicherung löschen
  const deleteImageFromStorage = async (articleId: string) => {
    try {
      const imagePath = `pictures/articles/${articleId}`;
      await storageLayer.deleteImage(imagePath);
      console.log('🗑️ Artikelbild aus Speicherung gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Artikelbildes aus Speicherung:', error);
    }
  };

  // Lade gespeichertes Bild beim Öffnen des Modals
  const openImageModal = async () => {
    console.log('🖼️ Öffne Artikel-Bild-Modal');
    
    // Reset States beim Öffnen
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Prüfe ob wir einen Artikel bearbeiten oder einen neuen erstellen
    if (state.editingArticle?.id) {
      try {
        const imagePath = `pictures/articles/${state.editingArticle.id}`;
        const imageData = await storageLayer.loadImage(imagePath);
        if (imageData) {
          setArticleImage(imageData);
          console.log('📷 Gespeichertes Artikelbild geladen');
        } else {
          setArticleImage(null);
          console.log('📷 Kein gespeichertes Artikelbild gefunden');
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden des Artikelbildes:', error);
        setArticleImage(null);
      }
    } else {
      // Neuer Artikel - kein gespeichertes Bild
      setArticleImage(null);
      console.log('🆕 Neuer Artikel - leeres Modal');
    }
    
    setShowImageModal(true);
  };

  const closeImageModal = async () => {
    // Prüfe ob ein gespeichertes Bild gelöscht werden soll
    if (!articleImage && state.editingArticle?.id) {
      // Kein Bild im Modal, aber Artikel existiert → lösche gespeichertes Bild
      console.log('🗑️ Kein Bild im Modal - lösche gespeichertes Bild');
      await deleteImageFromStorage(state.editingArticle.id);
    }
    
    setShowImageModal(false);
    console.log('🖼️ Artikel-Bild-Modal geschlossen');
  };

  // Bild übernehmen (speichert das Bild für späteres Speichern)
  const handleAcceptImage = () => {
    if (articleImage) {
      console.log('✅ Artikelbild übernommen - wird beim Speichern gesichert');
      setShowImageModal(false);
    }
  };

  // Funktion zum Laden des Artikel-Bildes (außerhalb des Modals)
  const loadArticleImage = async () => {
    if (state.editingArticle?.id) {
      try {
        const imagePath = `pictures/articles/${state.editingArticle.id}`;
        const imageData = await storageLayer.loadImage(imagePath);
        if (imageData) {
          setArticleImage(imageData);
          console.log('📷 Gespeichertes Artikelbild neu geladen');
        } else {
          setArticleImage(null);
          console.log('📷 Kein gespeichertes Bild gefunden');
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden des Artikelbildes:', error);
        setArticleImage(null);
      }
    }
  };

  // Bild nach Artikel-Speicherung speichern
  const saveImageAfterArticleSave = async (articleId: string, imageFile: File) => {
    try {
      const imagePath = `pictures/articles/${articleId}`;
      await storageLayer.saveImage(imagePath, imageFile);
      console.log('📷 Artikelbild erfolgreich gespeichert');
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Artikelbildes:', error);
      // Fehler nicht anzeigen, da Artikel bereits gespeichert ist
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
    handleAdditivesDropdownToggle,
    handleAllergensDropdownToggle,

    // Utility-Funktionen
    resetForm,
    setArticleForEditing,

    // Konstanten
    CATEGORIES,
    UNITS,
    ADDITIVES,
    ALLERGENS,
    VAT_RATES
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

  if (!show) return null;

  const handleSave = async () => {
    try {
      // Erstelle Artikel mit Hybrid-ID-System
      const articleToSave: Article = {
        ...articleForm,
        id: editingArticle ? editingArticle.id : UUIDUtils.generateId(), // Frontend-ID (eindeutig)
        dbId: editingArticle?.dbId, // DB-ID falls vorhanden (für Updates)
        isNew: !editingArticle,
        isDirty: true,
        syncStatus: 'pending',
        category: articleForm.category as ArticleCategory, // Type-Assertion für category
        bundleUnit: articleForm.bundleUnit as Unit, // Type-Assertion für bundleUnit
        contentUnit: articleForm.contentUnit as Unit, // Type-Assertion für contentUnit
        nutritionInfo: articleForm.nutrition
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
      
      // Bild nach Artikel-Speicherung speichern oder löschen
      if (articleImage && selectedImageFile) {
        console.log('📤 Starte Bild-Speicherung nach Artikel-Speicherung...', {
          articleId: articleToSave.id,
          hasImage: !!articleImage,
          hasFile: !!selectedImageFile,
          fileName: selectedImageFile.name
        });
        await saveImageAfterArticleSave(articleToSave.id, selectedImageFile);
      } else if (!articleImage) {
        // Kein Bild im Modal → lösche gespeichertes Bild falls vorhanden
        console.log('🗑️ Kein Bild im Modal - lösche gespeichertes Bild nach Artikel-Speicherung');
        await deleteImageFromStorage(articleToSave.id);
      } else {
        console.log('ℹ️ Kein neues Bild zum Speichern vorhanden', {
          hasImage: !!articleImage,
          hasFile: !!selectedImageFile
        });
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
      
      // Duplikat-Prüfung
      if (error.message && error.message.includes('Duplikat')) {
        setDuplicateMessage(error.message);
        setExistingArticle(error.existingArticle);
        setShowDuplicateModal(true);
        return;
      }
      
      // Andere Fehler
      alert(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
    setIsFromRecipeForm(false);
    // Reset Bild-States
    setArticleImage(null);
    setSelectedImageFile(null);
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
         className="position-fixed top-0 start-0 w-100 h-100" 
         style={{
           background: 'rgba(0,0,0,0.5)',
           zIndex: 4000,
           top: 56
         }}
       >
        <div className="container-fluid h-100 p-4">
          <div className="row justify-content-center h-100">
            <div className="col-12 col-xl-6">
              <div className="card" style={{ backgroundColor: colors.card, maxHeight: 'calc(100vh - 120px)' }}>
                <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                  <h5 className="mb-0" style={{ color: colors.text }}>
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
                    <div className="row mb-4">
                      <div className="col-12">
                        <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                          Grunddaten
                        </h6>
                      </div>
                                            <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Artikelname
                        </label>
                        <div className="input-group">
                          <input
                            ref={articleNameRef}
                            type="text"
                            className="form-control"
                            value={articleForm.name}
                            onChange={(e) => handleArticleNameChange(e.target.value)}
                            tabIndex={1}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: !articleForm.name ? colors.accent + '20' : undefined,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="btn"
                            onClick={openImageModal}
                            tabIndex={-1}
                            style={{
                              backgroundColor: 'transparent',
                              color: colors.text,
                              border: `1px solid ${colors.cardBorder}`,
                              borderLeft: 'none',
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
                            title="Artikelbild verwalten"
                          >
                            <FaImage />
                          </button>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Kategorie
                        </label>
                        <div className="position-relative">
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
                            style={{ 
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
                          {showCategoryDropdown && (
                            <div className="position-absolute w-100" style={{
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
                      <div className="col-md-2 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          MwSt-Satz
                        </label>
                        <select
                          className="form-select"
                          value={articleForm.vatRate}
                          onChange={(e) => handleVatRateChange(parseInt(e.target.value))}
                          tabIndex={-1}
                          style={{ 
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
                        >
                          {VAT_RATES.map((vatRate) => (
                            <option key={vatRate.value} value={vatRate.value}>
                              {vatRate.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Lieferant
                        </label>
                        <div className="position-relative">
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
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: !articleForm.supplierId ? colors.accent + '20' : undefined,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />
                          {showSupplierDropdown && (
                            <div className="position-absolute w-100" style={{
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
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Lieferanten-Artikelnummer
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={articleForm.supplierArticleNumber}
                          onChange={(e) => setArticleForm(prev => ({ ...prev, supplierArticleNumber: e.target.value }))}
                          tabIndex={4}
                          style={{ 
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
                      </div>
                    </div>

                    {/* Preise und Einheiten */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                          Preise und Einheiten
                        </h6>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Gebindeeinheit
                        </label>
                        <div className="position-relative">
                          <input
                            type="text"
                            className="form-control"
                            value={articleForm.bundleUnit}
                            onChange={(e) => handleBundleUnitInputChange(e.target.value)}
                            onFocus={() => setShowBundleUnitDropdown(true)}
                            onBlur={handleBundleUnitInputBlur}
                            onKeyDown={handleBundleUnitKeyDown}
                            placeholder="Einheit auswählen oder eingeben..."
                            tabIndex={5}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: !articleForm.bundleUnit ? colors.accent + '20' : undefined,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />
                          {showBundleUnitDropdown && (
                            <div className="position-absolute w-100" style={{
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
                              {bundleUnitSearchTerm && !UNITS.includes(bundleUnitSearchTerm) && (
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
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Gebindepreis
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={bundlePriceInput}
                            onChange={(e) => {
                              setBundlePriceInput(e.target.value);
                              const value = parseFloat(e.target.value.replace(',', '.'));
                              if (!isNaN(value)) {
                                setArticleForm(prev => ({ 
                                  ...prev, 
                                  bundlePrice: value,
                                  pricePerUnit: calculatePricePerUnit(value, prev.content)
                                }));
                                // Aktualisiere auch pricePerUnitInput
                                const newPricePerUnit = calculatePricePerUnit(value, articleForm.content);
                                setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
                              }
                            }}
                            onBlur={() => {
                              // Formatiere als deutsche Zahl mit Komma
                              const formattedValue = (articleForm.bundlePrice || 0).toFixed(2).replace('.', ',');
                              setBundlePriceInput(formattedValue);
                              // Aktualisiere auch pricePerUnitInput
                              const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, articleForm.content);
                              setPricePerUnitInput(newPricePerUnit.toFixed(2).replace('.', ','));
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
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: !articleForm.bundlePrice ? colors.accent + '20' : undefined,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                            required
                            tabIndex={6}
                          />
                          <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                            <FaEuroSign />
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPriceConverter(true)}
                            tabIndex={-1}
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
                            title="Preis umrechnen"
                          >
                            <FaCalculator />
                          </button>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3 ms-auto">
                        <label className="form-label" style={{ color: colors.text }}>
                          Gebinde-EAN
                        </label>
                        <input
                          type="text"
                          className={`form-control ${articleForm.bundleEanCode && !validateEANCode(articleForm.bundleEanCode).isValid ? 'is-invalid' : ''}`}
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
                          style={{ 
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
                    {/* Inhalt und Einheiten */}
                    
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Inhalt
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
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
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: !articleForm.content ? colors.accent + '20' : undefined,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                            required
                            tabIndex={7}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowCalculator(true)}
                            tabIndex={-1}
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
                            title="Taschenrechner"
                          >
                            <FaCalculator />
                          </button>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Inhaltseinheit
                        </label>
                        <div className="position-relative">
                          <input
                            type="text"
                            className="form-control"
                            value={articleForm.contentUnit}
                            onChange={(e) => handleContentUnitInputChange(e.target.value)}
                            onFocus={() => setShowContentUnitDropdown(true)}
                            onBlur={handleContentUnitInputBlur}
                            onKeyDown={handleContentUnitKeyDown}
                            placeholder="Einheit auswählen oder eingeben..."
                            tabIndex={8}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: !articleForm.contentUnit ? colors.accent + '20' : undefined,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />
                          {showContentUnitDropdown && (
                            <div className="position-absolute w-100" style={{
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
                              {contentUnitSearchTerm && !UNITS.includes(contentUnitSearchTerm) && (
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
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          {articleForm.contentUnit ? `Preis je ${articleForm.contentUnit}` : 'Preis je Einheit'}
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
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
                            tabIndex={-1}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: !articleForm.pricePerUnit ? colors.accent + '20' : undefined,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = colors.cardBorder;
                            }}
                          />
                          <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                            €
                          </span>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Inhalt-EAN
                        </label>
                        <input
                          type="text"
                          className={`form-control ${articleForm.contentEanCode && !validateEANCode(articleForm.contentEanCode).isValid ? 'is-invalid' : ''}`}
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
                          style={{ 
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
                    </div>

                    
                    

                    {/* ZusatzstoffeInhaltsstoffe und Allergene */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                          Zusatzstoffe, Inhaltsstoffe und Allergene
                        </h6>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Zusatzstoffe
                        </label>
                        <div className="position-relative ingredients-dropdown-container">
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
                            <div className="position-absolute w-100" style={{
                              top: '100%',
                              left: 0,
                              zIndex: 1000,
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
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Allergene
                        </label>
                        <div className="position-relative allergens-dropdown-container">
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
                            <div className="position-absolute w-100" style={{
                              top: '100%',
                              left: 0,
                              zIndex: 1000,
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
                      <div className="col-12 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Inhaltsstoffe
                        </label>
                        <textarea
                          className="form-control"
                          value={articleForm.ingredients || ''}
                          onChange={(e) => setArticleForm(prev => ({ ...prev, ingredients: e.target.value }))}
                          placeholder="Komplette Liste aller Zutaten (z.B. Weizenmehl, Wasser, Salz, Hefe...)"
                          rows={2}
                          tabIndex={-1}
                          style={{ 
                            borderColor: colors.cardBorder, 
                            color: colors.text,
                            resize: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.cardBorder;
                          }}
                        />
                      </div>
                    </div>

                    {/* Nährwertangaben */}
                    <div className="row mb-4">
                      <div className="col-12">
                                                  <div className="d-flex justify-content-between align-items-center" style={{ borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                            <h6 style={{ color: colors.text, margin: 0 }}>
                              Nährwertangaben (pro 100g/100ml)
                            </h6>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => {
                                console.log('Öffne Nährwert-Suche...');
                                setShowNutritionSearch(true);
                              }}
                              tabIndex={-1}
                              style={{
                                borderColor: colors.primary,
                                color: colors.primary,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.accent;
                                e.currentTarget.style.backgroundColor = colors.accent + '20';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.primary;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <FaSearch className="me-1" />
                              Nährwerte suchen
                            </button>
                          </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Kalorien (kcal)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
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
                          style={{ 
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
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Kilojoule (kJ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={articleForm.nutrition.kilojoules}
                          readOnly
                          tabIndex={-1}
                          style={{ 
                            borderColor: colors.cardBorder, 
                            color: colors.text,
                            backgroundColor: colors.secondary
                          }}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={articleForm.nutrition.protein}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, protein: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                          style={{ 
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
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Fett (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={articleForm.nutrition.fat}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, fat: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                          style={{ 
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
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Kohlenhydrate (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={articleForm.nutrition.carbohydrates}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, carbohydrates: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                          style={{ 
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
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Ballaststoffe (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={articleForm.nutrition.fiber}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, fiber: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                          style={{ 
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
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Zucker (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={articleForm.nutrition.sugar}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, sugar: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                          style={{ 
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
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Salz (g)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={articleForm.nutrition.salt}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            nutrition: { ...prev.nutrition, salt: parseFloat(e.target.value) || 0 }
                          }))}
                          tabIndex={-1}
                          style={{ 
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
                      </div>
                    </div>
                    
                    {/* Notizen */}
                    <div className="mb-4">
                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                        Notizen
                      </h6>
                      <div className="mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Notizen
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={articleForm.notes}
                          onChange={(e) => setArticleForm(prev => ({
                            ...prev,
                            notes: e.target.value
                          }))}
                          placeholder="Zusätzliche Notizen zum Artikel..."
                          tabIndex={-1}
                          style={{ 
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
                      </div>
                    </div>
                  </form>
                </div>
                <div className="card-footer d-flex justify-content-between" style={{ 
                  backgroundColor: colors.secondary,
                  borderTop: 'none',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClose}
                    tabIndex={10}
                    style={{ borderColor: colors.cardBorder }}
                  >
                    <FaArrowLeft className="me-2" />
                    Abbrechen
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={!isFormValid()}
                    tabIndex={9}
                    style={{
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                      opacity: isFormValid() ? 1 : 0.6
                    }}
                  >
                    <FaSave className="me-2" />
                    {editingArticle ? 'Aktualisieren' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taschenrechner-Dialog */}
      {showCalculator && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          top: 56
        }}>
          <div className="container-fluid h-100 p-4">
            <div className="row justify-content-center h-100">
              <div className="col-12 col-md-4 col-lg-3">
                <div className="card" style={{ backgroundColor: colors.card }}>
                  <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                    <h5 className="mb-0" style={{ color: colors.text }}>
                      Taschenrechner
                    </h5>
                    <button
                      className="btn btn-link p-0"
                      onClick={() => setShowCalculator(false)}
                      style={{ color: colors.text, textDecoration: 'none' }}
                    >
                      <FaClose />
                    </button>
                  </div>
                  <div className="card-body">
                    <Calculator onResult={handleCalculatorResult} colors={colors} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preisumrechnungs-Dialog */}
      {showPriceConverter && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          top: 56
        }}>
          <div className="container-fluid h-100 p-4">
            <div className="row justify-content-center h-100">
              <div className="col-12 col-md-6 col-lg-2">
                <div className="card" style={{ backgroundColor: colors.card }}>
                  <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                    <h5 className="mb-0" style={{ color: colors.text }}>
                      Preis umrechnen
                    </h5>
                    <button
                      className="btn btn-link p-0"
                      onClick={() => setShowPriceConverter(false)}
                      style={{ color: colors.text, textDecoration: 'none' }}
                    >
                      <FaClose />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <label className="form-label" style={{ color: colors.text }}>
                        Aktueller Gebindepreis
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={articleForm.bundlePrice.toFixed(2)}
                          readOnly
                          style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                        />
                        <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                          <FaEuroSign />
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label" style={{ color: colors.text }}>
                        MwSt-Satz
                      </label>
                      <select
                        className="form-select"
                        value={selectedVatRate}
                        onChange={(e) => setSelectedVatRate(parseFloat(e.target.value))}
                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                      >
                        <option value={7}>7% (ermäßigt)</option>
                        <option value={19}>19% (regulär)</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label" style={{ color: colors.text }}>
                        Bruttopreis
                      </label>
                      <div className="input-group mb-2">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={calculateGrossPrice(articleForm.bundlePrice, selectedVatRate).toFixed(2)}
                          readOnly
                          style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                        />
                        <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                          <FaEuroSign />
                        </span>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleApplyGrossPrice}
                          style={{
                            backgroundColor: colors.accent,
                            borderColor: colors.accent
                          }}
                          title="Bruttopreis übernehmen"
                        >
                          <FaCheck />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label" style={{ color: colors.text }}>
                        Nettopreis
                      </label>
                      <div className="input-group mb-2">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={calculateNetPrice(articleForm.bundlePrice, selectedVatRate).toFixed(2)}
                          readOnly
                          style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                        />
                        <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                          <FaEuroSign />
                        </span>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleApplyNetPrice}
                          style={{
                            backgroundColor: colors.accent,
                            borderColor: colors.accent
                          }}
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
                      className="btn btn-secondary"
                      onClick={() => setShowPriceConverter(false)}
                      style={{ borderColor: colors.cardBorder }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
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
            <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
              <h5 className="mb-0" style={{ color: colors.text }}>
                Artikelbild verwalten
              </h5>
              <button
                className="btn btn-link p-0"
                onClick={closeImageModal}
                style={{ color: colors.text, textDecoration: 'none' }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="card-body" style={{ overflow: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
              <div className="mb-3">
                <label className="form-label" style={{ color: colors.text }}>
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
                  {articleImage ? (
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
                      <div style={{ fontSize: '0.8rem', color: colors.text }}>
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
            <div className="card-footer d-flex justify-content-between" style={{ 
              backgroundColor: colors.secondary,
              borderTop: 'none'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRemoveImage}
                style={{ borderColor: colors.cardBorder }}
              >
                <FaTrash className="me-1" />
                Bild entfernen
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeImageModal}
                style={{
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                  color: 'white'
                }}
              >
                <FaTimes className="me-1" />
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
               onImageDownloaded={(success) => {
                 if (success) {
                   console.log('✅ Produktbild erfolgreich heruntergeladen und gespeichert!');
                   // Artikel-Bild neu laden
                   loadArticleImage();
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
    </>
  );
};

export default Artikelformular; 