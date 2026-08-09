FROM node:18-alpine

WORKDIR /app

# Copy package files from backend directory
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies for production
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
