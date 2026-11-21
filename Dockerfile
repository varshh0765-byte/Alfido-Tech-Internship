# ---------- Stage 1: install production dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# ---------- Stage 2: minimal runtime image ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy only what is needed to run (no npm cache, no dev tooling)
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Run as the unprivileged "node" user that ships with the image
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
