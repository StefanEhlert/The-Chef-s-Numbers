-- Schema Migration: UUID zu INTEGER für Chef's Numbers
-- Führt die Migration von UUID zu SERIAL/INTEGER durch

-- 1. Sichere existierende Daten (falls vorhanden)
CREATE TABLE IF NOT EXISTS articles_backup AS SELECT * FROM articles;
CREATE TABLE IF NOT EXISTS suppliers_backup AS SELECT * FROM suppliers;
CREATE TABLE IF NOT EXISTS recipes_backup AS SELECT * FROM recipes;

-- 2. Lösche alte Tabellen (mit CASCADE um Abhängigkeiten zu lösen)
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_steps CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;

-- 3. Erstelle neue Tabellen mit korrektem Schema

-- Suppliers mit SERIAL PRIMARY KEY
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Articles mit SERIAL PRIMARY KEY und INTEGER supplier_id
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(20),
  net_price DECIMAL(10,2),
  gross_price DECIMAL(10,2),
  vat_rate DECIMAL(5,2) DEFAULT 19.00,
  supplier_id INTEGER REFERENCES suppliers(id),
  supplier_article_number VARCHAR(100),
  bundle_unit VARCHAR(50) DEFAULT 'Stück',
  bundle_price DECIMAL(10,2) DEFAULT 0,
  content DECIMAL(10,3) DEFAULT 1,
  content_unit VARCHAR(50) DEFAULT 'Stück',
  price_per_unit DECIMAL(10,2) DEFAULT 0,
  allergens JSONB DEFAULT '[]',
  additives JSONB DEFAULT '[]',
  ingredients TEXT,
  nutrition JSONB DEFAULT '{}',
  notes TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes mit SERIAL PRIMARY KEY
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  preparation_time INTEGER,
  cooking_time INTEGER,
  servings INTEGER,
  difficulty VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe ingredients mit INTEGER Referenzen
CREATE TABLE recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe steps mit INTEGER Referenzen
CREATE TABLE recipe_steps (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases mit INTEGER Referenzen
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory mit INTEGER Referenzen
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  last_count_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images mit INTEGER Referenzen
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  path VARCHAR(500) NOT NULL,
  article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System info
CREATE TABLE system_info (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Erstelle Indizes für bessere Performance
CREATE INDEX idx_articles_supplier_id ON articles(supplier_id);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_article_id ON recipe_ingredients(article_id);
CREATE INDEX idx_purchases_article_id ON purchases(article_id);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_inventory_article_id ON inventory(article_id);
CREATE INDEX idx_images_article_id ON images(article_id);
CREATE INDEX idx_images_recipe_id ON images(recipe_id);

-- 5. Setze Sequenzen zurück (falls Daten migriert werden)
-- SELECT setval('suppliers_id_seq', 1, false);
-- SELECT setval('articles_id_seq', 1, false);
-- SELECT setval('recipes_id_seq', 1, false);

COMMIT;
