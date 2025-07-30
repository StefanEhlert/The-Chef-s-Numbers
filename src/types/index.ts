// Basis-Interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
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
  bundlePriceType: 'brutto' | 'netto';
  content: number;
  contentUnit: Unit;
  pricePerUnit: number;
  allergens: string[];
  ingredients: string[];
  nutritionInfo: {
    calories: number; // kcal pro 100g
    kilojoules: number; // kJ pro 100g
    protein: number; // g pro 100g
    fat: number; // g pro 100g
    carbohydrates: number; // g pro 100g
    fiber?: number; // g pro 100g
    sugar?: number; // g pro 100g
    salt?: number; // g pro 100g
  };
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

// Inhaltsstoffe (häufige)
export const COMMON_INGREDIENTS = [
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

export type CommonIngredient = typeof COMMON_INGREDIENTS[number];

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