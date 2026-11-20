# db-server image: build stage then slim runtime. Run from the repo root:
#   docker build -f apps/db-server/Dockerfile .
FROM node:20.14.0-slim AS build
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm ci
RUN npx prisma generate --schema apps/db-server/prisma/schema.prisma
RUN npx nx build db-server

FROM node:20.14.0-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    VIDEO_STORAGE_DIR=/data/videos
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist/apps/db-server ./dist/apps/db-server
COPY --from=build /build/protos ./protos
COPY --from=build /build/apps/db-server/prisma ./apps/db-server/prisma
COPY --from=build /build/package.json ./package.json
RUN mkdir -p /data/videos && chown -R node:node /data /app
USER node
# Default entrypoint: migrate, then listen. Compose may override entrypoint and command.
ENTRYPOINT ["sh", "-c", "npx prisma migrate deploy --schema apps/db-server/prisma/schema.prisma && exec node dist/apps/db-server/main.js"]
