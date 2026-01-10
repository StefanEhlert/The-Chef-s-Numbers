-- Chef Numbers Database Initialization Script (MariaDB)
-- Frontend-synchronisiertes Schema v2.2.2
-- Automatisch generiert am: 2026-01-09T13:47:35.268Z

-- Erstelle die Datenbank falls sie nicht existiert
CREATE DATABASE IF NOT EXISTS chef_numbers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chef_numbers;

-- ========================================
-- Automatisch generierte Tabellen aus TypeScript-Interfaces
-- ========================================

-- ========================================
-- Tabelle: accountingaccounts (Interface: AccountingAccount)
-- ========================================

CREATE TABLE IF NOT EXISTS accountingaccounts (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    chart_id TEXT NULL,
    template_id TEXT NULL,
    code TEXT NULL,
    number TEXT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    vat_tag TEXT NULL,
    origin TEXT NULL,
    status TEXT NULL,
    notes TEXT NULL,
    parent_id TEXT NULL,
    path JSON NULL,
    sort_order DECIMAL NULL,
    type TEXT NULL,
    is_leaf BOOLEAN NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabelle: accountingsettings (Interface: AccountingSettings)
-- ========================================

CREATE TABLE IF NOT EXISTS accountingsettings (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    selected_chart_id TEXT NULL,
    customizations_enabled BOOLEAN NULL,
    ocr_api_configs TEXT NULL,
    vat_rates TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabelle: suppliers (Interface: Supplier)
-- ========================================

CREATE TABLE IF NOT EXISTS suppliers (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT NULL,
    email TEXT NULL,
    website TEXT NULL,
    address JSON NULL,
    phone_numbers JSON NULL,
    notes TEXT NULL,
    netto_prices BOOLEAN NULL,
    recognized_names JSON NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabelle: unitentitys (Interface: UnitEntity)
-- ========================================

CREATE TABLE IF NOT EXISTS unitentitys (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabelle: categoryentitys (Interface: CategoryEntity)
-- ========================================

CREATE TABLE IF NOT EXISTS categoryentitys (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabelle: articles (Interface: Article)
-- ========================================

CREATE TABLE IF NOT EXISTS articles (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    names_o_c_r JSON NULL,
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
    accounting_account_number TEXT NULL,
    allergens JSON NULL,
    additives JSON NULL,
    ingredients TEXT NULL,
    nutrition_info JSON NULL,
    alcohol DECIMAL NULL,
    open_food_facts_code TEXT NULL,
    price_per_unit_history JSON NULL,
    notes TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabelle: recipes (Interface: Recipe)
-- ========================================

CREATE TABLE IF NOT EXISTS recipes (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
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
    selling_price_history JSON NULL,
    total_nutrition_info JSON NULL,
    alcohol DECIMAL NULL,
    allergens JSON NULL,
    ingredients_text TEXT NULL,
    notes TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabelle: receipts (Interface: Receipt)
-- ========================================

CREATE TABLE IF NOT EXISTS receipts (
    id CHAR(36) NOT NULL,
    db_id CHAR(36) PRIMARY KEY NOT NULL,
    supplier_id CHAR(36) NULL,
    booking_number TEXT NULL,
    receipt_date TEXT NULL,
    receipt_number TEXT NULL,
    receipt_details JSON NULL,
    due_date TEXT NULL,
    payment_status TEXT NULL,
    line_item_count DECIMAL NULL,
    accounting TEXT NULL,
    is_completed BOOLEAN NULL,
    notes TEXT NULL,
    ocr_result TEXT NULL,
    ocr_provider TEXT NULL,
    receipt_image_path TEXT NULL,
    processed_ocr_data TEXT NULL,
    is_dirty BOOLEAN DEFAULT false NULL,
    is_new BOOLEAN DEFAULT false NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    created_by CHAR(36) NULL,
    updated_by CHAR(36) NULL,
    last_modified_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System-Info Tabelle
CREATE TABLE IF NOT EXISTS system_info (
    id CHAR(36) PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ========================================
-- ALTER-Statements für alle Tabellen (Idempotent)
-- Führt für jede Spalte eine Prüfung durch und fügt sie hinzu falls nicht vorhanden
-- ========================================

-- Prüfe und füge Spalten für accountingaccounts hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: chart_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'chart_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN chart_id ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: template_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'template_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN template_id ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: code
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'code';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN code ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: number
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'number';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN number ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: name
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'name';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN name ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: category
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'category';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN category ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: vat_tag
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'vat_tag';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN vat_tag ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: origin
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'origin';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN origin ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN status ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: notes
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'notes';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN notes ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: parent_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'parent_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN parent_id ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: path
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'path';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN path ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sort_order
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'sort_order';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN sort_order ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: type
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'type';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN type ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_leaf
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'is_leaf';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN is_leaf ', 'BOOLEAN', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE accountingaccounts MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE accountingaccounts ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE accountingaccounts MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE accountingaccounts ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingaccounts ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Prüfe und füge Spalten für accountingsettings hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: selected_chart_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'selected_chart_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN selected_chart_id ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: customizations_enabled
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'customizations_enabled';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN customizations_enabled ', 'BOOLEAN', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: ocr_api_configs
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'ocr_api_configs';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN ocr_api_configs ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: vat_rates
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'vat_rates';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN vat_rates ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE accountingsettings MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE accountingsettings ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE accountingsettings MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE accountingsettings ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE accountingsettings ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Prüfe und füge Spalten für suppliers hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: name
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'name';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN name ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: contact_person
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'contact_person';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN contact_person ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: email
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'email';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN email ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: website
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'website';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN website ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: address
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'address';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN address ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: phone_numbers
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'phone_numbers';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN phone_numbers ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: notes
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'notes';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN notes ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: netto_prices
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'netto_prices';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN netto_prices ', 'BOOLEAN', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: recognized_names
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'recognized_names';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN recognized_names ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE suppliers MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE suppliers ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE suppliers MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE suppliers ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE suppliers ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Prüfe und füge Spalten für unitentitys hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: name
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'name';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN name ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: description
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'description';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN description ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE unitentitys MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE unitentitys ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE unitentitys MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE unitentitys ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE unitentitys ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Prüfe und füge Spalten für categoryentitys hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: name
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'name';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN name ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: description
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'description';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN description ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE categoryentitys MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE categoryentitys ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE categoryentitys MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE categoryentitys ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE categoryentitys ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Prüfe und füge Spalten für articles hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: name
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'name';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN name ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: names_o_c_r
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'names_o_c_r';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN names_o_c_r ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: category
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'category';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN category ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: supplier_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'supplier_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN supplier_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: supplier_article_number
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'supplier_article_number';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN supplier_article_number ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: bundle_unit
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'bundle_unit';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN bundle_unit ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: bundle_price
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'bundle_price';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN bundle_price ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: bundle_ean_code
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'bundle_ean_code';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN bundle_ean_code ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: content
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'content';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN content ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: content_unit
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'content_unit';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN content_unit ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: content_ean_code
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'content_ean_code';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN content_ean_code ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: price_per_unit
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'price_per_unit';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN price_per_unit ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: accounting_account_number
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'accounting_account_number';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN accounting_account_number ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: allergens
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'allergens';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN allergens ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: additives
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'additives';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN additives ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: ingredients
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'ingredients';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN ingredients ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: nutrition_info
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'nutrition_info';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN nutrition_info ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: alcohol
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'alcohol';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN alcohol ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: open_food_facts_code
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'open_food_facts_code';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN open_food_facts_code ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: price_per_unit_history
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'price_per_unit_history';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN price_per_unit_history ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: notes
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'notes';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN notes ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE articles MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE articles ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE articles MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE articles ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE articles ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Prüfe und füge Spalten für recipes hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: name
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'name';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN name ', 'TEXT', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: description
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'description';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN description ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: portions
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'portions';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN portions ', 'DECIMAL', ' ', 'DEFAULT 1', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: preparation_time
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'preparation_time';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN preparation_time ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: difficulty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'difficulty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN difficulty ', 'INTEGER', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: energy
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'energy';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN energy ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: image
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'image';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN image ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: ingredients
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'ingredients';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN ingredients ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: used_recipes
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'used_recipes';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN used_recipes ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: preparation_steps
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'preparation_steps';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN preparation_steps ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: material_costs
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'material_costs';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN material_costs ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: markup_percentage
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'markup_percentage';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN markup_percentage ', 'DECIMAL', ' ', 'DEFAULT 300', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: vat_rate
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'vat_rate';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN vat_rate ', 'DECIMAL', ' ', 'DEFAULT 19', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: selling_price
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'selling_price';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN selling_price ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: selling_price_history
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'selling_price_history';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN selling_price_history ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: total_nutrition_info
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'total_nutrition_info';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN total_nutrition_info ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: alcohol
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'alcohol';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN alcohol ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: allergens
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'allergens';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN allergens ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: ingredients_text
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'ingredients_text';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN ingredients_text ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: notes
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'notes';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN notes ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE recipes MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE recipes ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE recipes MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE recipes ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE recipes ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Prüfe und füge Spalten für receipts hinzu
-- Spalte: id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NOT NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: db_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'db_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN db_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: supplier_id
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'supplier_id';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN supplier_id ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: booking_number
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'booking_number';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN booking_number ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: receipt_date
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'receipt_date';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN receipt_date ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: receipt_number
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'receipt_number';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN receipt_number ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: receipt_details
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'receipt_details';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN receipt_details ', 'JSON', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: due_date
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'due_date';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN due_date ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: payment_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'payment_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN payment_status ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: line_item_count
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'line_item_count';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN line_item_count ', 'DECIMAL', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: accounting
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'accounting';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN accounting ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_completed
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'is_completed';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN is_completed ', 'BOOLEAN', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: notes
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'notes';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN notes ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: ocr_result
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'ocr_result';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN ocr_result ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: ocr_provider
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'ocr_provider';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN ocr_provider ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: receipt_image_path
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'receipt_image_path';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN receipt_image_path ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: processed_ocr_data
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'processed_ocr_data';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN processed_ocr_data ', 'TEXT', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_dirty
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'is_dirty';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN is_dirty ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: is_new
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'is_new';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN is_new ', 'BOOLEAN', ' ', 'DEFAULT false', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: sync_status
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'sync_status';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN sync_status ', 'VARCHAR(20)', ' ', 'DEFAULT \'pending\'', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE receipts MODIFY COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE receipts ADD COLUMN created_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', '', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE receipts MODIFY COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE receipts ADD COLUMN updated_at ', 'TIMESTAMP', ' ', 'DEFAULT CURRENT_TIMESTAMP', ' ', 'ON UPDATE CURRENT_TIMESTAMP', ' ', 'NOT NULL'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'created_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN created_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: updated_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'updated_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN updated_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: last_modified_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND column_name = 'last_modified_by';

SET @query = IF(@col_exists = 0, 
  CONCAT('ALTER TABLE receipts ADD COLUMN last_modified_by ', 'CHAR(36)', ' ', '', ' ', '', ' ', 'NULL'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ========================================
-- CREATE INDEX Statements (Idempotent)
-- Prüft jeden Index und erstellt ihn nur, wenn er nicht existiert
-- ========================================

-- Index: idx_accountingaccounts_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND index_name = 'idx_accountingaccounts_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_accountingaccounts_id ON accountingaccounts(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_accountingaccounts_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND index_name = 'idx_accountingaccounts_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_accountingaccounts_created_at ON accountingaccounts(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_accountingaccounts_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingaccounts' 
  AND index_name = 'idx_accountingaccounts_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_accountingaccounts_updated_at ON accountingaccounts(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_accountingsettings_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND index_name = 'idx_accountingsettings_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_accountingsettings_id ON accountingsettings(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_accountingsettings_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND index_name = 'idx_accountingsettings_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_accountingsettings_created_at ON accountingsettings(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_accountingsettings_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'accountingsettings' 
  AND index_name = 'idx_accountingsettings_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_accountingsettings_updated_at ON accountingsettings(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_suppliers_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND index_name = 'idx_suppliers_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_suppliers_id ON suppliers(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_suppliers_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND index_name = 'idx_suppliers_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_suppliers_created_at ON suppliers(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_suppliers_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'suppliers' 
  AND index_name = 'idx_suppliers_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_suppliers_updated_at ON suppliers(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_unitentitys_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND index_name = 'idx_unitentitys_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_unitentitys_id ON unitentitys(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_unitentitys_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND index_name = 'idx_unitentitys_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_unitentitys_created_at ON unitentitys(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_unitentitys_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'unitentitys' 
  AND index_name = 'idx_unitentitys_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_unitentitys_updated_at ON unitentitys(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_categoryentitys_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND index_name = 'idx_categoryentitys_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_categoryentitys_id ON categoryentitys(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_categoryentitys_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND index_name = 'idx_categoryentitys_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_categoryentitys_created_at ON categoryentitys(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_categoryentitys_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'categoryentitys' 
  AND index_name = 'idx_categoryentitys_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_categoryentitys_updated_at ON categoryentitys(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_articles_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND index_name = 'idx_articles_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_articles_id ON articles(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_articles_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND index_name = 'idx_articles_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_articles_created_at ON articles(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_articles_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND index_name = 'idx_articles_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_articles_updated_at ON articles(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_articles_supplier_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND index_name = 'idx_articles_supplier_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_articles_supplier_id ON articles(', 'supplier_id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_articles_category
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'articles' 
  AND index_name = 'idx_articles_category';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_articles_category ON articles(', 'category(100)', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_recipes_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND index_name = 'idx_recipes_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_recipes_id ON recipes(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_recipes_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND index_name = 'idx_recipes_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_recipes_created_at ON recipes(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_recipes_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'recipes' 
  AND index_name = 'idx_recipes_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_recipes_updated_at ON recipes(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_receipts_id
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND index_name = 'idx_receipts_id';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_receipts_id ON receipts(', 'id', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_receipts_created_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND index_name = 'idx_receipts_created_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_receipts_created_at ON receipts(', 'created_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index: idx_receipts_updated_at
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.statistics 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'receipts' 
  AND index_name = 'idx_receipts_updated_at';

SET @query = IF(@idx_exists = 0, 
  CONCAT('CREATE INDEX idx_receipts_updated_at ON receipts(', 'updated_at', ')'), 
  'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- ALTER-Statements für system_info Tabelle
-- ========================================

-- Spalte: updated_at in system_info
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'system_info' 
  AND column_name = 'updated_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'system_info' 
  AND column_name = 'updated_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE system_info MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE system_info ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Spalte: created_at in system_info
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'system_info' 
  AND column_name = 'created_at';

SET @col_has_default = 0;
SELECT COUNT(*) INTO @col_has_default 
FROM information_schema.columns 
WHERE table_schema = 'chef_numbers' 
  AND table_name = 'system_info' 
  AND column_name = 'created_at' 
  AND column_default IS NOT NULL;

SET @query = IF(@col_exists = 1 AND @col_has_default = 0, 
  CONCAT('ALTER TABLE system_info MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'), 
  IF(@col_exists = 0, 
    CONCAT('ALTER TABLE system_info ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'), 
    'SELECT 1'));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
