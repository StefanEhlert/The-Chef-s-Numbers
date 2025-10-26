import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaList, FaTh, FaSort, FaTrash, FaPencilAlt, FaPrint, FaTimes, FaUtensils, FaSave } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';
import { Recipe } from '../types';
import { setButtonColors } from '../utils/cssVariables';

interface RezeptverwaltungProps {
  recipes: Recipe[];
  recipeSearchTerm: string;
  setRecipeSearchTerm: (term: string) => void;
  recipeViewMode: 'list' | 'grid';
  setRecipeViewMode: (mode: 'list' | 'grid') => void;
  recipeSortBy: 'name' | 'portions' | 'costPerPortion' | 'sellingPrice' | 'energy' | 'timestamp';
  setRecipeSortBy: (sortBy: 'name' | 'portions' | 'costPerPortion' | 'sellingPrice' | 'energy' | 'timestamp') => void;
  recipeSortOrder: 'asc' | 'desc';
  setRecipeSortOrder: (order: 'asc' | 'desc') => void;
  selectedRecipes: string[];
  getCurrentColors: () => any;
  setShowImportExportModal: (show: boolean) => void;
  handleSelectRecipe: (recipeId: string) => void;
  handleSelectAllRecipes: () => void;
  handleDeleteRecipes: (onProgress?: (current: number, total: number) => void) => void;
  handleDeleteSingleRecipe: (recipeId: string, recipeName: string) => void;
  formatPrice: (price: number | undefined | null) => string;
  filteredAndSortedRecipes: () => Recipe[];
  articles: any[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  setShowArticleForm: (show: boolean) => void;
  setEditingArticle: (article: any) => void;
}

const Rezeptverwaltung: React.FC<RezeptverwaltungProps> = ({
  recipes,
  recipeSearchTerm,
  setRecipeSearchTerm,
  recipeViewMode,
  setRecipeViewMode,
  recipeSortBy,
  setRecipeSortBy,
  recipeSortOrder,
  setRecipeSortOrder,
  selectedRecipes,
  getCurrentColors,
  setShowImportExportModal,
  handleSelectRecipe,
  handleSelectAllRecipes,
  handleDeleteRecipes,
  handleDeleteSingleRecipe,
  formatPrice,
  filteredAndSortedRecipes,
  articles,
  setRecipes,
  setShowArticleForm,
  setEditingArticle
}) => {
  const { dispatch } = useAppContext();
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const handleEditRecipe = (recipe: any) => {
    console.log('🎯 handleEditRecipe called with:', recipe);
    dispatch({ type: 'SET_EDITING_RECIPE', payload: recipe });
    dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: true });
  };

  const handleNewRecipe = () => {
    dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
    dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: true });
  };

  const colors = getCurrentColors();
  const filteredRecipes = filteredAndSortedRecipes();

  // Setze CSS Custom Properties für Button-Farben
  useEffect(() => {
    setButtonColors(colors);
  }, [colors]);

  return (
    <div className="container-fluid p-4 pt-0">
      <div className="rezeptverwaltung" style={{
        backgroundColor: colors.paper || colors.card,
        borderRadius: '12px',
        boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
        padding: '2rem',
        minHeight: 'calc(100vh - 120px)',
        border: `1px solid ${colors.cardBorder}`
      }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ color: colors.text, margin: 0 }}>Rezeptverwaltung</h1>
        </div>

        {/* Suchleiste und Filter */}
        <div className="card mb-3">
          <div className="card-body">
            {/* Suchleiste und Ansichtswechsel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
              <div className="md:col-span-7">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rezepte suchen..."
                    value={recipeSearchTerm}
                    onChange={(e) => setRecipeSearchTerm(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-input"
                    title="Neues Rezept"
                    onClick={handleNewRecipe}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="btn-group w-full" role="group">
                  <button
                    type="button"
                    className={`btn ${recipeViewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setRecipeViewMode('list')}
                    style={{
                      backgroundColor: recipeViewMode === 'list' ? colors.accent : 'transparent',
                      borderColor: recipeViewMode === 'list' ? colors.accent : colors.cardBorder,
                      color: recipeViewMode === 'list' ? 'white' : colors.text,
                      borderRadius: '0.375rem 0 0 0.375rem'
                    }}
                  >
                    <FaList className="me-1" />
                    Liste
                  </button>
                  <button
                    type="button"
                    className={`btn ${recipeViewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setRecipeViewMode('grid')}
                    style={{
                      backgroundColor: recipeViewMode === 'grid' ? colors.accent : 'transparent',
                      borderColor: recipeViewMode === 'grid' ? colors.accent : colors.cardBorder,
                      color: recipeViewMode === 'grid' ? 'white' : colors.text,
                      borderRadius: '0 0.375rem 0.375rem 0'
                    }}
                  >
                    <FaTh className="me-1" />
                    Kacheln
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="btn btn-outline-primary w-full"
                  onClick={() => setShowImportExportModal(true)}
                  style={{
                    borderColor: colors.accent,
                    color: colors.accent
                  }}
                >
                  <FaSave className="me-1" />
                  Import/Export
                </button>
              </div>
            </div>

            {/* Filter und Sortierung */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <select
                  className="form-select"
                  value={recipeSortBy}
                  onChange={(e) => setRecipeSortBy(e.target.value as any)}
                  style={{
                    borderColor: colors.cardBorder,
                    color: colors.text
                  }}
                >
                  <option value="name">Name</option>
                  <option value="portions">Portionen</option>
                  <option value="costPerPortion">Kosten/Portion</option>
                  <option value="sellingPrice">Verkaufspreis</option>
                  <option value="energy">Kalorien</option>
                  <option value="timestamp">Zeitstempel</option>
                </select>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-outline-secondary no-hover w-full"
                  onClick={() => setRecipeSortOrder(recipeSortOrder === 'asc' ? 'desc' : 'asc')}
                  style={{
                    borderColor: colors.cardBorder,
                    color: colors.text
                  }}
                >
                  <FaSort className="me-1" />
                  {recipeSortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
              </div>
              <div className="md:col-span-2 text-end">
                <span style={{ color: colors.text }}>
                  {filteredRecipes.length} Rezept{filteredRecipes.length !== 1 ? 'e' : ''} gefunden
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk-Aktionen */}
        {selectedRecipes.length > 0 && (
          <div className="alert alert-warning mb-3" style={{
            backgroundColor: colors.secondary,
            borderColor: colors.cardBorder,
            color: colors.text,
            paddingBottom: bulkProgress ? '0.75rem' : '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="flex justify-between items-center">
              <span>{selectedRecipes.length} Rezept{selectedRecipes.length !== 1 ? 'e' : ''} ausgewählt</span>
              <button
                className="btn btn-danger btn-sm"
                onClick={async () => {
                  try {
                    setBulkProgress({ current: 0, total: selectedRecipes.length });
                    
                    // Kurze Verzögerung damit der initiale State sichtbar wird
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Rufe handleDeleteRecipes mit Progress-Callback auf
                    await handleDeleteRecipes((current, total) => {
                      setBulkProgress({ current, total });
                    });
                    
                    // Verstecke Fortschritt nach kurzer Zeit
                    setTimeout(() => setBulkProgress(null), 1200);
                  } catch (error) {
                    console.error('❌ Fehler beim Bulk-Löschen:', error);
                    setBulkProgress(null);
                  }
                }}
                disabled={!!bulkProgress}
              >
                <FaTrash className="me-1" />
                Löschen
              </button>
            </div>
            
            {/* Dezenter Fortschrittsbalken */}
            {bulkProgress && (
              <div 
                className="position-absolute bottom-0 start-0 end-0"
                style={{
                  height: '4px',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  borderBottomLeftRadius: '4px',
                  borderBottomRightRadius: '4px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
                    backgroundColor: colors.accent,
                    transition: 'width 0.2s ease-out',
                    boxShadow: `0 0 10px ${colors.accent}`,
                    minWidth: bulkProgress.current > 0 ? '2%' : '0%'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Rezept-Liste */}
        {recipeViewMode === 'list' ? (
          <div className="card">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table table-hover modern-table mb-0">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedRecipes.length === filteredRecipes.length && filteredRecipes.length > 0}
                          onChange={handleSelectAllRecipes}
                          className="form-check-input"
                        />
                      </th>
                      <th>Rezept</th>
                      <th>Portionen</th>
                      <th>Kosten/Portion</th>
                      <th>Verkaufspreis</th>
                      <th>Kalorien</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipes.map(recipe => (
                      <tr 
                        key={recipe.id} 
                        className="table-row-clickable"
                        onDoubleClick={() => handleEditRecipe(recipe)}
                        title="Doppelklick zum Bearbeiten"
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRecipes.includes(recipe.id)}
                            onChange={() => handleSelectRecipe(recipe.id)}
                            className="form-check-input"
                          />
                        </td>
                        <td>
                          <div className="recipe-info">
                            <div className="recipe-name">{recipe.name}</div>
                            {recipe.description && (
                              <div className="recipe-description">{recipe.description}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="recipe-portions">{recipe.portions}</div>
                        </td>
                        <td>
                          <div className="recipe-cost">
                            <div className="price-main">{formatPrice(recipe.materialCosts / recipe.portions)}</div>
                          </div>
                        </td>
                        <td>
                          <div className="recipe-price">
                            <div className="price-main price-highlight">{formatPrice(recipe.sellingPrice)}</div>
                          </div>
                        </td>
                        <td>
                          <div className="recipe-calories">
                            <div className="calories-value">{recipe.totalNutritionInfo?.calories || 0}</div>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-link btn-action"
                              onClick={() => handleEditRecipe(recipe)}
                              title="Bearbeiten"
                            >
                              <FaPencilAlt />
                            </button>
                            <button
                              className="btn btn-link btn-action"
                              title="Drucken"
                              onClick={() => {
                                // TODO: Druckfunktionalität implementieren
                                console.log('Drucken für Rezept:', recipe.name);
                              }}
                            >
                              <FaPrint />
                            </button>
                            <button
                              className="btn btn-link btn-action btn-danger"
                              title="Löschen"
                              onClick={() => handleDeleteSingleRecipe(recipe.id, recipe.name)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // Grid-Ansicht
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="mb-3">
                <div 
                  className="card h-full" 
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    cursor: 'pointer'
                  }}
                  onDoubleClick={() => handleEditRecipe(recipe)}
                  title="Doppelklick zum Bearbeiten"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedRecipes.includes(recipe.id)}
                          onChange={() => handleSelectRecipe(recipe.id)}
                          style={{ accentColor: colors.accent }}
                        />
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          className="btn btn-link p-0"
                          title="Bearbeiten"
                          style={{
                            color: colors.accent,
                            textDecoration: 'none',
                            fontSize: '12px'
                          }}
                          onClick={() => handleEditRecipe(recipe)}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Löschen"
                          style={{
                            color: '#dc3545',
                            textDecoration: 'none',
                            fontSize: '12px'
                          }}
                          onClick={() => handleDeleteSingleRecipe(recipe.id, recipe.name)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                    <h6 className="card-title" style={{ color: colors.text }}>
                      {recipe.name}
                    </h6>
                    {recipe.description && (
                      <p className="card-text small" style={{ color: colors.accent }}>
                        {recipe.description}
                      </p>
                    )}
                    {(recipe.updatedAt || recipe.createdAt) && (() => {
                      const timestamp = recipe.updatedAt || recipe.createdAt;
                      if (!timestamp) return null;
                      const date = new Date(timestamp);
                      return (
                        <p className="card-text small" style={{ color: colors.accent, fontSize: '0.7rem' }}>
                          {recipe.updatedAt ? 'zuletzt geändert' : 'erstellt'} am {date.toLocaleDateString('de-DE')} um {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} von {recipe.lastModifiedBy || 'Benutzer'}
                        </p>
                      );
                    })()}
                    <div className="row text-center">
                      <div className="col-6">
                        <small style={{ color: colors.text }}>Portionen</small>
                        <div style={{ color: colors.accent, fontWeight: 'bold' }}>{recipe.portions}</div>
                      </div>
                      <div className="col-6">
                        <small style={{ color: colors.text }}>Kosten/Portion</small>
                        <div style={{ color: colors.accent, fontWeight: 'bold' }}>{formatPrice(recipe.materialCosts / recipe.portions)}</div>
                      </div>
                    </div>
                    <div className="row text-center mt-2">
                      <div className="col-6">
                        <small style={{ color: colors.text }}>Verkaufspreis</small>
                        <div style={{ color: colors.accent, fontWeight: 'bold' }}>{formatPrice(recipe.sellingPrice)}</div>
                      </div>
                      <div className="col-6">
                        <small style={{ color: colors.text }}>Kalorien</small>
                        <div style={{ color: colors.accent, fontWeight: 'bold' }}>{recipe.totalNutritionInfo?.calories || 0} kcal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leere Liste */}
        {filteredRecipes.length === 0 && (
          <div className="text-center py-5">
            <FaUtensils style={{ fontSize: '3rem', color: colors.accent, marginBottom: '1rem' }} />
            <h5 style={{ color: colors.text }}>Keine Rezepte gefunden</h5>
            <p style={{ color: colors.text }}>
              {recipeSearchTerm 
                ? 'Versuchen Sie andere Suchkriterien.'
                : 'Erstellen Sie Ihr erstes Rezept mit dem "Neues Rezept" Button.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rezeptverwaltung; 