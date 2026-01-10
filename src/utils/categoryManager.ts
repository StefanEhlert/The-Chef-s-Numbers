import { CATEGORIES } from '../constants/articleConstants';
import { CategoryEntity } from '../types';
import { storageLayer } from '../services/storageLayer';
import { generateId } from '../utils/storageUtils';

export interface CategoryData {
  name: string;
  isCustom: boolean;
  usageCount: number;
}

/**
 * Kategorie-Manager: Verwaltet Kategorien aus der Datenbank
 */
export class CategoryManager {
  private static instance: CategoryManager;
  private categories: CategoryData[] = [];
  private articles: any[] = [];
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Initialisierung wird asynchron durchgeführt
  }

  public static getInstance(): CategoryManager {
    if (!CategoryManager.instance) {
      CategoryManager.instance = new CategoryManager();
    }
    return CategoryManager.instance;
  }

  /**
   * Initialisiert die Kategorien aus der Datenbank (asynchron)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.loadCategoriesFromDatabase();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  /**
   * Lädt Kategorien aus der Datenbank
   */
  private async loadCategoriesFromDatabase(): Promise<void> {
    try {
      const categoryEntities = await storageLayer.load<CategoryEntity>('categories');
      
      if (categoryEntities && categoryEntities.length > 0) {
        // Konvertiere CategoryEntity zu CategoryData
        this.categories = categoryEntities.map(entity => ({
          name: entity.name,
          isCustom: false, // Alle aus DB sind gleichwertig
          usageCount: 0 // Wird durch updateCategories aktualisiert
        }));
        
        // Sortiere alphabetisch
        this.categories.sort((a, b) => a.name.localeCompare(b.name, 'de'));
        
        console.log(`📁 Kategorien aus Datenbank geladen: ${this.categories.length} Kategorien`);
      } else {
        // Keine Kategorien in DB - sollte durch App-Initialisierung erstellt werden
        this.categories = [];
        console.log('📁 Keine Kategorien in Datenbank gefunden');
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kategorien aus Datenbank:', error);
      this.categories = [];
    }
  }

  /**
   * Aktualisiert die Kategorien basierend auf den aktuellen Artikeldaten
   */
  public async updateCategories(articles: any[]): Promise<void> {
    // Stelle sicher, dass Kategorien initialisiert sind
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this.articles = articles;
    await this.refreshCategories();
  }

  /**
   * Aktualisiert die Kategorienliste und Nutzungszähler
   * Fügt neue Kategorien aus Artikeln zur Datenbank hinzu
   */
  private async refreshCategories(): Promise<void> {
    // Zähle die Nutzung jeder Kategorie
    const categoryUsage = new Map<string, number>();
    
    this.articles.forEach(article => {
      if (article.category && article.category.trim() !== '') {
        const categoryName = article.category.trim();
        const count = categoryUsage.get(categoryName) || 0;
        categoryUsage.set(categoryName, count + 1);
      }
    });

    // Aktualisiere bestehende Kategorien mit Nutzungszählern
    this.categories.forEach(category => {
      category.usageCount = categoryUsage.get(category.name) || 0;
    });

    // WICHTIG: Lade aktuelle Kategorien aus DB, um Duplikate zu vermeiden
    // Dies stellt sicher, dass wir gegen die tatsächliche DB prüfen, nicht nur gegen Memory
    let dbCategories: CategoryEntity[] = [];
    try {
      dbCategories = await storageLayer.load<CategoryEntity>('categories') || [];
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kategorien aus DB:', error);
      // Bei Fehler verwende Memory-Cache als Fallback
      dbCategories = [];
    }
    
    // Erstelle Set mit allen existierenden Kategorien aus DB (case-insensitive)
    const existingCategoryNames = new Set<string>();
    dbCategories.forEach(cat => {
      if (cat.name && cat.name.trim() !== '') {
        existingCategoryNames.add(cat.name.trim().toLowerCase());
      }
    });
    
    // Füge auch Memory-Kategorien hinzu (falls DB noch nicht synchronisiert)
    this.categories.forEach(cat => {
      if (cat.name && cat.name.trim() !== '') {
        existingCategoryNames.add(cat.name.trim().toLowerCase());
      }
    });
    
    const newCategories: CategoryEntity[] = [];

    categoryUsage.forEach((count, categoryName) => {
      const trimmedName = categoryName.trim();
      if (!trimmedName) return;
      
      // Prüfe auf Eindeutigkeit (case-insensitive) gegen DB UND Memory
      if (!existingCategoryNames.has(trimmedName.toLowerCase())) {
        existingCategoryNames.add(trimmedName.toLowerCase());
        
        // Erstelle neue Kategorie für DB
        newCategories.push({
          id: generateId(),
          name: trimmedName,
          description: undefined,
          isNew: true,
          isDirty: true,
          syncStatus: 'pending' as const,
          updatedAt: new Date()
        });
        
        // Füge auch zum Memory-Cache hinzu
        this.categories.push({
          name: trimmedName,
          isCustom: false, // Alle aus DB sind gleichwertig
          usageCount: count
        });
      }
    });

    // Speichere neue Kategorien in DB (nur wenn wirklich neue vorhanden)
    if (newCategories.length > 0) {
      try {
        const success = await storageLayer.save('categories', newCategories);
        if (success) {
          console.log(`📁 ${newCategories.length} neue Kategorien zur Datenbank hinzugefügt`);
        } else {
          console.error('❌ Fehler beim Speichern neuer Kategorien');
        }
      } catch (error) {
        console.error('❌ Fehler beim Speichern neuer Kategorien:', error);
      }
    }

    // Sortiere Kategorien alphabetisch
    this.categories.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  /**
   * Gibt alle Kategorien zurück (statische + benutzerdefinierte)
   */
  public getAllCategories(): string[] {
    // Stelle sicher, dass initialisiert wurde (synchron für Rückwärtskompatibilität)
    if (!this.isInitialized && !this.initializationPromise) {
      this.initialize().catch(err => console.error('Fehler bei Kategorien-Initialisierung:', err));
    }
    return this.categories.map(cat => cat.name);
  }

  /**
   * Gibt nur die statischen Kategorien zurück
   */
  public getStaticCategories(): string[] {
    return this.categories
      .filter(cat => !cat.isCustom)
      .map(cat => cat.name);
  }

  /**
   * Gibt nur die benutzerdefinierten Kategorien zurück
   */
  public getCustomCategories(): string[] {
    return this.categories
      .filter(cat => cat.isCustom)
      .map(cat => cat.name);
  }

  /**
   * Gibt nur Kategorien zurück, die tatsächlich in Artikeln verwendet werden
   */
  public getUsedCategories(): string[] {
    return this.categories
      .filter(cat => cat.usageCount > 0)
      .map(cat => cat.name);
  }

  /**
   * Gibt detaillierte Kategoriendaten zurück
   */
  public getCategoryData(): CategoryData[] {
    return [...this.categories];
  }

  /**
   * Prüft, ob eine Kategorie existiert (statisch oder benutzerdefiniert)
   */
  public categoryExists(categoryName: string): boolean {
    return this.categories.some(cat => cat.name === categoryName);
  }

  /**
   * Prüft, ob eine Kategorie benutzerdefiniert ist
   */
  public isCustomCategory(categoryName: string): boolean {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.isCustom : false;
  }

  /**
   * Gibt die Nutzungsanzahl einer Kategorie zurück
   */
  public getCategoryUsageCount(categoryName: string): number {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.usageCount : 0;
  }

  /**
   * Fügt eine neue benutzerdefinierte Kategorie hinzu (speichert in DB)
   */
  public async addCustomCategory(categoryName: string): Promise<void> {
    // Stelle sicher, dass initialisiert wurde
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    
    // Prüfe auf Eindeutigkeit (case-insensitive)
    const exists = this.categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      return;
    }
    
    // Erstelle neue Kategorie für DB
    const newCategory: CategoryEntity = {
      id: generateId(),
      name: trimmedName,
      description: undefined,
      isNew: true,
      isDirty: true,
      syncStatus: 'pending' as const,
      updatedAt: new Date()
    };
    
    try {
      const success = await storageLayer.save('categories', [newCategory]);
      if (success) {
        // Füge zum Memory-Cache hinzu
        this.categories.push({
          name: trimmedName,
          isCustom: false,
          usageCount: 0
        });
        
        // Sortiere neu
        this.categories.sort((a, b) => a.name.localeCompare(b.name, 'de'));
        console.log(`📁 Neue Kategorie zur Datenbank hinzugefügt: ${trimmedName}`);
      } else {
        console.error('❌ Fehler beim Speichern der neuen Kategorie');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern der neuen Kategorie:', error);
    }
  }

  /**
   * Entfernt eine benutzerdefinierte Kategorie (nur wenn sie nicht verwendet wird)
   */
  public removeCustomCategory(categoryName: string): boolean {
    const category = this.categories.find(cat => cat.name === categoryName);
    if (category && category.isCustom && category.usageCount === 0) {
      this.categories = this.categories.filter(cat => cat.name !== categoryName);
      return true;
    }
    return false;
  }

  /**
   * Gibt Kategorien zurück, die für eine Suche passen (für Dropdown-Filterung)
   */
  public getFilteredCategories(searchTerm: string, limit: number = 10): string[] {
    const filtered = this.categories
      .filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(cat => cat.name);
    
    return filtered.slice(0, limit);
  }

  /**
   * Gibt Statistiken über die Kategorien zurück
   */
  public getCategoryStats(): {
    total: number;
    static: number;
    custom: number;
    used: number;
    unused: number;
  } {
    const total = this.categories.length;
    const staticCount = this.categories.filter(cat => !cat.isCustom).length;
    const customCount = this.categories.filter(cat => cat.isCustom).length;
    const usedCount = this.categories.filter(cat => cat.usageCount > 0).length;
    const unusedCount = total - usedCount;

    return {
      total,
      static: staticCount,
      custom: customCount,
      used: usedCount,
      unused: unusedCount
    };
  }
}

// Exportiere eine Instanz für einfache Verwendung
export const categoryManager = CategoryManager.getInstance(); 