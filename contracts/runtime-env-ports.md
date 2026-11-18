owner: contracts/runtime-env-ports.md
consumers: containerised-stack, spike-container-build-approach, spike-ui-static-serving-and-proxy, account-auth, db-server-grpc-users-videos, redis-cache-layer, range-video-streaming, seed-demo-accounts-and-videos, stack-e2e-playwright
version: 1
status: proposed; port numbers 3001, 3002, 50051, 4200 are measured (facts.md "grep PORT"); the rest are design choices

# Compose services (names are DNS names on the compose network)
`ui` (nginx serving the built app1, proxying /api to app-server and /socket.io to db-server), `app-server`, `db-server`, `postgres`, `redis`, and `seed` (one-shot: runs the demo seed, mounts the video volume read-write and exits 0; it is not a long-running service, so health applies to the other five).

# Ports
| port | service | published to host | why fixed |
|---|---|---|---|
| 36000 | ui (container 8080) | yes, env `UI_HOST_PORT`, default 36000 | the one browser entry point; value is profile `ports.lane_base` |
| 3002 | app-server | no | existing default (measured) |
| 3001 | db-server HTTP | no | existing default (measured) |
| 50051 | db-server gRPC | no | existing constant GRPC_PORT (measured); db-server reads env `GRPC_PORT` with default 50051 so specs can bind a free port (default, proposed) |
| 5432 | postgres | no | image default |
| 6379 | redis | no | image default |
Local dev (no containers) keeps 4200 (app1) and the three backend ports above; the app1 dev server proxies /api to http://localhost:3002 and /socket.io to http://localhost:3001 (apps/app1/proxy.conf.json).

# Environment variable names (names only, never values)
`DATABASE_URL`, `DIRECT_URL` (existing, measured in schema.prisma; DIRECT_URL is set equal to DATABASE_URL in compose), `JWT_SECRET` (no default, at least 32 bytes; app-server and db-server each refuse to start without it), `COOKIE_SECURE`, `REDIS_URL`, `VIDEO_STORAGE_DIR` (default `/data/videos`, a shared named volume mounted read-write on db-server and on the one-shot `seed`, read-only on app-server), `GRPC_PORT` (db-server gRPC bind port, default 50051), `COMPOSE_PROJECT_NAME` (includes the lane or run id), `DB_GRPC_ADDR` (app-server's address of db-server, default `db-server:50051` in containers), `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `UI_HOST_PORT`, `HOST` (`0.0.0.0` in containers; the apps default to `localhost`), `PORT` (existing), `DEMO_USER1_PASSWORD`, `DEMO_USER2_PASSWORD`. The two demo usernames are fixed values, not variables: `demo1` (password `DEMO_USER1_PASSWORD`) and `demo2` (password `DEMO_USER2_PASSWORD`); both are valid under the api-http username pattern, are not secret, and the seed, scripts/stack-smoke.sh and the e2e specs all use them.
Secrets rule (default, proposed): no secret value is committed. `scripts/stack-env.sh` (task `containerised-stack`) writes a git-ignored `.env` with random values for JWT_SECRET, POSTGRES_PASSWORD, DEMO_USER1_PASSWORD and DEMO_USER2_PASSWORD (the `.env` is covered by .gitignore and never committed); the seed script and the e2e and stack-smoke scripts read the two demo passwords from those names, the seed never generates them.
