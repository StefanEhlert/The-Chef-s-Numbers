# The Chef's Numbers - Backend API

Das Backend für die professionelle Rezeptverwaltung "The Chef's Numbers" mit Hybrid-Storage-System.

## 🚀 Features

- **Hybrid Storage System**: Lokale Speicherung + Backend-Synchronisation
- **RESTful API**: Vollständige CRUD-Operationen für alle Entitäten
- **Bildverwaltung**: MinIO-basierte Bildspeicherung mit automatischer Bildverarbeitung
- **PostgreSQL**: Robuste Datenbank mit optimierten Schemas
- **Docker Support**: Einfache Bereitstellung und Skalierung
- **TypeScript**: Vollständig typisierte API
- **Authentifizierung**: JWT-basierte Benutzerverwaltung

## 🏗️ Architektur

```
Frontend (React) ←→ Backend API ←→ PostgreSQL + MinIO
     ↓                    ↓              ↓
LocalStorage         Express.js      Daten + Bilder
```

## 📋 Voraussetzungen

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15+
- MinIO (für Bildspeicherung)

## 🛠️ Installation

### 1. Repository klonen
```bash
git clone <repository-url>
cd the-chefs-numbers
```

### 2. Backend-Dependencies installieren
```bash
cd backend
npm install
```

### 3. Umgebungsvariablen konfigurieren
```bash
cp .env.example .env
```

`.env` Datei anpassen:
```env
# Server
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chef_numbers
DB_USER=chef
DB_PASSWORD=password

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=chef_access_key
MINIO_SECRET_KEY=chef_secret_key
MINIO_BUCKET=chef-images

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 4. Mit Docker starten
```bash
# Im Hauptverzeichnis
docker-compose up -d
```

### 5. Datenbank initialisieren
```bash
cd backend
npm run migrate
npm run seed  # Optional: Beispieldaten
```

### 6. Backend starten
```bash
# Entwicklung
npm run dev

# Produktion
npm run build
npm start
```

## 🐳 Docker

### Vollständiger Stack starten
```bash
docker-compose up -d
```

### Nur Backend neu bauen
```bash
docker-compose build backend
docker-compose up -d backend
```

### Logs anzeigen
```bash
docker-compose logs -f backend
```

### Stack stoppen
```bash
docker-compose down
```

## 📊 API-Endpunkte

### Health Check
```
GET /health
```

### Authentifizierung
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

### Artikel
```
GET    /api/v1/articles
POST   /api/v1/articles
GET    /api/v1/articles/:id
PUT    /api/v1/articles/:id
DELETE /api/v1/articles/:id
```

### Rezepte
```
GET    /api/v1/recipes
POST   /api/v1/recipes
GET    /api/v1/recipes/:id
PUT    /api/v1/recipes/:id
DELETE /api/v1/recipes/:id
```

### Bilder
```
POST   /api/v1/images/upload
GET    /api/v1/images/:entityType/:entityId
DELETE /api/v1/images/:id
```

### Lieferanten
```
GET    /api/v1/suppliers
POST   /api/v1/suppliers
GET    /api/v1/suppliers/:id
PUT    /api/v1/suppliers/:id
DELETE /api/v1/suppliers/:id
```

## 🗄️ Datenbankschema

### Haupttabellen
- **users**: Benutzerverwaltung
- **articles**: Artikel/Zutaten
- **recipes**: Rezepte
- **recipe_ingredients**: Rezept-Zutaten-Beziehungen
- **recipe_steps**: Zubereitungsschritte
- **suppliers**: Lieferanten
- **images**: Bild-Metadaten

### Indizes
- Benutzer-spezifische Abfragen
- Entity-Bild-Beziehungen
- Rezept-Zutaten-Beziehungen

## 🖼️ Bildverwaltung

### MinIO-Integration
- Automatische Bucket-Erstellung
- S3-kompatible API
- Bildverarbeitung mit Sharp
- Thumbnail-Generierung
- Optimierte JPEG-Konvertierung

### Unterstützte Formate
- JPEG, PNG, GIF, WebP
- Automatische Größenanpassung (max. 1920x1080)
- Qualitätsoptimierung (85% JPEG)

## 🔐 Sicherheit

- **Helmet**: Security Headers
- **CORS**: Cross-Origin Resource Sharing
- **Rate Limiting**: API-Schutz
- **Input Validation**: Joi-Schema-Validierung
- **SQL Injection Protection**: Parameterisierte Queries

## 📝 Entwicklung

### Scripts
```bash
npm run dev          # Entwicklung mit Hot Reload
npm run build        # TypeScript kompilieren
npm run test         # Tests ausführen
npm run migrate      # Datenbank-Migrationen
npm run seed         # Beispieldaten einfügen
```

### Code-Struktur
```
src/
├── controllers/     # Request Handler
├── middleware/      # Express Middleware
├── models/         # Datenmodelle
├── routes/         # API-Routen
├── services/       # Geschäftslogik
├── database/       # Datenbankverbindung
├── utils/          # Hilfsfunktionen
└── index.ts        # Server-Einstiegspunkt
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### API Tests
```bash
npm run test:api
```

### Coverage
```bash
npm run test:coverage
```

## 📦 Deployment

### Produktionsumgebung
```bash
# Environment anpassen
NODE_ENV=production

# Build
npm run build

# Start
npm start
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Konfiguration

### Umgebungsvariablen
| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `NODE_ENV` | Umgebung | `development` |
| `PORT` | Server-Port | `3001` |
| `DB_HOST` | Datenbank-Host | `localhost` |
| `MINIO_ENDPOINT` | MinIO-Host | `localhost` |
| `JWT_SECRET` | JWT-Schlüssel | - |

### Datenbank-Konfiguration
- **Connection Pool**: Max 20 Verbindungen
- **Timeout**: 30s idle, 2s connection
- **SSL**: Konfigurierbar

## 🚨 Troubleshooting

### Häufige Probleme

#### Backend startet nicht
```bash
# Logs prüfen
docker-compose logs backend

# Datenbankverbindung testen
npm run migrate
```

#### Bilder werden nicht hochgeladen
```bash
# MinIO-Status prüfen
docker-compose logs minio

# Bucket-Policy prüfen
curl http://localhost:9001
```

#### Datenbank-Verbindungsfehler
```bash
# PostgreSQL-Status
docker-compose logs postgres

# Verbindung testen
psql -h localhost -U chef -d chef_numbers
```

## 📚 Weitere Dokumentation

- [API-Dokumentation](./docs/api.md)
- [Datenbankschema](./docs/database.md)
- [Deployment-Guide](./docs/deployment.md)
- [Frontend-Integration](./docs/frontend.md)

## 🤝 Beitragen

1. Fork erstellen
2. Feature-Branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add some AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:
- Issue auf GitHub erstellen
- Dokumentation durchsuchen
- Community-Forum nutzen
