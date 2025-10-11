-- 🍴 The Chef's Numbers - Supabase Schema
-- Führen Sie dieses SQL-Skript in Supabase aus: SQL Editor → New query

-- 1. Tabelle für Artikel
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  supplier_id TEXT,
  net_price DECIMAL(10,2),
  gross_price DECIMAL(10,2),
  vat_rate DECIMAL(5,2) DEFAULT 19.00,
  unit TEXT DEFAULT 'Stück',
  min_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  allergens TEXT[],
  additives TEXT[],
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabelle für Lieferanten
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone_numbers TEXT[],
  address_street TEXT,
  address_zip_code TEXT,
  address_city TEXT,
  address_country TEXT DEFAULT 'Deutschland',
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabelle für Rezepte
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  portions INTEGER DEFAULT 1,
  ingredients JSONB,
  preparation_steps TEXT[],
  material_costs DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  energy_kcal INTEGER DEFAULT 0,
  energy_kj INTEGER DEFAULT 0,
  allergens TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified_by TEXT DEFAULT 'Benutzer'
);

-- 4. Tabelle für Einkaufsliste
CREATE TABLE IF NOT EXISTS einkauf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'Stück',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabelle für Inventur
CREATE TABLE IF NOT EXISTS inventur (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT,
  counted_quantity DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'Stück',
  notes TEXT,
  counted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  counted_by TEXT DEFAULT 'Benutzer'
);

-- 6. Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_articles_name ON articles(name);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_einkauf_article_id ON einkauf(article_id);
CREATE INDEX IF NOT EXISTS idx_inventur_article_id ON inventur(article_id);

-- 7. Row Level Security (RLS) aktivieren
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE einkauf ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventur ENABLE ROW LEVEL SECURITY;

-- 8. Policies für öffentlichen Zugriff (Demo-Zwecke)
-- WICHTIG: Für Produktionsumgebungen sollten Sie restriktivere Policies verwenden!

CREATE POLICY "Public access for articles" ON articles
  FOR ALL USING (true);

CREATE POLICY "Public access for suppliers" ON suppliers
  FOR ALL USING (true);

CREATE POLICY "Public access for recipes" ON recipes
  FOR ALL USING (true);

CREATE POLICY "Public access for einkauf" ON einkauf
  FOR ALL USING (true);

CREATE POLICY "Public access for inventur" ON inventur
  FOR ALL USING (true);

-- 9. Storage Bucket für Bilder (Optional - manuell in Supabase UI erstellen)
-- Gehen Sie zu Storage → Create bucket → Name: "images" → Public bucket: Yes

-- ✅ Schema-Erstellung abgeschlossen!
-- Führen Sie nun die App aus und testen Sie die Verbindung erneut.
