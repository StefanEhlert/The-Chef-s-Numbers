import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaUtensils, FaBars, FaTimes, FaCalculator, FaShoppingCart, FaBoxes, FaPalette, FaPlus, FaSearch, FaCog, FaUsers, FaTachometerAlt, FaEdit, FaTrash, FaList, FaTh, FaFilter, FaSort, FaPencilAlt, FaGlobe, FaTimes as FaClose, FaSave, FaArrowLeft, FaPercent, FaEuroSign, FaCheck, FaImage, FaPrint } from 'react-icons/fa';
import { Recipe, UsedRecipe } from '../types';
import Dashboard from './Dashboard';
import Kalkulation from './Kalkulation';
import Einkauf from './Einkauf';
import Inventur from './Inventur';
import { ColorProvider } from '../contexts/ColorContext';
import ErrorBoundary from './ui/ErrorBoundary';
import { useStorage } from '../hooks/useStorage';
import LoadingSpinner from './ui/LoadingSpinner';
import StorageStatus from './ui/StorageStatus';
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

// Interface für das Rezeptformular
interface RecipeForm {
  name: string;
  description: string;
  image: File | null;
  portions: number;
  preparationTime: number;
  difficulty: number;
  energy: number;
  materialCosts: number;
  markupPercentage: number;
  vatRate: number;
  sellingPrice: number;
  ingredients: Array<{
    id: string;
    name: string;
    amount: number;
    unit: string;
    price: number;
  }>;
  usedRecipes: UsedRecipe[];
  preparationSteps: Array<{
    id: string;
    order: number;
    description: string;
  }>;
}

// Design Templates werden jetzt aus constants/designTemplates.ts importiert

