# Task Spec: u23 stack-e2e-playwright: e2e specs: isolation, cache HIT, compose health

> Branch: `GH-14-stack-e2e-playwright-u23`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st10-u23`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-14   Sub-task: st10 (`GH-14-stack-e2e-playwright`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Write isolation.spec.ts, cache.spec.ts and compose-health.spec.ts against the real compose stack.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st10) and section 7
- Dependencies: Blocked by: u21 (its Integrator item i21). Runs after u22 on the same lane (`lane/stack`, one stack at a time).
- Desk steps (not done by this unit): `npx playwright test` runs by the desk (P10a c42).

## 3. Scope
**In scope:**
- apps/stack-e2e/src/isolation.spec.ts
- apps/stack-e2e/src/cache.spec.ts
- apps/stack-e2e/src/compose-health.spec.ts
**Out of scope:**
1. login and playback specs (u22).
2. Harness files (u21).
3. Product code.
**Do NOT create:**
1. Mocks or an auth bypass.
2. Another harness config.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | stream row: owner 200/206 `video/mp4`, other user 404; library `X-Cache` HIT or MISS | contracts/api-http.md |
| `contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32` | library key row (see contracts/cache-keys.md): the second library request inside its TTL is a HIT | contracts/cache-keys.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | health applies to ui, app-server, db-server, postgres, redis; `seed` exited 0 | contracts/runtime-env-ports.md |

## 5. Inherited Module API
From u21: harness, `apps/stack-e2e/src/support/**`.

Test environment: same as u22.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| harness | merged u21 (i21) | import; do not edit |
| chromium | desk INSTALL (P0a step 5) | chromium only |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| isolation order | the owner's GET of a `stream_url` from its own library answers 200 or 206 `video/mp4` first; the other account's GET of that exact URL answers 404 with no bytes | asserting only the 404 | stack-e2e-playwright draft scenario 2; architecture.md item 10 |
| cache assertion | first library response `X-Cache: MISS`, second `HIT` inside the library key TTL of contracts/cache-keys.md | sleeping past the TTL | contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32 |
| worker count | u21's playwright.config.ts pins `workers: 1`, so the spec files run one after another on the shared stack (the order of the files on that worker is not pinned by u21 or by this file); do not override with `--workers` and do not add a parallel mode; the done command is unchanged | parallel workers (isolation.spec.ts warms `lib:v1:{demo1}` for 60 s, which can break cache.spec.ts's first MISS when the two overlap; serial runs avoid the overlap but a first MISS after isolation.spec.ts within the 60 s TTL is not guaranteed by this pin) | contracts/cache-keys.md@932a2ae47e1b580f7aed9abc97c254a6e90aad32 |
| cache first MISS | the spec registers its own fresh users through `POST /api/v1/auth/register` (a username matching `^[a-z0-9_]{3,32}$` with a random suffix, a password generated at spec start with crypto.randomBytes, never a literal), logs them in, and asserts the first library `X-Cache: MISS` then `HIT` on those users' own `lib:v1:{user_id}` key; no other spec touches a user it registered itself, so the result does not depend on spec file order or on what an earlier spec warmed | asserting a first MISS on the shared seeded `demo1` or `demo2` accounts, whose library key another spec can warm within the 60 s TTL | contracts/api-http.md (register row); contracts/cache-keys.md (library key row) |
| cross-user check | the spec reads demo1's library first (warming `lib:v1:{demo1 user_id}`), then a fresh user registered by the spec requests its library: `X-Cache: MISS`, and the body contains none of demo1's `video_id` values | using seeded `demo2` for the first-MISS assertion | contracts/cache-keys.md (library key row) |
| compose-health | polls `docker compose -p nvs-run-1-20261117-st10 ps` until every long-running service is healthy and `seed` has exited 0 | no timeout or a project-less `docker compose ps` | stack-e2e-playwright draft scenario 6 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] Another user cannot read the video: owner 200/206 `video/mp4`, other user 404 with no bytes (isolation.spec.ts).
- [ ] The second library request carries `X-Cache: HIT` and the first `MISS`, asserted on a fresh user the spec registers itself (see risky-values row 'cache first MISS'; the assertion does not depend on spec file order) (cache.spec.ts).
- [ ] Cross-user on the real stack: after demo1's library is warmed, a fresh user registered by the spec requests its library and receives `X-Cache: MISS` with none of demo1's rows, and that session never receives demo1's rows (cache.spec.ts).
- [ ] Every long-running service is healthy and `seed` exited 0 under compose (compose-health.spec.ts).

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx playwright test -c apps/stack-e2e/playwright.config.ts apps/stack-e2e/src/isolation.spec.ts apps/stack-e2e/src/cache.spec.ts apps/stack-e2e/src/compose-health.spec.ts && echo U23-OK
```
Done token: `U23-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx playwright test -c apps/stack-e2e/playwright.config.ts apps/stack-e2e/src/isolation.spec.ts apps/stack-e2e/src/cache.spec.ts apps/stack-e2e/src/compose-health.spec.ts && echo U23-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-14-stack-e2e-playwright-u23` from `origin/main` (the sub-task branch `GH-14-stack-e2e-playwright` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st10-u23`; never the main checkout. The branch exists only after the desk read back the key GH-14 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u23.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
