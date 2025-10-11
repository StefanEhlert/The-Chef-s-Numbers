import React, { useState } from 'react';
import { FaSearch, FaPlus, FaList, FaTh, FaSort, FaTrash, FaPencilAlt, FaPrint, FaTimes, FaUtensils, FaSave } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';
import { Recipe } from '../types';

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

  return (
    <div className="container-fluid p-4">
      <div style={{
        backgroundColor: colors.paper || colors.card,
        borderRadius: '12px',
        boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
        padding: '2rem',
        minHeight: 'calc(100vh - 120px)',
        border: `1px solid ${colors.cardBorder}`
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 style={{ color: colors.text, margin: 0 }}>Rezeptverwaltung</h1>
        </div>

        {/* Suchleiste und Ansichtswechsel */}
        <div className="row mb-3">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text" style={{
                backgroundColor: colors.secondary,
                borderColor: colors.cardBorder,
                color: colors.text
              }}>
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Rezepte suchen..."
                value={recipeSearchTerm}
                onChange={(e) => setRecipeSearchTerm(e.target.value)}
                style={{
                  borderColor: colors.cardBorder,
                  color: colors.text
                }}
              />
              <button
                className="btn btn-primary"
                style={{
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                  color: 'white'
                }}
                title="Neues Rezept"
                onClick={handleNewRecipe}
              >
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="col-md-3">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${recipeViewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setRecipeViewMode('list')}
                style={{
                  backgroundColor: recipeViewMode === 'list' ? colors.accent : 'transparent',
                  borderColor: colors.cardBorder,
                  color: recipeViewMode === 'list' ? 'white' : colors.text
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
                  borderColor: colors.cardBorder,
                  color: recipeViewMode === 'grid' ? 'white' : colors.text
                }}
              >
                <FaTh className="me-1" />
                Kacheln
              </button>
            </div>
          </div>
          <div className="col-md-2">
            <button
              type="button"
              className="btn btn-outline-primary w-100"
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
        <div className="row mb-3">
          <div className="col-md-3">
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
          <div className="col-md-2">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
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
          <div className="col-md-7 text-end">
            <span style={{ color: colors.text }}>
              {filteredRecipes.length} Rezept{filteredRecipes.length !== 1 ? 'e' : ''} gefunden
            </span>
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
            <div className="d-flex justify-content-between align-items-center">
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
          <div className="table-responsive">
            <table className="table table-hover" style={{
              backgroundColor: colors.card,
              borderColor: colors.cardBorder
            }}>
              <thead style={{ backgroundColor: colors.secondary }}>
                <tr>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '5%' }}>
                    <input
                      type="checkbox"
                      checked={selectedRecipes.length === filteredRecipes.length && filteredRecipes.length > 0}
                      onChange={handleSelectAllRecipes}
                      style={{ accentColor: colors.accent }}
                    />
                  </th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '35%' }}>Rezept</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '10%' }}>Portionen</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '15%' }}>Kosten/Portion</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '15%' }}>Verkaufspreis</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '10%' }}>Kalorien</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '10%' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.map(recipe => (
                  <tr 
                    key={recipe.id} 
                    style={{ 
                      borderColor: colors.cardBorder,
                      cursor: 'pointer'
                    }}
                    onDoubleClick={() => handleEditRecipe(recipe)}
                    title="Doppelklick zum Bearbeiten"
                  >
                    <td style={{ borderColor: colors.cardBorder }}>
                      <input
                        type="checkbox"
                        checked={selectedRecipes.includes(recipe.id)}
                        onChange={() => handleSelectRecipe(recipe.id)}
                        style={{ accentColor: colors.accent }}
                      />
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      <div>
                        <strong>{recipe.name}</strong>
                        <br />
                        <small style={{ color: colors.accent }}>{recipe.description}</small>
                        {(recipe.updatedAt || recipe.createdAt) && (() => {
                          const timestamp = recipe.updatedAt || recipe.createdAt;
                          if (!timestamp) return null;
                          const date = new Date(timestamp);
                          return (
                            <small style={{ color: colors.accent, fontSize: '0.75rem' }}>
                              {recipe.updatedAt ? 'zuletzt geändert' : 'erstellt'} am {date.toLocaleDateString('de-DE')} um {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} von {recipe.lastModifiedBy || 'Benutzer'}
                            </small>
                          );
                        })()}
                      </div>
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      {recipe.portions}
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      <strong>{formatPrice(recipe.materialCosts / recipe.portions)}</strong>
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      <strong>{formatPrice(recipe.sellingPrice)}</strong>
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      <strong>{recipe.totalNutritionInfo?.calories || 0}</strong>
                    </td>
                    <td style={{ borderColor: colors.cardBorder }}>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-link p-0"
                          onClick={() => handleEditRecipe(recipe)}
                          title="Bearbeiten"
                          style={{
                            color: colors.accent,
                            textDecoration: 'none',
                            fontSize: '14px'
                          }}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Drucken"
                          style={{
                            color: colors.accent,
                            textDecoration: 'none',
                            fontSize: '14px'
                          }}
                          onClick={() => {/* TODO: Druckfunktion */}}
                        >
                          <FaPrint />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Löschen"
                          style={{
                            color: colors.accent,
                            textDecoration: 'none',
                            fontSize: '14px'
                          }}
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
        ) : (
          // Grid-Ansicht
          <div className="row">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="col-md-4 col-lg-3 mb-4">
                <div className="card h-100" style={{
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  cursor: 'pointer'
                }}
                onDoubleClick={() => handleEditRecipe(recipe)}
                title="Doppelklick zum Bearbeiten"
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title mb-0" style={{ color: colors.text }}>
                        {recipe.name}
                      </h6>
                      <input
                        type="checkbox"
                        checked={selectedRecipes.includes(recipe.id)}
                        onChange={() => handleSelectRecipe(recipe.id)}
                        style={{ accentColor: colors.accent }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <p className="card-text small" style={{ color: colors.accent }}>
                      {recipe.description}
                    </p>
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
                  <div className="card-footer" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}>
                    <div className="d-flex justify-content-between">
                      <button
                        className="btn btn-link p-0"
                        onClick={() => handleEditRecipe(recipe)}
                        title="Bearbeiten"
                        style={{
                          color: colors.accent,
                          textDecoration: 'none',
                          fontSize: '12px'
                        }}
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        className="btn btn-link p-0"
                        title="Drucken"
                        style={{
                          color: colors.accent,
                          textDecoration: 'none',
                          fontSize: '12px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          /* TODO: Druckfunktion */
                        }}
                      >
                        <FaPrint />
                      </button>
                      <button
                        className="btn btn-link p-0"
                        title="Löschen"
                        style={{
                          color: colors.accent,
                          textDecoration: 'none',
                          fontSize: '12px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingleRecipe(recipe.id, recipe.name);
                        }}
                      >
                        <FaTimes />
                      </button>
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