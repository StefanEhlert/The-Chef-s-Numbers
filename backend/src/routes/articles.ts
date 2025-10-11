import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

// Hilfsfunktion für sichere supplierId-Konvertierung
function safeParseSupplierId(supplierId: any): number | null {
  if (supplierId === null || supplierId === undefined || supplierId === '') {
    return null;
  }
  
  // Falls es bereits eine Zahl ist
  if (typeof supplierId === 'number') {
    return supplierId;
  }
  
  // Falls es ein String ist
  if (typeof supplierId === 'string') {
    const parsed = parseInt(supplierId.trim());
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

const router = Router();

// Temporäre Datenbankverbindung für Artikel-Routen
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

// Test-Route für Verbindung
router.get('/test', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Teste Datenbankverbindung...');
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      // Teste einfache Abfrage
      const result = await client.query('SELECT 1 as test');
      console.log('✅ Datenbankverbindung erfolgreich:', result.rows[0]);
      
      // Prüfe ob articles Tabelle existiert
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'articles'
        ) as table_exists
      `);
      
      console.log('📋 Articles Tabelle existiert:', tableCheck.rows[0].table_exists);
      
      res.json({
        success: true,
        message: 'Database connection successful',
        tableExists: tableCheck.rows[0].table_exists
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('❌ Datenbankverbindung fehlgeschlagen:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/articles - Alle Artikel aus der Datenbank abrufen
router.get('/', async (_req, res) => {
  try {
    console.log('🔍 Lade alle Artikel aus der Datenbank...');
    
    // Verwende temporäre Verbindung
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      // Zuerst schauen wir uns die Tabellenstruktur an
      const tableInfoQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'articles' 
        ORDER BY ordinal_position
      `;
      const tableInfo = await client.query(tableInfoQuery);
      console.log('📋 Aktuelle Tabellenstruktur:', tableInfo.rows);
      
      const query = 'SELECT * FROM articles ORDER BY created_at DESC';
      const result = await client.query(query);
      
      // Debug: Zeige den ersten Artikel mit allen Feldern
      if (result.rows.length > 0) {
        console.log('🔍 Erster Artikel aus der Datenbank:', JSON.stringify(result.rows[0], null, 2));
      }
      
      // Konvertiere Datenbank-Felder in Frontend-Format
      const convertedArticles = result.rows.map(dbArticle => ({
        id: dbArticle.id,
        name: dbArticle.name,
        category: dbArticle.category,
        supplierId: dbArticle.supplier_id,
        supplierArticleNumber: dbArticle.supplier_article_number,
        bundleUnit: dbArticle.bundle_unit || 'Stück',
        bundlePrice: parseFloat(dbArticle.bundle_price) || 0,
        bundleEanCode: dbArticle.bundle_ean_code,
        content: parseFloat(dbArticle.content) || 1,
        contentUnit: dbArticle.content_unit || 'Stück',
        contentEanCode: dbArticle.content_ean_code,
        pricePerUnit: parseFloat(dbArticle.price_per_unit) || 0,
        vatRate: parseFloat(dbArticle.vat_rate) || 19,
        allergens: Array.isArray(dbArticle.allergens) ? dbArticle.allergens : [],
        additives: Array.isArray(dbArticle.additives) ? dbArticle.additives : [],
        ingredients: dbArticle.ingredients,
        nutritionInfo: dbArticle.nutrition || {
          calories: 0,
          kilojoules: 0,
          protein: 0,
          fat: 0,
          carbohydrates: 0
        },
        notes: dbArticle.notes,
        imageUrl: dbArticle.image_url,
        createdAt: dbArticle.created_at,
        updatedAt: dbArticle.updated_at
      }));
      
      console.log(`✅ ${convertedArticles.length} Artikel aus der Datenbank geladen und konvertiert`);
      res.json({
        success: true,
        count: convertedArticles.length,
        data: convertedArticles,
        tableStructure: tableInfo.rows // Füge Tabellenstruktur zur Antwort hinzu
      });
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der Artikel:', error);
    
    // Detaillierte Fehlerbehandlung
    let errorMessage = 'Unbekannter Fehler';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    res.status(500).json({ 
      error: 'Fehler beim Laden der Artikel',
      message: errorMessage,
      details: errorDetails
    });
  }
});

