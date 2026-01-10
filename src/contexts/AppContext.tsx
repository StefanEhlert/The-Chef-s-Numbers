import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useRef } from 'react';
import { Receipt, ReceiptPaymentStatus, UnitEntity, CategoryEntity } from '../types';
import type { AccountingSettings } from '../types/accounting';

// App State Interface
interface AppState {
  // Navigation
  sidebarOpen: boolean;
  isMobile: boolean;
  currentPage: string;
  
  // Design
  currentDesign: string;
  showDesignSelector: boolean;
  
  // Artikelverwaltung
  articles: any[];
  searchTerm: string;
  viewMode: 'list' | 'grid';
  selectedCategory: string;
  selectedSupplier: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  selectedArticles: string[];
  activeTab: string;
  
  // Lieferantenverwaltung
  suppliers: any[];
  supplierSearchTerm: string;
  supplierViewMode: 'list' | 'grid';
  supplierSortField: string;
  supplierSortDirection: 'asc' | 'desc';
  selectedSuppliers: string[];
  
  // Rezeptverwaltung
  recipes: any[];
  recipeSearchTerm: string;
  recipeViewMode: 'list' | 'grid';
  selectedRecipes: string[];
  recipeSortBy: 'name' | 'portions' | 'costPerPortion' | 'sellingPrice' | 'energy' | 'timestamp';
  recipeSortOrder: 'asc' | 'desc';
  
  // Belegverwaltung
  receipts: Receipt[];
  receiptSearchTerm: string;
  receiptSortField: 'receiptDate' | 'supplier' | 'dueDate' | 'paymentStatus' | 'lineItemCount' | 'totalGross';
  receiptSortDirection: 'asc' | 'desc';
  receiptSelectedSupplier: string;
  receiptSelectedPaymentStatus: ReceiptPaymentStatus | '';
  receiptCompletionFilter: 'all' | 'completed' | 'open';
  selectedReceipts: string[];
  
  // Formulare
  showArticleForm: boolean;
  editingArticle: any;
  newArticleName: string; // Neuer State für den Artikelnamen beim Erstellen
  showSupplierForm: boolean;
  editingSupplierId: string | null;
  showRecipeForm: boolean;
  editingRecipe: any; // Neuer State für das zu bearbeitende Rezept
  
  // Dialoge
  showDeleteDialog: boolean;
  deleteDialogData: any;
}

