# syntax=docker/dockerfile:1

# ---- Build: compile TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN MONGOMS_DISABLE_POSTINSTALL=1 npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime: production dependencies + compiled JS only ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health >/dev/null || exit 1

CMD ["node", "dist/server.js"]
