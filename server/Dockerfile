FROM node:22-alpine

# Set working directory for server only
WORKDIR /app

# Copy server package files
COPY package*.json ./

# Install server dependencies
RUN npm ci --only=production

# Copy server source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S exampro_user
RUN adduser -S exampro_user -u 1001
USER exampro_user

# Expose API port
EXPOSE 5000

# Health check for server
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the Express server
CMD ["node", "app.js"]