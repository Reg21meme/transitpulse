# ---- Stage 1: build ----
FROM node:24-slim AS builder

WORKDIR /app

# Install ALL dependencies (including dev) needed to build.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build the standalone production bundle.
COPY . .
RUN npm run build

# ---- Stage 2: run ----
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only the standalone output + static assets + public files from the builder.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# The standalone build produces a server.js entrypoint.
CMD ["node", "server.js"]