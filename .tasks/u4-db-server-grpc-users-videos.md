# Task Spec: u4 db-server-grpc-users-videos: Authenticated per-socket webcam capture, VIDEO_STORAGE_DIR capture path and CORS narrowing

> Branch: `GH-6-db-server-grpc-users-videos-u4`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st2-u4`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-6   Sub-task: st2 (`GH-6-db-server-grpc-users-videos`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Make the socket.io webcam capture on :3001 authenticated and per-socket: handshake verifies the `nvs_session` JWT, the file path is derived server-side from a caller-owned video_id under VIDEO_STORAGE_DIR, state is per socket, and cors.origin is narrowed.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st2) and section 7
- Dependencies: Blocked by: u3 (its Integrator item i3 in the same wave: the owner lookup and VIDEO_STORAGE_DIR constant it merged). Done input: the INSTALLED ledger row for `jsonwebtoken` (owner u4, plan P5; plus `@types/jsonwebtoken` when the installed version ships no types).
- Desk steps (not done by this unit): INSTALL `jsonwebtoken` (owner u4) in the st2 worktree before dispatch (plan P0a step 4); prisma generate and the db-server build by the desk (P10a c23).

## 3. Scope
**In scope:**
- apps/db-server/src/main.ts
- apps/db-server/src/app/video_processor/**
- apps/db-server/src/app/plugins/**
**Out of scope:**
1. gRPC handlers and db helpers (u3).
2. app-server code.
3. The webcam UI (st8).
**Do NOT create:**
1. A module-global stream state (STREAM_STATE_MANAGER is removed).
2. Acceptance of a client-supplied `video_path`.
3. A cookie-parsing dependency (parse `socket.handshake.headers.cookie` by hand).
4. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | socket.io row: handshake carries the `nvs_session` cookie; events `initalizeStream {video_id}`, `webcamVideoChunk {video_chunk}`, `endWebcamStream {video_id}` with ack; client `video_path` ignored; `video_id` matches `^[A-Za-z0-9_-]{1,64}$` and is caller-owned; per-socket state cleared on end and on disconnect; no module-global stream state | contracts/api-http.md |
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | Session: cookie name, JWT algorithm, claims and expiry: see contracts/api-http.md (Session rule) | contracts/api-http.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `JWT_SECRET` (no default, at least 32 bytes, db-server refuses to start without it), `VIDEO_STORAGE_DIR`, `UI_HOST_PORT` (default 36000), `PORT` | contracts/runtime-env-ports.md |
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | owner check through the owner-filtered db helpers (legacy `owner_id` NULL video refused) | contracts/grpc-db.md |

## 5. Inherited Module API
Existing (measured): `apps/db-server/src/main.ts` registers `fastify-socket.io` with `cors.origin: '*'` (lines 19-23) and handles `initalizeStream`/`webcamVideoChunk`/`endWebcamStream` at lines 56-78 with a client `video_path`; `apps/db-server/src/app/video_processor/streamVideoToServer/index.ts` holds the global STREAM_STATE_MANAGER and accepts a path guarded by `path.includes(STORAGE_PATH)`. From u3: the owner-filtered db helpers and `VIDEO_STORAGE_DIR` constant in `apps/db-server/src/app/utils/**`, and the spec helper `apps/db-server/src/app/utils/test-support/**`.

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. Built db-server child (test-plan.md A2): the spec spawns `node dist/apps/db-server/main.js` from the repo root (cwd matters: VIDEO_PROTO_PATH is the cwd-relative `protos/src/video/v1/video.proto`, globals/src/lib/constants.ts:1) on free ports (env PORT for fastify and socket.io, env GRPC_PORT for gRPC) (the helper picks a free port by binding port 0 and reading it back; because pick-then-bind can collide when specs run in parallel, it retries the spawn with a new port on EADDRINUSE, at most 3 attempts, and a spec never hard-codes a port) with DB_GRPC_ADDR, DATABASE_URL, DIRECT_URL, JWT_SECRET and VIDEO_STORAGE_DIR set inline; `npx nx build db-server` must have run first (review-architecture.md H2). socket-capture.spec sets its own free PORT. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| owner lookup and storage constant | merged u3 (i3) | import from `apps/db-server/src/app/utils/**` and `apps/db-server/src/app/db/**`; do not edit them |
| `jsonwebtoken` | desk INSTALL ledger row (owner u4) | use for the HS256 verify only |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| handshake without a valid cookie | refused with `unauthenticated` | accepting the connection | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| capture state | bound per socket, cleared on end and on disconnect | STREAM_STATE_MANAGER module global (`is_stream_active` stays true after a capture) | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| file path | derived server-side under VIDEO_STORAGE_DIR from a caller-owned `video_id` | `path.includes(STORAGE_PATH)` on a client path | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| JWT verify | `algorithms: ['HS256']` only, secret from env JWT_SECRET | accepting `alg: none` or another algorithm, or a default secret | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| cors.origin | `http://localhost:${UI_HOST_PORT}` (default 36000) | `*` | architecture.md item 5 via the db-server-grpc-users-videos draft requirement 4 (default, proposed) |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| db-server build | run `npx nx build db-server` before a spec that spawns db-server; spawn `dist/apps/db-server/main.js` from the repo root | spawning an unbuilt db-server; spawning from another cwd | review-architecture.md H2; test-plan.md A2 |
| alias imports in the built output | db-server and app-server import `@globals/constants` at runtime and both project.json files set `bundle: false`; u-owner verifies the built `dist/apps/db-server/main.js` starts; if the alias does not resolve, write `.decisions/<unit>.md` and stop (project.json is in no unit's scope) | editing project.json or tsconfig.base.json to work around it | measured: grep -rn '@globals/constants' apps/db-server/src apps/app-server/src (plan P0b F3) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] Unauthenticated, path-traversal and legacy `owner_id` NULL socket capture are refused (socket-capture.spec.ts).
- [ ] A socket handshake token signed with `alg: none` or HS512 (not HS256) is refused (socket-capture.spec.ts).
- [ ] The owner's capture is accepted; a second authenticated socket's chunk or end does not touch the first user's file; two sequential captures both write (socket-capture.spec.ts).
- [ ] db-server refuses to start without JWT_SECRET (socket-capture.spec.ts).
- [ ] No module-global stream state remains in video_processor/** (STREAM_STATE_MANAGER count 0).
- [ ] `"jsonwebtoken"` is present in package.json.

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q jsonwebtoken package.json && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/src/app/video_processor/socket-capture.spec.ts && ! grep -rqn STREAM_STATE_MANAGER apps/db-server/src && echo U4-OK
# criterion 4 (expect 0)
grep -rn STREAM_STATE_MANAGER apps/db-server/src | wc -l
```
Done token: `U4-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q jsonwebtoken package.json && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/src/app/video_processor/socket-capture.spec.ts && ! grep -rqn STREAM_STATE_MANAGER apps/db-server/src && echo U4-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-6-db-server-grpc-users-videos-u4` from `origin/main` (the sub-task branch `GH-6-db-server-grpc-users-videos` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st2-u4`; never the main checkout. The branch exists only after the desk read back the key GH-6 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u4.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
