# Single Dockerfile for both client and server
FROM node:22-alpine

# Setup work directory
WORKDIR /app

# Copy package files from both directories
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependedncies for both
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build the React app for production
RUN cd client && npm run build

# Copy built React files to server's static directory
RUN mkdir -p server/public
RUN cp -r client/build/* server/public/

# Only expose port 5000 (monolithic approach)
EXPOSE 5000

# Start the server (which serves both API and React app)
# CMD ["npm", "run", "start"]
CMD ["node", "server/app.js"]