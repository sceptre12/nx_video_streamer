# Task Spec: u22 stack-e2e-playwright: e2e specs: login and library playback through the ui proxy

> Branch: `GH-14-stack-e2e-playwright-u22`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st10-u22`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-14   Sub-task: st10 (`GH-14-stack-e2e-playwright`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Write login.spec.ts and library-playback.spec.ts against the real compose stack: real login form as demo1, library, playback and a Range request through the ui proxy.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st10) and section 7
- Dependencies: Blocked by: u21 (its Integrator item i21: harness, lifecycle). Holds `lane/stack`.
- Desk steps (not done by this unit): `npx playwright test` runs by the desk (P10a c41).

## 3. Scope
**In scope:**
- apps/stack-e2e/src/login.spec.ts
- apps/stack-e2e/src/library-playback.spec.ts
**Out of scope:**
1. The isolation, cache and compose-health specs (u23).
2. Harness files (u21).
3. Product code.
**Do NOT create:**
1. Mocks, route stubs or an auth bypass.
2. Another harness config.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | login/library/stream rows; cookie `nvs_session`; Range 206 with `Content-Range` | contracts/api-http.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | demo accounts `demo1`, `demo2`; passwords from `DEMO_USER1_PASSWORD` and `DEMO_USER2_PASSWORD` in the git-ignored `.env`; entry URL `http://localhost:${UI_HOST_PORT}` (default 36000), not 127.0.0.1 | contracts/runtime-env-ports.md |

## 5. Inherited Module API
From u21: the harness config and `apps/stack-e2e/src/support/**` (stack lifecycle, `.env` reader).

Test environment: globalSetup (u21) brings the stack up for the run and globalTeardown takes it down; compose project `nvs-run-1-20261117-st10`.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| harness | merged u21 (i21) | import support helpers; do not edit |
| chromium | desk INSTALL (P0a step 5) | chromium only |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| entry URL | `http://localhost:36000` (hostname `localhost`; app-server CORS accepts only that hostname) | 127.0.0.1 | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| login | through the real form as `demo1` with the password from `.env` | an API shortcut or a mock | plans/repo-profile.md e2e.auth_mode and e2e.mock_gate |
| playback assertion | the `<video>` element reaches readyState 4 or currentTime advances | asserting only the page loaded | stack-e2e-playwright draft scenario 1 |
| Range through proxy | 206 with `Content-Range` | 200 full body | stack-e2e-playwright draft scenario 5 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] The login form accepts the right password, rejects a wrong one and a logged-out visit lands on login (login.spec.ts).
- [ ] A demo user logs in, selects a video and it plays (library-playback.spec.ts).
- [ ] A stream request with `Range` through the ui proxy answers 206 with `Content-Range` (library-playback.spec.ts).

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx playwright test -c apps/stack-e2e/playwright.config.ts apps/stack-e2e/src/login.spec.ts apps/stack-e2e/src/library-playback.spec.ts && echo U22-OK
```
Done token: `U22-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx playwright test -c apps/stack-e2e/playwright.config.ts apps/stack-e2e/src/login.spec.ts apps/stack-e2e/src/library-playback.spec.ts && echo U22-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-14-stack-e2e-playwright-u22` from `origin/main` (the sub-task branch `GH-14-stack-e2e-playwright` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st10-u22`; never the main checkout. The branch exists only after the desk read back the key GH-14 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u22.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
