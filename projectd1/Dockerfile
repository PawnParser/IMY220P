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

# Build the frontend
RUN cd frontend && npm run build

# Expose ports
EXPOSE 3000
EXPOSE 5000

# Start both services using your existing script
CMD ["npm", "run", "dev:server"]