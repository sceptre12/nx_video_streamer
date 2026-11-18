# Task Spec: u13 ui-login-and-library-player: app1 API client, socket hook and dev proxy: relative URLs, credentials, proxy targets

> Branch: `GH-12-ui-login-and-library-player-u13`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st8-u13`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-12   Sub-task: st8 (`GH-12-ui-login-and-library-player`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Make the app1 API client and socket hook use relative `/api/v1` and `/socket.io` URLs with credentials, add login, logout, me and library calls, and point the dev proxy at the real backend ports.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st8) and section 7
- Dependencies: Blocked by: st4 merged (the library API exists). No desk package install.

## 3. Scope
**In scope:**
- apps/app1/src/app/api/**
- apps/app1/src/app/hooks/**
- apps/app1/proxy.conf.json
**Out of scope:**
1. Pages, routes and app.tsx (u14).
2. The nginx proxy (st9).
3. Any change outside apps/app1.
**Do NOT create:**
1. A second HTTP client library.
2. Absolute `http://localhost:` URLs.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | routes login/logout/me/library/stream; relative `/api/v1` URLs with `credentials: 'include'`; socket.io on `/socket.io`; error shape; `stream_url` is a relative path | contracts/api-http.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | dev proxy: `/api` -> http://localhost:3002, `/socket.io` -> http://localhost:3001 (apps/app1/proxy.conf.json) | contracts/runtime-env-ports.md |

## 5. Inherited Module API
Existing (measured): `apps/app1/src/app/api/index.ts` uses `fetch(http://localhost:${APP_SERVER_PORT}/api/v1/...)` at lines 27 and 53 and `resolveJson` from `@nx-video-streamer/globals`; `apps/app1/src/app/hooks/useSocketConnection.ts:17` builds `http://localhost:${DB_SERVER_PORT}`; `apps/app1/proxy.conf.json` targets http://localhost:3000 (mismatch with the app-server default 3002).

Test environment: jest unit specs with a stubbed global `fetch` (component tests only; no backend is started).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| jest preset | apps/app1/jest.config.ts (babel-jest, @nx/react preset) | component and unit specs only |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| API base | relative `/api/v1/...` | `http://localhost:${APP_SERVER_PORT}` | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| fetch credentials | `credentials: 'include'` on every call | omitting it (the cookie is not sent) | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| socket event payload | `initalizeStream {video_id}` with no `video_path` | emitting a client path | contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995 |
| dev proxy | `/api` -> 3002 and `/socket.io` -> 3001 (ws true) | target 3000 | plans: facts.md `cat apps/app1/proxy.conf.json` and contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] No `http://localhost` string remains in apps/app1/src/app/api or apps/app1/src/app/hooks.
- [ ] The API client sends `credentials: 'include'` and uses relative URLs (api/index.spec.ts, created by u13).
- [ ] proxy.conf.json targets 3002 for /api and 3001 for /socket.io. This criterion is checked by the reviewer reading the diff, not by the done command.

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx jest -c apps/app1/jest.config.ts --runInBand apps/app1/src/app/api && ! grep -rqn http://localhost apps/app1/src/app/api apps/app1/src/app/hooks && grep -q http://localhost:3002 apps/app1/proxy.conf.json && echo U13-OK
# criterion 3 (socket.io target, not part of the done command; expect exit 0)
grep -q http://localhost:3001 apps/app1/proxy.conf.json
```
Done token: `U13-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx jest -c apps/app1/jest.config.ts --runInBand apps/app1/src/app/api && ! grep -rqn http://localhost apps/app1/src/app/api apps/app1/src/app/hooks && grep -q http://localhost:3002 apps/app1/proxy.conf.json && echo U13-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-12-ui-login-and-library-player-u13` from `origin/main` (the sub-task branch `GH-12-ui-login-and-library-player` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st8-u13`; never the main checkout. The branch exists only after the desk read back the key GH-12 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u13.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
