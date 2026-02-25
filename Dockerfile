# PolyLance Backend Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies (ignoring scripts because we only need backend)
RUN npm install --prefix backend --legacy-peer-deps

# Copy backend source
COPY backend/ ./backend/

# Set Environment Variables (Placeholders)
ENV PORT=3001
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/api/health || exit 1

EXPOSE 3001

CMD ["node", "backend/src/server.js"]
