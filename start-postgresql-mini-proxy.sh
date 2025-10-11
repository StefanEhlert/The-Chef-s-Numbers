#!/bin/bash

# PostgreSQL-Mini-Proxy Start-Script
# Für The Chef's Numbers Frontend

echo "🚀 Starte PostgreSQL-Mini-Proxy..."

# Prüfe ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert!"
    echo "Bitte installieren Sie Node.js von https://nodejs.org/"
    exit 1
fi

# Prüfe ob npm installiert ist
if ! command -v npm &> /dev/null; then
    echo "❌ npm ist nicht installiert!"
    echo "Bitte installieren Sie npm (kommt mit Node.js)"
    exit 1
fi

# Erstelle Mini-Proxy Verzeichnis falls nicht vorhanden
if [ ! -d "postgresql-mini-proxy" ]; then
    echo "📁 Erstelle PostgreSQL-Mini-Proxy Verzeichnis..."
    mkdir postgresql-mini-proxy
fi

cd postgresql-mini-proxy

# Kopiere Dateien falls nicht vorhanden
if [ ! -f "package.json" ]; then
    echo "📄 Erstelle package.json..."
    cat > package.json << 'EOF'
{
  "name": "postgresql-mini-proxy",
  "version": "1.0.0",
  "description": "PostgreSQL Mini-Proxy für The Chef's Numbers Frontend",
  "main": "postgresql-mini-proxy.js",
  "scripts": {
    "start": "node postgresql-mini-proxy.js",
    "dev": "nodemon postgresql-mini-proxy.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": [
    "postgresql",
    "proxy",
    "mini",
    "chef",
    "numbers"
  ],
  "author": "The Chef's Numbers Team",
  "license": "MIT"
}
EOF
fi

if [ ! -f "postgresql-mini-proxy.js" ]; then
    echo "📄 Kopiere Mini-Proxy..."
    cp ../postgresql-mini-proxy.js postgresql-mini-proxy.js
fi

# Installiere Dependencies
echo "📦 Installiere Dependencies..."
npm install

# Starte Mini-Proxy
echo "🚀 Starte PostgreSQL-Mini-Proxy auf Port 3002..."
echo "📡 Health Check: http://localhost:3002/health"
echo "🔗 API Endpoints verfügbar:"
echo "   POST /api/postgres/test"
echo "   POST /api/postgres/check-db"
echo "   POST /api/postgres/create-db"
echo "   POST /api/postgres/check-structure"
echo "   POST /api/postgres/create-structure"
echo ""
echo "Drücken Sie Ctrl+C zum Beenden"
echo ""

npm start
