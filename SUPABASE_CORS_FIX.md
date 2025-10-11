# 🚨 Supabase CORS-Problem beheben

## ❌ **Häufigstes Problem: CORS-Fehler**

Wenn die Verbindung zu Supabase nicht funktioniert, obwohl URL und API-Key korrekt sind, liegt es meist an **CORS-Einstellungen**.

## 🔧 **Schritt-für-Schritt Lösung:**

### **1. Supabase Dashboard öffnen**
- Gehen Sie zu [supabase.com](https://supabase.com)
- Melden Sie sich an
- Öffnen Sie Ihr Projekt

### **2. CORS-Einstellungen finden**
- Klicken Sie auf **"Settings"** (Zahnrad-Symbol) in der linken Seitenleiste
- Wählen Sie **"API"** aus dem Menü
- Scrollen Sie zu **"CORS (Cross-Origin Resource Sharing)"**

### **3. CORS-Konfiguration anpassen**

#### **Option A: Für Entwicklung (einfach)**
```
Origin: *
```
- ✅ Einfach zu konfigurieren
- ❌ Weniger sicher
- 🔧 Für lokale Entwicklung geeignet

#### **Option B: Für Produktion (sicher)**
```
Origin: http://localhost:3000
Origin: https://ihre-domain.com
Origin: https://ihre-app.netlify.app
```
- ✅ Sicherer
- ❌ Muss für jede Domain konfiguriert werden
- 🔧 Für Produktionsumgebungen empfohlen

### **4. Speichern und testen**
- Klicken Sie auf **"Save"**
- Warten Sie 1-2 Minuten (Änderungen brauchen Zeit)
- Testen Sie die Verbindung erneut in der App

## 🔍 **Weitere häufige Probleme:**

### **Problem 2: Falscher API-Key**
- ✅ Verwenden Sie den **"anon public"** Key (nicht den "service_role" Key!)
- ✅ Der Key beginnt mit `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Problem 3: Projekt-URL Format**
- ✅ Korrekt: `https://ihre-projekt-id.supabase.co`
- ❌ Falsch: `https://supabase.com/project/ihre-projekt-id`

### **Problem 4: Projekt-Status**
- ✅ Projekt muss **"Active"** sein (grüner Punkt)
- ❌ Projekt darf nicht pausiert oder gelöscht sein

### **Problem 5: Netzwerk/Firewall**
- ✅ Überprüfen Sie Ihre Internetverbindung
- ✅ Falls Sie in einem Firmennetzwerk sind: Firewall-Einstellungen prüfen

## 🧪 **Test-Schritte:**

1. **Browser-Entwicklertools öffnen** (F12)
2. **Konsole öffnen** (Console-Tab)
3. **Verbindung in der App testen**
4. **Fehlermeldungen in der Konsole prüfen**

## 📱 **Für lokale Entwicklung:**

Fügen Sie diese CORS-Einstellungen hinzu:
```
http://localhost:3000
http://localhost:3001
http://localhost:8080
http://127.0.0.1:3000
```

## 🌐 **Für Netlify/Vercel Deployment:**

Fügen Sie diese CORS-Einstellungen hinzu:
```
https://ihre-app.netlify.app
https://ihre-app.vercel.app
https://ihre-domain.com
```

## 🆘 **Wenn nichts hilft:**

1. **Projekt neu starten** in Supabase
2. **Neuen API-Key generieren**
3. **Supabase-Support kontaktieren**

---

**💡 Tipp:** CORS-Änderungen brauchen 1-2 Minuten, bis sie wirksam werden!
