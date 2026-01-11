#!/bin/bash
# Erstellt ein Self-Signed Zertifikat für localhost
# Für Git Bash auf Windows

openssl req -x509 -newkey rsa:2048 -keyout localhost.key -out localhost.crt -days 365 -nodes <<EOF
DE
BY
Munich
The Chef's Numbers
Development
localhost
dev@chefsnumbers.local
EOF

echo ""
echo "✅ Zertifikat erstellt!"
echo "   - localhost.crt"
echo "   - localhost.key"
echo ""
echo "Jetzt können Sie HTTPS aktivieren:"
echo "  PowerShell: \$env:HTTPS='true'; npm start"
echo "  CMD: set HTTPS=true && npm start"
echo "  Bash: HTTPS=true npm start"
