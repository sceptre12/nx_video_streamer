# Task Spec: u25 jest-no-tests-and-db-server-spec: passWithNoTests for app-server, app1 and app2, and a db-server app.spec that asserts what app.ts serves

> Branch: `GH-16-main-baseline-repair-u25`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u25`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-16   Sub-task: st11 (`GH-16-main-baseline-repair`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Make `app-server:test`, `app1:test` and `app2:test` exit 0 when a project has no spec, by adding `passWithNoTests: true` to the `test` target options in each project.json, and rewrite `apps/db-server/src/app/app.spec.ts` so it asserts what `apps/db-server/src/app/app.ts` actually serves.

## 2. Context Package
- Relevant contracts: `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` (`UI_HOST_PORT` default 36000, used as the spec's request origin).
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/dispatch-plan.md` P0b F15; the failures are measured in `/Users/xavier/delivery/run-1-20261117/baseline-gates.md` rows `app-server:test`, `app1:test`, `app2:test`, `db-server:test`.
- Dependencies: Blocked by: none (independent). No desk package install. u26 edits `apps/app2/project.json` after this unit's Integrator item i25 (plan P5: this unit owns that file in st11).
- Desk steps (not done by this unit): the done command runs as a desk GATE-RUN (plan P10a c51); it needs no network.
- Task file location: until u27 lands it on the sub-task branch, this file is read from `/Users/xavier/projects/nx_video_streamer/.tasks/u25-jest-no-tests-and-db-server-spec.md` (plan P0b F15).

## 3. Scope
**In scope:**
- apps/app-server/project.json
- apps/app1/project.json
- apps/app2/project.json
- apps/db-server/src/app/app.spec.ts
**Out of scope:**
1. Placeholder or new spec files in app-server, app1 or app2 (design answer fixed by the coordinator: the flag, not placeholder tests).
2. Deleting app.spec.ts (design answer fixed: rewrite, not delete).
3. `apps/db-server/project.json`, `nx.json`, jest configs and `apps/db-server/src/app/app.ts`, `plugins/**`, `routes/**`.
4. The `build` targets of the three project.json files (u26 owns the app2 `styles` line).
**Do NOT create:**
1. An `executor` or `command` key in the new `test` target (the inferred `@nx/jest/plugin` target supplies them).
2. A mock of fastify or of the cors plugin.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `UI_HOST_PORT` default 36000 (the origin `http://localhost:36000` the spec sends) | contracts/runtime-env-ports.md |

## 5. Inherited Module API
`test` and `lint` are inferred by the `nx.json` plugins `@nx/jest/plugin` and `@nx/eslint/plugin`; no project.json holds a `test` target today (measured: `jq '.targets.test' apps/{app-server,app1}/project.json` -> null; `npx nx show project app-server --json` -> test `nx:run-commands`, command `jest`, cwd `apps/app-server`, no `dependsOn`). A project.json target `"test": {"options": {"passWithNoTests": true}}` merges into the inferred target and nx forwards the option to jest (measured in a scratch copy of main: resolved options `{cwd, command: jest, passWithNoTests: true}`, run line `jest --passWithNoTests=true`, "No tests found, exiting with code 0", rc 0). `apps/db-server/src/app/app.ts` registers `@fastify/autoload` for `plugins/` and `routes/`; `routes/root.ts:4-6` answers `GET /` with `{ message: 'Hello API' }`; `plugins/cors.ts:9` runs `new URL(origin)`, which throws `ERR_INVALID_URL` when the request has no `Origin` header, the cause of the current failure (`app.spec.ts:13-18` injects `GET /` with no headers).

Test environment: jest with ts-jest (`apps/db-server/jest.config.ts`); `fastify.inject`, no network, no container.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3, P10a c49); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| option placement | `"targets": { ..., "test": { "options": { "passWithNoTests": true } } }` in each of the three project.json files, other targets unchanged | a CLI-only flag, a jest.config edit, or an `executor`/`command` that replaces the inferred target | measured (section 5) |
| spec request | `server.inject({ method: 'GET', url: '/', headers: { origin: 'http://localhost:36000' } })`; assert status 200 and body `{ message: 'Hello API' }`; close the server after each test | a request with no Origin (cors.ts:9 throws) or an origin u4's narrowed allow-list (`http://localhost:${UI_HOST_PORT}`, default 36000) would refuse | measured (section 5); contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd; .tasks/u4-db-server-grpc-users-videos.md cors.origin row |
| app2 project.json | edit only the `targets.test` entry; u26 then changes the `styles` line after i25 | touching the build target | plan P5 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] Each of apps/app-server, apps/app1 and apps/app2 project.json has `targets.test.options.passWithNoTests` equal to `true` (`jq -e` exits 0 only for a value other than false or null).
- [ ] app.spec.ts sends the origin `http://localhost:36000` and asserts the `GET /` answer `{ message: 'Hello API' }`.
- [ ] `npx nx run-many -t test -p app-server app1 app2 db-server --skip-nx-cache` exits 0 (three "No tests found, exiting with code 0" and the db-server spec passing).

## 9. Verification Commands
```bash
# criteria 1-3
source ~/.nvm/nvm.sh && nvm use 20.14.0 && jq -e .targets.test.options.passWithNoTests apps/app-server/project.json && jq -e .targets.test.options.passWithNoTests apps/app1/project.json && jq -e .targets.test.options.passWithNoTests apps/app2/project.json && grep -q localhost:36000 apps/db-server/src/app/app.spec.ts && npx nx run-many -t test -p app-server app1 app2 db-server --skip-nx-cache && echo U25-OK
```
Done token: `U25-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && jq -e .targets.test.options.passWithNoTests apps/app-server/project.json && jq -e .targets.test.options.passWithNoTests apps/app1/project.json && jq -e .targets.test.options.passWithNoTests apps/app2/project.json && grep -q localhost:36000 apps/db-server/src/app/app.spec.ts && npx nx run-many -t test -p app-server app1 app2 db-server --skip-nx-cache && echo U25-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-16-main-baseline-repair-u25` from `origin/main` (the sub-task branch `GH-16-main-baseline-repair` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u25`; never the main checkout. The branch exists only after the desk read back the key GH-16 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u25.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
