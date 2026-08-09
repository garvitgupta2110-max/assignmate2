# ResuMate - Docker Compose Setup

This file helps you run ResuMate using Docker without manual setup.

## Prerequisites

- Docker Desktop installed
- Docker Compose installed

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resumate.git
   cd resumate
   ```

2. **Create environment files**
   ```bash
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

3. **Update environment variables** in the created files

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

## Services

- **Frontend**: Next.js application on port 3000
- **Backend**: Express.js API on port 5000
- **MongoDB**: Database on port 27017
- **Redis** (optional): Cache on port 6379

## Useful Commands

```bash
# View logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build

# Access MongoDB shell
docker exec -it resumate-mongo mongo

# Access backend shell
docker exec -it resumate-backend /bin/bash
```

## Troubleshooting

### Port conflicts
If ports are already in use, modify the docker-compose.yml file to use different ports.

### Database not initialized
```bash
docker-compose down -v
docker-compose up -d
```

### Clear everything and restart
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

