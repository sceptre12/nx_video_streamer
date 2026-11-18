owner: contracts/api-http.md
consumers: account-auth, db-server-grpc-users-videos, owner-scoped-library-api, range-video-streaming, ui-login-and-library-player, stack-e2e-playwright, redis-cache-layer
version: 1
status: proposed (design choices, not measured; the existing webcam routes are measured in facts.md)

# HTTP API of app-server (browser-facing, all under /api/v1)

Transport: JSON bodies, `Content-Type: application/json`, except the stream route. The UI reaches app-server through the UI container's same-origin `/api` proxy (see runtime-env-ports.md), so cookies are first-party; the browser client uses relative `/api/v1` URLs with `credentials: 'include'`. The browser entry URL is `http://localhost:${UI_HOST_PORT}`, not 127.0.0.1, because app-server CORS accepts only the hostname `localhost` (apps/app-server/src/app/plugins/cors.ts:11-12).

## Error shape (every non-2xx JSON response)
`{"version":"v1","error":{"code":"<snake_case>","message":"<text>"}}`

## Session
- Cookie name `nvs_session`; value is a signed JWT (HS256, claims `sub` = user_id, `exp` = issue time + 8 h); attributes `HttpOnly; SameSite=Lax; Path=/`; `Secure` only when env `COOKIE_SECURE=true`.
- A request to a protected route without a valid cookie answers 401 `unauthenticated`.

## Routes
| Method and path | Body or params | Success | Errors |
|---|---|---|---|
| POST /api/v1/auth/register | `{username, password}`; username `^[a-z0-9_]{3,32}$`, password 8-128 chars | 201 `{version, user_id, username}`; no cookie set | 400 `invalid_input`; 409 `username_taken` |
| POST /api/v1/auth/login | `{username, password}` | 200 `{version, user_id, username}` and Set-Cookie `nvs_session` | 400 `invalid_input`; 401 `invalid_credentials` (same code for unknown user and wrong password) |
| POST /api/v1/auth/logout | none (no body; the client sends no `Content-Type`, or `{}`) | 204, cookie cleared | none |
| GET /api/v1/auth/me | cookie | 200 `{version, user_id, username}`; header `Cache-Control: private, no-store` | 401 `unauthenticated` |
| GET /api/v1/library | cookie | 200 `{version, videos:[{video_id, title, duration_s, thumbnail_url, stream_url}]}`; only videos whose owner is the caller; response headers `X-Cache: HIT` or `MISS` and `Cache-Control: private, no-store` | 401 `unauthenticated` |
| GET /api/v1/videos/{video_id}/stream | cookie; optional `Range` header, single range only: `bytes=a-b`, `bytes=a-` or `bytes=-n` | 200 full body, or 206 with `Content-Range: bytes a-b/total` and a body equal to that slice of the file; headers `Accept-Ranges: bytes`, `Content-Type: video/mp4`, `ETag`, `Cache-Control: private, max-age=300`, `Vary: Cookie` | 401 `unauthenticated`; 404 `not_found` for a missing video AND for a video owned by someone else (no 403, so existence does not leak) AND when the stored path resolves outside VIDEO_STORAGE_DIR or is absolute; 416 `range_not_satisfiable` (also for a multi-range or malformed `Range`) |
| POST /api/v1/video/create, POST /api/v1/video/{video_id} | existing webcam routes (measured: apps/app-server/src/app/routes/api/v1/video/video.ts); `video_id` (create body, update path) must match `^[A-Za-z0-9_-]{1,64}$` | POST /api/v1/video/create answers 200 with `version` plus the full VideoRecord (`video_id`, `start_time`, `end_time`, `is_streaming`, `thumbnail_path`, `video_path`, `owner_id`, `title`, `duration_s`); the change is ADDITIVE: new fields `owner_id`, `end_time`, `title`, `duration_s` are added, none removed or renamed; the earlier wording "unchanged shape" was inaccurate | gain 401 `unauthenticated`; 400 `invalid_input` when `video_id` fails the pattern (db-server CreateVideo also answers INVALID_ARGUMENT, so no directory is created outside VIDEO_STORAGE_DIR); 409 `video_exists` on create when `video_id` already exists (db-server ALREADY_EXISTS); 500 `internal_error`; the created video is owned by the caller; POST /api/v1/video/{video_id} answers 404 `not_found` when the video is not owned by the caller (the owner id goes to db-server, see grpc-db.md) |
| socket.io on `/socket.io` (webcam capture, served by db-server :3001 and proxied by the ui container) | handshake carries the `nvs_session` cookie; events: `initalizeStream` `{video_id}`, `webcamVideoChunk` `{video_chunk}`, `endWebcamStream` `{video_id}` with an ack; a client-sent `video_path` is ignored (the client emits it today, apps/app1/src/app/hooks/useSocketConnection.ts:45-47,103-106); the capture target is a caller-owned `video_id` matching `^[A-Za-z0-9_-]{1,64}$`; the server derives the file path under VIDEO_STORAGE_DIR and never accepts a client-supplied path; capture state is per socket: `initalizeStream` (after the handshake and the owner check) binds {user_id, owned video_id, write stream} to that socket, `webcamVideoChunk` and `endWebcamStream` act only on that socket's own stream, state is cleared on end and on disconnect, and there is no module-global stream state (the global STREAM_STATE_MANAGER, apps/db-server/src/app/video_processor/streamVideoToServer/index.ts:24, is removed), so a second authenticated socket cannot write to or end another user's capture and two sequential captures each open their own file | connection accepted | handshake without a valid cookie is refused with `unauthenticated`; a `video_id` that fails the pattern or is not owned by the caller is rejected |

`stream_url` is the relative path `/api/v1/videos/{video_id}/stream`; `thumbnail_url` is `null` in this epic (no thumbnail route or seed output exists).