// Action Types
type AppAction =
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_CURRENT_DESIGN'; payload: string }
  | { type: 'SET_SHOW_DESIGN_SELECTOR'; payload: boolean }
  | { type: 'SET_ARTICLES'; payload: any[] }
  | { type: 'ADD_ARTICLE'; payload: any }
  | { type: 'UPDATE_ARTICLE'; payload: { id: string; article: any } }
  | { type: 'DELETE_ARTICLES'; payload: string[] }
  | { type: 'SET_SUPPLIERS'; payload: any[] }
  | { type: 'ADD_SUPPLIER'; payload: any }
  | { type: 'UPDATE_SUPPLIER'; payload: { id: string; supplier: any } }
  | { type: 'DELETE_SUPPLIERS'; payload: string[] }
  | { type: 'SET_RECIPES'; payload: any[] }
  | { type: 'ADD_RECIPE'; payload: any }
  | { type: 'UPDATE_RECIPE'; payload: { id: string; recipe: any } }
  | { type: 'DELETE_RECIPES'; payload: string[] }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: 'list' | 'grid' }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'SET_SELECTED_SUPPLIER'; payload: string }
  | { type: 'SET_SORT_FIELD'; payload: string }
  | { type: 'SET_SORT_DIRECTION'; payload: 'asc' | 'desc' }
  | { type: 'SET_SELECTED_ARTICLES'; payload: string[] }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_SHOW_ARTICLE_FORM'; payload: boolean }
  | { type: 'SET_EDITING_ARTICLE'; payload: any }
  | { type: 'SET_NEW_ARTICLE_NAME'; payload: string }
  | { type: 'SET_SHOW_SUPPLIER_FORM'; payload: boolean }
  | { type: 'SET_EDITING_SUPPLIER_ID'; payload: string | null }
  | { type: 'SET_SHOW_RECIPE_FORM'; payload: boolean }
  | { type: 'SET_EDITING_RECIPE'; payload: any }
  | { type: 'SET_SHOW_DELETE_DIALOG'; payload: boolean }
  | { type: 'SET_DELETE_DIALOG_DATA'; payload: any }
  // Lieferanten-spezifische Actions
  | { type: 'SET_SUPPLIER_SEARCH_TERM'; payload: string }
  | { type: 'SET_SUPPLIER_VIEW_MODE'; payload: 'list' | 'grid' }
  | { type: 'SET_SUPPLIER_SORT_FIELD'; payload: string }
  | { type: 'SET_SUPPLIER_SORT_DIRECTION'; payload: 'asc' | 'desc' }
  | { type: 'SET_SELECTED_SUPPLIERS'; payload: string[] }
  // Rezept-spezifische Actions
  | { type: 'SET_RECIPE_SEARCH_TERM'; payload: string }
  | { type: 'SET_RECIPE_VIEW_MODE'; payload: 'list' | 'grid' }
  | { type: 'SET_RECIPE_SORT_BY'; payload: 'name' | 'portions' | 'costPerPortion' | 'sellingPrice' | 'energy' | 'timestamp' }
  | { type: 'SET_RECIPE_SORT_ORDER'; payload: 'asc' | 'desc' }
  | { type: 'SET_SELECTED_RECIPES'; payload: string[] }
  // Belegverwaltung Actions
  | { type: 'SET_RECEIPTS'; payload: Receipt[] }
  | { type: 'ADD_RECEIPT'; payload: Receipt }
  | { type: 'UPDATE_RECEIPT'; payload: { id: string; receipt: Receipt } }
  | { type: 'DELETE_RECEIPTS'; payload: string[] }
  | { type: 'SET_RECEIPT_SEARCH_TERM'; payload: string }
  | { type: 'SET_RECEIPT_SORT_FIELD'; payload: AppState['receiptSortField'] }
  | { type: 'SET_RECEIPT_SORT_DIRECTION'; payload: 'asc' | 'desc' }
  | { type: 'SET_RECEIPT_SELECTED_SUPPLIER'; payload: string }
  | { type: 'SET_RECEIPT_SELECTED_PAYMENT_STATUS'; payload: ReceiptPaymentStatus | '' }
  | { type: 'SET_RECEIPT_COMPLETION_FILTER'; payload: 'all' | 'completed' | 'open' }
  | { type: 'SET_SELECTED_RECEIPTS'; payload: string[] };

// Hilfsfunktion zum Laden des gespeicherten Designs
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

