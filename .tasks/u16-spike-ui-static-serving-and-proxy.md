# Task Spec: u16 spike-ui-static-serving-and-proxy: Spike: UI static serving and proxy (decision file)

> Branch: `GH-4-spike-ui-static-serving-and-proxy-u16`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u16`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-4   Sub-task: st9 (`GH-13-containerised-stack`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Answer, by reading the repo, how nginx serves the built Module Federation app1 (no remotes) and proxies /api with Range pass-through and /socket.io with upgrade headers, and record the decision in the decision file.

## 2. Context Package
- Relevant contracts: `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st9) and section 7
- Dependencies: Blocked by: none inside st9 (first wave). NO docker and NO npx are needed or assumed: unverified claims are listed and confirmed by the ui image unit u18.

## 3. Scope
**In scope:**
- .decisions/u16-spike-ui-static-serving-and-proxy.md
**Out of scope:**
1. Any change to repo source, Dockerfiles or nginx.conf (u18 owns them).
2. Committing any file.
**Permitted output:** the decision file named in section 9 is the one permitted output outside the worktree; `## 11` item 5 does not apply to it.
**Do NOT create:**
1. Repo files: the only output is the decision file named in section 9, outside the worktree (the `.decisions/...` glob in section 3 exists only because scope-check needs one glob).
2. An nginx.conf.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | `ui` container 8080 published as `UI_HOST_PORT` (default 36000); `/api` -> app-server:3002; `/socket.io` -> db-server:3001 | contracts/runtime-env-ports.md |

## 5. Inherited Module API
Read-only inputs: apps/app1/project.json (webpack build, `outputPath` dist/apps/app1), apps/app1/webpack.config.ts and webpack.config.prod.ts, apps/app1/module-federation.config.ts, apps/app1/proxy.conf.json, contracts/api-http.md (Range and cookie rows).

Test environment: none (no code).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| read-only inputs | the st9 worktree and the merged sub-tasks st1-st8 | read with ls, grep, jq and git only; write only the decision file |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| proxy requirements | Range and `Content-Range`/`Accept-Ranges` pass through, request buffering off for the stream, `/socket.io` sets `Upgrade` and `Connection`, client-sent identity headers stripped | a proxy that drops Range or buffers the stream | spike-ui-static-serving-and-proxy draft requirement 1 |
| nginx -t outside compose | state how upstream hostnames `app-server` and `db-server` are written so `nginx -t` still passes in a container started alone (u18's done command runs `nginx -t`) | static `proxy_pass http://app-server:3002` that fails host resolution at config test | plan P0b F7 |
| no docker, no npx | reads only | running docker or npx | review-architecture.md H6; plan P0b F2 |
| default recipe on overrun | nginx serving the built app1 with `try_files` fallback and `proxy_pass` for `/api` and `/socket.io` (upgrade headers) with request buffering off | an unmeasured recipe | spike-ui-static-serving-and-proxy draft Notes |

## 8. Acceptance Criteria
- [ ] The decision file exists, is non-empty and has a line starting `DECISION:`.
- [ ] It answers the question of the spike draft and lists every claim it could not confirm by reading under a heading `Unverified`. This criterion is checked by the reviewer reading the diff, not by the done command.
- [ ] No file inside the worktree changed.

## 9. Verification Commands
```bash
# criteria 1-2
test -s /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md && grep -q DECISION: /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md && echo U16-OK
# criterion 2 (Unverified heading, not part of the done command; expect exit 0)
grep -q '^## Unverified' /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md
# criterion 3
git status --porcelain | wc -l
```
Done token: `U16-OK`; verifier: `test -s /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md && grep -q DECISION: /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md && echo U16-OK` (exit 0, last stdout line equals the token).
Decision file (the only output, outside the worktree): `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-ui-static-serving-and-proxy-decision.md`.

## 10. Branch and Worktree
`GH-4-spike-ui-static-serving-and-proxy-u16` from `origin/main` (the sub-task branch `GH-13-containerised-stack` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u16`; never the main checkout. The branch exists only after the desk read back the key GH-4 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u16.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
