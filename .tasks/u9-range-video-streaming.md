# Task Spec: u9 range-video-streaming: GET /api/v1/videos/{video_id}/stream with HTTP Range

> Branch: `GH-9-range-video-streaming-u9`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st5-u9`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-9   Sub-task: st5 (`GH-9-range-video-streaming`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Add the owner-checked MP4 stream route with single-range support (200, 206, 416) reading from VIDEO_STORAGE_DIR.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019`, `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st5) and section 7
- Dependencies: Blocked by: st4 merged. No desk package install.
- Desk steps (not done by this unit): prisma generate and the db-server build by the desk (P10a c28).

## 3. Scope
**In scope:**
- apps/app-server/src/app/routes/api/v1/videos/**
**Out of scope:**
1. Library, auth and webcam video routes.
2. Caching of bytes (not cached in Redis).
3. Transcoding or HLS (non-goals).
**Do NOT create:**
1. A second stream route under `routes/api/v1/video/` (singular, owned by u7).
2. Multi-range support.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | row `GET /api/v1/videos/{video_id}/stream`; Range grammar, headers and the 401/404/416 rules per the pinned row, which wins | contracts/api-http.md |
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | `GetVideoForOwner` NOT_FOUND maps to 404 | contracts/grpc-db.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `VIDEO_STORAGE_DIR` default `/data/videos`, read-only mount on app-server | contracts/runtime-env-ports.md |
| `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019` | `video_path` is relative to VIDEO_STORAGE_DIR | contracts/db-schema.md |

## 5. Inherited Module API
From st3/st4: the auth hook, `GetVideoForOwner` wrapper, spec helpers. The spec writes a small file under a per-spec VIDEO_STORAGE_DIR and inserts a Video row with the generated Prisma client.

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. Built db-server child (test-plan.md A2): the spec spawns `node dist/apps/db-server/main.js` from the repo root (cwd matters: VIDEO_PROTO_PATH is the cwd-relative `protos/src/video/v1/video.proto`, globals/src/lib/constants.ts:1) on free ports (env PORT for fastify and socket.io, env GRPC_PORT for gRPC) (the helper picks a free port by binding port 0 and reading it back; because pick-then-bind can collide when specs run in parallel, it retries the spawn with a new port on EADDRINUSE, at most 3 attempts, and a spec never hard-codes a port) with DB_GRPC_ADDR, DATABASE_URL, DIRECT_URL, JWT_SECRET and VIDEO_STORAGE_DIR set inline; `npx nx build db-server` must have run first (review-architecture.md H2). The helpers of u5 (`apps/app-server/src/app/grpc/test-support/**`) start both. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| auth hook, wrappers, spec helpers | merged st3 | import; do not edit |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| cookie check order | the cookie check precedes the ownership check | ownership first | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| not-owner vs missing | both 404 `not_found` (no 403) | 403 for a not-owner video | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| path resolution | resolve against VIDEO_STORAGE_DIR; 404 when the result is outside it or the stored path is absolute | joining blindly or reading outside the volume | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| range body | `bytes=a-b` body equals that file slice and `Content-Range: bytes a-b/total` matches | off-by-one end | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| db-server build | run `npx nx build db-server` before a spec that spawns db-server; spawn `dist/apps/db-server/main.js` from the repo root | spawning an unbuilt db-server; spawning from another cwd | review-architecture.md H2; test-plan.md A2 |
| alias imports in the built output | db-server and app-server import `@globals/constants` at runtime and both project.json files set `bundle: false`; u-owner verifies the built `dist/apps/db-server/main.js` starts; if the alias does not resolve, write `.decisions/<unit>.md` and stop (project.json is in no unit's scope) | editing project.json or tsconfig.base.json to work around it | measured: grep -rn '@globals/constants' apps/db-server/src apps/app-server/src (plan P0b F3) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] A full request answers 200 with the bytes (stream.spec.ts).
- [ ] A range request answers 206 with the slice and a matching `Content-Range` (stream.spec.ts).
- [ ] Another user's video and a legacy `owner_id` NULL row answer 404; no cookie answers 401 (stream.spec.ts).
- [ ] An unsatisfiable range answers 416 (stream.spec.ts).
- [ ] A path-traversal `video_path` answers 404 and no file outside the volume is read (stream.spec.ts).
- [ ] A stream request is logged with user id, video id, status and range (stream.spec.ts).
- [ ] Both the 200 and the 206 response carry `Accept-Ranges: bytes`, `Content-Type: video/mp4`, an `ETag`, `Cache-Control: private, max-age=300` and `Vary: Cookie` (stream.spec.ts; contracts/api-http.md:25).
- [ ] `Range: bytes=a-` answers 206 with the slice from a to the end, and `Range: bytes=-n` answers 206 with the last n bytes, each with a matching `Content-Range` (stream.spec.ts).
- [ ] A multi-range `Range` (for example `bytes=0-1,3-4`) and a malformed `Range` answer 416 `range_not_satisfiable` (stream.spec.ts; contracts/api-http.md:25).

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/videos/stream.spec.ts && echo U9-OK
```
Done token: `U9-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/videos/stream.spec.ts && echo U9-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-9-range-video-streaming-u9` from `origin/main` (the sub-task branch `GH-9-range-video-streaming` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st5-u9`; never the main checkout. The branch exists only after the desk read back the key GH-9 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u9.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
