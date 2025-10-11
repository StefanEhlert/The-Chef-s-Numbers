"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
function safeParseSupplierId(supplierId) {
    if (supplierId === null || supplierId === undefined || supplierId === '') {
        return null;
    }
    if (typeof supplierId === 'number') {
        return supplierId;
    }
    if (typeof supplierId === 'string') {
        const parsed = parseInt(supplierId.trim());
        return isNaN(parsed) ? null : parsed;
    }
    return null;
}
const router = (0, express_1.Router)();
function getTempPool() {
    return new pg_1.Pool({
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
router.get('/test', async (_req, res) => {
    try {
        console.log('🔍 Teste Datenbankverbindung...');
        const pool = getTempPool();
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT 1 as test');
            console.log('✅ Datenbankverbindung erfolgreich:', result.rows[0]);
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
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('❌ Datenbankverbindung fehlgeschlagen:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/', async (_req, res) => {
    try {
        console.log('🔍 Lade alle Artikel aus der Datenbank...');
        const pool = getTempPool();
        const client = await pool.connect();
        try {
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
            if (result.rows.length > 0) {
                console.log('🔍 Erster Artikel aus der Datenbank:', JSON.stringify(result.rows[0], null, 2));
            }
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
                tableStructure: tableInfo.rows
            });
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('❌ Fehler beim Laden der Artikel:', error);
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
router.post('/check-duplicate', async (req, res) => {
    try {
        console.log('🔍 POST /api/v1/articles/check-duplicate - Prüfe Duplikat');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        const { name, supplierId, supplierArticleNumber, supplierName } = req.body;
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
            let params = [];
            if (supplierId) {
                query = `
          SELECT id, name, supplier_id, supplier_article_number, 
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1) AND supplier_id = $2
        `;
                params = [name, supplierId];
            }
            else if (supplierName) {
                query = `
          SELECT a.id, a.name, a.supplier_id, a.supplier_article_number, s.name as supplier_name
          FROM articles a
          JOIN suppliers s ON a.supplier_id = s.id
          WHERE LOWER(a.name) = LOWER($1) AND LOWER(s.name) = LOWER($2)
        `;
                params = [name, supplierName];
            }
            else {
                query = `
          SELECT id, name, supplier_id, supplier_article_number,
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1)
        `;
                params = [name];
            }
            if (supplierArticleNumber) {
                let articleNumberQuery = '';
                let articleNumberParams = [];
                if (supplierId) {
                    articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1) AND supplier_id = $2
          `;
                    articleNumberParams = [supplierArticleNumber, supplierId];
                }
                else if (supplierName) {
                    articleNumberQuery = `
            SELECT a.id, a.name, a.supplier_id, a.supplier_article_number, s.name as supplier_name
            FROM articles a
            JOIN suppliers s ON a.supplier_id = s.id
            WHERE LOWER(a.supplier_article_number) = LOWER($1) AND LOWER(s.name) = LOWER($2)
          `;
                    articleNumberParams = [supplierArticleNumber, supplierName];
                }
                else {
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
            }
            else {
                console.log('✅ Kein Duplikat gefunden');
                res.json({
                    success: true,
                    isDuplicate: false,
                    message: 'Artikel kann gespeichert werden'
                });
            }
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('❌ Fehler bei der Duplikat-Prüfung:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Duplikat-Prüfung',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/smart-save-test', async (_req, res) => {
    try {
        console.log('🔍 GET /api/v1/articles/smart-save-test - Test Route');
        res.json({
            success: true,
            message: 'Smart-save route is available',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Fehler in smart-save-test:', error);
        res.status(500).json({
            success: false,
            message: 'Test route failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/initialize-database', async (req, res) => {
    try {
        console.log('🔍 POST /api/v1/articles/initialize-database - Zentrale Datenbank-Initialisierung');
        const { config } = req.body;
        const postgresConfig = config || {
            host: process.env['DB_HOST'] || '192.168.1.7',
            port: parseInt(process.env['DB_PORT'] || '5432'),
            database: process.env['DB_NAME'] || 'chef_numbers',
            username: process.env['DB_USER'] || 'chef',
            password: process.env['DB_PASSWORD'] || 'password'
        };
        const { PostgresService } = await Promise.resolve().then(() => __importStar(require('../services/postgresService')));
        const postgresService = new PostgresService();
        const results = {
            connection: null,
            schema: null,
            overall: { success: false, message: '', errors: [] }
        };
        try {
            console.log('🔍 Teste Datenbankverbindung...');
            results.connection = await postgresService.testConnection(postgresConfig);
            if (!results.connection.success) {
                results.overall.errors.push(`Verbindung fehlgeschlagen: ${results.connection.message}`);
                throw new Error(`Datenbankverbindung fehlgeschlagen: ${results.connection.message}`);
            }
            console.log('✅ Datenbankverbindung erfolgreich');
            console.log('🔍 Führe Schema-Migration durch...');
            results.schema = await postgresService.checkAndUpdateSchema(postgresConfig);
            if (!results.schema.success) {
                results.overall.errors.push(`Schema-Migration fehlgeschlagen: ${results.schema.message}`);
                throw new Error(`Schema-Migration fehlgeschlagen: ${results.schema.message}`);
            }
            console.log('✅ Schema-Migration erfolgreich');
            results.overall.success = true;
            results.overall.message = 'Datenbank erfolgreich initialisiert';
            if (results.schema.changes && results.schema.changes.length > 0) {
                results.overall.message += ` (${results.schema.changes.length} Änderungen durchgeführt)`;
            }
        }
        catch (error) {
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
    }
    catch (error) {
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
router.post('/migrate-schema', async (_req, res) => {
    try {
        console.log('🔍 POST /api/v1/articles/migrate-schema - Automatische Schema-Migration');
        const config = {
            host: process.env['DB_HOST'] || '192.168.1.7',
            port: parseInt(process.env['DB_PORT'] || '5432'),
            database: process.env['DB_NAME'] || 'chef_numbers',
            username: process.env['DB_USER'] || 'chef',
            password: process.env['DB_PASSWORD'] || 'password'
        };
        const { PostgresService } = await Promise.resolve().then(() => __importStar(require('../services/postgresService')));
        const postgresService = new PostgresService();
        const result = await postgresService.checkAndUpdateSchema(config);
        res.json({
            success: result.success,
            message: result.message,
            changes: result.changes
        });
    }
    catch (error) {
        console.error('❌ Fehler bei der Schema-Migration:', error);
        res.status(500).json({
            success: false,
            message: 'Schema-Migration fehlgeschlagen',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/smart-save', async (req, res) => {
    try {
        console.log('🔍 POST /api/v1/articles/smart-save - Intelligente Speicherung');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        const { id, name, category, supplierId, supplierArticleNumber, bundleUnit, bundlePrice, bundleEanCode, content, contentUnit, contentEanCode, pricePerUnit, vatRate, allergens, additives, ingredients, nutritionInfo, notes, imageUrl } = req.body;
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
        const safeAllergens = Array.isArray(allergens) ? allergens : [];
        const safeAdditives = Array.isArray(additives) ? additives : [];
        console.log('🔍 Debug - safeAllergens:', safeAllergens);
        console.log('🔍 Debug - safeAdditives:', safeAdditives);
        const safeNutritionInfo = nutritionInfo && typeof nutritionInfo === 'object' ? nutritionInfo : null;
        console.log('🔍 Debug - nutritionInfo Typ:', typeof nutritionInfo, 'Wert:', nutritionInfo);
        console.log('🔍 Debug - safeNutritionInfo:', safeNutritionInfo);
        const allergensJson = JSON.stringify(safeAllergens);
        const additivesJson = JSON.stringify(safeAdditives);
        console.log('🔍 Debug - allergensJson:', allergensJson);
        console.log('🔍 Debug - additivesJson:', additivesJson);
        const pool = getTempPool();
        const client = await pool.connect();
        try {
            console.log('🔍 Prüfe auf Duplikate vor dem Speichern...');
            let duplicateQuery = '';
            let duplicateParams = [];
            if (safeParseSupplierId(supplierId)) {
                duplicateQuery = `
          SELECT id, name, supplier_id, supplier_article_number, 
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1) AND supplier_id = $2
        `;
                duplicateParams = [name, safeParseSupplierId(supplierId)];
            }
            else {
                duplicateQuery = `
          SELECT id, name, supplier_id, supplier_article_number,
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1)
        `;
                duplicateParams = [name];
            }
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
            if (supplierArticleNumber) {
                let articleNumberQuery = '';
                let articleNumberParams = [];
                if (safeParseSupplierId(supplierId)) {
                    articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1) AND supplier_id = $2
          `;
                    articleNumberParams = [supplierArticleNumber, safeParseSupplierId(supplierId)];
                }
                else {
                    articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1)
          `;
                    articleNumberParams = [supplierArticleNumber];
                }
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
            console.log('✅ Kein Duplikat gefunden - speichere Artikel...');
            let query = '';
            let params = [];
            if (id) {
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
            }
            else {
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
                let articleWithSupplier = savedArticle;
                if (savedArticle.supplier_id) {
                    try {
                        const supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
                        const supplierResult = await client.query(supplierQuery, [savedArticle.supplier_id]);
                        if (supplierResult.rows.length > 0) {
                            const supplier = supplierResult.rows[0];
                            articleWithSupplier = {
                                ...savedArticle,
                                supplier: supplier.name,
                                supplierId: savedArticle.supplier_id
                            };
                        }
                    }
                    catch (supplierError) {
                        console.warn('⚠️ Konnte Lieferanten-Namen nicht abrufen:', supplierError);
                    }
                }
                const createdArticle = {
                    id: articleWithSupplier.id,
                    name: articleWithSupplier.name,
                    category: articleWithSupplier.category,
                    supplierId: articleWithSupplier.supplier_id,
                    supplier: articleWithSupplier.supplier,
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
                    nutritionInfo: articleWithSupplier.nutrition || {},
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
            }
            else {
                console.log('❌ Artikel konnte nicht gespeichert werden');
                res.status(500).json({
                    success: false,
                    message: 'Artikel konnte nicht gespeichert werden'
                });
            }
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('❌ Fehler bei der intelligenten Speicherung:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Speicherung',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        console.log('🔍 POST /api/v1/articles - Neuer Artikel wird erstellt');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        const { name, category, supplierId, supplierArticleNumber, bundleUnit, bundlePrice, content, contentUnit, pricePerUnit, vatRate, allergens, additives, ingredients, nutritionInfo, notes, imageUrl } = req.body;
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
            console.log('🔍 Prüfe auf Duplikate vor dem Speichern...');
            let duplicateQuery = '';
            let duplicateParams = [];
            if (safeParseSupplierId(supplierId)) {
                duplicateQuery = `
          SELECT id, name, supplier_id, supplier_article_number, 
                 (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
          FROM articles 
          WHERE LOWER(name) = LOWER($1) AND supplier_id = $2
        `;
                duplicateParams = [name, safeParseSupplierId(supplierId)];
            }
            else {
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
            if (supplierArticleNumber) {
                let articleNumberQuery = '';
                let articleNumberParams = [];
                if (safeParseSupplierId(supplierId)) {
                    articleNumberQuery = `
            SELECT id, name, supplier_id, supplier_article_number,
                   (SELECT name FROM suppliers WHERE id = articles.supplier_id) as supplier_name
            FROM articles 
            WHERE LOWER(supplier_article_number) = LOWER($1) AND supplier_id = $2
          `;
                    articleNumberParams = [supplierArticleNumber, safeParseSupplierId(supplierId)];
                }
                else {
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
            let articleWithSupplier = result.rows[0];
            if (result.rows[0].supplier_id) {
                try {
                    const supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
                    const supplierResult = await client.query(supplierQuery, [result.rows[0].supplier_id]);
                    if (supplierResult.rows.length > 0) {
                        const supplier = supplierResult.rows[0];
                        articleWithSupplier = {
                            ...result.rows[0],
                            supplier: supplier.name
                        };
                    }
                }
                catch (supplierError) {
                    console.warn('⚠️ Konnte Lieferanten-Namen nicht abrufen:', supplierError);
                }
            }
            console.log('🔍 articleWithSupplier:', articleWithSupplier);
            console.log('🔍 allergens Typ:', typeof articleWithSupplier.allergens, 'Wert:', articleWithSupplier.allergens);
            console.log('🔍 additives Typ:', typeof articleWithSupplier.additives, 'Wert:', articleWithSupplier.additives);
            const createdArticle = {
                id: articleWithSupplier.id,
                name: articleWithSupplier.name,
                category: articleWithSupplier.category,
                supplierId: articleWithSupplier.supplier_id,
                supplier: articleWithSupplier.supplier,
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
        }
        finally {
            console.log('🔍 Schließe Datenbank-Verbindung...');
            client.release();
            await pool.end();
            console.log('✅ Datenbank-Verbindung geschlossen');
        }
    }
    catch (error) {
        console.error('❌ Fehler beim Erstellen des Artikels:', error);
        console.error('❌ Fehler-Details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error?.code,
            detail: error?.detail,
            hint: error?.hint,
            position: error?.position
        });
        res.status(500).json({
            success: false,
            message: 'Failed to create article',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: {
                code: error?.code,
                detail: error?.detail,
                hint: error?.hint
            }
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, supplierId, supplierArticleNumber, bundleUnit, bundlePrice, content, contentUnit, pricePerUnit, vatRate, allergens, additives, ingredients, nutritionInfo, notes, imageUrl } = req.body;
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
            let articleWithSupplier = result.rows[0];
            if (result.rows[0].supplier_id) {
                try {
                    const supplierQuery = 'SELECT id, name FROM suppliers WHERE id = $1';
                    const supplierResult = await client.query(supplierQuery, [result.rows[0].supplier_id]);
                    if (supplierResult.rows.length > 0) {
                        const supplier = supplierResult.rows[0];
                        articleWithSupplier = {
                            ...result.rows[0],
                            supplier: supplier.name
                        };
                    }
                }
                catch (supplierError) {
                    console.warn('⚠️ Konnte Lieferanten-Namen nicht abrufen:', supplierError);
                }
            }
            const updatedArticle = {
                id: articleWithSupplier.id,
                name: articleWithSupplier.name,
                category: articleWithSupplier.category,
                supplierId: articleWithSupplier.supplier_id,
                supplier: articleWithSupplier.supplier,
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
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update article',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/:id', async (req, res) => {
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
        }
        finally {
            client.release();
            await pool.end();
        }
    }
    catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete article',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=articles.js.map