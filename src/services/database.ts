import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { 
  Article, 
  Supplier, 
  Recipe, 
  AppSettings, 
  DatabaseSchema 
} from '../types';

const DB_NAME = 'ChefsNumbersDB';
const DB_VERSION = 1;

interface ChefsNumbersDB extends DBSchema {
  suppliers: {
    key: string;
    value: Supplier;
    indexes: { 'by-name': string };
  };
  articles: {
    key: string;
    value: Article;
    indexes: { 
      'by-name': string;
      'by-category': string;
      'by-supplier': string;
    };
  };
  recipes: {
    key: string;
    value: Recipe;
    indexes: { 'by-name': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

class DatabaseService {
  private db: IDBPDatabase<ChefsNumbersDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<ChefsNumbersDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Suppliers Store
        const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id' });
        suppliersStore.createIndex('by-name', 'name');

        // Articles Store
        const articlesStore = db.createObjectStore('articles', { keyPath: 'id' });
        articlesStore.createIndex('by-name', 'name');
        articlesStore.createIndex('by-category', 'category');
        articlesStore.createIndex('by-supplier', 'supplierId');

        // Recipes Store
        const recipesStore = db.createObjectStore('recipes', { keyPath: 'id' });
        recipesStore.createIndex('by-name', 'name');

        // Settings Store
        db.createObjectStore('settings', { keyPath: 'id' });
      },
    });

    // Standardeinstellungen setzen, falls noch nicht vorhanden
    await this.initializeDefaultSettings();
  }

  private async initializeDefaultSettings(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings) {
      const defaultSettings: AppSettings = {
        defaultMarkupPercentage: 300,
        defaultVatRate: 19,
        currency: 'EUR',
        language: 'de'
      };
      await this.saveSettings(defaultSettings);
    }
  }

  // Suppliers
  async getAllSuppliers(): Promise<Supplier[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('suppliers');
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('suppliers', id);
  }

  async saveSupplier(supplier: Supplier): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('suppliers', supplier);
  }

  async deleteSupplier(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('suppliers', id);
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allSuppliers = await this.db.getAll('suppliers');
    return allSuppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(query.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(query.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Articles
  async getAllArticles(): Promise<Article[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('articles');
  }

  async getArticle(id: string): Promise<Article | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('articles', id);
  }

  async saveArticle(article: Article): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('articles', article);
  }

  async deleteArticle(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('articles', id);
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('articles', 'by-category', category);
  }

  async getArticlesBySupplier(supplierId: string): Promise<Article[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('articles', 'by-supplier', supplierId);
  }

  async searchArticles(query: string): Promise<Article[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allArticles = await this.db.getAll('articles');
    return allArticles.filter(article => 
      article.name.toLowerCase().includes(query.toLowerCase()) ||
      article.supplierArticleNumber?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Recipes
  async getAllRecipes(): Promise<Recipe[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('recipes');
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('recipes', id);
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('recipes', recipe);
  }

  async deleteRecipe(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('recipes', id);
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allRecipes = await this.db.getAll('recipes');
    return allRecipes.filter(recipe => 
      recipe.name.toLowerCase().includes(query.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Settings
  async getSettings(): Promise<AppSettings | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('settings', 'default');
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('settings', settings);
  }

  // Export/Import
  async exportData(): Promise<DatabaseSchema> {
    const suppliers = await this.getAllSuppliers();
    const articles = await this.getAllArticles();
    const recipes = await this.getAllRecipes();
    const settings = await this.getSettings();

    return {
      suppliers,
      articles,
      recipes,
      settings: settings || {
        defaultMarkupPercentage: 300,
        defaultVatRate: 19,
        currency: 'EUR',
        language: 'de'
      }
    };
  }

  async importData(data: DatabaseSchema): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(['suppliers', 'articles', 'recipes', 'settings'], 'readwrite');

    // Clear existing data
    await tx.objectStore('suppliers').clear();
    await tx.objectStore('articles').clear();
    await tx.objectStore('recipes').clear();
    await tx.objectStore('settings').clear();

    // Import new data
    for (const supplier of data.suppliers) {
      await tx.objectStore('suppliers').put(supplier);
    }

    for (const article of data.articles) {
      await tx.objectStore('articles').put(article);
    }

    for (const recipe of data.recipes) {
      await tx.objectStore('recipes').put(recipe);
    }

    await tx.objectStore('settings').put(data.settings);

    await tx.done;
  }

  // Close database
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService(); 