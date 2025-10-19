import React, { useState } from 'react';
import { FaSearch, FaPlus, FaList, FaTh, FaSave, FaSort, FaTrash, FaPencilAlt, FaTimes, FaBoxes, FaCheck } from 'react-icons/fa';
import { Article } from '../types';

interface ArtikelverwaltungProps {
  articles: Article[];
  colors: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSupplier: string;
  setSelectedSupplier: (sup: string) => void;
  sortField: string;
  setSortField: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (dir: 'asc' | 'desc') => void;
  selectedArticles: string[];
  setShowArticleForm: (show: boolean) => void;
  resetArticleForm: () => void;
  setShowImportExportModal: (show: boolean) => void;
  filteredAndSortedArticles: () => Article[];
  getUsedCategories: () => string[];
  getUniqueSuppliers: () => string[];
  handleSelectArticle: (id: string) => void;
  handleSelectAll: () => void;
  handleDeleteArticles: (onProgress?: (current: number, total: number) => void) => void;
  handleBulkPriceChange: (percentage: number, onProgress?: (current: number, total: number) => void) => void;
  handleEditArticle: (article: Article) => void;
  handleDeleteSingleArticle: (id: string, name: string) => void;
  getSupplierName: (id: string) => string;
  formatPrice: (price: number) => string;
}

