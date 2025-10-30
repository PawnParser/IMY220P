FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy all source code
COPY . .

# Build frontend
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Expose both ports
EXPOSE 3000 5000

# Start both services (you'll need to modify this)
WORKDIR /app
CMD ["npm", "start"]