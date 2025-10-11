-- Chef Numbers Database Initialization Script (MariaDB)
-- Frontend-synchronisiertes Schema v2.0.0

-- Erstelle die Datenbank falls sie nicht existiert
CREATE DATABASE IF NOT EXISTS chef_numbers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chef_numbers;

-- Erstelle die articles-Tabelle (harmonisiert mit Frontend)
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    supplier_id VARCHAR(36),
    supplier_article_number TEXT,
    bundle_unit TEXT,
    bundle_price DECIMAL(10,2),
    bundle_ean_code TEXT,
    content DECIMAL(10,3),
    content_unit TEXT,
    content_ean_code TEXT,
    price_per_unit DECIMAL(10,4),
    vat_rate DECIMAL(5,2) DEFAULT 19.00,
    allergens JSON,
    additives JSON,
    ingredients TEXT,
    nutrition_info JSON,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    last_modified_by TEXT
);

-- Erstelle die suppliers-Tabelle (harmonisiert mit Frontend)
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    website TEXT,
    address JSON,
    phone_numbers JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    last_modified_by TEXT
);

-- Erstelle die recipes-Tabelle (harmonisiert mit Frontend)
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    portions INT DEFAULT 1,
    preparation_time INT DEFAULT 0,
    difficulty INT DEFAULT 1,
    ingredients JSON,
    used_recipes JSON,
    preparation_steps JSON,
    material_costs DECIMAL(10,2) DEFAULT 0,
    markup_percentage DECIMAL(5,2) DEFAULT 300.00,
    vat_rate DECIMAL(5,2) DEFAULT 19.00,
    selling_price DECIMAL(10,2) DEFAULT 0,
    total_nutrition_info JSON,
    allergens JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    last_modified_by TEXT
);

-- Erstelle die design-Tabelle
CREATE TABLE IF NOT EXISTS design (
    id VARCHAR(36) PRIMARY KEY,
    template_name VARCHAR(100),
    colors JSON,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    last_modified_by TEXT
);

-- Erstelle die shopping_list-Tabelle (umbenannt von einkauf)
CREATE TABLE IF NOT EXISTS shopping_list (
    id VARCHAR(36) PRIMARY KEY,
    article_id VARCHAR(36),
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'Stück',
    priority TEXT DEFAULT 'normal',
    notes TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Erstelle die inventory-Tabelle (umbenannt von inventur)
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY,
    article_id VARCHAR(36),
    counted_quantity DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'Stück',
    notes TEXT,
    counted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    counted_by TEXT DEFAULT 'Benutzer'
);

-- Erstelle die system_info-Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id VARCHAR(36) PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX idx_articles_name ON articles(name(255));
CREATE INDEX idx_articles_category ON articles(category(255));
CREATE INDEX idx_articles_supplier_id ON articles(supplier_id);
CREATE INDEX idx_suppliers_name ON suppliers(name(255));
CREATE INDEX idx_suppliers_email ON suppliers(email(255));
CREATE INDEX idx_recipes_name ON recipes(name(255));
CREATE INDEX idx_recipes_created_at ON recipes(created_at);
CREATE INDEX idx_shopping_list_article_id ON shopping_list(article_id);
CREATE INDEX idx_shopping_list_completed ON shopping_list(completed);
CREATE INDEX idx_inventory_article_id ON inventory(article_id);
CREATE INDEX idx_inventory_counted_at ON inventory(counted_at);

-- Füge System-Informationen hinzu
INSERT INTO system_info (id, `key`, value, description) VALUES 
    (UUID(), 'app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
    (UUID(), 'version', '2.0.0', 'Aktuelle Version'),
    (UUID(), 'database_created', NOW(), 'Datum der Datenbankerstellung'),
    (UUID(), 'connection_tested_at', NOW(), 'Letzter Verbindungstest'),
    (UUID(), 'mariadb_version', '2.0.0', 'MariaDB Frontend-synchronisiert Version'),
    (UUID(), 'setup_completed', 'true', 'Initial Setup abgeschlossen'),
    (UUID(), 'schema_version', '2.0.0', 'Frontend-synchronisiertes Schema')
ON DUPLICATE KEY UPDATE 
    value = VALUES(value),
    updated_at = NOW();

-- Erfolgsmeldung
SELECT 'MariaDB-Initialisierung erfolgreich abgeschlossen!' as status;
SELECT 'Frontend-synchronisiertes Schema v2.0.0 installiert' as schema_info;