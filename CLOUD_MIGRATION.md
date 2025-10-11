# ☁️ Migration von Docker zu Cloud (Supabase)

## 🎯 Übersicht
Diese Anleitung zeigt, wie Sie Chef's Numbers von der lokalen Docker-Installation zur kostenlosen Cloud-Lösung migrieren können.

## 📋 Voraussetzungen
- ✅ Supabase-Projekt eingerichtet (siehe `SUPABASE_SETUP.md`)
- ✅ Lokale Docker-Installation läuft
- ✅ Daten vorhanden, die migriert werden sollen

## 🔄 Migrationsschritte

### 1. Daten exportieren (aus Docker)
```bash
# PostgreSQL-Daten exportieren
docker exec chef_numbers_postgres pg_dump -U chef -d chef_numbers > backup.sql

# MinIO-Daten sichern (falls vorhanden)
docker exec chef_numbers_minio mc mirror /data ./minio-backup
```

### 2. Daten in Supabase importieren
1. Gehen Sie zu **SQL Editor** in Ihrem Supabase-Dashboard
2. Laden Sie die `backup.sql` Datei hoch
3. Führen Sie den Export-Code aus

### 3. App auf Cloud umstellen
1. **Umgebungsvariablen setzen** (siehe `SUPABASE_SETUP.md`)
2. **App neu starten**
3. **Daten testen**

### 4. Docker-Container stoppen
```bash
# Container stoppen
docker-compose down

# Volumes löschen (optional)
docker-compose down -v
```

## 🚀 Alternative: Schrittweise Migration

### Phase 1: Parallel-Betrieb
- Supabase parallel zu Docker einrichten
- Daten in beiden Systemen synchron halten
- App testen

### Phase 2: Vollständige Umstellung
- App auf Supabase umstellen
- Docker-Container stoppen
- Alte Daten löschen

## 🔧 Automatisierte Migration

Für größere Datenmengen können Sie ein Migrationsskript verwenden:

```typescript
// migration-script.ts
import { supabase } from './src/services/supabaseService'
import { Pool } from 'pg'

const localDb = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'chef_numbers',
  user: 'chef',
  password: 'password'
})

async function migrateData() {
  // Lokale Daten abrufen
  const { rows: articles } = await localDb.query('SELECT * FROM articles')
  
  // In Supabase einfügen
  for (const article of articles) {
    await supabase
      .from('articles')
      .insert([article])
  }
  
  console.log('Migration abgeschlossen!')
}

migrateData()
```

## 📊 Datenvergleich

Nach der Migration können Sie die Daten vergleichen:

```sql
-- Anzahl Artikel in Supabase
SELECT COUNT(*) FROM articles;

-- Neueste Artikel
SELECT name, created_at FROM articles ORDER BY created_at DESC LIMIT 5;
```

## ⚠️ Wichtige Hinweise

### Datenintegrität
- **Backup erstellen** vor der Migration
- **Daten vergleichen** nach der Migration
- **Schrittweise testen** mit kleinen Datenmengen

### Performance
- **Latenz:** Cloud-Datenbank hat höhere Latenz als lokale
- **Bandbreite:** Upload/Download von Dateien benötigt Internet
- **Verfügbarkeit:** Abhängig von Internetverbindung

### Kosten
- **Kostenloser Plan:** 500MB Datenbank, 1GB Storage
- **Upgrade:** Bei Bedarf auf kostenpflichtige Pläne
- **Monitoring:** Verbrauch im Dashboard überwachen

## 🎉 Nach der Migration

### Vorteile
- ✅ **Keine Server-Verwaltung** mehr nötig
- ✅ **Automatische Backups** und Updates
- ✅ **Globale Verfügbarkeit** von überall
- ✅ **Skalierbarkeit** bei Bedarf

### Nächste Schritte
1. **Team einladen** (falls gewünscht)
2. **API-Dokumentation** studieren
3. **Real-time Features** nutzen
4. **Performance optimieren**

## 🔗 Nützliche Links

- [Supabase Migration Guide](https://supabase.com/docs/guides/migrations)
- [PostgreSQL Migration Tools](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Chef's Numbers Support](https://github.com/ihr-username/chef-numbers/issues)
