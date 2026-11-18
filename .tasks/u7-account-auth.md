# Task Spec: u7 account-auth: Protect the webcam video routes: caller id as owner, 404 for non-owner, video_id validation, duplicate 409

> Branch: `GH-7-account-auth-u7`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st3-u7`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-7   Sub-task: st3 (`GH-7-account-auth`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Put the existing POST /api/v1/video/create and POST /api/v1/video/{video_id} behind the auth hook, stamp the caller as owner, answer 404 for a non-owner update, validate video_id and map a duplicate video_id to 409.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st3) and section 7
- Dependencies: Blocked by: u6 (its Integrator item i6 in the same wave: the auth hook). No desk package install.
- Desk steps (not done by this unit): prisma generate and the db-server build by the desk (P10a c26).

## 3. Scope
**In scope:**
- apps/app-server/src/app/routes/api/v1/video/**
**Out of scope:**
1. The auth module and plugins (u6).
2. The library and stream routes.
3. Cache invalidation wiring (st6 edits this directory later, wiring only).
**Do NOT create:**
1. New routes beyond the two existing ones.
2. A second schema file.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | row `POST /api/v1/video/create, POST /api/v1/video/{video_id}`: 401 `unauthenticated`; 400 `invalid_input` when video_id fails `^[A-Za-z0-9_-]{1,64}$`; created video owned by caller; update answers 404 `not_found` when not owned | contracts/api-http.md |
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | `owner_id` on CreateVideoRequest and UpdateVideoStreamingStateRequest; NOT_FOUND for a non-owner update; ALREADY_EXISTS from u3's duplicate handling | contracts/grpc-db.md |

## 5. Inherited Module API
From u5/u6: wrappers (`apps/app-server/src/app/grpc/services/**`), spec helpers and the auth hook (request carries the verified user id). Existing (measured): `apps/app-server/src/app/routes/api/v1/video/video.ts` (create, update) and `video_schema.ts:13-24` (create body `video_id: {type:'string'}`).

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. Built db-server child (test-plan.md A2): the spec spawns `node dist/apps/db-server/main.js` from the repo root (cwd matters: VIDEO_PROTO_PATH is the cwd-relative `protos/src/video/v1/video.proto`, globals/src/lib/constants.ts:1) on free ports (env PORT for fastify and socket.io, env GRPC_PORT for gRPC) (the helper picks a free port by binding port 0 and reading it back; because pick-then-bind can collide when specs run in parallel, it retries the spawn with a new port on EADDRINUSE, at most 3 attempts, and a spec never hard-codes a port) with DB_GRPC_ADDR, DATABASE_URL, DIRECT_URL, JWT_SECRET and VIDEO_STORAGE_DIR set inline; `npx nx build db-server` must have run first (review-architecture.md H2). The helpers of u5 (`apps/app-server/src/app/grpc/test-support/**`) start both. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| auth hook and request user | merged u6 (i6) | read the user id from the request; do not re-verify |
| wrappers and spec helpers | merged u5 | import only |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| duplicate video_id | db-server ALREADY_EXISTS maps to HTTP 409 with error code `video_exists` (proposed; neither contract names a duplicate row, plan P0b F4) | a 500 or a dead db-server | review-architecture.md H3 |
| video_id pattern | `^[A-Za-z0-9_-]{1,64}$` on create body and update path; `../x` answers 400 `invalid_input` and creates no directory | `type: string` only | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| non-owner update | 404 `not_found`, owner's row unchanged, owner's own update succeeds in the same spec | 403 or a 200 | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| owner source | the caller id from the verified session, never from the body | a body-supplied owner | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| db-server build | run `npx nx build db-server` before a spec that spawns db-server; spawn `dist/apps/db-server/main.js` from the repo root | spawning an unbuilt db-server; spawning from another cwd | review-architecture.md H2; test-plan.md A2 |
| alias imports in the built output | db-server and app-server import `@globals/constants` at runtime and both project.json files set `bundle: false`; u-owner verifies the built `dist/apps/db-server/main.js` starts; if the alias does not resolve, write `.decisions/<unit>.md` and stop (project.json is in no unit's scope) | editing project.json or tsconfig.base.json to work around it | measured: grep -rn '@globals/constants' apps/db-server/src apps/app-server/src (plan P0b F3) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] A protected video route without a cookie answers 401: POST /api/v1/video/create and POST /api/v1/video/{video_id} each answer 401 `unauthenticated` with no cookie (video-routes.spec.ts; contracts/api-http.md:26).
- [ ] user B updating user A's video answers 404 `not_found`, A's row is unchanged and A's own update succeeds in the same spec (video-routes.spec.ts).
- [ ] A created webcam video carries the caller's owner id (video-routes.spec.ts).
- [ ] create with `../x` answers 400 `invalid_input` and creates no directory (video-routes.spec.ts).
- [ ] A duplicate video_id answers 409 `video_exists` and db-server stays up (video-routes.spec.ts).

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/video/video-routes.spec.ts && echo U7-OK
```
Done token: `U7-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/video/video-routes.spec.ts && echo U7-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-7-account-auth-u7` from `origin/main` (the sub-task branch `GH-7-account-auth` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st3-u7`; never the main checkout. The branch exists only after the desk read back the key GH-7 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u7.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
