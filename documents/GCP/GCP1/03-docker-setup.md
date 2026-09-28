# 03 - Docker Setup & Multi-Stage Containerization Guide

Containerization ensures that the **HuntDevOps** application runs consistently across developer workstations, CI security scanners, and production GKE clusters.

---

## 🏗️ Multi-Stage Containerization Overview

Multi-stage Docker builds allow us to separate the build-time environment (heavy dependencies, compilers, TypeScript build tools) from the lightweight runtime environment (only production artifacts and minimal base image).

### Key Benefits:
1. **Dramatically Smaller Image Size**: Reduces image size from >1GB down to ~50-80MB.
2. **Enhanced Security Surface**: Production runner images contain no compilers, NPM caches, or build tools.
3. **Faster Pull Times**: Accelerates GKE pod scaling and deployment times.

---

## 📦 Frontend Dockerfile (`frontend/Dockerfile`)

The frontend application is built using React, Vite, and NGINX.

```dockerfile
# Stage 1: Build React Client Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: NGINX Web Server Runtime
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Stage Breakdown:
* **Stage 1 (builder)**: Installs development dependencies (`npm ci`), copies source code, and builds static JavaScript/CSS assets into `/app/dist`.
* **Stage 2 (runner)**: Uses a tiny Alpine NGINX image, copies only the static assets from `/app/dist`, injects custom NGINX routing configuration (`nginx.conf`), and serves traffic on port 80.

---

## ⚙️ Backend Dockerfile (`backend/Dockerfile`)

The backend API is built using Node.js, Express, and TypeScript connected to PostgreSQL.

```dockerfile
# Stage 1: Build TypeScript Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Execution
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/server/index.js"]
```

### Stage Breakdown:
* **Stage 1 (builder)**: Compiles TypeScript files (`.ts`) to JavaScript binaries in `dist/`.
* **Stage 2 (runner)**: Copies only compiled JavaScript files and production node modules (`npm ci --only=production`), exposing port 4000 for API requests.

---

## 💻 Local Testing & Verification Commands

### Build Frontend & Backend Images Locally
```bash
# Build Frontend
docker build -t huntdevops-frontend:local ./frontend

# Build Backend
docker build -t huntdevops-backend:local ./backend
```

### Test Container Execution Locally
```bash
# Run Backend Container on Port 4000
docker run -d -p 4000:4000 --name test-backend huntdevops-backend:local

# Verify Healthcheck Endpoint
curl http://localhost:4000/api/health

# Clean Up Test Container
docker stop test-backend && docker rm test-backend
```
