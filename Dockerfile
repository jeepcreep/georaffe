FROM node:20-slim AS base

# Coolify's HTTP healthcheck shells out to curl/wget, neither of which node:20-slim ships.
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so the layer cache survives source changes
COPY package.json package-lock.json ./
RUN npm ci

# Copy the app source (previously cloned from GitHub inside the image,
# which made builds depend on a pushed state and fetched the repo twice)
COPY . .

RUN npm run build

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000

CMD ["npm", "start"]
