import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { categoryManager } from '../utils/categoryManager';

export const useArticleHandlers = (
  articles: any[],
  setArticles: React.Dispatch<React.SetStateAction<any[]>>,
  selectedArticles: string[],
  setSelectedArticles: React.Dispatch<React.SetStateAction<string[]>>,
  saveAppData: (data: any) => void,
  editingArticle?: any,
  setEditingArticle?: React.Dispatch<React.SetStateAction<any>>
) => {
  const handleSelectArticle = useCallback((articleId: string) => {
    setSelectedArticles((prev: string[]) => 
      prev.includes(articleId) 
        ? prev.filter((id: string) => id !== articleId)
        : [...prev, articleId]
    );
  }, [setSelectedArticles]);

  const handleSelectAll = useCallback((filteredArticles: any[]) => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map((article: any) => article.id));
    }
  }, [selectedArticles.length, setSelectedArticles]);

  const handleDeleteArticles = useCallback(() => {
    if (selectedArticles.length > 0) {
      setArticles((prev: any[]) => {
        const updated = prev.filter((article: any) => !selectedArticles.includes(article.id));
        saveAppData({ articles: updated });
        return updated;
      });
      setSelectedArticles([]);
    }
  }, [selectedArticles, setArticles, setSelectedArticles, saveAppData]);

  const handleDeleteSingleArticle = useCallback((articleId: string) => {
    setArticles((prev: any[]) => {
      const updated = prev.filter((article: any) => article.id !== articleId);
      saveAppData({ articles: updated });
      return updated;
    });
    setSelectedArticles((prev: string[]) => prev.filter((id: string) => id !== articleId));
  }, [setArticles, setSelectedArticles, saveAppData]);

  const handleBulkPriceChange = useCallback((percentage: number) => {
    if (selectedArticles.length > 0 && percentage >= -99 && percentage <= 99) {
      setArticles((prev: any[]) => {
        const updated = prev.map((article: any) => {
          if (selectedArticles.includes(article.id)) {
            // Berechne den neuen Gebindepreis basierend auf dem Prozentwert
            const newBundlePrice = article.bundlePrice * (1 + percentage / 100);
            
            // Berechne den neuen Preis pro Einheit basierend auf dem neuen Gebindepreis
            const newPricePerUnit = article.content > 0 ? newBundlePrice / article.content : 0;
            
            return {
              ...article,
              bundlePrice: parseFloat(newBundlePrice.toFixed(2)),
              pricePerUnit: parseFloat(newPricePerUnit.toFixed(2))
            };
          }
          return article;
        });
        
        // Speichere die aktualisierten Artikel im LocalStorage
        saveAppData({ articles: updated });
        
        return updated;
      });
    }
  }, [selectedArticles, setArticles, saveAppData]);

  const handleSaveArticle = useCallback((article: any) => {
    const newArticle = {
      ...article,
      id: article.id || Date.now().toString(), // Use existing ID if editing, create new if new article
      nutritionInfo: article.nutrition
    };
    setArticles((prev: any[]) => {
      const updatedArticles = editingArticle 
        ? prev.map(a => a.id === editingArticle.id ? newArticle : a)
        : [...prev, newArticle];
      
      // Aktualisiere den CategoryManager mit den neuen Artikeldaten
      categoryManager.updateCategories(updatedArticles);
      
      // Speichere die aktualisierten Artikel im LocalStorage
      saveAppData({ articles: updatedArticles });
      
      return updatedArticles;
    });
    if (setEditingArticle) {
      setEditingArticle(null);
    }
  }, [editingArticle, setArticles, setEditingArticle, saveAppData]);

  const handleEditArticle = useCallback((article: any) => {
    // Diese Funktion sollte den editingArticle State setzen
    // Da wir das State Management noch nicht vollständig migriert haben,
    // geben wir den Artikel zurück, damit die App.tsx ihn verarbeiten kann
    return article;
  }, []);

  return {
    handleSelectArticle,
    handleSelectAll,
    handleDeleteArticles,
    handleDeleteSingleArticle,
    handleBulkPriceChange,
    handleSaveArticle,
    handleEditArticle,
  };
}; 