function AppContent() {
  const { state, dispatch } = useAppContext();
  const { loadAppData, saveAppData, isLoading, lastSaved, storageInfo } = useStorage();
  
  // Lokaler State für das zu bearbeitende Rezept
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  
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
      id: Date.now().toString(),
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

  // Lade gespeicherte Daten beim Start
  useEffect(() => {
    const savedData = loadAppData();
    if (savedData.articles.length > 0) {
      dispatch({ type: 'SET_ARTICLES', payload: savedData.articles });
    }
    if (savedData.suppliers.length > 0) {
      dispatch({ type: 'SET_SUPPLIERS', payload: savedData.suppliers });
    }
    if (savedData.recipes.length > 0) {
      dispatch({ type: 'SET_RECIPES', payload: savedData.recipes });
    }
    if (savedData.design) {
      dispatch({ type: 'SET_CURRENT_DESIGN', payload: savedData.design });
    }
  }, [loadAppData, dispatch]);

  // Speichere Design-Änderungen automatisch
  useEffect(() => {
    if (state.currentDesign) {
      saveAppData({ design: state.currentDesign });
    }
  }, [state.currentDesign, saveAppData]);

  // Speichere Lieferanten-Änderungen automatisch
  useEffect(() => {
    if (state.suppliers && state.suppliers.length >= 0) {
      saveAppData({ suppliers: state.suppliers });
    }
  }, [state.suppliers, saveAppData]);

  // Speichere Artikel-Änderungen automatisch
  useEffect(() => {
    if (state.articles && state.articles.length >= 0) {
      saveAppData({ articles: state.articles });
    }
  }, [state.articles, saveAppData]);

  // Speichere Rezept-Änderungen automatisch
  useEffect(() => {
    if (state.recipes && state.recipes.length >= 0) {
      saveAppData({ recipes: state.recipes });
    }
  }, [state.recipes, saveAppData]);

  // State to track if an import operation just completed
  const [importCompleted, setImportCompleted] = useState(false);

  // Auto-save effect that triggers when import is completed
  useEffect(() => {
    if (importCompleted) {
      const currentData = {
        suppliers: state.suppliers || [],
        articles: state.articles || [],
        recipes: state.recipes || [],
        design: state.currentDesign || 'warm'
      };
      const success = saveAppData(currentData);
      if (success) {
        console.log('Daten erfolgreich in LocalStorage gespeichert nach Import:', currentData);
      } else {
        console.error('Fehler beim Speichern der Daten in LocalStorage nach Import');
      }
      setImportCompleted(false);
    }
  }, [importCompleted, state.suppliers, state.articles, state.recipes, state.currentDesign, saveAppData]);

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
    
    // Migriere bestehende Rezepte ohne createdAt
    const migratedRecipes = recipes.map(recipe => {
      if (!recipe.createdAt) {
        return {
          ...recipe,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: 'Benutzer'
        };
      }
      return recipe;
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
            setShowRecipeForm={(show) => dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: show })}
            setShowSupplierForm={(show) => dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: show })}
            setCurrentPage={(page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page })}
            handleEditArticle={(article) => {
              dispatch({ type: 'SET_EDITING_ARTICLE', payload: article });
              dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: true });
            }}
            handleEditRecipe={(recipe) => {
              // Setze das zu bearbeitende Rezept und öffne das Formular
              setEditingRecipe(recipe);
              dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: true });
            }}
            handleEditSupplier={(supplier) => dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: supplier.id })}
            getSupplierName={getSupplierName}
            lastSaved={lastSaved}
            storageInfo={storageInfo}
            isStorageAvailable={true}
          />
        );
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
            handleDeleteSuppliers={() => {
              if (state.selectedSuppliers.length > 0) {
                dispatch({ type: 'DELETE_SUPPLIERS', payload: state.selectedSuppliers });
              }
            }}
            handleEditSupplier={(supplier) => {
              dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: supplier.id });
              dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: true });
            }}
            handleDeleteSingleSupplier={(supplierId) => {
              dispatch({ type: 'DELETE_SUPPLIERS', payload: [supplierId] });
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
            handleDeleteRecipes={() => {
              if (state.selectedRecipes.length > 0) {
                dispatch({ type: 'DELETE_RECIPES', payload: state.selectedRecipes });
              }
            }}
            handleDeleteSingleRecipe={(recipeId) => {
              dispatch({ type: 'DELETE_RECIPES', payload: [recipeId] });
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
            showRecipeForm={state.showRecipeForm}
            setShowRecipeForm={(show) => {
              dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: show });
              if (!show) {
                setEditingRecipe(null);
              }
            }}
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
              onSave={articleHandlers.handleSaveArticle}
              onReset={() => dispatch({ type: 'SET_EDITING_ARTICLE', payload: null })}
              onNewSupplier={handleNewSupplierFromArticle}
            />
          )}

          {/* Lieferantenformular Modal */}
          <Lieferantenformular
            suppliers={state.suppliers}
            setSuppliers={(suppliers) => {
              if (typeof suppliers === 'function') {
                const newSuppliers = suppliers(state.suppliers);
                dispatch({ type: 'SET_SUPPLIERS', payload: newSuppliers });
              } else {
                dispatch({ type: 'SET_SUPPLIERS', payload: suppliers });
              }
            }}
            showSupplierForm={state.showSupplierForm}
            setShowSupplierForm={(show) => dispatch({ type: 'SET_SHOW_SUPPLIER_FORM', payload: show })}
            getCurrentColors={getCurrentColors}
            isValidUrl={isValidUrl}
            openWebsite={openWebsite}
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
            showRecipeForm={state.showRecipeForm}
            setShowRecipeForm={(show) => {
              dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: show });
              if (!show) {
                setEditingRecipe(null);
              }
            }}
            editingRecipe={editingRecipe}
            onClose={() => setEditingRecipe(null)}
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
              display: state.isMobile ? (state.sidebarOpen ? 'block' : 'none') : 'block'
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
                </button>
                <ul className="nav flex-column mt-2" style={{ 
                  paddingLeft: state.sidebarOpen ? '2rem' : '0',
                  display: state.sidebarOpen ? 'block' : 'none'
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
                        fontSize: '0.9rem'
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
                        fontSize: '0.9rem'
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
                        fontSize: '0.9rem'
                      }}
                    >
                      <FaUtensils className="me-2" style={{ fontSize: '14px' }} />
                      Rezepte
                    </button>
                  </li>
                </ul>
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
            lastSaved={lastSaved}
            storageInfo={storageInfo}
            isStorageAvailable={true}
          />

                                            {/* Import/Export Modal */}
            <ArtikelDataExchange
              show={importExport.showImportExportModal}
              onClose={() => importExport.setShowImportExportModal(false)}
              colors={colors}
              suppliers={state.suppliers}
              articles={state.articles}
              onImportComplete={(newSuppliers, newArticles) => {
                // Alle neuen Lieferanten und Artikel auf einmal hinzufügen
                if (newSuppliers.length > 0) {
                  dispatch({ type: 'SET_SUPPLIERS', payload: [...state.suppliers, ...newSuppliers] });
                }
                if (newArticles.length > 0) {
                  dispatch({ type: 'SET_ARTICLES', payload: [...state.articles, ...newArticles] });
                }
                // Nur einmal setImportCompleted aufrufen
                setImportCompleted(true);
              }}
            />
        </div>
      </ColorProvider>
    </ErrorBoundary>
  );
}

export default AppContent; 