import { useState, useEffect } from 'react';
import { Recipe, UsedRecipe } from '../types';

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

interface UseRecipeFormProps {
  articles: any[];
  recipes: any[];
  setRecipes: React.Dispatch<React.SetStateAction<any[]>>;
  setShowArticleForm: (show: boolean) => void;
  setEditingArticle: (article: any) => void;
  formatPrice: (price: number | undefined | null) => string;
  showRecipeForm: boolean;
  setShowRecipeForm: (show: boolean) => void;
}

export const useRecipeForm = ({
  articles,
  recipes,
  setRecipes,
  setShowArticleForm,
  setEditingArticle,
  formatPrice,
  showRecipeForm,
  setShowRecipeForm
}: UseRecipeFormProps) => {
  // State für Rezept-Formular wird jetzt von außen verwaltet
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
    ingredients: [{ id: Date.now().toString(), name: '', amount: 0, unit: 'g', price: 0 }],
    usedRecipes: [],
    preparationSteps: [{ id: Date.now().toString(), order: 1, description: '' }]
  });

  // Nach dem useState für recipeForm:
  const [sellingPriceInput, setSellingPriceInput] = useState(recipeForm.sellingPrice.toFixed(2));
  const [activeTab, setActiveTab] = useState<'kalkulation' | 'inhaltsangaben' | 'naehrwerte'>('kalkulation');

  // State für Zutat-Autovervollständigung
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(-1);
  const [dropdownSelectionIndex, setDropdownSelectionIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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

  const resetRecipeForm = () => {
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
      ingredients: [{ id: Date.now().toString(), name: '', amount: 0, unit: 'g', price: 0 }],
      usedRecipes: [],
      preparationSteps: [{ id: Date.now().toString(), order: 1, description: '' }]
    } as RecipeForm);
  };

  const calculateMaterialCosts = () => {
    const ingredientCosts = recipeForm.ingredients.reduce((sum, ingredient) => sum + ingredient.price, 0);
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
    setSellingPriceInput(roundedSellingPrice.toFixed(2));
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
      if (recipe && recipe.additives) {
        recipe.additives.forEach((ingredient: any) => {
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
      salt: 0
    };

    // Nährwerte von Zutaten
    recipeForm.ingredients.forEach(ingredient => {
      if (ingredient.name && ingredient.name.trim() !== '' && ingredient.amount > 0) {
        const article = articles.find(a => a.name === ingredient.name);
        if (article && article.nutritionInfo) {
          // Berechne Anteil basierend auf Menge (pro 100g)
          const ratio = ingredient.amount / 100;
          totalNutrition.calories += (article.nutritionInfo.calories || 0) * ratio;
          totalNutrition.kilojoules += (article.nutritionInfo.kilojoules || 0) * ratio;
          totalNutrition.protein += (article.nutritionInfo.protein || 0) * ratio;
          totalNutrition.fat += (article.nutritionInfo.fat || 0) * ratio;
          totalNutrition.carbohydrates += (article.nutritionInfo.carbohydrates || 0) * ratio;
          totalNutrition.fiber += (article.nutritionInfo.fiber || 0) * ratio;
          totalNutrition.sugar += (article.nutritionInfo.sugar || 0) * ratio;
          totalNutrition.salt += (article.nutritionInfo.salt || 0) * ratio;
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

    return {
      calories: Math.round(nutritionPerPortion.calories),
      kilojoules: Math.round(nutritionPerPortion.kilojoules * 10) / 10,
      protein: Math.round(nutritionPerPortion.protein * 10) / 10,
      fat: Math.round(nutritionPerPortion.fat * 10) / 10,
      carbohydrates: Math.round(nutritionPerPortion.carbohydrates * 10) / 10,
      fiber: Math.round(nutritionPerPortion.fiber * 10) / 10,
      sugar: Math.round(nutritionPerPortion.sugar * 10) / 10,
      salt: Math.round(nutritionPerPortion.salt * 100) / 100
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
    
    results.push(...filteredRecipes.map((recipe: any) => ({ ...recipe, type: 'recipe' })));
    
    return results.slice(0, 10);
  };

  const handleIngredientSelect = (item: any, ingredientIndex: number) => {
    if (item.type === 'recipe') {
      // Wenn ein Rezept ausgewählt wurde, füge es zu usedRecipes hinzu
      const costPerPortion = item.materialCosts / item.portions;
      const newUsedRecipe = {
        id: Date.now().toString(),
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
    } else {
      // Wenn ein Artikel ausgewählt wurde, behalte das alte Verhalten bei
      setRecipeForm(prev => {
        const updatedIngredients = prev.ingredients.map((ing, i) => 
          i === ingredientIndex ? { 
            ...ing, 
            name: item.name,
            unit: item.contentUnit,
            price: 0
          } : ing
        );
        
        // Prüfen, ob eine neue leere Zeile hinzugefügt werden soll
        const shouldAddNewLine = ingredientIndex === prev.ingredients.length - 1 && 
                                prev.ingredients[prev.ingredients.length - 1].name === '';
        
        if (shouldAddNewLine) {
          updatedIngredients.push({ 
            id: Date.now().toString(), 
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
    setDropdownPosition({ top: 0, left: 0 });
    
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
    
    // Position des Dropdowns aktualisieren
    const inputElement = document.querySelector(`input[data-ingredient-index="${ingredientIndex}"]`) as HTMLInputElement;
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left
      });
    }
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
        setDropdownPosition({ top: 0, left: 0 });
      }
    }, 300);
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
        setDropdownPosition({ top: 0, left: 0 });
        break;
      
      case 'Tab':
        setShowIngredientDropdown(false);
        setDropdownSelectionIndex(-1);
        setDropdownPosition({ top: 0, left: 0 });
        break;
    }
  };

  const handleCreateNewArticle = (articleName: string, ingredientIndex: number) => {
    setShowRecipeForm(false);
    setEditingArticle(null);
    setShowArticleForm(true);
    
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === ingredientIndex ? { ...ing, name: articleName } : ing
      )
    }));
    
    setIngredientSearchTerm('');
    setShowIngredientDropdown(false);
    setSelectedIngredientIndex(-1);
    setDropdownSelectionIndex(-1);
    setDropdownPosition({ top: 0, left: 0 });
    
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
    
    // Position des Dropdowns sofort berechnen
    const inputElement = document.querySelector(`input[data-ingredient-index="${ingredientIndex}"]`) as HTMLInputElement;
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left
      });
    }
  };

  const handleEditIngredient = (ingredientIndex: number) => {
    // Artikel zum Bearbeiten im Artikelformular öffnen
    const ingredient = recipeForm.ingredients[ingredientIndex];
    
    // Finde den Artikel basierend auf dem Namen
    const articleToEdit = articles.find(article => article.name === ingredient.name);
    
    if (articleToEdit) {
      // Artikelformular mit den Daten des zu bearbeitenden Artikels öffnen
      setEditingArticle(articleToEdit);
      setShowArticleForm(true);
      setShowRecipeForm(false);
    } else {
      // Falls kein Artikel gefunden wird, zeige eine Meldung
      alert('Artikel nicht gefunden. Bitte wählen Sie zuerst einen Artikel aus.');
    }
  };

  const addIngredient = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { 
        id: Date.now().toString(), 
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

  const addPreparationStep = () => {
    setRecipeForm(prev => ({
      ...prev,
      preparationSteps: [...prev.preparationSteps, { 
        id: Date.now().toString(), 
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
          id: Date.now().toString(),
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
          id: Date.now().toString(),
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

  const handleSaveRecipe = () => {
    if (!recipeForm.name.trim()) {
      alert('Bitte geben Sie einen Namen für das Rezept ein.');
      return;
    }

    // Entferne leere Zubereitungsschritte vor dem Speichern
    const cleanedPreparationSteps = recipeForm.preparationSteps
      .filter(step => step.description.trim() !== '')
      .map((step, index) => ({ ...step, order: index + 1 }));

    // Entferne nur Zutaten ohne Namen vor dem Speichern (Menge kann 0 sein)
    const cleanedIngredients = recipeForm.ingredients
      .filter(ingredient => ingredient.name && ingredient.name.trim() !== '');

    if (editingRecipe) {
      // Rezept bearbeiten
      const updatedRecipe = {
        ...recipeForm,
        preparationSteps: cleanedPreparationSteps,
        ingredients: cleanedIngredients,
        id: editingRecipe.id,
        materialCosts: calculateMaterialCosts(),
        totalNutritionInfo: calculateRecipeNutrition(),
        allergens: getRecipeAllergens(),
        createdAt: editingRecipe.createdAt,
        updatedAt: new Date(),
        lastModifiedBy: 'Benutzer' // Platzhalter für später
      };
      setRecipes((prev: any[]) => prev.map((recipe: any) => 
        recipe.id === editingRecipe.id ? updatedRecipe : recipe
      ));
      setEditingRecipe(null);
    } else {
      // Neues Rezept erstellen
      const newRecipe = {
        ...recipeForm,
        preparationSteps: cleanedPreparationSteps,
        ingredients: cleanedIngredients,
        id: Date.now().toString(),
        materialCosts: calculateMaterialCosts(),
        totalNutritionInfo: calculateRecipeNutrition(),
        allergens: getRecipeAllergens(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModifiedBy: 'Benutzer' // Platzhalter für später
      };
      console.log('Neues Rezept:', newRecipe);
      setRecipes((prev: any[]) => [...prev, newRecipe]);
    }
    setShowRecipeForm(false);
    resetRecipeForm();
  };

  // Hilfsfunktionen für Dropdowns
  const formatAdditivesDisplay = (additives: string[]) => {
    return additives.length > 0 ? additives.join(', ') : 'Keine ausgewählt';
  };

  const formatAllergensDisplay = (allergens: string[]) => {
    return allergens.length > 0 ? allergens.join(', ') : 'Keine ausgewählt';
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
    dropdownPosition,

    // Functions
    resetRecipeForm,
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
    addPreparationStep,
    handlePreparationStepChange,
    handleRecipeImageUpload,
    removePreparationStep,
    handleSaveRecipe,
    formatAdditivesDisplay,
    formatAllergensDisplay,
    calculateKilojoules,
    calculateGrossPrice,
    calculateNetPrice
  };
}; 