# Task Spec: u8 owner-scoped-library-api: GET /api/v1/library for the signed-in owner

> Branch: `GH-8-owner-scoped-library-api-u8`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st4-u8`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-8   Sub-task: st4 (`GH-8-owner-scoped-library-api`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Add GET /api/v1/library returning only the caller's videos with `stream_url`, `thumbnail_url: null` and `Cache-Control: private, no-store`.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st4) and section 7
- Dependencies: Blocked by: st3 merged (auth hook, wrappers, spec helpers). No desk package install.
- Desk steps (not done by this unit): prisma generate and the db-server build by the desk (P10a c27).

## 3. Scope
**In scope:**
- apps/app-server/src/app/routes/api/v1/library/**
**Out of scope:**
1. The `X-Cache` header (st6 sets it, not this unit).
2. Auth, video and stream routes.
3. db-server code.
**Do NOT create:**
1. A request parameter that selects the owner.
2. A cache call (st6 wires caching).
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | row `GET /api/v1/library`; body shape, status codes and headers per the pinned row, which wins | contracts/api-http.md |
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | `ListVideosByOwner` excludes legacy `owner_id` NULL rows | contracts/grpc-db.md |

## 5. Inherited Module API
From st3: the auth hook (protects every /api/v1 route except register, login, logout), `ListVideosByOwner` wrapper and spec helpers in `apps/app-server/src/app/grpc/**`. Route files are autoloaded from `apps/app-server/src/app/routes/`.

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
| owner source | derived from the session | a query parameter | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| `thumbnail_url` | `null` | a made-up URL | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| `X-Cache` header | not set here (st6 adds it) | setting it in this unit | architecture.md item 7 (st6 wiring plus X-Cache) |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| db-server build | run `npx nx build db-server` before a spec that spawns db-server; spawn `dist/apps/db-server/main.js` from the repo root | spawning an unbuilt db-server; spawning from another cwd | review-architecture.md H2; test-plan.md A2 |
| alias imports in the built output | db-server and app-server import `@globals/constants` at runtime and both project.json files set `bundle: false`; u-owner verifies the built `dist/apps/db-server/main.js` starts; if the alias does not resolve, write `.decisions/<unit>.md` and stop (project.json is in no unit's scope) | editing project.json or tsconfig.base.json to work around it | measured: grep -rn '@globals/constants' apps/db-server/src apps/app-server/src (plan P0b F3) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] The library lists only the caller's videos when two users each own videos (library.spec.ts).
- [ ] Without a cookie the library answers 401 (library.spec.ts).
- [ ] A request is logged with the user id and the video count (library.spec.ts).
- [ ] A legacy `owner_id` NULL row is absent from the library (library.spec.ts).
- [ ] The response carries `Cache-Control: private, no-store` (library.spec.ts).

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/library/library.spec.ts && echo U8-OK
```
Done token: `U8-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/library/library.spec.ts && echo U8-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-8-owner-scoped-library-api-u8` from `origin/main` (the sub-task branch `GH-8-owner-scoped-library-api` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st4-u8`; never the main checkout. The branch exists only after the desk read back the key GH-8 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u8.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
