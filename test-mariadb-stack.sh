#!/bin/bash

# Chef's Numbers MariaDB Docker Stack Test Script
echo "🧪 Teste MariaDB Docker Stack..."

# Prüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ist nicht gestartet!"
    exit 1
fi

echo "✅ Docker läuft"

# Stoppe eventuell laufende Container
echo "🛑 Stoppe eventuell laufende Container..."
docker-compose -f docker-compose-mariadb.yml down

# Starte den Stack
echo "🚀 Starte MariaDB Stack..."
docker-compose -f docker-compose-mariadb.yml up -d

# Warte auf Services
echo "⏳ Warte auf Services..."
sleep 30

# Teste MariaDB Verbindung
echo "🔍 Teste MariaDB Verbindung..."
if docker exec chef-numbers-mariadb mysqladmin ping -h localhost -u root -pchef123 --silent; then
    echo "✅ MariaDB ist erreichbar"
else
    echo "❌ MariaDB ist nicht erreichbar"
    docker-compose -f docker-compose-mariadb.yml logs mariadb
    exit 1
fi

# Teste Prisma API
echo "🔍 Teste Prisma API..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Prisma API ist erreichbar"
else
    echo "❌ Prisma API ist nicht erreichbar"
    docker-compose -f docker-compose-mariadb.yml logs prisma-api
    exit 1
fi

# Teste API Endpoints
echo "🔍 Teste API Endpoints..."
API_RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$API_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health Check erfolgreich"
    echo "📊 Response: $API_RESPONSE"
else
    echo "❌ Health Check fehlgeschlagen"
    echo "📊 Response: $API_RESPONSE"
fi

echo ""
echo "🎉 MariaDB Docker Stack Test erfolgreich!"
echo "📊 MariaDB: localhost:3306"
echo "🚀 Prisma API: http://localhost:3001"
echo "🔍 Health Check: http://localhost:3001/health"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Teste die API mit Postman oder curl"
echo "2. Integriere die API in das Frontend"
echo "3. Konfiguriere die StorageManagement Komponente"
echo ""
echo "🛑 Zum Stoppen: docker-compose -f docker-compose-mariadb.yml down"
