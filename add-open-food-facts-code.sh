#!/bin/bash
# Bash-Skript zum Hinzufügen der open_food_facts_code Spalte
# Verwendung: ./add-open-food-facts-code.sh

echo "========================================"
echo "Migration v2.2.1: open_food_facts_code"
echo "========================================"
echo ""

# Prüfe ob Docker läuft
if ! docker ps | grep -q "postgres"; then
    echo "❌ PostgreSQL Container nicht gefunden oder läuft nicht!"
    echo "Starten Sie zuerst den Container mit: docker-compose up -d"
    exit 1
fi

echo "✓ PostgreSQL Container gefunden"
echo ""

# Führe Migrations-Skript aus
echo "Führe Migration aus..."
docker exec -i postgres psql -U postgres -d chef_numbers -f /docker-entrypoint-initdb.d/migration-2.2.1-add-open-food-facts-code.sql

echo ""
echo "Verifiziere Spalte..."
docker exec -i postgres psql -U postgres -d chef_numbers -f /docker-entrypoint-initdb.d/verify-open-food-facts-code.sql

echo ""
echo "========================================"
echo "Migration abgeschlossen"
echo "========================================"

