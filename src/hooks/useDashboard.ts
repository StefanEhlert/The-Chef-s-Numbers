import { useMemo } from 'react';

interface UseDashboardProps {
  articles: any[];
  suppliers: any[];
  recipes: any[];
}

export const useDashboard = ({ articles, suppliers, recipes }: UseDashboardProps) => {
  // Berechne Statistiken
  const statistics = useMemo(() => {
    // Gesamtwert aller Artikel
    const totalValue = articles.reduce((sum, article) => sum + (article.bundlePrice || 0), 0);
    
    // Anzahl der Kategorien
    const categories = new Set(articles.map(article => article.category).filter(Boolean));
    
    // Durchschnittlicher Artikelpreis
    const averageArticlePrice = articles.length > 0 ? totalValue / articles.length : 0;
    
    // Anzahl der Rezepte
    const recipeCount = recipes.length;
    
    // Durchschnittliche Rezeptkosten
    const averageRecipeCost = recipes.length > 0 
      ? recipes.reduce((sum, recipe) => sum + (recipe.materialCosts || 0), 0) / recipes.length 
      : 0;
    
    // Top-Kategorien (nach Anzahl der Artikel)
    const categoryCounts = articles.reduce((acc, article) => {
      if (article.category) {
        acc[article.category] = (acc[article.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
    
    // Top-Lieferanten (nach Anzahl der Artikel)
    const supplierCounts = articles.reduce((acc, article) => {
      if (article.supplierId) {
        // Finde Lieferanten-Namen anhand der supplierId
        const supplier = suppliers.find(s => s.id === article.supplierId);
        const supplierName = supplier?.name || 'Unbekannter Lieferant';
        acc[supplierName] = (acc[supplierName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topSuppliers = Object.entries(supplierCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([supplier, count]) => ({ supplier, count }));
    
    // Teuerste Artikel
    const mostExpensiveArticles = [...articles]
      .sort((a, b) => (b.bundlePrice || 0) - (a.bundlePrice || 0))
      .slice(0, 5);
    
    // Neueste Artikel
    const newestArticles = [...articles]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 5);
    
    // Neueste Rezepte
    const newestRecipes = [...recipes]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 5);

    return {
      totalValue,
      categoryCount: categories.size,
      averageArticlePrice,
      recipeCount,
      averageRecipeCost,
      topCategories,
      topSuppliers,
      mostExpensiveArticles,
      newestArticles,
      newestRecipes
    };
  }, [articles, suppliers, recipes]);

  // Formatierungshilfsfunktionen
  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '€0,00';
    }
    return `€${Number(price).toFixed(2)}`;
  };

  const formatDate = (timestamp: string | number) => {
    if (!timestamp) return 'Unbekannt';
    return new Date(timestamp).toLocaleDateString('de-DE');
  };

  return {
    statistics,
    formatPrice,
    formatDate
  };
}; 