// POST /api/v1/articles/check-duplicate - Prüfe ob Artikel bereits existiert
router.post('/check-duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 POST /api/v1/articles/check-duplicate - Prüfe Duplikat');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      name, 
      supplierId, 
      supplierArticleNumber,
      supplierName // Optional: Lieferantenname für zusätzliche Prüfung
    } = req.body;
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Artikelname ist erforderlich'
      });
      return;
    }
    
    console.log('🔍 Prüfe Duplikat für:', { name, supplierId, supplierArticleNumber, supplierName });
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      let query = '';
      let params: any[] = [];
      
      // Erstelle eine flexible Duplikat-Erkennung
      if (supplierId) {
        // Prüfe nach Name + Lieferanten-ID
        query = `
          SELECT id, name, supplier_id, supplier_article_number, 
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1) AND supplier_id = $2
        `;
        params = [name, supplierId];
      } else if (supplierName) {
        // Prüfe nach Name + Lieferantenname
        query = `
          SELECT a.id, a.name, a.supplier_id, a.supplier_article_number, s.name as supplier_name
          FROM articles a
          JOIN suppliers s ON a.supplier_id = s.id
          WHERE LOWER(a.name) = LOWER($1) AND LOWER(s.name) = LOWER($2)
        `;
        params = [name, supplierName];
      } else {
        // Prüfe nur nach Name (falls kein Lieferant angegeben)
        query = `
          SELECT id, name, supplier_id, supplier_article_number,
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1)
        `;
        params = [name];
      }
      
      // Zusätzliche Prüfung nach Artikelnummer falls vorhanden
      if (supplierArticleNumber) {
        let articleNumberQuery = '';
        let articleNumberParams: any[] = [];
        
        if (supplierId) {
          articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1) AND supplier_id = $2
          `;
          articleNumberParams = [supplierArticleNumber, supplierId];
        } else if (supplierName) {
          articleNumberQuery = `
            SELECT a.id, a.name, a.supplier_id, a.supplier_article_number, s.name as supplier_name
            FROM articles a
            JOIN suppliers s ON a.supplier_id = s.id
            WHERE LOWER(a.supplier_article_number) = LOWER($1) AND LOWER(s.name) = LOWER($2)
          `;
          articleNumberParams = [supplierArticleNumber, supplierName];
        } else {
          articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1)
          `;
          articleNumberParams = [supplierArticleNumber];
        }
        
        const articleNumberResult = await client.query(articleNumberQuery, articleNumberParams);
        
        if (articleNumberResult.rows.length > 0) {
          console.log('⚠️ Duplikat gefunden (Artikelnummer):', articleNumberResult.rows[0]);
          res.json({
            success: true,
            isDuplicate: true,
            duplicateType: 'articleNumber',
            existingArticle: articleNumberResult.rows[0],
            message: `Artikel mit der Artikelnummer "${supplierArticleNumber}" existiert bereits beim Lieferanten "${articleNumberResult.rows[0].supplier_name}"`
          });
          return;
        }
      }
      
      const result = await client.query(query, params);
      
      if (result.rows.length > 0) {
        console.log('⚠️ Duplikat gefunden (Name):', result.rows[0]);
        res.json({
          success: true,
          isDuplicate: true,
          duplicateType: 'name',
          existingArticle: result.rows[0],
          message: `Artikel "${name}" existiert bereits beim Lieferanten "${result.rows[0].supplier_name}"`
        });
      } else {
        console.log('✅ Kein Duplikat gefunden');
        res.json({
          success: true,
          isDuplicate: false,
          message: 'Artikel kann gespeichert werden'
        });
      }
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Fehler bei der Duplikat-Prüfung:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Duplikat-Prüfung',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test-Route für smart-save
router.get('/smart-save-test', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 GET /api/v1/articles/smart-save-test - Test Route');
    res.json({
      success: true,
      message: 'Smart-save route is available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Fehler in smart-save-test:', error);
    res.status(500).json({
      success: false,
      message: 'Test route failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Zentrale Datenbank-Initialisierung und Schema-Migration
router.post('/initialize-database', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 POST /api/v1/articles/initialize-database - Zentrale Datenbank-Initialisierung');
    
    const { config } = req.body;
    
    // Hole PostgreSQL-Konfiguration aus der Umgebung oder Request
    const postgresConfig = config || {
      host: process.env['DB_HOST'] || '192.168.1.7',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'chef_numbers',
      username: process.env['DB_USER'] || 'chef',
      password: process.env['DB_PASSWORD'] || 'password'
    };

    // Importiere den PostgresService
    const { PostgresService } = await import('../services/postgresService');
    const postgresService = new PostgresService();
    
    const results = {
      connection: null as any,
      schema: null as any,
      overall: { success: false, message: '', errors: [] as string[] }
    };

    try {
      // 1. Verbindung testen
      console.log('🔍 Teste Datenbankverbindung...');
      results.connection = await postgresService.testConnection(postgresConfig);
      
      if (!results.connection.success) {
        results.overall.errors.push(`Verbindung fehlgeschlagen: ${results.connection.message}`);
        throw new Error(`Datenbankverbindung fehlgeschlagen: ${results.connection.message}`);
      }
      
      console.log('✅ Datenbankverbindung erfolgreich');

      // 2. Schema-Migration durchführen
      console.log('🔍 Führe Schema-Migration durch...');
      results.schema = await postgresService.checkAndUpdateSchema(postgresConfig);
      
      if (!results.schema.success) {
        results.overall.errors.push(`Schema-Migration fehlgeschlagen: ${results.schema.message}`);
        throw new Error(`Schema-Migration fehlgeschlagen: ${results.schema.message}`);
      }
      
      console.log('✅ Schema-Migration erfolgreich');
      
      // 3. Erfolg melden
      results.overall.success = true;
      results.overall.message = 'Datenbank erfolgreich initialisiert';
      
      if (results.schema.changes && results.schema.changes.length > 0) {
        results.overall.message += ` (${results.schema.changes.length} Änderungen durchgeführt)`;
      }
      
    } catch (error) {
      console.error('❌ Fehler bei der Datenbank-Initialisierung:', error);
      results.overall.success = false;
      results.overall.message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      results.overall.errors.push(results.overall.message);
    }
    
    res.json({
      success: results.overall.success,
      message: results.overall.message,
      details: {
        connection: results.connection,
        schema: results.schema,
        errors: results.overall.errors
      }
    });
    
  } catch (error) {
    console.error('❌ Kritischer Fehler bei der Datenbank-Initialisierung:', error);
    res.status(500).json({
      success: false,
      message: 'Kritischer Fehler bei der Datenbank-Initialisierung',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        connection: null,
        schema: null,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    });
  }
});

// Route für automatische Schema-Migration
router.post('/migrate-schema', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 POST /api/v1/articles/migrate-schema - Automatische Schema-Migration');
    
    // Hole PostgreSQL-Konfiguration aus der Umgebung
    const config = {
      host: process.env['DB_HOST'] || '192.168.1.7',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'chef_numbers',
      username: process.env['DB_USER'] || 'chef',
      password: process.env['DB_PASSWORD'] || 'password'
    };

    // Importiere den PostgresService
    const { PostgresService } = await import('../services/postgresService');
    const postgresService = new PostgresService();
    
    // Führe automatische Schema-Migration durch
    const result = await postgresService.checkAndUpdateSchema(config);
    
    res.json({
      success: result.success,
      message: result.message,
      changes: result.changes
    });
    
  } catch (error) {
    console.error('❌ Fehler bei der Schema-Migration:', error);
    res.status(500).json({
      success: false,
      message: 'Schema-Migration fehlgeschlagen',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/articles/smart-save - Intelligente Speicherung mit Duplikat-Erkennung
router.post('/smart-save', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 POST /api/v1/articles/smart-save - Intelligente Speicherung');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      id, // Optional: Für Updates
      name, 
      category, 
      supplierId, 
      supplierArticleNumber,
      bundleUnit,
      bundlePrice,
      bundleEanCode,
      content,
      contentUnit,
      contentEanCode,
      pricePerUnit,
      vatRate,
      allergens,
      additives,
      ingredients,
      nutritionInfo,
      notes,
      imageUrl
    } = req.body;
    
    if (!name) {
      console.log('❌ Fehler: Name ist erforderlich');
      res.status(400).json({
        success: false,
        message: 'Artikelname ist erforderlich'
      });
      return;
    }
    
    console.log('🔍 Intelligente Speicherung für:', { id, name, supplierId, supplierArticleNumber });
    console.log('🔍 Debug - supplierId Typ:', typeof supplierId, 'Wert:', supplierId);
    console.log('🔍 Debug - allergens Typ:', typeof allergens, 'Wert:', allergens);
    console.log('🔍 Debug - additives Typ:', typeof additives, 'Wert:', additives);
    
    // Stelle sicher, dass allergens und additives korrekte Arrays sind
    const safeAllergens = Array.isArray(allergens) ? allergens : [];
    const safeAdditives = Array.isArray(additives) ? additives : [];
    console.log('🔍 Debug - safeAllergens:', safeAllergens);
    console.log('🔍 Debug - safeAdditives:', safeAdditives);
    
    // Stelle sicher, dass nutritionInfo korrekt behandelt wird
    const safeNutritionInfo = nutritionInfo && typeof nutritionInfo === 'object' ? nutritionInfo : null;
    console.log('🔍 Debug - nutritionInfo Typ:', typeof nutritionInfo, 'Wert:', nutritionInfo);
    console.log('🔍 Debug - safeNutritionInfo:', safeNutritionInfo);
    
    // Konvertiere Arrays zu JSON-Strings für PostgreSQL
    const allergensJson = JSON.stringify(safeAllergens);
    const additivesJson = JSON.stringify(safeAdditives);
    console.log('🔍 Debug - allergensJson:', allergensJson);
    console.log('🔍 Debug - additivesJson:', additivesJson);
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      // Duplikat-Erkennung vor dem Speichern
      console.log('🔍 Prüfe auf Duplikate vor dem Speichern...');
      
      let duplicateQuery = '';
      let duplicateParams: any[] = [];
      
      // Prüfe nach Name + Lieferanten-ID
      if (safeParseSupplierId(supplierId)) {
        duplicateQuery = `
          SELECT id, name, supplier_id, supplier_article_number, 
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1) AND supplier_id = $2
        `;
        duplicateParams = [name, safeParseSupplierId(supplierId)];
      } else {
        // Prüfe nur nach Name (falls kein Lieferant angegeben)
        duplicateQuery = `
          SELECT id, name, supplier_id, supplier_article_number,
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1)
        `;
        duplicateParams = [name];
      }
      
      // Bei Updates: Ausschließen des aktuellen Artikels
      if (id) {
        duplicateQuery += ' AND id != $' + (duplicateParams.length + 1);
        duplicateParams.push(id);
      }
      
      const duplicateResult = await client.query(duplicateQuery, duplicateParams);
      
      if (duplicateResult.rows.length > 0) {
        console.log('⚠️ Duplikat gefunden:', duplicateResult.rows[0]);
        console.log('🔍 Sende Duplikat-Response mit existingArticle:', duplicateResult.rows[0]);
        res.status(409).json({
          success: false,
          isDuplicate: true,
          duplicateType: 'name',
          existingArticle: duplicateResult.rows[0],
          message: `Artikel "${name}" existiert bereits beim Lieferanten "${duplicateResult.rows[0].supplier_name}"`
        });
        return;
      }
      
      // Zusätzliche Prüfung nach Artikelnummer falls vorhanden
      if (supplierArticleNumber) {
        let articleNumberQuery = '';
        let articleNumberParams: any[] = [];
        
        if (safeParseSupplierId(supplierId)) {
          articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1) AND supplier_id = $2
          `;
          articleNumberParams = [supplierArticleNumber, safeParseSupplierId(supplierId)];
        } else {
          articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1)
          `;
          articleNumberParams = [supplierArticleNumber];
        }
        
        // Bei Updates: Ausschließen des aktuellen Artikels
        if (id) {
          articleNumberQuery += ' AND id != $' + (articleNumberParams.length + 1);
          articleNumberParams.push(id);
        }
        
        const articleNumberResult = await client.query(articleNumberQuery, articleNumberParams);
        
        if (articleNumberResult.rows.length > 0) {
          console.log('⚠️ Duplikat nach Artikelnummer gefunden:', articleNumberResult.rows[0]);
          res.status(409).json({
            success: false,
            isDuplicate: true,
            duplicateType: 'articleNumber',
            existingArticle: articleNumberResult.rows[0],
            message: `Artikelnummer "${supplierArticleNumber}" existiert bereits beim Lieferanten "${articleNumberResult.rows[0].supplier_name}"`
          });
          return;
        }
      }
      
      // Kein Duplikat gefunden - Artikel speichern
      console.log('✅ Kein Duplikat gefunden - speichere Artikel...');
      
      let query = '';
      let params: any[] = [];
      
      if (id) {
        // Update bestehenden Artikel
        console.log('🔄 Update bestehenden Artikel mit ID:', id);
        query = `
          UPDATE articles SET
            name = $1,
            category = $2,
            supplier_id = $3,
            supplier_article_number = $4,
            bundle_unit = $5,
            bundle_price = $6,
            bundle_ean_code = $7,
            content = $8,
            content_unit = $9,
            content_ean_code = $10,
            price_per_unit = $11,
            vat_rate = $12,
            allergens = $13,
            additives = $14,
            ingredients = $15,
            nutrition = $16,
            notes = $17,
            image_url = $18,
            updated_at = NOW()
          WHERE id = $19
          RETURNING *
        `;
        params = [
          name,
          category || null,
          safeParseSupplierId(supplierId),
          supplierArticleNumber || null,
          bundleUnit || null,
          bundlePrice || null,
          bundleEanCode || null,
          content || null,
          contentUnit || null,
          contentEanCode || null,
          pricePerUnit || null,
          vatRate || null,
          allergensJson,
          additivesJson,
          ingredients || null,
          safeNutritionInfo,
          notes || null,
          imageUrl || null,
          id
        ];
      } else {
        // Neuen Artikel erstellen
        console.log('🆕 Erstelle neuen Artikel...');
        query = `
          INSERT INTO articles (
            name, category, supplier_id, supplier_article_number,
            bundle_unit, bundle_price, bundle_ean_code, content, content_unit, content_ean_code,
            price_per_unit, vat_rate, allergens, additives,
            ingredients, nutrition, notes, image_url,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
          ) RETURNING *
        `;
        params = [
          name,
          category || null,
          safeParseSupplierId(supplierId),
          supplierArticleNumber || null,
          bundleUnit || null,
          bundlePrice || null,
          bundleEanCode || null,
          content || null,
          contentUnit || null,
          contentEanCode || null,
          pricePerUnit || null,
          vatRate || null,
          allergensJson,
          additivesJson,
          ingredients || null,
          safeNutritionInfo,
          notes || null,
          imageUrl || null
        ];
      }
      
      const result = await client.query(query, params);
      
      if (result.rows.length > 0) {
        const savedArticle = result.rows[0];
        console.log('✅ Artikel erfolgreich gespeichert:', savedArticle);
        
        // Hole den Lieferanten-Namen, falls eine supplier_id vorhanden ist
        let articleWithSupplier = savedArticle;
        if (savedArticle.supplier_id) {
          try {
            const supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
            const supplierResult = await client.query(supplierQuery, [savedArticle.supplier_id]);
            if (supplierResult.rows.length > 0) {
              const supplier = supplierResult.rows[0];
              articleWithSupplier = {
                ...savedArticle,
                supplier: supplier.name, // Füge den Lieferanten-Namen hinzu
                supplierId: savedArticle.supplier_id // Behalte auch die ID für Kompatibilität
              };
            }
          } catch (supplierError) {
            console.warn('⚠️ Konnte Lieferanten-Namen nicht abrufen:', supplierError);
            // Verwende den Artikel ohne Lieferanten-Namen
          }
        }
        
        // Konvertiere die Datenbank-Spalten zu Frontend-Feldern
        const createdArticle = {
          id: articleWithSupplier.id,
          name: articleWithSupplier.name,
          category: articleWithSupplier.category,
          supplierId: articleWithSupplier.supplier_id,
          supplier: articleWithSupplier.supplier, // Lieferantenname
          supplierArticleNumber: articleWithSupplier.supplier_article_number,
          bundleUnit: articleWithSupplier.bundle_unit || 'Stück',
          bundlePrice: parseFloat(articleWithSupplier.bundle_price) || 0,
          bundleEanCode: articleWithSupplier.bundle_ean_code,
          content: parseFloat(articleWithSupplier.content) || 1,
          contentUnit: articleWithSupplier.content_unit || 'Stück',
          contentEanCode: articleWithSupplier.content_ean_code,
          pricePerUnit: parseFloat(articleWithSupplier.price_per_unit) || 0,
          vatRate: parseFloat(articleWithSupplier.vat_rate) || 19,
          allergens: articleWithSupplier.allergens || [],
          additives: articleWithSupplier.additives || [],
          ingredients: articleWithSupplier.ingredients,
          nutritionInfo: articleWithSupplier.nutrition || { /* ... */ },
          notes: articleWithSupplier.notes,
          imageUrl: articleWithSupplier.image_url,
          createdAt: articleWithSupplier.created_at,
          updatedAt: articleWithSupplier.updated_at
        };
        
        res.json({
          success: true,
          message: id ? 'Artikel erfolgreich aktualisiert' : 'Artikel erfolgreich erstellt',
          data: createdArticle
        });
      } else {
        console.log('❌ Artikel konnte nicht gespeichert werden');
        res.status(500).json({
          success: false,
          message: 'Artikel konnte nicht gespeichert werden'
        });
      }
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Fehler bei der intelligenten Speicherung:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Speicherung',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/articles - Neuen Artikel erstellen
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 POST /api/v1/articles - Neuer Artikel wird erstellt');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      name, 
      category, 
      supplierId, 
      supplierArticleNumber,
      bundleUnit,
      bundlePrice,
      content,
      contentUnit,
      pricePerUnit,
      vatRate,
      allergens,
      additives,
      ingredients,
      nutritionInfo,
      notes,
      imageUrl
    } = req.body;
    
    console.log('🔍 Extrahierte Felder:', {
      name,
      category,
      supplierId,
      supplierArticleNumber,
      bundleUnit,
      bundlePrice,
      content,
      contentUnit,
      pricePerUnit,
      vatRate,
      allergens,
      additives,
      ingredients,
      nutritionInfo,
      notes,
      imageUrl
    });
    
    if (!name) {
      console.log('❌ Fehler: Name ist erforderlich');
      res.status(400).json({
        success: false,
        message: 'Name is required'
      });
      return;
    }
    
    console.log('🔍 Erstelle neuen Artikel in der Datenbank...');
    
    const pool = getTempPool();
    console.log('🔍 Datenbank-Pool erstellt');
    
    const client = await pool.connect();
    console.log('✅ Datenbank-Client verbunden');
    
    try {
      // Duplikat-Erkennung vor dem Speichern
      console.log('🔍 Prüfe auf Duplikate vor dem Speichern...');
      
      let duplicateQuery = '';
      let duplicateParams: any[] = [];
      
      // Prüfe nach Name + Lieferanten-ID
      if (safeParseSupplierId(supplierId)) {
        duplicateQuery = `
          SELECT id, name, supplier_id, supplier_article_number, 
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1) AND supplier_id = $2
        `;
        duplicateParams = [name, safeParseSupplierId(supplierId)];
      } else {
        // Prüfe nur nach Name (falls kein Lieferant angegeben)
        duplicateQuery = `
          SELECT id, name, supplier_id, supplier_article_number,
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1)
        `;
        duplicateParams = [name];
      }
      
      const duplicateResult = await client.query(duplicateQuery, duplicateParams);
      
      if (duplicateResult.rows.length > 0) {
        console.log('⚠️ Duplikat gefunden:', duplicateResult.rows[0]);
        res.status(409).json({
          success: false,
          isDuplicate: true,
          existingArticle: duplicateResult.rows[0],
          message: `Artikel "${name}" existiert bereits beim Lieferanten "${duplicateResult.rows[0].supplier_name}"`
        });
        return;
      }
      
      // Zusätzliche Prüfung nach Artikelnummer falls vorhanden
      if (supplierArticleNumber) {
        let articleNumberQuery = '';
        let articleNumberParams: any[] = [];
        
        if (safeParseSupplierId(supplierId)) {
          articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1) AND supplier_id = $2
          `;
          articleNumberParams = [supplierArticleNumber, safeParseSupplierId(supplierId)];
        } else {
          articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1)
          `;
          articleNumberParams = [supplierArticleNumber];
        }
        
        const articleNumberResult = await client.query(articleNumberQuery, articleNumberParams);
        
        if (articleNumberResult.rows.length > 0) {
          console.log('⚠️ Duplikat gefunden (Artikelnummer):', articleNumberResult.rows[0]);
          res.status(409).json({
            success: false,
            isDuplicate: true,
            duplicateType: 'articleNumber',
            existingArticle: articleNumberResult.rows[0],
            message: `Artikel mit der Artikelnummer "${supplierArticleNumber}" existiert bereits beim Lieferanten "${articleNumberResult.rows[0].supplier_name}"`
          });
          return;
        }
      }
      
      console.log('✅ Kein Duplikat gefunden - Artikel kann gespeichert werden');
      
      console.log('🔍 Führe INSERT-Query aus...');
      const result = await client.query(`
        INSERT INTO articles (
          name, 
          category, 
          supplier_id, 
          supplier_article_number,
          bundle_unit,
          bundle_price,
          content,
          content_unit,
          price_per_unit,
          vat_rate,
          allergens,
          additives,
          ingredients,
          nutrition,
          notes,
          image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        name, 
        category || null, 
        safeParseSupplierId(supplierId), 
        supplierArticleNumber || null,
        bundleUnit || 'Stück',
        bundlePrice || 0,
        content || 1,
        contentUnit || 'Stück',
        pricePerUnit || 0,
        vatRate || 19,
        JSON.stringify(Array.isArray(allergens) ? allergens : []),
        JSON.stringify(Array.isArray(additives) ? additives : []),
        ingredients || null,
        nutritionInfo || {},
        notes || null,
        imageUrl || null
      ]);
      
      console.log('✅ Artikel erfolgreich erstellt:', result.rows[0]);
      
      // Hole den Lieferanten-Namen, falls eine supplier_id vorhanden ist
      let articleWithSupplier = result.rows[0];
      if (result.rows[0].supplier_id) {
        try {
          const supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
          const supplierResult = await client.query(supplierQuery, [result.rows[0].supplier_id]);
          if (supplierResult.rows.length > 0) {
            const supplier = supplierResult.rows[0];
            articleWithSupplier = {
              ...result.rows[0],
              supplier: supplier.name // Füge den Lieferanten-Namen hinzu
            };
          }
        } catch (supplierError) {
          console.warn('⚠️ Konnte Lieferanten-Namen nicht abrufen:', supplierError);
          // Verwende den Artikel ohne Lieferanten-Namen
        }
      }
      
      console.log('🔍 articleWithSupplier:', articleWithSupplier);
      console.log('🔍 allergens Typ:', typeof articleWithSupplier.allergens, 'Wert:', articleWithSupplier.allergens);
      console.log('🔍 additives Typ:', typeof articleWithSupplier.additives, 'Wert:', articleWithSupplier.additives);
      
      // Konvertiere den erstellten Artikel in Frontend-Format
      const createdArticle = {
        id: articleWithSupplier.id,
        name: articleWithSupplier.name,
        category: articleWithSupplier.category,
        supplierId: articleWithSupplier.supplier_id,
        supplier: articleWithSupplier.supplier, // Füge den Lieferanten-Namen hinzu
        supplierArticleNumber: articleWithSupplier.supplier_article_number,
        bundleUnit: articleWithSupplier.bundle_unit || 'Stück',
        bundlePrice: parseFloat(articleWithSupplier.bundle_price) || 0,
        content: parseFloat(articleWithSupplier.content) || 1,
        contentUnit: articleWithSupplier.content_unit || 'Stück',
        pricePerUnit: parseFloat(articleWithSupplier.price_per_unit) || 0,
        vatRate: parseFloat(articleWithSupplier.vat_rate) || 19,
        allergens: articleWithSupplier.allergens || [],
        additives: articleWithSupplier.additives || [],
        ingredients: articleWithSupplier.ingredients,
        nutritionInfo: articleWithSupplier.nutrition || {
          calories: 0,
          kilojoules: 0,
          protein: 0,
          fat: 0,
          carbohydrates: 0
        },
        notes: articleWithSupplier.notes,
        imageUrl: articleWithSupplier.image_url,
        createdAt: articleWithSupplier.created_at,
        updatedAt: articleWithSupplier.updated_at
      };
      
      res.status(201).json({
        success: true,
        data: createdArticle,
        message: 'Article created successfully'
      });
    } finally {
      console.log('🔍 Schließe Datenbank-Verbindung...');
      client.release();
      await pool.end();
      console.log('✅ Datenbank-Verbindung geschlossen');
    }
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Artikels:', error);
    console.error('❌ Fehler-Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      detail: (error as any)?.detail,
      hint: (error as any)?.hint,
      position: (error as any)?.position
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create article',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        code: (error as any)?.code,
        detail: (error as any)?.detail,
        hint: (error as any)?.hint
      }
    });
  }
});

// PUT /api/v1/articles/:id - Artikel aktualisieren
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, 
      category, 
      supplierId, 
      supplierArticleNumber,
      bundleUnit,
      bundlePrice,
      content,
      contentUnit,
      pricePerUnit,
      vatRate,
      allergens,
      additives,
      ingredients,
      nutritionInfo,
      notes,
      imageUrl
    } = req.body;
    
    console.log('🔍 Aktualisiere Artikel in der Datenbank...');
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE articles 
        SET 
          name = $1, 
          category = $2, 
          supplier_id = $3, 
          supplier_article_number = $4,
          bundle_unit = $5,
          bundle_price = $6,
          content = $7,
          content_unit = $8,
          price_per_unit = $9,
          vat_rate = $10,
          allergens = $11,
          additives = $12,
          ingredients = $13,
          nutrition = $14,
          notes = $15,
          image_url = $16,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $17
        RETURNING *
      `, [
        name, 
        category || null, 
        safeParseSupplierId(supplierId), 
        supplierArticleNumber || null,
        bundleUnit || 'Stück',
        bundlePrice || 0,
        content || 1,
        contentUnit || 'Stück',
        pricePerUnit || 0,
        vatRate || 19,
        JSON.stringify(Array.isArray(allergens) ? allergens : []),
        JSON.stringify(Array.isArray(additives) ? additives : []),
        ingredients || null,
        nutritionInfo || {},
        notes || null,
        imageUrl || null,
        id
      ]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Article not found'
        });
        return;
      }
      
      console.log('✅ Artikel erfolgreich aktualisiert:', result.rows[0]);
      
      // Hole den Lieferanten-Namen, falls eine supplier_id vorhanden ist
      let articleWithSupplier = result.rows[0];
      if (result.rows[0].supplier_id) {
        try {
          const supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
          const supplierResult = await client.query(supplierQuery, [result.rows[0].supplier_id]);
          if (supplierResult.rows.length > 0) {
            const supplier = supplierResult.rows[0];
            articleWithSupplier = {
              ...result.rows[0],
              supplier: supplier.name // Füge den Lieferanten-Namen hinzu
            };
          }
        } catch (supplierError) {
          console.warn('⚠️ Konnte Lieferanten-Namen nicht abrufen:', supplierError);
          // Verwende den Artikel ohne Lieferanten-Namen
        }
      }
      
      // Konvertiere den aktualisierten Artikel in Frontend-Format
      const updatedArticle = {
        id: articleWithSupplier.id,
        name: articleWithSupplier.name,
        category: articleWithSupplier.category,
        supplierId: articleWithSupplier.supplier_id,
        supplier: articleWithSupplier.supplier, // Füge den Lieferanten-Namen hinzu
        supplierArticleNumber: articleWithSupplier.supplier_article_number,
        bundleUnit: articleWithSupplier.bundle_unit || 'Stück',
        bundlePrice: parseFloat(articleWithSupplier.bundle_price) || 0,
        content: parseFloat(articleWithSupplier.content) || 1,
        contentUnit: articleWithSupplier.content_unit || 'Stück',
        pricePerUnit: parseFloat(articleWithSupplier.price_per_unit) || 0,
        vatRate: parseFloat(articleWithSupplier.vat_rate) || 19,
        allergens: articleWithSupplier.allergens || [],
        additives: articleWithSupplier.additives || [],
        ingredients: articleWithSupplier.ingredients,
        nutritionInfo: articleWithSupplier.nutrition || {
          calories: 0,
          kilojoules: 0,
          protein: 0,
          fat: 0,
          carbohydrates: 0
        },
        notes: articleWithSupplier.notes,
        imageUrl: articleWithSupplier.image_url,
        createdAt: articleWithSupplier.created_at,
        updatedAt: articleWithSupplier.updated_at
      };
      
      res.json({
        success: true,
        data: updatedArticle,
        message: 'Article updated successfully'
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/articles/:id - Artikel löschen
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Lösche Artikel aus der Datenbank...');
    
    const pool = getTempPool();
    const client = await pool.connect();
    
    try {
      const result = await client.query('DELETE FROM articles WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Article not found'
        });
        return;
      }
      
      console.log('✅ Artikel erfolgreich gelöscht:', result.rows[0]);
      
      res.json({
        success: true,
        message: 'Article deleted successfully',
        data: result.rows[0]
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
