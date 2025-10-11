import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { categoryManager } from '../utils/categoryManager';
import { storageLayer } from '../services/storageLayer';

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

  const handleDeleteArticles = useCallback(async (onProgress?: (current: number, total: number) => void) => {
    if (selectedArticles.length > 0) {
      try {
        // Lösche alle ausgewählten Artikel über StorageLayer
        for (let i = 0; i < selectedArticles.length; i++) {
          const articleId = selectedArticles[i];
          
          // Rufe Progress-Callback auf
          if (onProgress) {
            onProgress(i, selectedArticles.length);
          }
          
          const success = await storageLayer.delete('articles', articleId);
          if (!success) {
            console.warn(`⚠️ Artikel ${articleId} konnte nicht gelöscht werden`);
          }
        }
        
        // Finaler Progress-Callback
        if (onProgress) {
          onProgress(selectedArticles.length, selectedArticles.length);
        }
        
        // Aktualisiere lokalen State
        setArticles((prev: any[]) => {
          const updated = prev.filter((article: any) => !selectedArticles.includes(article.id));
          return updated;
        });
        setSelectedArticles([]);
      } catch (error) {
        console.error('❌ Fehler beim Löschen der Artikel:', error);
        // Fallback: Nur lokalen State aktualisieren
        setArticles((prev: any[]) => {
          const updated = prev.filter((article: any) => !selectedArticles.includes(article.id));
          return updated;
        });
        setSelectedArticles([]);
      }
    }
  }, [selectedArticles, setArticles, setSelectedArticles]);

  const handleDeleteSingleArticle = useCallback(async (articleId: string) => {
    try {
      console.log(`🗑️ Lösche Artikel ${articleId} über StorageLayer...`);
      
      // Lösche über StorageLayer
      const success = await storageLayer.delete('articles', articleId);
      
      if (!success) {
        throw new Error('Fehler beim Löschen des Artikels über StorageLayer');
      }
      
      // Aktualisiere lokalen State
      setArticles((prev: any[]) => {
        const updated = prev.filter((article: any) => article.id !== articleId);
        return updated;
      });
      setSelectedArticles((prev: string[]) => prev.filter((id: string) => id !== articleId));
      
      console.log('✅ Artikel erfolgreich gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Artikels:', error);
      // Fallback: Nur lokalen State aktualisieren
      setArticles((prev: any[]) => {
        const updated = prev.filter((article: any) => article.id !== articleId);
        return updated;
      });
      setSelectedArticles((prev: string[]) => prev.filter((id: string) => id !== articleId));
    }
  }, [setArticles, setSelectedArticles]);

  const handleBulkPriceChange = useCallback(async (percentage: number, onProgress?: (current: number, total: number) => void) => {
    if (selectedArticles.length > 0 && percentage >= -99 && percentage <= 99) {
      try {
        // Aktualisiere State
        const updatedArticles = articles.map((article: any) => {
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
        
        // Speichere über StorageLayer mit Progress-Callback
        await storageLayer.save('articles', updatedArticles, (current, total) => {
          if (onProgress) {
            onProgress(current, total);
          }
        });
        
        // Aktualisiere lokalen State
        setArticles(updatedArticles);
      } catch (error) {
        console.error('❌ Fehler beim Ändern der Preise:', error);
        // Fallback: Nur lokalen State aktualisieren
        setArticles((prev: any[]) => {
          return prev.map((article: any) => {
            if (selectedArticles.includes(article.id)) {
              const newBundlePrice = article.bundlePrice * (1 + percentage / 100);
              const newPricePerUnit = article.content > 0 ? newBundlePrice / article.content : 0;
              
              return {
                ...article,
                bundlePrice: parseFloat(newBundlePrice.toFixed(2)),
                pricePerUnit: parseFloat(newPricePerUnit.toFixed(2))
              };
            }
            return article;
          });
        });
      }
    }
  }, [selectedArticles, articles, setArticles]);

  const handleSaveArticle = useCallback(async (article: any): Promise<void> => {
    try {
      // Prüfe ob es sich um einen bestehenden DB-Artikel handelt (Integer-ID) oder einen neuen/lokalen Artikel (String-ID)
      const isEditingDbArticle = editingArticle && typeof editingArticle.id === 'number';
      
      const newArticle = {
        ...article,
        // Nur ID verwenden wenn es ein bestehender DB-Artikel ist
        id: isEditingDbArticle ? editingArticle.id : undefined,
        supplierId: article.supplierId && (typeof article.supplierId === 'string' ? article.supplierId.trim() !== '' : article.supplierId !== null && article.supplierId !== undefined) ? article.supplierId : undefined,
        // Stelle sicher, dass Arrays korrekt sind
        allergens: Array.isArray(article.allergens) ? article.allergens : [],
        additives: Array.isArray(article.additives) ? article.additives : [],
        nutrition: article.nutritionInfo || article.nutrition || {}
      };
      
      // Prüfe den aktuellen Speichermodus
      const currentStorageMode = localStorage.getItem('chef_storage_mode') as string;
      
      if (currentStorageMode === 'backend' || currentStorageMode === 'hybrid') {
        // Verwende die neue intelligente Speicher-Route
        console.log(`💾 Intelligente Speicherung über Backend-API: ${newArticle.name}`);
        
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/v1/articles/smart-save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newArticle)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          // Spezielle Behandlung für Duplikat-Fehler
          if (response.status === 409 && result.isDuplicate) {
            console.warn(`⚠️ Duplikat gefunden: ${result.message}`);
            console.log('🔍 Backend-Response:', result);
            console.log('🔍 Existing Article:', result.existingArticle);
            // Werfe einen benutzerdefinierten Fehler mit den Duplikat-Daten
            const duplicateError = new Error(`Duplikat gefunden: ${result.message}`);
            (duplicateError as any).isDuplicate = true;
            (duplicateError as any).existingArticle = result.existingArticle;
            throw duplicateError;
          }
          
          throw new Error(`HTTP ${response.status}: ${result.message || response.statusText}`);
        }
        
        console.log(`✅ Artikel erfolgreich über intelligente Backend-Route gespeichert:`, result.message);
        
        // Verwende die vom Backend zurückgegebenen Daten
        const savedArticle = result.data;
        
        setArticles((prev: any[]) => {
          let updatedArticles;
          if (isEditingDbArticle) {
            // Ersetze bestehenden DB-Artikel
            updatedArticles = prev.map(a => a.id === editingArticle.id ? savedArticle : a);
          } else {
            // Ersetze lokalen Artikel mit String-ID durch DB-Artikel mit Integer-ID
            updatedArticles = editingArticle 
              ? prev.map(a => a.id === editingArticle.id ? savedArticle : a)
              : [...prev, savedArticle];
          }
          
          // Aktualisiere den CategoryManager mit den neuen Artikeldaten
          categoryManager.updateCategories(updatedArticles);
          
          return updatedArticles;
        });
        
        // Speichere nicht erneut über saveAppData, da der Artikel bereits in der DB ist
        console.log('✅ Artikel erfolgreich in der Datenbank gespeichert, skip saveAppData');
      } else {
        // Lokaler Speichermodus - wie bisher
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
      }
      
             if (setEditingArticle) {
         setEditingArticle(null);
       }
     } catch (error) {
       console.error('❌ Fehler beim Speichern des Artikels:', error);
       
       // Re-throw den Fehler, damit das Artikelformular ihn behandeln kann
       throw error;
       
       // Fallback-Code wird nicht mehr ausgeführt, da der Fehler weitergegeben wird
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