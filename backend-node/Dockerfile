# Node base — slim keeps it small. Node 24 matches your local nvm version.
FROM node:24-slim

WORKDIR /app

# Install dependencies first (cached layer — only reruns if package files change).
# Copy both package.json and lockfile, then npm ci for a clean, reproducible install.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source in.
COPY . .

# WebSocket server listens on 8081.
EXPOSE 8081

# Run the service (tsx, no watch).
CMD ["npm", "run", "start"]