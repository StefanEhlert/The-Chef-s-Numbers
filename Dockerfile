# ============================================
# The Chef's Numbers - Frontend Dockerfile
# Multi-Stage Build für optimale Image-Größe
# ============================================

# ============================================
# Stage 1: Build
# ============================================
FROM node:18-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# Metadata
LABEL maintainer="The Chef's Numbers Team"
LABEL description="The Chef's Numbers - Professional Recipe Management"
LABEL version="2.3.0"

# Package files kopieren und Dependencies installieren
# Nutze Layer-Caching: package*.json zuerst
COPY package*.json ./

# ALLE Dependencies installieren (auch devDependencies für Build)
RUN npm ci --silent

# Source Code kopieren
COPY . .

# React App für Production bauen
# Die Build-Artefakte landen in /app/build
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM nginx:alpine

# Nginx konfigurieren
COPY nginx.conf /etc/nginx/nginx.conf

# Build-Artefakte von Stage 1 kopieren
COPY --from=builder /app/build /usr/share/nginx/html

# Port 80 exponieren (Standard HTTP)
EXPOSE 80

# Health Check für Container-Status
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx im Vordergrund starten
CMD ["nginx", "-g", "daemon off;"]

