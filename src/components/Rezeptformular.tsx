import React, { useEffect, useState } from 'react';
import { FaTimes as FaClose, FaImage, FaSave, FaArrowLeft, FaPlus, FaPencilAlt, FaLock, FaUnlock } from 'react-icons/fa';
import { useRecipeForm } from '../hooks/useRecipeForm';
import { useAppContext } from '../contexts/AppContext';
import { UUIDUtils } from '../utils/uuidUtils';
import { storageLayer } from '../services/storageLayer';
import { Recipe, Unit, Difficulty } from '../types';
import { ADDITIVES, ALLERGENS } from '../hooks/useArticleForm';

interface RezeptformularProps {
  articles: any[];
  recipes: any[];
  setRecipes: React.Dispatch<React.SetStateAction<any[]>>;
  setShowArticleForm: (show: boolean) => void;
  setEditingArticle: (article: any) => void;
  formatPrice: (price: number | undefined | null) => string;
  getCurrentColors: () => any;
  show: boolean;
  onClose: () => void;
  onSave: (recipe: any) => void;
  onReset: () => void;
}

const Rezeptformular: React.FC<RezeptformularProps> = ({
  articles,
  recipes,
  setRecipes,
  setShowArticleForm,
  setEditingArticle,
  formatPrice,
  getCurrentColors,
  show,
  onClose,
  onSave,
  onReset
}) => {
  const { state, dispatch } = useAppContext();
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  
  // Resize-Funktionalität
  const [formWidth, setFormWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const formContainerRef = React.useRef<HTMLDivElement>(null);
  const resizeHandleRef = React.useRef<HTMLDivElement>(null);
  const resizeStartX = React.useRef<number>(0);
  const resizeStartWidth = React.useRef<number>(60);
  
  const FORM_WIDTH_STORAGE_KEY = 'recipeFormWidth';
  
  const loadSavedWidth = (): number => {
    try {
      const saved = localStorage.getItem(FORM_WIDTH_STORAGE_KEY);
      if (saved) {
        const width = parseFloat(saved);
        if (!isNaN(width) && width >= 40 && width <= 90) {
          return width;
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Breite:', error);
    }
    return 60;
  };
  
  const saveWidth = (width: number) => {
    try {
      localStorage.setItem(FORM_WIDTH_STORAGE_KEY, width.toString());
    } catch (error) {
      console.error('Fehler beim Speichern der Breite:', error);
    }
  };
  
  const {
    // States
    editingRecipe,
    setEditingRecipe,
    recipeForm,
    setRecipeForm,
    activeTab,
    setActiveTab,
    sellingPriceInput,
    setSellingPriceInput,
    ingredientSearchTerm,
    showIngredientDropdown,
    selectedIngredientIndex,
    dropdownSelectionIndex,
    setDropdownSelectionIndex,

    // Functions
    resetRecipeForm,
    calculateMaterialCosts,
    handleMarkupChange,
    handleSellingPriceChange,
    calculateGrossProfit,
    calculateAllValues,
    getRecipeAdditives,
    getRecipeAllergens,
    calculateRecipeNutrition,
    getFilteredIngredients,
    handleIngredientSelect,
    calculateIngredientPrice,
    handleIngredientInputChange,
    handleIngredientInputBlur,
    handleIngredientKeyDown,
    handleCreateNewArticle,
    handleIngredientFocus,
    handleEditIngredient,
    addIngredient,
    removeIngredient,
    removeUsedRecipe,
    addPreparationStep,
    handlePreparationStepChange,
    handleRecipeImageUpload,
    removePreparationStep,
    handleSaveRecipe,
    formatAdditivesDisplay,
    formatAllergensDisplay,
    calculateKilojoules,
    calculateGrossPrice,
    calculateNetPrice,
    updateIngredientFromArticle
  } = useRecipeForm({
    articles,
    recipes,
    setRecipes,
    setShowArticleForm,
    setEditingArticle,
    formatPrice
  });

  const colors = getCurrentColors();
  
  // State für Dropdowns (nur Anzeige, nicht editierbar)
  const [showAdditivesDropdown, setShowAdditivesDropdown] = useState(false);
  const [showAllergensDropdown, setShowAllergensDropdown] = useState(false);
  
  // State für editierbares Inhaltsstoffe-Feld
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [ingredientsText, setIngredientsText] = useState('');
  const [autoUpdateIngredients, setAutoUpdateIngredients] = useState(true); // Automatische Aktualisierung aktiviert

  // Aktualisiere Artikeldaten nach der Rückkehr vom Artikelformular
  // WICHTIG: Nur ausführen, wenn sich articles geändert hat (nicht bei jeder ingredients-Änderung!)
  useEffect(() => {
    if (!show || recipeForm.ingredients.length === 0) return;
    
    // Prüfe alle Zutaten und aktualisiere sie mit den aktuellen Artikeldaten
    let hasChanges = false;
    const updatedIngredients = recipeForm.ingredients.map((ingredient, index) => {
      if (!ingredient.name || ingredient.name.trim() === '') {
        return ingredient; // Unverändert
      }
      
      const article = articles.find(a => a.name === ingredient.name);
      if (!article) {
        return ingredient; // Unverändert
      }
      
      // Prüfe, ob die Zutat aktualisiert werden muss
      const needsUpdate = ingredient.unit === 'g' || ingredient.price === 0 || 
                         ingredient.unit !== article.contentUnit || 
                         ingredient.price !== article.pricePerUnit;
      
      if (needsUpdate) {
        hasChanges = true;
        return {
          ...ingredient,
          unit: article.contentUnit || ingredient.unit,
          price: article.pricePerUnit || ingredient.price
        };
      }
      
      return ingredient; // Unverändert
    });
    
    // Nur State aktualisieren, wenn tatsächlich Änderungen vorliegen
    if (hasChanges) {
      setRecipeForm(prev => ({
        ...prev,
        ingredients: updatedIngredients
      }));
    }
  }, [show, articles]); // Entfernt recipeForm.ingredients und updateIngredientFromArticle aus Dependencies!

  // Lade gespeichertes Bild beim Öffnen des Formulares
  useEffect(() => {
    const loadSavedImage = async () => {
      if (show && editingRecipe) {
        try {
          const imagePath = `pictures/recipes/${editingRecipe.id}`;
          const imageData = await storageLayer.loadImage(imagePath);
          if (imageData) {
            setSavedImageUrl(imageData);
            console.log('📷 Gespeichertes Rezeptbild geladen');
          } else {
            setSavedImageUrl(null);
            console.log('📷 Kein gespeichertes Rezeptbild gefunden');
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden des Rezeptbildes:', error);
          setSavedImageUrl(null);
        }
      } else if (show && !editingRecipe) {
        // Neues Rezept - kein gespeichertes Bild
        setSavedImageUrl(null);
      }
    };

    loadSavedImage();
  }, [show, editingRecipe]);

  // Initialisiere Breite beim Öffnen - lade gespeicherte Breite oder verwende 60%
  useEffect(() => {
    if (show && formWidth === null) {
      setIsInitialMount(true);
      const savedWidth = loadSavedWidth();
      setFormWidth(savedWidth);
      const timer = setTimeout(() => {
        setIsInitialMount(false);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!show) {
      setFormWidth(null);
      setIsInitialMount(true);
      // Schließe Dropdowns beim Schließen des Modals
      setShowAdditivesDropdown(false);
      setShowAllergensDropdown(false);
      // Reset Edit-Modus
      setIsEditingIngredients(false);
      setIngredientsText('');
    }
  }, [show, formWidth]);

  // Initialisiere ingredientsText wenn Rezept geladen wird oder Zutaten sich ändern
  useEffect(() => {
    if (!isEditingIngredients && autoUpdateIngredients) {
      const ingredients = new Set<string>();
      
      // Sammle Inhaltsstoffe von Zutaten
      recipeForm.ingredients.forEach(ingredient => {
        if (ingredient.name && ingredient.name.trim() !== '') {
          const article = articles.find(a => a.name === ingredient.name);
          if (article && article.ingredients) {
            const articleIngredients = article.ingredients.split(',').map((ing: string) => ing.trim());
            articleIngredients.forEach((ing: string) => {
              if (ing && ing.length > 0) {
                ingredients.add(ing);
              }
            });
          }
        }
      });

      // Sammle Inhaltsstoffe von verwendeten Rezepten
      recipeForm.usedRecipes.forEach(usedRecipe => {
        const recipe = recipes.find(r => r.id === usedRecipe.recipeId);
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach((recipeIngredient: any) => {
            if (recipeIngredient.name && recipeIngredient.name.trim() !== '') {
              const article = articles.find(a => a.name === recipeIngredient.name);
              if (article && article.ingredients) {
                const articleIngredients = article.ingredients.split(',').map((ing: string) => ing.trim());
                articleIngredients.forEach((ing: string) => {
                  if (ing && ing.length > 0) {
                    ingredients.add(ing);
                  }
                });
              }
            }
          });
        }
      });
      
      // Wenn das Rezept bereits manuell editierte Inhaltsstoffe hat, verwende diese
      const computedIngredients = Array.from(ingredients).sort().join(', ');
      if (recipeForm.ingredientsText && recipeForm.ingredientsText.trim() !== '' && !autoUpdateIngredients) {
        // Wenn automatische Aktualisierung deaktiviert ist, verwende gespeicherten Wert
        setIngredientsText(recipeForm.ingredientsText);
      } else {
        // Wenn automatische Aktualisierung aktiviert ist, berechne neu
        setIngredientsText(computedIngredients);
      }
    } else if (!isEditingIngredients && !autoUpdateIngredients && recipeForm.ingredientsText) {
      // Wenn automatische Aktualisierung deaktiviert ist, verwende gespeicherten Wert
      setIngredientsText(recipeForm.ingredientsText);
    }
  }, [recipeForm.ingredients, recipeForm.usedRecipes, recipeForm.ingredientsText, articles, recipes, isEditingIngredients, autoUpdateIngredients]);

  // Resize-Handling
  useEffect(() => {
    if (!isResizing) return;

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
      
      const newWidth = Math.min(Math.max(resizeStartWidth.current + (deltaWidthPercent * 2), 40), 90);
      
      setFormWidth(newWidth);
      saveWidth(newWidth);
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

  const effectiveWidth = show && formWidth === null ? loadSavedWidth() : formWidth;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartX.current = e.clientX;
    const currentWidth = formWidth !== null ? formWidth : (show ? loadSavedWidth() : 60);
    resizeStartWidth.current = currentWidth;
    setIsResizing(true);
  };

  if (!show) {
    return null;
  }

  const handleSave = async () => {
    if (!recipeForm.name.trim()) {
      alert('Bitte geben Sie einen Namen für das Rezept ein.');
      return;
    }

    try {
      // Entferne leere Zubereitungsschritte vor dem Speichern
      const cleanedPreparationSteps = recipeForm.preparationSteps
        .filter(step => step.description.trim() !== '')
        .map((step, index) => ({ ...step, order: index + 1 }));

      // Entferne nur Zutaten ohne Namen vor dem Speichern (Menge kann 0 sein)
      const cleanedIngredients = recipeForm.ingredients
        .filter(ingredient => ingredient.name && ingredient.name.trim() !== '')
        .map(ingredient => ({
          ...ingredient,
          unit: ingredient.unit as Unit // Type-Assertion für Unit
        }));

      const recipeId = editingRecipe ? editingRecipe.id : UUIDUtils.generateId();
      
      // Erstelle eine Kopie ohne das image-Feld (wird separat gespeichert)
      const { image, ...recipeFormWithoutImage } = recipeForm;
      
      const recipeToSave: Recipe = {
        ...recipeFormWithoutImage,
        preparationSteps: cleanedPreparationSteps,
        ingredients: cleanedIngredients,
        id: recipeId, // Frontend-ID (eindeutig)
        dbId: editingRecipe?.dbId, // DB-ID falls vorhanden (für Updates)
        isNew: !editingRecipe,
        isDirty: true,
        syncStatus: 'pending',
        difficulty: recipeForm.difficulty as Difficulty, // Type-Assertion für Difficulty
        materialCosts: calculateMaterialCosts(),
        totalNutritionInfo: calculateRecipeNutrition(),
        allergens: getRecipeAllergens(),
        ingredientsText: recipeForm.ingredientsText || ingredientsText // Speichere manuell editierte Inhaltsstoffe
        // Keine Timestamps - werden von PostgreSQL automatisch gesetzt (created_at, updated_at)
        // lastModifiedBy wird später implementiert (User-System)
      };

      // Speichere das Rezept
      const success = await storageLayer.save('recipes', [recipeToSave]);

      // Speichere das Bild falls vorhanden
      if (recipeForm.image) {
        try {
          const imagePath = `pictures/recipes/${recipeId}`;
          await storageLayer.saveImage(imagePath, recipeForm.image);
          console.log('📷 Rezeptbild erfolgreich gespeichert');
        } catch (error) {
          console.error('❌ Fehler beim Speichern des Rezeptbildes:', error);
          // Bildfehler soll das Rezept-Speichern nicht verhindern
        }
      }

      if (!success) {
        throw new Error('Fehler beim Speichern des Rezepts');
      }

      // Aktualisiere den globalen State
      if (editingRecipe) {
        dispatch({ type: 'UPDATE_RECIPE', payload: { id: editingRecipe.id, recipe: recipeToSave } });
      } else {
        dispatch({ type: 'ADD_RECIPE', payload: recipeToSave });
      }

      resetRecipeForm();
      setSavedImageUrl(null); // Reset gespeichertes Bild
      
      // Reset global editing state
      if (state.editingRecipe) {
        onReset();
      }
      
      // Schließe das Modal nach dem Speichern
      onClose();
    } catch (error: any) {
      console.error('❌ Fehler beim Speichern des Rezepts:', error);
      alert(`Fehler beim Speichern des Rezepts: ${error.message}`);
    }
  };

  const handleClose = () => {
    onClose();
    resetRecipeForm();
    setSavedImageUrl(null); // Reset gespeichertes Bild
    // Reset global editing state
    if (state.editingRecipe) {
      onReset();
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full" 
      style={{
        background: 'rgba(0,0,0,0.5)',
        zIndex: 3000,
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
                  {editingRecipe ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}
                </h5>
                <button
                  className="btn btn-link p-0"
                  onClick={handleClose}
                  style={{ color: colors.text, textDecoration: 'none' }}
                >
                  <FaClose />
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
                      <div className="w-full md:w-7/12 px-2 mb-3">
                        <div className="flex flex-col" style={{ height: '200px' }}>
                          <div className="mb-3">
                            <label className="form-label form-label-themed">
                              Rezeptname *
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={recipeForm.name}
                              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <label className="form-label form-label-themed">
                              Beschreibung
                            </label>
                            <textarea
                              className="form-control form-control-themed h-full"
                              value={recipeForm.description}
                              onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, description: e.target.value }))}
                              placeholder="Kurze Beschreibung des Rezepts"
                              style={{ resize: 'none' }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-5/12 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Rezeptbild
                        </label>
                        <div
                          className="border rounded flex items-center justify-center"
                          style={{
                            borderColor: colors.cardBorder,
                            backgroundColor: colors.background,
                            height: '200px',
                            width: '100%',
                            cursor: 'pointer',
                            borderStyle: 'dashed',
                            overflow: 'hidden'
                          }}
                          onClick={() => document.getElementById('recipe-image-input')?.click()}
                          title="Klicken Sie, um ein Bild auszuwählen"
                        >
                          {(recipeForm.image || savedImageUrl) ? (
                            <div className="relative w-full h-full">
                              <img
                                src={recipeForm.image ? URL.createObjectURL(recipeForm.image) : savedImageUrl!}
                                alt="Rezeptbild"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  backgroundColor: colors.background
                                }}
                              />
                              <div
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
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
                                    {recipeForm.image ? 'Bild ändern' : 'Neues Bild auswählen'}
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
                          id="recipe-image-input"
                          type="file"
                          accept="image/*"
                          onChange={handleRecipeImageUpload}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Details
                      </h6>
                    </div>
                    <div className="flex flex-wrap -mx-2">
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Portionen
                        </label>
                        <input
                          type="number"
                          className="form-control form-control-themed"
                          value={recipeForm.portions}
                          onChange={(e) => {
                            const newPortions = parseInt(e.target.value) || 0;
                            setRecipeForm((prev: any) => {
                              const updatedForm = { ...prev, portions: newPortions };
                              // Berechne den Aufschlag mit dem neuen Portionen-Wert
                              const materialCosts = calculateMaterialCosts();
                              const costsPerPortion = materialCosts / newPortions;
                              const netSellingPrice = calculateNetPrice(updatedForm.sellingPrice, updatedForm.vatRate);
                              const markup = costsPerPortion > 0 ? Math.round((netSellingPrice / costsPerPortion) * 100) : 0;
                              
                              return { ...updatedForm, markupPercentage: markup };
                            });
                          }}
                          min="1"
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Zeit (Minuten)
                        </label>
                        <input
                          type="number"
                          className="form-control form-control-themed"
                          value={recipeForm.preparationTime}
                          onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, preparationTime: parseInt(e.target.value) || 0 }))}
                          min="1"
                        />
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Schwierigkeit
                        </label>
                        <div className="form-control form-control-themed flex items-center justify-center" style={{ 
                          padding: '0',
                          height: 'calc(1.5em + 0.75rem + 2px)',
                          minHeight: 'calc(1.5em + 0.75rem + 2px)'
                        }}>
                          <div className="flex items-center justify-center" style={{ gap: '0', width: '100%' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                className="btn btn-link"
                                onClick={() => setRecipeForm((prev: any) => ({ ...prev, difficulty: star }))}
                                style={{ 
                                  color: star <= recipeForm.difficulty ? '#ffc107' : colors.cardBorder,
                                  fontSize: '1.7rem',
                                  textDecoration: 'none',
                                  lineHeight: '1',
                                  padding: '0.125rem 0.25rem',
                                  marginLeft: '3px',
                                  marginRight: '3px'
                                }}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-1/4 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Energie (kWh)
                        </label>
                        <input
                          type="number"
                          className="form-control form-control-themed"
                          value={recipeForm.energy}
                          onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, energy: parseFloat(e.target.value) || 0 }))}
                          step="0.1"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kalkulation */}
                  <div className="mb-4" style={{ minHeight: '250px' }}>
                    <div className="w-full">
                      <div className="flex mb-4" style={{ borderBottom: `2px solid ${colors.accent}` }}>
                        {[
                          { key: 'kalkulation', label: 'Kalkulation' },
                          { key: 'inhaltsangaben', label: 'Inhaltsangaben' },
                          { key: 'naehrwerte', label: 'Nährwerte je Portion' }
                        ].map(tab => (
                          <div
                            key={tab.key}
                            className="flex-1 text-center"
                            style={{
                              cursor: 'pointer',
                              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                              color: activeTab === tab.key ? colors.accent : colors.text,
                              borderBottom: activeTab === tab.key ? `2px solid ${colors.accent}` : 'none',
                              padding: '0.5rem 0'
                            }}
                            onClick={() => setActiveTab(tab.key as any)}
                          >
                            {tab.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tab-Inhalte */}
                    {activeTab === 'kalkulation' && (
                      <>
                        {/* Obere Reihe */}
                        <div className="flex flex-wrap -mx-2">
                          <div className="w-full md:w-1/3 px-2 mb-3">
                            <div className="flex justify-between items-center mb-1" style={{ height: '24px' }}>
                              <label className="form-label mb-0 form-label-themed">
                                Aufschlag (%)
                              </label>
                            </div>
                            <input
                              type="number"
                              className="form-control form-control-themed"
                              value={recipeForm.markupPercentage}
                              onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                              onBlur={(e) => {
                                const roundedValue = Math.round(parseFloat(e.target.value) || 0);
                                setRecipeForm((prev: any) => ({ ...prev, markupPercentage: roundedValue }));
                              }}
                              min="0"
                              step="1"
                            />
                          </div>
                          <div className="w-full md:w-1/3 px-2 mb-3">
                            <div className="flex justify-between items-center mb-1" style={{ height: '24px' }}>
                              <label className="form-label mb-0 form-label-themed">
                                MwSt. (%)
                              </label>
                              <small style={{ color: colors.accent, fontSize: '0.75rem' }}>
                                {(() => {
                                  const values = calculateAllValues();
                                  return `${values.vatAmount.toFixed(2)} €`;
                                })()}
                              </small>
                            </div>
                            <select
                              className="form-control form-control-themed"
                              value={recipeForm.vatRate}
                              onChange={(e) => {
                                const newVatRate = parseInt(e.target.value);
                                setRecipeForm((prev: any) => {
                                  const updatedForm = { ...prev, vatRate: newVatRate };
                                  // Berechne den Aufschlag mit dem neuen MwSt-Satz
                                  const materialCosts = calculateMaterialCosts();
                                  const costsPerPortion = materialCosts / updatedForm.portions;
                                  const netSellingPrice = calculateNetPrice(updatedForm.sellingPrice, newVatRate);
                                  const markup = costsPerPortion > 0 ? Math.round((netSellingPrice / costsPerPortion) * 100) : 0;
                                  
                                  return { ...updatedForm, markupPercentage: markup };
                                });
                              }}
                            >
                              <option value={0}>0%</option>
                              <option value={7}>7%</option>
                              <option value={19}>19%</option>
                            </select>
                          </div>
                          <div className="w-full md:w-1/3 px-2 mb-3">
                            <div className="flex justify-between items-center mb-1" style={{ height: '24px' }}>
                              <label className="form-label mb-0 form-label-themed">
                                Verkaufspreis
                              </label>
                              <small style={{ color: '#dc3545', fontSize: '0.75rem' }}>
                                Netto {calculateNetPrice(recipeForm.sellingPrice, recipeForm.vatRate).toFixed(2)} €
                              </small>
                            </div>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control form-control-themed"
                                value={sellingPriceInput}
                                onChange={(e) => {
                                  setSellingPriceInput(e.target.value);
                                  const value = parseFloat(e.target.value.replace(',', '.'));
                                  if (!isNaN(value)) {
                                    setRecipeForm((prev: any) => ({ ...prev, sellingPrice: value }));
                                  }
                                }}
                                onBlur={() => {
                                  setSellingPriceInput(recipeForm.sellingPrice.toFixed(2));
                                  const values = calculateAllValues();
                                  setRecipeForm((prev: any) => ({ ...prev, markupPercentage: values.markup }));
                                }}
                                onFocus={(e) => {
                                  setSellingPriceInput(recipeForm.sellingPrice.toString());
                                  setTimeout(() => e.target.select(), 0);
                                }}
                                min="0"
                                step="0.01"
                                style={{ color: '#28a745', fontWeight: 'bold' }}
                              />
                              <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                                €
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Untere Reihe */}
                        {(() => {
                          const values = calculateAllValues();
                          return (
                            <div className="flex flex-wrap -mx-2">
                              <div className="w-full md:w-1/3 px-2 mb-3">
                                <label className="form-label form-label-themed">
                                  Materialkosten
                                </label>
                                <div className="form-control form-control-themed flex items-center" style={{ 
                                  backgroundColor: colors.secondary,
                                  height: 'calc(1.5em + 0.75rem + 2px)'
                                }}>
                                  {values.materialCosts.toFixed(2)} €
                                </div>
                              </div>
                              <div className="w-full md:w-1/3 px-2 mb-3">
                                <label className="form-label form-label-themed">
                                  Kosten/Portion
                                </label>
                                <div className="form-control form-control-themed flex items-center" style={{ 
                                  backgroundColor: colors.secondary,
                                  height: 'calc(1.5em + 0.75rem + 2px)'
                                }}>
                                  {values.costsPerPortion.toFixed(2)} €
                                </div>
                              </div>
                              <div className="w-full md:w-1/3 px-2 mb-3">
                                <label className="form-label form-label-themed">
                                  Rohertrag
                                </label>
                                <div className="form-control form-control-themed flex items-center" style={{ 
                                  color: values.grossProfit < 0 ? '#dc3545' : '#28a745', 
                                  backgroundColor: colors.secondary,
                                  height: 'calc(1.5em + 0.75rem + 2px)',
                                  fontWeight: 'bold'
                                }}>
                                  {values.grossProfit.toFixed(2)} €
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                    {(activeTab as string) === 'inhaltsangaben' && (
                      <>
                        <div className="flex flex-wrap -mx-2">
                          <div className="w-full md:w-5/12 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Zusatzstoffe
                            </label>
                            <div className="relative ingredients-dropdown-container">
                              <div 
                                className="form-control form-control-themed" 
                                onClick={() => setShowAdditivesDropdown(!showAdditivesDropdown)}
                                style={{ 
                                  borderColor: colors.cardBorder,
                                  color: colors.text,
                                  cursor: 'pointer',
                                  minHeight: '38px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: colors.paper || colors.card
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
                                  color: getRecipeAdditives().length > 0 ? colors.text : colors.text + '80'
                                }}>
                                  {formatAdditivesDisplay(getRecipeAdditives())}
                                </span>
                                <span style={{ marginLeft: 'auto', color: colors.text + '60' }}>
                                  {showAdditivesDropdown ? '▲' : '▼'}
                                </span>
                              </div>
                              {showAdditivesDropdown && (
                                <div className="additives-dropdown absolute w-full" style={{
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
                                  {ADDITIVES.map((additive, index) => {
                                    const recipeAdditives = getRecipeAdditives();
                                    const isChecked = recipeAdditives.includes(additive);
                                    return (
                                      <div key={`additive-${index}-${additive}`} className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`recipe-additive-${index}-${additive}`}
                                          checked={isChecked}
                                          disabled
                                          readOnly
                                          style={{ accentColor: colors.accent, cursor: 'not-allowed', opacity: 0.6 }}
                                        />
                                        <label 
                                          className="form-check-label" 
                                          htmlFor={`recipe-additive-${index}-${additive}`} 
                                          style={{ color: colors.text, fontSize: '0.9rem', cursor: 'default' }}
                                        >
                                          {additive}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="w-full md:w-5/12 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Allergene
                            </label>
                            <div className="relative allergens-dropdown-container">
                              <div 
                                className="form-control form-control-themed" 
                                onClick={() => setShowAllergensDropdown(!showAllergensDropdown)}
                                style={{ 
                                  borderColor: colors.cardBorder,
                                  color: colors.text,
                                  cursor: 'pointer',
                                  minHeight: '38px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: colors.paper || colors.card
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
                                  color: getRecipeAllergens().length > 0 ? colors.text : colors.text + '80'
                                }}>
                                  {formatAllergensDisplay(getRecipeAllergens())}
                                </span>
                                <span style={{ marginLeft: 'auto', color: colors.text + '60' }}>
                                  {showAllergensDropdown ? '▲' : '▼'}
                                </span>
                              </div>
                              {showAllergensDropdown && (
                                <div className="allergens-dropdown absolute w-full" style={{
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
                                  {ALLERGENS.map((allergen, index) => {
                                    const recipeAllergens = getRecipeAllergens();
                                    const isChecked = recipeAllergens.includes(allergen);
                                    return (
                                      <div key={`allergen-${index}-${allergen}`} className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`recipe-allergen-${index}-${allergen}`}
                                          checked={isChecked}
                                          disabled
                                          readOnly
                                          style={{ accentColor: colors.accent, cursor: 'not-allowed', opacity: 0.6 }}
                                        />
                                        <label 
                                          className="form-check-label" 
                                          htmlFor={`recipe-allergen-${index}-${allergen}`} 
                                          style={{ color: colors.text, fontSize: '0.9rem', cursor: 'default' }}
                                        >
                                          {allergen}
                                        </label>
                                      </div>
                                    );
                                  })}
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
                                className="form-control form-control-themed form-control-static"
                                value={(() => {
                                  const alcoholValue = recipeForm.alcohol || recipeForm.totalNutritionInfo?.alcohol || '';
                                  console.log('🍷 [Rezeptformular] Alkoholwert für Anzeige:', {
                                    'recipeForm.alcohol': recipeForm.alcohol,
                                    'recipeForm.totalNutritionInfo?.alcohol': recipeForm.totalNutritionInfo?.alcohol,
                                    'final value': alcoholValue,
                                    'recipeForm': recipeForm
                                  });
                                  return alcoholValue;
                                })()}
                                readOnly
                                placeholder="0.00"
                                tabIndex={-1}
                              />
                              <span className="input-group-text" style={{ backgroundColor: colors.secondary, color: colors.text }}>
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <label className="form-label form-label-themed mb-0">
                              Inhaltsstoffe
                            </label>
                            <div className="flex gap-2 items-center">
                              {!isEditingIngredients ? (
                                <button
                                  type="button"
                                  className="btn btn-link btn-action"
                                  onClick={() => setIsEditingIngredients(true)}
                                  title="Inhaltsstoffe bearbeiten"
                                >
                                  <FaPencilAlt />
                                </button>
                              ) : null}
                              {!isEditingIngredients && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-action"
                                  onClick={() => setAutoUpdateIngredients(!autoUpdateIngredients)}
                                  title={autoUpdateIngredients ? "Automatische Aktualisierung deaktivieren" : "Automatische Aktualisierung aktivieren"}
                                  style={{ 
                                    color: autoUpdateIngredients ? colors.accent : colors.text + '80'
                                  }}
                                >
                                  {autoUpdateIngredients ? <FaUnlock /> : <FaLock />}
                                </button>
                              )}
                              {isEditingIngredients && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-link btn-action"
                                    onClick={() => {
                                      setRecipeForm((prev: any) => ({ ...prev, ingredientsText: ingredientsText }));
                                      setIsEditingIngredients(false);
                                      setAutoUpdateIngredients(false); // Automatisch sperren beim Speichern
                                    }}
                                    title="Änderungen speichern"
                                  >
                                    <FaSave />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-link btn-action btn-danger"
                                    onClick={() => {
                                      setIsEditingIngredients(false);
                                      // Setze Text zurück auf berechneten Wert
                                      const ingredients = new Set<string>();
                                      recipeForm.ingredients.forEach(ingredient => {
                                        if (ingredient.name && ingredient.name.trim() !== '') {
                                          const article = articles.find(a => a.name === ingredient.name);
                                          if (article && article.ingredients) {
                                            const articleIngredients = article.ingredients.split(',').map((ing: string) => ing.trim());
                                            articleIngredients.forEach((ing: string) => {
                                              if (ing && ing.length > 0) {
                                                ingredients.add(ing);
                                              }
                                            });
                                          }
                                        }
                                      });
                                      recipeForm.usedRecipes.forEach(usedRecipe => {
                                        const recipe = recipes.find(r => r.id === usedRecipe.recipeId);
                                        if (recipe && recipe.ingredients) {
                                          recipe.ingredients.forEach((recipeIngredient: any) => {
                                            if (recipeIngredient.name && recipeIngredient.name.trim() !== '') {
                                              const article = articles.find(a => a.name === recipeIngredient.name);
                                              if (article && article.ingredients) {
                                                const articleIngredients = article.ingredients.split(',').map((ing: string) => ing.trim());
                                                articleIngredients.forEach((ing: string) => {
                                                  if (ing && ing.length > 0) {
                                                    ingredients.add(ing);
                                                  }
                                                });
                                              }
                                            }
                                          });
                                        }
                                      });
                                      setIngredientsText(Array.from(ingredients).sort().join(', '));
                                    }}
                                    title="Änderungen verwerfen"
                                  >
                                    <FaClose />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <textarea
                            className="form-control form-control-themed"
                            value={ingredientsText}
                            onChange={(e) => setIngredientsText(e.target.value)}
                            readOnly={!isEditingIngredients}
                            rows={isEditingIngredients ? 4 : 1}
                            style={{ 
                              backgroundColor: isEditingIngredients ? colors.input : (colors.paper || colors.card),
                              resize: isEditingIngredients ? 'vertical' : 'none',
                              cursor: isEditingIngredients ? 'text' : 'default'
                            }}
                            placeholder={isEditingIngredients ? "Inhaltsstoffe eingeben (kommagetrennt)" : "Keine Zutaten hinzugefügt"}
                          />
                        </div>
                      </>
                    )}
                    {(activeTab as string) === 'naehrwerte' && (
                      <div className="w-full">
                        <div className="flex flex-wrap -mx-2">
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Energie (kcal)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().calories}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Energie (kJ)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().kilojoules}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Fett (g)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().fat}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Kohlenhydrate (g)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().carbohydrates}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Eiweiß (g)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().protein}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Ballaststoffe (g)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().fiber}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Salz (g)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().salt}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                          <div className="w-full md:w-1/4 px-2 mb-3">
                            <label className="form-label form-label-themed">
                              Zucker (g)
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-themed"
                              value={calculateRecipeNutrition().sugar}
                              readOnly
                              style={{ 
                                backgroundColor: colors.paper || colors.card
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Verwendete Rezepte */}
                  {recipeForm.usedRecipes && recipeForm.usedRecipes.length > 0 && (
                    <div className="mb-4">
                      <div className="w-full">
                        <h6 className="form-label-themed section-header">
                          Verwendete Rezepte
                        </h6>
                        
                        {recipeForm.usedRecipes.map((usedRecipe: any, index: number) => (
                          <div key={usedRecipe.id} className="flex items-center mb-3">
                            <div className="w-full md:w-5/12 mr-3">
                              <div className="form-control form-control-themed flex items-center" style={{ 
                                backgroundColor: colors.secondary,
                                height: 'calc(1.5em + 0.75rem + 2px)'
                              }}>
                                {usedRecipe.name}
                              </div>
                            </div>
                            <div className="w-full md:w-2/12 mr-3">
                              <input
                                type="number"
                                className="form-control form-control-themed"
                                value={usedRecipe.portions}
                                onChange={(e) => {
                                  const newPortions = parseFloat(e.target.value) || 0;
                                  const newUsedRecipes = [...recipeForm.usedRecipes];
                                  newUsedRecipes[index] = {
                                    ...newUsedRecipes[index],
                                    portions: newPortions,
                                    totalCost: newPortions * newUsedRecipes[index].costPerPortion
                                  };
                                  setRecipeForm((prev: any) => ({ ...prev, usedRecipes: newUsedRecipes }));
                                }}
                                step="0.1"
                                min="0"
                                placeholder="Portionen"
                              />
                            </div>
                            <div className="w-full md:w-2/12 mr-3">
                              <div className="form-control form-control-themed flex items-center" style={{ 
                                backgroundColor: colors.secondary,
                                height: 'calc(1.5em + 0.75rem + 2px)'
                              }}>
                                Portionen
                              </div>
                            </div>
                            <div className="w-full md:w-2/12 mr-3">
                              <div className="form-control form-control-themed flex items-center" style={{ 
                                backgroundColor: colors.secondary,
                                height: 'calc(1.5em + 0.75rem + 2px)'
                              }}>
                                {usedRecipe.totalCost.toFixed(2)} €
                              </div>
                            </div>
                            <div className="w-full md:w-1/12 flex justify-end items-center">
                              <button
                                type="button"
                                className="btn btn-link btn-action btn-danger"
                                title="Löschen"
                                onClick={() => removeUsedRecipe(index)}
                                tabIndex={-1}
                              >
                                <FaClose />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zutaten */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Zutaten
                      </h6>
                      
                      {recipeForm.ingredients.map((ingredient: any, index: number) => {
                        // Prüfe, ob die Zutat Nährwertangaben hat
                        const article = articles.find(a => a.name === ingredient.name);
                        const hasNutritionInfo = article && article.nutritionInfo && (
                          (article.nutritionInfo.calories > 0) ||
                          (article.nutritionInfo.protein > 0) ||
                          (article.nutritionInfo.fat > 0) ||
                          (article.nutritionInfo.carbohydrates > 0)
                        );
                        
                        // Bestimme den Hintergrund basierend auf Tab und Nährwertangaben
                        // Ignoriere leere Zeilen (Zutaten ohne Namen)
                        const backgroundColor = (activeTab === 'naehrwerte' && !hasNutritionInfo && ingredient.name && ingredient.name.trim() !== '') 
                          ? '#EE799F' // Helles Rot für fehlende Nährwertangaben
                          : 'transparent';
                        
                        return (
                          <div key={ingredient.id} className="flex items-center mb-3" style={{ backgroundColor }}>
                            <div className="w-full md:w-5/12 mr-3">
                              <div className="relative">
                                <input
                                  type="text"
                                  className="form-control form-control-themed"
                                  value={ingredient.name}
                                  onChange={(e) => handleIngredientInputChange(e.target.value, index)}
                                  onFocus={() => handleIngredientFocus(index)}
                                  onBlur={handleIngredientInputBlur}
                                  onKeyDown={(e) => handleIngredientKeyDown(e, index)}
                                  placeholder="Zutat suchen oder neu erstellen..."
                                />
                                {showIngredientDropdown && selectedIngredientIndex === index && (
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
                                    {getFilteredIngredients().length > 0 ? (
                                      getFilteredIngredients().map((item: any, itemIndex: number) => (
                                        <div
                                          key={item.id}
                                          className="dropdown-item"
                                          onClick={() => handleIngredientSelect(item, index)}
                                          style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: dropdownSelectionIndex === itemIndex ? colors.accent + '20' : 'transparent',
                                            color: colors.text,
                                            fontSize: '0.9rem',
                                            borderBottom: itemIndex < getFilteredIngredients().length - 1 ? `1px solid ${colors.cardBorder}` : 'none'
                                          }}
                                          onMouseEnter={() => setDropdownSelectionIndex(itemIndex)}
                                        >
                                          {item.displayName || item.name}
                                        </div>
                                      ))
                                    ) : (
                                      <div style={{ padding: '8px 12px', color: colors.textSecondary, fontSize: '0.9rem' }}>
                                        Keine Zutaten gefunden
                                      </div>
                                    )}
                                    
                                    {/* Option für neue Zutat */}
                                    {ingredientSearchTerm && !getFilteredIngredients().find((item: any) => 
                                      item.name.toLowerCase() === ingredientSearchTerm.toLowerCase()
                                    ) && (
                                      <div
                                        className="dropdown-item"
                                        onClick={() => handleCreateNewArticle(ingredientSearchTerm, index)}
                                        style={{
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          backgroundColor: dropdownSelectionIndex === getFilteredIngredients().length ? colors.accent + '20' : 'transparent',
                                          color: colors.accent,
                                          fontSize: '0.9rem',
                                          fontWeight: '500',
                                          borderTop: `2px solid ${colors.cardBorder}`,
                                          borderBottom: `1px solid ${colors.cardBorder}`
                                        }}
                                        onMouseEnter={() => {
                                          if (dropdownSelectionIndex !== getFilteredIngredients().length) {
                                            setDropdownSelectionIndex(getFilteredIngredients().length);
                                          }
                                        }}
                                        onMouseLeave={() => {
                                          if (dropdownSelectionIndex !== getFilteredIngredients().length) {
                                            setDropdownSelectionIndex(-1);
                                          }
                                        }}
                                      >
                                        <FaPlus style={{ marginRight: '8px', fontSize: '0.8rem' }} />
                                        "{ingredientSearchTerm}" erstellen
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="w-full md:w-2/12 mr-3">
                              <input
                                type="number"
                                className="form-control form-control-themed"
                                value={ingredient.amount}
                                onChange={(e) => {
                                  const newIngredients = [...recipeForm.ingredients];
                                  newIngredients[index] = {
                                    ...newIngredients[index],
                                    amount: parseFloat(e.target.value) || 0
                                  };
                                  setRecipeForm((prev: any) => ({ ...prev, ingredients: newIngredients }));
                                }}
                                step="0.1"
                                min="0"
                                placeholder="Menge"
                              />
                            </div>
                            <div className="w-full md:w-2/12 mr-3">
                              <div className="form-control form-control-themed flex items-center" style={{ 
                                backgroundColor: colors.secondary,
                                height: 'calc(1.5em + 0.75rem + 2px)'
                              }}>
                                {ingredient.unit}
                              </div>
                            </div>
                            <div className="w-full md:w-2/12 mr-3">
                              <div className="form-control form-control-themed flex items-center" style={{ 
                                backgroundColor: colors.secondary,
                                height: 'calc(1.5em + 0.75rem + 2px)'
                              }}>
                                {calculateIngredientPrice(ingredient).toFixed(2)} €
                              </div>
                            </div>
                            <div className="w-full md:w-1/12 flex justify-end items-center gap-1">
                              {articles.find(a => a.name === ingredient.name) && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-action"
                                  title="Bearbeiten"
                                  onClick={() => handleEditIngredient(index)}
                                  tabIndex={-1}
                                >
                                  <FaPencilAlt />
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-link btn-action btn-danger"
                                title="Löschen"
                                onClick={() => removeIngredient(index)}
                                tabIndex={-1}
                              >
                                <FaClose />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zubereitung */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Zubereitung
                      </h6>
                      
                      {recipeForm.preparationSteps.map((step: any, index: number) => (
                        <div key={step.id} className="flex items-start mb-3">
                          <div className="w-full md:w-1/12 mr-3">
                            <div className="form-control form-control-themed text-center flex items-center justify-center" style={{ 
                              backgroundColor: colors.secondary,
                              height: 'calc(1.5em + 0.75rem + 2px)',
                              fontWeight: 'bold'
                            }}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="w-full md:w-10/12 mr-3">
                            <textarea
                              className="form-control form-control-themed"
                              value={step.description}
                              onChange={(e) => handlePreparationStepChange(index, e.target.value)}
                              placeholder={`Schritt ${index + 1} beschreiben...`}
                              rows={2}
                              style={{ resize: 'none' }}
                            />
                          </div>
                          <div className="w-full md:w-1/12 flex justify-end items-start">
                            <button
                              type="button"
                              className="btn btn-link btn-action btn-danger"
                              title="Löschen"
                              onClick={() => removePreparationStep(index)}
                              tabIndex={-1}
                            >
                              <FaClose />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
              <div 
                className="card-footer flex justify-between" 
                style={{ 
                  backgroundColor: colors.secondary,
                  borderTop: 'none',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}
              >
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleClose}
                >
                  <FaArrowLeft className="mr-2" />
                  Abbrechen
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleSave}
                  disabled={!recipeForm.name}
                >
                  <FaSave className="mr-2" />
                  {editingRecipe ? 'Änderungen speichern' : 'Rezept speichern'}
                </button>
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
    </div>
  );
};

export default Rezeptformular; 