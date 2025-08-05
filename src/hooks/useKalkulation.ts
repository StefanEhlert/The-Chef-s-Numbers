import { useState } from 'react';

export const useKalkulation = () => {
  const [activeTab, setActiveTab] = useState<string>('kalkulation');

  // Diese Funktionen würden normalerweise aus dem globalen State oder Context kommen
  // Für jetzt verwenden wir Platzhalter-Funktionen
  const getRecipeIngredients = (recipeId?: string): string[] => {
    // Hier würde die Logik zur Abfrage der Rezept-Zutaten implementiert
    return [];
  };

  const getRecipeAllergens = (recipeId?: string): string[] => {
    // Hier würde die Logik zur Abfrage der Rezept-Allergene implementiert
    return [];
  };

  return {
    activeTab,
    setActiveTab,
    getRecipeIngredients,
    getRecipeAllergens
  };
}; 