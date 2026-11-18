# Task Spec: u3 db-server-grpc-users-videos: db-server gRPC handlers, owner filtering, VIDEO_STORAGE_DIR and duplicate-id handling

> Branch: `GH-6-db-server-grpc-users-videos-u3`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st2-u3`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-6   Sub-task: st2 (`GH-6-db-server-grpc-users-videos`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Implement the db-server handlers for the five new rpcs, owner-filtered reads, owner-checked updates, relative stored paths under VIDEO_STORAGE_DIR, INVALID_ARGUMENT on a bad video_id and ALREADY_EXISTS on a duplicate video_id (review-architecture.md H3), without killing the server on a handler error.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019`, `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st2) and section 7
- Dependencies: Blocked by: st1 merged (schema and stubs exist). No desk package install.
- Desk steps (not done by this unit): `npx prisma generate` (engines, network) and `npx nx build db-server` run by the desk (plan P10a c22).
- Note: Create the shared spec helper under `apps/db-server/src/app/utils/test-support/**` (created by u3) so u4's spec reuses the postgres and child-process starters.

## 3. Scope
**In scope:**
- apps/db-server/src/app/grpc/**
- apps/db-server/src/app/db/**
- apps/db-server/src/app/utils/**
**Out of scope:**
1. Socket capture, main.ts and plugins (u4).
2. Schema and proto (st1).
3. app-server code.
4. Editing globals/src/lib/constants.ts.
**Do NOT create:**
1. A second prisma client module.
2. A mock of Prisma or of Postgres in the spec.
3. New environment variable names beyond the runtime-env-ports pin.
4. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | rpc behaviour: `CreateUser` ALREADY_EXISTS on duplicate username; `GetVideoForOwner` NOT_FOUND when missing or not owned; update only where owner matches else NOT_FOUND; `CreateVideo` INVALID_ARGUMENT when `video_id` fails `^[A-Za-z0-9_-]{1,64}$` | contracts/grpc-db.md |
| `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019` | `video_path` and `thumbnail_path` are relative to VIDEO_STORAGE_DIR, never absolute; `password_hash` is a bcryptjs hash produced by the caller | contracts/db-schema.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `VIDEO_STORAGE_DIR` default `/data/videos`; `GRPC_PORT` default 50051; `PORT`; `DATABASE_URL`, `DIRECT_URL` | contracts/runtime-env-ports.md |
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | video_id pattern `^[A-Za-z0-9_-]{1,64}$` (POST /api/v1/video/create row) | contracts/api-http.md |

## 5. Inherited Module API
Existing modules (measured): `apps/db-server/src/app/grpc/index.ts` registers only CreateVideo and UpdateVideoStreamingState and binds `0.0.0.0:${GRPC_PORT}` from `@globals/constants`; `apps/db-server/src/app/grpc/services/handleCreatingVideo.ts` builds absolute paths from `STORAGE_PATH` and throws `CLASSH OCCURRED` inside an async handler when the folder exists; `apps/db-server/src/app/db/video/create/createVideo.ts` and `.../update/updateVideoStreamingState.ts` catch and log every Prisma error; `apps/db-server/src/app/utils/constants.ts:5` computes STORAGE_PATH with `execSync('git rev-parse --show-toplevel')`. Generated stubs: `protos/libs/gen/protobuf-types/**` (merged by u2).

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. Built db-server child (test-plan.md A2): the spec spawns `node dist/apps/db-server/main.js` from the repo root (cwd matters: VIDEO_PROTO_PATH is the cwd-relative `protos/src/video/v1/video.proto`, globals/src/lib/constants.ts:1) on free ports (env PORT for fastify and socket.io, env GRPC_PORT for gRPC) (the helper picks a free port by binding port 0 and reading it back; because pick-then-bind can collide when specs run in parallel, it retries the spawn with a new port on EADDRINUSE, at most 3 attempts, and a spec never hard-codes a port) with DB_GRPC_ADDR, DATABASE_URL, DIRECT_URL, JWT_SECRET and VIDEO_STORAGE_DIR set inline; `npx nx build db-server` must have run first (review-architecture.md H2). Env PORT and GRPC_PORT are set to free ports so two specs never collide on 3001. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| regenerated gRPC stubs | protos/libs/gen/** (merged by u2, st1) | import types from `@generated/protobuf-types`; do not regenerate |
| `bcryptjs` | installed by st1 | the handler stores the hash it receives; hashing is app-server's job |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| duplicate video_id | CreateVideo answers gRPC ALREADY_EXISTS, the server stays alive and a later CreateVideo succeeds (replaces the `CLASSH OCCURRED` throw, handleCreatingVideo.ts clash check) | an uncaught throw inside the async handler that kills db-server | review-architecture.md H3; contract gap flagged in plan P0b F4 (grpc-db pin names ALREADY_EXISTS for CreateUser only) |
| stored path | relative to VIDEO_STORAGE_DIR (default `/data/videos`) | absolute path from `STORAGE_PATH` or `git rev-parse` | contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019 |
| legacy rows | `ListVideosByOwner` and `GetVideoForOwner` exclude `owner_id` NULL rows | returning ownerless rows | contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863 |
| BigInt mapping | Prisma returns `BigInt` for `Video.start_time`, `Video.end_time` and `User.created_at`; the handlers map them explicitly before replying: `Number(x)` for the int32 proto fields (`start_time`, `end_time`), `String(x)` for the int64 `created_at` (the loader uses `longs: String`); a spec asserts a real round-trip through the built server, not a mocked row | passing a raw `BigInt` to grpc-js (int32 throws or loses the value, int64 is not serialised) | contracts/grpc-db.md (User and VideoItem messages) |
| field casing (Casing rule) | handlers read `call.request` and build replies as snake_case runtime objects (`owner_id`, `user_id`, `password_hash`, `created_at`, `duration_s`) because the db-server loader sets `keepCase: true`; the generated TypeScript under `protos/libs/gen/protobuf-types/**` is camelCase (`ownerId`, `userId`, `passwordHash`, `createdAt`, `durationS`), so a handler typed with the generated interfaces maps explicitly between the two names; Prisma columns stay snake_case (db-schema pin) | reading or sending camelCase keys at runtime (keepCase leaves them undefined or drops them without an error), or hiding the mismatch with `@ts-ignore` (banned by lint after st11) | measured: apps/db-server/src/app/grpc/index.ts:15 `keepCase: true`; protos/libs/gen/protobuf-types/src/video/v1/VideoItem.ts:5 `'videoId'`; plan P0b F14 |
| GetUserByUsername / GetUserById not found | not found = the `user` field is unset (null on the app-server side), never an empty-but-present `User`; found = the full row | replying with an empty `User` (empty `user_id` and `password_hash`), which the login consumer (u6) would treat as found | contracts/grpc-db.md (GetUserResponse, optional User user) |
| `STORAGE_PATH` export | keep exporting `STORAGE_PATH` as the resolved VIDEO_STORAGE_DIR (no execSync) so `video_processor/**` (u4) still compiles until u4 switches its import | removing the export in this unit (u4's files would stop building) | plan P5 (u3 owns utils/**, u4 owns video_processor/**) |
| GRPC_PORT | read env `GRPC_PORT`, default 50051 | the hard-coded constant | contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| db-server build | run `npx nx build db-server` before a spec that spawns db-server; spawn `dist/apps/db-server/main.js` from the repo root | spawning an unbuilt db-server; spawning from another cwd | review-architecture.md H2; test-plan.md A2 |
| alias imports in the built output | db-server and app-server import `@globals/constants` at runtime and both project.json files set `bundle: false`; u-owner verifies the built `dist/apps/db-server/main.js` starts; if the alias does not resolve, write `.decisions/<unit>.md` and stop (project.json is in no unit's scope) | editing project.json or tsconfig.base.json to work around it | measured: grep -rn '@globals/constants' apps/db-server/src apps/app-server/src (plan P0b F3) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] Owner-filtered rpcs return only the owner's rows and exclude `owner_id` NULL rows (users-videos.spec.ts).
- [ ] An update by a non-owner answers NOT_FOUND and the stored video_path is relative (users-videos.spec.ts).
- [ ] CreateVideo with a `../x` video_id answers INVALID_ARGUMENT and creates no directory (users-videos.spec.ts).
- [ ] A duplicate video_id answers ALREADY_EXISTS and the server keeps serving (users-videos.spec.ts).
- [ ] CreateUser answers ALREADY_EXISTS for a duplicate username; GetUserByUsername and GetUserById return the row when found; not found = the user field is unset (null on the app-server side), never an empty-but-present user (users-videos.spec.ts).
- [ ] The five new rpcs are registered in grpc/index.ts and Prisma errors are rethrown or mapped, not swallowed. This criterion is checked by the reviewer reading the diff, not by the done command.

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/src/app/grpc/services/users-videos.spec.ts && echo U3-OK
# criterion 6 (rpcs registered, expect 1 or more)
grep -c 'GetUserByUsername' apps/db-server/src/app/grpc/index.ts
```
Done token: `U3-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/src/app/grpc/services/users-videos.spec.ts && echo U3-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-6-db-server-grpc-users-videos-u3` from `origin/main` (the sub-task branch `GH-6-db-server-grpc-users-videos` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st2-u3`; never the main checkout. The branch exists only after the desk read back the key GH-6 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u3.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
