owner: contracts/cache-keys.md
consumers: redis-cache-layer, stack-e2e-playwright
version: 1
status: proposed

# Redis keys (app-server only; env REDIS_URL)
| key | value | TTL | written by | invalidated by |
|---|---|---|---|---|
| `lib:v1:{user_id}` | the JSON body of GET /api/v1/library | 60 s | library route on MISS | any video create, update, delete or stream-state change for that owner |
| `user:v1:{user_id}` | JSON `{user_id, username}` used by the auth check | 300 s | auth hook on MISS | never explicitly (TTL only) |
Rules: read-through; when Redis is unreachable every read behaves as a MISS and a warning is logged (fail open); the stream route's bytes are not cached in Redis (HTTP `ETag` and `Cache-Control` only); `password_hash` is never cached. Direct database writes that bypass app-server (the seed script, the webcam socket capture) do not invalidate `lib:v1:{user_id}`; those entries expire by TTL only, and `user:v1:{user_id}` is never invalidated explicitly.
