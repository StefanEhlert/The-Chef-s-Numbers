import React, { createContext, useContext, useReducer, ReactNode } from 'react';

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
  
  // Formulare
  showArticleForm: boolean;
  editingArticle: any;
  newArticleName: string; // Neuer State für den Artikelnamen beim Erstellen
  showSupplierForm: boolean;
  editingSupplierId: string | null;
  showRecipeForm: boolean;
  
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
  | { type: 'SET_SELECTED_RECIPES'; payload: string[] };

// Initial State
const initialState: AppState = {
  sidebarOpen: true,
  isMobile: false,
  currentPage: 'dashboard',
  currentDesign: 'warm',
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
  showArticleForm: false,
  editingArticle: null,
  newArticleName: '', // Initialize newArticleName
  showSupplierForm: false,
  editingSupplierId: null,
  showRecipeForm: false,
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