# 🚀 Supabase Cloud-Setup für Chef's Numbers

## Übersicht
Diese Anleitung zeigt, wie Sie Chef's Numbers mit Supabase (kostenlose Cloud-Datenbank) einrichten können, ohne Docker-Container verwalten zu müssen.

## 🎯 Vorteile von Supabase
- ✅ **Kostenlos:** 500MB Datenbank + 1GB Dateispeicher
- ✅ **Einfach:** Ein-Klick-Setup, keine Server-Verwaltung
- ✅ **Sicher:** Automatische Backups, SSL-Verschlüsselung
- ✅ **Schnell:** Globale CDN, Real-time Updates
- ✅ **Skalierbar:** Automatisches Scaling bei Bedarf

## 📋 Schritt-für-Schritt Einrichtung

### 1. Supabase-Konto erstellen
1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Klicken Sie auf "Start your project"
3. Melden Sie sich mit GitHub an
4. Klicken Sie auf "New Project"

### 2. Projekt konfigurieren
1. **Projektname:** `chef-numbers`
2. **Datenbank-Passwort:** Wählen Sie ein sicheres Passwort (mindestens 8 Zeichen)
3. **Region:** Wählen Sie die nächstgelegene Region (z.B. West Europe)
4. Klicken Sie auf "Create new project"

### 3. Auf Projekt warten
- Supabase erstellt automatisch Ihre Datenbank
- Warten Sie 2-3 Minuten, bis der Status "Ready" anzeigt

### 4. API-Schlüssel kopieren
1. Gehen Sie zu **Settings** → **API**
2. Kopieren Sie:
   - **Project URL** (z.B. `https://xyz.supabase.co`)
   - **anon public** Key (beginnt mit `eyJ...`)

### 5. Umgebungsvariablen setzen
Erstellen Sie eine `.env.local` Datei im Hauptverzeichnis:

```bash
REACT_APP_SUPABASE_URL=https://ihre-projekt-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ihr-anon-key
```

### 6. Datenbank-Tabellen erstellen
Gehen Sie zu **SQL Editor** und führen Sie diesen Code aus:

```sql
-- Artikel-Tabelle
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2),
  unit VARCHAR(50),
  supplier VARCHAR(255),
  additives TEXT[],
  allergens TEXT[],
  nutrition_info JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rezepte-Tabelle
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB,
  instructions TEXT[],
  cooking_time INTEGER,
  difficulty VARCHAR(50),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lieferanten-Tabelle
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage-Bucket für Bilder
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true);
```

### 7. App neu starten
```bash
npm start
```

## 🔧 Fehlerbehebung

### Häufige Probleme:

**"Invalid API key"**
- Überprüfen Sie, ob die Umgebungsvariablen korrekt gesetzt sind
- Starten Sie die App neu nach Änderungen

**"Table does not exist"**
- Führen Sie den SQL-Code in Schritt 6 aus
- Überprüfen Sie, ob alle Tabellen erstellt wurden

**"Storage bucket not found"**
- Erstellen Sie den Storage-Bucket manuell in **Storage** → **Buckets**

## 📊 Monitoring & Verwaltung

### Supabase Dashboard
- **Table Editor:** Daten direkt anzeigen/bearbeiten
- **API Docs:** Automatisch generierte API-Dokumentation
- **Logs:** Alle API-Aufrufe und Fehler einsehen
- **Storage:** Dateien verwalten

### Kostenüberwachung
- Gehen Sie zu **Settings** → **Billing**
- Überwachen Sie den Verbrauch des kostenlosen Plans

## 🚀 Nächste Schritte

Nach der Einrichtung können Sie:
1. **Docker-Container stoppen** (falls nicht mehr benötigt)
2. **Daten migrieren** (falls vorhanden)
3. **App testen** mit der neuen Cloud-Datenbank

## 💡 Tipps für Endbenutzer

- **Backup:** Supabase macht automatisch Backups
- **Sicherheit:** Alle Verbindungen sind SSL-verschlüsselt
- **Performance:** Datenbank ist global verteilt
- **Support:** Kostenloser Community-Support verfügbar

## 🔗 Nützliche Links

- [Supabase Dokumentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Chef's Numbers GitHub](https://github.com/ihr-username/chef-numbers)
