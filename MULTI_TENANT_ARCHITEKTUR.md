# Multi-Tenant-Architektur - The Chef's Numbers

## 🎯 **Übersicht**

Diese Anleitung erklärt die neue **Multi-Tenant-Architektur** von "The Chef's Numbers", die es jedem Nutzer ermöglicht, mit seinen eigenen Datenbank- und Speicherdiensten zu arbeiten, ohne dass diese zentral gehostet werden müssen.

## 🏗️ **Architektur-Konzept**

### **Was ist Multi-Tenant?**
- **Jeder Nutzer** hat seinen eigenen **Tenant** (Mandant)
- **Jeder Tenant** kann **mehrere Services** konfigurieren
- **Services** können **bestehende Dienste** oder **neue Docker-Container** sein
- **Alle Konfigurationen** werden im **LocalStorage** gespeichert

### **Vorteile der neuen Architektur:**
✅ **Datentrennung**: Jeder Nutzer arbeitet mit seinen eigenen Daten  
✅ **Flexibilität**: Wahl zwischen bestehenden und neuen Diensten  
✅ **Skalierbarkeit**: Einfaches Hinzufügen neuer Services  
✅ **Offline-Fähigkeit**: Alle Konfigurationen lokal gespeichert  
✅ **Docker-Integration**: Automatische Container-Verwaltung  

## 🗄️ **Unterstützte Service-Typen**

### **Datenbanken:**
- **PostgreSQL** (Port 5432)
- **MariaDB** (Port 3306)
- **MongoDB** (Port 27017)
- **Redis** (Port 6379)

### **Speicherdienste:**
- **MinIO** (Port 9000) - Für Bildverwaltung
- **Weitere** können einfach hinzugefügt werden

## 🚀 **Schnellstart**

### **1. Service-Verwaltung öffnen**
- Gehen Sie zu **Service-Verwaltung** im Hauptmenü
- Ein **Standard-Tenant** wird automatisch erstellt

### **2. Ersten Service konfigurieren**
- Klicken Sie auf **"Neuen Service erstellen"**
- Wählen Sie den **Service-Typ** (z.B. PostgreSQL)
- Geben Sie **Host/IP-Adresse** und **Port** ein
- Fügen Sie **Zugangsdaten** hinzu
- Klicken Sie auf **"Service erstellen"**

### **3. Verbindung testen**
- Klicken Sie auf **"Test"** bei Ihrem Service
- Die Verbindung wird getestet und der Status aktualisiert

## ⚙️ **Detaillierte Konfiguration**

### **Bestehende Dienste verwenden:**
```
Service-Name: Meine Hauptdatenbank
Service-Typ: PostgreSQL
Host/IP: 192.168.1.100
Port: 5432
Benutzername: chef
Passwort: meinpasswort
Datenbank: chef_numbers
Docker-verwaltet: Nein
```

### **Neue Docker-Container erstellen:**
```
Service-Name: Neue MinIO-Instanz
Service-Typ: MinIO
Host/IP: localhost
Port: 9000
Benutzername: minio_user
Passwort: minio_password
Docker-verwaltet: Ja
```

## 🔧 **Docker-Integration**

### **Automatische Container-Verwaltung:**
- **Container starten** wenn Service aktiviert wird
- **Container stoppen** wenn Service gelöscht wird
- **Status-Überwachung** aller laufenden Container
- **Port-Management** für Konfliktvermeidung

### **Docker-API-Anforderungen:**
- **Docker daemon** muss auf Port 2375 laufen
- **CORS** muss für lokale Verbindungen aktiviert sein
- **Berechtigungen** für Container-Operationen erforderlich

## 🏢 **Tenant-Verwaltung**

### **Tenant erstellen:**
1. Klicken Sie auf **"Neuen Tenant erstellen"**
2. Geben Sie einen **Namen** ein (z.B. "Meine Firma")
3. Fügen Sie eine **optionale Beschreibung** hinzu
4. Klicken Sie auf **"Erstellen"**

### **Tenant wechseln:**
- Klicken Sie auf den gewünschten **Tenant** in der Übersicht
- Alle **Services** des ausgewählten Tenants werden angezeigt
- **Konfigurationen** sind zwischen Tenants getrennt

