import { v4 as uuidv4 } from 'uuid';
import { Article, Recipe, RecipeIngredient, Unit } from '../types';

// UUID Generator
export const generateId = (): string => uuidv4();

// Datum-Hilfsfunktionen
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Preis-Formatierung
export const formatPrice = (price: number | undefined | null, currency: string = 'EUR'): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(0);
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency
  }).format(Number(price));
};

// Preisberechnungen
export const calculateNetPrice = (grossPrice: number, vatRate: number): number => {
  return grossPrice / (1 + vatRate / 100);
};

export const calculateGrossPrice = (netPrice: number, vatRate: number): number => {
  return netPrice * (1 + vatRate / 100);
};

export const calculatePricePerUnit = (
  bundlePrice: number,
  content: number,
  bundlePriceType: 'brutto' | 'netto',
  vatRate: number = 19
): number => {
  const netPrice = bundlePriceType === 'brutto' 
    ? calculateNetPrice(bundlePrice, vatRate)
    : bundlePrice;
  
  return netPrice / content;
};

// Einheiten-Konvertierung
export const convertUnit = (amount: number, fromUnit: Unit, toUnit: Unit): number => {
  // Basis-Konvertierungen (vereinfacht)
  const conversions: Record<string, number> = {
    'kg-g': 1000,
    'g-kg': 0.001,
    'l-ml': 1000,
    'ml-l': 0.001,
    'kg-l': 1, // Für Wasser
    'l-kg': 1, // Für Wasser
  };

  const key = `${fromUnit}-${toUnit}`;
  return conversions[key] ? amount * conversions[key] : amount;
};

// Rezept-Kalkulation
export const calculateRecipeCosts = (ingredients: RecipeIngredient[]): number => {
  return ingredients.reduce((total, ingredient) => total + ingredient.price, 0);
};

export const calculateSellingPrice = (
  materialCosts: number,
  markupPercentage: number,
  vatRate: number
): number => {
  const netPrice = materialCosts * (markupPercentage / 100);
  return calculateGrossPrice(netPrice, vatRate);
};

export const calculateMarkupFromSellingPrice = (
  materialCosts: number,
  sellingPrice: number,
  vatRate: number
): number => {
  const netSellingPrice = calculateNetPrice(sellingPrice, vatRate);
  return (netSellingPrice / materialCosts) * 100;
};

// Nährwertberechnung
export const calculateTotalNutrition = (ingredients: RecipeIngredient[], articles: Article[]): {
  calories: number;
  kilojoules: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber?: number;
  sugar?: number;
  salt?: number;
} => {
  let total = {
    calories: 0,
    kilojoules: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    salt: 0
  };

  ingredients.forEach(ingredient => {
    if (ingredient.articleId) {
      const article = articles.find(a => a.id === ingredient.articleId);
      if (article) {
        // Berechne Anteil basierend auf Menge
        const ratio = ingredient.amount / 100; // Pro 100g
        total.calories += article.nutritionInfo.calories * ratio;
        total.kilojoules += article.nutritionInfo.kilojoules * ratio;
        total.protein += article.nutritionInfo.protein * ratio;
        total.fat += article.nutritionInfo.fat * ratio;
        total.carbohydrates += article.nutritionInfo.carbohydrates * ratio;
        if (article.nutritionInfo.fiber) total.fiber! += article.nutritionInfo.fiber * ratio;
        if (article.nutritionInfo.sugar) total.sugar! += article.nutritionInfo.sugar * ratio;
        if (article.nutritionInfo.salt) total.salt! += article.nutritionInfo.salt * ratio;
      }
    }
  });

  return {
    calories: Math.round(total.calories),
    kilojoules: Math.round(total.kilojoules * 100) / 100,
    protein: Math.round(total.protein * 10) / 10,
    fat: Math.round(total.fat * 10) / 10,
    carbohydrates: Math.round(total.carbohydrates * 10) / 10,
    fiber: total.fiber ? Math.round(total.fiber * 10) / 10 : undefined,
    sugar: total.sugar ? Math.round(total.sugar * 10) / 10 : undefined,
    salt: total.salt ? Math.round(total.salt * 100) / 100 : undefined
  };
};

// Allergen-Sammlung
export const collectAllergens = (ingredients: RecipeIngredient[], articles: Article[]): string[] => {
  const allergens = new Set<string>();
  
  ingredients.forEach(ingredient => {
    if (ingredient.articleId) {
      const article = articles.find(a => a.id === ingredient.articleId);
      if (article) {
        article.allergens.forEach(allergen => allergens.add(allergen));
      }
    }
  });

  return Array.from(allergens);
};

// Validierung
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{6,}$/;
  return phoneRegex.test(phone);
};

// Suchfunktionen
export const searchFilter = <T>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!query.trim()) return items;
  
  const lowerQuery = query.toLowerCase();
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(lowerQuery);
    })
  );
};

// Sortierfunktionen
export const sortBy = <T>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Export/Import Hilfsfunktionen
export const downloadJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const readFileAsJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Ungültige JSON-Datei'));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsText(file);
  });
}; 