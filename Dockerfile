FROM node:20-slim AS base

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
