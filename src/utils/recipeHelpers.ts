import { Article, Recipe } from '../types';

// Funktionen für Rezept-Zutaten und Allergene
export const getRecipeIngredients = (recipes: Recipe[], recipeId?: string): string[] => {
  if (recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return [];
    
    const ingredients: string[] = [];
    
    // Zutaten aus dem Rezept selbst
    recipe.ingredients.forEach((ingredient: { name: string }) => {
      ingredients.push(ingredient.name);
    });
    
    // Zutaten aus verwendeten Rezepten
    recipe.usedRecipes.forEach((usedRecipe: { recipeId: string }) => {
      const usedRecipeData = recipes.find(r => r.id === usedRecipe.recipeId);
      if (usedRecipeData) {
        usedRecipeData.ingredients.forEach((ingredient: { name: string }) => {
          ingredients.push(ingredient.name);
        });
      }
    });
    
    return Array.from(new Set(ingredients)); // Duplikate entfernen
  } else {
    // Alle Zutaten aus allen Rezepten
    const allIngredients: string[] = [];
    recipes.forEach(recipe => {
      recipe.ingredients.forEach((ingredient: { name: string }) => {
        allIngredients.push(ingredient.name);
      });
    });
    return Array.from(new Set(allIngredients));
  }
};

export const getRecipeAllergens = (recipes: Recipe[], articles: Article[], recipeId?: string): string[] => {
  if (recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return [];
    
    const allergens: string[] = [];
    
    // Allergene aus den Zutaten des Rezepts
    recipe.ingredients.forEach((ingredient: { name: string }) => {
      const article = articles.find(a => a.name === ingredient.name);
      if (article && article.allergens) {
        allergens.push(...article.allergens);
      }
    });
    
    // Allergene aus verwendeten Rezepten
    recipe.usedRecipes.forEach((usedRecipe: { recipeId: string }) => {
      const usedRecipeData = recipes.find(r => r.id === usedRecipe.recipeId);
      if (usedRecipeData) {
        usedRecipeData.ingredients.forEach((ingredient: { name: string }) => {
          const article = articles.find(a => a.name === ingredient.name);
          if (article && article.allergens) {
            allergens.push(...article.allergens);
          }
        });
      }
    });
    
    return Array.from(new Set(allergens)); // Duplikate entfernen
  } else {
    // Alle Allergene aus allen Rezepten
    const allAllergens: string[] = [];
    recipes.forEach(recipe => {
      recipe.ingredients.forEach((ingredient: { name: string }) => {
        const article = articles.find(a => a.name === ingredient.name);
        if (article && article.allergens) {
          allAllergens.push(...article.allergens);
        }
      });
    });
    return Array.from(new Set(allAllergens));
  }
}; 