# app-server image: build stage then slim runtime. Run from the repo root:
#   docker build -f apps/app-server/Dockerfile .
FROM node:20.14.0-slim AS build
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm ci
RUN npx prisma generate --schema apps/db-server/prisma/schema.prisma
RUN npx nx build app-server

FROM node:20.14.0-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    VIDEO_STORAGE_DIR=/data/videos
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist/apps/app-server ./dist/apps/app-server
COPY --from=build /build/protos ./protos
RUN mkdir -p /data/videos && chown -R node:node /data /app
USER node
CMD ["node", "dist/apps/app-server/main.js"]
