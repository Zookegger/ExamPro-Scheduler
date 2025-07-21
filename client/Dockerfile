# Multi-stage build for React app
FROM node:22-alpine AS build_stage

# Set working directory
WORKDIR /app

# Copy client package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy client source code
COPY . .

# Build React app for production
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production_stage

# Copy built React files to Nginx
COPY --from=build_stage /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S exampro_user
RUN adduser -S exampro_user -u 1001

# Expose port 3000 (or 80 for standard HTTP)
EXPOSE 3000

# Health check for Nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]