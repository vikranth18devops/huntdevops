# 03 - Docker Setup & Multi-Stage Containerization Guide

Containerization ensures that the **HuntDevOps** application runs identically across developer workstations, CI security scanners, and production GKE clusters.

---

## 📋 Prerequisites

Before proceeding, ensure you have:
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (Docker Engine & CLI installed).
- [x] Completed **[02-gcp-artifact-registry.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-gcp-artifact-registry.md)** (Docker CLI authenticated to `us-central1-docker.pkg.dev`).
- [x] Docker daemon running locally:
  ```bash
  docker info
  ```

---

## 🏗️ Multi-Stage Containerization Architecture

Multi-stage Docker builds separate the build environment (compilers, TypeScript development tools, heavy `node_modules`) from the minimal production runtime:

| Metric | Single-Stage Build | Multi-Stage Build | Benefit |
| :--- | :--- | :--- | :--- |
| **Image Size** | ~1.1 GB | ~45 - 60 MB | **95% Reduction** in storage & network transfer |
| **Attack Surface** | High (Includes compilers, build tools) | Minimal (Distroless / Alpine runtime only) | Eliminates build-time CVE vulnerabilities |
| **GKE Pod Startup** | 45-60 seconds | 3-5 seconds | Fast autoscaling and quick rolling updates |

---

## 📦 Frontend Dockerfile (`frontend/Dockerfile`)

The React client application is built with Vite and served via an ultra-lightweight NGINX Alpine web server:

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
* **Stage 1 (`builder`)**: Installs dependencies (`npm ci`), copies source code, and compiles assets into `/app/dist`.
* **Stage 2 (`runner`)**: Uses `nginx:1.27-alpine`, copies only compiled static assets from `/app/dist`, injects custom SPA routing (`nginx.conf`), and exposes port `80`.

---

## ⚙️ Backend Dockerfile (`backend/Dockerfile`)

The backend API is built using Node.js, Express, and TypeScript connected to PostgreSQL:

```dockerfile
# Stage 1: Build TypeScript Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Execution Runtime
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
* **Stage 1 (`builder`)**: Compiles TypeScript files (`.ts`) to production JavaScript (`.js`) in `dist/`.
* **Stage 2 (`runner`)**: Installs production-only dependencies (`npm ci --only=production`), copies compiled `dist/` files, and executes the server on port `4000`.

---

## 💻 Local Testing & Verification Commands

### 1. Build Container Images Locally
```bash
# Build Frontend Image
docker build -t huntdevops-frontend:local ./frontend

# Build Backend Image
docker build -t huntdevops-backend:local ./backend
```

### 2. Verify Built Images & Sizes
```bash
docker images | grep huntdevops
```
*Expected Output*: Both images show clean build status with small footprint (~50-80MB).

### 3. Run and Test Backend API Container
```bash
# Start test container
docker run -d -p 4000:4000 --name test-backend huntdevops-backend:local

# Verify API healthcheck endpoint
curl http://localhost:4000/api/health

# Clean up test container
docker stop test-backend && docker rm test-backend
```

---

## ⏭️ Next Step

Once your images build cleanly, test them for CVE vulnerabilities using Trivy:
👉 **[04 - Trivy Container Vulnerability Scanning](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/04-trivy-setup.md)**
