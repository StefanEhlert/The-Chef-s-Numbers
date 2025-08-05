import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaDownload, FaTimes, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { nutritionAPI, NutritionData, ExtendedProductData } from '../services/nutritionAPI';

interface NutritionSearchProps {
  articleName: string;
  category?: string;
  onNutritionDataFound: (nutritionData: NutritionData) => void;
  onExtendedDataFound?: (extendedData: ExtendedProductData) => void;
  colors: any;
  onClose: () => void;
}

interface SuggestionItem {
  name: string;
  brand?: string;
  nutritionData: NutritionData;
  code: string;
}

interface ExtendedSuggestionItem {
  name: string;
  brand?: string;
  extendedData: ExtendedProductData;
  code: string;
}

const NutritionSearch: React.FC<NutritionSearchProps> = ({
  articleName,
  category,
  onNutritionDataFound,
  onExtendedDataFound,
  colors,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState(category || '');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [extendedSuggestions, setExtendedSuggestions] = useState<ExtendedSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useExtendedData, setUseExtendedData] = useState(true); // Standardmäßig erweiterte Daten verwenden
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatische Suche beim Laden der Komponente
  useEffect(() => {
    if (category && category.trim()) {
      // Verwende nur die Kategorie als Suchbegriff
      handleSearch(category.trim());
    }
  }, [category]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setExtendedSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      if (useExtendedData && onExtendedDataFound) {
        // Erweiterte Suche mit Allergenen und Zusatzstoffen
        const extendedResults = await nutritionAPI.getSuggestionsExtended(query);
        setExtendedSuggestions(extendedResults);
        setSuggestions([]);
      } else {
        // Standard-Suche nur für Nährwerte
        const results = await nutritionAPI.getSuggestions(query);
        setSuggestions(results);
        setExtendedSuggestions([]);
      }
      setShowSuggestions(true);
    } catch (error) {
      console.error('Fehler bei der Nährwert-Suche:', error);
      setSuggestions([]);
      setExtendedSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setSelectedIndex(-1);

    // Debounce für die Suche
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    onNutritionDataFound(suggestion.nutritionData);
    onClose();
  };

  const handleExtendedSuggestionSelect = (suggestion: ExtendedSuggestionItem) => {
    if (onExtendedDataFound) {
      onExtendedDataFound(suggestion.extendedData);
    } else {
      onNutritionDataFound(suggestion.extendedData.nutritionData);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentSuggestions = useExtendedData && onExtendedDataFound ? extendedSuggestions : suggestions;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < currentSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
        if (useExtendedData && onExtendedDataFound) {
          handleExtendedSuggestionSelect(extendedSuggestions[selectedIndex]);
        } else {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
      } else if (currentSuggestions.length > 0) {
        if (useExtendedData && onExtendedDataFound) {
          handleExtendedSuggestionSelect(extendedSuggestions[0]);
        } else {
          handleSuggestionSelect(suggestions[0]);
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.nutrition-search-container')) {
      return;
    }
    setShowSuggestions(false);
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside as any);
    return () => {
      document.removeEventListener('click', handleClickOutside as any);
    };
  }, []);

  const currentSuggestions = useExtendedData && onExtendedDataFound ? extendedSuggestions : suggestions;

  return (
    <div className="nutrition-search-container position-relative">
      <div className="card" style={{ 
        backgroundColor: colors.cardBackground, 
        borderColor: colors.cardBorder,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="card-header d-flex justify-content-between align-items-center" 
             style={{ backgroundColor: colors.cardHeader, borderColor: colors.cardBorder }}>
          <h6 className="mb-0" style={{ color: colors.text }}>
            <FaSearch className="me-2" />
            Nährwertdaten suchen
          </h6>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            style={{ filter: colors.text === '#ffffff' ? 'invert(1)' : 'none' }}
          />
        </div>
        
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label" style={{ color: colors.text }}>
              Suchbegriff
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Kategorie eingeben..."
                style={{ 
                  borderColor: colors.cardBorder, 
                  color: colors.text,
                  backgroundColor: colors.inputBackground || colors.cardBackground
                }}
              />
              {isLoading && (
                <span className="input-group-text">
                  <FaSpinner className="fa-spin" />
                </span>
              )}
            </div>
            {category && (
              <small className="text-muted" style={{ color: colors.textSecondary }}>
                Suche nach Kategorie: "{category}"
              </small>
            )}
          </div>

          {/* Option für erweiterte Daten */}
          {onExtendedDataFound && (
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="useExtendedData"
                  checked={useExtendedData}
                  onChange={(e) => {
                    setUseExtendedData(e.target.checked);
                    if (searchTerm.trim()) {
                      handleSearch(searchTerm);
                    }
                  }}
                  style={{ accentColor: colors.accent }}
                />
                <label className="form-check-label" htmlFor="useExtendedData" style={{ color: colors.text }}>
                  <FaCheckCircle className="me-1" style={{ color: colors.accent }} />
                  Allergene und Zusatzstoffe mit übernehmen
                </label>
              </div>
              <small className="text-muted" style={{ color: colors.textSecondary }}>
                Wenn aktiviert, werden auch Allergene und Zusatzstoffe aus der Open Food Facts Datenbank übernommen.
              </small>
            </div>
          )}

          {showSuggestions && currentSuggestions.length > 0 && (
            <div className="suggestions-container">
              <h6 className="mb-2" style={{ color: colors.text }}>
                Gefundene Produkte:
              </h6>
              <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {currentSuggestions.map((suggestion, index) => {
                  const isExtended = useExtendedData && onExtendedDataFound && 'extendedData' in suggestion;
                  const extendedData = isExtended ? (suggestion as ExtendedSuggestionItem).extendedData : null;
                  
                  return (
                    <button
                      key={suggestion.code}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${
                        index === selectedIndex ? 'active' : ''
                      }`}
                      onClick={() => {
                        if (isExtended) {
                          handleExtendedSuggestionSelect(suggestion as ExtendedSuggestionItem);
                        } else {
                          handleSuggestionSelect(suggestion as SuggestionItem);
                        }
                      }}
                      style={{
                        backgroundColor: index === selectedIndex ? colors.primary : colors.cardBackground,
                        borderColor: colors.cardBorder,
                        color: index === selectedIndex ? '#ffffff' : colors.text
                      }}
                    >
                      <div className="flex-grow-1">
                        <div className="fw-bold">{suggestion.name}</div>
                        {suggestion.brand && (
                          <small style={{ opacity: 0.7 }}>
                            Marke: {suggestion.brand}
                          </small>
                        )}
                        {isExtended && extendedData && (
                          <div className="mt-1">
                            {extendedData.originalAllergens && extendedData.originalAllergens.length > 0 && (
                              <div className="small">
                                <FaExclamationTriangle className="me-1" style={{ color: '#dc3545' }} />
                                Allergene: {extendedData.originalAllergens.slice(0, 3).join(', ')}
                                {extendedData.originalAllergens.length > 3 && '...'}
                              </div>
                            )}
                            {extendedData.originalAdditives && extendedData.originalAdditives.length > 0 && (
                              <div className="small">
                                <FaCheckCircle className="me-1" style={{ color: colors.accent }} />
                                Zusatzstoffe: {extendedData.originalAdditives.slice(0, 3).join(', ')}
                                {extendedData.originalAdditives.length > 3 && '...'}
                              </div>
                            )}
                            {extendedData.originalIngredients && extendedData.originalIngredients.length > 0 && (
                              <div className="small">
                                <FaDownload className="me-1" style={{ color: '#6c757d' }} />
                                Zutaten: {extendedData.originalIngredients.length > 50 
                                  ? extendedData.originalIngredients.substring(0, 50) + '...' 
                                  : extendedData.originalIngredients}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="small">
                          {isExtended ? extendedData?.nutritionData.calories : (suggestion as SuggestionItem).nutritionData.calories} kcal
                        </div>
                        <div className="small">
                          P: {isExtended ? extendedData?.nutritionData.protein : (suggestion as SuggestionItem).nutritionData.protein}g | 
                          F: {isExtended ? extendedData?.nutritionData.fat : (suggestion as SuggestionItem).nutritionData.fat}g | 
                          KH: {isExtended ? extendedData?.nutritionData.carbohydrates : (suggestion as SuggestionItem).nutritionData.carbohydrates}g
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showSuggestions && currentSuggestions.length === 0 && !isLoading && searchTerm.trim() && (
            <div className="alert alert-info" style={{ 
              backgroundColor: colors.infoBackground || '#d1ecf1', 
              borderColor: colors.infoBorder || '#bee5eb',
              color: colors.infoText || '#0c5460'
            }}>
              <FaSearch className="me-2" />
              Keine Produkte gefunden. Versuchen Sie einen anderen Suchbegriff.
            </div>
          )}

          <div className="mt-3">
            <small className="text-muted">
              <FaDownload className="me-1" />
              Daten von Open Food Facts
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionSearch; 