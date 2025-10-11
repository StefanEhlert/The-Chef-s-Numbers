# 🚀 Lokale PostgreSQL + PostgREST Installation für The Chef's Numbers

## 🎯 Übersicht

Sie haben eine **lokale PostgreSQL + PostgREST Installation** mit Supabase-Komponenten, nicht Supabase Cloud. Das ist eine ausgezeichnete Wahl für lokale Entwicklung!

## 🔧 Setup-Schritte

### 1. Docker-Container starten

```bash
# Starte alle Services
docker-compose -f docker-compose-supabase.yml up -d

# Prüfe Status
docker-compose -f docker-compose-supabase.yml ps
```

### 2. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env.local` Datei mit:

```bash
# Lokale PostgreSQL + PostgREST Konfiguration
REACT_APP_SUPABASE_URL=http://localhost:3000
REACT_APP_SUPABASE_ANON_KEY=local-anon-key-for-postgrest
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=local-service-role-key-for-postgrest
```

### 3. Init-Scripts werden automatisch geladen

Die Init-Scripts aus `./init-scripts/` werden automatisch beim ersten Start der PostgreSQL-Datenbank geladen:

- ✅ Alle Tabellen werden erstellt
- ✅ Indizes werden gesetzt
- ✅ RLS-Policies werden aktiviert
- ✅ `exec_sql` Funktion wird erstellt (für automatische Schema-Updates)

## 🌐 Verfügbare Services

Nach dem Start sind folgende Services verfügbar:

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **PostgREST API** | http://localhost:3000 | Haupt-API für die App |
| **Supabase Dashboard** | http://localhost:8000 | Web-Interface für Datenbank |
| **PostgreSQL** | localhost:5432 | Direkte Datenbankverbindung |
| **Auth Service** | http://localhost:9999 | Authentifizierung |
| **Realtime** | http://localhost:4000 | Echtzeit-Updates |
| **Storage** | http://localhost:5000 | Datei-Speicher |

## 🔄 Automatische Schema-Erstellung

### Methode 1: Automatisch beim App-Start

```typescript
// Läuft automatisch wenn die App startet
const status = await autoInitializationService.initialize();
```

**Was passiert:**
1. ✅ Prüft welche Tabellen fehlen
2. ✅ Erstellt fehlende Tabellen über PostgREST
3. ✅ Migriert LocalStorage-Daten
4. ✅ Setzt alle Indizes und Policies

### Methode 2: Init-Scripts (bereits geladen)

Die Init-Scripts wurden bereits beim ersten Start geladen:
- `init-scripts/01-init-chef-numbers.sql` enthält das vollständige Schema
- Wird automatisch ausgeführt wenn PostgreSQL zum ersten Mal startet

### Methode 3: Manuelle Schema-Prüfung

```typescript
// Prüfe Schema-Status
const schemaStatus = await supabaseAdminService.checkSchema();
console.log('Schema-Status:', schemaStatus);

// Erstelle fehlende Tabellen
const createdTables = await supabaseAdminService.createMissingTables();
console.log('Erstellte Tabellen:', createdTables);
```

## 🎯 Antwort auf Ihre Frage

**Ja, Methode 1 funktioniert mit PostgreSQL + PostgREST!**

Das System wurde angepasst um:
- ✅ **Lokale PostgreSQL + PostgREST** zu unterstützen
- ✅ **Supabase Cloud** weiterhin zu unterstützen
- ✅ **Automatische Schema-Erstellung** über PostgREST API
- ✅ **Init-Scripts** werden automatisch geladen

## 🔍 Unterschiede zu Supabase Cloud

| Aspekt | Lokale Installation | Supabase Cloud |
|--------|-------------------|----------------|
| **URL** | `http://localhost:3000` | `https://projekt.supabase.co` |
| **Keys** | Beliebige Strings | Echte JWT-Tokens |
| **Schema-Updates** | Über PostgREST API | Über Supabase API |
| **Init-Scripts** | Automatisch geladen | Manuell ausführen |
| **Dashboard** | http://localhost:8000 | https://supabase.com/dashboard |

## 🚨 Wichtige Hinweise

1. **Service Role Key**: Kann beliebig sein für lokale Installation
2. **Automatische Erkennung**: Das System erkennt automatisch lokale vs. Cloud-Installation
3. **Init-Scripts**: Werden nur beim ersten Start geladen
4. **Schema-Updates**: Laufen über PostgREST API, nicht direkt über PostgreSQL

## 🎉 Vorteile Ihrer lokalen Installation

- 🚀 **Vollständige Kontrolle** über die Datenbank
- 🔒 **Keine Abhängigkeit** von externen Services
- 💰 **Keine Kosten** für Cloud-Services
- 🛠️ **Einfache Entwicklung** und Debugging
- 📊 **Supabase Dashboard** verfügbar für Datenbank-Management

Das System funktioniert jetzt perfekt mit Ihrer lokalen PostgreSQL + PostgREST Installation! 🎯
