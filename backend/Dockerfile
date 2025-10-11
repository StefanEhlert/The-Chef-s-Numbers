# Multi-stage build für optimale Image-Größe
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiere package files
COPY package*.json ./

# Installiere dependencies
RUN npm ci --only=production

# Kopiere source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Installiere nur production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Kopiere built code
COPY --from=builder /app/dist ./dist

# Erstelle non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Ändere Besitzer der App-Verzeichnisse
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start command
CMD ["node", "dist/index.js"]
