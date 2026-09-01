FROM node:18-bookworm-slim

WORKDIR /app

# Install Python, C/C++ compiler, Java JDK and standard modules
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python-is-python3 \
    python3-numpy \
    python3-pandas \
    python3-requests \
    python3-sympy \
    python3-scipy \
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

EXPOSE 5000

CMD ["npm", "start"]