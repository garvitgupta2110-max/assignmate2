FROM node:18-bookworm-slim

WORKDIR /app

# Install Python, C/C++ compiler and Java
RUN apt-get update && apt-get install -y \
    python3 \
    python-is-python3 \
    gcc \
    g++ \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Port
EXPOSE 5000

# Start server
CMD ["npm", "start"]