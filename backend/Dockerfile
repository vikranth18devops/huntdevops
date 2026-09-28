# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Production Execution
FROM node:20-alpine AS runner

# Patch OS packages and remove unused npm CLI to eliminate bundled CVEs
RUN apk update && apk upgrade --no-cache && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/server/index.js"]
