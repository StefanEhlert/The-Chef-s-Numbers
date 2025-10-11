"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = testConnection;
exports.initializeDatabase = initializeDatabase;
exports.getPool = getPool;
exports.closeDatabase = closeDatabase;
const pg_1 = require("pg");
function getDbConfig() {
    return {
        host: process.env['DB_HOST'] || 'postgres',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        database: process.env['DB_NAME'] || 'chef_numbers',
        user: process.env['DB_USER'] || 'chef',
        password: process.env['DB_PASSWORD'] || 'password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
    };
}
let pool = null;
function getPool() {
    if (!pool) {
        pool = new pg_1.Pool(getDbConfig());
    }
    return pool;
}
async function testConnection() {
    try {
        const client = await getPool().connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('Database connection test successful:', result.rows[0]);
        return true;
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}
async function initializeDatabase() {
    try {
        const client = await getPool().connect();
        await createTables(client);
        client.release();
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}
async function createTables(client) {
    await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await client.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      unit VARCHAR(20),
      net_price DECIMAL(10,2),
      gross_price DECIMAL(10,2),
      vat_rate DECIMAL(5,2) DEFAULT 19.00,
      supplier_id INTEGER REFERENCES suppliers(id),
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await client.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      preparation_time INTEGER,
      cooking_time INTEGER,
      servings INTEGER,
      difficulty VARCHAR(20),
      category VARCHAR(100),
      net_price DECIMAL(10,2),
      gross_price DECIMAL(10,2),
      selling_price DECIMAL(10,2),
      markup_percentage DECIMAL(5,2),
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await client.query(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id SERIAL PRIMARY KEY,
      recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
      article_id INTEGER REFERENCES articles(id),
      quantity DECIMAL(10,3) NOT NULL,
      unit VARCHAR(20),
      net_price DECIMAL(10,2),
      gross_price DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await client.query(`
    CREATE TABLE IF NOT EXISTS recipe_steps (
      id SERIAL PRIMARY KEY,
      recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await client.query(`
    CREATE TABLE IF NOT EXISTS images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      bucket_name VARCHAR(100) NOT NULL,
      object_key VARCHAR(500) NOT NULL,
      url VARCHAR(500),
      entity_type VARCHAR(50) NOT NULL, -- 'recipe', 'article', 'user'
      entity_id UUID NOT NULL,
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await client.query(`
    CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
    CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
    CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
  `);
    console.log('Database tables created successfully');
}
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
//# sourceMappingURL=connection.js.map