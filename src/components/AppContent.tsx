import React, { useState, useEffect, useRef } from 'react';
import { FaUtensils, FaBars, FaPalette } from 'react-icons/fa';
import Dashboard from './Dashboard';
import Kalkulation from './Kalkulation';
import { ColorProvider } from '../contexts/ColorContext';
import ErrorBoundary from './ui/ErrorBoundary';
import MessageBox from './ui/MessageBox';
import { useStorage } from '../hooks/useStorage';
import { StorageMode, CloudStorageType, storageLayer } from '../services/storageLayer';
import LoadingSpinner from './ui/LoadingSpinner';
import StorageStatus from './ui/StorageStatus';
import { generateId } from '../utils/storageUtils';

import StorageManagement from './StorageManagement';
import DevelopmentPage from './DevelopmentPage';
import Sidebar from './ui/Sidebar';
import Belegverwaltung from './Belegverwaltung';

import Rezeptverwaltung from './Rezeptverwaltung';
import Rezeptformular from './Rezeptformular';
import Artikelverwaltung from './Artikelverwaltung';
import Lieferantenformular from './Lieferantenformular';
import Lieferantenverwaltung from './Lieferantenverwaltung';
import Artikelformular from './Artikelformular';
import ArtikelDataExchange from './ArtikelDataExchange';
import ThemeColorTest from './ThemeColorTest';
import AccountingOptions from './AccountingOptions';

// Import der ausgelagerten Module
import { designTemplates, DesignTemplateKey } from '../constants/designTemplates';
import { UNITS, ALLERGENS, CATEGORIES } from '../constants/articleConstants';
import { useImportExport } from '../hooks/useImportExport';
import { calculateGrossPrice, calculateNetPrice, isValidUrl, openWebsite, formatPrice, calculateKilojoules, formatAdditivesDisplay, formatAllergensDisplay } from '../utils/helpers';
import { getRecipeIngredients, getRecipeAllergens } from '../utils/recipeHelpers';
import { useArticleHandlers } from '../hooks/useArticleHandlers';
import { useAppContext } from '../contexts/AppContext';
import { categoryManager } from '../utils/categoryManager';
import { Receipt, ReceiptPaymentStatus } from '../types';

// Hilfsfunktion für Design-Speicherung in localOptions
const loadDesign = (): string | null => {
  try {
    // Lade aus neuer zentraler Struktur
    const localOptionsStr = localStorage.getItem('localOptions');
    if (localOptionsStr) {
      const localOptions = JSON.parse(localOptionsStr);
      if (localOptions?.design) {
        return typeof localOptions.design === 'string' ? localOptions.design : JSON.stringify(localOptions.design);
      }
    }
    
    // Migration: Prüfe alten Key (kann später entfernt werden)
    const oldKey = localStorage.getItem('chef_design');
    if (oldKey) {
      // Migriere zu neuer Struktur
      saveDesign(oldKey);
      // Lösche alten Key
      localStorage.removeItem('chef_design');
      return oldKey;
    }
  } catch (error) {
    console.error('Fehler beim Laden des Designs:', error);
  }
  return null;
};

