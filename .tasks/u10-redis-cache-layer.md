# Task Spec: u10 redis-cache-layer: Redis cache module: keys, TTLs, read-through, fail-open, invalidation

> Branch: `GH-10-redis-cache-layer-u10`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st6-u10`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-10   Sub-task: st6 (`GH-10-redis-cache-layer`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Create the app-server cache module (ioredis) with the two cache-keys pin keys, TTLs, read-through, fail-open behaviour and an invalidation function.

## 2. Context Package
- Relevant contracts: `contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st6) and section 7
- Dependencies: Blocked by: st5 merged. Done input: the INSTALLED ledger row for `ioredis` (owner u10, plan P5).
- Desk steps (not done by this unit): INSTALL `ioredis` (owner u10) in the st6 worktree before dispatch (plan P0a step 4).

## 3. Scope
**In scope:**
- apps/app-server/src/app/cache/index.ts
- apps/app-server/src/app/cache/redis-cache.ts
- apps/app-server/src/app/cache/cache-module.spec.ts
**Out of scope:**
1. Wiring into auth, library and video routes (u11).
2. The `X-Cache` header (u11).
3. db-server code.
**Do NOT create:**
1. A cache of stream bytes.
2. A cached value containing `password_hash`.
3. A Fastify plugin file under plugins/** (the module is imported directly).
4. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32` | key names, cached values, TTLs, read-through, fail-open and the `password_hash` exclusion: see contracts/cache-keys.md (key table and rules rows) | contracts/cache-keys.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `REDIS_URL` | contracts/runtime-env-ports.md |

## 5. Inherited Module API
Created by u10: `apps/app-server/src/app/cache/index.ts` (public API: `getLibrary`, `setLibrary`, `getUser`, `setUser`, `invalidateLibrary`) and `redis-cache.ts` (ioredis client). Spec helper for a throwaway `redis:7` container is written inside the spec (the shared helpers of u5 cover postgres and db-server only).

Test environment: Throwaway Redis: the spec starts `redis:7` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, sets REDIS_URL inline and removes the container at teardown. No Postgres or db-server is needed.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| `ioredis` | desk INSTALL ledger row (owner u10) | single client; fail open |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| TTLs | the TTL column of the contracts/cache-keys.md key table, read from the contract | any value not in that table | contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32 |
| key names | the key column of the contracts/cache-keys.md key table, read from the contract | unversioned or other keys | contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32 |
| fail open | any Redis error returns MISS and logs a warning, the call never throws | propagating the Redis error | contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32 |
| password_hash | never stored in `user:v1:*` | caching the full user row | contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] Library and user values round-trip with the TTLs above (cache-module.spec.ts).
- [ ] With Redis stopped every read is a MISS and nothing throws (cache-module.spec.ts).
- [ ] A cached `user:v1` value has no `password_hash` (cache-module.spec.ts).
- [ ] `invalidateLibrary(user_id)` deletes `lib:v1:{user_id}` only (cache-module.spec.ts).
- [ ] `"ioredis"` is present in package.json.

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q ioredis package.json && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/cache/cache-module.spec.ts && echo U10-OK
```
Done token: `U10-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q ioredis package.json && npx jest -c apps/app-server/jest.config.ts --runInBand apps/app-server/src/app/cache/cache-module.spec.ts && echo U10-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-10-redis-cache-layer-u10` from `origin/main` (the sub-task branch `GH-10-redis-cache-layer` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st6-u10`; never the main checkout. The branch exists only after the desk read back the key GH-10 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u10.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
