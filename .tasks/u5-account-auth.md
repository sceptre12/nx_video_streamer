# Task Spec: u5 account-auth: app-server gRPC client wrappers (all new rpcs), DB_GRPC_ADDR and the shared spec helpers

> Branch: `GH-7-account-auth-u5`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st3-u5`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-7   Sub-task: st3 (`GH-7-account-auth`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Add the app-server client wrappers for CreateUser, GetUserByUsername, GetUserById, ListVideosByOwner and GetVideoForOwner, carry `owner_id` in the existing createVideo and updateVideoStreamingState wrappers, read DB_GRPC_ADDR, and publish the spec helpers the later app-server units reuse.

## 2. Context Package
- Relevant contracts: `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st3) and section 7
- Dependencies: Blocked by: st2 merged. No desk package install.
- Desk steps (not done by this unit): prisma generate and the db-server build by the desk (P10a c24).

## 3. Scope
**In scope:**
- apps/app-server/src/app/grpc/**
**Out of scope:**
1. Auth routes, hooks and plugins (u6).
2. Route files under routes/** (u7, st4, st5).
3. db-server code.
**Do NOT create:**
1. Wrappers for rpcs not in the grpc-db pin.
2. A second gRPC client module.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | the five new rpcs and the changed messages; NOT_FOUND and ALREADY_EXISTS mapping | contracts/grpc-db.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `DB_GRPC_ADDR` (default `localhost:50051` for local dev; `db-server:50051` in containers) | contracts/runtime-env-ports.md |

## 5. Inherited Module API
Existing (measured): `apps/app-server/src/app/grpc/index.ts` builds the client with `localhost:${GRPC_PORT}` and loader options `keepCase, longs: String, enums: String, defaults, oneofs`; `grpc/services/createVideo.ts`, `updateVideoStreamingState.ts`, `index.ts` export the existing wrappers. Stubs from u2 in `protos/libs/gen/**`.

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. Built db-server child (test-plan.md A2): the spec spawns `node dist/apps/db-server/main.js` from the repo root (cwd matters: VIDEO_PROTO_PATH is the cwd-relative `protos/src/video/v1/video.proto`, globals/src/lib/constants.ts:1) on free ports (env PORT for fastify and socket.io, env GRPC_PORT for gRPC) (the helper picks a free port by binding port 0 and reading it back; because pick-then-bind can collide when specs run in parallel, it retries the spawn with a new port on EADDRINUSE, at most 3 attempts, and a spec never hard-codes a port) with DB_GRPC_ADDR, DATABASE_URL, DIRECT_URL, JWT_SECRET and VIDEO_STORAGE_DIR set inline; `npx nx build db-server` must have run first (review-architecture.md H2). The helpers of u5 (`apps/app-server/src/app/grpc/test-support/**`) start both. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| regenerated stubs | protos/libs/gen/** (st1) | type imports only |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| client address | env `DB_GRPC_ADDR`, default `localhost:50051` | the hard-coded `localhost:${GRPC_PORT}` | contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd |
| `longs` option | `String` kept; confirm in grpc/index.ts | changing it | contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863 |
| field casing (Casing rule) | runtime request and response objects of the app-server client are snake_case (`owner_id`, `user_id`, `password_hash`, `created_at`, `duration_s`) because the loader sets `keepCase: true`; the generated TypeScript under `protos/libs/gen/protobuf-types/**` is camelCase (`ownerId`, `userId`, `passwordHash`, `createdAt`, `durationS`); each wrapper maps between the two explicitly in one place and keeps its snake_case public shape (as `createVideo.ts:22` `requestObject: {video_id, start_time}` is today, default); a spec case whose name starts with `casing:` asserts the mapping through the built db-server, so the types and the runtime cannot disagree without a failing test | passing a camelCase object to the client (keepCase drops the fields without an error), returning camelCase keys to callers, or hiding the mismatch with `@ts-ignore` (banned by lint after st11) | measured: apps/app-server/src/app/grpc/index.ts:12 `keepCase: true`; protos/libs/gen/protobuf-types/src/video/v1/VideoItem.ts:5 `'videoId'`; plan P0b F14 |
| helper location | spec helpers live in `apps/app-server/src/app/grpc/test-support/**` (created by u5); later app-server specs import them and never edit them | duplicating the postgres and db-server starters per spec | plan P5 (u5 owns grpc/**) |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| db-server build | run `npx nx build db-server` before a spec that spawns db-server; spawn `dist/apps/db-server/main.js` from the repo root | spawning an unbuilt db-server; spawning from another cwd | review-architecture.md H2; test-plan.md A2 |
| alias imports in the built output | db-server and app-server import `@globals/constants` at runtime and both project.json files set `bundle: false`; u-owner verifies the built `dist/apps/db-server/main.js` starts; if the alias does not resolve, write `.decisions/<unit>.md` and stop (project.json is in no unit's scope) | editing project.json or tsconfig.base.json to work around it | measured: grep -rn '@globals/constants' apps/db-server/src apps/app-server/src (plan P0b F3) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] Each of the five new wrappers calls the built db-server and returns the db-server result (users-videos-client.spec.ts).
- [ ] The existing createVideo and updateVideoStreamingState wrappers accept and send `owner_id` (a case in users-videos-client.spec.ts, inside the done command).
- [ ] Casing mapping: a case in users-videos-client.spec.ts whose name starts with `casing:` calls CreateUser then GetUserById, and CreateVideo, through the wrappers against the built db-server and asserts the returned objects carry the snake_case keys with the sent values (`user_id` non-empty, `password_hash` equal to the hash sent, `created_at` a string, `owner_id` equal to the creating user) and no camelCase key (`userId`, `passwordHash`, `createdAt`, `ownerId` undefined) (inside the done command: `grep -q casing:` on the spec plus the jest run).
- [ ] The client address comes from DB_GRPC_ADDR (verifier-read side command in section 9, outside the done token).
- [ ] `apps/app-server/src/app/grpc/test-support/**` exports starters for the throwaway postgres and the built db-server child; the db-server starter picks free ports by binding port 0 and retries the spawn on EADDRINUSE (verifier-read side command in section 9, outside the done token).

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q casing: apps/app-server/src/app/grpc/services/users-videos-client.spec.ts && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/grpc/services/users-videos-client.spec.ts && echo U5-OK
# criteria 4 and 5 (expect 1 or more each)
grep -c DB_GRPC_ADDR apps/app-server/src/app/grpc/index.ts
# criterion 5
ls apps/app-server/src/app/grpc/test-support
```
Done token: `U5-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q casing: apps/app-server/src/app/grpc/services/users-videos-client.spec.ts && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/grpc/services/users-videos-client.spec.ts && echo U5-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-7-account-auth-u5` from `origin/main` (the sub-task branch `GH-7-account-auth` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st3-u5`; never the main checkout. The branch exists only after the desk read back the key GH-7 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u5.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
