import React, { useState, useEffect, useRef } from 'react';
import { FaUtensils, FaBars, FaTimes, FaCalculator, FaShoppingCart, FaBoxes, FaPalette, FaPlus, FaSearch, FaCog, FaUsers, FaTachometerAlt, FaEdit, FaTrash, FaList, FaTh, FaFilter, FaSort, FaPencilAlt, FaGlobe, FaTimes as FaClose, FaSave, FaArrowLeft, FaPercent, FaEuroSign, FaCheck, FaImage, FaPrint, FaDatabase, FaChevronDown, FaChevronRight, FaDownload, FaCode } from 'react-icons/fa';
import Dashboard from './Dashboard';
import Kalkulation from './Kalkulation';
import Einkauf from './Einkauf';
import Inventur from './Inventur';
import { ColorProvider } from '../contexts/ColorContext';
import ErrorBoundary from './ui/ErrorBoundary';
import { useStorage } from '../hooks/useStorage';
import { StorageMode, CloudStorageType, storageLayer } from '../services/storageLayer';
import LoadingSpinner from './ui/LoadingSpinner';
import StorageStatus from './ui/StorageStatus';
import { generateId } from '../utils/storageUtils';

import StorageManagement from './StorageManagement';
import DevelopmentPage from './DevelopmentPage';

import Rezeptverwaltung from './Rezeptverwaltung';
import Rezeptformular from './Rezeptformular';
import Artikelverwaltung from './Artikelverwaltung';
import Lieferantenformular from './Lieferantenformular';
import Lieferantenverwaltung from './Lieferantenverwaltung';
import Artikelformular from './Artikelformular';
import ArtikelDataExchange from './ArtikelDataExchange';

// Import der ausgelagerten Module
import { designTemplates, DesignTemplateKey } from '../constants/designTemplates';
import { UNITS, ALLERGENS, CATEGORIES } from '../constants/articleConstants';
import { useImportExport } from '../hooks/useImportExport';
import { calculateGrossPrice, calculateNetPrice, isValidUrl, openWebsite, formatPrice, calculateKilojoules, formatAdditivesDisplay, formatAllergensDisplay } from '../utils/helpers';
import { getRecipeIngredients, getRecipeAllergens } from '../utils/recipeHelpers';
import { useArticleHandlers } from '../hooks/useArticleHandlers';
import { useAppContext } from '../contexts/AppContext';
import { categoryManager } from '../utils/categoryManager';

