FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy frontend files
COPY frontend/ ./frontend/
COPY webpack.config.js ./
COPY .babelrc ./

# Build the frontend
RUN npm run build

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]