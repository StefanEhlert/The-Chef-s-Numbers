-- Chef Numbers Database Initialization Script (MariaDB)
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2025-10-12T18:28:28.187Z

-- Erstelle die Datenbank falls sie nicht existiert
CREATE DATABASE IF NOT EXISTS chef_numbers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chef_numbers;

-- ========================================
-- Automatisch generierte Tabellen aus TypeScript-Interfaces
-- ========================================

-- ========================================
-- Tabelle: einkaufsitems (Interface: EinkaufsItem)
-- ========================================

CREATE TABLE IF NOT EXISTS einkaufsitems (
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    id CHAR(36) NOT NULL,
    artikel_name TEXT NOT NULL,
    menge DECIMAL NULL,
    einheit TEXT NULL,
    lieferant TEXT NULL,
    preis DECIMAL NULL,
    bestelldatum DATETIME NULL,
    lieferdatum DATETIME NULL,
    status TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status ENUM('synced', 'pending', 'error', 'conflict') DEFAULT 'pending' NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indizes für einkaufsitems
CREATE INDEX idx_einkaufsitems_id ON einkaufsitems(id);
CREATE INDEX idx_einkaufsitems_created_at ON einkaufsitems(created_at);
CREATE INDEX idx_einkaufsitems_updated_at ON einkaufsitems(updated_at);

-- ========================================
-- Tabelle: suppliers (Interface: Supplier)
-- ========================================

CREATE TABLE IF NOT EXISTS suppliers (
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    id CHAR(36) NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT NULL,
    email TEXT NULL,
    website TEXT NULL,
    address JSON NULL,
    phone_numbers JSON NULL,
    notes TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status ENUM('synced', 'pending', 'error', 'conflict') DEFAULT 'pending' NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indizes für suppliers
CREATE INDEX idx_suppliers_id ON suppliers(id);
CREATE INDEX idx_suppliers_created_at ON suppliers(created_at);
CREATE INDEX idx_suppliers_updated_at ON suppliers(updated_at);

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

CREATE TABLE IF NOT EXISTS articles (
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    id CHAR(36) NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    supplier_id CHAR(36) NOT NULL,
    supplier_article_number TEXT NULL,
    bundle_unit TEXT NULL,
    bundle_price DECIMAL NULL,
    bundle_ean_code TEXT NULL,
    content DECIMAL NULL,
    content_unit TEXT NULL,
    content_ean_code TEXT NULL,
    price_per_unit DECIMAL NULL,
    vat_rate DECIMAL DEFAULT 19 NULL,
    allergens JSON NULL,
    additives JSON NULL,
    ingredients TEXT NULL,
    nutrition_info JSON NULL,
    open_food_facts_code TEXT NULL,
    notes TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status ENUM('synced', 'pending', 'error', 'conflict') DEFAULT 'pending' NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indizes für articles
CREATE INDEX idx_articles_id ON articles(id);
CREATE INDEX idx_articles_created_at ON articles(created_at);
CREATE INDEX idx_articles_updated_at ON articles(updated_at);
CREATE INDEX idx_articles_supplier_id ON articles(supplier_id);
CREATE INDEX idx_articles_category ON articles(category(100));

-- ========================================
-- Tabelle: recipes (Interface: Recipe)
-- ========================================

CREATE TABLE IF NOT EXISTS recipes (
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    id CHAR(36) NOT NULL,
    name TEXT NOT NULL,
    description TEXT NULL,
    portions DECIMAL DEFAULT 1 NULL,
    preparation_time DECIMAL NULL,
    difficulty INTEGER NULL,
    energy DECIMAL NULL,
    image TEXT NULL,
    ingredients JSON NULL,
    used_recipes JSON NULL,
    preparation_steps JSON NULL,
    material_costs DECIMAL NULL,
    markup_percentage DECIMAL DEFAULT 300 NULL,
    vat_rate DECIMAL DEFAULT 19 NULL,
    selling_price DECIMAL NULL,
    total_nutrition_info JSON NULL,
    allergens JSON NULL,
    notes TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status ENUM('synced', 'pending', 'error', 'conflict') DEFAULT 'pending' NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indizes für recipes
CREATE INDEX idx_recipes_id ON recipes(id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);
CREATE INDEX idx_recipes_updated_at ON recipes(updated_at);

-- ========================================
-- Tabelle: inventuritems (Interface: InventurItem)
-- ========================================

CREATE TABLE IF NOT EXISTS inventuritems (
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    id CHAR(36) NOT NULL,
    artikel_name TEXT NOT NULL,
    kategorie TEXT NOT NULL,
    soll_bestand DECIMAL NULL,
    ist_bestand DECIMAL NULL,
    einheit TEXT NULL,
    preis DECIMAL NULL,
    inventur_datum DATETIME NULL,
    differenz DECIMAL NULL,
    bemerkung TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status ENUM('synced', 'pending', 'error', 'conflict') DEFAULT 'pending' NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indizes für inventuritems
CREATE INDEX idx_inventuritems_id ON inventuritems(id);
CREATE INDEX idx_inventuritems_created_at ON inventuritems(created_at);
CREATE INDEX idx_inventuritems_updated_at ON inventuritems(updated_at);

-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id CHAR(36) PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Design-Tabelle für UI-Einstellungen
CREATE TABLE IF NOT EXISTS design (
    id CHAR(36) PRIMARY KEY,
    theme VARCHAR(50) DEFAULT 'light',
    primary_color VARCHAR(7) DEFAULT '#007bff',
    secondary_color VARCHAR(7) DEFAULT '#6c757d',
    accent_color VARCHAR(7) DEFAULT '#28a745',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#212529',
    card_color VARCHAR(7) DEFAULT '#f8f9fa',
    border_color VARCHAR(7) DEFAULT '#dee2e6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping List Tabelle
CREATE TABLE IF NOT EXISTS shopping_list (
    id CHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    items JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Tabelle
CREATE TABLE IF NOT EXISTS inventory (
    id CHAR(36) PRIMARY KEY,
    article_id CHAR(36),
    quantity DECIMAL(10,3) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Stück',
    expiry_date DATE,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Füge System-Informationen hinzu (mit aktualisierter Schema-Version)
-- MariaDB/MySQL benötigt explizite UUIDs für id-Feld
INSERT INTO system_info (id, `key`, value, description) VALUES 
    (UUID(), 'app_name', 'The Chef''s Numbers', 'Name der Anwendung'),
    (UUID(), 'version', '2.2.2', 'Aktuelle Version'),
    (UUID(), 'database_created', NOW(), 'Datum der Datenbankerstellung'),
    (UUID(), 'connection_tested_at', NOW(), 'Letzter Verbindungstest'),
    (UUID(), 'mariadb_version', '2.2.2', 'MariaDB Frontend-synchronisiert Version'),
    (UUID(), 'setup_completed', 'true', 'Initial Setup abgeschlossen'),
    (UUID(), 'schema_version', '2.2.2', 'Frontend-synchronisiertes Schema - Version 2.2.2')
ON DUPLICATE KEY UPDATE 
    value = VALUES(value),
    updated_at = CURRENT_TIMESTAMP;

-- Erfolgsmeldung
SELECT 'MariaDB-Initialisierung erfolgreich abgeschlossen!' as status;
SELECT 'Frontend-synchronisiertes Schema v2.2.2 installiert' as schema_info;
