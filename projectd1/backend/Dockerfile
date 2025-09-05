FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy backend files
COPY backend/ ./backend/

# Copy frontend dist folder for production serving
COPY frontend/dist/ ./frontend/dist/

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "backend/server.js"]