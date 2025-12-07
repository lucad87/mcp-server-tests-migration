FROM node:20-alpine

LABEL maintainer="Luca Donnaloia"
LABEL description="MCP Test Migration Server - WDIO to Playwright"
LABEL version="2.1.0"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY index.js ./
COPY server-http.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

USER nodejs

# Expose HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Default to HTTP server mode
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "server-http.js"]
