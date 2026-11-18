# Task Spec: u19 containerised-stack: docker-compose.yml, scripts/stack-env.sh and scripts/stack-smoke.sh

> Branch: `GH-13-containerised-stack-u19`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u19`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-13   Sub-task: st9 (`GH-13-containerised-stack`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Write docker-compose.yml (ui, app-server, db-server, postgres, redis, one-shot seed), scripts/stack-env.sh (run-time secrets, never overwrites an existing .env) and scripts/stack-smoke.sh (bring-up and asserts).

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st9) and section 7
- Dependencies: Blocked by: u17 and u18 (their Integrator items i17, i18: the Dockerfiles and nginx.conf). Holds `lane/stack` (ports 36000, 3002, 3001, 50051). The compose project name is passed by the caller as COMPOSE_PROJECT_NAME and includes the run id.
- Desk steps (not done by this unit): none (the lead runs docker through the granted socket).

## 3. Scope
**In scope:**
- docker-compose.yml
- scripts/stack-env.sh
- scripts/stack-smoke.sh
**Out of scope:**
1. Dockerfiles and nginx.conf (u17, u18).
2. README.md (u20).
3. Playwright specs and harness (st10).
**Do NOT create:**
1. A committed `.env` or any secret value.
2. A `down -v` at the end of stack-smoke.sh (the caller tears down; st10 relies on that).
3. Healthchecks that need a tool the image lacks (see the u15 decision).

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | services `ui`, `app-server`, `db-server`, `postgres`, `redis` and one-shot `seed` (mounts the volume rw, exits 0); ports table (only `ui` is published, env `UI_HOST_PORT` default 36000); env names; `VIDEO_STORAGE_DIR` volume rw on db-server and seed, ro on app-server; `COMPOSE_PROJECT_NAME` includes the lane or run id; secrets rule: `.env` generated at run time with random JWT_SECRET, POSTGRES_PASSWORD, DEMO_USER1_PASSWORD, DEMO_USER2_PASSWORD | contracts/runtime-env-ports.md |
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | smoke asserts: login 200 as `demo1`, library 200, a stream request with `Range` answers 206 | contracts/api-http.md |

## 5. Inherited Module API
From u17/u18: the Dockerfiles only. The compose services `ui`, `app-server` and `db-server` use `build:` on those Dockerfiles; they never use `image:` with a unit tag `nvs-run-1-20261117-<service>:<unit>`, because those tags exist only in the local daemon of the u17/u18 runs and the st10 and pm worktrees start from a fresh checkout after st9 merges. From st7: `node apps/db-server/prisma/seed.js`.

Test environment: compose project `nvs-run-1-20261117-st9`; the lead runs `docker compose -p nvs-run-1-20261117-st9 down -v` on every exit of the lane lease, success or failure.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| Dockerfiles, nginx.conf | merged u17, u18 | reference; do not edit |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| `.env` handling | stack-env.sh never overwrites an existing `.env` (prints `kept`); `.env` is git-ignored (.gitignore:45) and listed in .dockerignore | regenerating on every run (seeded password hashes would go stale) | containerised-stack draft requirement 3; plans/repo-profile.md sensitive_paths waiver (architecture.md item 5) |
| sensitive path waiver | the generated `.env` matches `^\.env`; it is generated at run time and never committed (plan P13 grant.st9.1) | committing `.env` | architecture.md item 5 waiver |
| start order | `depends_on: condition: service_healthy`: postgres, then db-server, then seed; smoke waits for seed exit 0 before login | no ordering | containerised-stack draft requirement 6 |
| smoke last line | the last stdout line of stack-smoke.sh on success is `STACK-SMOKE-OK` (set by this unit; the draft names only exit 0, plan P0b F6) | no token line | dispatch plan P4 |
| teardown | stack-smoke.sh leaves the stack up; the caller runs `docker compose down -v` for its own project name only | down inside the script, or a down without the project name | release-plan.md Pre-release cleanup rule |
| ports | only `ui` is published, 36000:8080 via `${UI_HOST_PORT:-36000}` | publishing 3001, 3002, 50051, 5432 or 6379 | contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd |
| `UI_HOST_PORT` to db-server | the `db-server` service environment passes `UI_HOST_PORT: ${UI_HOST_PORT:-36000}` (the value u4 uses for the socket.io `cors.origin`), in addition to the `ui` port mapping; a dev run on :4200 sets `UI_HOST_PORT=4200` in its own environment (u4 section 7) | omitting the passthrough, so db-server falls back to 36000 while ui is published on another port | contracts/runtime-env-ports.md (ports table) |
| seed service command | the `seed` service reuses the db-server image and sets `entrypoint` and `command` explicitly (for example `entrypoint: []` or the plain `node` entrypoint, with `command: ["node", "apps/db-server/prisma/seed.js"]`) so it does not run the image's default entrypoint (`prisma migrate deploy` then listen, u17) and start a second db-server; `restart: "no"`, mounts the video volume rw, exits 0 | a `seed` service with only `image:`/`build:` and no entrypoint or command override | u17 db-server entrypoint row; contracts/runtime-env-ports.md (seed row) |

## 8. Acceptance Criteria
- [ ] `docker compose config` is valid and services match the pin.
- [ ] scripts/stack-env.sh creates a git-ignored `.env` with random secrets (JWT_SECRET at least 32 random bytes, encoded so its length is at least 32 characters; both servers refuse to start under 32 bytes) and prints `kept` on a second run; neither script enables `set -x` and neither echoes any `.env` value (output may name the keys only). This criterion is checked by the reviewer reading the diff, not by the done command.
- [ ] stack-smoke.sh reports every long-running service healthy, `seed` exited 0, login 200, library 200, stream 206 within 180 s and prints `STACK-SMOKE-OK` last.
- [ ] Only `ui` publishes a host port.
- [ ] docker-compose.yml builds `ui`, `app-server` and `db-server` with `build:` on the merged Dockerfiles and carries no `image: nvs-run-1-20261117-` unit-tag reference (a clean checkout can run it). This criterion is checked by the reviewer reading the diff, not by the done command.
- [ ] stack-smoke.sh runs `bash scripts/stack-env.sh` first, before any compose command, so a clean checkout without `.env` works (the pm run, c45, relies on this). This criterion is checked by the reviewer reading the diff, not by the done command.
- [ ] stack-smoke.sh starts with `set -euo pipefail`, prints `STACK-SMOKE-OK` as its last stdout line only on success and exits non-zero otherwise (the done command relies on the exit status; a plain command, no output capture).
- [ ] stack-smoke.sh itself fails (non-zero before printing the token) unless docker-compose.yml has exactly one published port mapping (the `ui` one): it counts `grep -c -E '^\s+- "?[$0-9]' docker-compose.yml` and compares with 1.

## 9. Verification Commands
```bash
# all criteria
grep -q pipefail scripts/stack-smoke.sh && COMPOSE_PROJECT_NAME=nvs-run-1-20261117-st9 bash scripts/stack-smoke.sh && COMPOSE_PROJECT_NAME=nvs-run-1-20261117-st9 docker compose down -v && echo U19-OK
# criterion 1 (config valid)
COMPOSE_PROJECT_NAME=nvs-run-1-20261117-st9 docker compose config -q
# criterion 2 (second run prints kept)
bash scripts/stack-env.sh && bash scripts/stack-env.sh | grep -q kept
# criterion 4 (published ports; expect 1 mapping)
grep -c -E '^\s+- "?[$0-9]' docker-compose.yml
```
Done token: `U19-OK`; verifier: `grep -q pipefail scripts/stack-smoke.sh && COMPOSE_PROJECT_NAME=nvs-run-1-20261117-st9 bash scripts/stack-smoke.sh && COMPOSE_PROJECT_NAME=nvs-run-1-20261117-st9 docker compose down -v && echo U19-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-13-containerised-stack-u19` from `origin/main` (the sub-task branch `GH-13-containerised-stack` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u19`; never the main checkout. The branch exists only after the desk read back the key GH-13 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u19.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
