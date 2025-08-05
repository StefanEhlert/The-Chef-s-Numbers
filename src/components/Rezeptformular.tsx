import React from 'react';
import { FaTimes as FaClose, FaImage, FaSave, FaArrowLeft, FaPlus, FaPencilAlt } from 'react-icons/fa';
import { useRecipeForm } from '../hooks/useRecipeForm';

interface RezeptformularProps {
  articles: any[];
  recipes: any[];
  setRecipes: React.Dispatch<React.SetStateAction<any[]>>;
  setShowArticleForm: (show: boolean) => void;
  setEditingArticle: (article: any) => void;
  formatPrice: (price: number | undefined | null) => string;
  getCurrentColors: () => any;
  showRecipeForm: boolean;
  setShowRecipeForm: (show: boolean) => void;
}

const Rezeptformular: React.FC<RezeptformularProps> = ({
  articles,
  recipes,
  setRecipes,
  setShowArticleForm,
  setEditingArticle,
  formatPrice,
  getCurrentColors,
  showRecipeForm,
  setShowRecipeForm
}) => {
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
    dropdownPosition,

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
    addPreparationStep,
    handlePreparationStepChange,
    handleRecipeImageUpload,
    removePreparationStep,
    handleSaveRecipe,
    formatAdditivesDisplay,
    formatAllergensDisplay,
    calculateKilojoules,
    calculateGrossPrice,
    calculateNetPrice
  } = useRecipeForm({
    articles,
    recipes,
    setRecipes,
    setShowArticleForm,
    setEditingArticle,
    formatPrice,
    showRecipeForm,
    setShowRecipeForm
  });

  if (!showRecipeForm) {
    return null;
  }

  const colors = getCurrentColors();

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100" style={{
      background: 'rgba(0,0,0,0.5)',
      zIndex: 3000,
      top: 56
    }}>
      <div className="container-fluid h-100 p-4">
        <div className="row justify-content-center h-100">
          <div className="col-12 col-xl-6">
            <div className="card" style={{ backgroundColor: colors.card, maxHeight: 'calc(100vh - 120px)' }}>
              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  {editingRecipe ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}
                </h5>
                <button
                  className="btn btn-link p-0"
                  onClick={() => setShowRecipeForm(false)}
                  style={{ color: colors.text, textDecoration: 'none' }}
                >
                  <FaClose />
                </button>
              </div>
              <div className="card-body" style={{ 
                overflowY: 'auto', 
                maxHeight: 'calc(100vh - 180px)',
                paddingBottom: '0',
                borderBottom: 'none'
              }}>
                <form>
                  {/* Grunddaten */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                        Grunddaten
                      </h6>
                    </div>
                    <div className="col-md-7 mb-3">
                      <div className="row" style={{ height: '200px' }}>
                        <div className="col-12 mb-3">
                          <label className="form-label" style={{ color: colors.text }}>
                            Rezeptname *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={recipeForm.name}
                            onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, name: e.target.value }))}
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
                            required
                          />
                        </div>
                        <div className="col-12" style={{ flex: 1 }}>
                          <label className="form-label" style={{ color: colors.text }}>
                            Beschreibung
                          </label>
                          <textarea
                            className="form-control h-100"
                            value={recipeForm.description}
                            onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, description: e.target.value }))}
                            placeholder="Kurze Beschreibung des Rezepts"
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              resize: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5 mb-3">
                      <label className="form-label" style={{ color: colors.text }}>
                        Rezeptbild
                      </label>
                      <div
                        className="border rounded d-flex align-items-center justify-content-center"
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
                        {recipeForm.image ? (
                          <div className="position-relative w-100 h-100">
                            <img
                              src={URL.createObjectURL(recipeForm.image)}
                              alt="Rezeptbild"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                backgroundColor: colors.background
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
                        id="recipe-image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleRecipeImageUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                        Details
                      </h6>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label" style={{ color: colors.text }}>
                        Portionen
                      </label>
                      <input
                        type="number"
                        className="form-control"
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
                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label" style={{ color: colors.text }}>
                        Zeit (Minuten)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={recipeForm.preparationTime}
                        onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, preparationTime: parseInt(e.target.value) || 0 }))}
                        min="1"
                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label" style={{ color: colors.text }}>
                        Schwierigkeit
                      </label>
                      <div 
                        className="form-control d-flex align-items-center justify-content-center"
                        style={{ 
                          borderColor: colors.cardBorder, 
                          color: colors.text,
                          height: 'calc(1.5em + 0.75rem + 2px)',
                          padding: '0'
                        }}
                      >
                        <div className="d-flex gap-1 align-items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              className="btn btn-link p-0"
                              onClick={() => setRecipeForm((prev: any) => ({ ...prev, difficulty: star }))}
                              style={{ 
                                color: star <= recipeForm.difficulty ? '#ffc107' : colors.cardBorder,
                                fontSize: '1.5rem',
                                textDecoration: 'none'
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label" style={{ color: colors.text }}>
                        Energie (kWh)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={recipeForm.energy}
                        onChange={(e) => setRecipeForm((prev: any) => ({ ...prev, energy: parseFloat(e.target.value) || 0 }))}
                        step="0.1"
                        min="0"
                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                      />
                    </div>
                  </div>

                  {/* Kalkulation */}
                  <div className="row mb-4" style={{ minHeight: '250px' }}>
                    <div className="col-12">
                      <div className="d-flex mb-4" style={{ borderBottom: `2px solid ${colors.accent}` }}>
                        {[
                          { key: 'kalkulation', label: 'Kalkulation' },
                          { key: 'inhaltsangaben', label: 'Inhaltsangaben' },
                          { key: 'naehrwerte', label: 'Nährwerte je Portion' }
                        ].map(tab => (
                          <div
                            key={tab.key}
                            className="flex-fill text-center"
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
                        <div className="col-md-4 mb-3">
                          <label className="form-label" style={{ color: colors.text }}>
                            Aufschlag (%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={recipeForm.markupPercentage}
                            onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                            onBlur={(e) => {
                              const roundedValue = Math.round(parseFloat(e.target.value) || 0);
                              setRecipeForm((prev: any) => ({ ...prev, markupPercentage: roundedValue }));
                            }}
                            min="0"
                            step="1"
                            style={{ borderColor: colors.cardBorder, color: colors.text }}
                          />
                        </div>
                        <div className="col-md-4 mb-3 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-end mb-1">
                            <label className="form-label mb-0" style={{ color: colors.text, fontSize: '0.875rem' }}>
                              MwSt. (%)
                            </label>
                            <small style={{ color: colors.accent, fontSize: '0.75rem' }}>
                              {(() => {
                                const values = calculateAllValues();
                                return `${values.vatAmount.toFixed(2)} €`;
                              })()}
                            </small>
                          </div>
                          <div className="mt-auto">
                            <select
                              className="form-control"
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
                              style={{ borderColor: colors.cardBorder, color: colors.text }}
                            >
                              <option value={0}>0%</option>
                              <option value={7}>7%</option>
                              <option value={19}>19%</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label" style={{ color: colors.text }}>
                            Verkaufspreis
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
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
                              style={{ borderColor: colors.cardBorder, color: '#28a745', fontWeight: 'bold' }}
                            />
                            <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                              €
                            </span>
                          </div>
                        </div>
                        {/* Untere Reihe */}
                        {(() => {
                          const values = calculateAllValues();
                          return (
                            <>
                              <div className="col-md-4 mb-3">
                                <label className="form-label" style={{ color: colors.text }}>
                                  Materialkosten
                                </label>
                                <div className="form-control" style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text, 
                                  backgroundColor: colors.secondary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: 'calc(1.5em + 0.75rem + 2px)'
                                }}>
                                  {values.materialCosts.toFixed(2)} €
                                </div>
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label" style={{ color: colors.text }}>
                                  Kosten/Portion
                                </label>
                                <div className="form-control" style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text, 
                                  backgroundColor: colors.secondary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: 'calc(1.5em + 0.75rem + 2px)'
                                }}>
                                  {values.costsPerPortion.toFixed(2)} €
                                </div>
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label" style={{ color: colors.text }}>
                                  Rohertrag
                                </label>
                                <div className="form-control" style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: values.grossProfit < 0 ? '#dc3545' : '#28a745', 
                                  backgroundColor: colors.secondary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: 'calc(1.5em + 0.75rem + 2px)',
                                  fontWeight: 'bold'
                                }}>
                                  {values.grossProfit.toFixed(2)} €
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                    {(activeTab as string) === 'inhaltsangaben' && (
                      <>
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: colors.text }}>
                            Zusatzstoffe
                          </label>
                          <textarea
                            className="form-control"
                            value={getRecipeAdditives().join(', ')}
                            readOnly
                            rows={4}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: colors.paper || colors.card,
                              resize: 'none'
                            }}
                            placeholder="Keine Zutaten hinzugefügt"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: colors.text }}>
                            Allergene
                          </label>
                          <textarea
                            className="form-control"
                            value={getRecipeAllergens().join(', ')}
                            readOnly
                            rows={4}
                            style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text,
                              backgroundColor: colors.paper || colors.card,
                              resize: 'none'
                            }}
                            placeholder="Keine Allergene gefunden"
                          />
                        </div>
                      </>
                    )}
                    {(activeTab as string) === 'naehrwerte' && (
                      <div className="row">
                        <div className="col-12">
                          <div className="row">
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Energie (kcal)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().calories}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Energie (kJ)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().kilojoules}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Fett (g)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().fat}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Kohlenhydrate (g)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().carbohydrates}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Eiweiß (g)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().protein}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Ballaststoffe (g)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().fiber}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Salz (g)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().salt}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                            <div className="col-md-3 mb-3">
                              <label className="form-label" style={{ color: colors.text }}>
                                Zucker (g)
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={calculateRecipeNutrition().sugar}
                                readOnly
                                style={{ 
                                  borderColor: colors.cardBorder, 
                                  color: colors.text,
                                  backgroundColor: colors.paper || colors.card
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Zutaten */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                          Zutaten
                        </h6>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={addIngredient}
                          style={{
                            backgroundColor: colors.accent,
                            borderColor: colors.accent,
                            color: 'white'
                          }}
                        >
                          <FaPlus className="me-1" />
                          Zutat hinzufügen
                        </button>
                      </div>
                      
                      {recipeForm.ingredients.map((ingredient: any, index: number) => (
                        <div key={ingredient.id} className="row mb-3 align-items-end">
                          <div className="col-md-4">
                            <label className="form-label" style={{ color: colors.text }}>
                              Zutat {index + 1}
                            </label>
                            <div className="position-relative">
                              <input
                                type="text"
                                className="form-control"
                                value={ingredient.name}
                                onChange={(e) => handleIngredientInputChange(e.target.value, index)}
                                onFocus={() => handleIngredientFocus(index)}
                                onBlur={handleIngredientInputBlur}
                                onKeyDown={(e) => handleIngredientKeyDown(e, index)}
                                placeholder="Zutat suchen oder neu erstellen..."
                                style={{ borderColor: colors.cardBorder, color: colors.text }}
                              />
                              {showIngredientDropdown && selectedIngredientIndex === index && (
                                <div
                                  className="position-absolute w-100 border rounded"
                                  style={{
                                    top: dropdownPosition.top,
                                    left: dropdownPosition.left,
                                    backgroundColor: colors.card,
                                    borderColor: colors.cardBorder,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    zIndex: 1000
                                  }}
                                >
                                  {getFilteredIngredients().map((item: any, itemIndex: number) => (
                                    <div
                                      key={item.id}
                                      className="px-3 py-2 cursor-pointer"
                                      style={{
                                        backgroundColor: dropdownSelectionIndex === itemIndex ? colors.accent : 'transparent',
                                        color: dropdownSelectionIndex === itemIndex ? 'white' : colors.text,
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={() => setDropdownSelectionIndex(itemIndex)}
                                      onClick={() => handleIngredientSelect(item, index)}
                                    >
                                      {item.name}
                                    </div>
                                  ))}
                                  {ingredientSearchTerm && !getFilteredIngredients().find((item: any) => 
                                    item.name.toLowerCase() === ingredientSearchTerm.toLowerCase()
                                  ) && (
                                    <div
                                      className="px-3 py-2 cursor-pointer border-top"
                                      style={{
                                        backgroundColor: dropdownSelectionIndex === getFilteredIngredients().length ? colors.accent : 'transparent',
                                        color: dropdownSelectionIndex === getFilteredIngredients().length ? 'white' : colors.text,
                                        cursor: 'pointer',
                                        borderColor: colors.cardBorder
                                      }}
                                      onMouseEnter={() => setDropdownSelectionIndex(getFilteredIngredients().length)}
                                      onClick={() => handleCreateNewArticle(ingredientSearchTerm, index)}
                                    >
                                      <FaPlus className="me-2" />
                                      "{ingredientSearchTerm}" erstellen
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label" style={{ color: colors.text }}>
                              Menge
                            </label>
                            <input
                              type="number"
                              className="form-control"
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
                              style={{ borderColor: colors.cardBorder, color: colors.text }}
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label" style={{ color: colors.text }}>
                              Einheit
                            </label>
                            <select
                              className="form-control"
                              value={ingredient.unit}
                              onChange={(e) => {
                                const newIngredients = [...recipeForm.ingredients];
                                newIngredients[index] = {
                                  ...newIngredients[index],
                                  unit: e.target.value
                                };
                                setRecipeForm((prev: any) => ({ ...prev, ingredients: newIngredients }));
                              }}
                              style={{ borderColor: colors.cardBorder, color: colors.text }}
                            >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="l">l</option>
                              <option value="Stück">Stück</option>
                              <option value="EL">EL</option>
                              <option value="TL">TL</option>
                              <option value="Prise">Prise</option>
                            </select>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label" style={{ color: colors.text }}>
                              Preis
                            </label>
                            <div className="form-control" style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text, 
                              backgroundColor: colors.secondary,
                              display: 'flex',
                              alignItems: 'center',
                              height: 'calc(1.5em + 0.75rem + 2px)'
                            }}>
                              {calculateIngredientPrice(ingredient).toFixed(2)} €
                            </div>
                          </div>
                          <div className="col-md-1">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeIngredient(index)}
                              style={{ borderColor: colors.cardBorder, color: colors.text }}
                            >
                              <FaClose />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Zubereitung */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                          Zubereitung
                        </h6>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={addPreparationStep}
                          style={{
                            backgroundColor: colors.accent,
                            borderColor: colors.accent,
                            color: 'white'
                          }}
                        >
                          <FaPlus className="me-1" />
                          Schritt hinzufügen
                        </button>
                      </div>
                      
                      {recipeForm.preparationSteps.map((step: any, index: number) => (
                        <div key={step.id} className="row mb-3 align-items-start">
                          <div className="col-md-1">
                            <div className="form-control text-center" style={{ 
                              borderColor: colors.cardBorder, 
                              color: colors.text, 
                              backgroundColor: colors.secondary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: 'calc(1.5em + 0.75rem + 2px)',
                              fontWeight: 'bold'
                            }}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="col-md-10">
                            <textarea
                              className="form-control"
                              value={step.description}
                              onChange={(e) => handlePreparationStepChange(index, e.target.value)}
                              placeholder={`Schritt ${index + 1} beschreiben...`}
                              rows={2}
                              style={{ 
                                borderColor: colors.cardBorder, 
                                color: colors.text,
                                resize: 'none'
                              }}
                            />
                          </div>
                          <div className="col-md-1">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removePreparationStep(index)}
                              style={{ borderColor: colors.cardBorder, color: colors.text }}
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
              <div className="card-footer d-flex justify-content-end gap-2" style={{ backgroundColor: colors.secondary }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRecipeForm(false)}
                  style={{
                    backgroundColor: colors.cardBorder,
                    borderColor: colors.cardBorder,
                    color: colors.text
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveRecipe}
                  style={{
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                    color: 'white'
                  }}
                >
                  <FaSave className="me-2" />
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rezeptformular; 