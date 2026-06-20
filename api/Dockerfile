# ==========================================
# UNSU PLATFORM API SERVICE DOCKERFILE
# Multi-stage production build
# ==========================================

# 1. BUILD STAGE
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# 2. RUNTIME STAGE
FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3001
CMD ["npm", "run", "start"]
