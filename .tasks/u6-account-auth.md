# Task Spec: u6 account-auth: Auth module, register/login/logout/me routes, auth hook, cookie and cors plugins, app.ts wiring

> Branch: `GH-7-account-auth-u6`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st3-u6`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-7   Sub-task: st3 (`GH-7-account-auth`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Implement username+password accounts with a signed httpOnly session cookie and the auth hook that protects every /api/v1 route except register, login and logout.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019`, `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st3) and section 7
- Dependencies: Blocked by: u5 (its Integrator item i5 in the same wave: the client wrappers and spec helpers). Done input: the INSTALLED ledger row for `@fastify/cookie` (owner u6, plan P5); `bcryptjs` (st1) and `jsonwebtoken` (st2) are already installed.
- Desk steps (not done by this unit): INSTALL `@fastify/cookie` (owner u6) in the st3 worktree before dispatch (plan P0a step 4); prisma generate and the db-server build by the desk (P10a c25).

## 3. Scope
**In scope:**
- apps/app-server/src/app/auth/**
- apps/app-server/src/app/routes/api/v1/auth/**
- apps/app-server/src/app/app.ts
- apps/app-server/src/app/plugins/**
**Out of scope:**
1. Video routes (u7), library (st4), stream (st5).
2. Cache wiring (st6).
3. db-server code.
**Do NOT create:**
1. A session store or refresh-token flow (stateless JWT only).
2. Rate limiting, OAuth or password reset (non-goals, architecture.md item 2).
3. A default JWT_SECRET.
4. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | Session rule and the four auth rows (register, login, logout, me); values per the pinned row, which wins | contracts/api-http.md |
| `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019` | `password_hash` algorithm and cost: see contracts/db-schema.md (password_hash row); login verification uses the same algorithm | contracts/db-schema.md |
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | CreateUser ALREADY_EXISTS maps to 409 `username_taken` | contracts/grpc-db.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `JWT_SECRET` (no default, at least 32 bytes, startup fails without it), `COOKIE_SECURE`, `DB_GRPC_ADDR` | contracts/runtime-env-ports.md |

## 5. Inherited Module API
From u5: wrappers in `apps/app-server/src/app/grpc/services/**` and spec helpers in `apps/app-server/src/app/grpc/test-support/**`. Existing (measured): `apps/app-server/src/app/app.ts` autoloads `plugins/` then `routes/`; `plugins/cors.ts:11` calls `new URL(origin)` and throws on a missing Origin; `routes/utils/errorHandler.ts` exists.

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. Built db-server child (test-plan.md A2): the spec spawns `node dist/apps/db-server/main.js` from the repo root (cwd matters: VIDEO_PROTO_PATH is the cwd-relative `protos/src/video/v1/video.proto`, globals/src/lib/constants.ts:1) on free ports (env PORT for fastify and socket.io, env GRPC_PORT for gRPC) (the helper picks a free port by binding port 0 and reading it back; because pick-then-bind can collide when specs run in parallel, it retries the spawn with a new port on EADDRINUSE, at most 3 attempts, and a spec never hard-codes a port) with DB_GRPC_ADDR, DATABASE_URL, DIRECT_URL, JWT_SECRET and VIDEO_STORAGE_DIR set inline; `npx nx build db-server` must have run first (review-architecture.md H2). The helpers of u5 (`apps/app-server/src/app/grpc/test-support/**`) start both. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| client wrappers and spec helpers | merged u5 (i5) | import; do not edit grpc/** |
| `bcryptjs`, `jsonwebtoken` | installed by st1 and st2 | hash cost and JWT algorithm per contracts/db-schema.md and contracts/api-http.md (Session) |
| `@fastify/cookie` | desk INSTALL ledger row (owner u6) | cookie set and clear only |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| cookie | name `nvs_session`; `HttpOnly; SameSite=Lax; Path=/`; `Secure` only when `COOKIE_SECURE=true` | a different name, no HttpOnly, or Secure always on | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| JWT | claims, expiry and algorithm per contracts/api-http.md (Session rule); verify with the contract algorithm list only | `alg: none`, no exp, or a default secret | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| login error | 401 `invalid_credentials` for unknown user and wrong password alike; run a dummy bcrypt compare when the username is unknown | different codes or a fast path that reveals the username | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| missing Origin | cors plugin accepts a request with no Origin header (200 or 401, never 500) | `new URL(undefined)` throwing | plugins/cors.ts:11 measured; test-plan.md A1 account-auth row |
| public routes | register, login and logout are public; every other route under /api/v1 answers 401 `unauthenticated` without a valid cookie (so st4 and st5 routes inherit the hook) (default, proposed) | per-route opt-in that a later unit can forget | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| password in logs | a failed login log carries the username, never the password | logging the request body | test-plan.md A1 account-auth row |
| secrets | `JWT_SECRET` has no default and no value is committed | any literal secret | architecture.md item 4 and item 10 |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| db-server build | run `npx nx build db-server` before a spec that spawns db-server; spawn `dist/apps/db-server/main.js` from the repo root | spawning an unbuilt db-server; spawning from another cwd | review-architecture.md H2; test-plan.md A2 |
| alias imports in the built output | db-server and app-server import `@globals/constants` at runtime and both project.json files set `bundle: false`; u-owner verifies the built `dist/apps/db-server/main.js` starts; if the alias does not resolve, write `.decisions/<unit>.md` and stop (project.json is in no unit's scope) | editing project.json or tsconfig.base.json to work around it | measured: grep -rn '@globals/constants' apps/db-server/src apps/app-server/src (plan P0b F3) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] register answers 201 with no password and no cookie; invalid input 400 `invalid_input`; duplicate 409 `username_taken` (auth.spec.ts).
- [ ] login sets the signed httpOnly cookie; a wrong password answers 401 and sets no cookie (auth.spec.ts).
- [ ] logout answers 204 with the cookie cleared; me answers 200 with user id and username (auth.spec.ts).
- [ ] The `GET /api/v1/auth/me` response carries `Cache-Control: private, no-store` (auth.spec.ts; contracts/api-http.md:23).
- [ ] Set-Cookie flags are HttpOnly, SameSite=Lax, Path=/ and Secure only when COOKIE_SECURE is true; the stored hash is not the plaintext (auth.spec.ts).
- [ ] A protected route without a cookie answers 401; a tampered or expired token, and a token signed with `alg: none` or HS512 (not HS256), answers 401 `unauthenticated` (hook.spec.ts).
- [ ] app-server refuses to start without JWT_SECRET or with fewer than 32 bytes (hook.spec.ts).
- [ ] A request without an Origin header does not throw (hook.spec.ts).
- [ ] A failed login is logged without the password (auth.spec.ts).
- [ ] `"@fastify/cookie"` is present in package.json.

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q @fastify/cookie package.json && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/auth/auth.spec.ts apps/app-server/src/app/auth/hook.spec.ts && echo U6-OK
```
Done token: `U6-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q @fastify/cookie package.json && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx nx build db-server && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/routes/api/v1/auth/auth.spec.ts apps/app-server/src/app/auth/hook.spec.ts && echo U6-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-7-account-auth-u6` from `origin/main` (the sub-task branch `GH-7-account-auth` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st3-u6`; never the main checkout. The branch exists only after the desk read back the key GH-7 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u6.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
