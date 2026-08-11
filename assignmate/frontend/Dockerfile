FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/.next ./.next

EXPOSE 3000

CMD ["npm", "start"]
