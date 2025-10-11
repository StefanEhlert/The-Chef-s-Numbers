# 🍴 Supabase Schema manuell erstellen

## ❗ **Warum ist das nötig?**

Die automatische Schema-Erstellung funktioniert nicht, weil **kostenlose Supabase-Projekte keine SQL-Funktionen unterstützen**. Das ist völlig normal!

## 🚀 **5-Minuten-Lösung:**

### **Schritt 1: Supabase SQL Editor öffnen**
1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Öffnen Sie Ihr Projekt
3. Klicken Sie links auf **"SQL Editor"**
4. Klicken Sie auf **"New query"**

### **Schritt 2: SQL-Skript ausführen**
1. Öffnen Sie die Datei **`SUPABASE_SCHEMA.sql`** in diesem Projekt
2. **Kopieren Sie den kompletten Inhalt** (Strg+A, Strg+C)
3. **Fügen Sie ihn in den Supabase SQL Editor ein** (Strg+V)
4. Klicken Sie auf **"RUN"** (oder Strg+Enter)

### **Schritt 3: Erfolgsmeldung überprüfen**
Sie sollten sehen:
```
Success. No rows returned
```

### **Schritt 4: Tabellen überprüfen**
1. Gehen Sie zu **"Table Editor"** (links)
2. Sie sollten jetzt diese Tabellen sehen:
   - ✅ `articles` (Artikel)
   - ✅ `suppliers` (Lieferanten)
   - ✅ `recipes` (Rezepte)
   - ✅ `einkauf` (Einkaufsliste)
   - ✅ `inventur` (Inventur)

### **Schritt 5: App testen**
1. Gehen Sie zurück zu Ihrer App
2. **Testen Sie die Supabase-Verbindung erneut**
3. Jetzt sollte es funktionieren! 🎉

## 📦 **Optional: Storage Bucket für Bilder**

Für Artikel-Bilder:
1. Gehen Sie zu **"Storage"** (links)
2. Klicken Sie **"Create bucket"**
3. Name: **`images`**
4. **Public bucket:** ✅ Ja
5. Klicken Sie **"Create bucket"**

## 🛡️ **Sicherheitshinweis**

Das aktuelle Schema erlaubt **öffentlichen Zugriff** für Demo-Zwecke. Für Produktionsumgebungen sollten Sie:
- Authentifizierung einrichten
- Restriktivere RLS-Policies verwenden
- Benutzer-spezifische Zugriffe definieren

## 🆘 **Bei Problemen:**

### **Fehler beim SQL ausführen?**
- Überprüfen Sie, ob Sie das **komplette Skript** kopiert haben
- Führen Sie es **in einem neuen Query-Tab** aus
- Versuchen Sie es **schrittweise** (jeweils eine CREATE TABLE)

### **Tabellen werden nicht angezeigt?**
- **Aktualisieren Sie die Seite** (F5)
- Warten Sie 30 Sekunden und prüfen Sie erneut
- Gehen Sie zu **Table Editor** → Refresh

### **Immer noch Verbindungsprobleme?**
- Führen Sie dieses SQL aus: `SELECT * FROM articles LIMIT 1;`
- Wenn das funktioniert, ist das Schema korrekt
- Testen Sie dann die App erneut

---

## ✅ **Nach erfolgreicher Schema-Erstellung:**

Ihre App sollte jetzt **vollständig mit Supabase funktionieren**:
- 📊 Artikel verwalten
- 🏢 Lieferanten verwalten  
- 🍳 Rezepte erstellen
- 🛒 Einkaufslisten führen
- 📦 Inventur durchführen
- ☁️ Alles in der Cloud gespeichert

**Viel Erfolg mit Ihrer Cloud-Datenbank!** 🚀
