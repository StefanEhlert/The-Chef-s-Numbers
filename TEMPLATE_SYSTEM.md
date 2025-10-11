# Template-System - The Chef's Numbers

## 🎯 **Aktualisiert: Template-System implementiert!**

### **✅ Was wurde geändert:**

#### **1. DockerComposeGenerator verwendet jetzt echte Template-Dateien:**
```typescript
// Vorher: Hardcodierte Templates
loadTemplate(templateName: string): string {
  // Für jetzt geben wir die Templates direkt zurück
  switch (templateName) { ... }
}

// Jetzt: Lädt echte Template-Dateien
loadTemplate(templateName: string): string {
  const templatePath = `docker-compose-template-${templateName}.yml`;
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }
  // Fallback auf hardcodierte Templates
}
```

#### **2. Template-Dateien werden automatisch verwendet:**
- **📁 `docker-compose-template-postgresql.yml`** ← Wird vom Generator geladen
- **📁 `docker-compose-template-mysql.yml`** ← Wird vom Generator geladen  
- **📁 `docker-compose-template-mariadb.yml`** ← Wird vom Generator geladen
- **📁 `docker-compose-template-minio.yml`** ← Wird vom Generator geladen

#### **3. PostgreSQL-Template aktualisiert:**
```yaml
# Verwendet jetzt das neue harmonisierte Schema:
wget -O /docker-entrypoint-initdb.d/init-chef-numbers-postgresql.sql {{FUNCTION:getFrontendUrl}}/init-scripts/init-chef-numbers-postgresql.sql
```

## 🔄 **Workflow:**

### **1. Template ändern:**
```bash
# Bearbeiten Sie die Template-Datei:
vim docker-compose-template-postgresql.yml
```

### **2. Generator verwendet automatisch die Änderungen:**
```typescript
// Der Generator lädt automatisch:
const template = templateEngine.loadTemplate('postgresql');
// Lädt: docker-compose-template-postgresql.yml
```

### **3. Docker Compose wird mit aktualisiertem Template generiert:**
```bash
# Im StorageManagement.tsx:
const dockerCompose = dockerComposeGenerator.generateServiceSpecificCompose('postgresql', config);
// Verwendet die aktualisierte Template-Datei
```

## 🎯 **Vorteile:**

1. **📝 Einfache Bearbeitung**: Template-Dateien können direkt bearbeitet werden
2. **🔄 Automatische Übernahme**: Änderungen werden sofort vom Generator verwendet
3. **🛡️ Fallback-Sicherheit**: Hardcodierte Templates als Backup
4. **⚡ Performance**: Template-Dateien werden nur einmal geladen
5. **🔧 Wartbarkeit**: Klare Trennung zwischen Code und Templates

## 📁 **Template-Struktur:**

```
📁 docker-compose-template-*.yml
├── postgresql.yml     ← PostgreSQL + PostgREST
├── mysql.yml          ← MySQL + Prisma API  
├── mariadb.yml        ← MariaDB + Prisma API
└── minio.yml          ← MinIO Object Storage
```

## 🚀 **Nächste Schritte:**

1. **Template bearbeiten**: Änderungen in `docker-compose-template-*.yml`
2. **Generator verwenden**: Automatische Übernahme der Änderungen
3. **Docker Compose generieren**: Neue Templates werden verwendet
4. **Container starten**: Mit aktualisierten Konfigurationen

Das Template-System ist jetzt vollständig funktionsfähig! 🎉