## 🔍 **Service-Discovery**

### **Automatische Erkennung:**
- **Netzwerk-Scanning** für verfügbare Services
- **Port-Scanning** für bekannte Service-Ports
- **Metadaten-Erkennung** (Version, Features)
- **Performance-Tests** für Verbindungsqualität

### **Manuelle Konfiguration:**
- **IP-Adressen** manuell eingeben
- **Benutzerdefinierte Ports** konfigurieren
- **Zugangsdaten** speichern
- **Verbindungstests** durchführen

## 📊 **Verbindungs-Status**

### **Status-Anzeigen:**
- 🟢 **Verbunden**: Service ist erreichbar
- 🔴 **Fehler**: Verbindung fehlgeschlagen
- 🟡 **Verbinde...**: Verbindung wird aufgebaut
- ⚪ **Unbekannt**: Noch nicht getestet

### **Verbindungs-Tests:**
- **Automatische Tests** beim Service-Start
- **Manuelle Tests** über "Test"-Button
- **Performance-Messung** (Antwortzeit)
- **Fehler-Details** bei fehlgeschlagenen Tests

## 🔐 **Sicherheit**

### **Lokale Speicherung:**
- **Alle Konfigurationen** werden im LocalStorage gespeichert
- **Passwörter** werden **nicht verschlüsselt** gespeichert
- **Keine Übertragung** an externe Server
- **Vollständige Kontrolle** über eigene Daten

### **Empfehlungen:**
- **Starke Passwörter** für alle Services verwenden
- **Regelmäßige Backups** der Konfigurationen
- **Netzwerk-Sicherheit** für externe Verbindungen
- **Docker-Sicherheit** bei Container-Verwaltung

## 🚨 **Wichtige Hinweise**

### **Vor dem Start:**
1. **Docker** muss installiert und laufend sein
2. **Netzwerk-Zugriff** zu den Ziel-Services muss möglich sein
3. **Ports** dürfen nicht von anderen Diensten belegt sein
4. **Firewall-Einstellungen** müssen angepasst werden

### **Bei Problemen:**
- **Verbindungstests** durchführen
- **Logs** der Docker-Container überprüfen
- **Netzwerk-Konnektivität** testen
- **Port-Verfügbarkeit** überprüfen

## 🔄 **Migration von bestehenden Systemen**

### **Von Supabase:**
1. **Daten exportieren** aus Supabase
2. **Neuen Tenant** erstellen
3. **PostgreSQL-Service** konfigurieren
4. **Daten importieren** in neue Datenbank

### **Von lokaler Speicherung:**
1. **Bestehende Daten** sichern
2. **Neuen Service** für lokale Datenbank konfigurieren
3. **Daten migrieren** zu neuem Service
4. **Alte Daten** nach erfolgreicher Migration löschen

## 📱 **Verwendung in der App**

### **Service-Auswahl:**
- **Automatische Erkennung** verfügbarer Services
- **Manuelle Konfiguration** für spezielle Anforderungen
- **Dynamische Verbindungsaufnahme** bei App-Start
- **Fallback** auf lokale Speicherung bei Verbindungsproblemen

### **Daten-Synchronisation:**
- **Hybrid-Modus** zwischen lokaler und externer Speicherung
- **Offline-Funktionalität** bei Netzwerk-Problemen
- **Automatische Synchronisation** bei Wiederherstellung der Verbindung
- **Konflikt-Lösung** bei Daten-Divergenzen

## 🎉 **Fazit**

Die neue Multi-Tenant-Architektur bietet:

- **Maximale Flexibilität** bei der Service-Auswahl
- **Einfache Verwaltung** aller Datenbank- und Speicherdienste
- **Skalierbarkeit** für wachsende Anforderungen
- **Datensicherheit** durch lokale Speicherung
- **Docker-Integration** für moderne Deployment-Strategien

Jeder Nutzer kann nun seine eigenen Services konfigurieren und verwalten, ohne von zentralen Hosting-Lösungen abhängig zu sein.
