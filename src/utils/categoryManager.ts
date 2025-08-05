import { CATEGORIES } from '../constants/articleConstants';

export interface CategoryData {
  name: string;
  isCustom: boolean;
  usageCount: number;
}

/**
 * Kategorie-Manager: Verwaltet eine kombinierte Datenquelle aus statischen und benutzerdefinierten Kategorien
 */
export class CategoryManager {
  private static instance: CategoryManager;
  private categories: CategoryData[] = [];
  private articles: any[] = [];

  private constructor() {
    this.initializeStaticCategories();
  }

  public static getInstance(): CategoryManager {
    if (!CategoryManager.instance) {
      CategoryManager.instance = new CategoryManager();
    }
    return CategoryManager.instance;
  }

  /**
   * Initialisiert die statischen Kategorien aus der CATEGORIES-Konstante
   */
  private initializeStaticCategories(): void {
    this.categories = CATEGORIES.map(category => ({
      name: category,
      isCustom: false,
      usageCount: 0
    }));
  }

  /**
   * Aktualisiert die Kategorien basierend auf den aktuellen Artikeldaten
   */
  public updateCategories(articles: any[]): void {
    this.articles = articles;
    this.refreshCategories();
  }

  /**
   * Aktualisiert die Kategorienliste und Nutzungszähler
   */
  private refreshCategories(): void {
    // Zähle die Nutzung jeder Kategorie
    const categoryUsage = new Map<string, number>();
    
    this.articles.forEach(article => {
      if (article.category) {
        const count = categoryUsage.get(article.category) || 0;
        categoryUsage.set(article.category, count + 1);
      }
    });

    // Aktualisiere bestehende Kategorien mit Nutzungszählern
    this.categories.forEach(category => {
      category.usageCount = categoryUsage.get(category.name) || 0;
    });

    // Füge neue benutzerdefinierte Kategorien hinzu
    categoryUsage.forEach((count, categoryName) => {
      const existingCategory = this.categories.find(cat => cat.name === categoryName);
      if (!existingCategory) {
        this.categories.push({
          name: categoryName,
          isCustom: true,
          usageCount: count
        });
      }
    });

    // Sortiere Kategorien: Statische zuerst, dann benutzerdefinierte (beide alphabetisch)
    this.categories.sort((a, b) => {
      // Statische Kategorien zuerst
      if (!a.isCustom && b.isCustom) return -1;
      if (a.isCustom && !b.isCustom) return 1;
      
      // Dann alphabetisch
      return a.name.localeCompare(b.name, 'de');
    });
  }

  /**
   * Gibt alle Kategorien zurück (statische + benutzerdefinierte)
   */
  public getAllCategories(): string[] {
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
   * Fügt eine neue benutzerdefinierte Kategorie hinzu
   */
  public addCustomCategory(categoryName: string): void {
    if (!this.categoryExists(categoryName)) {
      this.categories.push({
        name: categoryName,
        isCustom: true,
        usageCount: 0
      });
      
      // Sortiere neu
      this.categories.sort((a, b) => {
        if (!a.isCustom && b.isCustom) return -1;
        if (a.isCustom && !b.isCustom) return 1;
        return a.name.localeCompare(b.name, 'de');
      });
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