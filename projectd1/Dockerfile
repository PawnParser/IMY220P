FROM node:18-alpine

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

# Copy webpack config
COPY webpack.config.js ./

# Copy frontend source
COPY frontend ./frontend

# Build frontend (creates frontend/dist)
RUN npm run build

# Now install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Copy backend source
COPY backend/server.js ./
COPY backend ./

# Expose ports
EXPOSE 5000

# Start backend
CMD ["node", "server.js"]