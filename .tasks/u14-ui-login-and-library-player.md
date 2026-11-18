# Task Spec: u14 ui-login-and-library-player: Login page, library list, player, router and logged-out redirect

> Branch: `GH-12-ui-login-and-library-player-u14`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st8-u14`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-12   Sub-task: st8 (`GH-12-ui-login-and-library-player`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Add the login page, the library list and the player, route them with a router that redirects a logged-out visit to login, and keep the webcam page behind login.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st8) and section 7
- Dependencies: Blocked by: u13 (its Integrator item i13 in the same wave: the API client). Done input: the INSTALLED ledger row for `react-router-dom` (owner u14, plan P5).
- Desk steps (not done by this unit): INSTALL `react-router-dom` (owner u14) in the st8 worktree before dispatch (plan P0a step 4).

## 3. Scope
**In scope:**
- apps/app1/src/app/pages/**
- apps/app1/src/app/routes.tsx
- apps/app1/src/app/routes.spec.tsx
- apps/app1/src/app/app.tsx
- apps/app1/src/bootstrap.tsx
- apps/app1/src/app/components/**
**Out of scope:**
1. The API client and hooks (u13).
2. nginx and Dockerfiles (st9).
3. e2e specs (st10).
**Do NOT create:**
1. Webcam capture changes beyond placing the existing page behind login.
2. A remote or federation config change.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | login/me/library routes and the 401 behaviour; `stream_url` is the player `src` | contracts/api-http.md |

## 5. Inherited Module API
From u13: the API client in `apps/app1/src/app/api/index.ts` (login, logout, me, library). Existing: `apps/app1/src/app/app.tsx` is the webcam page; `apps/app1/src/bootstrap.tsx` renders `<App />` (measured).

Test environment: jest component specs (jsdom) with a stubbed global `fetch`; no backend is started.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| API client | merged u13 (i13) | import only |
| `react-router-dom` | desk INSTALL ledger row (owner u14) | routing only |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| logged-out visit | a protected page redirects to the login page | rendering the library with no session | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| player source | the video `src` is the library item's relative `stream_url` | an absolute host URL | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| login log | outcome logged to the browser console without the password | logging the form values | test-plan.md A1 ui-login row |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] Login with correct credentials shows the library (library.spec.tsx).
- [ ] A wrong password shows an error and no library (login.spec.tsx).
- [ ] Selecting a video starts playback of its stream URL (player.spec.tsx).
- [ ] A logged-out visit redirects to login (routes.spec.tsx).
- [ ] The login outcome is written to the console without the password (library.spec.tsx).
- [ ] `"react-router-dom"` is present in package.json.

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q react-router-dom package.json && npx jest -c apps/app1/jest.config.ts --runInBand apps/app1/src/app/pages/library.spec.tsx apps/app1/src/app/pages/login.spec.tsx apps/app1/src/app/pages/player.spec.tsx apps/app1/src/app/routes.spec.tsx && echo U14-OK
```
Done token: `U14-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q react-router-dom package.json && npx jest -c apps/app1/jest.config.ts --runInBand apps/app1/src/app/pages/library.spec.tsx apps/app1/src/app/pages/login.spec.tsx apps/app1/src/app/pages/player.spec.tsx apps/app1/src/app/routes.spec.tsx && echo U14-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-12-ui-login-and-library-player-u14` from `origin/main` (the sub-task branch `GH-12-ui-login-and-library-player` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st8-u14`; never the main checkout. The branch exists only after the desk read back the key GH-12 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u14.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
