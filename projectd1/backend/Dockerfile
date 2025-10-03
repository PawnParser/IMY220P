FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend for production
COPY frontend/dist/ ./frontend/dist/

# Create .env file with MongoDB Atlas connection
RUN echo "MONGODB_URI=mongodb+srv://u22857941:Sm9x38gRbDdL4hKt@imy220prac5.41pvu.mongodb.net/versioncontrol?retryWrites=true&w=majority" > .env
RUN echo "JWT_SECRET=your-super-secret-jwt-key-change-in-production-123" >> .env
RUN echo "NODE_ENV=production" >> .env

# Expose port
EXPOSE 5000

# Health check script
COPY health-check.js ./

# Start the server
CMD ["node", "backend/server.js"]