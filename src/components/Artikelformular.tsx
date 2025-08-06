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
  FaSearch
} from 'react-icons/fa';
import { useArticleForm, Supplier } from '../hooks/useArticleForm';
import { useAppContext } from '../contexts/AppContext';
import { suggestCategory } from '../utils/helpers';
import { categoryManager } from '../utils/categoryManager';
import NutritionSearch from './NutritionSearch';
import Calculator from './Calculator';
import { NutritionData, ExtendedProductData } from '../services/nutritionAPI';

interface ArtikelformularProps {
  show: boolean;
  onClose: () => void;
  colors: any;
  suppliers: Supplier[];
  articles: any[];
  onSave: (article: any) => void;
  onReset: () => void;
  onNewSupplier?: (supplierName: string) => void;
}

const Artikelformular: React.FC<ArtikelformularProps> = ({
  show,
  onClose,
  colors,
  suppliers,
  articles,
  onSave,
  onReset,
  onNewSupplier
}) => {
  const { state, dispatch } = useAppContext();
  const [showNutritionSearch, setShowNutritionSearch] = useState(false);
  const [isFromRecipeForm, setIsFromRecipeForm] = useState(false);
  const articleNameRef = useRef<HTMLInputElement>(null);
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

    // Setters
    setArticleForm,
    setBundlePriceInput,
    setContentInput,
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

  // Synchronisiere mit dem globalen editingArticle State
  useEffect(() => {
    if (state.editingArticle) {
      setArticleForEditing(state.editingArticle);
      setIsFromRecipeForm(false);
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

  const handleSave = () => {
    const articleToSave = {
      ...articleForm,
      id: editingArticle ? editingArticle.id : Date.now().toString(),
      nutritionInfo: articleForm.nutrition
    };
    onSave(articleToSave);
    resetForm();
    
    // Reset global editing state
    if (state.editingArticle) {
      onReset();
    }
    
    // Schließe das Modal nach dem Speichern
    onClose();
    
    // Wenn der Artikel aus dem Rezeptformular erstellt wurde, kehre dorthin zurück
    if (isFromRecipeForm) {
      // Öffne das Rezeptformular wieder
      dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: true });
      dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: false });
      setIsFromRecipeForm(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
    setIsFromRecipeForm(false);
    // Reset global editing state
    if (state.editingArticle) {
      onReset();
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
                          Artikelname *
                        </label>
                                                 <input
                           ref={articleNameRef}
                           type="text"
                           className="form-control"
                           value={articleForm.name}
                           onChange={(e) => handleArticleNameChange(e.target.value)}
                           style={{ borderColor: colors.cardBorder, color: colors.text }}
                           required
                         />
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
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                                      key={category}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                      <div className="col-md-6 mb-3">
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
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                                    key={unit}
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
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Gebindepreis *
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
                                  pricePerUnit: calculatePricePerUnit(value, prev.content, prev.isGrossPrice, prev.vatRate)
                                }));
                              }
                            }}
                            onBlur={() => {
                              setBundlePriceInput(articleForm.bundlePrice.toFixed(2));
                            }}
                            onFocus={(e) => {
                              setBundlePriceInput(articleForm.bundlePrice.toString());
                              setTimeout(() => e.target.select(), 0);
                            }}
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
                            required
                          />
                          <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                            <FaEuroSign />
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPriceConverter(true)}
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
                            title="Preis umrechnen"
                          >
                            <FaCalculator />
                          </button>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Inhalt *
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
                                  pricePerUnit: calculatePricePerUnit(prev.bundlePrice, value, prev.isGrossPrice, prev.vatRate)
                                }));
                              }
                            }}
                            onBlur={() => {
                              setContentInput(articleForm.content.toFixed(2));
                            }}
                            onFocus={(e) => {
                              setContentInput(articleForm.content.toString());
                              setTimeout(() => e.target.select(), 0);
                            }}
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowCalculator(true)}
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
                            title="Taschenrechner"
                          >
                            <FaCalculator />
                          </button>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
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
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                                    key={unit}
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
                      <div className="col-md-4 mb-3">
                        <label className="form-label" style={{ color: colors.text }}>
                          Preis pro Einheit
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={articleForm.pricePerUnit.toFixed(2)}
                            readOnly
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: colors.secondary
                            }}
                          />
                          <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                            €/{articleForm.contentUnit || 'Einheit'}
                          </span>
                        </div>
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
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              cursor: 'pointer',
                              minHeight: '38px',
                              display: 'flex',
                              alignItems: 'center'
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
                              {ADDITIVES.map(additive => (
                                <div key={additive} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`additive-${additive}`}
                                    checked={articleForm.additives.includes(additive)}
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
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              cursor: 'pointer',
                              minHeight: '38px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ 
                              fontSize: '0.9rem',
                              color: articleForm.allergens.length > 0 ? colors.text : colors.text + '80'
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
                              {ALLERGENS.map(allergen => (
                                <div key={allergen} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`allergen-${allergen}`}
                                    checked={articleForm.allergens.includes(allergen)}
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
                          style={{ 
                            borderColor: colors.cardBorder, 
                            color: colors.text,
                            resize: 'none'
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
                              style={{
                                borderColor: colors.primary,
                                color: colors.primary
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                          style={{ borderColor: colors.cardBorder, color: colors.text }}
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
                    style={{ borderColor: colors.cardBorder }}
                  >
                    <FaArrowLeft className="me-2" />
                    Abbrechen
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={!articleForm.name || !articleForm.bundlePrice || !articleForm.content}
                    style={{
                      backgroundColor: colors.accent,
                      borderColor: colors.accent
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
          zIndex: 3000,
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
          zIndex: 3000,
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNutritionSearch(false);
            }
          }}
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
               onNutritionDataFound={handleNutritionDataFound}
               onExtendedDataFound={handleExtendedDataFound}
               colors={colors}
               onClose={() => setShowNutritionSearch(false)}
             />
          </div>
        </div>
      )}
    </>
  );
};

export default Artikelformular; 