// Initial State
const initialState: AppState = {
  sidebarOpen: true,
  isMobile: false,
  currentPage: 'dashboard',
  currentDesign: loadSavedDesign(),
  showDesignSelector: false,
  articles: [],
  searchTerm: '',
  viewMode: 'list',
  selectedCategory: '',
  selectedSupplier: '',
  sortField: 'name',
  sortDirection: 'asc',
  selectedArticles: [],
  activeTab: 'kalkulation',
  suppliers: [],
  supplierSearchTerm: '',
  supplierViewMode: 'list',
  supplierSortField: 'name',
  supplierSortDirection: 'asc',
  selectedSuppliers: [],
  recipes: [],
  recipeSearchTerm: '',
  recipeViewMode: 'list',
  selectedRecipes: [],
  recipeSortBy: 'name',
  recipeSortOrder: 'asc',
  receipts: [],
  receiptSearchTerm: '',
  receiptSortField: 'receiptDate',
  receiptSortDirection: 'desc',
  receiptSelectedSupplier: '',
  receiptSelectedPaymentStatus: '',
  receiptCompletionFilter: 'all',
  selectedReceipts: [],
  showArticleForm: false,
  editingArticle: null,
  newArticleName: '', // Initialize newArticleName
  showSupplierForm: false,
  editingSupplierId: null,
  showRecipeForm: false,
  editingRecipe: null,
  showDeleteDialog: false,
  deleteDialogData: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_CURRENT_DESIGN':
      return { ...state, currentDesign: action.payload };
    case 'SET_SHOW_DESIGN_SELECTOR':
      return { ...state, showDesignSelector: action.payload };
    case 'SET_ARTICLES':
      return { ...state, articles: action.payload };
    case 'ADD_ARTICLE':
      return { ...state, articles: [...state.articles, action.payload] };
    case 'UPDATE_ARTICLE':
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.id ? action.payload.article : article
        ),
      };
    case 'DELETE_ARTICLES':
      return {
        ...state,
        articles: state.articles.filter(article => !action.payload.includes(article.id)),
        selectedArticles: state.selectedArticles.filter(id => !action.payload.includes(id)),
      };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(supplier =>
          supplier.id === action.payload.id ? action.payload.supplier : supplier
        ),
      };
    case 'DELETE_SUPPLIERS':
      return {
        ...state,
        suppliers: state.suppliers.filter(supplier => !action.payload.includes(supplier.id)),
        selectedSuppliers: state.selectedSuppliers.filter(id => !action.payload.includes(id)),
      };
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe =>
          recipe.id === action.payload.id ? action.payload.recipe : recipe
        ),
      };
    case 'DELETE_RECIPES':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => !action.payload.includes(recipe.id)),
        selectedRecipes: state.selectedRecipes.filter(id => !action.payload.includes(id)),
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_SELECTED_SUPPLIER':
      return { ...state, selectedSupplier: action.payload };
    case 'SET_SORT_FIELD':
      return { ...state, sortField: action.payload };
    case 'SET_SORT_DIRECTION':
      return { ...state, sortDirection: action.payload };
    case 'SET_SELECTED_ARTICLES':
      return { ...state, selectedArticles: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SHOW_ARTICLE_FORM':
      return { ...state, showArticleForm: action.payload };
    case 'SET_EDITING_ARTICLE':
      return { ...state, editingArticle: action.payload };
    case 'SET_NEW_ARTICLE_NAME':
      return { ...state, newArticleName: action.payload };
    case 'SET_SHOW_SUPPLIER_FORM':
      return { ...state, showSupplierForm: action.payload };
    case 'SET_EDITING_SUPPLIER_ID':
      return { ...state, editingSupplierId: action.payload };
    case 'SET_SHOW_RECIPE_FORM':
      return { ...state, showRecipeForm: action.payload };
    case 'SET_EDITING_RECIPE':
      return { ...state, editingRecipe: action.payload };
    case 'SET_SHOW_DELETE_DIALOG':
      return { ...state, showDeleteDialog: action.payload };
    case 'SET_DELETE_DIALOG_DATA':
      return { ...state, deleteDialogData: action.payload };
    // Lieferanten-spezifische Actions
    case 'SET_SUPPLIER_SEARCH_TERM':
      return { ...state, supplierSearchTerm: action.payload };
    case 'SET_SUPPLIER_VIEW_MODE':
      return { ...state, supplierViewMode: action.payload };
    case 'SET_SUPPLIER_SORT_FIELD':
      return { ...state, supplierSortField: action.payload };
    case 'SET_SUPPLIER_SORT_DIRECTION':
      return { ...state, supplierSortDirection: action.payload };
    case 'SET_SELECTED_SUPPLIERS':
      return { ...state, selectedSuppliers: action.payload };
    // Rezept-spezifische Actions
    case 'SET_RECIPE_SEARCH_TERM':
      return { ...state, recipeSearchTerm: action.payload };
    case 'SET_RECIPE_VIEW_MODE':
      return { ...state, recipeViewMode: action.payload };
    case 'SET_RECIPE_SORT_BY':
      return { ...state, recipeSortBy: action.payload };
    case 'SET_RECIPE_SORT_ORDER':
      return { ...state, recipeSortOrder: action.payload };
    case 'SET_SELECTED_RECIPES':
      return { ...state, selectedRecipes: action.payload };
    case 'SET_RECEIPTS':
      return { ...state, receipts: action.payload };
    case 'ADD_RECEIPT':
      return { ...state, receipts: [...state.receipts, action.payload] };
    case 'UPDATE_RECEIPT':
      return {
        ...state,
        receipts: state.receipts.map(receipt =>
          receipt.id === action.payload.id ? action.payload.receipt : receipt
        ),
      };
    case 'DELETE_RECEIPTS':
      return {
        ...state,
        receipts: state.receipts.filter(receipt => !action.payload.includes(receipt.id)),
        selectedReceipts: state.selectedReceipts.filter(id => !action.payload.includes(id)),
      };
    case 'SET_RECEIPT_SEARCH_TERM':
      return { ...state, receiptSearchTerm: action.payload };
    case 'SET_RECEIPT_SORT_FIELD':
      return { ...state, receiptSortField: action.payload };
    case 'SET_RECEIPT_SORT_DIRECTION':
      return { ...state, receiptSortDirection: action.payload };
    case 'SET_RECEIPT_SELECTED_SUPPLIER':
      return { ...state, receiptSelectedSupplier: action.payload };
    case 'SET_RECEIPT_SELECTED_PAYMENT_STATUS':
      return { ...state, receiptSelectedPaymentStatus: action.payload };
    case 'SET_RECEIPT_COMPLETION_FILTER':
      return { ...state, receiptCompletionFilter: action.payload };
    case 'SET_SELECTED_RECEIPTS':
      return { ...state, selectedReceipts: action.payload };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationLockRef = useRef(false); // Lock um doppelte Initialisierung zu verhindern

  // Einfache App-Initialisierung (ohne Auto-Migration)
  useEffect(() => {
    const initializeApp = async () => {
    // Prüfe Lock - verhindere doppelte Ausführung
    if (initializationLockRef.current) {
      console.log('⚠️ Initialisierung bereits läuft - überspringe');
      return;
    }
    
    initializationLockRef.current = true;
    console.log('🚀 App wird initialisiert...');
      
      // Initialisiere vatRates in accountingSettings falls nicht vorhanden
      try {
        const { storageLayer } = await import('../services/storageLayer');
        const { VAT_RATES } = await import('../constants/articleConstants');
        
        const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
        let needsUpdate = false;
        let updatedSettings: AccountingSettings;
        
        if (!settings || settings.length === 0) {
          // Erstelle neue Settings mit vatRates
          const { generateId } = await import('../utils/storageUtils');
          updatedSettings = {
            id: generateId(),
            vatRates: VAT_RATES,
            updatedAt: new Date(),
            isNew: true,
            isDirty: true,
            syncStatus: 'pending'
          };
          needsUpdate = true;
        } else {
          const firstSettings = settings[0];
          if (!firstSettings.vatRates || firstSettings.vatRates.length === 0) {
            // Füge vatRates hinzu
            updatedSettings = {
              ...firstSettings,
              vatRates: VAT_RATES,
              updatedAt: new Date(),
              isDirty: true
            };
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await storageLayer.save('accountingSettings', [updatedSettings!]);
          console.log('✅ vatRates in accountingSettings initialisiert');
        }
      } catch (error) {
        console.error('❌ Fehler beim Initialisieren von vatRates:', error);
      }
      
      // Initialisiere Einheiten-Tabelle falls nicht vorhanden
      try {
        const { storageLayer } = await import('../services/storageLayer');
        const { UNITS } = await import('../constants/articleConstants');
        const { generateId } = await import('../utils/storageUtils');
        
        // Prüfe ob Einheiten bereits vorhanden sind (mehrfach prüfen für Race-Condition-Schutz)
        let existingUnits = await storageLayer.load<UnitEntity>('units');
        
        // WICHTIG: Prüfe nochmal nach kurzer Pause (Race-Condition-Schutz)
        if (!existingUnits || existingUnits.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Kurze Pause
          existingUnits = await storageLayer.load<UnitEntity>('units');
        }
        
        if (!existingUnits || existingUnits.length === 0) {
          console.log('📦 Initialisiere Einheiten-Tabelle...');
          
          // Sammle alle Einheiten aus Konstanten (eindeutig, case-insensitive)
          const unitsFromConstants = new Map<string, string>(); // Map: lowercase -> original
          UNITS.forEach(unit => {
            const trimmed = unit.trim();
            if (trimmed) {
              unitsFromConstants.set(trimmed.toLowerCase(), trimmed);
            }
          });
          
          // Sammle alle Einheiten aus Artikeln (bundleUnit und contentUnit)
          const articles = await storageLayer.load<any>('articles');
          if (articles && articles.length > 0) {
            articles.forEach((article: any) => {
              if (article.bundleUnit && article.bundleUnit.trim() !== '') {
                const trimmed = article.bundleUnit.trim();
                if (!unitsFromConstants.has(trimmed.toLowerCase())) {
                  unitsFromConstants.set(trimmed.toLowerCase(), trimmed);
                }
              }
              if (article.contentUnit && article.contentUnit.trim() !== '') {
                const trimmed = article.contentUnit.trim();
                if (!unitsFromConstants.has(trimmed.toLowerCase())) {
                  unitsFromConstants.set(trimmed.toLowerCase(), trimmed);
                }
              }
            });
          }
          
          // Erstelle UnitEntity-Objekte (verwende original case)
          const unitsToSave: UnitEntity[] = Array.from(unitsFromConstants.values()).map(unitName => ({
            id: generateId(),
            name: unitName,
            description: undefined,
            isNew: true,
            isDirty: true,
            syncStatus: 'pending' as const,
            updatedAt: new Date()
          }));
          
          // Prüfe nochmal VOR dem Speichern (Race-Condition-Schutz)
          const finalCheck = await storageLayer.load<UnitEntity>('units');
          if (finalCheck && finalCheck.length > 0) {
            console.log(`ℹ️ Einheiten wurden zwischenzeitlich hinzugefügt - überspringe Initialisierung`);
          } else {
            // Speichere Einheiten
            const success = await storageLayer.save('units', unitsToSave);
            if (success) {
              console.log(`✅ Einheiten-Tabelle initialisiert mit ${unitsToSave.length} Einheiten`);
            } else {
              console.error('❌ Fehler beim Speichern der Einheiten');
            }
          }
        } else {
          console.log(`ℹ️ Einheiten-Tabelle bereits vorhanden (${existingUnits.length} Einheiten)`);
          
          // Prüfe ob neue Einheiten aus Artikeln hinzugefügt werden müssen
          const articles = await storageLayer.load<any>('articles');
          if (articles && articles.length > 0) {
            const existingUnitNames = new Set(existingUnits.map(unit => unit.name.toLowerCase()));
            const newUnits: UnitEntity[] = [];
            
            articles.forEach((article: any) => {
              // Prüfe bundleUnit
              if (article.bundleUnit && article.bundleUnit.trim() !== '') {
                const unitName = article.bundleUnit.trim();
                // Prüfe auf Eindeutigkeit (case-insensitive)
                if (!existingUnitNames.has(unitName.toLowerCase())) {
                  existingUnitNames.add(unitName.toLowerCase());
                  newUnits.push({
                    id: generateId(),
                    name: unitName,
                    description: undefined,
                    isNew: true,
                    isDirty: true,
                    syncStatus: 'pending' as const,
                    updatedAt: new Date()
                  });
                }
              }
              // Prüfe contentUnit
              if (article.contentUnit && article.contentUnit.trim() !== '') {
                const unitName = article.contentUnit.trim();
                // Prüfe auf Eindeutigkeit (case-insensitive)
                if (!existingUnitNames.has(unitName.toLowerCase())) {
                  existingUnitNames.add(unitName.toLowerCase());
                  newUnits.push({
                    id: generateId(),
                    name: unitName,
                    description: undefined,
                    isNew: true,
                    isDirty: true,
                    syncStatus: 'pending' as const,
                    updatedAt: new Date()
                  });
                }
              }
            });
            
            if (newUnits.length > 0) {
              console.log(`📦 Füge ${newUnits.length} neue Einheiten aus Artikeln hinzu...`);
              const success = await storageLayer.save('units', newUnits);
              if (success) {
                console.log(`✅ ${newUnits.length} neue Einheiten hinzugefügt`);
              } else {
                console.error('❌ Fehler beim Hinzufügen neuer Einheiten');
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Fehler beim Initialisieren der Einheiten:', error);
      }
      
      // Initialisiere Kategorien-Tabelle falls nicht vorhanden
      try {
        const { storageLayer } = await import('../services/storageLayer');
        const { CATEGORIES } = await import('../constants/articleConstants');
        const { generateId } = await import('../utils/storageUtils');
        
        // Prüfe ob Kategorien bereits vorhanden sind (mehrfach prüfen für Race-Condition-Schutz)
        let existingCategories = await storageLayer.load<CategoryEntity>('categories');
        
        // WICHTIG: Prüfe nochmal nach kurzer Pause (Race-Condition-Schutz)
        if (!existingCategories || existingCategories.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Kurze Pause
          existingCategories = await storageLayer.load<CategoryEntity>('categories');
        }
        
        if (!existingCategories || existingCategories.length === 0) {
          console.log('📁 Initialisiere Kategorien-Tabelle...');
          
          // Sammle alle Kategorien aus Konstanten (eindeutig, case-insensitive)
          const categoriesFromConstants = new Map<string, string>(); // Map: lowercase -> original
          CATEGORIES.forEach(cat => {
            const trimmed = cat.trim();
            if (trimmed) {
              categoriesFromConstants.set(trimmed.toLowerCase(), trimmed);
            }
          });
          
          // Sammle alle Kategorien aus Artikeln (falls bereits Artikel vorhanden)
          const articles = await storageLayer.load<any>('articles');
          if (articles && articles.length > 0) {
            articles.forEach((article: any) => {
              if (article.category && article.category.trim() !== '') {
                const trimmed = article.category.trim();
                // Nur hinzufügen, wenn noch nicht vorhanden (case-insensitive)
                if (!categoriesFromConstants.has(trimmed.toLowerCase())) {
                  categoriesFromConstants.set(trimmed.toLowerCase(), trimmed);
                }
              }
            });
          }
          
          // Erstelle CategoryEntity-Objekte (eindeutig, verwende original case)
          const categoriesToSave: CategoryEntity[] = Array.from(categoriesFromConstants.values()).map(categoryName => ({
            id: generateId(),
            name: categoryName,
            description: undefined,
            isNew: true,
            isDirty: true,
            syncStatus: 'pending' as const,
            updatedAt: new Date()
          }));
          
          // Prüfe nochmal VOR dem Speichern (Race-Condition-Schutz)
          const finalCheck = await storageLayer.load<CategoryEntity>('categories');
          if (finalCheck && finalCheck.length > 0) {
            console.log(`ℹ️ Kategorien wurden zwischenzeitlich hinzugefügt - überspringe Initialisierung`);
          } else {
            // Speichere Kategorien
            const success = await storageLayer.save('categories', categoriesToSave);
            if (success) {
              console.log(`✅ Kategorien-Tabelle initialisiert mit ${categoriesToSave.length} Kategorien`);
            } else {
              console.error('❌ Fehler beim Speichern der Kategorien');
            }
          }
        } else {
          console.log(`ℹ️ Kategorien-Tabelle bereits vorhanden (${existingCategories.length} Kategorien)`);
          
          // Prüfe ob neue Kategorien aus Artikeln hinzugefügt werden müssen
          const articles = await storageLayer.load<any>('articles');
          if (articles && articles.length > 0) {
            const existingCategoryNames = new Set(existingCategories.map(cat => cat.name.toLowerCase()));
            const newCategories: CategoryEntity[] = [];
            
            articles.forEach((article: any) => {
              if (article.category && article.category.trim() !== '') {
                const categoryName = article.category.trim();
                // Prüfe auf Eindeutigkeit (case-insensitive)
                if (!existingCategoryNames.has(categoryName.toLowerCase())) {
                  existingCategoryNames.add(categoryName.toLowerCase());
                  newCategories.push({
                    id: generateId(),
                    name: categoryName,
                    description: undefined,
                    isNew: true,
                    isDirty: true,
                    syncStatus: 'pending' as const,
                    updatedAt: new Date()
                  });
                }
              }
            });
            
            if (newCategories.length > 0) {
              console.log(`📁 Füge ${newCategories.length} neue Kategorien aus Artikeln hinzu...`);
              const success = await storageLayer.save('categories', newCategories);
              if (success) {
                console.log(`✅ ${newCategories.length} neue Kategorien hinzugefügt`);
              } else {
                console.error('❌ Fehler beim Hinzufügen neuer Kategorien');
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Fehler beim Initialisieren der Kategorien:', error);
      }
      
    setIsInitialized(true);
    console.log('✅ App-Initialisierung abgeschlossen');
    };
    
    initializeApp();
  }, []); // Dependency Array mit State-Variablen

  // Zeige Ladebildschirm während Initialisierung
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Lädt...</span>
          </div>
          <div className="mt-3">
            <h5>App wird initialisiert...</h5>
            <p className="text-muted">Schema-Migration wird durchgeführt</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 