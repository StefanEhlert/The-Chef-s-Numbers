# Supabase Einrichtung für The Chef's Numbers

## Übersicht
Diese Anleitung erklärt, wie Sie Supabase als Datenbank für die App einrichten können, um das Problem mit dem mehrfachen Laden der Daten zu beheben.

## Problem
Die App lädt derzeit Daten mehrfach und verwendet nur den LocalStorage, obwohl Supabase als Storage-Modus konfiguriert ist.

## Lösung
1. **Supabase-Projekt erstellen**
2. **Umgebungsvariablen konfigurieren**
3. **Datenbank-Schema einrichten**

## Schritt 1: Supabase-Projekt erstellen

1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Erstellen Sie ein neues Projekt
3. Notieren Sie sich die Projekt-URL und den anon key

## Schritt 2: Umgebungsvariablen konfigurieren

Bearbeiten Sie die `env.local` Datei:

```bash
# Storage Configuration
REACT_APP_DEFAULT_STORAGE_MODE=supabase
REACT_APP_SYNC_INTERVAL=30000

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://ihr-projekt.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ihr-anon-key-hier
```

**Wichtig:** Ersetzen Sie die Platzhalter mit Ihren echten Supabase-Daten!

## Schritt 3: Datenbank-Schema einrichten

Führen Sie das folgende SQL in der Supabase SQL Editor aus:

```sql
-- Artikel-Tabelle
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  net_price DECIMAL(10,2),
  gross_price DECIMAL(10,2),
  unit TEXT,
  allergens TEXT[],
  additives TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lieferanten-Tabelle
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone_numbers TEXT[],
  address_street TEXT,
  address_zip_code TEXT,
  address_city TEXT,
  address_country TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rezepte-Tabelle
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ingredients JSONB,
  instructions TEXT,
  preparation_time INTEGER,
  cooking_time INTEGER,
  servings INTEGER,
  difficulty TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Einkaufsliste-Tabelle
CREATE TABLE einkauf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  quantity DECIMAL(10,2),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventur-Tabelle
CREATE TABLE inventur (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  current_stock DECIMAL(10,2),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) aktivieren
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE einkauf ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventur ENABLE ROW LEVEL SECURITY;

-- RLS-Policies für anonymen Zugriff (nur für Demo-Zwecke)
CREATE POLICY "Allow anonymous access to articles" ON articles FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to recipes" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to einkauf" ON einkauf FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to inventur" ON inventur FOR ALL USING (true);
```

## Schritt 4: App neu starten

1. Stoppen Sie die App
2. Starten Sie sie neu mit `npm start`
3. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen

## Schritt 5: Storage-Modus wechseln

1. Öffnen Sie die App
2. Gehen Sie zu den Einstellungen (Zahnrad-Symbol)
3. Wählen Sie "Supabase" als Storage-Modus
4. Geben Sie Ihre Supabase-Konfiguration ein
5. Testen Sie die Verbindung

## Überprüfung

Nach der Einrichtung sollten Sie in der Browser-Konsole folgende Meldungen sehen:

```
🌍 Storage-Modus aus Umgebungsvariable geladen: supabase
✅ Supabase-Verbindung erfolgreich - Migration übersprungen (Tabellen bereits leer)
💾 Supabase-Modus sofort gespeichert
```

## Fehlerbehebung

### Fehler: "Supabase ist nicht konfiguriert"
- Überprüfen Sie die Umgebungsvariablen in `env.local`
- Stellen Sie sicher, dass die App neu gestartet wurde

### Fehler: "Connection failed"
- Überprüfen Sie die Supabase-URL und den anon key
- Stellen Sie sicher, dass das Projekt aktiv ist
- Überprüfen Sie die RLS-Policies

### Daten werden nicht geladen
- Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
- Stellen Sie sicher, dass die Tabellen korrekt erstellt wurden

## Vorteile der Supabase-Integration

1. **Keine mehrfachen Datenladungen** - Daten werden nur einmal geladen
2. **Echtzeit-Synchronisation** - Änderungen werden sofort gespeichert
3. **Skalierbarkeit** - Datenbank kann mit der App wachsen
4. **Backup & Wiederherstellung** - Automatische Backups durch Supabase
5. **Multi-Device-Support** - Daten sind auf allen Geräten verfügbar

## Nächste Schritte

Nach der erfolgreichen Einrichtung können Sie:
1. Bestehende Daten aus dem LocalStorage migrieren
2. Echtzeit-Funktionen aktivieren
3. Benutzerauthentifizierung hinzufügen
4. Erweiterte Abfragen implementieren
