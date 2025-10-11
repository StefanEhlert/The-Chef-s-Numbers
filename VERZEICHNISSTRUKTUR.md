# Verzeichnisstruktur - The Chef's Numbers

## 📁 Aktuelle Verzeichnisstruktur

### 🐳 Docker-Container verwenden nur `public/`-Verzeichnisse:

```
📁 public/
├── 📁 init-scripts/          ← WIRD VON DOCKER VERWENDET
│   ├── init-chef-numbers-mysql.sql
│   ├── init-chef-numbers-postgresql.sql
│   └── init-chef-numbers-mariadb.sql
└── 📁 prisma-api/            ← WIRD VON DOCKER VERWENDET
    ├── package.json
    ├── schema.prisma
    └── server.js
```

### 🔧 Entwicklung und Schema-Management:

```
📁 src/
├── 📁 schemas/
│   ├── centralSchema.ts      ← ZENTRALE SCHEMA-DEFINITION
│   └── schemaGenerator.ts    ← AUTOMATISCHE GENERIERUNG
└── 📁 components/
    └── StorageManagement.tsx ← VERWALTET SCHEMA-SYNCHRONISATION

📁 scripts/
└── generate-schema-simple.js ← CLI-SCRIPT FÜR SCHEMA-GENERIERUNG
```

## 🚀 Workflow

### 1. Schema ändern:
- Bearbeiten Sie `src/schemas/centralSchema.ts`
- Alle Tabellen, Spalten, Beziehungen und Constraints definieren

### 2. Schema generieren:
```bash
node scripts/generate-schema-simple.js
```

### 3. Docker-Container verwenden automatisch neue Dateien:
- MySQL: `{{FUNCTION:getFrontendUrl}}/init-scripts/init-chef-numbers-mysql.sql`
- PostgreSQL: `{{FUNCTION:getFrontendUrl}}/init-scripts/init-chef-numbers-postgresql.sql`
- Prisma: `{{FUNCTION:getFrontendUrl}}/prisma-api/schema.prisma`

## 🎯 Vorteile

1. **📊 Einheitlichkeit**: Alle Datenbanken verwenden dasselbe Schema
2. **🔄 Automatisch**: Schema-Änderungen werden automatisch übernommen
3. **🛡️ Validierung**: Hash-basierte Schema-Versionierung
4. **⚡ Performance**: Optimierte Indizes und Constraints
5. **🔧 Wartbarkeit**: Eine zentrale Quelle für alle Schema-Definitionen

## 🗑️ Bereinigte Verzeichnisse

Die folgenden Verzeichnisse wurden gelöscht, da sie nicht mehr verwendet wurden:
- ❌ `init-scripts/` (Root-Level)
- ❌ `prisma-api/` (Root-Level)

Diese enthielten nur veraltete Dateien und wurden durch die `public/`-Verzeichnisse ersetzt.
