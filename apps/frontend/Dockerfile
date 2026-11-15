# syntax=docker/dockerfile:1

# ---- Build: compile the Vite app into static files ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve: unprivileged nginx (runs as uid 101 on port 8080) ----
FROM nginxinc/nginx-unprivileged:stable-alpine

# Defaults suit docker compose; Kubernetes overrides them (see charts/reconcile).
ENV API_UPSTREAM=http://backend:4000 \
    DNS_RESOLVER=127.0.0.11

# The image renders /etc/nginx/templates/*.template into conf.d on startup.
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
