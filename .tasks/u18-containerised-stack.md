# Task Spec: u18 containerised-stack: ui image: nginx serving app1 and proxying /api and /socket.io

> Branch: `GH-13-containerised-stack-u18`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u18`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-13   Sub-task: st9 (`GH-13-containerised-stack`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Write the ui Dockerfile and nginx.conf: serve the built app1 on container port 8080 with try_files fallback, proxy /api to app-server:3002 with Range pass-through and /socket.io to db-server:3001 with upgrade headers.

## 2. Context Package
- Relevant contracts: `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st9) and section 7
- Dependencies: Blocked by: u16 (its Integrator item i16: the decision file at /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md).
- Desk steps (not done by this unit): none (the lead runs docker through the granted socket).

## 3. Scope
**In scope:**
- apps/app1/Dockerfile*
- apps/app1/nginx.conf
**Out of scope:**
1. Backend Dockerfiles (u17).
2. docker-compose.yml (u19).
3. app1 source.
**Do NOT create:**
1. A published host port in the Dockerfile.
2. Identity headers forwarded from the client (strip them).
3. Files outside apps/app1.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | ui container 8080 published as `UI_HOST_PORT` (default 36000); `/api` -> app-server:3002; `/socket.io` -> db-server:3001 | contracts/runtime-env-ports.md |
| `contracts/api-http.md@a6a2576424043c1c4b227dc6cccef79746361995` | Range and cookie behaviour must pass through the proxy (stream row) | contracts/api-http.md |

## 5. Inherited Module API
From the spike decision file: nginx recipe. app1 builds with `npx nx build app1` to `dist/apps/app1` (apps/app1/project.json, measured).

Test environment: docker build and `docker run --rm ... nginx -t`; no ports are bound.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| ui decision | /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md | follow it |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| `/socket.io` location | sets `Upgrade` and `Connection` headers and strips client-sent identity headers | a plain proxy_pass | containerised-stack draft requirement 8 |
| stream proxy | request buffering off and Range headers passed | buffering the video | spike-ui-static-serving-and-proxy draft requirement 1 |
| `nginx -t` standalone | passes in a container started alone (see the u16 decision on upstream resolution) | static upstream names that fail resolution | plan P0b F7 |

## 8. Acceptance Criteria
- [ ] `docker build -f apps/app1/Dockerfile .` exits 0.
- [ ] `nginx -t` passes inside the built image.
- [ ] nginx.conf proxies `/api` and `/socket.io` and sets `Upgrade` and `Connection` on the latter (verifier-read side command in section 9: `grep -c -E 'proxy_set_header +(Upgrade|Connection)' apps/app1/nginx.conf` expects 2 or more; outside the done token).

## 9. Verification Commands
```bash
# criteria 1-2
docker build -f apps/app1/Dockerfile -t nvs-run-1-20261117-ui:u18 . && docker run --rm nvs-run-1-20261117-ui:u18 nginx -t && echo U18-OK
# criterion 3
grep -c -E 'location /(api|socket.io)' apps/app1/nginx.conf
# criterion 2, Upgrade and Connection (expect 2 or more)
grep -c -E 'proxy_set_header +(Upgrade|Connection)' apps/app1/nginx.conf
```
Done token: `U18-OK`; verifier: `docker build -f apps/app1/Dockerfile -t nvs-run-1-20261117-ui:u18 . && docker run --rm nvs-run-1-20261117-ui:u18 nginx -t && echo U18-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-13-containerised-stack-u18` from `origin/main` (the sub-task branch `GH-13-containerised-stack` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u18`; never the main checkout. The branch exists only after the desk read back the key GH-13 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u18.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
