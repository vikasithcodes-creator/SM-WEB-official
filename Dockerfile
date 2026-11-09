# Production image for Cloud Run (or any container host).

# ---- Build: compile the React app (dist/) and bundle the server (build/) ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime: production dependencies only ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/build ./build
COPY data ./data

# The server writes its JSON cache to data/ and customer files to uploads/.
RUN mkdir -p uploads && chown -R node:node data uploads
USER node

# Cloud Run provides PORT (8080); the server falls back to 3000 elsewhere.
EXPOSE 8080
CMD ["node", "build/server.js"]