const Artikelverwaltung: React.FC<ArtikelverwaltungProps> = ({
  articles,
  colors,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  selectedCategory,
  setSelectedCategory,
  selectedSupplier,
  setSelectedSupplier,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  selectedArticles,
  setShowArticleForm,
  resetArticleForm,
  setShowImportExportModal,
  filteredAndSortedArticles,
  getUsedCategories,
  getUniqueSuppliers,
  handleSelectArticle,
  handleSelectAll,
  handleDeleteArticles,
  handleBulkPriceChange,
  handleEditArticle,
  handleDeleteSingleArticle,
  getSupplierName,
  formatPrice
}) => {
  const [percentageValue, setPercentageValue] = useState<string>('');
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const filteredArticles = filteredAndSortedArticles();
  const categories = getUsedCategories();
  const uniqueSuppliers = getUniqueSuppliers();

  // Hilfsfunktion zur Formatierung der Nährwerte
  const formatNutritionInfo = (article: Article) => {
    const nutrition = article.nutritionInfo;
    if (!nutrition) return null;

    const nutritionParts = [];
    
    if (nutrition.calories > 0) {
      nutritionParts.push(`${nutrition.calories} kcal`);
    }
    if (nutrition.protein > 0) {
      nutritionParts.push(`${nutrition.protein}g Protein`);
    }
    if (nutrition.fat > 0) {
      nutritionParts.push(`${nutrition.fat}g Fett`);
    }
    if (nutrition.carbohydrates > 0) {
      nutritionParts.push(`${nutrition.carbohydrates}g KH`);
    }

    return nutritionParts.length > 0 ? nutritionParts.join(', ') : null;
  };

  // Funktion zum Anwenden der Preisänderung mit Fortschrittsanzeige
  const handleApplyPriceChange = async () => {
    const percentage = parseFloat(percentageValue);
    if (!isNaN(percentage) && percentage >= -99 && percentage <= 99) {
      try {
        setBulkProgress({ current: 0, total: selectedArticles.length });
        
        // Kurze Verzögerung damit der initiale State sichtbar wird
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Rufe handleBulkPriceChange mit Progress-Callback auf
        await handleBulkPriceChange(percentage, (current, total) => {
          setBulkProgress({ current, total });
        });
        
        setPercentageValue(''); // Reset input field
        
        // Verstecke Fortschritt nach kurzer Zeit
        setTimeout(() => setBulkProgress(null), 1200);
      } catch (error) {
        console.error('❌ Fehler bei Bulk-Preisänderung:', error);
        setBulkProgress(null);
      }
    }
  };

  // Funktion zum Validieren der Eingabe
  const handlePercentageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    // Erlaube nur Zahlen, Dezimalstellen und Minuszeichen
    if (value === '' || value === '-' || (!isNaN(numValue) && numValue >= -99 && numValue <= 99)) {
      setPercentageValue(value);
    }
  };

  return (
    <div className="container-fluid p-4 pt-0">
      <div style={{
        backgroundColor: colors.paper || colors.card,
        borderRadius: '12px',
        boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
        padding: '2rem',
        minHeight: 'calc(100vh - 120px)',
        border: `1px solid ${colors.cardBorder}`
      }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ color: colors.text, margin: 0 }}>Artikelverwaltung</h1>
          <div className="flex items-center gap-3">
          </div>
        </div>

        {/* Suchleiste und Ansichtswechsel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
          <div className="md:col-span-7">
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
                placeholder="Artikel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                title="Neuer Artikel"
                onClick={() => {
                  resetArticleForm();
                  setShowArticleForm(true);
                }}
              >
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="btn-group w-full" role="group">
              <button
                type="button"
                className="btn"
                onClick={() => setViewMode('list')}
                style={{
                  backgroundColor: viewMode === 'list' ? colors.accent : 'transparent',
                  borderColor: colors.cardBorder,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: viewMode === 'list' ? 'white' : colors.text,
                  borderRadius: viewMode === 'list' ? '0.375rem 0 0 0.375rem' : '0.375rem 0 0 0.375rem'
                }}
              >
                <FaList className="me-1" />
                Liste
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setViewMode('grid')}
                style={{
                  backgroundColor: viewMode === 'grid' ? colors.accent : 'transparent',
                  borderColor: colors.cardBorder,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: viewMode === 'grid' ? 'white' : colors.text,
                  borderRadius: viewMode === 'grid' ? '0 0.375rem 0.375rem 0' : '0 0.375rem 0.375rem 0'
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <div>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                borderColor: colors.cardBorder,
                color: colors.text
              }}
            >
              <option value="">Alle Kategorien</option>
              {categories.map((category, index) => (
                <option key={`category-${index}-${category}`} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="form-select"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              style={{
                borderColor: colors.cardBorder,
                color: colors.text
              }}
            >
              <option value="">Alle Lieferanten</option>
              {uniqueSuppliers.map((supplier, index) => (
                <option key={`supplier-${index}-${supplier}`} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="form-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              style={{
                borderColor: colors.cardBorder,
                color: colors.text
              }}
            >
              <option value="name">Artikel</option>
              <option value="supplier">Lieferant</option>
              <option value="category">Kategorie</option>
              <option value="bundlePrice">Gebindepreis</option>
                                      <option value="pricePerUnit">Inhaltspreis</option>
            </select>
          </div>
          <div>
            <button
              className="btn btn-outline-secondary w-full"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              style={{
                borderColor: colors.cardBorder,
                color: colors.text
              }}
            >
              <FaSort className="me-1" />
              {sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
            </button>
          </div>
        </div>

        {/* Bulk-Aktionen */}
        {selectedArticles.length > 0 && (
          <div className="alert alert-warning mb-3" style={{
            backgroundColor: colors.secondary,
            borderColor: colors.cardBorder,
            color: colors.text,
            paddingBottom: bulkProgress ? '0.75rem' : '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="flex justify-between items-center">
              <span>{selectedArticles.length} Artikel ausgewählt</span>
              <div className="flex items-center gap-4">
                {/* Preisänderung */}
                <div className="flex items-center gap-2">
                  <label className="form-label mb-0 me-2" style={{ color: colors.text, fontSize: '0.875rem' }}>
                    Agio:
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="% (-99 bis 99)"
                    value={percentageValue}
                    onChange={handlePercentageInputChange}
                    style={{
                      width: '120px',
                      borderColor: colors.cardBorder,
                      color: colors.text,
                      backgroundColor: colors.card
                    }}
                    disabled={!!bulkProgress}
                  />
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleApplyPriceChange}
                    disabled={!percentageValue || parseFloat(percentageValue) < -99 || parseFloat(percentageValue) > 99 || !!bulkProgress}
                    title="Preisänderung anwenden"
                  >
                    <FaCheck />
                  </button>
                </div>
                {/* Löschen-Button */}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    try {
                      setBulkProgress({ current: 0, total: selectedArticles.length });
                      
                      // Kurze Verzögerung damit der initiale State sichtbar wird
                      await new Promise(resolve => setTimeout(resolve, 50));
                      
                      // Rufe handleDeleteArticles mit Progress-Callback auf
                      await handleDeleteArticles((current, total) => {
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

        {/* Artikel-Liste */}
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="table table-hover" style={{
              backgroundColor: colors.card,
              borderColor: colors.cardBorder
            }}>
              <thead style={{ backgroundColor: colors.secondary }}>
                <tr>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                      onChange={handleSelectAll}
                      style={{ accentColor: colors.accent }}
                    />
                  </th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Artikel</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Lieferant</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Gebindepreis</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Inhalt</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Preis/Einheit</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article, index) => (
                  <tr 
                    key={article.id || `article-${index}`} 
                    style={{ 
                      borderColor: colors.cardBorder,
                      cursor: 'pointer'
                    }}
                    onDoubleClick={() => handleEditArticle(article)}
                    title="Doppelklick zum Bearbeiten"
                  >
                    <td style={{ borderColor: colors.cardBorder }}>
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article.id)}
                        onChange={() => handleSelectArticle(article.id)}
                        style={{ accentColor: colors.accent }}
                      />
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      <strong>{article.name}</strong>
                      <br />
                        <div className="flex justify-between items-center">
                        <small style={{ color: colors.accent }}>{article.category}</small>
                        {formatNutritionInfo(article) && (
                          <small style={{ color: colors.accent }}>{formatNutritionInfo(article)}</small>
                        )}
                      </div>
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      {getSupplierName(article.supplierId)}
                      {article.supplierArticleNumber && (
                        <>
                          <br />
                          <small style={{ color: colors.accent }}>
                            {article.supplierArticleNumber}
                          </small>
                        </>
                      )}
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      {formatPrice(article.bundlePrice)}
                      <br />
                      <small style={{ color: colors.accent }}>
                        pro {article.bundleUnit}
                      </small>
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      {article.content} {article.contentUnit}
                    </td>
                    <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                      <strong>{formatPrice(article.pricePerUnit)}</strong>
                      <br />
                      <small style={{ color: colors.accent }}>pro {article.contentUnit}</small>
                    </td>
                    <td style={{ borderColor: colors.cardBorder }}>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-link p-0"
                          title="Bearbeiten"
                          style={{
                            color: colors.accent,
                            textDecoration: 'none',
                            fontSize: '14px'
                          }}
                          onClick={() => handleEditArticle(article)}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Löschen"
                          style={{
                            color: '#dc3545',
                            textDecoration: 'none',
                            fontSize: '14px'
                          }}
                          onClick={() => handleDeleteSingleArticle(article.id, article.name)}
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
          /* Kachel-Ansicht */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredArticles.map(article => (
              <div key={article.id} className="mb-3">
                <div 
                  className="card h-full" 
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    cursor: 'pointer'
                  }}
                  onDoubleClick={() => handleEditArticle(article)}
                  title="Doppelklick zum Bearbeiten"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article.id)}
                        onChange={() => handleSelectArticle(article.id)}
                        style={{ accentColor: colors.accent }}
                      />
                      <div className="flex gap-1">
                        <button
                          className="btn btn-link p-0"
                          title="Bearbeiten"
                          style={{
                            color: colors.accent,
                            textDecoration: 'none',
                            fontSize: '12px'
                          }}
                          onClick={() => handleEditArticle(article)}
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
                          onClick={() => handleDeleteSingleArticle(article.id, article.name)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                    <h6 className="card-title" style={{ color: colors.text }}>
                      {article.name}
                    </h6>
                        <div className="flex justify-between items-center">
                      <small style={{ color: colors.accent }}>{article.category}</small>
                      {formatNutritionInfo(article) && (
                        <small style={{ color: colors.accent }}>{formatNutritionInfo(article)}</small>
                      )}
                    </div>
                    <div className="mb-2">
                      <small style={{ color: colors.text }}>
                        <strong>Lieferant:</strong> {getSupplierName(article.supplierId)}
                      </small>
                      {article.supplierArticleNumber && (
                        <>
                          <br />
                          <small style={{ color: colors.accent }}>
                            {article.supplierArticleNumber}
                          </small>
                        </>
                      )}
                    </div>
                    <div className="mb-2">
                      <small style={{ color: colors.text }}>
                        <strong>Gebindepreis:</strong> {formatPrice(article.bundlePrice)}
                      </small>
                      <br />
                      <small style={{ color: colors.accent }}>
                        pro {article.bundleUnit}
                      </small>
                    </div>
                    <div className="mb-2">
                      <small style={{ color: colors.text }}>
                        <strong>Inhalt:</strong> {article.content} {article.contentUnit}
                      </small>
                    </div>
                    <div>
                      <strong style={{ color: colors.accent }}>
                        {formatPrice(article.pricePerUnit)} pro {article.contentUnit}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leere Liste */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-5">
            <FaBoxes style={{ fontSize: '3rem', color: colors.accent, marginBottom: '1rem' }} />
            <h5 style={{ color: colors.text }}>Keine Artikel gefunden</h5>
            <p style={{ color: colors.text }}>
              {searchTerm || selectedCategory || selectedSupplier 
                ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                : 'Erstellen Sie Ihren ersten Artikel mit dem "Neuer Artikel" Button.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Artikelverwaltung;