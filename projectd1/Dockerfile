# Dockerfile (in projectd1/)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install all dependencies
RUN npm install

# Copy all source code
COPY . .

# Install backend dependencies separately
RUN cd backend && npm install --production

# Build the frontend
RUN npm run build

# Expose ports
EXPOSE 3000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node backend/health-check.js

# Start the application
CMD ["npm", "run", "dev:server"]