// Hilfsfunktion zum Laden des gespeicherten Designs (mit Fallback)
const loadSavedDesign = (): string => {
  try {
    // Lade aus neuer zentraler Struktur
    const localOptionsStr = localStorage.getItem('localOptions');
    if (localOptionsStr) {
      const localOptions = JSON.parse(localOptionsStr);
      if (localOptions?.design) {
        const design = typeof localOptions.design === 'string' ? localOptions.design : JSON.stringify(localOptions.design);
        try {
          return JSON.parse(design);
        } catch (e) {
          return design;
        }
      }
    }
    
    // Migration: Prüfe alten Key (kann später entfernt werden)
    const oldKey = localStorage.getItem('chef_design');
    if (oldKey) {
      try {
        return JSON.parse(oldKey);
      } catch (e) {
        return oldKey;
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden des gespeicherten Designs:', error);
  }
  return 'warm'; // Fallback auf 'warm' wenn kein Design gespeichert ist
};

const saveDesign = (design: string) => {
  try {
    // Lade bestehende localOptions
    const localOptionsStr = localStorage.getItem('localOptions');
    let localOptions: any = {};
    
    if (localOptionsStr) {
      try {
        localOptions = JSON.parse(localOptionsStr);
      } catch (e) {
        // Falls Parsing fehlschlägt, starte mit leerem Objekt
        localOptions = {};
      }
    }
    
    // Speichere Design (als String, da es bereits JSON-stringified sein kann)
    localOptions.design = typeof design === 'string' ? design : JSON.stringify(design);
    
    // Speichere zurück
    localStorage.setItem('localOptions', JSON.stringify(localOptions));
  } catch (error) {
    console.error('Fehler beim Speichern des Designs:', error);
  }
};

function AppContent() {
  const { state, dispatch } = useAppContext();
  const { loadAppData, saveAppData, isLoading, lastSync, storageInfo, storageMode, cloudType } = useStorage();
  
  // State für MessageBox
  const [messageBox, setMessageBox] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  // Ref um sicherzustellen, dass QuotaExceeded-Meldung nur einmal pro Beleg-ID angezeigt wird
  // Map von Beleg-ID zu Boolean - verhindert mehrfache Anzeige für denselben Beleg
  const quotaErrorShownForReceiptRef = useRef<Map<string, boolean>>(new Map());
  
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
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [themeDropdownPosition, setThemeDropdownPosition] = useState<{ top: string; right: string } | null>(null);

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

  // Berechne Position für Theme-Dropdown
  useEffect(() => {
    if (state.showDesignSelector && themeButtonRef.current) {
      const updatePosition = () => {
        const rect = themeButtonRef.current?.getBoundingClientRect();
        if (rect) {
          setThemeDropdownPosition({
            top: `${rect.bottom + 8}px`,
            right: `${window.innerWidth - rect.right}px`
          });
        }
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    } else {
      setThemeDropdownPosition(null);
    }
  }, [state.showDesignSelector, state.sidebarOpen]);

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
            if (Array.isArray(appData.receipts) && appData.receipts.length > 0) {
              dispatch({ type: 'SET_RECEIPTS', payload: appData.receipts });
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
            if (Array.isArray(appData.receipts) && appData.receipts.length > 0) {
              dispatch({ type: 'SET_RECEIPTS', payload: appData.receipts });
            }
          }
        }
        
                 // Design immer aus localStorage laden
         const design = loadDesign();
         if (design) {
           try {
             const parsedDesign = JSON.parse(design);
             dispatch({ type: 'SET_CURRENT_DESIGN', payload: parsedDesign });
           } catch (e) {
             // Falls kein JSON, verwende direkt als String
             dispatch({ type: 'SET_CURRENT_DESIGN', payload: design });
           }
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
    datenbasis: false,
    kalkulation: false,
    einkauf: false,
    inventur: false,
    personal: false,
    haccp: false,
    einstellungen: false
  });

  const toggleAccordion = (section: 'datenbasis' | 'kalkulation' | 'einkauf' | 'inventur' | 'personal' | 'haccp' | 'einstellungen') => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isAccordionActive = (section: string) => {
    switch (section) {
      case 'datenbasis':
        return ['datenbasis', 'artikel', 'lieferanten'].includes(state.currentPage);
      case 'kalkulation':
        return ['kalkulation', 'rezepte', 'speisekarten', 'menus-buffets', 'nachkalkulationen'].includes(state.currentPage);
      case 'einkauf':
        return ['einkauf', 'einkaufslisten', 'einkauf-planen', 'belege'].includes(state.currentPage);
      case 'inventur':
        return ['inventur', 'warenbestand', 'inventar-verwalten'].includes(state.currentPage);
      case 'personal':
        return ['personal', 'personaldaten', 'dienstplaene', 'urlaubsplan', 'fehlzeiten'].includes(state.currentPage);
      case 'haccp':
        return ['haccp', 'temperaturlisten', 'reinigungslisten', 'material-verluste'].includes(state.currentPage);
      case 'einstellungen':
        return ['storage-settings', 'storage-management', 'development', 'accounting-options'].includes(state.currentPage);
      default:
        return false;
    }
  };

  // Automatisch Accordion öffnen, wenn ein Unterpunkt aktiv ist
  // und alle anderen Accordion-Bereiche schließen
  useEffect(() => {
    // Schließe alle Accordion-Bereiche zuerst
    setAccordionOpen(prev => ({
      datenbasis: false,
      kalkulation: false,
      einkauf: false,
      inventur: false,
      personal: false,
      haccp: false,
      einstellungen: false
    }));

    // Öffne nur den aktiven Bereich
    if (isAccordionActive('datenbasis')) {
      setAccordionOpen(prev => ({ ...prev, datenbasis: true }));
    }
    if (isAccordionActive('kalkulation')) {
      setAccordionOpen(prev => ({ ...prev, kalkulation: true }));
    }
    if (isAccordionActive('einkauf')) {
      setAccordionOpen(prev => ({ ...prev, einkauf: true }));
    }
    if (isAccordionActive('inventur')) {
      setAccordionOpen(prev => ({ ...prev, inventur: true }));
    }
    if (isAccordionActive('personal')) {
      setAccordionOpen(prev => ({ ...prev, personal: true }));
    }
    if (isAccordionActive('haccp')) {
      setAccordionOpen(prev => ({ ...prev, haccp: true }));
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
      categoryManager.updateCategories(state.articles).catch(err => 
        console.error('Fehler beim Aktualisieren der Kategorien:', err)
      );
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
    // Aktualisiere den CategoryManager mit den aktuellen Artikeldaten (async, aber nicht blockierend)
    categoryManager.updateCategories(state.articles || []).catch(err => 
      console.error('Fehler beim Aktualisieren der Kategorien:', err)
    );
    return categoryManager.getAllCategories();
  };

  // Nur Kategorien anzeigen, die tatsächlich in Artikeln verwendet werden
  const getUsedCategories = () => {
    // Aktualisiere den CategoryManager mit den aktuellen Artikeldaten (async, aber nicht blockierend)
    categoryManager.updateCategories(state.articles || []).catch(err => 
      console.error('Fehler beim Aktualisieren der Kategorien:', err)
    );
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

  const getReceiptSuppliers = () => {
    const receipts = state.receipts || [];
    const supplierNames = receipts
      .map(receipt => receipt.supplierId ? getSupplierName(receipt.supplierId) : 'Unbekannt')
      .filter(Boolean);
    return Array.from(new Set(supplierNames)).sort();
  };

  const filteredAndSortedReceipts = () => {
    const receipts = state.receipts || [];
    const search = state.receiptSearchTerm.toLowerCase().trim();

    const statusPriority: Record<ReceiptPaymentStatus, number> = {
      offen: 1,
      teilweise: 2,
      bezahlt: 3,
      überfällig: 4
    };

    const filtered = receipts.filter(receipt => {
      const supplierName = receipt.supplierId ? getSupplierName(receipt.supplierId) : 'Unbekannt';
      const paymentStatus = receipt.paymentStatus || 'offen';
      const completionMatches =
        state.receiptCompletionFilter === 'all' ||
        (state.receiptCompletionFilter === 'completed' && receipt.isCompleted) ||
        (state.receiptCompletionFilter === 'open' && !receipt.isCompleted);

      const paymentStatusMatches =
        !state.receiptSelectedPaymentStatus || paymentStatus === state.receiptSelectedPaymentStatus;

      const supplierMatches =
        !state.receiptSelectedSupplier || supplierName === state.receiptSelectedSupplier;

      const lineItemText = receipt.receiptDetails?.lineItems
        ?.map(item => item.description || '')
        .join(' ')
        .toLowerCase() || '';

      const matchesSearch =
        search.length === 0 ||
        [
          receipt.receiptNumber,
          receipt.bookingNumber,
          supplierName,
          paymentStatus,
          receipt.receiptDate,
          receipt.dueDate,
          lineItemText
        ]
          .filter(Boolean)
          .some(value => value!.toString().toLowerCase().includes(search));

      return completionMatches && paymentStatusMatches && supplierMatches && matchesSearch;
    });

    const directionFactor = state.receiptSortDirection === 'asc' ? 1 : -1;

    const sorted = filtered.sort((a, b) => {
      const field = state.receiptSortField;

      const parseDate = (value?: string) => {
        if (!value) return 0;
        const date = new Date(value);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      };

      switch (field) {
        case 'receiptDate':
          return (parseDate(a.receiptDate) - parseDate(b.receiptDate)) * directionFactor;
        case 'dueDate':
          return (parseDate(a.dueDate) - parseDate(b.dueDate)) * directionFactor;
        case 'supplier': {
          const nameA = a.supplierId ? getSupplierName(a.supplierId) : '';
          const nameB = b.supplierId ? getSupplierName(b.supplierId) : '';
          return nameA.localeCompare(nameB, 'de-DE') * directionFactor;
        }
        case 'paymentStatus': {
          const statusA = statusPriority[a.paymentStatus || 'offen'] || 0;
          const statusB = statusPriority[b.paymentStatus || 'offen'] || 0;
          return (statusA - statusB) * directionFactor;
        }
        case 'lineItemCount':
          return ((a.lineItemCount || 0) - (b.lineItemCount || 0)) * directionFactor;
        case 'totalGross': {
          const totalA = a.receiptDetails?.totalGross ?? 0;
          const totalB = b.receiptDetails?.totalGross ?? 0;
          return (totalA - totalB) * directionFactor;
        }
        default:
          return (parseDate(a.receiptDate) - parseDate(b.receiptDate)) * directionFactor;
      }
    });

    return sorted;
  };

  const handleSelectReceipt = (receiptId: string) => {
    if (state.selectedReceipts.includes(receiptId)) {
      dispatch({
        type: 'SET_SELECTED_RECEIPTS',
        payload: state.selectedReceipts.filter(id => id !== receiptId)
      });
    } else {
      dispatch({
        type: 'SET_SELECTED_RECEIPTS',
        payload: [...state.selectedReceipts, receiptId]
      });
    }
  };

  const handleSelectAllReceipts = () => {
    const receipts = filteredAndSortedReceipts();
    if (receipts.length === 0) {
      dispatch({ type: 'SET_SELECTED_RECEIPTS', payload: [] });
      return;
    }

    if (state.selectedReceipts.length === receipts.length) {
      dispatch({ type: 'SET_SELECTED_RECEIPTS', payload: [] });
    } else {
      dispatch({ type: 'SET_SELECTED_RECEIPTS', payload: receipts.map(receipt => receipt.id) });
    }
  };

  const handleUpdateReceipt = async (updatedReceipt: Receipt, options?: { suppressQuotaError?: boolean }) => {
    try {
      console.log('💾 [RECEIPT] Speichere Beleg:', {
        id: updatedReceipt.id,
        receiptImagePath: updatedReceipt.receiptImagePath,
        hasOcrResult: !!updatedReceipt.ocrResult,
        hasProcessedOcrData: !!updatedReceipt.processedOcrData,
        suppressQuotaError: options?.suppressQuotaError
      });
      
      const receiptWithMeta: Receipt = {
        ...updatedReceipt,
        isDirty: true,
        updatedAt: new Date()
      };

      // Prüfe ob Receipt bereits existiert
      const existingReceipt = state.receipts.find(r => r.id === receiptWithMeta.id);
      const isNewReceipt = !existingReceipt;
      
      // Prüfe ob ein Bild vorhanden ist
      // (Das Bild wurde bereits beim ersten Speichern nach OCR gespeichert - nur einmal!)
      // WICHTIG: Bei späteren Speichervorgängen wird das Bild NICHT nochmal gespeichert
      const hasImage = !!receiptWithMeta.receiptImagePath;

      try {
        // Versuche zu speichern (nur Beleg-Daten, Bild wurde bereits gespeichert)
        const success = await storageLayer.save('receipts', [receiptWithMeta]);
        if (success) {
          console.log('✅ [RECEIPT] Beleg erfolgreich gespeichert:', {
            id: receiptWithMeta.id,
            receiptImagePath: receiptWithMeta.receiptImagePath
          });
          
          // Update State nur bei erfolgreichem Speichern
          if (existingReceipt) {
            // Update bestehenden Receipt
            dispatch({
              type: 'UPDATE_RECEIPT',
              payload: { id: receiptWithMeta.id, receipt: receiptWithMeta }
            });
          } else {
            // Füge neuen Receipt hinzu
            dispatch({
              type: 'ADD_RECEIPT',
              payload: receiptWithMeta
            });
          }
        } else {
          console.warn('⚠️ [RECEIPT] Beleg konnte nicht gespeichert werden (save returned false)');
          // Update State trotzdem, damit der Beleg lokal sichtbar ist
          if (isNewReceipt) {
            dispatch({
              type: 'ADD_RECEIPT',
              payload: receiptWithMeta
            });
          } else {
            dispatch({
              type: 'UPDATE_RECEIPT',
              payload: { id: receiptWithMeta.id, receipt: receiptWithMeta }
            });
          }
          throw new Error('Speicherung fehlgeschlagen');
        }
      } catch (storageError: any) {
        // Prüfe auf QuotaExceededError
        if (storageError?.code === 'QUOTA_EXCEEDED') {
          // Prüfe, ob der Beleg erfolgreich gespeichert wurde (auch wenn reduziert)
          const wasSaved = storageError?.reducedSize === true || storageError?.minimalOnly === true;
          
          // Update State mit vollständigen Daten (auch wenn reduziert gespeichert wurde)
          // Die reduzierten Daten sind bereits persistent gespeichert, aber im State behalten wir die vollständigen Daten
          if (isNewReceipt) {
            dispatch({
              type: 'ADD_RECEIPT',
              payload: receiptWithMeta
            });
          } else {
            dispatch({
              type: 'UPDATE_RECEIPT',
              payload: { id: receiptWithMeta.id, receipt: receiptWithMeta }
            });
          }
          
          if (wasSaved) {
            console.log('✅ [RECEIPT] Beleg erfolgreich gespeichert (reduziert/minimal, bleibt nach Neustart erhalten):', {
              id: receiptWithMeta.id,
              reducedSize: storageError?.reducedSize,
              minimalOnly: storageError?.minimalOnly
            });
          } else {
            console.warn('⚠️ [RECEIPT] Beleg konnte nicht persistent gespeichert werden, nur lokal im State');
          }
          
          // Zeige Meldung nur beim finalen Speichern (nicht beim Laden oder Zwischenspeichern):
          // 1. Nicht unterdrückt (beim ersten Speichern nach OCR wird es unterdrückt)
          // 2. Ein Bild vorhanden ist (zeigt, dass der Beleg ein Bild hat, das gespeichert wurde)
          // 3. Die Meldung noch nicht für diesen Beleg angezeigt wurde
          const receiptId = receiptWithMeta.id;
          const alreadyShownForReceipt = quotaErrorShownForReceiptRef.current.get(receiptId) || false;
          const shouldShowError = !options?.suppressQuotaError && hasImage && !alreadyShownForReceipt;
          
          if (shouldShowError) {
            // Markiere, dass die Meldung für diesen Beleg angezeigt wurde
            quotaErrorShownForReceiptRef.current.set(receiptId, true);
            
            const itemCount = storageError?.itemCount || 0;
            const dataSizeMB = ((storageError?.dataSize || 0) / (1024 * 1024)).toFixed(2);
            let message = storageError.message || 
              `Der LocalStorage ist voll! Die Beleg-Daten (${itemCount} Einträge, ${dataSizeMB} MB) konnten nicht gespeichert werden.\n\n`;
            
            if (wasSaved) {
              const keptProcessedOcrData = storageError?.keptProcessedOcrData === true;
              if (keptProcessedOcrData) {
                message += `Der Beleg wurde ohne ocrResult gespeichert, aber processedOcrData wurde beibehalten. ` +
                  `Der Beleg bleibt nach einem Neustart erhalten und kann normal bearbeitet werden. ` +
                  `Bitte wechseln Sie zu einer anderen Speicherart (z.B. Supabase, PostgreSQL) in den Einstellungen oder bereinigen Sie den LocalStorage.`;
              } else {
                message += `Der Beleg wurde ohne OCR-Daten gespeichert und bleibt nach einem Neustart erhalten. ` +
                  `Bitte wechseln Sie zu einer anderen Speicherart (z.B. Supabase, PostgreSQL) in den Einstellungen oder bereinigen Sie den LocalStorage.`;
              }
            } else {
              message += `Der Original-Beleg wurde temporär gespeichert, aber nicht persistent. ` +
                `Bitte wechseln Sie zu einer anderen Speicherart (z.B. Supabase, PostgreSQL) in den Einstellungen oder bereinigen Sie den LocalStorage.`;
            }
            
            setMessageBox({
              show: true,
              type: 'warning',
              title: 'Speicher voll!',
              message: message
            });
            
            // Reset nach 5 Sekunden für diesen spezifischen Beleg, damit bei neuen Fehlern die Meldung wieder angezeigt werden kann
            setTimeout(() => {
              quotaErrorShownForReceiptRef.current.delete(receiptId);
            }, 5000);
          }
          // Fehler wird hier nicht weitergeworfen - Beleg ist (evtl. reduziert) gespeichert
        } else {
          // Andere Fehler - werfe weiter
          throw storageError;
        }
      }
    } catch (error: any) {
      console.error('❌ [RECEIPT] Fehler beim Aktualisieren des Belegs:', error);
      
      // Andere Fehler (nicht QuotaExceededError)
      if (error?.code !== 'QUOTA_EXCEEDED') {
        const errorMessage = error?.message || 'Unbekannter Fehler beim Speichern des Belegs';
        setMessageBox({
          show: true,
          type: 'error',
          title: '❌ Fehler beim Speichern',
          message: errorMessage
        });
      }
    }
  };

  const handleBulkUpdateReceiptStatus = async (status: ReceiptPaymentStatus) => {
    if (!state.selectedReceipts.length) {
      return;
    }

    try {
      const receiptsToUpdate = state.receipts
        .filter(receipt => state.selectedReceipts.includes(receipt.id))
        .map(receipt => ({
          ...receipt,
          paymentStatus: status,
          isDirty: true,
          updatedAt: new Date()
        }));

      if (receiptsToUpdate.length === 0) {
        return;
      }

      const success = await storageLayer.save('receipts', receiptsToUpdate);
      if (success) {
        const updatedReceipts = state.receipts.map(receipt => {
          const replacement = receiptsToUpdate.find(item => item.id === receipt.id);
          return replacement || receipt;
        });

        dispatch({ type: 'SET_RECEIPTS', payload: updatedReceipts });
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Zahlstatus:', error);
    }
  };

  const handleDeleteReceipts = async (
    receiptIds?: string[],
    onProgress?: (current: number, total: number) => void
  ) => {
    const idsToDelete = receiptIds && receiptIds.length ? receiptIds : state.selectedReceipts;

    if (!idsToDelete.length) {
      return;
    }

    try {
      for (let index = 0; index < idsToDelete.length; index += 1) {
        const receiptId = idsToDelete[index];
        if (onProgress) {
          onProgress(index, idsToDelete.length);
        }

        const success = await storageLayer.delete('receipts', receiptId);
        if (!success) {
          console.warn(`⚠️ Beleg ${receiptId} konnte nicht gelöscht werden`);
        }
      }

      if (onProgress) {
        onProgress(idsToDelete.length, idsToDelete.length);
      }

      dispatch({ type: 'DELETE_RECEIPTS', payload: idsToDelete });
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Belege:', error);
      // Entferne trotzdem lokal, um UI in konsistenten Zustand zu bringen
      dispatch({ type: 'DELETE_RECEIPTS', payload: idsToDelete });
    }
  };

  const handleCreateReceipt = async (): Promise<Receipt> => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    const newReceipt: Receipt = {
      id: generateId(),
      supplierId: '',
      bookingNumber: '',
      receiptDate: dateString,
      receiptNumber: '',
      receiptDetails: {
        lineItems: [],
        currency: 'EUR',
        totalNet: 0,
        totalVat: 0,
        totalGross: 0
      },
      dueDate: '',
      paymentStatus: 'offen',
      lineItemCount: 0,
      accounting: [],
      isCompleted: false,
      notes: '',
      isDirty: true,
      isNew: true,
      syncStatus: 'pending',
      createdAt: today,
      updatedAt: today
    };

    dispatch({ type: 'ADD_RECEIPT', payload: newReceipt });

    try {
      await storageLayer.save('receipts', [newReceipt]);
    } catch (error) {
      console.error('❌ Fehler beim Speichern des neuen Belegs:', error);
    }

    return newReceipt;
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

      case 'datenbasis':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Datenbasis</h1>
              <p style={{ color: colors.text }}>Verwalten Sie Ihre Artikel und Lieferanten.</p>
            </div>
          </div>
        );

      case 'kalkulation':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Kalkulation</h1>
              <p style={{ color: colors.text }}>Verwalten Sie Rezepte, Speisekarten und Menüs.</p>
            </div>
          </div>
        );

      case 'speisekarten':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Speisekarten</h1>
              <p style={{ color: colors.text }}>Hier werden die Speisekarten verwaltet.</p>
            </div>
          </div>
        );

      case 'menus-buffets':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Menüs &amp; Büffets</h1>
              <p style={{ color: colors.text }}>Hier werden Menüs und Büffets verwaltet.</p>
            </div>
          </div>
        );

      case 'nachkalkulationen':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Nachkalkulationen</h1>
              <p style={{ color: colors.text }}>Hier werden Nachkalkulationen durchgeführt.</p>
            </div>
          </div>
        );

      case 'einkauf':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Einkauf</h1>
              <p style={{ color: colors.text }}>Verwalten Sie Einkaufslisten und Rechnungen.</p>
            </div>
          </div>
        );

      case 'einkaufslisten':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Einkaufslisten</h1>
              <p style={{ color: colors.text }}>Hier werden Einkaufslisten verwaltet.</p>
            </div>
          </div>
        );

      case 'einkauf-planen':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Einkauf planen</h1>
              <p style={{ color: colors.text }}>Hier wird der Einkauf geplant.</p>
            </div>
          </div>
        );

      case 'belege': {
        const receiptSuppliers = getReceiptSuppliers();
        return (
          <Belegverwaltung
            receipts={state.receipts}
            colors={colors}
            searchTerm={state.receiptSearchTerm}
            setSearchTerm={(term) => dispatch({ type: 'SET_RECEIPT_SEARCH_TERM', payload: term })}
            sortField={state.receiptSortField}
            setSortField={(field) => dispatch({ type: 'SET_RECEIPT_SORT_FIELD', payload: field })}
            sortDirection={state.receiptSortDirection}
            setSortDirection={(direction) => dispatch({ type: 'SET_RECEIPT_SORT_DIRECTION', payload: direction })}
            selectedSupplier={state.receiptSelectedSupplier}
            setSelectedSupplier={(supplier) =>
              dispatch({ type: 'SET_RECEIPT_SELECTED_SUPPLIER', payload: supplier })
            }
            selectedPaymentStatus={state.receiptSelectedPaymentStatus}
            setSelectedPaymentStatus={(status) =>
              dispatch({ type: 'SET_RECEIPT_SELECTED_PAYMENT_STATUS', payload: status })
            }
            completionFilter={state.receiptCompletionFilter}
            setCompletionFilter={(filter) =>
              dispatch({ type: 'SET_RECEIPT_COMPLETION_FILTER', payload: filter })
            }
            filteredAndSortedReceipts={filteredAndSortedReceipts}
            receiptSuppliers={receiptSuppliers}
            selectedReceipts={state.selectedReceipts}
            handleSelectReceipt={handleSelectReceipt}
            handleSelectAll={handleSelectAllReceipts}
            handleDeleteReceipts={handleDeleteReceipts}
            handleBulkMarkAsPaid={() => handleBulkUpdateReceiptStatus('bezahlt')}
            handleBulkMarkAsOpen={() => handleBulkUpdateReceiptStatus('offen')}
            onCreateReceipt={handleCreateReceipt}
            onUpdateReceipt={handleUpdateReceipt}
            formatPrice={formatPrice}
            getSupplierName={getSupplierName}
            suppliers={state.suppliers}
          />
        );
      }

      case 'inventur':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Inventur</h1>
              <p style={{ color: colors.text }}>Verwalten Sie Warenbestand und Inventar.</p>
            </div>
          </div>
        );

      case 'warenbestand':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Warenbestand</h1>
              <p style={{ color: colors.text }}>Hier wird der Warenbestand verwaltet.</p>
            </div>
          </div>
        );

      case 'inventar-verwalten':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Inventar verwalten</h1>
              <p style={{ color: colors.text }}>Hier wird das Inventar verwaltet.</p>
            </div>
          </div>
        );

      case 'personal':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Personal</h1>
              <p style={{ color: colors.text }}>Verwalten Sie Personaldaten und Dienstpläne.</p>
            </div>
          </div>
        );

      case 'personaldaten':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Personaldaten</h1>
              <p style={{ color: colors.text }}>Hier werden Personaldaten verwaltet.</p>
            </div>
          </div>
        );

      case 'dienstplaene':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Dienstpläne</h1>
              <p style={{ color: colors.text }}>Hier werden Dienstpläne verwaltet.</p>
            </div>
          </div>
        );

      case 'urlaubsplan':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Urlaubsplan</h1>
              <p style={{ color: colors.text }}>Hier wird der Urlaubsplan verwaltet.</p>
            </div>
          </div>
        );

      case 'fehlzeiten':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Fehlzeiten</h1>
              <p style={{ color: colors.text }}>Hier werden Fehlzeiten verwaltet.</p>
            </div>
          </div>
        );

      case 'haccp':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>HACCP</h1>
              <p style={{ color: colors.text }}>Verwalten Sie Temperaturlisten und Reinigungslisten.</p>
            </div>
          </div>
        );

      case 'temperaturlisten':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Temperaturlisten</h1>
              <p style={{ color: colors.text }}>Hier werden Temperaturlisten verwaltet.</p>
            </div>
          </div>
        );

      case 'reinigungslisten':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Reinigungslisten</h1>
              <p style={{ color: colors.text }}>Hier werden Reinigungslisten verwaltet.</p>
            </div>
          </div>
        );

      case 'material-verluste':
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
              <h1 style={{ color: colors.text, marginBottom: '2rem' }}>Material-Verluste</h1>
              <p style={{ color: colors.text }}>Hier werden Material-Verluste verwaltet.</p>
            </div>
          </div>
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
      case 'accounting-options':
        return <AccountingOptions colors={colors} />;

      case 'development':
        return <DevelopmentPage />;

      case 'theme-test':
        return <ThemeColorTest />;

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
        <div className="drawer" style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
          <style>
            {`
              :root {
                --theme-primary: ${colors.primary};
                --theme-secondary: ${colors.secondary};
                --theme-accent: ${colors.accent};
                --theme-text: ${colors.text};
                --theme-text-secondary: ${colors.textSecondary};
                --theme-card: ${colors.card};
                --theme-card-border: ${colors.cardBorder};
                --theme-card-bg: ${colors.card};
                --theme-card-bg-dark: ${colors.card}cc;
                --theme-background: ${colors.background};
                --theme-sidebar: ${colors.sidebar};
                --theme-input: ${colors.input};
                --theme-paper: ${colors.paper};
                --theme-paper-shadow: ${colors.paperShadow};
              }
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
                width: 100% !important;
                background: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .sidebar-button span {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .sidebar-sub-button {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                width: 100% !important;
                background: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            `}
          </style>
          <input 
            id="drawer-toggle" 
            type="checkbox" 
            className="drawer-toggle" 
            checked={state.sidebarOpen}
            onChange={toggleSidebar}
          />
          
          {/* Main Content */}
          <div className="drawer-content flex flex-col">
            {/* Header */}
            <nav className="navbar navbar-dark fixed-top" style={{ 
              backgroundColor: colors.primary,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1030
            }}>
              <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost" style={{ 
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px'
              }}>
                <FaBars />
              </label>
              <span className="navbar-brand mx-auto d-flex align-items-center">
                <FaUtensils className="me-2" style={{ fontSize: '20px' }} />
                The Chef's Numbers
              </span>
              <div style={{ position: 'relative' }}>
                <button 
                  ref={themeButtonRef}
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
              </div>
            </nav>

            {/* Main Content Area */}
            <div 
              className="main-content-area"
              style={{ 
                marginLeft: state.sidebarOpen ? 224 : 60
              }}
            >
              {renderPage()}
            </div>
          </div>

          {/* Design Selector - Dropdown unterhalb des Buttons */}
          {state.showDesignSelector && (
            <>
              {/* Backdrop zum Schließen */}
              <div 
                style={{ 
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1060,
                  background: 'transparent'
                }}
                onClick={() => dispatch({ type: 'SET_SHOW_DESIGN_SELECTOR', payload: false })}
              />
              {/* Dropdown - position: fixed um über Drawer zu liegen */}
              {themeDropdownPosition && (
                <div 
                  style={{ 
                    position: 'fixed',
                    top: themeDropdownPosition.top,
                    right: themeDropdownPosition.right,
                    width: '380px',
                    maxWidth: '90vw',
                    zIndex: 1061,
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '0.375rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                <div style={{ 
                  maxHeight: '60vh', 
                  overflowY: 'auto',
                  padding: '0.75rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                    {Object.entries(designTemplates).map(([key, template]) => (
                      <div 
                        key={key}
                        className="cursor-pointer" 
                        style={{ 
                          backgroundColor: template.colors.card,
                          border: state.currentDesign === key ? `2px solid ${template.colors.accent}` : `1px solid ${template.colors.cardBorder}`,
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: state.currentDesign === key ? 1 : 0.9
                        }}
                        onMouseEnter={(e) => {
                          if (state.currentDesign !== key) {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (state.currentDesign !== key) {
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                        onClick={() => {
                          dispatch({ type: 'SET_CURRENT_DESIGN', payload: key });
                          dispatch({ type: 'SET_SHOW_DESIGN_SELECTOR', payload: false });
                          // Speichere Design sofort
                          saveDesign(JSON.stringify(key));
                        }}
                      >
                        <div style={{ 
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: template.colors.text,
                          marginBottom: '0.25rem'
                        }}>
                          {template.name}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: template.colors.textSecondary || template.colors.text,
                          opacity: 0.8,
                          marginBottom: '0.5rem',
                          lineHeight: '1.3'
                        }}>
                          {template.description}
                        </div>
                        <div className="d-flex gap-2" style={{ justifyContent: 'flex-start' }}>
                          <div style={{ 
                            width: 16, 
                            height: 16, 
                            backgroundColor: template.colors.primary, 
                            borderRadius: '50%',
                            border: `1px solid ${template.colors.cardBorder}`
                          }}></div>
                          <div style={{ 
                            width: 16, 
                            height: 16, 
                            backgroundColor: template.colors.accent, 
                            borderRadius: '50%',
                            border: `1px solid ${template.colors.cardBorder}`
                          }}></div>
                          <div style={{ 
                            width: 16, 
                            height: 16, 
                            backgroundColor: template.colors.secondary, 
                            borderRadius: '50%',
                            border: `1px solid ${template.colors.cardBorder}`
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              )}
            </>
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
          <Sidebar
            state={state}
            dispatch={dispatch}
            colors={colors}
            accordionOpen={accordionOpen}
            toggleAccordion={toggleAccordion}
          />

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
        
        {/* MessageBox für Fehlermeldungen */}
        <MessageBox
          show={messageBox.show}
          type={messageBox.type}
          title={messageBox.title}
          message={messageBox.message}
          onClose={() => setMessageBox({ ...messageBox, show: false })}
          colors={getCurrentColors()}
        />
      </ColorProvider>
    </ErrorBoundary>
  );
}

export default AppContent; 