function AppContent() {
  const { state, dispatch } = useAppContext();
  const { loadAppData, saveAppData, isLoading, lastSync, storageInfo, storageMode, cloudType } = useStorage();
  
  // Import/Export-System wird jetzt über den useImportExport Hook verwaltet
  const importExport = useImportExport();
  
  // Artikel-Handler werden jetzt über den useArticleHandlers Hook verwaltet
  const articleHandlers = useArticleHandlers(
    state.articles,
    (articles) => {
      if (typeof articles === 'function') {
        const newArticles = articles(state.articles);
        dispatch({ type: 'SET_ARTICLES', payload: newArticles });
      } else {
        dispatch({ type: 'SET_ARTICLES', payload: articles });
      }
    },
    state.selectedArticles,
    (selectedArticles) => {
      if (typeof selectedArticles === 'function') {
        const newSelectedArticles = selectedArticles(state.selectedArticles);
        dispatch({ type: 'SET_SELECTED_ARTICLES', payload: newSelectedArticles });
      } else {
        dispatch({ type: 'SET_SELECTED_ARTICLES', payload: selectedArticles });
      }
    },
    saveAppData,
    state.editingArticle,
    (editingArticle) => dispatch({ type: 'SET_EDITING_ARTICLE', payload: editingArticle })
  );

  // Artikel-Handler werden jetzt über den useArticleHandlers Hook verwaltet
  const handleSelectArticle = articleHandlers.handleSelectArticle;
  const handleSelectAll = () => {
    const filteredArticles = filteredAndSortedArticles();
    articleHandlers.handleSelectAll(filteredArticles);
  };
  const handleDeleteArticles = articleHandlers.handleDeleteArticles;
  const handleBulkPriceChange = articleHandlers.handleBulkPriceChange;
  const handleDeleteSingleArticle = (articleId: string, articleName: string) => {
    articleHandlers.handleDeleteSingleArticle(articleId);
  };

  const handleNewSupplierFromArticle = (supplierName: string) => {
    // Erstelle einen neuen Lieferanten mit dem angegebenen Namen
    const newSupplier = {
      id: generateId(),
      name: supplierName,
      contactPerson: '',
      email: '',
      phoneNumbers: [],
      address: {
        street: '',
        zipCode: '',
        city: '',
        country: ''
      },
      website: '',
      notes: ''
    };
    
    // Füge den neuen Lieferanten zur Liste hinzu
    dispatch({ type: 'SET_SUPPLIERS', payload: [...state.suppliers, newSupplier] });
    
    // Öffne das Lieferantenformular im Bearbeitungsmodus
    dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: newSupplier.id });
    dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: true });
  };
  
  // Ref für automatischen Fokus auf Artikelname-Feld
  const articleNameInputRef = useRef<HTMLInputElement>(null);

  // Automatischer Fokus auf Artikelname-Feld wenn Modal geöffnet wird
  useEffect(() => {
    if (state.showArticleForm && articleNameInputRef.current) {
      // Kurze Verzögerung um sicherzustellen, dass das Modal vollständig gerendert ist
      setTimeout(() => {
        articleNameInputRef.current?.focus();
        // Optional: Text markieren für einfache Überschreibung
        articleNameInputRef.current?.select();
      }, 100);
    }
  }, [state.showArticleForm]);

  // Lade gespeicherte Daten beim Start (nur einmal, auch bei React Strict Mode)
  const hasLoadedInitialData = useRef(false);
  
  useEffect(() => {
    if (hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;
    
    const loadInitialData = async () => {
      try {
        // Verwende den Storage-Layer für konsistente Speichermodus-Informationen
        const currentStorageMode = storageMode;
        const currentCloudType = cloudType;
        
        console.log(`🔍 AppContent - Aktueller Speichermodus: ${currentStorageMode}, Cloud: ${currentCloudType || 'none'}`);
        
        // Nur lokalen Modus unterstützen (Cloud-Modus noch nicht implementiert)
        if (currentStorageMode === 'local') {
          console.log('📁 Verwende loadAppData für lokalen Modus...');
          const savedData = await loadAppData();
          if (savedData && typeof savedData === 'object' && 'articles' in savedData) {
            const appData = savedData as any;
            if (Array.isArray(appData.articles) && appData.articles.length > 0) {
              dispatch({ type: 'SET_ARTICLES', payload: appData.articles });
            }
            if (Array.isArray(appData.suppliers) && appData.suppliers.length > 0) {
              dispatch({ type: 'SET_SUPPLIERS', payload: appData.suppliers });
            }
            if (Array.isArray(appData.recipes) && appData.recipes.length > 0) {
              dispatch({ type: 'SET_RECIPES', payload: appData.recipes });
            }
          }
        } else {
          console.warn('⚠️ Cloud-Modus noch nicht implementiert, verwende lokalen Modus');
          // Fallback auf lokalen Modus
          const savedData = await loadAppData();
          if (savedData && typeof savedData === 'object' && 'articles' in savedData) {
            const appData = savedData as any;
            if (Array.isArray(appData.articles) && appData.articles.length > 0) {
              dispatch({ type: 'SET_ARTICLES', payload: appData.articles });
            }
            if (Array.isArray(appData.suppliers) && appData.suppliers.length > 0) {
              dispatch({ type: 'SET_SUPPLIERS', payload: appData.suppliers });
            }
            if (Array.isArray(appData.recipes) && appData.recipes.length > 0) {
              dispatch({ type: 'SET_RECIPES', payload: appData.recipes });
            }
          }
        }
        
                 // Design immer aus localStorage laden
         const design = localStorage.getItem('chef_design');
         if (design) {
           dispatch({ type: 'SET_CURRENT_DESIGN', payload: JSON.parse(design) });
         }
         
         // Markiere initiales Laden als abgeschlossen
         setInitialDataLoaded(true);
         console.log('✅ Initiales Datenladen abgeschlossen');
       } catch (error) {
         console.error('Fehler beim Laden der initialen Daten:', error);
         setInitialDataLoaded(true); // Auch bei Fehlern setzen
       }
     };
     
     loadInitialData();
   }, []); // Nur beim ersten Render ausführen

  // State to track if an import operation just completed
  const [importCompleted, setImportCompleted] = useState(false);
  // State to track if initial data loading is complete
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Accordion State
  const [accordionOpen, setAccordionOpen] = useState({
    kalkulation: false,
    einstellungen: false
  });

  const toggleAccordion = (section: 'kalkulation' | 'einstellungen') => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isAccordionActive = (section: string) => {
    switch (section) {
      case 'kalkulation':
        return ['kalkulation', 'rezepte', 'artikel', 'lieferanten'].includes(state.currentPage);
      case 'einstellungen':
        return ['storage-settings', 'storage-management', 'development'].includes(state.currentPage);
      default:
        return false;
    }
  };

  // Automatisch Accordion öffnen, wenn ein Unterpunkt aktiv ist
  // und alle anderen Accordion-Bereiche schließen
  useEffect(() => {
    // Schließe alle Accordion-Bereiche zuerst
    setAccordionOpen(prev => ({
      kalkulation: false,
      einstellungen: false
    }));

    // Öffne nur den aktiven Bereich
    if (isAccordionActive('kalkulation')) {
      setAccordionOpen(prev => ({ ...prev, kalkulation: true }));
    }
    if (isAccordionActive('einstellungen')) {
      setAccordionOpen(prev => ({ ...prev, einstellungen: true }));
    }
  }, [state.currentPage]);

  // Intelligente Speicherung - nur bei echten Benutzer-Änderungen
  useEffect(() => {
    // Überspringe automatische Speicherung während des Imports
    if (importCompleted) {
      return;
    }
    
    // Überspringe automatische Speicherung bis initiales Laden abgeschlossen ist
    if (!initialDataLoaded) {
      return;
    }
    
    // Speichere nur bei echten Benutzer-Änderungen, nicht bei jedem State-Update
    const hasRealChanges = () => {
      // Prüfe ob es sich um echte Änderungen handelt (nicht um initiales Laden)
      const isInitialLoad = !state.articles || state.articles.length === 0;
      if (isInitialLoad) {
        return false;
      }
      
      // Speichere nur wenn sich die Anzahl der Artikel geändert hat (echte Änderungen)
      // NICHT bei jedem State-Update
      return false; // Deaktiviere automatische Speicherung
    };
    
    if (hasRealChanges()) {
      const saveChanges = async () => {
        const dataToSave: any = {};
        let hasChanges = false;

        if (state.currentDesign) {
          dataToSave.design = state.currentDesign;
          hasChanges = true;
        }

        if (state.suppliers && state.suppliers.length >= 0) {
          dataToSave.suppliers = state.suppliers;
          hasChanges = true;
        }

        if (state.articles && state.articles.length >= 0) {
          dataToSave.articles = state.articles;
          hasChanges = true;
        }

        if (state.recipes && state.recipes.length >= 0) {
          dataToSave.recipes = state.recipes;
          hasChanges = true;
        }

        if (hasChanges) {
          console.log('💾 Speichere Änderungen...', Object.keys(dataToSave));
          await saveAppData(dataToSave);
        }
      };

      // Verzögerung um mehrfache Aufrufe zu verhindern
      const timeoutId = setTimeout(saveChanges, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [state.currentDesign, state.suppliers, state.articles, state.recipes, saveAppData, importCompleted]);

  // Auto-save effect that triggers when import is completed
  useEffect(() => {
    if (importCompleted) {
      console.log('💾 Import abgeschlossen - keine weiteren Speicheraktionen nötig');
      setImportCompleted(false);
    }
  }, [importCompleted]);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768;
      dispatch({ type: 'SET_IS_MOBILE', payload: isMobile });
      if (isMobile) {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false });
      } else {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true });
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [dispatch]);

  // Initialisiere den CategoryManager beim Laden der App
  useEffect(() => {
    if (state.articles) {
      categoryManager.updateCategories(state.articles);
    }
  }, [state.articles]);

  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: !state.sidebarOpen });
  };

  const getCurrentColors = () => {
    const design = state.currentDesign || 'warm'; // Fallback auf 'warm' wenn currentDesign noch nicht gesetzt ist
    const template = designTemplates[design as keyof typeof designTemplates];
    if (!template) {
      console.warn(`Design template '${design}' nicht gefunden, verwende 'warm'`);
      return designTemplates.warm.colors;
    }
    return template.colors;
  };

  // Artikelverwaltung Hilfsfunktionen
  const getUniqueCategories = () => {
    // Aktualisiere den CategoryManager mit den aktuellen Artikeldaten
    categoryManager.updateCategories(state.articles || []);
    return categoryManager.getAllCategories();
  };

  // Nur Kategorien anzeigen, die tatsächlich in Artikeln verwendet werden
  const getUsedCategories = () => {
    // Aktualisiere den CategoryManager mit den aktuellen Artikeldaten
    categoryManager.updateCategories(state.articles || []);
    return categoryManager.getUsedCategories();
  };

  const getSupplierName = (supplierId: string) => {
    if (!supplierId) return 'Unbekannt';
    const suppliers = state.suppliers || [];
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unbekannt';
  };

  const getUniqueSuppliers = () => {
    const suppliers = state.suppliers || [];
    const supplierNames = suppliers.map(supplier => supplier.name);
    return supplierNames.sort();
  };

  const filteredAndSortedArticles = () => {
    // Defensive Programmierung: Stelle sicher, dass articles ein Array ist
    const articles = state.articles || [];
    
    let filtered = articles.filter(article => 
      article.name.toLowerCase().includes(state.searchTerm.toLowerCase()) &&
      (state.selectedCategory === '' || article.category === state.selectedCategory) &&
      (state.selectedSupplier === '' || getSupplierName(article.supplierId) === state.selectedSupplier)
    );

    // Sortierung
    filtered.sort((a, b) => {
      let aValue = a[state.sortField as keyof typeof a];
      let bValue = b[state.sortField as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return state.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredAndSortedSuppliers = () => {
    // Defensive Programmierung: Stelle sicher, dass suppliers ein Array ist
    const suppliers = state.suppliers || [];
    
    let filtered = suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(state.supplierSearchTerm.toLowerCase()) ||
                           supplier.contactPerson.toLowerCase().includes(state.supplierSearchTerm.toLowerCase()) ||
                           supplier.email.toLowerCase().includes(state.supplierSearchTerm.toLowerCase()) ||
                           supplier.address.city.toLowerCase().includes(state.supplierSearchTerm.toLowerCase());
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      let aValue = a[state.supplierSortField as keyof typeof a];
      let bValue = b[state.supplierSortField as keyof typeof b];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (aValue < bValue) return state.supplierSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return state.supplierSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredAndSortedRecipes = () => {
    // Defensive Programmierung: Stelle sicher, dass recipes ein Array ist
    const recipes = state.recipes || [];
    
    // Migriere bestehende Rezepte - entferne Timestamps (werden von PostgreSQL gesetzt)
    const migratedRecipes = recipes.map(recipe => {
      // Entferne Timestamps aus alten Daten (PostgreSQL setzt sie automatisch)
      const { createdAt, updatedAt, lastModifiedBy, ...recipeWithoutTimestamps } = recipe;
      return recipeWithoutTimestamps;
    });

    let filtered = migratedRecipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(state.recipeSearchTerm.toLowerCase()) ||
                           recipe.description.toLowerCase().includes(state.recipeSearchTerm.toLowerCase());
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;
      switch (state.recipeSortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'portions':
          aValue = a.portions;
          bValue = b.portions;
          break;
        case 'costPerPortion':
          aValue = a.materialCosts / a.portions;
          bValue = b.materialCosts / b.portions;
          break;
        case 'sellingPrice':
          aValue = a.sellingPrice;
          bValue = b.sellingPrice;
          break;
        case 'energy':
          aValue = a.energy;
          bValue = b.energy;
          break;
        case 'timestamp':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (state.recipeSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Hilfsfunktionen werden jetzt aus utils/helpers.ts und utils/recipeHelpers.ts importiert

  // Click-Outside-Handler für Dropdowns - entfernt, da jetzt in Artikelformular Hook

  const renderPage = () => {
    const colors = getCurrentColors();
    
    switch (state.currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            articles={state.articles}
            suppliers={state.suppliers}
            recipes={state.recipes}
            getCurrentColors={getCurrentColors}
            setShowArticleForm={(show) => dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: show })}
            setShowSupplierForm={(show) => dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: show })}
            setCurrentPage={(page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page })}
            handleEditArticle={(article) => {
              dispatch({ type: 'SET_EDITING_ARTICLE', payload: article });
              dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: true });
            }}
            handleEditRecipe={(recipe) => {
              dispatch({ type: 'SET_EDITING_RECIPE', payload: recipe });
              dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: true });
            }}
            handleEditSupplier={(supplier) => dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: supplier.id })}
            getSupplierName={getSupplierName}
            lastSaved={lastSync}
            storageInfo={{
              ...storageInfo,
              used: storageInfo?.used || 0,
              available: storageInfo?.available || 100,
              percentage: storageInfo?.percentage || 0
            }}
            isStorageAvailable={true}
          />
        );
                           

                           case 'storage-management':
          return (
            <div className="container-fluid">
              <div className="row">
                <div className="col-12">
                  <StorageManagement />
                </div>
              </div>
            </div>
          );

      case 'development':
        return <DevelopmentPage />;

      case 'kalkulation':
        return (
          <Kalkulation
            getCurrentColors={getCurrentColors}
            setCurrentPage={(page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page })}
          />
        );
      case 'artikel':
        const filteredArticles = filteredAndSortedArticles();
        const categories = getUsedCategories();
        const uniqueSuppliers = getUniqueSuppliers();
        
        return (
          <Artikelverwaltung
            articles={state.articles}
            colors={colors}
            searchTerm={state.searchTerm}
            setSearchTerm={(term) => dispatch({ type: 'SET_SEARCH_TERM', payload: term })}
            viewMode={state.viewMode}
            setViewMode={(mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode })}
            selectedCategory={state.selectedCategory}
            setSelectedCategory={(category) => dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category })}
            selectedSupplier={state.selectedSupplier}
            setSelectedSupplier={(supplier) => dispatch({ type: 'SET_SELECTED_SUPPLIER', payload: supplier })}
            sortField={state.sortField}
            setSortField={(field) => dispatch({ type: 'SET_SORT_FIELD', payload: field })}
            sortDirection={state.sortDirection}
            setSortDirection={(direction) => dispatch({ type: 'SET_SORT_DIRECTION', payload: direction })}
            selectedArticles={state.selectedArticles}
            setShowArticleForm={(show) => dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: show })}
            resetArticleForm={() => {}} // Leere Funktion, da Artikelformular jetzt eigenen State hat
            setShowImportExportModal={(show) => importExport.setShowImportExportModal(show)}
            filteredAndSortedArticles={filteredAndSortedArticles}
            getUsedCategories={getUsedCategories}
            getUniqueSuppliers={getUniqueSuppliers}
            handleSelectArticle={handleSelectArticle}
            handleSelectAll={handleSelectAll}
            handleDeleteArticles={handleDeleteArticles}
            handleBulkPriceChange={handleBulkPriceChange}
            handleEditArticle={(article) => {
              dispatch({ type: 'SET_EDITING_ARTICLE', payload: article });
              dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: true });
            }}
            handleDeleteSingleArticle={handleDeleteSingleArticle}
            getSupplierName={getSupplierName}
            formatPrice={formatPrice}
          />
        );
      case 'lieferanten':
        const filteredSuppliers = filteredAndSortedSuppliers();
        
        return (
          <Lieferantenverwaltung
            suppliers={state.suppliers}
            colors={colors}
            searchTerm={state.supplierSearchTerm}
            setSearchTerm={(term) => dispatch({ type: 'SET_SUPPLIER_SEARCH_TERM', payload: term })}
            supplierViewMode={state.supplierViewMode}
            setSupplierViewMode={(mode) => dispatch({ type: 'SET_SUPPLIER_VIEW_MODE', payload: mode })}
            supplierSortField={state.supplierSortField}
            setSupplierSortField={(field) => dispatch({ type: 'SET_SUPPLIER_SORT_FIELD', payload: field })}
            supplierSortDirection={state.supplierSortDirection}
            setSupplierSortDirection={(direction) => dispatch({ type: 'SET_SUPPLIER_SORT_DIRECTION', payload: direction })}
            selectedSuppliers={state.selectedSuppliers}
            filteredAndSortedSuppliers={filteredAndSortedSuppliers}
            handleSelectSupplier={(supplierId) => {
              dispatch({
                type: 'SET_SELECTED_SUPPLIERS',
                payload: state.selectedSuppliers.includes(supplierId)
                  ? state.selectedSuppliers.filter(id => id !== supplierId)
                  : [...state.selectedSuppliers, supplierId]
              });
            }}
            handleSelectAllSuppliers={() => {
              const filteredSuppliers = filteredAndSortedSuppliers();
              if (state.selectedSuppliers.length === filteredSuppliers.length) {
                dispatch({ type: 'SET_SELECTED_SUPPLIERS', payload: [] });
              } else {
                dispatch({ type: 'SET_SELECTED_SUPPLIERS', payload: filteredSuppliers.map(s => s.id) });
              }
            }}
                                     handleDeleteSuppliers={async (onProgress?: (current: number, total: number) => void) => {
              if (state.selectedSuppliers.length > 0) {
                try {
                  // Lösche alle ausgewählten Lieferanten über StorageLayer
                  for (let i = 0; i < state.selectedSuppliers.length; i++) {
                    const supplierId = state.selectedSuppliers[i];
                    
                    // Rufe Progress-Callback auf
                    if (onProgress) {
                      onProgress(i, state.selectedSuppliers.length);
                    }
                    
                    const success = await storageLayer.delete('suppliers', supplierId);
                    if (!success) {
                      console.warn(`⚠️ Lieferant ${supplierId} konnte nicht gelöscht werden`);
                    }
                  }
                  
                  // Finaler Progress-Callback
                  if (onProgress) {
                    onProgress(state.selectedSuppliers.length, state.selectedSuppliers.length);
                  }
                  
                  // Aktualisiere lokalen State
                  dispatch({ type: 'DELETE_SUPPLIERS', payload: state.selectedSuppliers });
                } catch (error) {
                  console.error('❌ Fehler beim Löschen der Lieferanten:', error);
                  // Fallback: Nur lokalen State aktualisieren
                  dispatch({ type: 'DELETE_SUPPLIERS', payload: state.selectedSuppliers });
                }
              }
            }}
            handleEditSupplier={(supplier) => {
              dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: supplier.id });
              dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: true });
            }}
                                     handleDeleteSingleSupplier={async (supplierId) => {
              try {
                console.log(`🗑️ Lösche Lieferant ${supplierId} über StorageLayer...`);
                
                // Lösche über StorageLayer
                const success = await storageLayer.delete('suppliers', supplierId);
                
                if (!success) {
                  throw new Error('Fehler beim Löschen des Lieferanten über StorageLayer');
                }
                
                // Aktualisiere lokalen State
                dispatch({ type: 'DELETE_SUPPLIERS', payload: [supplierId] });
                
                console.log('✅ Lieferant erfolgreich gelöscht');
              } catch (error) {
                console.error('❌ Fehler beim Löschen des Lieferanten:', error);
                // Fallback: Nur lokalen State aktualisieren
                dispatch({ type: 'DELETE_SUPPLIERS', payload: [supplierId] });
              }
            }}
            setShowSupplierForm={(show) => dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: show })}
          />
        );
      case 'rezepte':
        return (
          <Rezeptverwaltung
            recipes={state.recipes}
            recipeSearchTerm={state.recipeSearchTerm}
            setRecipeSearchTerm={(term) => dispatch({ type: 'SET_RECIPE_SEARCH_TERM', payload: term })}
            recipeViewMode={state.recipeViewMode}
            setRecipeViewMode={(mode) => dispatch({ type: 'SET_RECIPE_VIEW_MODE', payload: mode })}
            recipeSortBy={state.recipeSortBy}
            setRecipeSortBy={(sortBy) => dispatch({ type: 'SET_RECIPE_SORT_BY', payload: sortBy })}
            recipeSortOrder={state.recipeSortOrder}
            setRecipeSortOrder={(order) => dispatch({ type: 'SET_RECIPE_SORT_ORDER', payload: order })}
            selectedRecipes={state.selectedRecipes}
            getCurrentColors={getCurrentColors}
            setShowImportExportModal={(show) => importExport.setShowImportExportModal(show)}
            handleSelectRecipe={(recipeId) => {
              dispatch({
                type: 'SET_SELECTED_RECIPES',
                payload: state.selectedRecipes.includes(recipeId)
                  ? state.selectedRecipes.filter(id => id !== recipeId)
                  : [...state.selectedRecipes, recipeId]
              });
            }}
            handleSelectAllRecipes={() => {
              const filteredRecipes = filteredAndSortedRecipes();
              if (state.selectedRecipes.length === filteredRecipes.length) {
                dispatch({ type: 'SET_SELECTED_RECIPES', payload: [] });
              } else {
                dispatch({ type: 'SET_SELECTED_RECIPES', payload: filteredRecipes.map(r => r.id) });
              }
            }}
                                     handleDeleteRecipes={async (onProgress?: (current: number, total: number) => void) => {
              if (state.selectedRecipes.length > 0) {
                try {
                  // Lösche Rezepte über StorageLayer
                  for (let i = 0; i < state.selectedRecipes.length; i++) {
                    const recipeId = state.selectedRecipes[i];
                    
                    // Rufe Progress-Callback auf
                    if (onProgress) {
                      onProgress(i, state.selectedRecipes.length);
                    }
                    
                    const success = await storageLayer.delete('recipes', recipeId);
                    if (!success) {
                      console.warn(`⚠️ Rezept ${recipeId} konnte nicht gelöscht werden`);
                    }
                  }
                  
                  // Finaler Progress-Callback
                  if (onProgress) {
                    onProgress(state.selectedRecipes.length, state.selectedRecipes.length);
                  }
                  
                  // Aktualisiere lokalen State
                  dispatch({ type: 'DELETE_RECIPES', payload: state.selectedRecipes });
                } catch (error) {
                  console.error('❌ Fehler beim Löschen der Rezepte:', error);
                  // Fallback: Nur lokalen State aktualisieren
                  dispatch({ type: 'DELETE_RECIPES', payload: state.selectedRecipes });
                }
              }
            }}
                                     handleDeleteSingleRecipe={async (recipeId) => {
              try {
                console.log(`🗑️ Lösche Rezept ${recipeId}...`);
                
                // Lösche Rezept über StorageLayer
                const success = await storageLayer.delete('recipes', recipeId);
                if (!success) {
                  console.warn(`⚠️ Rezept ${recipeId} konnte nicht gelöscht werden`);
                } else {
                  console.log(`✅ Rezept ${recipeId} erfolgreich gelöscht`);
                }
                
                // Aktualisiere lokalen State
                dispatch({ type: 'DELETE_RECIPES', payload: [recipeId] });
                
                console.log('✅ Rezept erfolgreich gelöscht');
              } catch (error) {
                console.error('❌ Fehler beim Löschen des Rezepts:', error);
                // Fallback: Nur lokalen State aktualisieren
                dispatch({ type: 'DELETE_RECIPES', payload: [recipeId] });
              }
            }}
            formatPrice={formatPrice}
            filteredAndSortedRecipes={filteredAndSortedRecipes}
            articles={state.articles}
            setRecipes={(recipes) => {
              if (typeof recipes === 'function') {
                const newRecipes = recipes(state.recipes);
                dispatch({ type: 'SET_RECIPES', payload: newRecipes });
              } else {
                dispatch({ type: 'SET_RECIPES', payload: recipes });
              }
            }}
            setShowArticleForm={(show) => dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: show })}
            setEditingArticle={(article) => dispatch({ type: 'SET_EDITING_ARTICLE', payload: article })}
          />
        );
      case 'einkauf':
        return <Einkauf getCurrentColors={getCurrentColors} />;
      case 'inventur':
        return <Inventur getCurrentColors={getCurrentColors} />;
      default:
        return null;
    }
  };

  // Zeige Loading-Spinner während des Ladens
  if (isLoading) {
    const colors = getCurrentColors();
    return (
      <ErrorBoundary>
        <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
          <LoadingSpinner fullScreen text="Lade App-Daten..." />
        </div>
      </ErrorBoundary>
    );
  }

  const colors = getCurrentColors();

  return (
    <ErrorBoundary>
      <ColorProvider getCurrentColors={getCurrentColors}>
        <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
          <style>
            {`
              .sidebar-icon {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                font-size: 18px !important;
                font-weight: bold !important;
              }
              .sidebar-button {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                min-height: 48px !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .sidebar-button span {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              .nav-link {
                margin: 0 !important;
                padding: 0 !important;
              }
              .btn-link {
                margin: 0 !important;
                padding: 0 !important;
              }
              .sidebar-sub-button {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                background: none !important;
                color: inherit !important;
                text-decoration: none !important;
              }
            `}
          </style>
          
          {/* Header */}
          <nav className="navbar navbar-dark fixed-top" style={{ 
            backgroundColor: colors.primary,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1030
          }}>
            <button 
              onClick={toggleSidebar}
              style={{ 
                color: 'white',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px'
              }}
            >
              <FaBars />
            </button>
            <span className="navbar-brand mx-auto d-flex align-items-center">
              <FaUtensils className="me-2" style={{ fontSize: '20px' }} />
              The Chef's Numbers
            </span>
            <button 
              onClick={() => dispatch({ type: 'SET_SHOW_DESIGN_SELECTOR', payload: !state.showDesignSelector })}
              title="Design ändern"
              style={{ 
                color: 'white',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px'
              }}
            >
              <FaPalette />
            </button>
          </nav>

          {/* Design Selector */}
          {state.showDesignSelector && (
            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 3000,
              top: 56
            }}>
              <div className="container mt-4">
                <div className="row justify-content-center">
                  <div className="col-md-8">
                    <div className="card" style={{ backgroundColor: colors.card }}>
                      <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                        <h5 className="mb-0" style={{ color: colors.text }}>Design auswählen</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {Object.entries(designTemplates).map(([key, template]) => (
                            <div key={key} className="col-md-6 mb-3">
                              <div 
                                className="card cursor-pointer" 
                                style={{ 
                                  backgroundColor: template.colors.card,
                                  border: state.currentDesign === key ? `3px solid ${template.colors.accent}` : `1px solid ${template.colors.cardBorder}`,
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  dispatch({ type: 'SET_CURRENT_DESIGN', payload: key });
                                  dispatch({ type: 'SET_SHOW_DESIGN_SELECTOR', payload: false });
                                }}
                              >
                                <div className="card-body">
                                  <h6 className="card-title" style={{ color: template.colors.text }}>
                                    {template.name}
                                  </h6>
                                  <p className="card-text small" style={{ color: template.colors.text }}>
                                    {template.description}
                                  </p>
                                  <div className="d-flex gap-2">
                                    <div style={{ 
                                      width: 20, 
                                      height: 20, 
                                      backgroundColor: template.colors.primary, 
                                      borderRadius: '50%' 
                                    }}></div>
                                    <div style={{ 
                                      width: 20, 
                                      height: 20, 
                                      backgroundColor: template.colors.accent, 
                                      borderRadius: '50%' 
                                    }}></div>
                                    <div style={{ 
                                      width: 20, 
                                      height: 20, 
                                      backgroundColor: template.colors.secondary, 
                                      borderRadius: '50%' 
                                    }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-3">
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => dispatch({ type: 'SET_SHOW_DESIGN_SELECTOR', payload: false })}
                          >
                            Schließen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Artikelformular Modal */}
          {(state.showArticleForm || state.editingArticle) && (
            <Artikelformular
              show={state.showArticleForm || !!state.editingArticle}
              onClose={() => {
                dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: false });
                dispatch({ type: 'SET_EDITING_ARTICLE', payload: null });
              }}
              colors={getCurrentColors()}
              suppliers={state.suppliers}
              articles={state.articles}
              onReset={() => dispatch({ type: 'SET_EDITING_ARTICLE', payload: null })}
              onNewSupplier={handleNewSupplierFromArticle}
            />
          )}

                     {/* Lieferantenformular Modal */}
           <Lieferantenformular
             suppliers={state.suppliers}
             showSupplierForm={state.showSupplierForm}
             setShowSupplierForm={(show) => dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: show })}
             getCurrentColors={getCurrentColors}
             isValidUrl={isValidUrl}
             openWebsite={openWebsite}
             onReset={() => dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: null })}
           />

                     {/* Rezept-Formular Modal */}
           <Rezeptformular
             articles={state.articles}
             recipes={state.recipes}
             setRecipes={(recipes) => {
               if (typeof recipes === 'function') {
                 const newRecipes = recipes(state.recipes);
                 dispatch({ type: 'SET_RECIPES', payload: newRecipes });
               } else {
                 dispatch({ type: 'SET_RECIPES', payload: recipes });
               }
             }}
             setShowArticleForm={(show) => dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: show })}
             setEditingArticle={(article) => dispatch({ type: 'SET_EDITING_ARTICLE', payload: article })}
             formatPrice={formatPrice}
             getCurrentColors={getCurrentColors}
             show={state.showRecipeForm || !!state.editingRecipe}
             onClose={() => {
               dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: false });
               dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
             }}
             onSave={(recipe) => {
               if (state.editingRecipe) {
                 // Rezept bearbeiten
                 dispatch({ type: 'UPDATE_RECIPE', payload: { id: state.editingRecipe.id, recipe } });
               } else {
                 // Neues Rezept erstellen
                 dispatch({ type: 'ADD_RECIPE', payload: recipe });
               }
             }}
             onReset={() => {
               dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
             }}
           />

          {/* Enhanced Sidebar */}
          <div
            className="position-fixed top-0 start-0 h-100 shadow transition-all"
            style={{ 
              width: state.sidebarOpen ? 224 : 60, 
              zIndex: 1020, 
              top: 56,
              transition: 'width 0.3s ease',
              backgroundColor: colors.sidebar,
              borderRight: `1px solid ${colors.cardBorder}`,
              display: state.isMobile ? (state.sidebarOpen ? 'flex' : 'none') : 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 56px)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: colors.cardBorder }}>
              {state.sidebarOpen && <span className="fw-bold" style={{ color: colors.text, fontSize: '1.1rem' }}>Navigation</span>}
              <button 
                onClick={toggleSidebar} 
                style={{ 
                  color: colors.text,
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                  minHeight: '40px'
                }}
              >
                {state.sidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
            
            {/* Haupt-Navigation */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ul className="nav flex-column p-2">
              <li className="nav-item mb-2">
                <button 
                  className="sidebar-button" 
                  onClick={() => { 
                    dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dashboard' }); 
                    if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                  }}
                  title="Dashboard"
                  style={{ 
                    color: colors.text,
                    borderRadius: '8px',
                    backgroundColor: state.currentPage === 'dashboard' ? colors.accent + '20' : 'transparent',
                    justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                    minHeight: '50px',
                    border: 'none',
                    outline: 'none',
                    padding: state.sidebarOpen ? '12px' : '2px',
                    width: '100%'
                  }}
                >
                  <FaTachometerAlt className="sidebar-icon" style={{ 
                    marginRight: state.sidebarOpen ? '12px' : '0',
                    display: 'block',
                    flexShrink: 0,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: colors.text,
                    minWidth: '18px',
                    textAlign: 'center',
                    width: state.sidebarOpen ? 'auto' : '100%'
                  }} />
                  {state.sidebarOpen && <span>Dashboard</span>}
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="sidebar-button" 
                  onClick={() => { 
                    dispatch({ type: 'SET_CURRENT_PAGE', payload: 'kalkulation' }); 
                    if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                  }}
                  title="Kalkulation"
                  style={{ 
                    color: colors.text,
                    borderRadius: '8px',
                    backgroundColor: (state.currentPage === 'kalkulation' || state.currentPage === 'rezepte' || state.currentPage === 'artikel' || state.currentPage === 'lieferanten') ? colors.accent + '20' : 'transparent',
                    justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                    minHeight: '50px',
                    border: 'none',
                    outline: 'none',
                    padding: state.sidebarOpen ? '12px' : '2px',
                    width: '100%'
                  }}
                >
                  <FaCalculator className="sidebar-icon" style={{ 
                    marginRight: state.sidebarOpen ? '12px' : '0',
                    display: 'block',
                    flexShrink: 0,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: colors.text,
                    minWidth: '18px',
                    textAlign: 'center',
                    width: state.sidebarOpen ? 'auto' : '100%'
                  }} />
                  {state.sidebarOpen && <span>Kalkulation</span>}
                  {state.sidebarOpen && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAccordion('kalkulation');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.text,
                        marginLeft: 'auto',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        minHeight: '24px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.accent + '20';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleAccordion('kalkulation');
                        }
                      }}
                    >
                      {accordionOpen.kalkulation ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  )}
                </button>
                {/* Accordion Unterpunkte */}
                {accordionOpen.kalkulation && state.sidebarOpen && (
                  <div 
                    className="accordion-content"
                    style={{
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      maxHeight: '200px',
                      opacity: 1
                    }}
                  >
                    <ul className="nav flex-column mt-2" style={{ 
                      paddingLeft: '2rem'
                    }}>
                      <li className="nav-item mb-1">
                        <button 
                          className="sidebar-sub-button"
                          onClick={() => { 
                            dispatch({ type: 'SET_CURRENT_PAGE', payload: 'artikel' }); 
                            if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                          }}
                          style={{ 
                            color: colors.text,
                            borderRadius: '6px',
                            backgroundColor: state.currentPage === 'artikel' ? colors.accent + '15' : 'transparent',
                            padding: '8px 12px',
                            fontSize: '0.9rem',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (state.currentPage !== 'artikel') {
                              e.currentTarget.style.backgroundColor = colors.accent + '10';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (state.currentPage !== 'artikel') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <FaBoxes className="me-2" style={{ fontSize: '14px' }} />
                          Artikel
                        </button>
                      </li>
                      <li className="nav-item mb-1">
                        <button 
                          className="sidebar-sub-button"
                          onClick={() => { 
                            dispatch({ type: 'SET_CURRENT_PAGE', payload: 'lieferanten' }); 
                            if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                          }}
                          style={{ 
                            color: colors.text,
                            borderRadius: '6px',
                            backgroundColor: state.currentPage === 'lieferanten' ? colors.accent + '15' : 'transparent',
                            padding: '8px 12px',
                            fontSize: '0.9rem',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (state.currentPage !== 'lieferanten') {
                              e.currentTarget.style.backgroundColor = colors.accent + '10';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (state.currentPage !== 'lieferanten') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <FaUsers className="me-2" style={{ fontSize: '14px' }} />
                          Lieferanten
                        </button>
                      </li>
                      <li className="nav-item mb-1">
                        <button 
                          className="sidebar-sub-button"
                          onClick={() => { 
                            dispatch({ type: 'SET_CURRENT_PAGE', payload: 'rezepte' }); 
                            if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                          }}
                          style={{ 
                            color: colors.text,
                            borderRadius: '6px',
                            backgroundColor: state.currentPage === 'rezepte' ? colors.accent + '15' : 'transparent',
                            padding: '8px 12px',
                            fontSize: '0.9rem',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (state.currentPage !== 'rezepte') {
                              e.currentTarget.style.backgroundColor = colors.accent + '10';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (state.currentPage !== 'rezepte') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <FaUtensils className="me-2" style={{ fontSize: '14px' }} />
                          Rezepte
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="sidebar-button" 
                  onClick={() => { 
                    dispatch({ type: 'SET_CURRENT_PAGE', payload: 'einkauf' }); 
                    if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                  }}
                  title="Einkauf"
                  style={{ 
                    color: colors.text,
                    borderRadius: '8px',
                    backgroundColor: state.currentPage === 'einkauf' ? colors.accent + '20' : 'transparent',
                    justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                    minHeight: '50px',
                    border: 'none',
                    outline: 'none',
                    padding: state.sidebarOpen ? '12px' : '2px',
                    width: '100%'
                  }}
                >
                  <FaShoppingCart className="sidebar-icon" style={{ 
                    marginRight: state.sidebarOpen ? '12px' : '0',
                    display: 'block',
                    flexShrink: 0,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: colors.text,
                    minWidth: '18px',
                    textAlign: 'center',
                    width: state.sidebarOpen ? 'auto' : '100%'
                  }} />
                  {state.sidebarOpen && <span>Einkauf</span>}
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="sidebar-button" 
                  onClick={() => { 
                    dispatch({ type: 'SET_CURRENT_PAGE', payload: 'inventur' }); 
                    if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                  }}
                  title="Inventur"
                  style={{ 
                    color: colors.text,
                    borderRadius: '8px',
                    backgroundColor: state.currentPage === 'inventur' ? colors.accent + '20' : 'transparent',
                    justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                    minHeight: '50px',
                    border: 'none',
                    outline: 'none',
                    padding: state.sidebarOpen ? '12px' : '2px',
                    width: '100%'
                  }}
                >
                  <FaBoxes className="sidebar-icon" style={{ 
                    marginRight: state.sidebarOpen ? '12px' : '0',
                    display: 'block',
                    flexShrink: 0,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: colors.text,
                    minWidth: '18px',
                    textAlign: 'center',
                    width: state.sidebarOpen ? 'auto' : '100%'
                  }} />
                  {state.sidebarOpen && <span>Inventur</span>}
                </button>
              </li>
              </ul>
            </div>
            
            {/* Einstellungen am unteren Rand */}
            <div style={{ marginTop: 'auto', padding: '8px' }}>
              <ul className="nav flex-column">
                {/* Haupt-Einstellungen */}
                <li className="nav-item mb-2">
                  <button 
                    className="sidebar-button" 
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'storage-settings' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Einstellungen"
                    style={{ 
                      color: colors.text,
                      borderRadius: '8px',
                      backgroundColor: (state.currentPage === 'storage-settings' || state.currentPage === 'storage-management') ? colors.accent + '20' : 'transparent',
                      justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                      minHeight: '50px',
                      border: 'none',
                      outline: 'none',
                      padding: state.sidebarOpen ? '12px' : '2px',
                      width: '100%'
                    }}
                  >
                    <FaCog className="sidebar-icon" style={{ 
                      marginRight: state.sidebarOpen ? '12px' : '0',
                      display: 'block',
                      flexShrink: 0,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: colors.text,
                      minWidth: '18px',
                      textAlign: 'center',
                      width: state.sidebarOpen ? 'auto' : '100%'
                    }} />
                    {state.sidebarOpen && <span>Einstellungen</span>}
                    {state.sidebarOpen && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAccordion('einstellungen');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: colors.text,
                          marginLeft: 'auto',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '24px',
                          minHeight: '24px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.accent + '20';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleAccordion('einstellungen');
                          }
                        }}
                      >
                        {accordionOpen.einstellungen ? <FaChevronDown /> : <FaChevronRight />}
                      </div>
                    )}
                  </button>
                  {/* Accordion Unterpunkte */}
                  {accordionOpen.einstellungen && state.sidebarOpen && (
                    <div 
                      className="accordion-content"
                      style={{
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        maxHeight: '200px',
                        opacity: 1
                      }}
                    >
                      <ul className="nav flex-column mt-2" style={{ 
                        paddingLeft: '2rem'
                      }}>
                        <li className="nav-item mb-1">
                          <button 
                            className="sidebar-sub-button"
                            onClick={() => { 
                              dispatch({ type: 'SET_CURRENT_PAGE', payload: 'storage-management' }); 
                              if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                            }}
                            style={{ 
                              color: colors.text,
                              borderRadius: '6px',
                              backgroundColor: state.currentPage === 'storage-management' ? colors.accent + '15' : 'transparent',
                              padding: '8px 12px',
                              fontSize: '0.9rem',
                              border: 'none',
                              width: '100%',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (state.currentPage !== 'storage-management') {
                                e.currentTarget.style.backgroundColor = colors.accent + '10';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (state.currentPage !== 'storage-management') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <FaDatabase className="me-2" style={{ fontSize: '14px' }} />
                            Speicherverwaltung
                          </button>
                        </li>
                        <li className="nav-item mb-1">
                          <button 
                            className="sidebar-sub-button"
                            onClick={() => { 
                              dispatch({ type: 'SET_CURRENT_PAGE', payload: 'development' }); 
                              if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                            }}
                            style={{ 
                              color: colors.text,
                              borderRadius: '6px',
                              backgroundColor: state.currentPage === 'development' ? colors.accent + '15' : 'transparent',
                              padding: '8px 12px',
                              fontSize: '0.9rem',
                              border: 'none',
                              width: '100%',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (state.currentPage !== 'development') {
                                e.currentTarget.style.backgroundColor = colors.accent + '10';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (state.currentPage !== 'development') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <FaCode className="me-2" style={{ fontSize: '14px' }} />
                            Entwicklung
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ 
            marginLeft: state.sidebarOpen ? 224 : 60, 
            marginTop: 56,
            transition: 'margin-left 0.3s ease',
            minHeight: 'calc(100vh - 56px)'
          }}>
            {renderPage()}
          </div>

                     {/* Storage Status */}
           <StorageStatus 
             lastSaved={lastSync}
             storageInfo={{
              ...storageInfo,
              used: storageInfo?.used || 0,
              available: storageInfo?.available || 100,
              percentage: storageInfo?.percentage || 0
            }}
             isStorageAvailable={true}
           />
           
           {/* Backup & Restore Button - nur im "Nur Lokal"-Modus sichtbar */}
                                            {/* Import/Export Modal */}
            <ArtikelDataExchange
              show={importExport.showImportExportModal}
              onClose={() => importExport.setShowImportExportModal(false)}
              colors={colors}
              suppliers={state.suppliers}
              articles={state.articles}
              onImportComplete={async (newSuppliers, newArticles) => {
                console.log('💾 Import abgeschlossen - speichere Daten über Storage-Layer...');
                
                try {
                  // Neue Lieferanten über Storage-Layer speichern
                  if (newSuppliers.length > 0) {
                    console.log(`📋 Speichere ${newSuppliers.length} neue Lieferanten über Storage-Layer...`);
                    const success = await storageLayer.save('suppliers', newSuppliers);
                    if (success) {
                      dispatch({ type: 'SET_SUPPLIERS', payload: [...state.suppliers, ...newSuppliers] });
                      console.log('✅ Lieferanten erfolgreich gespeichert');
                    } else {
                      throw new Error('Fehler beim Speichern der Lieferanten');
                    }
                  }
                  
                  // Neue Artikel über Storage-Layer speichern
                  if (newArticles.length > 0) {
                    console.log(`📦 Speichere ${newArticles.length} neue Artikel über Storage-Layer...`);
                    const success = await storageLayer.save('articles', newArticles);
                    if (success) {
                      dispatch({ type: 'SET_ARTICLES', payload: [...state.articles, ...newArticles] });
                      console.log('✅ Artikel erfolgreich gespeichert');
                    } else {
                      throw new Error('Fehler beim Speichern der Artikel');
                    }
                  }
                  
                  console.log('✅ Import erfolgreich abgeschlossen - Daten gespeichert');
                } catch (error) {
                  console.error('❌ Fehler beim Speichern der importierten Daten:', error);
                  // Bei Fehler trotzdem den State aktualisieren (Daten sind im localStorage)
                  if (newSuppliers.length > 0) {
                    dispatch({ type: 'SET_SUPPLIERS', payload: [...state.suppliers, ...newSuppliers] });
                  }
                  if (newArticles.length > 0) {
                    dispatch({ type: 'SET_ARTICLES', payload: [...state.articles, ...newArticles] });
                  }
                }
              }}
            />
        </div>
      </ColorProvider>
    </ErrorBoundary>
  );
}

export default AppContent; 