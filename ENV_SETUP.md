# 🔧 Supabase-Konfiguration einrichten

## Übersicht
Diese Anleitung zeigt, wie Sie Supabase für Chef's Numbers einrichten können. Sie haben **zwei Möglichkeiten**:

1. **Einfach (Empfohlen):** Direkt in der App konfigurieren
2. **Für Entwickler:** Über Umgebungsvariablen (.env.local)

## 🎯 **Methode 1: Einfache In-App-Konfiguration (Empfohlen)**

### 1. App öffnen
- Starten Sie Chef's Numbers
- Klicken Sie in der linken Navigation auf **"Einstellungen"**
- Oder gehen Sie zu **Einstellungen** → **Datenspeicherung**

### 2. Supabase auswählen
- Klicken Sie auf **"Supabase Cloud"**
- Die Konfigurationsmaske wird automatisch angezeigt

### 3. Daten eingeben
- **Projekt-URL:** Ihre Supabase-Projekt-URL
- **Anon Public Key:** Ihr öffentlicher API-Schlüssel

### 4. Verbindung testen
- Klicken Sie auf **"Verbindung testen"**
- Bei Erfolg wird die Konfiguration automatisch gespeichert

### 5. Fertig!
- Die App lädt neu und verwendet Ihre Supabase-Konfiguration
- Alle Daten werden automatisch migriert

---

## 📁 **Methode 2: Für Entwickler - .env.local Datei**

### 1. Datei erstellen
Erstellen Sie eine neue Datei namens `.env.local` im Hauptverzeichnis Ihres Projekts (gleicher Ordner wie `package.json`).

### 2. Inhalt hinzufügen
Fügen Sie folgende Zeilen in die `.env.local` Datei ein:

```bash
# Supabase-Konfiguration
REACT_APP_SUPABASE_URL=https://ihre-projekt-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ihr-anon-key-hier-einfuegen

# Backend-URL (optional, falls Sie das Docker-Backend verwenden)
REACT_APP_BACKEND_URL=http://localhost:3001
```

## 🔑 Supabase-Daten finden

### 1. Supabase-Projekt öffnen
- Gehen Sie zu [supabase.com](https://supabase.com)
- Melden Sie sich an und öffnen Sie Ihr Projekt

### 2. API-Schlüssel kopieren
- Gehen Sie zu **Settings** → **API**
- Kopieren Sie:
  - **Project URL** → `REACT_APP_SUPABASE_URL`
  - **anon public** Key → `REACT_APP_SUPABASE_ANON_KEY`

### 3. Beispiel
```bash
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ Wichtige Hinweise

### Sicherheit
- **Niemals** die `.env.local` Datei in Git committen
- Die Datei ist bereits in `.gitignore` aufgenommen
- Halten Sie Ihre API-Schlüssel geheim

### Format
- **Keine Leerzeichen** um das `=` Zeichen
- **Keine Anführungszeichen** um die Werte
- **Eine Variable pro Zeile**

### Neustart erforderlich
Nach dem Erstellen der `.env.local` Datei müssen Sie die App neu starten:

```bash
npm start
```

## 🔍 Überprüfung

### **Methode 1 (In-App):**
- Die Konfigurationsmaske zeigt den Status an
- ✅ "Konfiguration vollständig" → Bereit zum Testen
- ⚠️ "Konfiguration unvollständig" → Daten vervollständigen

### **Methode 2 (Umgebungsvariablen):**
- Browser-Konsole öffnen (F12)
- Suchen Sie nach:
  - ✅ "Supabase ist konfiguriert" → Erfolgreich
  - ⚠️ "Supabase ist nicht konfiguriert" → Überprüfen Sie die Werte

### **Speichermodus testen:**
- Klicken Sie in der linken Navigation auf **"Einstellungen"**
- Wählen Sie **"Supabase Cloud"**
- Die App sollte die Verbindung testen

## 🚨 Fehlerbehebung

### "supabaseUrl is required"
- Überprüfen Sie, ob `REACT_APP_SUPABASE_URL` korrekt gesetzt ist
- Stellen Sie sicher, dass die URL mit `https://` beginnt
- Starten Sie die App neu

### "Invalid API key"
- Überprüfen Sie, ob `REACT_APP_SUPABASE_ANON_KEY` korrekt gesetzt ist
- Der Key sollte mit `eyJ` beginnen
- Kopieren Sie den kompletten Key

### "Table does not exist"
- Erstellen Sie die Tabellen in Supabase (siehe `SUPABASE_SETUP.md`)
- Überprüfen Sie die Tabellennamen

## 📚 Nächste Schritte

### **Nach der In-App-Konfiguration:**
1. ✅ **Konfiguration gespeichert** - Automatisch nach erfolgreichem Test
2. ✅ **App neu geladen** - Verwendet neue Konfiguration
3. ✅ **Daten migriert** - Von lokalem Speicher zur Cloud
4. ✅ **App verwenden** - Mit Cloud-Speicherung

### **Nach der Umgebungsvariablen-Konfiguration:**
1. **App neu starten** mit `npm start`
2. **Supabase testen** in den Einstellungen
3. **Daten migrieren** von lokalem Speicher
4. **App verwenden** mit Cloud-Speicherung

## 🔗 Nützliche Links

- [Supabase Setup](SUPABASE_SETUP.md) - Vollständige Einrichtung
- [Supabase Integration](SUPABASE_INTEGRATION.md) - Verwendung der Cloud-Features
- [Supabase Docs](https://supabase.com/docs) - Offizielle Dokumentation

---

**Hinweis:** Die `.env.local` Datei wird nicht in Git gespeichert. Jeder Entwickler muss seine eigene lokale Kopie erstellen.
