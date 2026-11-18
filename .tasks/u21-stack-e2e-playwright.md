# Task Spec: u21 stack-e2e-playwright: Playwright harness, stack lifecycle (setup and teardown) and ignore entries

> Branch: `GH-14-stack-e2e-playwright-u21`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st10-u21`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-14   Sub-task: st10 (`GH-14-stack-e2e-playwright`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Create the apps/stack-e2e Playwright project with a global setup that runs scripts/stack-env.sh and `docker compose up`, a global teardown that runs `docker compose down -v`, tracing pinned off, and the git-ignore entries for the report and result directories.

## 2. Context Package
- Relevant contracts: `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st10) and section 7
- Dependencies: Blocked by: st9 merged (stack-env.sh, docker-compose.yml). Done input: the INSTALLED ledger rows for `@playwright/test` and its browsers (owner u21, plan P5, P0a step 5). Holds `lane/stack`.
- Desk steps (not done by this unit): INSTALL `@playwright/test` and `npx playwright install chromium` (owner u21) before the first e2e unit (plan P0a step 5); `npx playwright test ... --list` runs by the desk (P10a c40).

## 3. Scope
**In scope:**
- apps/stack-e2e/playwright.config.ts
- apps/stack-e2e/project.json
- apps/stack-e2e/tsconfig.json
- apps/stack-e2e/.gitignore
- apps/stack-e2e/.eslintrc.json
- apps/stack-e2e/src/support/**
- apps/stack-e2e/src/harness.spec.ts
**Out of scope:**
1. The spec files (u22, u23).
2. Root .gitignore (the entries go in `apps/stack-e2e/.gitignore`, inside this scope).
3. docker-compose.yml and scripts (st9).
**Do NOT create:**
1. Trace, video or screenshot capture that writes into tracked paths.
2. Mocks of the backend.
3. A second compose file.
4. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `scripts/stack-env.sh` writes the git-ignored `.env`; `COMPOSE_PROJECT_NAME` includes the run id; `UI_HOST_PORT` default 36000; demo passwords come from `DEMO_USER1_PASSWORD` and `DEMO_USER2_PASSWORD` in `.env` | contracts/runtime-env-ports.md |

## 5. Inherited Module API
From st9: `scripts/stack-env.sh`, `docker-compose.yml`, `scripts/stack-smoke.sh` (reference for the waits). Created by u21: `apps/stack-e2e/**` (does not exist yet; measured `ls apps/stack-e2e` absent).

Test environment: `--list` does not run globalSetup, so no stack is started by the done command.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| `@playwright/test` and chromium | desk INSTALL ledger rows (owner u21) | no other browser, no install from the unit |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| report and trace dirs | `apps/stack-e2e/.gitignore` ignores `test-results/`, `playwright-report/`, `blob-report/` and `playwright/.cache/`; config sets `trace: 'off'` | tracked report or trace output (Blocking if tracing is on) | review-architecture.md H4; measured: root .gitignore has no playwright entry |
| stack lifecycle | globalSetup runs `bash scripts/stack-env.sh` then `docker compose -p nvs-run-1-20261117-st10 up -d`, then polls (as u19's stack-smoke.sh does) until every long-running service is healthy and the one-shot `seed` service has exited 0, with a timeout, rather than relying on `--wait` for an exited one-shot container; globalTeardown runs `docker compose -p nvs-run-1-20261117-st10 down -v` (own project name only) | assuming a running stack (st9 ends with down -v) | review-architecture.md H5 |
| compose project name | `nvs-run-1-20261117-st10` | the default project name (port collisions between stacks) | architecture.md item 7 (project name includes run id) |
| workers | `workers: 1` in playwright.config.ts (the specs share one stack and one Redis) | the default parallel workers (isolation.spec.ts warms `lib:v1:{demo1}` while cache.spec.ts runs; one worker serialises the specs and removes that parallel overlap; the first-MISS correctness of cache.spec.ts comes from the fresh users u23 registers, not from spec file order) | contracts/cache-keys.md |
| one stack at a time | st10 never runs while st9 holds `lane/stack` | parallel stacks | architecture.md item 7 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] `apps/stack-e2e/.gitignore` ignores the three report and result directories (checked with `git check-ignore`).
- [ ] playwright.config.ts has `trace: 'off'`, a globalSetup and a globalTeardown.
- [ ] playwright.config.ts pins `workers: 1` (spec files run serially on the one shared stack, so they do not overlap; the first-MISS correctness of cache.spec.ts comes from the fresh users u23 registers, not from spec file order). This criterion is checked by the reviewer reading the diff, not by the done command.
- [ ] `npx playwright test -c apps/stack-e2e/playwright.config.ts --list` exits 0.
- [ ] `"@playwright/test"` is present in package.json.

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q @playwright/test package.json && git check-ignore -q apps/stack-e2e/test-results/x && git check-ignore -q apps/stack-e2e/playwright-report/x && git check-ignore -q apps/stack-e2e/blob-report/x && grep -q trace:..off apps/stack-e2e/playwright.config.ts && grep -q globalSetup apps/stack-e2e/playwright.config.ts && grep -q globalTeardown apps/stack-e2e/playwright.config.ts && npx playwright test -c apps/stack-e2e/playwright.config.ts --list && echo U21-OK
```
Done token: `U21-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q @playwright/test package.json && git check-ignore -q apps/stack-e2e/test-results/x && git check-ignore -q apps/stack-e2e/playwright-report/x && git check-ignore -q apps/stack-e2e/blob-report/x && grep -q trace:..off apps/stack-e2e/playwright.config.ts && grep -q globalSetup apps/stack-e2e/playwright.config.ts && grep -q globalTeardown apps/stack-e2e/playwright.config.ts && npx playwright test -c apps/stack-e2e/playwright.config.ts --list && echo U21-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-14-stack-e2e-playwright-u21` from `origin/main` (the sub-task branch `GH-14-stack-e2e-playwright` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st10-u21`; never the main checkout. The branch exists only after the desk read back the key GH-14 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u21.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
