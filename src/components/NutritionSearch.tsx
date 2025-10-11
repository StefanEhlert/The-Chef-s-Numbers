/**
 * NutritionSearch Component
 * 
 * Durchsucht die Open Food Facts Datenbank nach Produkten und lädt automatisch:
 * - Nährwertdaten (Kalorien, Protein, Fett, Kohlenhydrate, etc.)
 * - Allergene und Zusatzstoffe (optional)
 * - EAN-Codes (optional)
 * - Produktbilder (optional, größte verfügbare Auflösung)
 * 
 * Intelligente Modi (automatische Erkennung):
 * 1. EAN-Code-Modus: Wenn eanSearchResult vorhanden → zeigt EAN-Ergebnis
 * 2. Gespeichertes Produkt: Wenn initialOpenFoodFactsCode vorhanden → lädt gespeichertes Produkt
 * 3. Kategorie-Suche: Wenn category vorhanden → sucht nach Kategorie
 * 4. Manuelle Suche: Sonst → wartet auf Benutzereingabe
 * 
 * @example
 * // Neu: mit gespeichertem Open Food Facts Code
 * <NutritionSearch
 *   articleName="Nutella"
 *   category="Brotaufstriche"
 *   articleId="artikel-uuid-123"
 *   initialOpenFoodFactsCode="3017620422003"
 *   onNutritionDataFound={(data) => console.log('Nährwerte:', data)}
 *   onExtendedDataFound={(data) => console.log('Erweiterte Daten:', data)}
 *   onEANCodeFound={(code) => console.log('EAN-Code:', code)}
 *   onOpenFoodFactsCodeFound={(code) => console.log('OFF Code:', code)}
 *   onImageDownloaded={(success) => console.log('Bild heruntergeladen:', success)}
 *   colors={colors}
 *   onClose={() => setShowSearch(false)}
 * />
 */
import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaDownload, FaTimes, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaImage } from 'react-icons/fa';
import { nutritionAPI, NutritionData, ExtendedProductData } from '../services/nutritionAPI';
import { storageLayer } from '../services/storageLayer';

interface NutritionSearchProps {
  articleName: string;
  category?: string;
  articleId?: string; // NEU: Article-ID für Bildspeicherung (pictures/articles/{articleId})
  onNutritionDataFound: (nutritionData: NutritionData) => void;
  onExtendedDataFound?: (extendedData: ExtendedProductData) => void;
  onEANCodeFound?: (eanCode: string, type: 'content' | 'bundle') => void;
  onImageDownloaded?: (success: boolean) => void; // NEU: Callback wenn Bild heruntergeladen wurde
  onOpenFoodFactsCodeFound?: (code: string) => void; // NEU: Callback für Open Food Facts Code
  colors: any;
  onClose: () => void;
  eanSearchResult?: any;
  initialOpenFoodFactsCode?: string; // NEU: Vorgeladener Open Food Facts Code
}

interface SuggestionItem {
  name: string;
  brand?: string;
  nutritionData: NutritionData;
  code: string;
  quantity?: string; // Inhaltsmenge
}

interface ExtendedSuggestionItem {
  name: string;
  brand?: string;
  extendedData: ExtendedProductData;
  code: string;
  quantity?: string; // Inhaltsmenge
}

