import React, { useState, useRef, useEffect } from 'react';
import { FaFileUpload, FaDownload, FaTimes, FaFolderOpen, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { UNITS } from '../constants/articleConstants';
import { suggestCategory, generateArticleNumber } from '../utils/helpers';
import { categoryManager } from '../utils/categoryManager';
import { generateId } from '../utils/storageUtils';
import { UUIDUtils } from '../utils/uuidUtils';

interface ArtikelDataExchangeProps {
  show: boolean;
  onClose: () => void;
  colors: any;
  suppliers: any[];
  articles: any[];
  onImportComplete?: (newSuppliers: any[], newArticles: any[]) => void;
}

interface MessageDialogProps {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  colors: any;
}

interface ExportFilters {
  nameSearch: string;
  categoryFilter: string;
  supplierFilter: string;
  vatRateFilter: string;
  bundlePriceFilter: { operator: string; value: string };

}

// Benutzerdefinierter Dialog für Meldungen
const MessageDialog: React.FC<MessageDialogProps> = ({ show, type, title, message, onClose, colors }) => {
  if (!show) return null;

  return (
    <>
      <div 
        className="modal fade show" 
        style={{ 
          display: 'block', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 1060,
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
          <div className="modal-content" style={{ backgroundColor: colors.card }}>
            {/* Header */}
            <div className="modal-header" style={{ 
              backgroundColor: type === 'success' ? '#d4edda' : '#f8d7da',
              borderColor: type === 'success' ? '#c3e6cb' : '#f5c6cb'
            }}>
              <h5 className="modal-title d-flex align-items-center" style={{ 
                color: type === 'success' ? '#155724' : '#721c24'
              }}>
                {type === 'success' ? (
                  <FaCheckCircle className="me-2" style={{ fontSize: '1.2rem' }} />
                ) : (
                  <FaExclamationTriangle className="me-2" style={{ fontSize: '1.2rem' }} />
                )}
                {title}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                style={{ filter: type === 'success' ? 'invert(0.3)' : 'invert(0.4)' }}
              ></button>
            </div>
            
            {/* Body */}
            <div className="modal-body" style={{ color: colors.text }}>
              <div style={{ whiteSpace: 'pre-line' }}>
                {message}
              </div>
            </div>
            
            {/* Footer */}
            <div className="modal-footer" style={{ 
              backgroundColor: colors.cardBorder,
              borderColor: type === 'success' ? '#c3e6cb' : '#f5c6cb'
            }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={onClose}
                style={{ 
                  backgroundColor: type === 'success' ? '#28a745' : '#dc3545',
                  borderColor: type === 'success' ? '#28a745' : '#dc3545',
                  color: 'white',
                  minWidth: '100px'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
      <div 
        className="modal-backdrop fade show" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 1050,
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}
        onClick={onClose}
      ></div>
    </>
  );
};

const ArtikelDataExchange: React.FC<ArtikelDataExchangeProps> = ({ 
  show, 
  onClose, 
  colors,
  suppliers,
  articles,
  onImportComplete
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'json' | 'excel' | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<{[key: string]: string}>({});
  const [defaultValues, setDefaultValues] = useState<{[key: string]: string}>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [detectedSeparator, setDetectedSeparator] = useState<string>(',');
  const [detectedEncoding, setDetectedEncoding] = useState<string>('UTF-8');
  const [mappingScores, setMappingScores] = useState<{[key: string]: number}>({});
  const [showDropdown, setShowDropdown] = useState<{[key: string]: boolean}>({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [filteredOptions, setFilteredOptions] = useState<{[key: string]: string[]}>({});
  const [detectedNutritionHeaders, setDetectedNutritionHeaders] = useState<string[]>([]);
  const [messageDialog, setMessageDialog] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // Export-Optionen State
  const [exportOptions, setExportOptions] = useState({
    includeHeaders: true,
    includeMetadata: false,
    formatNumbers: true,
    includeAllFields: true,
    exportAllRecords: true
  });
  
  // Export-Dateityp State
  const [exportFileType, setExportFileType] = useState<'csv' | 'json' | 'excel'>('csv');
  
  // Ausgewählte Spalten für Export (wenn nicht alle Felder)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'name', 'category', 'supplierId', 'supplierArticleNumber', 'vatRate', 'bundleUnit', 
    'bundlePrice', 'content', 'contentUnit', 'pricePerUnit', 'ingredients', 'additives', 'allergens', 'nutritionInfo'
  ]);
  
  // Export-Filter State
  const [exportFilters, setExportFilters] = useState<ExportFilters>(() => {
    // Versuche gespeicherte Filter aus localStorage zu laden
    const savedFilters = localStorage.getItem('artikelExportFilters');
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.warn('Fehler beim Laden der gespeicherten Filter:', e);
      }
    }
    
    // Standard-Filter
    return {
      nameSearch: '',
      categoryFilter: '',
      supplierFilter: '',
      vatRateFilter: '',
      bundlePriceFilter: { operator: '=', value: '' },
    };
  });
  

  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aktualisiere den CategoryManager wenn sich die Artikeldaten ändern
  useEffect(() => {
    if (articles) {
      categoryManager.updateCategories(articles);
    }
  }, [articles]);

  // Schließe das Kategorie-Dropdown wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!show) return null;

  // Hilfsfunktion zum Anzeigen von Meldungen
  const showMessage = (type: 'success' | 'error', title: string, message: string) => {
    setMessageDialog({
      show: true,
      type,
      title,
      message
    });
  };

     // Hilfsfunktion zum Schließen der Meldung
   const closeMessage = () => {
     setMessageDialog(prev => ({ ...prev, show: false }));
     // Wenn es eine Erfolgsmeldung war, schließe auch das Hauptmodal
     if (messageDialog.type === 'success') {
       onClose();
     }
   };


  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Export-Optionen Handler
  const handleExportOptionChange = (option: string, value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
    
    // Wenn "Alle Felder einschließen" aktiviert wird, alle Spalten auswählen
    if (option === 'includeAllFields' && value) {
      setSelectedColumns(exportFields);
    }
  };

  // Export-Dateityp Handler
  const handleExportFileTypeChange = (fileType: 'csv' | 'json' | 'excel') => {
    setExportFileType(fileType);
  };

  const handleColumnSelectionChange = (column: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedColumns(prev => [...prev, column]);
    } else {
      setSelectedColumns(prev => prev.filter(col => col !== column));
    }
  };
  
  // Filter-Handler
  const handleFilterChange = (filterType: string, value: any) => {
    setExportFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      };
      
      // Speichere Filter in localStorage
      localStorage.setItem('artikelExportFilters', JSON.stringify(newFilters));
      
      return newFilters;
    });
  };
  
  const handleNumericFilterChange = (filterType: string, field: 'operator' | 'value', value: string) => {
    setExportFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: {
          ...(prev[filterType as keyof ExportFilters] as { operator: string; value: string }),
          [field]: value
        }
      };
      
      // Speichere Filter in localStorage
      localStorage.setItem('artikelExportFilters', JSON.stringify(newFilters));
      
      return newFilters;
    });
  };
  
  const resetFilters = () => {
    const defaultFilters = {
      nameSearch: '',
      categoryFilter: '',
      supplierFilter: '',
      vatRateFilter: '',
      bundlePriceFilter: { operator: '=', value: '' }
    };
    
    setExportFilters(defaultFilters);
    localStorage.setItem('artikelExportFilters', JSON.stringify(defaultFilters));
  };

  // Clear localStorage and reset filters - for debugging
  const clearAllFilters = () => {
    localStorage.removeItem('artikelExportFilters');
    resetFilters();
  };
  
  // Filter-Logik für Artikel
  const applyFilters = (articlesToFilter: any[]) => {

    return articlesToFilter.filter(article => {
      // Name-Filter (Volltext-Suche)
      if (exportFilters.nameSearch && 
          !article.name.toLowerCase().includes(exportFilters.nameSearch.toLowerCase())) {
        return false;
      }
      
      // Kategorie-Filter
      if (exportFilters.categoryFilter && 
          article.category !== exportFilters.categoryFilter) {
        return false;
      }
      
                          // Lieferant-Filter - using the same logic as AppContent.tsx
                    if (exportFilters.supplierFilter) {
                      // Get the article's supplier name using supplierId
                      const getArticleSupplierName = (article: any) => {
                        if (article.supplierId) {
                          const supplier = suppliers.find(s => s.id === article.supplierId);
                          return supplier ? supplier.name : null;
                        }
                        return null;
                      };
                      
                      const articleSupplierName = getArticleSupplierName(article);
                      
                      if (articleSupplierName !== exportFilters.supplierFilter) {
                        return false;
                      }
                    }
      
      // MwSt-Satz-Filter
      if (exportFilters.vatRateFilter && 
          article.vatRate !== parseInt(exportFilters.vatRateFilter)) {
        return false;
      }
      
      // Gebindepreis-Filter
      if (exportFilters.bundlePriceFilter.value) {
        const filterValue = parseFloat(exportFilters.bundlePriceFilter.value);
        const articleValue = article.bundlePrice;
        
        if (!isNaN(filterValue)) {
          switch (exportFilters.bundlePriceFilter.operator) {
            case '<':
              if (articleValue >= filterValue) return false;
              break;
            case '=':
              if (articleValue !== filterValue) return false;
              break;
            case '>':
              if (articleValue <= filterValue) return false;
              break;
          }
        }
      }
      

      
      return true;
    });
  };
  
  // Gefilterte Artikel berechnen
  const getFilteredArticles = () => {
    if (exportOptions.exportAllRecords) {
      return articles;
    }
    return applyFilters(articles);
  };

  // Anzahl aktiver Filter berechnen
  const getActiveFilterCount = () => {
    let count = 0;
    if (exportFilters.nameSearch) count++;
    if (exportFilters.categoryFilter) count++;
    if (exportFilters.supplierFilter) count++;
    if (exportFilters.vatRateFilter) count++;
    if (exportFilters.bundlePriceFilter.value) count++;

    return count;
  };

  // Artikel-Felder definieren (für Import)
  const articleFields = [
    'name', 'category', 'vatRate', 'supplier', 'supplierArticleNumber', 'bundleUnit', 
    'bundlePrice', 'content', 'contentUnit', 'pricePerUnit', 'ingredients', 'additives', 'allergens', 'nutritionInfo'
  ];

  // Export-Felder definieren (nur die gewünschten Felder in der angegebenen Reihenfolge)
  const exportFields = [
    'name', 'category', 'supplierId', 'supplierArticleNumber', 'vatRate', 'bundleUnit', 
    'bundlePrice', 'content', 'contentUnit', 'pricePerUnit', 'ingredients', 'additives', 'allergens', 'nutritionInfo'
  ];

  // Feld-Labels für benutzerfreundliche Anzeige
  const fieldLabels: {[key: string]: string} = {
    // Import-Felder
    name: 'Artikelname *',
    category: 'Kategorie',
    vatRate: 'MwSt-Satz',
    supplier: 'Lieferant *',
    supplierArticleNumber: 'Artikelnummer',
    bundleUnit: 'Gebindeeinheit',
    bundlePrice: 'Gebindepreis *',
    content: 'Inhalt',
    contentUnit: 'Inhaltseinheit',
    pricePerUnit: 'Inhaltspreis',
    ingredients: 'Inhaltsstoffe',
    additives: 'Zusatzstoffe',
    allergens: 'Allergene',
    nutritionInfo: 'Nährwertangaben'
  };

  // Erforderliche Felder für den Import
  const requiredFields = ['name', 'supplier', 'bundlePrice'];

      // Verfügbare Optionen für Auswahlfelder
    const availableOptions = {
      category: categoryManager.getAllCategories(),
      vatRate: ['0%', '7%', '19%'],
      supplier: suppliers.map(s => s.name),
    bundleUnit: UNITS,
    contentUnit: UNITS
  };

     const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
       const file = event.target.files?.[0];
       if (!file) return;

       // Dateityp bestimmen
       let detectedFileType: 'csv' | 'json' | 'excel' | null = null;
       if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
         detectedFileType = 'csv';
       } else if (file.name.toLowerCase().endsWith('.json') || file.type === 'application/json') {
         detectedFileType = 'json';
       } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') || 
                  file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel') {
         detectedFileType = 'excel';
       }

       if (!detectedFileType) {
         showMessage('error', 'Ungültiger Dateityp', 'Bitte wählen Sie eine CSV-, JSON- oder Excel-Datei aus.');
         return;
       }

       setSelectedFile(file);
       setFileType(detectedFileType);

       try {
         let headers: string[] = [];
         let data: any[] = [];

         if (detectedFileType === 'csv') {
           // CSV-Verarbeitung (bestehende Logik)
           const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
             const reader = new FileReader();
             reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
             reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
             reader.readAsArrayBuffer(file);
           });

           const encoding = detectEncoding(buffer);
           setDetectedEncoding(encoding);
           
           const text = decodeText(buffer, encoding);
           const separator = detectSeparator(text);
           setDetectedSeparator(separator);
           
           const lines = text.split('\n').filter(line => line.trim() !== '');
           if (lines.length > 0) {
             headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
             data = lines.slice(1, 6).map(line => {
               const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
               const row: any = {};
               headers.forEach((header, index) => {
                 row[header] = values[index] || '';
               });
               return row;
             });
           }
         } else if (detectedFileType === 'json') {
           // JSON-Verarbeitung
           const result = await parseJSONFile(file);
           headers = result.headers;
           data = result.data.slice(0, 5); // Erste 5 Datensätze für Vorschau
           setDetectedEncoding('UTF-8');
           setDetectedSeparator('N/A');
         } else if (detectedFileType === 'excel') {
           // Excel-Verarbeitung
           const result = await parseExcelFile(file);
           headers = result.headers;
           data = result.data.slice(0, 5); // Erste 5 Datensätze für Vorschau
           setDetectedEncoding('UTF-8');
           setDetectedSeparator('Tab');
         }

         if (headers.length > 0) {
           setCsvHeaders(headers);
           setPreviewData(data);

           // Intelligente Standard-Zuordnungen erstellen
           const mappings: {[key: string]: string} = {};
           const scores: {[key: string]: number} = {};
           
           // Erweiterte Feldzuordnung mit Synonymen und Abkürzungen
           const fieldMappings = {
             name: ['name', 'artikelname', 'bezeichnung', 'titel', 'produkt', 'artikel', 'name', 'title', 'product'],
             category: ['category', 'kategorie', 'gruppe', 'typ', 'art', 'sortiment', 'group', 'type', 'sort'],
             vatRate: ['vatrate', 'mwst', 'mwst_satz', 'mwst satz', 'steuersatz', 'tax_rate', 'tax rate', 'vat_rate', 'vat rate', 'umsatzsteuer'],
             supplier: ['supplier', 'lieferant', 'hersteller', 'produzent', 'vendor', 'manufacturer', 'producer', 'firma', 'company'],
             supplierArticleNumber: ['supplierarticlenumber', 'artikelnummer', 'artikel_nummer', 'artikel nummer', 'lieferantenartikelnummer', 'lieferanten_artikelnummer', 'lieferanten artikelnummer', 'supplier_article_number', 'supplier article number', 'artikel_nr', 'artikel nr', 'artnr', 'ean', 'ean_code', 'ean code', 'barcode', 'sku', 'product_code', 'product code'],
             bundleUnit: ['bundleunit', 'unit', 'einheit', 'masseinheit', 'verpackung', 'packung', 'stück', 'kg', 'g', 'l', 'ml', 'stk', 'piece'],
             bundlePrice: ['bundleprice', 'gebindepreis', 'gebinde_preis', 'gebinde preis', 'packungspreis', 'packungs_preis', 'packungs preis', 'verpackungspreis', 'verpackungs_preis', 'verpackungs preis', 'preis_gebinde', 'preis gebinde', 'price_package', 'price package', 'package_price', 'package price'],
             content: ['content', 'inhalt', 'gebindemenge', 'gebinde_menge', 'gebinde menge', 'menge', 'quantity', 'amount', 'volumen', 'volume'],
             contentUnit: ['contentunit', 'inhaltseinheit', 'inhalt_einheit', 'inhalt einheit', 'einheit_inhalt', 'einheit inhalt', 'content_unit', 'content unit'],
             pricePerUnit: ['priceperunit', 'price_per_unit', 'price per unit', 'inhaltspreis', 'inhalt_preis', 'inhalt preis', 'einzelpreis', 'einzel_preis', 'einzel preis', 'stückpreis', 'stück_preis', 'stück preis', 'preis_inhalt', 'preis inhalt', 'price_content', 'price content', 'content_price', 'content price', 'unit_price', 'unit price'],
             ingredients: ['ingredients', 'inhaltsstoffe', 'zutaten', 'ingredient', 'ingredient_list', 'ingredient list'],
             additives: ['additives', 'zusatzstoffe', 'e-nummern', 'additive', 'e-numbers'],
             allergens: ['allergens', 'allergene', 'allergen', 'allergie', 'allergy', 'allergen_info', 'allergen info'],
             nutritionInfo: ['nutritioninfo', 'nährwerte', 'naehrwerte', 'nährwertangaben', 'naehrwertangaben', 'nutrition', 'nutritional', 'nutritional_info', 'nutritional info', 'kalorien', 'calories', 'energie', 'energy', 'protein', 'fett', 'fat', 'kohlenhydrate', 'carbohydrates', 'ballaststoffe', 'fiber', 'zucker', 'sugar', 'salz', 'salt']
           };

           // Spezielle Behandlung für Nährwertfelder - erkenne alle Nährwert-bezogenen Spalten
           const nutritionSearchTerms = [
             'kalorien', 'calories', 'energie', 'energy',
             'kilojoule', 'kilojoules', 'kj',
             'protein', 'eiweiß', 'eiweiss',
             'fett', 'fat', 'fette',
             'kohlenhydrate', 'carbohydrates', 'carbs',
             'ballaststoffe', 'fiber', 'faser',
             'zucker', 'sugar', 'zuckerstoffe',
             'salz', 'salt', 'natrium', 'sodium'
           ];
           
           const detectedNutritionHeaders = headers.filter(header => 
             nutritionSearchTerms.some(term => 
               header.toLowerCase().includes(term.toLowerCase())
             )
           );
           
           // Erstelle einen speziellen Eintrag für Nährwertangaben wenn entsprechende Spalten gefunden wurden
           if (detectedNutritionHeaders.length > 0) {
             const nutritionOption = `[Nährwertfelder: ${detectedNutritionHeaders.join(', ')}]`;
             // Füge diese Option zu den verfügbaren Headers hinzu
             headers.push(nutritionOption);
             // Speichere die erkannten Nährwert-Header für die UI
             setDetectedNutritionHeaders(detectedNutritionHeaders);
           } else {
             setDetectedNutritionHeaders([]);
           }

           // Für jedes Artikelfeld die beste Übereinstimmung finden
           const usedHeaders = new Set<string>();
           
           Object.entries(fieldMappings).forEach(([articleField, searchTerms]) => {
             let bestMatch = '';
             let bestScore = 0;

             headers.forEach(header => {
               // Überspringe bereits verwendete Header
               if (usedHeaders.has(header)) {
                 return;
               }
               
               const headerLower = header.toLowerCase().replace(/[^a-zäöüß0-9]/g, '');
               
               searchTerms.forEach(term => {
                 const termLower = term.toLowerCase().replace(/[^a-zäöüß0-9]/g, '');
                 
                 // Exakte Übereinstimmung
                 if (headerLower === termLower) {
                   if (bestScore < 100) {
                     bestScore = 100;
                     bestMatch = header;
                   }
                 }
                 // Enthält den Begriff
                 else if (headerLower.includes(termLower) || termLower.includes(headerLower)) {
                   const score = Math.min(headerLower.length, termLower.length) / Math.max(headerLower.length, termLower.length) * 80;
                   if (score > bestScore) {
                     bestScore = score;
                     bestMatch = header;
                   }
                 }
                 // Ähnlichkeit basierend auf Levenshtein-Distanz
                 else {
                   const similarity = calculateSimilarity(headerLower, termLower);
                   if (similarity > 0.7 && similarity > bestScore / 100) {
                     const score = similarity * 60;
                     if (score > bestScore) {
                       bestScore = score;
                       bestMatch = header;
                     }
                   }
                 }
               });
             });

             if (bestMatch && bestScore > 30) {
               mappings[articleField] = bestMatch;
               scores[articleField] = bestScore;
               usedHeaders.add(bestMatch);
             }
           });

           setFieldMappings(mappings);
           setMappingScores(scores);
         }
       } catch (error) {
         console.error('Fehler beim Verarbeiten der Datei:', error);
         showMessage('error', 'Fehler beim Verarbeiten der Datei', 
           `Die Datei konnte nicht verarbeitet werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
         setSelectedFile(null);
         setFileType(null);
       }
     };

  const handleFieldMappingChange = (articleField: string, csvField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [articleField]: csvField
    }));
  };

  const handleDefaultValueChange = (articleField: string, value: string) => {
    setDefaultValues(prev => ({
      ...prev,
      [articleField]: value
    }));
    
    // Filtere Optionen basierend auf der Eingabe
    if (availableOptions[articleField as keyof typeof availableOptions]) {
      const options = availableOptions[articleField as keyof typeof availableOptions];
      const filtered = options.filter(option => 
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(prev => ({
        ...prev,
        [articleField]: filtered
      }));
    }
  };

  const handleInputFocus = (articleField: string) => {
    if (availableOptions[articleField as keyof typeof availableOptions]) {
      setShowDropdown(prev => ({
        ...prev,
        [articleField]: true
      }));
      setFilteredOptions(prev => ({
        ...prev,
        [articleField]: availableOptions[articleField as keyof typeof availableOptions]
      }));
    }
  };

  const handleInputBlur = (articleField: string) => {
    // Verzögerung, damit der Klick auf eine Option noch funktioniert
    setTimeout(() => {
      setShowDropdown(prev => ({
        ...prev,
        [articleField]: false
      }));
    }, 200);
  };

  const handleOptionSelect = (articleField: string, option: string) => {
    setDefaultValues(prev => ({
      ...prev,
      [articleField]: option
    }));
    setShowDropdown(prev => ({
      ...prev,
      [articleField]: false
    }));
  };

  // Prüfen ob alle erforderlichen Felder zugeordnet sind
  const isImportValid = () => {
    return requiredFields.every(field => {
      const hasMapping = fieldMappings[field] && fieldMappings[field] !== '';
      const hasDefault = fieldMappings[field] === '__DEFAULT__' && defaultValues[field] && defaultValues[field] !== '';
      return hasMapping || hasDefault;
    });
  };

  // Import-Funktion
  const handleImport = async () => {
    if (!selectedFile || !fileType || !isImportValid()) {
      showMessage('error', 'Fehler', 'Bitte stellen Sie sicher, dass alle erforderlichen Felder zugeordnet sind.');
      return;
    }

    try {
      let dataRows: any[] = [];

      if (fileType === 'csv') {
        // CSV-Verarbeitung
        const text = await readFileAsText(selectedFile);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          showMessage('error', 'Fehler', 'Die Datei enthält keine Daten zum Importieren.');
          return;
        }

        const headers = lines[0].split(detectedSeparator).map((h: string) => h.trim().replace(/"/g, ''));
        dataRows = lines.slice(1).filter((line: string) => line.trim() !== '').map((line: string) => {
          const values = line.split(detectedSeparator).map((v: string) => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header: string, index: number) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      } else if (fileType === 'json') {
        // JSON-Verarbeitung
        const result = await parseJSONFile(selectedFile);
        dataRows = result.data;
      } else if (fileType === 'excel') {
        // Excel-Verarbeitung
        const result = await parseExcelFile(selectedFile);
        dataRows = result.data;
      }
      
      const importedArticles: any[] = [];
      const newSuppliers: any[] = [];
      const supplierMap = new Map<string, string>(); // Name -> ID

      // Bestehende Lieferanten in Map eintragen
      suppliers.forEach(supplier => {
        supplierMap.set(supplier.name.toLowerCase(), supplier.id);
      });

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        if (!row || Object.values(row).every(v => !v)) continue; // Leere Zeile überspringen

        // Artikel-Objekt erstellen
        const generatedId = UUIDUtils.generateId(); // Frontend-ID (eindeutig pro Artikel)
        const article: any = {
          id: generatedId,
          isNew: true,
          isDirty: true,
          syncStatus: 'pending'
          // Keine Timestamps - werden von PostgreSQL automatisch gesetzt
        };
        
        console.log(`🆕 Erstelle Artikel-Objekt #${i + 1} mit ID: ${generatedId}`);
        
        // Für jedes Artikelfeld den Wert ermitteln
        articleFields.forEach(field => {
          // WICHTIG: Überspringe System-Felder - diese werden nie aus CSV/JSON importiert
          const systemFields = ['id', 'dbId', 'isNew', 'isDirty', 'syncStatus', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'lastModifiedBy'];
          if (systemFields.includes(field)) {
            return; // Überspringe System-Felder
          }
          
          const mapping = fieldMappings[field];
          
          if (mapping === '__DEFAULT__') {
            // Standardwert verwenden
            article[field] = defaultValues[field] || '';
          } else if (mapping && mapping !== '') {
            // CSV/JSON-Wert verwenden
            article[field] = row[mapping] || '';
            
            // Debug für Lieferant-Feld
            if (field === 'supplier' && fileType === 'json') {
              // Debug logging removed
            }
          }
        });
        
        // Stelle sicher, dass die generierte ID nicht überschrieben wurde
        if (!article.id || article.id !== generatedId) {
          console.error(`❌ KRITISCHER FEHLER: ID wurde überschrieben! Original: ${generatedId}, Aktuell: ${article.id}`);
          article.id = generatedId; // Wiederherstellung der ursprünglichen ID
        }
        
        console.log(`✅ Artikel-ID nach Mapping: ${article.id} (Name: ${article.name || 'unbekannt'})`);
        
        // Debugging: Log the values for price fields
        if (article.bundlePrice || article.pricePerUnit) {
          // Debug logging removed
        }

        // Lieferant verarbeiten
        
        if (article.supplier && article.supplier.trim()) {
          const supplierName = article.supplier.trim();
          const supplierNameLower = supplierName.toLowerCase();
          
          console.log(`Verarbeite Lieferant für Artikel "${article.name}": "${supplierName}"`);
          
          if (!supplierMap.has(supplierNameLower)) {
            // Neuer Lieferant - erstellen
            const newSupplier = {
              id: UUIDUtils.generateId(), // Frontend-ID (eindeutig pro Lieferant)
              isNew: true,
              isDirty: true,
              syncStatus: 'pending',
              name: supplierName,
              contactPerson: '',
              email: '',
              website: '',
              address: {
                street: '',
                zipCode: '',
                city: '',
                country: ''
              },
              phoneNumbers: [],
              notes: ''
              // Keine Timestamps - werden von PostgreSQL automatisch gesetzt
            };
            
            newSuppliers.push(newSupplier);
            supplierMap.set(supplierNameLower, newSupplier.id);
            article.supplierId = newSupplier.id;
            console.log(`Neuer Lieferant erstellt: "${supplierName}" mit ID: ${newSupplier.id}`);
          } else {
            // Bestehender Lieferant - ID verwenden
            const existingSupplierId = supplierMap.get(supplierNameLower);
            article.supplierId = existingSupplierId;
            console.log(`Bestehender Lieferant gefunden: "${supplierName}" mit ID: ${existingSupplierId}`);
          }
          
          // WICHTIG: Entferne das alte 'supplier'-Feld nach der Verarbeitung
          delete article.supplier;
        } else {
          // Kein Lieferant angegeben - Standardwert oder Fehler
          console.warn(`Artikel "${article.name}" hat keinen Lieferanten angegeben`);
          // Optional: Einen Standard-Lieferanten zuweisen oder den Artikel überspringen
          // article.supplierId = 'default_supplier_id';
        }

        // Kategorie-Verarbeitung
        if (fieldMappings.category === '__DEFAULT__') {
          // Wenn eine Kategorie explizit ausgewählt wurde, verwende diese für alle Artikel
          if (defaultValues.category) {
            article.category = defaultValues.category;
          }
          // Wenn keine Kategorie ausgewählt wurde, verwende suggestCategory
          else if (article.name && article.name.trim()) {
            const suggestedCategory = suggestCategory(article.name, categoryManager.getCustomCategories());
            if (suggestedCategory) {
              article.category = suggestedCategory;
            } else {
              article.category = '';
            }
          }
        }

        // Intelligente Artikelnummer-Generierung, wenn Standardwert "Standardwert übernehmen" ist
        if (fieldMappings.supplierArticleNumber === '__DEFAULT__' && article.name && article.name.trim()) {
          // Verwende das benutzerdefinierte Muster aus dem Standardwert-Feld, falls vorhanden
          const userPattern = defaultValues.supplierArticleNumber && defaultValues.supplierArticleNumber !== 'Standardwert übernehmen' 
            ? defaultValues.supplierArticleNumber 
            : undefined;
          const generatedArticleNumber = generateArticleNumber(article.name, userPattern);
          if (generatedArticleNumber) {
            article.supplierArticleNumber = generatedArticleNumber;
          } else {
            // Wenn keine Artikelnummer generiert wurde, setze leeren String
            article.supplierArticleNumber = '';
          }
        }
        
        // Standardwerte für fehlende Felder setzen
        if (!article.category) article.category = '';
        if (!article.bundleUnit) article.bundleUnit = 'Stück';
        if (!article.contentUnit) article.contentUnit = 'Stück';
        if (article.content) {
          article.content = parseGermanNumber(article.content);
        } else {
          article.content = 1;
        }
        // Arrays korrekt verarbeiten
        if (article.allergens && typeof article.allergens === 'string') {
          article.allergens = article.allergens.split(',').map((item: string) => item.trim()).filter((item: string) => item);
        } else if (!article.allergens) {
          article.allergens = [];
        }
        
        if (article.additives && typeof article.additives === 'string') {
  article.additives = article.additives.split(',').map((item: string) => item.trim()).filter((item: string) => item);
} else if (!article.additives) {
  article.additives = [];
}
    
        
        // Preise als Zahlen konvertieren (deutsche Zahlenformate unterstützen)
        if (article.bundlePrice) {
          article.bundlePrice = parseGermanNumber(article.bundlePrice);
        }
            if (article.pricePerUnit) {
      article.pricePerUnit = parseGermanNumber(article.pricePerUnit);
    }
        if (!article.pricePerUnit) {
          article.pricePerUnit = parseGermanNumber(article.bundlePrice);
        }
        
        // MwSt-Satz als Zahl konvertieren (deutsche Zahlenformate unterstützen)
        if (article.vatRate) {
          const vatString = article.vatRate.toString();
          if (vatString.includes('%')) {
            article.vatRate = parseGermanNumber(vatString.replace('%', '')) || 19;
          } else {
            article.vatRate = parseGermanNumber(vatString) || 19;
          }
        } else {
          article.vatRate = 19; // Standard MwSt-Satz
        }
        
        // Nährwertangaben verarbeiten - nur wenn eine Zuordnung für das Hauptfeld existiert
        const nutritionMapping = fieldMappings['nutritionInfo'];
        if (nutritionMapping && nutritionMapping !== '__DEFAULT__' && nutritionMapping !== '') {
          // Nur dann Nährwertangaben initialisieren und verarbeiten
          if (!article.nutritionInfo) {
            article.nutritionInfo = {
              calories: 0,
              kilojoules: 0,
              protein: 0,
              fat: 0,
              carbohydrates: 0,
              fiber: 0,
              sugar: 0,
              salt: 0
            };
          }
          
          // Prüfe ob es sich um die spezielle Nährwert-Option handelt
          if (nutritionMapping.startsWith('[Nährwertfelder:') && nutritionMapping.endsWith(']')) {
            // Extrahiere die erkannten Nährwertfelder aus der Option
            const nutritionHeadersString = nutritionMapping.slice(16, -1); // Entferne "[Nährwertfelder: " und "]"
            const detectedNutritionHeaders = nutritionHeadersString.split(', ').map(h => h.trim());
            
            // Definiere die Zuordnung von Spaltennamen zu Nährwertfeldern
            const nutritionFields = {
              calories: ['kalorien', 'calories', 'energie', 'energy'],
              kilojoules: ['kilojoule', 'kilojoules', 'kj'],
              protein: ['protein', 'eiweiß', 'eiweiss'],
              fat: ['fett', 'fat', 'fette'],
              carbohydrates: ['kohlenhydrate', 'carbohydrates', 'carbs'],
              fiber: ['ballaststoffe', 'fiber', 'faser'],
              sugar: ['zucker', 'sugar', 'zuckerstoffe'],
              salt: ['salz', 'salt', 'natrium', 'sodium']
            };
            
            // Verarbeite alle erkannten Nährwertfelder
            detectedNutritionHeaders.forEach(header => {
              Object.entries(nutritionFields).forEach(([field, searchTerms]) => {
                if (searchTerms.some(term => header.toLowerCase().includes(term.toLowerCase()))) {
                  if (row[header]) {
                    const value = parseGermanNumber(row[header]);
                    if (!isNaN(value)) {
                      article.nutritionInfo[field] = value;
                    }
                  }
                }
              });
            });
          } else {
            // Normale Verarbeitung für einzelne Nährwertspalte
            const nutritionValue = row[nutritionMapping];
            if (nutritionValue) {
              // Wenn es ein einzelner Wert ist, versuchen wir ihn als Kalorien zu interpretieren
              if (typeof nutritionValue === 'string' || typeof nutritionValue === 'number') {
                const numValue = parseGermanNumber(nutritionValue);
                if (!isNaN(numValue)) {
                  article.nutritionInfo.calories = numValue;
                }
              }
            }
            
            // Einzelne Nährwertfelder verarbeiten (falls vorhanden)
            const nutritionFields = {
              calories: ['kalorien', 'calories', 'energie', 'energy'],
              kilojoules: ['kilojoule', 'kilojoules', 'kj'],
              protein: ['protein', 'eiweiß', 'eiweiss'],
              fat: ['fett', 'fat', 'fette'],
              carbohydrates: ['kohlenhydrate', 'carbohydrates', 'carbs'],
              fiber: ['ballaststoffe', 'fiber', 'faser'],
              sugar: ['zucker', 'sugar', 'zuckerstoffe'],
              salt: ['salz', 'salt', 'natrium', 'sodium']
            };
            
            // Suche nach Nährwertfeldern in den verfügbaren Spalten
            Object.entries(nutritionFields).forEach(([field, searchTerms]) => {
              // Suche nach entsprechenden Spalten in den verfügbaren Daten
              const availableHeaders = Object.keys(row);
              const matchingHeader = availableHeaders.find(header => 
                searchTerms.some(term => 
                  header.toLowerCase().includes(term.toLowerCase())
                )
              );
              
              if (matchingHeader && row[matchingHeader]) {
                const value = parseGermanNumber(row[matchingHeader]);
                if (!isNaN(value)) {
                  article.nutritionInfo[field] = value;
                }
              }
            });
          }
        } else {
          // Keine Zuordnung für Nährwertangaben - setze auf null
          article.nutritionInfo = null;
        }

        // Nur Artikel mit allen erforderlichen Feldern hinzufügen
        if (article.name && article.supplierId && article.bundlePrice) {
          // Duplikat-Erkennung: Prüfe auf gleichen Namen oder Artikelnummer beim gleichen Lieferanten
          // 1. Gegen bereits importierte Artikel in dieser Session
          const isDuplicateInImport = importedArticles.some(existingArticle => {
            // Gleicher Name beim gleichen Lieferanten
            const sameNameSameSupplier = existingArticle.name.toLowerCase() === article.name.toLowerCase() && 
                                       existingArticle.supplierId === article.supplierId;
            
            // Gleiche Artikelnummer beim gleichen Lieferanten (falls Artikelnummer vorhanden)
            const sameArticleNumberSameSupplier = article.supplierArticleNumber && 
                                                existingArticle.supplierArticleNumber &&
                                                existingArticle.supplierArticleNumber.toLowerCase() === article.supplierArticleNumber.toLowerCase() && 
                                                existingArticle.supplierId === article.supplierId;
            
            return sameNameSameSupplier || sameArticleNumberSameSupplier;
          });
          
          // 2. Gegen bestehende Artikel in der App
          const isDuplicateInExisting = articles.some(existingArticle => {
            // Gleicher Name beim gleichen Lieferanten
            const sameNameSameSupplier = existingArticle.name.toLowerCase() === article.name.toLowerCase() && 
                                       existingArticle.supplierId === article.supplierId;
            
            // Gleiche Artikelnummer beim gleichen Lieferanten (falls Artikelnummer vorhanden)
            const sameArticleNumberSameSupplier = article.supplierArticleNumber && 
                                                existingArticle.supplierArticleNumber &&
                                                existingArticle.supplierArticleNumber.toLowerCase() === article.supplierArticleNumber.toLowerCase() && 
                                                existingArticle.supplierId === article.supplierId;
            
            return sameNameSameSupplier || sameArticleNumberSameSupplier;
          });
          
          if (isDuplicateInImport) {
            console.warn(`⚠️ Artikel "${article.name}" (${article.supplierArticleNumber || 'keine Artikelnummer'}) wurde übersprungen - Duplikat in der Import-Datei gefunden`);
            continue; // Überspringe diesen Artikel
          } else if (isDuplicateInExisting) {
            console.warn(`⚠️ Artikel "${article.name}" (${article.supplierArticleNumber || 'keine Artikelnummer'}) wurde übersprungen - bereits in der App vorhanden`);
            continue; // Überspringe diesen Artikel
          } else {
            importedArticles.push(article);
            console.log(`✅ Artikel "${article.name}" erfolgreich zur Import-Liste hinzugefügt`);
          }
        } else {
          console.warn(`⚠️ Artikel "${article.name}" wurde nicht importiert - fehlende erforderliche Felder:`, {
            name: !!article.name,
            supplierId: !!article.supplierId,
            bundlePrice: !!article.bundlePrice
          });
        }
      }

      // Import abgeschlossen - alle neuen Lieferanten und Artikel auf einmal hinzufügen
      if (onImportComplete) {
        onImportComplete(newSuppliers, importedArticles);
      }

      // Data will be automatically saved by the parent component's useEffect

      // Erfolgsmeldung
      const message = `Import erfolgreich!\n\n` +
        `- ${importedArticles.length} Artikel importiert\n` +
        `- ${newSuppliers.length} neue Lieferanten erstellt\n` +
        `- ${dataRows.length - importedArticles.length} Artikel übersprungen (fehlende erforderliche Felder oder Duplikate)\n\n` +
        `Die Daten wurden zu Ihrer Artikelliste hinzugefügt.`;
      
      showMessage('success', 'Erfolg', message);
      // onClose() wird erst nach dem Schließen der Meldung aufgerufen

    } catch (error) {
      console.error('Import-Fehler:', error);
      showMessage('error', 'Fehler', 'Fehler beim Importieren der Datei. Bitte überprüfen Sie das Format und versuchen Sie es erneut.');
    }
  };

  // Hilfsfunktion zum Parsen deutscher Zahlenformate (Komma als Dezimaltrennzeichen)
  const parseGermanNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;
    
    // Entferne Leerzeichen und Währungssymbole
    let cleaned = value.trim().replace(/\s/g, '').replace(/[€$£]/g, '');
    
    // Entferne alle Punkte (Tausendertrennzeichen) und ersetze Komma durch Punkt (Dezimaltrennzeichen)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    
    // Versuche zu parsen
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Hilfsfunktion zum Lesen der Datei als Text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const text = decodeText(buffer, detectedEncoding);
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Trennzeichen erkennen
  const detectSeparator = (text: string): string => {
    const firstLine = text.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    
    if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
    if (semicolonCount > commaCount) return ';';
    return ',';
  };

  // Unicode-Codierung erkennen
  const detectEncoding = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    
    // UTF-8 BOM erkennen
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return 'UTF-8-BOM';
    }
    
    // UTF-16 LE BOM erkennen
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return 'UTF-16-LE';
    }
    
    // UTF-16 BE BOM erkennen
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return 'UTF-16-BE';
    }
    
    // Prüfen auf deutsche Umlaute in verschiedenen Encodings
    const text = new TextDecoder('utf-8').decode(bytes);
    if (text.includes('ä') || text.includes('ö') || text.includes('ü') || text.includes('ß')) {
      return 'UTF-8';
    }
    
    // Versuche Windows-1252 für deutsche Zeichen
    try {
      const decoder = new TextDecoder('windows-1252');
      const text1252 = decoder.decode(bytes);
      if (text1252.includes('ä') || text1252.includes('ö') || text1252.includes('ü') || text1252.includes('ß')) {
        return 'Windows-1252';
      }
    } catch (e) {
      // Ignoriere Fehler
    }
    
    // Versuche ISO-8859-1 für deutsche Zeichen
    try {
      const decoder = new TextDecoder('iso-8859-1');
      const textISO = decoder.decode(bytes);
      if (textISO.includes('ä') || textISO.includes('ö') || textISO.includes('ü') || textISO.includes('ß')) {
        return 'ISO-8859-1';
      }
    } catch (e) {
      // Ignoriere Fehler
    }
    
    return 'UTF-8'; // Standard
  };

  // Text mit erkanntem Encoding dekodieren
  const decodeText = (buffer: ArrayBuffer, encoding: string): string => {
    try {
      switch (encoding) {
        case 'UTF-8-BOM':
          return new TextDecoder('utf-8').decode(buffer.slice(3));
        case 'UTF-16-LE':
          return new TextDecoder('utf-16le').decode(buffer.slice(2));
        case 'UTF-16-BE':
          return new TextDecoder('utf-16be').decode(buffer.slice(2));
        case 'Windows-1252':
          return new TextDecoder('windows-1252').decode(buffer);
        case 'ISO-8859-1':
          return new TextDecoder('iso-8859-1').decode(buffer);
        default:
          return new TextDecoder('utf-8').decode(buffer);
      }
    } catch (e) {
      // Fallback zu UTF-8
      return new TextDecoder('utf-8').decode(buffer);
    }
  };

  // Levenshtein-Distanz für String-Ähnlichkeit berechnen
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  };

  // Export-Funktion
  const handleExport = () => {
    try {
      // Artikel für Export vorbereiten
      const articlesToExport = exportOptions.exportAllRecords ? articles : getFilteredArticles();
      
      if (articlesToExport.length === 0) {
        showMessage('error', 'Export Fehler', 'Keine Artikel zum Exportieren verfügbar.');
        return;
      }

      // Spalten für Export bestimmen
      const columnsToExport = exportOptions.includeAllFields 
        ? exportFields
        : selectedColumns;

      // Daten für Export vorbereiten
      const exportData = articlesToExport.map(article => {
        const exportRow: any = {};
        
        columnsToExport.forEach(column => {
          switch (column) {
            case 'name':
              exportRow.name = article.name;
              break;
            case 'category':
              exportRow.category = article.category;
              break;
            case 'supplierId':
              // Lieferantennamen statt ID exportieren
              const supplier = suppliers.find(s => s.id === article.supplierId);
              exportRow.supplier = supplier ? supplier.name : 'Unbekannter Lieferant';
              break;
            case 'supplierArticleNumber':
              exportRow.artikelnummer = article.supplierArticleNumber || '';
              break;
            case 'vatRate':
              exportRow.mwstSatz = article.vatRate;
              break;
            case 'bundleUnit':
              exportRow.gebindeeinheit = article.bundleUnit;
              break;
            case 'bundlePrice':
              exportRow.gebindepreis = exportOptions.formatNumbers ? 
                (typeof article.bundlePrice === 'number' ? article.bundlePrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : article.bundlePrice) : 
                article.bundlePrice;
              break;
            case 'content':
              exportRow.inhalt = article.content;
              break;
            case 'contentUnit':
              exportRow.inhaltseinheit = article.contentUnit;
              break;
                                  case 'pricePerUnit':
                        exportRow.inhaltspreis = exportOptions.formatNumbers ?
                          (typeof article.pricePerUnit === 'number' ? article.pricePerUnit.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : article.pricePerUnit) :
                          article.pricePerUnit;
                        break;
            case 'ingredients':
              // Inhaltsstoffe als Komma-getrennter String für CSV/Excel, als Array für JSON
              if (exportFileType === 'json') {
                exportRow.inhaltsstoffe = article.ingredients || [];
              } else {
                exportRow.inhaltsstoffe = Array.isArray(article.ingredients) ? article.ingredients.join(', ') : article.ingredients || '';
              }
              break;
            case 'additives':
              // Zusatzstoffe als Komma-getrennter String für CSV/Excel, als Array für JSON
              if (exportFileType === 'json') {
                exportRow.zusatzstoffe = article.additives || [];
              } else {
                exportRow.zusatzstoffe = Array.isArray(article.additives) ? article.additives.join(', ') : article.additives || '';
              }
              break;
            case 'allergens':
              // Allergene als Komma-getrennter String für CSV/Excel, als Array für JSON
              if (exportFileType === 'json') {
                exportRow.allergene = article.allergens || [];
              } else {
                exportRow.allergene = Array.isArray(article.allergens) ? article.allergens.join(', ') : article.allergens || '';
              }
              break;
            case 'nutritionInfo':
              // Nährwertangaben - wenn ausgewählt, alle Nährwertfelder exportieren
              if (article.nutritionInfo) {
                exportRow.kalorien = article.nutritionInfo.calories || 0;
                exportRow.kilojoule = article.nutritionInfo.kilojoules || 0;
                exportRow.protein = article.nutritionInfo.protein || 0;
                exportRow.fett = article.nutritionInfo.fat || 0;
                exportRow.kohlenhydrate = article.nutritionInfo.carbohydrates || 0;
                exportRow.ballaststoffe = article.nutritionInfo.fiber || 0;
                exportRow.zucker = article.nutritionInfo.sugar || 0;
                exportRow.salz = article.nutritionInfo.salt || 0;
              } else {
                exportRow.kalorien = 0;
                exportRow.kilojoule = 0;
                exportRow.protein = 0;
                exportRow.fett = 0;
                exportRow.kohlenhydrate = 0;
                exportRow.ballaststoffe = 0;
                exportRow.zucker = 0;
                exportRow.salz = 0;
              }
              break;
            default:
              // Fallback für alle anderen Felder
              exportRow[column] = article[column];
              break;
          }
        });
        
        return exportRow;
      });

      // Zeitstempel für Dateinamen
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const baseFileName = `The_Chef's_Numbers_Artikel - ${timestamp}`;

      // Datei je nach Typ erstellen und herunterladen
      switch (exportFileType) {
        case 'csv':
          exportToCSV(exportData, baseFileName);
          break;
        case 'json':
          exportToJSON(exportData, baseFileName);
          break;
        case 'excel':
          exportToExcel(exportData, baseFileName);
          break;
      }

      showMessage('success', 'Export erfolgreich', 
        `${articlesToExport.length} Artikel wurden erfolgreich als ${exportFileType.toUpperCase()}-Datei exportiert.`);
    } catch (error) {
      console.error('Export Fehler:', error);
      showMessage('error', 'Export Fehler', 'Beim Export ist ein Fehler aufgetreten.');
    }
  };

  // CSV Export
  const exportToCSV = (data: any[], fileName: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    
    // Mapping von Export-Feldnamen zu benutzerfreundlichen Labels
    const headerLabels: {[key: string]: string} = {
      name: 'Artikelname',
      category: 'Kategorie',
      supplier: 'Lieferant',
      artikelnummer: 'Artikelnummer',
      mwstSatz: 'MwSt-Satz',
      gebindeeinheit: 'Gebindeeinheit',
      gebindepreis: 'Gebindepreis',
      inhalt: 'Inhalt',
      inhaltseinheit: 'Inhaltseinheit',
      inhaltspreis: 'Inhaltspreis',
      inhaltsstoffe: 'Inhaltsstoffe',
      zusatzstoffe: 'Zusatzstoffe',
      allergene: 'Allergene',
      kalorien: 'Kalorien',
      kilojoule: 'Kilojoule',
      protein: 'Protein',
      fett: 'Fett',
      kohlenhydrate: 'Kohlenhydrate',
      ballaststoffe: 'Ballaststoffe',
      zucker: 'Zucker',
      salz: 'Salz'
    };

    // Funktion zur Formatierung von Zahlen mit deutschem Format
    const formatValueForCSV = (value: any, header: string): string => {
      // Zahlenfelder mit deutschem Format (Komma als Dezimaltrenner)
      const numericFields = ['mwstSatz', 'gebindepreis', 'inhalt', 'inhaltspreis', 'kalorien', 'kilojoule', 'protein', 'fett', 'kohlenhydrate', 'ballaststoffe', 'zucker', 'salz'];
      
      if (numericFields.includes(header) && typeof value === 'number') {
        return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      
      // String-Werte in Anführungszeichen einschließen, falls sie Semikolons enthalten
      if (typeof value === 'string' && value.includes(';')) {
        return `"${value}"`;
      }
      
      return String(value);
    };

    const csvContent = [
      exportOptions.includeHeaders ? headers.map(header => headerLabels[header] || header).join(';') : '',
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return formatValueForCSV(value, header);
      }).join(';'))
    ].filter(row => row !== '').join('\n');

    // UTF-8 mit BOM für bessere Kompatibilität mit Windows-1252
    const bom = '\uFEFF'; // UTF-8 BOM
    const contentWithBom = bom + csvContent;
    
    downloadFile(contentWithBom, `${fileName}.csv`, 'text/csv;charset=utf-8');
  };

  // JSON Export
  const exportToJSON = (data: any[], fileName: string) => {
    const jsonContent = exportOptions.includeMetadata ? 
      JSON.stringify({
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: data.length,
          exportOptions: exportOptions,
          filters: exportOptions.exportAllRecords ? null : exportFilters
        },
        data: data
      }, null, 2) : 
      JSON.stringify(data, null, 2);

    downloadFile(jsonContent, `${fileName}.json`, 'application/json');
  };

  // Excel Export (als CSV mit Excel-kompatiblen Einstellungen)
  const exportToExcel = (data: any[], fileName: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    
    // Mapping von Export-Feldnamen zu benutzerfreundlichen Labels
    const headerLabels: {[key: string]: string} = {
      name: 'Artikelname',
      category: 'Kategorie',
      supplier: 'Lieferant',
      artikelnummer: 'Artikelnummer',
      mwstSatz: 'MwSt-Satz',
      gebindeeinheit: 'Gebindeeinheit',
      gebindepreis: 'Gebindepreis',
      inhalt: 'Inhalt',
      inhaltseinheit: 'Inhaltseinheit',
      inhaltspreis: 'Inhaltspreis',
      inhaltsstoffe: 'Inhaltsstoffe',
      zusatzstoffe: 'Zusatzstoffe',
      allergene: 'Allergene',
      kalorien: 'Kalorien',
      kilojoule: 'Kilojoule',
      protein: 'Protein',
      fett: 'Fett',
      kohlenhydrate: 'Kohlenhydrate',
      ballaststoffe: 'Ballaststoffe',
      zucker: 'Zucker',
      salz: 'Salz'
    };

    const csvContent = [
      exportOptions.includeHeaders ? headers.map(header => headerLabels[header] || header).join('\t') : '',
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Excel-Werte in Anführungszeichen einschließen, falls sie Tabs enthalten
        return typeof value === 'string' && value.includes('\t') ? `"${value}"` : value;
      }).join('\t'))
    ].filter(row => row !== '').join('\n');

    downloadFile(csvContent, `${fileName}.xls`, 'application/vnd.ms-excel');
  };

  // Hilfsfunktion zum Parsen von JSON-Dateien
  const parseJSONFile = async (file: File): Promise<{ headers: string[], data: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const jsonData = JSON.parse(text);
          
          // JSON-Daten in Tabellenformat konvertieren
          let dataArray: any[];
          if (Array.isArray(jsonData)) {
            dataArray = jsonData;
          } else if (jsonData.articles && Array.isArray(jsonData.articles)) {
            dataArray = jsonData.articles;
          } else if (jsonData.data && Array.isArray(jsonData.data)) {
            dataArray = jsonData.data;
          } else {
            dataArray = [jsonData];
          }
          
          if (dataArray.length === 0) {
            reject(new Error('Keine gültigen Daten in der JSON-Datei gefunden'));
            return;
          }
          
          // Alle möglichen Felder aus allen Objekten sammeln
          const allFields = new Set<string>();
          dataArray.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              Object.keys(item).forEach(key => allFields.add(key));
            }
          });
          
          const headers = Array.from(allFields);
          
          resolve({ headers, data: dataArray });
        } catch (error) {
          reject(new Error('Fehler beim Parsen der JSON-Datei: ' + error));
        }
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsText(file);
    });
  };

  // Hilfsfunktion zum Parsen von Excel-Dateien
  const parseExcelFile = async (file: File): Promise<{ headers: string[], data: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const text = new TextDecoder('utf-8').decode(buffer);
          
          // Excel-Datei als tab-separierte Werte behandeln
          const lines = text.split('\n').filter(line => line.trim() !== '');
          if (lines.length === 0) {
            reject(new Error('Keine Daten in der Excel-Datei gefunden'));
            return;
          }
          
          const headers = lines[0].split('\t').map(h => h.trim().replace(/"/g, ''));
          const data = lines.slice(1).map(line => {
            const values = line.split('\t').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });
          
          resolve({ headers, data });
        } catch (error) {
          reject(new Error('Fehler beim Parsen der Excel-Datei: ' + error));
        }
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Hilfsfunktion zum Herunterladen von Dateien
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div 
        className="modal fade show" 
        style={{ 
          display: 'block', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 1050,
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}
      >
                 <div className="modal-dialog" style={{ maxWidth: '900px', width: '90vw' }}>
           <div className="modal-content" style={{ backgroundColor: colors.card, maxHeight: '80vh' }}>
            {/* Header */}
            <div className="modal-header" style={{ backgroundColor: colors.secondary }}>
              <h5 className="modal-title" style={{ color: colors.text }}>
                <FaFileUpload className="me-2" />
                Artikel Import/Export
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                style={{ filter: 'invert(1)' }}
              ></button>
            </div>
            
                         {/* Body */}
             <div className="modal-body" style={{ overflowY: 'auto', height: 'calc(80vh - 120px)', minHeight: '500px' }}>
               {/* Tab Navigation */}
               <div className="d-flex mb-4" style={{ borderBottom: `2px solid ${colors.accent}` }}>
                <div
                  className="flex-fill text-center"
                  style={{
                    cursor: 'pointer',
                    fontWeight: activeTab === 'import' ? 'bold' : 'normal',
                    color: activeTab === 'import' ? colors.accent : colors.text,
                    borderBottom: activeTab === 'import' ? `2px solid ${colors.accent}` : 'none',
                    padding: '0.5rem 0'
                  }}
                  onClick={() => setActiveTab('import')}
                >
                  <FaFileUpload className="me-2" />
                  Import
                </div>
                <div
                  className="flex-fill text-center"
                  style={{
                    cursor: 'pointer',
                    fontWeight: activeTab === 'export' ? 'bold' : 'normal',
                    color: activeTab === 'export' ? colors.accent : colors.text,
                    borderBottom: activeTab === 'export' ? `2px solid ${colors.accent}` : 'none',
                    padding: '0.5rem 0'
                  }}
                  onClick={() => setActiveTab('export')}
                >
                  <FaDownload className="me-2" />
                  Export
                </div>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'import' && (
                  <div className="tab-pane active">      
                   
                                                                {/* Dateiauswahl */}
                       <div className="mb-4">
                         <div className="d-flex align-items-center gap-3">
                           {selectedFile && (
                             <div className="mb-3">
                               <small className="text-muted" style={{ color: colors.textSecondary }}>
                                 Dateityp: {fileType === 'csv' ? 'CSV' : fileType === 'json' ? 'JSON' : 'Excel'}
                                 {fileType === 'csv' && `, Trennzeichen: "${detectedSeparator === ',' ? 'Komma' : detectedSeparator === ';' ? 'Semikolon' : 'Tab'}"`}
                                 , Encoding: {detectedEncoding}
                               </small>
                             </div>
                           )}
                         </div>
                         <div className="d-flex align-items-center gap-3">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handleBrowseClick}
                          style={{
                            borderColor: colors.accent,
                            color: colors.accent,
                            backgroundColor: 'transparent'
                          }}
                        >
                          <FaFolderOpen className="me-2" />
                          Datei auswählen
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.json,.xlsx,.xls"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                                                 <div className="flex-grow-1">
                           <div 
                             className="form-control-plaintext" 
                             style={{ 
                               color: selectedFile ? colors.text : colors.textSecondary,
                               fontStyle: selectedFile ? 'normal' : 'italic',
                               border: `1px solid ${colors.border}`,
                               borderRadius: '4px',
                               padding: '0.375rem 0.75rem',
                               backgroundColor: colors.card,
                               minHeight: '38px',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'space-between'
                             }}
                           >
                             <span>{selectedFile ? selectedFile.name : 'Keine Datei ausgewählt'}</span>
                             {selectedFile && (
                               <small className="text-muted" style={{ color: colors.textSecondary, marginLeft: '1rem' }}>
                                 {(selectedFile.size / 1024).toFixed(2)} KB
                               </small>
                             )}
                           </div>
                         </div>
                                              </div>
                     </div>

                     {/* Datenfelder zuordnen */}
                     {selectedFile && csvHeaders.length > 0 && (
                       <div className="mb-4">
                                                   <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            Datenfelder zuordnen
                          </h6>
                                                   <div className="table-responsive">
                                                         <table className="table table-hover" style={{
                               backgroundColor: 'transparent',
                               borderColor: colors.cardBorder
                             }}>
                                                                                                 <thead style={{ backgroundColor: 'transparent'}}>
                                      <tr>
                                        <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '25%' }}>Artikel-Feld</th>
                                        <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '45%' }}>{fileType === 'csv' ? 'CSV-Feld' : fileType === 'json' ? 'JSON-Feld' : 'Excel-Feld'}</th>
                                        <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '10%' }}>Qualität</th>
                                        <th style={{ borderColor: colors.cardBorder, color: colors.text, width: '20%' }}>Standard-Wert</th>
                                      </tr>
                                    </thead>
                              <tbody>
                                {articleFields.map((field) => (
                                  <tr 
                                    key={field} 
                                    style={{ 
                                      borderColor: colors.cardBorder,
                                      cursor: 'pointer'
                                    }}
                                  >
                                                                                                               <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                                        {fieldLabels[field] || field}
                                      </td>
                                                                                                                                                         <td style={{ borderColor: colors.cardBorder }}>
                                        <select
                                          className="form-select form-select-sm"
                                          value={fieldMappings[field] || ''}
                                          onChange={(e) => handleFieldMappingChange(field, e.target.value)}
                                          style={{
                                            borderColor: colors.cardBorder,
                                            color: colors.text,
                                            backgroundColor: colors.input,
                                            width: '100%'
                                          }}
                                        >
                                      <option value="">-- Keine Zuordnung --</option>
                                      <option value="__DEFAULT__">Standardwert übernehmen</option>
                                      {field === 'nutritionInfo' && detectedNutritionHeaders.length > 0 ? (
                                        // Für Nährwertangaben nur die spezielle kombinierte Option anzeigen
                                        csvHeaders
                                          .filter(header => header.startsWith('[Nährwertfelder:'))
                                          .map((header) => (
                                            <option key={header} value={header}>
                                              {header}
                                            </option>
                                          ))
                                      ) : (
                                        // Für alle anderen Felder alle verfügbaren Header anzeigen
                                        csvHeaders.map((header) => (
                                          <option key={header} value={header}>
                                            {header}
                                          </option>
                                        ))
                                      )}
                                    </select>
                                      </td>
                                      <td style={{ borderColor: colors.cardBorder, textAlign: 'center' }}>
                                        {fieldMappings[field] && mappingScores[field] ? (
                                          <div
                                            className="badge text-muted"
                                            style={{
                                              backgroundColor: 'transparent',
                                              border: `1px solid ${colors.textSecondary}`,
                                              color: colors.textSecondary,
                                              fontSize: '0.7rem',
                                              padding: '0.2rem 0.4rem',
                                              minWidth: '40px',
                                              textAlign: 'center'
                                            }}
                                            title={`Zuordnungsqualität: ${Math.round(mappingScores[field])}%`}
                                          >
                                            {Math.round(mappingScores[field])}%
                                          </div>
                                        ) : (
                                          <span style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>-</span>
                                        )}
                                      </td>
                                                                                                                                                         <td style={{ borderColor: colors.cardBorder }}>
                                        {availableOptions[field as keyof typeof availableOptions] ? (
                                          <div style={{ position: 'relative' }}>
                                                                                    <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder={field === 'category' && !defaultValues[field] ? "Kategorie-Vorschläge" : "Standard-Wert eingeben..."}
                                          value={defaultValues[field] || ''}
                                          onChange={(e) => handleDefaultValueChange(field, e.target.value)}
                                          onFocus={() => handleInputFocus(field)}
                                          onBlur={() => handleInputBlur(field)}
                                          disabled={fieldMappings[field] !== '__DEFAULT__'}
                                          style={{
                                            borderColor: colors.cardBorder,
                                            color: fieldMappings[field] === '__DEFAULT__' ? colors.text : colors.textSecondary,
                                            backgroundColor: fieldMappings[field] === '__DEFAULT__' ? colors.input : colors.secondary,
                                            opacity: fieldMappings[field] === '__DEFAULT__' ? 1 : 0.6
                                          }}
                                        />
                                                                                         {showDropdown[field] && fieldMappings[field] === '__DEFAULT__' && (
                                               <div
                                                 style={{
                                                   position: 'absolute',
                                                   top: '100%',
                                                   left: 0,
                                                   right: 0,
                                                   zIndex: 1000,
                                                   backgroundColor: colors.input,
                                                   border: `1px solid ${colors.cardBorder}`,
                                                   borderRadius: '4px',
                                                   maxHeight: '150px',
                                                   overflowY: 'auto',
                                                   boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                 }}
                                               >
                                                {filteredOptions[field]?.map((option, index) => (
                                                  <div
                                                    key={`option-${field}-${index}-${option}`}
                                                    onClick={() => handleOptionSelect(field, option)}
                                                    style={{
                                                      padding: '0.5rem 0.75rem',
                                                      cursor: 'pointer',
                                                      color: colors.text,
                                                      borderBottom: index < filteredOptions[field].length - 1 ? `1px solid ${colors.cardBorder}` : 'none'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                  >
                                                    {option}
                                                  </div>
                                                ))}
                                                {filteredOptions[field]?.length === 0 && (
                                                  <div
                                                    style={{
                                                      padding: '0.5rem 0.75rem',
                                                      color: colors.textSecondary,
                                                      fontStyle: 'italic'
                                                    }}
                                                  >
                                                    Keine Vorschläge
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                    ) : (
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Standard-Wert"
                                          value={defaultValues[field] || ''}
                                          onChange={(e) => handleDefaultValueChange(field, e.target.value)}
                                          disabled={fieldMappings[field] !== '__DEFAULT__'}
                                          style={{
                                            borderColor: colors.cardBorder,
                                            color: fieldMappings[field] === '__DEFAULT__' ? colors.text : colors.textSecondary,
                                            backgroundColor: fieldMappings[field] === '__DEFAULT__' ? colors.input : colors.secondary,
                                            opacity: fieldMappings[field] === '__DEFAULT__' ? 1 : 0.6
                                          }}
                                        />
                                    )}
                                      </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                                                     </div>
                         </div>
                       )}

                       {/* Vorschau importierter Daten */}
                       {previewData.length > 0 && (
                         <div className="mb-4">
                           <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                             Vorschau importierter Daten
                           </h6>
                           <div className="table-responsive">
                             <table className="table table-hover" style={{
                               backgroundColor: 'transparent',
                               borderColor: colors.cardBorder
                             }}>
                               <thead style={{ backgroundColor: 'transparent'}}>
                                 <tr>
                                   <th style={{ borderColor: colors.cardBorder, color: colors.text }}>#</th>
                                   {csvHeaders.map((header, index) => (
                                     <th key={`header-${index}-${header}`} style={{ borderColor: colors.cardBorder, color: colors.text }}>
                                       {header}
                                     </th>
                                   ))}
                                 </tr>
                               </thead>
                               <tbody>
                                 {previewData.map((row, rowIndex) => (
                                   <tr 
                                     key={`preview-row-${rowIndex}`}
                                     style={{ 
                                       borderColor: colors.cardBorder,
                                       cursor: 'pointer'
                                     }}
                                   >
                                     <td style={{ borderColor: colors.cardBorder, color: colors.text, fontWeight: 'bold' }}>
                                       {rowIndex + 1}
                                     </td>
                                     {csvHeaders.map((header, colIndex) => (
                                       <td key={`preview-cell-${rowIndex}-${colIndex}-${header}`} style={{ borderColor: colors.cardBorder, color: colors.text }}>
                                         {row[header] || '-'}
                                       </td>
                                     ))}
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                           <small className="text-muted" style={{ color: colors.textSecondary }}>
                             Zeige die ersten {previewData.length} von {previewData.length} Datensätzen
                           </small>
                         </div>
                       )}
                     </div>
                   )}

                {activeTab === 'export' && (
                  <div className="tab-pane active">
                    {/* Dateityp Auswahl */}
                    <div className="mb-4">
                      <label className="form-label" style={{ color: colors.text, fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Dateityp auswählen
                      </label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="exportType"
                            id="exportCsv"
                            value="csv"
                            checked={exportFileType === 'csv'}
                            onChange={() => handleExportFileTypeChange('csv')}
                            style={{
                              accentColor: colors.accent,
                              borderColor: colors.cardBorder
                            }}
                          />
                          <label 
                            className="form-check-label" 
                            htmlFor="exportCsv"
                            style={{ color: colors.text, cursor: 'pointer' }}
                          >
                            <strong>CSV</strong>
                            <br />
                            <small style={{ color: colors.textSecondary }}>
                              Komma-getrennte Werte (Excel-kompatibel)
                            </small>
                          </label>
                        </div>
                        
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="exportType"
                            id="exportJson"
                            value="json"
                            checked={exportFileType === 'json'}
                            onChange={() => handleExportFileTypeChange('json')}
                            style={{
                              accentColor: colors.accent,
                              borderColor: colors.cardBorder
                            }}
                          />
                          <label 
                            className="form-check-label" 
                            htmlFor="exportJson"
                            style={{ color: colors.text, cursor: 'pointer' }}
                          >
                            <strong>JSON</strong>
                            <br />
                            <small style={{ color: colors.textSecondary }}>
                              JavaScript Object Notation (strukturiert)
                            </small>
                          </label>
                        </div>
                        
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="exportType"
                            id="exportExcel"
                            value="excel"
                            checked={exportFileType === 'excel'}
                            onChange={() => handleExportFileTypeChange('excel')}
                            style={{
                              accentColor: colors.accent,
                              borderColor: colors.cardBorder
                            }}
                          />
                          <label 
                            className="form-check-label" 
                            htmlFor="exportExcel"
                            style={{ color: colors.text, cursor: 'pointer' }}
                          >
                            <strong>Excel</strong>
                            <br />
                            <small style={{ color: colors.textSecondary }}>
                              Microsoft Excel Format (.xlsx)
                            </small>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Export-Optionen */}
                    <div className="mb-4">
                      <h6 style={{ color: colors.text, marginBottom: '1rem' }}>Export-Optionen</h6>
                      
                      <div className="row">
                        <div className="col-md-6">
                                                     <div className="form-check mb-3">
                             <input
                               className="form-check-input"
                               type="checkbox"
                               id="includeHeaders"
                               checked={exportOptions.includeHeaders}
                               onChange={(e) => handleExportOptionChange('includeHeaders', e.target.checked)}
                               style={{
                                 accentColor: colors.accent,
                                 borderColor: colors.cardBorder
                               }}
                             />
                             <label 
                               className="form-check-label" 
                               htmlFor="includeHeaders"
                               style={{ color: colors.text, cursor: 'pointer' }}
                             >
                               Spaltenüberschriften einschließen
                             </label>
                           </div>
                          
                                                     <div className="form-check mb-3">
                             <input
                               className="form-check-input"
                               type="checkbox"
                               id="includeMetadata"
                               checked={exportOptions.includeMetadata}
                               onChange={(e) => handleExportOptionChange('includeMetadata', e.target.checked)}
                               style={{
                                 accentColor: colors.accent,
                                 borderColor: colors.cardBorder
                               }}
                             />
                             <label 
                               className="form-check-label" 
                               htmlFor="includeMetadata"
                               style={{ color: colors.text, cursor: 'pointer' }}
                             >
                               Metadaten (ID, Erstellungsdatum) einschließen
                             </label>
                           </div>
                        </div>
                        
                        <div className="col-md-6">
                                                     <div className="form-check mb-3">
                             <input
                               className="form-check-input"
                               type="checkbox"
                               id="formatNumbers"
                               checked={exportOptions.formatNumbers}
                               onChange={(e) => handleExportOptionChange('formatNumbers', e.target.checked)}
                               style={{
                                 accentColor: colors.accent,
                                 borderColor: colors.cardBorder
                               }}
                             />
                             <label 
                               className="form-check-label" 
                               htmlFor="formatNumbers"
                               style={{ color: colors.text, cursor: 'pointer' }}
                             >
                               Zahlen im deutschen Format (Komma als Dezimaltrennzeichen)
                             </label>
                           </div>
                          
                                                     <div className="form-check mb-3">
                             <input
                               className="form-check-input"
                               type="checkbox"
                               id="includeAllFields"
                               checked={exportOptions.includeAllFields}
                               onChange={(e) => handleExportOptionChange('includeAllFields', e.target.checked)}
                               style={{
                                 accentColor: colors.accent,
                                 borderColor: colors.cardBorder
                               }}
                             />
                             <label 
                               className="form-check-label" 
                               htmlFor="includeAllFields"
                               style={{ color: colors.text, cursor: 'pointer' }}
                             >
                               Alle Felder einschließen
                             </label>
                           </div>
                           
                                                     <div className="form-check mb-3">
                             <input
                               className="form-check-input"
                               type="checkbox"
                               id="exportAllRecords"
                               checked={exportOptions.exportAllRecords}
                               onChange={(e) => handleExportOptionChange('exportAllRecords', e.target.checked)}
                               style={{
                                 accentColor: colors.accent,
                                 borderColor: colors.cardBorder
                               }}
                             />
                             <label 
                               className="form-check-label" 
                               htmlFor="exportAllRecords"
                               style={{ color: colors.text, cursor: 'pointer' }}
                             >
                               Alle Datensätze exportieren
                             </label>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Spaltenauswahl - nur sichtbar wenn nicht alle Felder */}
                    {!exportOptions.includeAllFields && (
                      <div className="mb-4">
                        <h6 style={{ color: colors.text, marginBottom: '1rem' }}>Spalten für Export auswählen</h6>
                        <div 
                          className="border rounded p-3" 
                          style={{ 
                            backgroundColor: colors.secondary,
                            borderColor: colors.cardBorder
                          }}
                        >
                          <div className="row">
                            {exportFields.map((field, index) => (
                              <div key={`export-field-${index}-${field}`} className="col-md-6 col-lg-4 mb-2">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`column-${field}`}
                                    checked={selectedColumns.includes(field)}
                                    onChange={(e) => handleColumnSelectionChange(field, e.target.checked)}
                                    style={{
                                      accentColor: colors.accent,
                                      borderColor: colors.cardBorder
                                    }}
                                  />
                                  <label 
                                    className="form-check-label" 
                                    htmlFor={`column-${field}`}
                                    style={{ 
                                      color: colors.text, 
                                      cursor: 'pointer',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    {fieldLabels[field]}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Schnellauswahl-Buttons */}
                          <div className="mt-3 pt-3 border-top" style={{ borderColor: colors.cardBorder }}>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setSelectedColumns(exportFields)}
                                style={{
                                  borderColor: colors.accent,
                                  color: colors.accent,
                                  fontSize: '0.8rem'
                                }}
                              >
                                Alle auswählen
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setSelectedColumns(['name', 'supplierId', 'supplierArticleNumber', 'bundlePrice'])}
                                style={{
                                  borderColor: colors.textSecondary,
                                  color: colors.textSecondary,
                                  fontSize: '0.8rem'
                                }}
                              >
                                Nur Pflichtfelder
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setSelectedColumns([])}
                                style={{
                                  borderColor: colors.textSecondary,
                                  color: colors.textSecondary,
                                  fontSize: '0.8rem'
                                }}
                              >
                                Alle abwählen
                              </button>
                            </div>
                            <small style={{ color: colors.textSecondary, display: 'block', marginTop: '0.5rem' }}>
                              {selectedColumns.length} von {exportFields.length} Spalten ausgewählt
                            </small>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Datensatz-Filterung - nur sichtbar wenn nicht alle Datensätze */}
                    {!exportOptions.exportAllRecords && (
                      <div className="mb-4">
                        <h6 style={{ color: colors.text, marginBottom: '1rem' }}>Datensätze filtern</h6>
                        <div 
                          className="border rounded p-3" 
                          style={{ 
                            backgroundColor: colors.secondary,
                            borderColor: colors.cardBorder
                          }}
                        >
                          <p style={{ color: colors.textSecondary, marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Wählen Sie die Kriterien für die zu exportierenden Datensätze aus. 
                            Die Filterung erfolgt basierend auf den ausgewählten Spalten.
                          </p>
                          
                          {/* Volltext-Suche für Artikelname */}
                          <div className="mb-3">
                            <label className="form-label" style={{ color: colors.text, fontSize: '0.9rem', fontWeight: '500' }}>
                              Artikelname suchen
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Artikelname eingeben..."
                              value={exportFilters.nameSearch}
                              onChange={(e) => handleFilterChange('nameSearch', e.target.value)}
                              style={{
                                backgroundColor: colors.card,
                                borderColor: colors.cardBorder,
                                color: colors.text,
                                fontSize: '0.9rem'
                              }}
                            />
                          </div>
                          
                          {/* Auswahlboxen für Kategorie, Lieferant, MwSt-Satz */}
                          <div className="row">
                            <div className="col-md-4 mb-3">
                              <label className="form-label" style={{ color: colors.text, fontSize: '0.9rem', fontWeight: '500' }}>
                                Kategorie
                              </label>
                              <div className="category-dropdown-container" style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Kategorie eingeben..."
                                  value={exportFilters.categoryFilter}
                                  onChange={(e) => handleFilterChange('categoryFilter', e.target.value)}
                                  onFocus={() => {
                                    // Show dropdown when focused
                                    setShowCategoryDropdown(true);
                                  }}
                                  style={{
                                    backgroundColor: colors.card,
                                    borderColor: colors.cardBorder,
                                    color: colors.text,
                                    fontSize: '0.9rem'
                                  }}
                                />
                                {showCategoryDropdown && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      right: 0,
                                      zIndex: 1000,
                                      backgroundColor: colors.input,
                                      border: `1px solid ${colors.cardBorder}`,
                                      borderRadius: '4px',
                                      maxHeight: '150px',
                                      overflowY: 'auto',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}
                                  >
                                    {categoryManager.getAllCategories()
                                      .filter(category => 
                                        category.toLowerCase().includes(exportFilters.categoryFilter.toLowerCase())
                                      )
                                      .map((category, index) => (
                                        <div
                                          key={`filter-category-${index}-${category}`}
                                          onClick={() => {
                                            handleFilterChange('categoryFilter', category);
                                            setShowCategoryDropdown(false);
                                          }}
                                          style={{
                                            padding: '0.5rem 0.75rem',
                                            cursor: 'pointer',
                                            color: colors.text,
                                            borderBottom: index < categoryManager.getAllCategories().filter(cat => 
                                              cat.toLowerCase().includes(exportFilters.categoryFilter.toLowerCase())
                                            ).length - 1 ? `1px solid ${colors.cardBorder}` : 'none'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.secondary;
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                        >
                                          {category}
                                        </div>
                                      ))}
                                    {categoryManager.getAllCategories().filter(category => 
                                      category.toLowerCase().includes(exportFilters.categoryFilter.toLowerCase())
                                    ).length === 0 && (
                                      <div
                                        style={{
                                          padding: '0.5rem 0.75rem',
                                          color: colors.textSecondary,
                                          fontStyle: 'italic'
                                        }}
                                      >
                                        Keine Kategorien gefunden
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="col-md-4 mb-3">
                              <label className="form-label" style={{ color: colors.text, fontSize: '0.9rem', fontWeight: '500' }}>
                                Lieferant
                              </label>
                              <select
                                className="form-select"
                                value={exportFilters.supplierFilter}
                                onChange={(e) => handleFilterChange('supplierFilter', e.target.value)}
                                style={{
                                  backgroundColor: colors.card,
                                  borderColor: colors.cardBorder,
                                  color: colors.text,
                                  fontSize: '0.9rem'
                                }}
                              >
                                <option value="">Alle Lieferanten</option>
                                {suppliers.map((supplier, index) => (
                                  <option key={`filter-supplier-${index}-${supplier.name}`} value={supplier.name}>{supplier.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="col-md-4 mb-3">
                              <label className="form-label" style={{ color: colors.text, fontSize: '0.9rem', fontWeight: '500' }}>
                                MwSt-Satz
                              </label>
                              <select
                                className="form-select"
                                value={exportFilters.vatRateFilter}
                                onChange={(e) => handleFilterChange('vatRateFilter', e.target.value)}
                                style={{
                                  backgroundColor: colors.card,
                                  borderColor: colors.cardBorder,
                                  color: colors.text,
                                  fontSize: '0.9rem'
                                }}
                              >
                                <option value="">Alle Sätze</option>
                                <option value="0">0%</option>
                                <option value="7">7%</option>
                                <option value="19">19%</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Numerische Filter für Preise */}
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label" style={{ color: colors.text, fontSize: '0.9rem', fontWeight: '500' }}>
                                Gebindepreis
                              </label>
                              <div className="input-group">
                                <select
                                  className="form-select"
                                  value={exportFilters.bundlePriceFilter.operator}
                                  onChange={(e) => handleNumericFilterChange('bundlePriceFilter', 'operator', e.target.value)}
                                  style={{
                                    maxWidth: '80px',
                                    backgroundColor: colors.card,
                                    borderColor: colors.cardBorder,
                                    color: colors.text,
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  <option value="=">=</option>
                                  <option value="<">&lt;</option>
                                  <option value=">">&gt;</option>
                                </select>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  value={exportFilters.bundlePriceFilter.value}
                                  onChange={(e) => handleNumericFilterChange('bundlePriceFilter', 'value', e.target.value)}
                                  style={{
                                    backgroundColor: colors.card,
                                    borderColor: colors.cardBorder,
                                    color: colors.text,
                                    fontSize: '0.9rem'
                                  }}
                                />
                                <span className="input-group-text" style={{ backgroundColor: colors.cardBorder, borderColor: colors.cardBorder, color: colors.text }}>
                                  €
                                </span>
                              </div>
                            </div>
                            

                          </div>
                          
                          {/* Filter zurücksetzen Button */}
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm me-2"
                                onClick={resetFilters}
                                style={{
                                  borderColor: colors.cardBorder,
                                  color: colors.textSecondary,
                                  fontSize: '0.85rem'
                                }}
                              >
                                Filter zurücksetzen
                              </button>

                            </div>
                            <small style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                              Filter werden automatisch gespeichert
                            </small>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Live-Vorschau der gefilterten Datensätze */}
                    <div className="mb-4">
                      <h6 style={{ color: colors.text, marginBottom: '1rem' }}>Live-Vorschau</h6>
                      <div 
                        className="border rounded p-3" 
                        style={{ 
                          backgroundColor: colors.secondary,
                          borderColor: colors.cardBorder,
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                            {exportOptions.exportAllRecords ? 'Alle Datensätze' : 'Gefilterte Datensätze'} werden exportiert
                            {!exportOptions.exportAllRecords && getActiveFilterCount() > 0 && (
                              <span style={{ color: colors.accent, fontWeight: '500' }}>
                                {' '}({getActiveFilterCount()} Filter aktiv)
                              </span>
                            )}
                          </small>
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: colors.accent, 
                              color: 'white',
                              fontSize: '0.8rem'
                            }}
                          >
                            {exportOptions.exportAllRecords ? 'Alle' : 'Gefiltert'}
                          </span>
                        </div>
                        
                        {exportOptions.exportAllRecords ? (
                          <div className="text-center py-4">
                            <div style={{ color: colors.textSecondary, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                              📊
                            </div>
                            <p style={{ color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                              Alle verfügbaren Artikel werden exportiert
                            </p>
                            <div style={{ color: colors.accent, fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                              {articles.length} Artikel
                            </div>
                            <small style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                              Aktivieren Sie "Datensätze filtern" für eine selektive Auswahl
                            </small>
                          </div>
                        ) : (
                          <div>
                            <div className="text-center mb-3">
                              <div style={{ color: colors.textSecondary, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                                🔍
                              </div>
                              <div style={{ color: colors.accent, fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {getFilteredArticles().length} von {articles.length} Artikeln
                              </div>
                            </div>
                            
                            {/* Vorschau der ersten 5 gefilterten Artikel */}
                            {getFilteredArticles().length > 0 ? (
                              <div>
                                <small style={{ color: colors.textSecondary, fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
                                  Vorschau (erste 5 Artikel):
                                </small>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                  {getFilteredArticles().slice(0, 5).map((article, index) => (
                                    <div 
                                      key={article.id} 
                                      className="border-bottom py-2"
                                      style={{ 
                                        borderColor: colors.cardBorder,
                                        fontSize: '0.85rem'
                                      }}
                                    >
                                      <div style={{ color: colors.text, fontWeight: '500' }}>
                                        {article.name}
                                      </div>
                                      <div style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
                                        {article.category} • {suppliers.find(s => s.id === article.supplierId)?.name || 'Unbekannter Lieferant'} • {article.bundlePrice}€
                                      </div>
                                    </div>
                                  ))}
                                  {getFilteredArticles().length > 5 && (
                                    <div style={{ color: colors.textSecondary, fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>
                                      ... und {getFilteredArticles().length - 5} weitere Artikel
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-3">
                                <div style={{ color: colors.textSecondary, fontSize: '1rem', marginBottom: '0.5rem' }}>
                                  ⚠️
                                </div>
                                <p style={{ color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                  Keine Artikel entsprechen den aktuellen Filtern
                                </p>
                                <small style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                                  Passen Sie die Filter-Kriterien an oder setzen Sie sie zurück
                                </small>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="modal-footer" style={{ backgroundColor: colors.cardBorder }}>
              <button 
                type="button" 
                className="btn btn-secondary me-2" 
                onClick={onClose}
                style={{ 
                  backgroundColor: colors.secondary, 
                  borderColor: colors.secondary,
                  color: colors.text,
                  minWidth: '120px'
                }}
              >
                <FaTimes className="me-2" />
                Abbrechen
              </button>
                             <button 
                 type="button" 
                 className="btn btn-primary"
                 disabled={
                   (activeTab === 'import' && !isImportValid()) ||
                   (activeTab === 'export' && getFilteredArticles().length === 0)
                 }
                 onClick={activeTab === 'import' ? handleImport : handleExport}
                 style={{ 
                   backgroundColor: (
                     (activeTab === 'import' && !isImportValid()) ||
                     (activeTab === 'export' && getFilteredArticles().length === 0)
                   ) ? colors.textSecondary : colors.primary, 
                   borderColor: (
                     (activeTab === 'import' && !isImportValid()) ||
                     (activeTab === 'export' && getFilteredArticles().length === 0)
                   ) ? colors.textSecondary : colors.primary,
                   color: 'white',
                   minWidth: '120px',
                   opacity: (
                     (activeTab === 'import' && !isImportValid()) ||
                     (activeTab === 'export' && getFilteredArticles().length === 0)
                   ) ? 0.6 : 1
                 }}
               >
                 {activeTab === 'import' ? (
                   <>
                     <FaFileUpload className="me-2" />
                     Import
                   </>
                 ) : (
                   <>
                     <FaDownload className="me-2" />
                     Export
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>
      </div>
      <MessageDialog
        show={messageDialog.show}
        type={messageDialog.type}
        title={messageDialog.title}
        message={messageDialog.message}
        onClose={closeMessage}
        colors={colors}
      />
    </>
  );
};

export default ArtikelDataExchange; 