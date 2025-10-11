import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Temporäre Datenbankverbindung für Rezept-Routen
function getTempPool(): Pool {
  // Verwende die gleichen Konfigurationswerte wie in der Synchronisation
  return new Pool({
    host: process.env['DB_HOST'] || '192.168.1.7',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'chef_numbers',
    user: process.env['DB_USER'] || 'chef',
    password: process.env['DB_PASSWORD'] || 'password',
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// GET /api/v1/recipes - Alle Rezepte abrufen
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Lade alle Rezepte aus der Datenbank...');
    
    // Verwende temporäre Verbindung
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM recipes ORDER BY created_at DESC');
      
      console.log(`✅ ${result.rows.length} Rezepte aus der Datenbank geladen`);
      
      // Konvertiere Datenbank-Felder in Frontend-Format
      const convertedRecipes = result.rows.map(dbRecipe => ({
        id: dbRecipe.id,
        name: dbRecipe.name,
        description: dbRecipe.description,
        preparationTime: dbRecipe.preparation_time,
        cookingTime: dbRecipe.cooking_time,
        servings: dbRecipe.servings,
        difficulty: dbRecipe.difficulty,
        category: dbRecipe.category,
        netPrice: parseFloat(dbRecipe.net_price) || 0,
        grossPrice: parseFloat(dbRecipe.gross_price) || 0,
        sellingPrice: parseFloat(dbRecipe.selling_price) || 0,
        markupPercentage: parseFloat(dbRecipe.markup_percentage) || 0,
        createdAt: dbRecipe.created_at,
        updatedAt: dbRecipe.updated_at
      }));
      
      res.json({
        success: true,
        data: convertedRecipes,
        count: convertedRecipes.length
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/recipes - Neues Rezept erstellen
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, preparation_time, cooking_time, servings, difficulty, category, net_price, gross_price, selling_price, markup_percentage } = req.body;
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Name is required'
      });
      return;
    }
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO recipes (name, description, preparation_time, cooking_time, servings, difficulty, category, net_price, gross_price, selling_price, markup_percentage)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [name, description, preparation_time, cooking_time, servings, difficulty, category, net_price, gross_price, selling_price, markup_percentage]);
      
      console.log('✅ Rezept erfolgreich erstellt:', result.rows[0]);
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Recipe created successfully'
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/recipes/:id - Rezept aktualisieren
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, preparation_time, cooking_time, servings, difficulty, category, net_price, gross_price, selling_price, markup_percentage } = req.body;
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE recipes 
        SET name = $1, description = $2, preparation_time = $3, cooking_time = $4, servings = $5, difficulty = $6, category = $7, net_price = $8, gross_price = $9, selling_price = $10, markup_percentage = $11, updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `, [name, description, preparation_time, cooking_time, servings, difficulty, category, net_price, gross_price, selling_price, markup_percentage, id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
        return;
      }
      
      console.log('✅ Rezept erfolgreich aktualisiert:', result.rows[0]);
      
      res.json({
        success: true,
        data: result.rows[0],
        message: 'Recipe updated successfully'
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipe',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/recipes/:id - Rezept löschen
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
        return;
      }
      
      console.log('✅ Rezept erfolgreich gelöscht:', result.rows[0]);
      
      res.json({
        success: true,
        message: 'Recipe deleted successfully',
        data: result.rows[0]
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