const NutritionSearch: React.FC<NutritionSearchProps> = ({
  articleName,
  category,
  articleId,
  onNutritionDataFound,
  onExtendedDataFound,
  onEANCodeFound,
  onImageDownloaded,
  onOpenFoodFactsCodeFound,
  colors,
  onClose,
  eanSearchResult,
  initialOpenFoodFactsCode
}) => {
  const [searchTerm, setSearchTerm] = useState(category || '');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [extendedSuggestions, setExtendedSuggestions] = useState<ExtendedSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useExtendedData, setUseExtendedData] = useState(true); // Standardmäßig erweiterte Daten verwenden
  const [useEANCode, setUseEANCode] = useState(true); // EAN-Code übernehmen - Standardmäßig aktiviert
  const [eanCodeType, setEanCodeType] = useState<'content' | 'bundle'>('content'); // Standard: Inhalt
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Ausgewähltes Produkt
  const [downloadProductImage, setDownloadProductImage] = useState(true); // NEU: Produktbild herunterladen - Standardmäßig aktiviert
  const [isDownloadingImage, setIsDownloadingImage] = useState(false); // NEU: Bild wird heruntergeladen
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // NEU: Fehlermeldung für API-Probleme
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatische Suche beim Laden der Komponente - intelligente Modi
  useEffect(() => {
    const initializeSearch = async () => {
      // Modus 1: EAN-Code-Suche (höchste Priorität)
      if (eanSearchResult) {
        console.log('🏷️ Modus: EAN-Code-Suche - Ergebnis bereits verarbeitet');
        // EAN-Suchergebnis ist bereits verarbeitet, keine weitere Aktion nötig
        return;
      }
      
      // Modus 2: Gespeicherter Open Food Facts Code (mittlere Priorität)
      if (initialOpenFoodFactsCode && initialOpenFoodFactsCode.trim()) {
        console.log('💾 Modus: Gespeichertes Produkt laden - Code:', initialOpenFoodFactsCode);
        await handleLoadProductByCode(initialOpenFoodFactsCode);
        return;
      }
      
      // Modus 3: Kategorie-Suche (niedrigste Priorität)
      if (category && category.trim()) {
        console.log('📂 Modus: Kategorie-Suche - Kategorie:', category);
        // Setze Suchbegriff auf Kategorie für manuelle Suche
        setSearchTerm(category.trim());
        // Starte automatische Suche nach Kategorie
        await handleSearch(category.trim());
        return;
      }
      
      // Modus 4: Leere Suche - warten auf Benutzereingabe
      console.log('⏳ Modus: Manuelle Suche - Warten auf Eingabe');
    };
    
    // Führe Initialisierung aus
    initializeSearch();
  }, [eanSearchResult, initialOpenFoodFactsCode, category]);

  // NEU: Lade Produkt direkt anhand des Open Food Facts Code
  const handleLoadProductByCode = async (code: string) => {
    setIsLoading(true);
    setErrorMessage(null); // Reset Fehlermeldung
    
    try {
      console.log(`🔍 Lade Produkt direkt mit Code: ${code}`);
      const product = await nutritionAPI.getProductByCode(code);
      
      if (product) {
        console.log(`✅ Produkt gefunden:`, product);
        
        // Konvertiere zu Extended Suggestion Item
        if (onExtendedDataFound) {
          const extendedData = await nutritionAPI.convertToExtendedProductData(product);
          setExtendedSuggestions([{
            name: product.product_name || 'Unbekanntes Produkt',
            brand: product.brands,
            extendedData: extendedData,
            code: product.code,
            quantity: product.quantity || product.product_quantity
          }]);
          setSuggestions([]);
        } else {
          const nutritionData = nutritionAPI.convertToNutritionData(product);
          setSuggestions([{
            name: product.product_name || 'Unbekanntes Produkt',
            brand: product.brands,
            nutritionData: nutritionData,
            code: product.code,
            quantity: product.quantity || product.product_quantity
          }]);
          setExtendedSuggestions([]);
        }
        
        setShowSuggestions(true);
      } else {
        console.warn(`⚠️ Produkt mit Code ${code} nicht gefunden`);
        setErrorMessage(`Produkt mit Code ${code} wurde in der Open Food Facts Datenbank nicht gefunden.`);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Produkts:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('Die Open Food Facts API ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut.');
      } else {
        setErrorMessage('Ein Fehler ist beim Laden des gespeicherten Produkts aufgetreten.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // EAN-Suchergebnis verarbeiten
  useEffect(() => {
    if (eanSearchResult) {
      // Konvertiere EAN-Ergebnis zu unserem Format
      const nutritionData: NutritionData = {
        calories: eanSearchResult.nutriments['energy-kcal_100g'] || 0,
        kilojoules: eanSearchResult.nutriments.energy_100g || 0,
        protein: eanSearchResult.nutriments.proteins_100g || 0,
        fat: eanSearchResult.nutriments.fat_100g || 0,
        carbohydrates: eanSearchResult.nutriments.carbohydrates_100g || 0,
        fiber: eanSearchResult.nutriments.fiber_100g || 0,
        sugar: eanSearchResult.nutriments.sugars_100g || 0,
        salt: eanSearchResult.nutriments.salt_100g || 0
      };

      const extendedData: ExtendedProductData = {
        nutritionData: nutritionData,
        allergens: eanSearchResult.allergens ? eanSearchResult.allergens.split(',').map((a: string) => a.trim()) : [],
        additives: eanSearchResult.additives || [],
        ingredients: eanSearchResult.ingredients_text,
        originalAllergens: eanSearchResult.allergens ? [eanSearchResult.allergens] : [],
        originalAdditives: eanSearchResult.additives || [],
        originalIngredients: eanSearchResult.ingredients_text
      };

      // Setze die Ergebnisse als Vorschläge
      setSuggestions([{
        name: eanSearchResult.product_name,
        brand: eanSearchResult.brands,
        nutritionData: nutritionData,
        code: eanSearchResult.code,
        quantity: eanSearchResult.quantity || eanSearchResult.product_quantity
      }]);

      setExtendedSuggestions([{
        name: eanSearchResult.product_name,
        brand: eanSearchResult.brands,
        extendedData: extendedData,
        code: eanSearchResult.code,
        quantity: eanSearchResult.quantity || eanSearchResult.product_quantity
      }]);

      setShowSuggestions(true);
    }
  }, [eanSearchResult]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setExtendedSuggestions([]);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null); // Reset Fehlermeldung
    
    try {
      console.log(`🔍 Starte Suche für: "${query}"`);
      
      if (useExtendedData && onExtendedDataFound) {
        // Erweiterte Suche mit Allergenen und Zusatzstoffen
        const extendedResults = await nutritionAPI.getSuggestionsExtended(query);
        console.log(`✅ Erweiterte Suche abgeschlossen: ${extendedResults.length} Ergebnisse`);
        setExtendedSuggestions(extendedResults);
        setSuggestions([]);
      } else {
        // Standard-Suche nur für Nährwerte
        const results = await nutritionAPI.getSuggestions(query);
        console.log(`✅ Standard-Suche abgeschlossen: ${results.length} Ergebnisse`);
        setSuggestions(results);
        setExtendedSuggestions([]);
      }
      setShowSuggestions(true);
    } catch (error) {
      console.error('❌ Fehler bei der Nährwert-Suche:', error);
      
      // Zeige benutzerfreundliche Fehlermeldung
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('Die Open Food Facts API ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut oder prüfen Sie Ihre Internetverbindung.');
      } else {
        setErrorMessage('Ein Fehler ist bei der Suche aufgetreten. Bitte versuchen Sie es erneut.');
      }
      
      // Leere Ergebnisse bei Fehler
      setSuggestions([]);
      setExtendedSuggestions([]);
      setShowSuggestions(true);
    } finally {
      setIsLoading(false);
    }
  };

  // NEU: Bild herunterladen und speichern
  const handleDownloadAndSaveImage = async (productCode: string): Promise<boolean> => {
    if (!downloadProductImage || !articleId) {
      console.log('⏭️ Bild-Download übersprungen (deaktiviert oder keine Article-ID)');
      return false;
    }

    try {
      setIsDownloadingImage(true);
      console.log(`📷 Lade Produktbild für Code ${productCode}...`);

      // Lade das größte verfügbare Bild (original)
      const imageFile = await nutritionAPI.downloadProductImage(productCode, 'original');

      if (!imageFile) {
        console.warn('⚠️ Kein Produktbild verfügbar');
        if (onImageDownloaded) {
          onImageDownloaded(false);
        }
        return false;
      }

      // Speichere Bild über storageLayer
      const imagePath = `pictures/articles/${articleId}`;
      const saved = await storageLayer.saveImage(imagePath, imageFile);

      if (saved) {
        console.log(`✅ Produktbild erfolgreich gespeichert: ${imagePath}`);
        if (onImageDownloaded) {
          onImageDownloaded(true);
        }
        return true;
      } else {
        console.error('❌ Fehler beim Speichern des Produktbildes');
        if (onImageDownloaded) {
          onImageDownloaded(false);
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Fehler beim Herunterladen und Speichern des Produktbildes:', error);
      if (onImageDownloaded) {
        onImageDownloaded(false);
      }
      return false;
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setSelectedIndex(-1);
    setErrorMessage(null); // Reset Fehlermeldung beim Tippen

    // Debounce für die Suche
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500); // Erhöhe Debounce auf 500ms um API-Last zu reduzieren
  };

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    setSelectedProduct(suggestion);
  };

  const handleSuggestionDoubleClick = async (suggestion: SuggestionItem) => {
    // Doppelklick: Sofort übernehmen und schließen
    onNutritionDataFound(suggestion.nutritionData);
    
    // Open Food Facts Code speichern
    if (onOpenFoodFactsCodeFound && suggestion.code) {
      onOpenFoodFactsCodeFound(suggestion.code);
    }
    
    // EAN-Code übernehmen wenn aktiviert
    if (useEANCode && onEANCodeFound) {
      const eanCode = eanSearchResult?.code || suggestion.code;
      if (eanCode) {
        onEANCodeFound(eanCode, eanCodeType);
      }
    }
    
    // Bild herunterladen wenn aktiviert
    if (downloadProductImage && articleId) {
      await handleDownloadAndSaveImage(suggestion.code);
    }
    
    onClose();
  };

  const handleExtendedSuggestionSelect = (suggestion: ExtendedSuggestionItem) => {
    setSelectedProduct(suggestion);
  };

  const handleExtendedSuggestionDoubleClick = async (suggestion: ExtendedSuggestionItem) => {
    // Doppelklick: Sofort übernehmen und schließen
    if (useExtendedData && onExtendedDataFound) {
      // Checkbox aktiviert: Erweiterte Daten mit Allergenen und Zusatzstoffen
      onExtendedDataFound(suggestion.extendedData);
    } else {
      // Checkbox deaktiviert: Nur Basis-Nährwerte
      onNutritionDataFound(suggestion.extendedData.nutritionData);
    }
    
    // Open Food Facts Code speichern
    if (onOpenFoodFactsCodeFound && suggestion.code) {
      onOpenFoodFactsCodeFound(suggestion.code);
    }
    
    // EAN-Code übernehmen wenn aktiviert
    if (useEANCode && onEANCodeFound) {
      const eanCode = eanSearchResult?.code || suggestion.code;
      if (eanCode) {
        onEANCodeFound(eanCode, eanCodeType);
      }
    }
    
    // Bild herunterladen wenn aktiviert
    if (downloadProductImage && articleId) {
      await handleDownloadAndSaveImage(suggestion.code);
    }
    
    onClose();
  };

  const handleApplySelectedProduct = async () => {
    if (!selectedProduct) return;

    const isExtended = 'extendedData' in selectedProduct;
    
    if (isExtended) {
      const suggestion = selectedProduct as ExtendedSuggestionItem;
      if (useExtendedData && onExtendedDataFound) {
        onExtendedDataFound(suggestion.extendedData);
      } else {
        onNutritionDataFound(suggestion.extendedData.nutritionData);
      }
    } else {
      const suggestion = selectedProduct as SuggestionItem;
      onNutritionDataFound(suggestion.nutritionData);
    }
    
    // Open Food Facts Code speichern
    if (onOpenFoodFactsCodeFound && selectedProduct.code) {
      onOpenFoodFactsCodeFound(selectedProduct.code);
    }
    
    // EAN-Code übernehmen wenn aktiviert
    if (useEANCode && onEANCodeFound) {
      const eanCode = eanSearchResult?.code || selectedProduct.code;
      if (eanCode) {
        onEANCodeFound(eanCode, eanCodeType);
      }
    }
    
    // Bild herunterladen wenn aktiviert
    if (downloadProductImage && articleId) {
      await handleDownloadAndSaveImage(selectedProduct.code);
    }
    
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Zeige immer beide Arten von Vorschlägen, Checkbox steuert nur die Datenübernahme
    const currentSuggestions = suggestions.length > 0 ? suggestions : extendedSuggestions;
    
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
        const selectedSuggestion = currentSuggestions[selectedIndex];
        if ('extendedData' in selectedSuggestion) {
          handleExtendedSuggestionSelect(selectedSuggestion as ExtendedSuggestionItem);
        } else {
          handleSuggestionSelect(selectedSuggestion as SuggestionItem);
        }
      } else if (currentSuggestions.length > 0) {
        const firstSuggestion = currentSuggestions[0];
        if ('extendedData' in firstSuggestion) {
          handleExtendedSuggestionSelect(firstSuggestion as ExtendedSuggestionItem);
        } else {
          handleSuggestionSelect(firstSuggestion as SuggestionItem);
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Entferne den handleClickOutside Event-Listener
  // Das Modal soll sich nicht schließen beim Klick außerhalb

  // Zeige immer beide Arten von Vorschlägen, Checkbox steuert nur die Datenübernahme
  const currentSuggestions = suggestions.length > 0 ? suggestions : extendedSuggestions;

  return (
    <div className="nutrition-search-container position-relative">
      <div className="card" style={{ 
        backgroundColor: colors.card, 
        borderColor: colors.cardBorder,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px'
      }}>
        {/* Header */}
        <div className="card-header d-flex justify-content-between align-items-center" 
             style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}>
          <h5 className="mb-0" style={{ color: colors.text }}>
            <FaSearch className="me-2" />
            {eanSearchResult ? 'EAN-Code gefunden' : 'Nährwertdaten suchen'}
          </h5>
          <button
            className="btn btn-link p-0"
            onClick={onClose}
            style={{ color: colors.text, textDecoration: 'none' }}
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Body */}
        <div className="card-body" style={{ overflow: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
          {initialOpenFoodFactsCode && (
            <div className="alert alert-info mb-3" style={{ 
              backgroundColor: colors.accent + '10', 
              borderColor: colors.accent,
              color: colors.text 
            }}>
              <FaCheckCircle className="me-2" />
              <strong>Gespeichertes Produkt geladen!</strong> Open Food Facts Code: <strong>{initialOpenFoodFactsCode}</strong>
            </div>
          )}
          {eanSearchResult && (
            <div className="alert alert-success mb-3" style={{ 
              backgroundColor: colors.accent + '20', 
              borderColor: colors.accent,
              color: colors.text 
            }}>
              <FaCheckCircle className="me-2" />
              <strong>EAN-Code gefunden!</strong> Produkt: <strong>{eanSearchResult.product_name}</strong>
              {eanSearchResult.brands && (
                <span className="ms-2">({eanSearchResult.brands})</span>
              )}
            </div>
          )}
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
                placeholder={
                  eanSearchResult 
                    ? "EAN-Code gefunden - keine weitere Suche nötig" 
                    : initialOpenFoodFactsCode 
                      ? "Gespeichertes Produkt geladen - neue Suche starten?" 
                      : "Suchbegriff eingeben (z.B. Produktname oder Marke)..."
                }
                disabled={!!eanSearchResult}
                style={{ 
                  borderColor: colors.cardBorder, 
                  color: colors.text,
                  backgroundColor: eanSearchResult ? colors.secondary : (colors.inputBackground || colors.cardBackground),
                  opacity: eanSearchResult ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!eanSearchResult) {
                    e.currentTarget.style.borderColor = colors.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!eanSearchResult) {
                    e.currentTarget.style.borderColor = colors.cardBorder;
                  }
                }}
              />
              {isLoading && (
                <span className="input-group-text">
                  <FaSpinner className="fa-spin" />
                </span>
              )}
            </div>
            {category && !initialOpenFoodFactsCode && !eanSearchResult && (
              <small className="text-muted" style={{ color: colors.textSecondary }}>
                <FaSearch className="me-1" />
                Automatische Suche nach Kategorie: "{category}"
              </small>
            )}
            {initialOpenFoodFactsCode && (
              <small className="text-muted" style={{ color: colors.textSecondary }}>
                <FaCheckCircle className="me-1" style={{ color: colors.accent }} />
                Gespeichert: Code {initialOpenFoodFactsCode} - Neue Suche möglich
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
                    // Keine neue Suche auslösen - Checkbox steuert nur die Datenübernahme
                  }}
                  style={{ accentColor: colors.accent }}
                />
                <label className="form-check-label" htmlFor="useExtendedData" style={{ color: colors.text }}>
                  Allergene und Zusatzstoffe mit übernehmen
                </label>
              </div>
              <small className="text-muted" style={{ color: colors.textSecondary }}>
                Wenn aktiviert, werden auch Allergene und Zusatzstoffe aus der Open Food Facts Datenbank übernommen.
              </small>
            </div>
          )}

          {/* Option für Produktbild-Download */}
          {articleId && (eanSearchResult || currentSuggestions.length > 0) && (
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="downloadProductImage"
                  checked={downloadProductImage}
                  onChange={(e) => {
                    setDownloadProductImage(e.target.checked);
                  }}
                  style={{ accentColor: colors.accent }}
                />
                <label className="form-check-label" htmlFor="downloadProductImage" style={{ color: colors.text }}>
                  <FaImage className="me-1" />
                  Produktbild herunterladen und speichern
                </label>
              </div>
              <small className="text-muted" style={{ color: colors.textSecondary }}>
                Lädt automatisch das größte verfügbare Produktbild von Open Food Facts herunter.
              </small>
            </div>
          )}

          {/* Option für EAN-Code-Übernahme */}
          {(eanSearchResult || (currentSuggestions.length > 0 && currentSuggestions.some(s => s.code))) && (
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="useEANCode"
                  checked={useEANCode}
                  onChange={(e) => {
                    setUseEANCode(e.target.checked);
                  }}
                  style={{ accentColor: colors.accent }}
                />
                <label className="form-check-label" htmlFor="useEANCode" style={{ color: colors.text }}>
                  EAN-Code übernehmen
                </label>
              </div>
              {useEANCode && (
                <div className="ms-4 mt-2">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="eanCodeType"
                      id="eanCodeContent"
                      value="content"
                      checked={eanCodeType === 'content'}
                      onChange={(e) => setEanCodeType(e.target.value as 'content' | 'bundle')}
                      style={{ accentColor: colors.accent }}
                    />
                    <label className="form-check-label" htmlFor="eanCodeContent" style={{ color: colors.text }}>
                      Als Inhalt-EAN
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="eanCodeType"
                      id="eanCodeBundle"
                      value="bundle"
                      checked={eanCodeType === 'bundle'}
                      onChange={(e) => setEanCodeType(e.target.value as 'content' | 'bundle')}
                      style={{ accentColor: colors.accent }}
                    />
                    <label className="form-check-label" htmlFor="eanCodeBundle" style={{ color: colors.text }}>
                      Als Gebinde-EAN
                    </label>
                  </div>
                </div>
              )}
              <small className="text-muted" style={{ color: colors.textSecondary }}>
                Wenn aktiviert, wird der EAN-Code "{eanSearchResult?.code || (selectedProduct?.code || (currentSuggestions.length > 0 ? currentSuggestions[0].code : ''))}" als {eanCodeType === 'content' ? 'Inhalt' : 'Gebinde'}-EAN übernommen.
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
                  const isExtended = 'extendedData' in suggestion;
                  const extendedData = isExtended ? (suggestion as ExtendedSuggestionItem).extendedData : null;
                  
                  return (
                    <button
                      key={suggestion.code}
                      type="button"
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                      onClick={() => {
                        if (isExtended) {
                          handleExtendedSuggestionSelect(suggestion as ExtendedSuggestionItem);
                        } else {
                          handleSuggestionSelect(suggestion as SuggestionItem);
                        }
                      }}
                      onDoubleClick={() => {
                        if (isExtended) {
                          handleExtendedSuggestionDoubleClick(suggestion as ExtendedSuggestionItem);
                        } else {
                          handleSuggestionDoubleClick(suggestion as SuggestionItem);
                        }
                      }}
                      style={{
                        backgroundColor: selectedProduct?.code === suggestion.code ? colors.accent + '20' : colors.cardBackground,
                        borderColor: selectedProduct?.code === suggestion.code ? colors.accent : colors.cardBorder,
                        color: colors.text,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="flex-grow-1">
                        <div className="fw-bold">
                          {suggestion.name}
                          {suggestion.quantity && (
                            <span className="ms-2 badge" style={{ 
                              backgroundColor: colors.accent + '30',
                              color: colors.text,
                              fontWeight: 'normal',
                              fontSize: '0.75rem'
                            }}>
                              {suggestion.quantity}
                            </span>
                          )}
                        </div>
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

          {errorMessage && (
            <div className="alert alert-danger mb-3" style={{ 
              backgroundColor: '#f8d7da', 
              borderColor: '#f5c6cb',
              color: '#721c24'
            }}>
              <FaExclamationTriangle className="me-2" />
              <strong>Fehler:</strong> {errorMessage}
            </div>
          )}

          {showSuggestions && currentSuggestions.length === 0 && !isLoading && searchTerm.trim() && !errorMessage && (
            <div className="alert alert-info" style={{ 
              backgroundColor: colors.infoBackground || '#d1ecf1', 
              borderColor: colors.infoBorder || '#bee5eb',
              color: colors.infoText || '#0c5460'
            }}>
              <FaSearch className="me-2" />
              Keine Produkte gefunden. Versuchen Sie einen anderen Suchbegriff.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="card-footer d-flex justify-content-between align-items-center" style={{ 
          backgroundColor: colors.secondary,
          borderTop: 'none'
        }}>
          <small className="text-muted" style={{ color: colors.textSecondary }}>
            {isDownloadingImage ? (
              <>
                <FaSpinner className="fa-spin me-1" />
                Bild wird heruntergeladen...
              </>
            ) : (
              <>
                <FaDownload className="me-1" />
                Daten von Open Food Facts
              </>
            )}
          </small>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={selectedProduct ? handleApplySelectedProduct : onClose}
            disabled={isDownloadingImage}
            style={{
              backgroundColor: selectedProduct ? colors.accent : colors.secondary,
              borderColor: selectedProduct ? colors.accent : colors.cardBorder,
              color: selectedProduct ? colors.cardBackground : colors.text,
              transition: 'all 0.2s ease',
              opacity: isDownloadingImage ? 0.6 : 1,
              cursor: isDownloadingImage ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isDownloadingImage) {
                e.currentTarget.style.backgroundColor = colors.accent + '20';
                e.currentTarget.style.borderColor = colors.accent;
              }
            }}
            onMouseLeave={(e) => {
              if (!isDownloadingImage) {
                e.currentTarget.style.backgroundColor = selectedProduct ? colors.accent : colors.secondary;
                e.currentTarget.style.borderColor = selectedProduct ? colors.accent : colors.cardBorder;
              }
            }}
          >
            {isDownloadingImage ? (
              <>
                <FaSpinner className="fa-spin me-1" />
                Lädt...
              </>
            ) : (
              selectedProduct ? 'Übernehmen' : 'Schließen'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NutritionSearch; 