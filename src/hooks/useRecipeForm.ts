import { useState, useEffect } from 'react';
import { Recipe, UsedRecipe } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { UUIDUtils } from '../utils/uuidUtils';

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
  totalNutritionInfo?: {
    calories: number;
    kilojoules: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber?: number;
    sugar?: number;
    salt?: number;
    alcohol?: number;
  };
  alcohol?: number; // % Alkoholgehalt (als eigenständiges Feld)
  ingredientsText?: string; // Manuell editierte Inhaltsstoffe (überschreibt automatisch berechnete)
}

interface UseRecipeFormProps {
  articles: any[];
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  setShowArticleForm: (show: boolean) => void;
  setEditingArticle: (article: any) => void;
  formatPrice: (price: number | undefined | null) => string;
}

export const useRecipeForm = ({
  articles,
  recipes,
  setRecipes,
  setShowArticleForm,
  setEditingArticle,
  formatPrice
}: UseRecipeFormProps) => {
  const { dispatch, state } = useAppContext();
  
  // State für Rezept-Formular
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [recipeForm, setRecipeForm] = useState<RecipeForm>({
    name: '',
    description: '',
    image: null,
    portions: 4,
    preparationTime: 30,
    difficulty: 3,
    energy: 0,
    materialCosts: 0,
    markupPercentage: 300,
    vatRate: 19,
    sellingPrice: 0,
    ingredients: [{ id: UUIDUtils.generateId(), name: '', amount: 0, unit: 'g', price: 0 }],
    usedRecipes: [],
    preparationSteps: [{ id: UUIDUtils.generateId(), order: 1, description: '' }]
  });

  // Nach dem useState für recipeForm:
  const [sellingPriceInput, setSellingPriceInput] = useState((recipeForm.sellingPrice || 0).toFixed(2));
  const [activeTab, setActiveTab] = useState<'kalkulation' | 'inhaltsangaben' | 'naehrwerte'>('kalkulation');

  // State für Zutat-Autovervollständigung
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(-1);
  const [dropdownSelectionIndex, setDropdownSelectionIndex] = useState(-1);

  // Synchronisiere mit dem globalen editingRecipe State
  useEffect(() => {
    if (state.editingRecipe) {
      setEditingRecipe(state.editingRecipe);
    }
  }, [state.editingRecipe]);

  // Synchronisiere das editingRecipe State mit dem Formular
  useEffect(() => {
    if (editingRecipe) {
      console.log('🔄 Synchronisiere editingRecipe mit Formular:', editingRecipe);
      const loadedAlcohol = editingRecipe.alcohol || editingRecipe.totalNutritionInfo?.alcohol;
      console.log('🍷 [useEffect editingRecipe] Alkoholwert beim Laden:', {
        'editingRecipe.alcohol': editingRecipe.alcohol,
        'editingRecipe.totalNutritionInfo?.alcohol': editingRecipe.totalNutritionInfo?.alcohol,
        'loaded alcohol': loadedAlcohol,
        'editingRecipe': editingRecipe
      });
      setRecipeForm({
        name: editingRecipe.name || '',
        description: editingRecipe.description || '',
        image: null,
        portions: editingRecipe.portions || 4,
        preparationTime: editingRecipe.preparationTime || 30,
        difficulty: editingRecipe.difficulty || 3,
        energy: editingRecipe.energy || 0,
        materialCosts: editingRecipe.materialCosts || 0,
        markupPercentage: editingRecipe.markupPercentage || 300,
        vatRate: editingRecipe.vatRate || 19,
        sellingPrice: editingRecipe.sellingPrice || 0,
        ingredients: editingRecipe.ingredients && editingRecipe.ingredients.length > 0 
          ? [...editingRecipe.ingredients, { id: UUIDUtils.generateId(), name: '', amount: 0, unit: 'g', price: 0 }] 
          : [{ id: UUIDUtils.generateId(), name: '', amount: 0, unit: 'g', price: 0 }],
        usedRecipes: editingRecipe.usedRecipes || [],
        preparationSteps: editingRecipe.preparationSteps && editingRecipe.preparationSteps.length > 0 
          ? editingRecipe.preparationSteps 
          : [{ id: UUIDUtils.generateId(), order: 1, description: '' }],
        totalNutritionInfo: editingRecipe.totalNutritionInfo ? {
          calories: editingRecipe.totalNutritionInfo.calories || 0,
          kilojoules: editingRecipe.totalNutritionInfo.kilojoules || 0,
          protein: editingRecipe.totalNutritionInfo.protein || 0,
          fat: editingRecipe.totalNutritionInfo.fat || 0,
          carbohydrates: editingRecipe.totalNutritionInfo.carbohydrates || 0,
          fiber: editingRecipe.totalNutritionInfo.fiber || 0,
          sugar: editingRecipe.totalNutritionInfo.sugar || 0,
          salt: editingRecipe.totalNutritionInfo.salt || 0,
          alcohol: editingRecipe.totalNutritionInfo.alcohol
        } : undefined,
        alcohol: loadedAlcohol,
        ingredientsText: editingRecipe.ingredientsText
      });
      setSellingPriceInput((editingRecipe.sellingPrice || 0).toFixed(2));
    }
  }, [editingRecipe]);

  // Automatisch Alkoholwert aus Zutaten berechnen, wenn sich Zutaten oder verwendete Rezepte ändern
  // WICHTIG: Berechne IMMER neu, wenn sich Zutaten ändern, auch wenn bereits ein Wert existiert
  // Der manuelle Wert wird nur durch onChange im Input-Feld gesetzt
  useEffect(() => {
    console.log('🍷 [useEffect auto-calculate] Triggered:', {
      'ingredients count': recipeForm.ingredients.length,
      'ingredients': recipeForm.ingredients.map(i => ({ name: i.name, amount: i.amount, unit: i.unit })),
      'current alcohol': recipeForm.alcohol,
      'current totalNutritionInfo?.alcohol': recipeForm.totalNutritionInfo?.alcohol
    });
    
    if (recipeForm.ingredients.length > 0) {
      console.log('🍷 [useEffect auto-calculate] Starte Berechnung...');
      const calculatedNutrition = calculateRecipeNutrition();
      const calculatedAlcohol = calculatedNutrition.alcohol;
      
      console.log('🍷 [useEffect auto-calculate alcohol] Automatische Alkoholberechnung:', {
        'recipeForm.alcohol (vorher)': recipeForm.alcohol,
        'calculatedAlcohol': calculatedAlcohol,
        'calculatedNutrition': calculatedNutrition,
        'ingredients': recipeForm.ingredients.map(i => ({ 
          name: i.name, 
          amount: i.amount, 
          unit: i.unit,
          article: articles.find(a => a.name === i.name) ? {
            name: articles.find(a => a.name === i.name)?.name,
            alcohol: articles.find(a => a.name === i.name)?.alcohol,
            nutritionInfo_alcohol: articles.find(a => a.name === i.name)?.nutritionInfo?.alcohol
          } : null
        })),
        'usedRecipes': recipeForm.usedRecipes
      });
      
      // Aktualisiere IMMER mit dem berechneten Wert, wenn vorhanden
      if (calculatedAlcohol !== undefined) {
        // Prüfe ob sich der Wert wirklich unterscheidet (mit Toleranz für Rundungsfehler)
        const tolerance = 0.01; // 0.01% Toleranz
        const difference = Math.abs((calculatedAlcohol || 0) - (recipeForm.alcohol || 0));
        
        if (difference > tolerance) {
          console.log('🍷 [useEffect auto-calculate] Aktualisiere recipeForm.alcohol von', recipeForm.alcohol, 'zu', calculatedAlcohol, '(Differenz:', difference, ')');
          setRecipeForm(prev => ({
            ...prev,
            alcohol: calculatedAlcohol,
            totalNutritionInfo: {
              ...prev.totalNutritionInfo || {
                calories: 0,
                kilojoules: 0,
                protein: 0,
                fat: 0,
                carbohydrates: 0,
                fiber: 0,
                sugar: 0,
                salt: 0
              },
              alcohol: calculatedAlcohol
            }
          }));
        } else {
          console.log('🍷 [useEffect auto-calculate] Keine Aktualisierung nötig - Werte sind identisch (Differenz:', difference, '<= Toleranz)');
        }
      } else {
        console.log('🍷 [useEffect auto-calculate] KEIN berechneter Alkoholwert gefunden');
      }
    } else {
      console.log('🍷 [useEffect auto-calculate] Überspringe Berechnung - keine Zutaten vorhanden');
    }
  }, [recipeForm.ingredients, recipeForm.usedRecipes, recipeForm.portions, articles, recipes]);

  // Preisumrechnung Hilfsfunktionen
  const calculateGrossPrice = (netPrice: number, vatRate: number) => {
    return netPrice * (1 + vatRate / 100);
  };

  const calculateNetPrice = (grossPrice: number, vatRate: number) => {
    return grossPrice / (1 + vatRate / 100);
  };

  // Hilfsfunktion für Kalorien-zu-kJoule Umrechnung
  const calculateKilojoules = (calories: number) => {
    return Math.round(calories * 4.184 * 100) / 100; // Auf 2 Nachkommastellen gerundet
  };

  const resetRecipeForm = (resetEditingRecipe: boolean = true) => {
    if (resetEditingRecipe) {
      setEditingRecipe(null);
      dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
    }
    setRecipeForm({
      name: '',
      description: '',
      image: null,
      portions: 4,
      preparationTime: 30,
      difficulty: 3,
      energy: 0,
      materialCosts: 0,
      markupPercentage: 300,
      vatRate: 19,
      sellingPrice: 0,
      ingredients: [{ id: UUIDUtils.generateId(), name: '', amount: 0, unit: 'g', price: 0 }],
      usedRecipes: [],
      preparationSteps: [{ id: UUIDUtils.generateId(), order: 1, description: '' }],
      totalNutritionInfo: {
        calories: 0,
        kilojoules: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        salt: 0,
        alcohol: undefined
      },
      alcohol: undefined,
      ingredientsText: undefined
    } as RecipeForm);
  };

  const setRecipeForEditing = (recipe: any) => {
    console.log('🔍 setRecipeForEditing called with:', recipe);
    setEditingRecipe(recipe);
    dispatch({ type: 'SET_EDITING_RECIPE', payload: recipe });
  };

  const calculateMaterialCosts = () => {
    const ingredientCosts = recipeForm.ingredients.reduce((sum, ingredient) => {
      return sum + calculateIngredientPrice(ingredient);
    }, 0);
    const usedRecipeCosts = recipeForm.usedRecipes.reduce((sum, usedRecipe) => sum + usedRecipe.totalCost, 0);
    return ingredientCosts + usedRecipeCosts;
  };

  const handleMarkupChange = (newMarkup: number) => {
    // Bei Aufschlag-Änderung wird der Verkaufspreis neu berechnet
    const materialCosts = calculateMaterialCosts();
    const costsPerPortion = materialCosts / recipeForm.portions;
    const netPrice = costsPerPortion * (newMarkup / 100);
    const newSellingPrice = calculateGrossPrice(netPrice, recipeForm.vatRate);
    
    const roundedSellingPrice = Math.round(newSellingPrice * 100) / 100;
    
    setRecipeForm(prev => ({
      ...prev,
      markupPercentage: newMarkup,
      sellingPrice: roundedSellingPrice
    }));
    
    // Aktualisiere auch sellingPriceInput sofort
    setSellingPriceInput((roundedSellingPrice || 0).toFixed(2));
  };

  const handleSellingPriceChange = (newSellingPrice: number) => {
    // Bei Verkaufspreis-Änderung wird der Aufschlag neu berechnet
    setRecipeForm(prev => ({
      ...prev,
      sellingPrice: newSellingPrice
    }));
    
    // Aufschlag wird automatisch durch calculateAllValues() berechnet
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const calculateGrossProfit = () => {
    const costsPerPortion = calculateMaterialCosts() / recipeForm.portions;
    const vatAmount = recipeForm.sellingPrice - calculateNetPrice(recipeForm.sellingPrice, recipeForm.vatRate);
    return recipeForm.sellingPrice - costsPerPortion - vatAmount;
  };

  // Zentrale Berechnungsroutine für alle Kalkulationswerte
  // Verkaufspreis ist die Basis, Aufschlag wird nur daraus berechnet
  const calculateAllValues = () => {
    const materialCosts = calculateMaterialCosts();
    const costsPerPortion = materialCosts / recipeForm.portions;
    const netSellingPrice = calculateNetPrice(recipeForm.sellingPrice, recipeForm.vatRate);
    const vatAmount = recipeForm.sellingPrice - netSellingPrice;
    const grossProfit = recipeForm.sellingPrice - costsPerPortion - vatAmount;
    
    // Aufschlag wird aus Verkaufspreis berechnet: (Nettopreis / Kosten/Portion) * 100
    const markup = costsPerPortion > 0 ? Math.round((netSellingPrice / costsPerPortion) * 100) : 0;

    return {
      materialCosts,
      costsPerPortion,
      netSellingPrice,
      vatAmount,
      grossProfit,
      markup,
      sellingPrice: Math.round(recipeForm.sellingPrice * 100) / 100 // Auf 2 Stellen runden
    };
  };

  // Hilfsfunktionen für Zusatzstoffe und Allergene
  const getRecipeAdditives = () => {
    const additives = new Set<string>();
    
    // Zusatzstoffe von Zutaten
    recipeForm.ingredients.forEach(ingredient => {
      if (ingredient.name && ingredient.name.trim() !== '') {
        const article = articles.find(a => a.name === ingredient.name);
        if (article && article.additives) {
          article.additives.forEach((ing: string) => additives.add(ing));
        }
      }
    });

    // Zusatzstoffe von verwendeten Rezepten
    recipeForm.usedRecipes.forEach(usedRecipe => {
      const recipe = recipes.find(r => r.id === usedRecipe.recipeId);
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach((ingredient: any) => {
          if (ingredient.name && ingredient.name.trim() !== '') {
            const article = articles.find(a => a.name === ingredient.name);
            if (article && article.additives) {
              article.additives.forEach((ing: string) => additives.add(ing));
            }
          }
        });
      }
    });
    
    return Array.from(additives).sort();
  };

  const getRecipeAllergens = () => {
    const allergens = new Set<string>();
    
    // Allergene von Zutaten
    recipeForm.ingredients.forEach(ingredient => {
      if (ingredient.name && ingredient.name.trim() !== '') {
        const article = articles.find(a => a.name === ingredient.name);
        if (article && article.allergens) {
          article.allergens.forEach((allergen: string) => allergens.add(allergen));
        }
      }
    });

    // Allergene von verwendeten Rezepten
    recipeForm.usedRecipes.forEach(usedRecipe => {
      const recipe = recipes.find(r => r.id === usedRecipe.recipeId);
      if (recipe && recipe.allergens) {
        recipe.allergens.forEach((allergen: any) => allergens.add(allergen));
      }
    });
    
    return Array.from(allergens).sort();
  };

  // Hilfsfunktionen für Nährwerte
  const calculateRecipeNutrition = () => {
    let totalNutrition = {
      calories: 0,
      kilojoules: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      salt: 0,
      alcohol: 0, // Alkoholgehalt in %
      totalWeight: 0 // Gesamtgewicht für Alkoholberechnung
    };

    // Hilfsfunktion zur Einheitenumrechnung
    const convertToGrams = (amount: number, unit: string): number | null => {
      const normalizedUnit = unit.toLowerCase().trim();
      
      switch (normalizedUnit) {
        case 'g':
        case 'gramm':
        case 'gram':
          return amount;
        case 'kg':
        case 'kilo':
        case 'kilogramm':
        case 'kilogram':
          return amount * 1000;
        case 'ml':
        case 'milliliter':
          return amount; // 1ml ≈ 1g für die meisten Flüssigkeiten
        case 'cl':
        case 'centiliter':
          return amount * 10; // 1cl = 10ml = 10g (für Flüssigkeiten)
        case 'l':
        case 'liter':
          return amount * 1000; // 1l = 1000ml ≈ 1000g
        default:
          // Nicht unterstützte Einheiten ignorieren
          return null;
      }
    };

    console.log('🍷 [calculateRecipeNutrition] Starte Berechnung mit:', {
      'ingredients count': recipeForm.ingredients.length,
      'ingredients': recipeForm.ingredients.map(i => ({ name: i.name, amount: i.amount, unit: i.unit })),
      'articles available': articles.length
    });
    
    // Nährwerte von Zutaten
    recipeForm.ingredients.forEach((ingredient, index) => {
      console.log(`🍷 [calculateRecipeNutrition] Verarbeite Zutat ${index + 1}:`, {
        'name': ingredient.name,
        'amount': ingredient.amount,
        'unit': ingredient.unit
      });
      
      if (ingredient.name && ingredient.name.trim() !== '' && ingredient.amount > 0) {
        const article = articles.find(a => a.name === ingredient.name);
        console.log(`🍷 [calculateRecipeNutrition] Gefundener Artikel für "${ingredient.name}":`, {
          'article found': !!article,
          'article.alcohol': article?.alcohol,
          'article.nutritionInfo?.alcohol': article?.nutritionInfo?.alcohol,
          'article.nutritionInfo exists': !!article?.nutritionInfo
        });
        
        if (article && article.nutritionInfo) {
          // Konvertiere die Menge in Gramm
          const amountInGrams = convertToGrams(ingredient.amount, ingredient.unit);
          
          if (amountInGrams !== null) {
            // Berechne Anteil basierend auf Menge (pro 100g)
            const ratio = amountInGrams / 100;
            totalNutrition.calories += (article.nutritionInfo.calories || 0) * ratio;
            totalNutrition.kilojoules += (article.nutritionInfo.kilojoules || 0) * ratio;
            totalNutrition.protein += (article.nutritionInfo.protein || 0) * ratio;
            totalNutrition.fat += (article.nutritionInfo.fat || 0) * ratio;
            totalNutrition.carbohydrates += (article.nutritionInfo.carbohydrates || 0) * ratio;
            totalNutrition.fiber += (article.nutritionInfo.fiber || 0) * ratio;
            totalNutrition.sugar += (article.nutritionInfo.sugar || 0) * ratio;
            totalNutrition.salt += (article.nutritionInfo.salt || 0) * ratio;
            
            // Berechne das Volumen dieser Zutat in Milliliter
            // WICHTIG: Wir müssen das Gesamtvolumen ALLER Zutaten berechnen, nicht nur der alkoholhaltigen!
            let amountInMl = amountInGrams; // Standard: Gramm ≈ ml für Flüssigkeiten
            
            const normalizedUnit = ingredient.unit.toLowerCase().trim();
            if (normalizedUnit === 'l' || normalizedUnit === 'liter') {
              amountInMl = amountInGrams; // Bereits in ml umgerechnet (amount * 1000)
            } else if (normalizedUnit === 'ml' || normalizedUnit === 'milliliter') {
              amountInMl = amountInGrams; // Bereits in ml (gleich Gramm)
            } else if (normalizedUnit === 'cl') {
              // Centiliter: 1 cl = 10 ml
              amountInMl = ingredient.amount * 10;
            }
            
            // WICHTIG: Addiere das Gesamtvolumen IMMER, nicht nur bei Alkohol!
            // Das Gesamtvolumen wird für die finale Berechnung benötigt
            totalNutrition.totalWeight += amountInMl; // Gesamtvolumen in ml (ALLER Zutaten)
            
            // Alkohol: Berechne absolute Alkoholmenge (Volumen * Alkoholgehalt in %)
            const articleAlcoholPercent = article.alcohol || article.nutritionInfo.alcohol || 0;
            
            if (articleAlcoholPercent > 0) {
              // Berechne absolute Alkoholmenge in ml
              // Alkoholgehalt % bedeutet: X ml Alkohol pro 100 ml Flüssigkeit
              const absoluteAlcoholMl = (amountInMl * articleAlcoholPercent) / 100;
              
              // Addiere zur Gesamt-Alkoholmenge
              totalNutrition.alcohol += absoluteAlcoholMl; // Absoluter Alkohol in ml
              
              console.log('🍷 [calculateRecipeNutrition] Alkohol von Zutat berechnet:', {
                'ingredient.name': ingredient.name,
                'ingredient.amount': ingredient.amount,
                'ingredient.unit': ingredient.unit,
                'amountInGrams': amountInGrams,
                'amountInMl': amountInMl,
                'article.alcohol': article.alcohol,
                'article.nutritionInfo.alcohol': article.nutritionInfo.alcohol,
                'articleAlcoholPercent': articleAlcoholPercent,
                'absoluteAlcoholMl': absoluteAlcoholMl,
                'totalNutrition.alcohol (absolut in ml)': totalNutrition.alcohol,
                'totalNutrition.totalWeight (gesamt in ml)': totalNutrition.totalWeight
              });
            } else {
              // Kein Alkohol in dieser Zutat, aber Volumen trotzdem hinzufügen!
              console.log('🍷 [calculateRecipeNutrition] Zutat ohne Alkohol, aber Volumen hinzugefügt:', {
                'ingredient.name': ingredient.name,
                'amountInMl': amountInMl,
                'totalNutrition.totalWeight (gesamt in ml)': totalNutrition.totalWeight
              });
            }
          }
        }
      }
    });

    // Nährwerte von verwendeten Rezepten
    recipeForm.usedRecipes.forEach(usedRecipe => {
      const recipe = recipes.find(r => r.id === usedRecipe.recipeId);
      if (recipe && recipe.totalNutritionInfo) {
        // Berechne Anteil basierend auf verwendeten Portionen
        const ratio = usedRecipe.portions / recipe.portions;
        totalNutrition.calories += (recipe.totalNutritionInfo.calories || 0) * ratio;
        totalNutrition.kilojoules += (recipe.totalNutritionInfo.kilojoules || 0) * ratio;
        totalNutrition.protein += (recipe.totalNutritionInfo.protein || 0) * ratio;
        totalNutrition.fat += (recipe.totalNutritionInfo.fat || 0) * ratio;
        totalNutrition.carbohydrates += (recipe.totalNutritionInfo.carbohydrates || 0) * ratio;
        totalNutrition.fiber += (recipe.totalNutritionInfo.fiber || 0) * ratio;
        totalNutrition.sugar += (recipe.totalNutritionInfo.sugar || 0) * ratio;
        totalNutrition.salt += (recipe.totalNutritionInfo.salt || 0) * ratio;
        
        // Berechne das Volumen des verwendeten Rezepts
        // Versuche, das tatsächliche Volumen aus den Zutaten des Rezepts zu berechnen
        let recipeTotalVolume = 0;
        
        // Berechne Gesamtvolumen aus den Zutaten des verwendeten Rezepts
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          recipe.ingredients.forEach((recipeIngredient: any) => {
            if (recipeIngredient.name && recipeIngredient.amount > 0) {
              const article = articles.find(a => a.name === recipeIngredient.name);
              if (article) {
                const ingredientAmountInGrams = convertToGrams(recipeIngredient.amount, recipeIngredient.unit);
                if (ingredientAmountInGrams !== null) {
                  let ingredientVolumeInMl = ingredientAmountInGrams;
                  const normalizedUnit = recipeIngredient.unit.toLowerCase().trim();
                  if (normalizedUnit === 'l' || normalizedUnit === 'liter') {
                    ingredientVolumeInMl = ingredientAmountInGrams; // Bereits in ml
                  } else if (normalizedUnit === 'ml' || normalizedUnit === 'milliliter') {
                    ingredientVolumeInMl = ingredientAmountInGrams;
                  } else if (normalizedUnit === 'cl') {
                    ingredientVolumeInMl = recipeIngredient.amount * 10;
                  }
                  recipeTotalVolume += ingredientVolumeInMl;
                }
              }
            }
          });
        }
        
        // Falls keine Zutaten vorhanden oder Volumen = 0, verwende Schätzung
        if (recipeTotalVolume === 0) {
          // Schätze das Volumen des verwendeten Rezepts basierend auf Portionen
          // Annahme: 1 Portion ≈ 100 ml (Standard-Näherung)
          const estimatedVolumePerPortion = 100; // ml
          recipeTotalVolume = estimatedVolumePerPortion * recipe.portions;
          console.log('🍷 [calculateRecipeNutrition] Verwendetes Rezept - Schätzung verwendet:', {
            'recipe.name': recipe.name,
            'recipe.portions': recipe.portions,
            'estimatedVolumePerPortion': estimatedVolumePerPortion,
            'recipeTotalVolume (geschätzt)': recipeTotalVolume
          });
        } else {
          console.log('🍷 [calculateRecipeNutrition] Verwendetes Rezept - Volumen aus Zutaten berechnet:', {
            'recipe.name': recipe.name,
            'recipeTotalVolume (berechnet)': recipeTotalVolume,
            'recipe.ingredients count': recipe.ingredients.length
          });
        }
        
        // Berechne das Volumen der verwendeten Portionen
        const usedVolume = (recipeTotalVolume * ratio); // Volumen des verwendeten Teils des Rezepts
        
        // WICHTIG: Gesamtvolumen IMMER hinzufügen (auch ohne Alkohol)
        totalNutrition.totalWeight += usedVolume;
        
        // Alkohol: Berechne absolute Alkoholmenge aus dem verwendeten Rezept
        const recipeAlcoholPercent = recipe.alcohol || recipe.totalNutritionInfo.alcohol || 0;
        if (recipeAlcoholPercent > 0) {
          // Berechne absolute Alkoholmenge aus dem verwendeten Rezept
          const absoluteAlcoholFromRecipe = (usedVolume * recipeAlcoholPercent) / 100;
          totalNutrition.alcohol += absoluteAlcoholFromRecipe;
          
          console.log('🍷 [calculateRecipeNutrition] Alkohol von verwendetem Rezept berechnet:', {
            'recipe.name': recipe.name,
            'recipe.alcohol': recipe.alcohol,
            'recipe.totalNutritionInfo.alcohol': recipe.totalNutritionInfo.alcohol,
            'recipeAlcoholPercent': recipeAlcoholPercent,
            'recipeTotalVolume': recipeTotalVolume,
            'ratio': ratio,
            'usedVolume': usedVolume,
            'absoluteAlcoholFromRecipe': absoluteAlcoholFromRecipe,
            'totalNutrition.alcohol (absolut in ml)': totalNutrition.alcohol,
            'totalNutrition.totalWeight (gesamt in ml)': totalNutrition.totalWeight
          });
        } else {
          console.log('🍷 [calculateRecipeNutrition] Verwendetes Rezept ohne Alkohol, aber Volumen hinzugefügt:', {
            'recipe.name': recipe.name,
            'recipeTotalVolume': recipeTotalVolume,
            'usedVolume': usedVolume,
            'totalNutrition.totalWeight (gesamt in ml)': totalNutrition.totalWeight
          });
        }
      }
    });

    // Berechne Nährwerte pro Portion
    const portions = recipeForm.portions || 1;
    const nutritionPerPortion = {
      calories: totalNutrition.calories / portions,
      kilojoules: totalNutrition.kilojoules / portions,
      protein: totalNutrition.protein / portions,
      fat: totalNutrition.fat / portions,
      carbohydrates: totalNutrition.carbohydrates / portions,
      fiber: totalNutrition.fiber / portions,
      sugar: totalNutrition.sugar / portions,
      salt: totalNutrition.salt / portions
    };

    // Berechne Alkoholgehalt in % (absoluter Alkohol / Gesamtvolumen * 100)
    let calculatedAlcohol: number | undefined = undefined;
    if (totalNutrition.totalWeight > 0) {
      if (totalNutrition.alcohol > 0) {
        // Alkoholgehalt = (absolute Alkoholmenge in ml / Gesamtvolumen in ml) * 100
        calculatedAlcohol = (totalNutrition.alcohol / totalNutrition.totalWeight) * 100;
        calculatedAlcohol = Math.round(calculatedAlcohol * 100) / 100; // Auf 2 Nachkommastellen runden
      } else {
        // Kein Alkohol vorhanden
        calculatedAlcohol = 0;
      }
    }
    
    // Verwende IMMER den berechneten Wert, wenn vorhanden
    // Nur wenn kein berechneter Wert existiert, verwende den vorhandenen Wert
    const alcoholValue = calculatedAlcohol !== undefined ? calculatedAlcohol : (recipeForm.alcohol || recipeForm.totalNutritionInfo?.alcohol);
    
    console.log('🍷 [calculateRecipeNutrition] Finale Alkoholberechnung:', {
      'totalNutrition.alcohol (absolut in ml)': totalNutrition.alcohol,
      'totalNutrition.totalWeight (gesamt in ml)': totalNutrition.totalWeight,
      'calculatedAlcohol (%)': calculatedAlcohol,
      'recipeForm.alcohol': recipeForm.alcohol,
      'recipeForm.totalNutritionInfo?.alcohol': recipeForm.totalNutritionInfo?.alcohol,
      'final alcoholValue (%)': alcoholValue
    });
    
    return {
      calories: Math.round(nutritionPerPortion.calories),
      kilojoules: Math.round(nutritionPerPortion.kilojoules * 10) / 10,
      protein: Math.round(nutritionPerPortion.protein * 10) / 10,
      fat: Math.round(nutritionPerPortion.fat * 10) / 10,
      carbohydrates: Math.round(nutritionPerPortion.carbohydrates * 10) / 10,
      fiber: Math.round(nutritionPerPortion.fiber * 10) / 10,
      sugar: Math.round(nutritionPerPortion.sugar * 10) / 10,
      salt: Math.round(nutritionPerPortion.salt * 100) / 100,
      alcohol: alcoholValue
    };
  };

  const getFilteredIngredients = () => {
    const results: any[] = [];
    
    // Artikel hinzufügen
    const filteredArticles = ingredientSearchTerm 
      ? articles.filter(article => article.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()))
      : articles.slice(0, 5);
    
    results.push(...filteredArticles.map(article => ({ ...article, type: 'article' })));
    
    // Rezepte hinzufügen (außer dem aktuell bearbeiteten)
    const currentRecipeId = editingRecipe?.id;
    const filteredRecipes = ingredientSearchTerm 
      ? recipes.filter((recipe: any) => 
          recipe.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) && 
          recipe.id !== currentRecipeId
        )
      : recipes.filter((recipe: any) => recipe.id !== currentRecipeId).slice(0, 5);
    
    results.push(...filteredRecipes.map((recipe: any) => ({ 
      ...recipe, 
      type: 'recipe',
      displayName: `Rezept: ${recipe.name}` // Kennzeichnung als Rezept
    })));
    
    return results.slice(0, 10);
  };

  const handleIngredientSelect = (item: any, ingredientIndex: number) => {
    if (item.type === 'recipe') {
      // Wenn ein Rezept ausgewählt wurde, füge es zu usedRecipes hinzu
      const costPerPortion = item.materialCosts / item.portions;
      const newUsedRecipe = {
        id: UUIDUtils.generateId(),
        recipeId: item.id,
        name: item.name,
        portions: 1, // Standard: 1 Portion
        costPerPortion: costPerPortion,
        totalCost: costPerPortion
      };
      
      setRecipeForm(prev => ({
        ...prev,
        usedRecipes: [...prev.usedRecipes, newUsedRecipe]
      }));

      // Das Eingabefeld leeren, da das Rezept zu usedRecipes hinzugefügt wurde
      setRecipeForm(prev => ({
        ...prev,
        ingredients: prev.ingredients.map((ing, i) => 
          i === ingredientIndex ? { ...ing, name: '' } : ing
        )
      }));

      // Keine neue Zeile hinzufügen, da die aktuelle Zeile bereits leer ist
    } else {
      // Wenn ein Artikel ausgewählt wurde, behalte das alte Verhalten bei
      setRecipeForm(prev => {
        const updatedIngredients = prev.ingredients.map((ing, i) => 
          i === ingredientIndex ? { 
            ...ing, 
            name: item.name,
            unit: item.contentUnit || ing.unit,
            price: item.pricePerUnit || ing.price
          } : ing
        );
        
        // Prüfen, ob eine neue leere Zeile hinzugefügt werden soll
        // Neue Zeile hinzufügen, wenn:
        // 1. Die ausgewählte Zutat die letzte in der Liste ist ODER
        // 2. Die ausgewählte Zutat die letzte ist und das letzte Feld leer war
        const shouldAddNewLine = ingredientIndex === prev.ingredients.length - 1;
        
        if (shouldAddNewLine) {
          updatedIngredients.push({ 
            id: UUIDUtils.generateId(), 
            name: '', 
            amount: 0, 
            unit: 'g', 
            price: 0 
          });
        }
        
        return {
          ...prev,
          ingredients: updatedIngredients
        };
      });
    }
    
    setIngredientSearchTerm('');
    setShowIngredientDropdown(false);
    setSelectedIngredientIndex(-1);
    setDropdownSelectionIndex(-1);
    
    // Neuberechnung basierend auf aktuellem Verkaufspreis
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const calculateIngredientPrice = (ingredient: any) => {
    const article = articles.find(a => a.name === ingredient.name);
    if (article && ingredient.amount > 0) {
      return article.pricePerUnit * ingredient.amount;
    }
    return ingredient.price || 0;
  };

  const handleIngredientInputChange = (value: string, ingredientIndex: number) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === ingredientIndex ? { ...ing, name: value } : ing
      )
    }));
    
    setIngredientSearchTerm(value);
    setShowIngredientDropdown(true);
    setSelectedIngredientIndex(ingredientIndex);
    setDropdownSelectionIndex(-1);
  };

  const handleIngredientInputBlur = () => {
    // Verzögerung erhöhen und prüfen, ob das Dropdown noch relevant ist
    setTimeout(() => {
      // Nur schließen, wenn kein Fokus mehr auf dem Input oder Dropdown ist
      const activeElement = document.activeElement;
      const isDropdownActive = activeElement && (
        activeElement.closest('.dropdown-item') || 
        activeElement.closest('[data-ingredient-index]')
      );
      
      if (!isDropdownActive) {
        setShowIngredientDropdown(false);
        setSelectedIngredientIndex(-1);
        setDropdownSelectionIndex(-1);
      }
    }, 200);
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent, ingredientIndex: number) => {
    const filteredIngredients = getFilteredIngredients();
    const hasNewArticleOption = ingredientSearchTerm && !articles.some(a => a.name === ingredientSearchTerm);
    const totalOptions = filteredIngredients.length + (hasNewArticleOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setDropdownSelectionIndex(prev => {
          if (prev < totalOptions - 1) return prev + 1;
          return 0;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setDropdownSelectionIndex(prev => {
          if (prev > 0) return prev - 1;
          return totalOptions - 1;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (dropdownSelectionIndex >= 0 && dropdownSelectionIndex < filteredIngredients.length) {
          handleIngredientSelect(filteredIngredients[dropdownSelectionIndex], ingredientIndex);
        } else if (dropdownSelectionIndex === filteredIngredients.length && hasNewArticleOption) {
          handleCreateNewArticle(ingredientSearchTerm, ingredientIndex);
        } else if (ingredientSearchTerm) {
          handleCreateNewArticle(ingredientSearchTerm, ingredientIndex);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowIngredientDropdown(false);
        setDropdownSelectionIndex(-1);
        break;
      
      case 'Tab':
        setShowIngredientDropdown(false);
        setDropdownSelectionIndex(-1);
        break;
    }
  };

  const handleCreateNewArticle = (articleName: string, ingredientIndex: number) => {
    // Setze den Artikelnamen im AppContext
    dispatch({ type: 'SET_NEW_ARTICLE_NAME', payload: articleName });
    
    // Setze den Artikelnamen im Rezeptformular
    setRecipeForm(prev => {
      const updatedIngredients = prev.ingredients.map((ing, i) => 
        i === ingredientIndex ? { ...ing, name: articleName } : ing
      );
      
      // Prüfen, ob eine neue leere Zeile hinzugefügt werden soll
      // Neue Zeile hinzufügen, wenn der neue Artikel in der letzten Zeile erstellt wird
      const shouldAddNewLine = ingredientIndex === prev.ingredients.length - 1;
      
      if (shouldAddNewLine) {
        updatedIngredients.push({ 
          id: UUIDUtils.generateId(), 
          name: '', 
          amount: 0, 
          unit: 'g', 
          price: 0 
        });
      }
      
      return {
        ...prev,
        ingredients: updatedIngredients
      };
    });
    
    // Schließe das Rezeptformular und öffne das Artikelformular
    dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: false });
    dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
    dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: true });
    
    setIngredientSearchTerm('');
    setShowIngredientDropdown(false);
    setSelectedIngredientIndex(-1);
    setDropdownSelectionIndex(-1);
  };

  const updateIngredientFromArticle = (ingredientIndex: number) => {
    // Finde die Zutat an der angegebenen Position
    const ingredient = recipeForm.ingredients[ingredientIndex];
    if (!ingredient || !ingredient.name) return;
    
    // Finde den Artikel basierend auf dem Namen
    const article = articles.find(a => a.name === ingredient.name);
    if (!article) return;
    
    // Aktualisiere die Zutat mit den Artikeldaten
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === ingredientIndex ? { 
          ...ing, 
          name: article.name,
          unit: article.contentUnit || ing.unit,
          price: article.pricePerUnit || ing.price
        } : ing
      )
    }));
    
    // Neuberechnung basierend auf aktuellem Verkaufspreis
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const handleIngredientFocus = (ingredientIndex: number) => {
    setSelectedIngredientIndex(ingredientIndex);
    setIngredientSearchTerm(recipeForm.ingredients[ingredientIndex].name);
    setShowIngredientDropdown(true);
    setDropdownSelectionIndex(-1);
  };

  const handleEditIngredient = (ingredientIndex: number) => {
    // Artikel zum Bearbeiten im Artikelformular öffnen
    const ingredient = recipeForm.ingredients[ingredientIndex];
    
    // Finde den Artikel basierend auf dem Namen
    const articleToEdit = articles.find(article => article.name === ingredient.name);
    
    if (articleToEdit) {
      // Artikelformular mit den Daten des zu bearbeitenden Artikels öffnen
      dispatch({ type: 'SET_EDITING_ARTICLE', payload: articleToEdit });
      dispatch({ type: 'SET_SHOW_ARTICLE_FORM', payload: true });
      dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: false });
    } else {
      // Falls kein Artikel gefunden wird, zeige eine Meldung
      alert('Artikel nicht gefunden. Bitte wählen Sie zuerst einen Artikel aus.');
    }
  };

  const addIngredient = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { 
        id: UUIDUtils.generateId(), 
        name: '', 
        amount: 0, 
        unit: 'g', 
        price: 0 
      }]
    }));
    
    // Fokus auf die neue Zutat setzen
    setTimeout(() => {
      const newIndex = recipeForm.ingredients.length;
      const inputElement = document.querySelector(`input[data-ingredient-index="${newIndex}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  const removeIngredient = (index: number) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
    
    // Neuberechnung basierend auf aktuellem Verkaufspreis
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const removeUsedRecipe = (index: number) => {
    setRecipeForm(prev => ({
      ...prev,
      usedRecipes: prev.usedRecipes.filter((_, i) => i !== index)
    }));
    
    // Neuberechnung basierend auf aktuellem Verkaufspreis
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const addPreparationStep = () => {
    setRecipeForm(prev => ({
      ...prev,
      preparationSteps: [...prev.preparationSteps, { 
        id: UUIDUtils.generateId(), 
        order: prev.preparationSteps.length + 1, 
        description: '' 
      }]
    }));
  };

  const handlePreparationStepChange = (index: number, description: string) => {
    setRecipeForm(prev => {
      const updatedSteps = prev.preparationSteps.map((step, i) => 
        i === index ? { ...step, description } : step
      );
      
      // Wenn der letzte Schritt ausgefüllt wird, füge eine neue leere Zeile hinzu
      if (index === updatedSteps.length - 1 && description.trim() !== '') {
        updatedSteps.push({
          id: UUIDUtils.generateId(),
          order: updatedSteps.length + 1,
          description: ''
        });
      }
      
      return {
        ...prev,
        preparationSteps: updatedSteps
      };
    });
  };

  const handleRecipeImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Prüfe ob es ein Bild ist
      if (file.type.startsWith('image/')) {
        setRecipeForm(prev => ({ ...prev, image: file }));
      } else {
        alert('Bitte wählen Sie eine Bilddatei aus.');
      }
    }
  };

  const removePreparationStep = (index: number) => {
    setRecipeForm(prev => {
      const updatedSteps = prev.preparationSteps.filter((_, i) => i !== index);
      
      // Wenn nach dem Löschen keine leere Zeile am Ende ist, füge eine hinzu
      if (updatedSteps.length > 0 && updatedSteps[updatedSteps.length - 1].description.trim() !== '') {
        updatedSteps.push({
          id: UUIDUtils.generateId(),
          order: updatedSteps.length + 1,
          description: ''
        });
      }
      
      return {
        ...prev,
        preparationSteps: updatedSteps
      };
    });
  };

  const handleSaveRecipe = async () => {
    if (!recipeForm.name.trim()) {
      alert('Bitte geben Sie einen Namen für das Rezept ein.');
      return;
    }

    try {
      console.log('🚀 handleSaveRecipe - editingRecipe:', editingRecipe);

      // Entferne leere Zubereitungsschritte vor dem Speichern
      const cleanedPreparationSteps = recipeForm.preparationSteps
        .filter(step => step.description.trim() !== '')
        .map((step, index) => ({ ...step, order: index + 1 }));

      // Entferne nur Zutaten ohne Namen vor dem Speichern (Menge kann 0 sein)
      const cleanedIngredients = recipeForm.ingredients
        .filter(ingredient => ingredient.name && ingredient.name.trim() !== '');

      const recipeToSave = {
        ...recipeForm,
        preparationSteps: cleanedPreparationSteps,
        ingredients: cleanedIngredients,
        id: editingRecipe ? editingRecipe.id : UUIDUtils.generateId(), // Frontend-ID (eindeutig)
        dbId: editingRecipe?.dbId, // DB-ID falls vorhanden (für Updates)
        materialCosts: calculateMaterialCosts(),
        totalNutritionInfo: calculateRecipeNutrition(),
        allergens: getRecipeAllergens()
        // Keine Timestamps - werden von PostgreSQL automatisch gesetzt (created_at, updated_at)
        // lastModifiedBy wird später implementiert (User-System)
      };

      console.log('📝 recipeToSave:', recipeToSave);

      // Prüfe den aktuellen Speichermodus
      const currentStorageMode = localStorage.getItem('chef_storage_mode') as string;
      
      if (currentStorageMode === 'cloud') {
        // Speichere Rezept über Cloud-API
        console.log(`💾 Speichere Rezept über Cloud-API: ${recipeToSave.name}`);
        
        const method = editingRecipe ? 'PUT' : 'POST';
        const url = editingRecipe 
          ? `http://localhost:3001/api/v1/recipes/${recipeToSave.id}`
          : 'http://localhost:3001/api/v1/recipes';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeToSave)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Rezept erfolgreich über Cloud gespeichert:`, result.message);
        
        // Verwende die vom Cloud zurückgegebenen Daten
        const savedRecipe = result.data;
        
        setRecipes((prev: any[]) => {
          const updatedRecipes = editingRecipe 
            ? prev.map(r => r.id === editingRecipe.id ? savedRecipe : r)
            : [...prev, savedRecipe];
          
          return updatedRecipes;
        });
      } else {
        // Lokaler Speichermodus
        if (editingRecipe) {
          // Rezept bearbeiten
          console.log('✏️ Bearbeite Rezept:', editingRecipe.id);
          setRecipes((prev: any[]) => prev.map((recipe: any) => 
            recipe.id === editingRecipe.id ? recipeToSave : recipe
          ));
        } else {
          // Neues Rezept erstellen
          console.log('🆕 Erstelle neues Rezept');
          setRecipes((prev: any[]) => [...prev, recipeToSave]);
        }
      }
      
      // Das Speichern wird jetzt von der Komponente über den storageLayer gehandhabt
      
      // Schließe das Formular und reset
      dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: false });
      dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
      resetRecipeForm();
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Rezepts:', error);
      
      // Erstelle recipeToSave für Fallback
      const cleanedPreparationSteps = recipeForm.preparationSteps
        .filter(step => step.description.trim() !== '')
        .map((step, index) => ({ ...step, order: index + 1 }));

      const cleanedIngredients = recipeForm.ingredients
        .filter(ingredient => ingredient.name && ingredient.name.trim() !== '');

      const calculatedNutritionFallback = calculateRecipeNutrition();
      const recipeToSave = {
        ...recipeForm,
        preparationSteps: cleanedPreparationSteps,
        ingredients: cleanedIngredients,
        id: editingRecipe ? editingRecipe.id : UUIDUtils.generateId(), // Frontend-ID (eindeutig)
        dbId: editingRecipe?.dbId, // DB-ID falls vorhanden (für Updates)
        materialCosts: calculateMaterialCosts(),
        totalNutritionInfo: calculatedNutritionFallback,
        allergens: getRecipeAllergens(),
        alcohol: recipeForm.alcohol || calculatedNutritionFallback.alcohol
        // Keine Timestamps - werden von PostgreSQL automatisch gesetzt (created_at, updated_at)
        // lastModifiedBy wird später implementiert (User-System)
      };
      
      console.log('🍷 [handleSaveRecipe Fallback] Alkoholwert beim Speichern:', {
        'recipeForm.alcohol': recipeForm.alcohol,
        'calculatedNutritionFallback.alcohol': calculatedNutritionFallback.alcohol,
        'recipeToSave.alcohol': recipeToSave.alcohol
      });
      
      // Fallback: Lokale Speicherung
      if (editingRecipe) {
        setRecipes((prev: any[]) => prev.map((recipe: any) => 
          recipe.id === editingRecipe.id ? recipeToSave : recipe
        ));
      } else {
        setRecipes((prev: any[]) => [...prev, recipeToSave]);
      }
      
      // Das Speichern wird jetzt von der Komponente über den storageLayer gehandhabt
      
      // Schließe das Formular und reset
      dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: false });
      dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
      resetRecipeForm();
    }
  };

  // Hilfsfunktionen für Dropdowns
  const formatAdditivesDisplay = (additives: string[]) => {
    if (additives.length === 0) return 'Keine Zusatzstoffe gefunden';
    
    // Extrahiere nur die Zahlen aus den Zusatzstoffen
    const numbers = additives.map(additive => {
      const match = additive.match(/^(\d+)/);
      return match ? match[1] : '';
    }).filter(num => num !== '');
    
    return numbers.join(', ');
  };

  const formatAllergensDisplay = (allergens: string[]) => {
    if (allergens.length === 0) return 'Keine Allergene gefunden';
    
    // Extrahiere nur die Buchstaben aus den Allergenen
    const letters = allergens.map(allergen => {
      const match = allergen.match(/^([A-Z])/);
      return match ? match[1] : '';
    }).filter(letter => letter !== '');
    
    return letters.join(', ');
  };

  return {
    // States
    editingRecipe,
    setEditingRecipe,
    recipeForm,
    setRecipeForm,
    activeTab,
    setActiveTab,
    sellingPriceInput,
    setSellingPriceInput,
    ingredientSearchTerm,
    showIngredientDropdown,
    selectedIngredientIndex,
    dropdownSelectionIndex,
    setDropdownSelectionIndex,

    // Functions
    resetRecipeForm,
    setRecipeForEditing,
    calculateMaterialCosts,
    handleMarkupChange,
    handleSellingPriceChange,
    calculateGrossProfit,
    calculateAllValues,
    getRecipeAdditives,
    getRecipeAllergens,
    calculateRecipeNutrition,
    getFilteredIngredients,
    handleIngredientSelect,
    calculateIngredientPrice,
    handleIngredientInputChange,
    handleIngredientInputBlur,
    handleIngredientKeyDown,
    handleCreateNewArticle,
    handleIngredientFocus,
    handleEditIngredient,
    addIngredient,
    removeIngredient,
    removeUsedRecipe,
    addPreparationStep,
    handlePreparationStepChange,
    handleRecipeImageUpload,
    removePreparationStep,
    handleSaveRecipe,
    formatAdditivesDisplay,
    formatAllergensDisplay,
    calculateKilojoules,
    calculateGrossPrice,
    calculateNetPrice,
    updateIngredientFromArticle
  };
}; 