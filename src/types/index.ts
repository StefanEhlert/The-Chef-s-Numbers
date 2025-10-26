// Sync-Status für Hybrid-ID-System
export type SyncStatus = 'synced' | 'pending' | 'error' | 'conflict';

// Basis-Interfaces mit Hybrid-ID-System
export interface BaseEntity {
  // Frontend-ID (bleibt konstant für State-Management)
  id: string;
  
  // DB-ID (nur für Datenbank-Operationen)
  dbId?: string;
  
  // Sync-Informationen
  isDirty?: boolean; // Wurde geändert?
  isNew?: boolean; // Neuer Datensatz?
  syncStatus?: SyncStatus; // Sync-Status
  
  // Zeitstempel (optional - werden von PostgreSQL automatisch gesetzt)
  createdAt?: Date;
  updatedAt?: Date;
  
  // Benutzer-Tracking für spätere Multi-User-Funktionalität
  createdBy?: string; // Benutzer-ID der erstellt hat
  updatedBy?: string; // Benutzer-ID der zuletzt geändert hat
  lastModifiedBy?: string; // Benutzer-ID der zuletzt modifiziert hat
}

// Telefonnummer-Typen (wie in Outlook)
export type PhoneType = 'Mobil' | 'Geschäft' | 'Privat' | 'Fax' | 'Sonstiges';

export interface PhoneNumber {
  id: string;
  type: PhoneType;
  number: string;
}

// Lieferant
export interface Supplier extends BaseEntity {
  name: string;
  contactPerson?: string;
  email?: string;
  website?: string;
  address: {
    street: string;
    zipCode: string;
    city: string;
    country: string;
  };
  phoneNumbers: PhoneNumber[];
  notes?: string;
}

// Artikel-Kategorien
export type ArticleCategory = 
  | 'Gemüse & Obst'
  | 'Fleisch & Fisch'
  | 'Milchprodukte'
  | 'Gewürze & Kräuter'
  | 'Getreide & Mehl'
  | 'Öle & Fette'
  | 'Getränke'
  | 'Trockenware'
  | 'Tiefkühlkost'
  | 'Konserven'
  | 'Sonstiges';

// Einheiten
export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'Stück' | 'Packung' | 'Dose' | 'Glas' | 'Bund' | 'Portion';

// Artikel
export interface Article extends BaseEntity {
  name: string;
  category: ArticleCategory;
  supplierId: string;
  supplierArticleNumber?: string;
  bundleUnit: Unit;
  bundlePrice: number;
  bundleEanCode?: string; // EAN-Code für das Gebinde (z.B. Karton)
  content: number;
  contentUnit: Unit;
  contentEanCode?: string; // EAN-Code für den Inhalt (z.B. Flaschen im Karton)
  pricePerUnit: number;
  vatRate: number; // MwSt-Satz
  allergens: string[];
  additives: string[];
  ingredients?: string;
  nutritionInfo: {
    calories: number; // kcal pro 100g
    kilojoules: number; // kJ pro 100g
    protein: number; // g pro 100g
    fat: number; // g pro 100g
    carbohydrates: number; // g pro 100g
    fiber?: number; // g pro 100g
    sugar?: number; // g pro 100g
    salt?: number; // g pro 100g
    alcohol?: number; // % Alkoholgehalt
  };
  openFoodFactsCode?: string; // Open Food Facts Produkt-Code für Rückverfolgbarkeit
  notes?: string;
}

// Rezept-Schwierigkeit
export type Difficulty = 1 | 2 | 3 | 4 | 5;

// Rezept-Zutat
export interface RecipeIngredient {
  id: string;
  articleId?: string; // Wenn Artikel aus der Datenbank
  recipeId?: string; // Wenn anderes Rezept
  name: string;
  amount: number;
  unit: Unit;
  price: number; // Preis für diese Menge
}

// Verwendetes Rezept (für Rezept-in-Rezept Funktionalität)
export interface UsedRecipe {
  id: string;
  recipeId: string; // ID des verwendeten Rezepts
  name: string; // Name des verwendeten Rezepts
  portions: number; // Anzahl der verwendeten Portionen
  costPerPortion: number; // Kosten pro Portion des verwendeten Rezepts
  totalCost: number; // Gesamtkosten (portions * costPerPortion)
}

// Zubereitungsschritt
export interface PreparationStep {
  id: string;
  order: number;
  description: string;
}

// Rezept
export interface Recipe extends BaseEntity {
  name: string;
  description?: string;
  portions: number;
  preparationTime: number; // in Minuten
  difficulty: Difficulty;
  energy?: number; // Energieverbrauch in kWh
  image?: File; // Rezeptbild (nur für Frontend-Upload)
  ingredients: RecipeIngredient[];
  usedRecipes: UsedRecipe[]; // Verwendete Rezepte
  preparationSteps: PreparationStep[];
  materialCosts: number;
  markupPercentage: number; // Standard: 300%
  vatRate: number; // MwSt-Satz
  sellingPrice: number;
  totalNutritionInfo: {
    calories: number;
    kilojoules: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber?: number;
    sugar?: number;
    salt?: number;
    alcohol?: number; // % Alkoholgehalt
  };
  allergens: string[];
  notes?: string;
}

// Allergene (EU-Standard)
export const ALLERGENS = [
  'Gluten',
  'Krebstiere',
  'Eier',
  'Fische',
  'Erdnüsse',
  'Sojabohnen',
  'Milch',
  'Schalenfrüchte',
  'Sellerie',
  'Senf',
  'Sesamsamen',
  'Schwefeldioxid und Sulfite',
  'Lupinen',
  'Weichtiere'
] as const;

export type Allergen = typeof ALLERGENS[number];

// Zusatzstoffe (häufige)
export const COMMON_ADDITIVES = [
  'Zucker',
  'Salz',
  'Pfeffer',
  'Olivenöl',
  'Butter',
  'Mehl',
  'Eier',
  'Milch',
  'Sahne',
  'Käse',
  'Tomaten',
  'Zwiebeln',
  'Knoblauch',
  'Kräuter',
  'Gewürze',
  'Essig',
  'Zitrone',
  'Wein',
  'Brot',
  'Nudeln',
  'Reis',
  'Kartoffeln',
  'Karotten',
  'Pilze',
  'Fleisch',
  'Fisch',
  'Garnelen',
  'Muscheln'
] as const;

export type CommonAdditive = typeof COMMON_ADDITIVES[number];

// App-Einstellungen
export interface AppSettings {
  defaultMarkupPercentage: number;
  defaultVatRate: number;
  currency: string;
  language: string;
}

// Datenbank-Schema
export interface DatabaseSchema {
  suppliers: Supplier[];
  articles: Article[];
  recipes: Recipe[];
  settings: AppSettings;
}

// Storage-Konfiguration (neu)
export * from './storage'; 