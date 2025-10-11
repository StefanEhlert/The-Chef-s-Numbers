#!/bin/bash
# generate-jwt-secret.sh
# Generiert JWT-Secret aus PostgreSQL-Passwort (deterministisch)

# Parameter prüfen
if [ $# -eq 0 ]; then
    echo "Verwendung: $0 <postgres_password>"
    echo "Beispiel: $0 postgres123"
    exit 1
fi

POSTGRES_PASSWORD=$1

echo "🔐 Generiere JWT-Secret aus PostgreSQL-Passwort..."
echo "Passwort: [HIDDEN]"

# SHA-256 Hash des Passworts generieren
JWT_SECRET=$(echo -n "$POSTGRES_PASSWORD" | sha256sum | cut -d' ' -f1)

echo "✅ JWT-Secret generiert:"
echo "JWT_SECRET=$JWT_SECRET"

echo ""
echo "📋 Docker-Compose-Konfiguration:"
echo "PGRST_JWT_SECRET: \"$JWT_SECRET\""
echo "PGRST_JWT_SECRET_IS_BASE64: false"

echo ""
echo "🧪 Test der Wiederholbarkeit:"
SECRET1=$(echo -n "$POSTGRES_PASSWORD" | sha256sum | cut -d' ' -f1)
SECRET2=$(echo -n "$POSTGRES_PASSWORD" | sha256sum | cut -d' ' -f1)

if [ "$SECRET1" = "$SECRET2" ]; then
    echo "✅ JWT-Secret-Generierung ist wiederholbar"
else
    echo "❌ JWT-Secret-Generierung ist NICHT wiederholbar!"
fi

echo ""
echo "📝 Frontend-Implementierung:"
echo "const jwtSecret = await generateJWTSecretFromPassword('$POSTGRES_PASSWORD');"
echo "// Sollte ergeben: $JWT_SECRET"
