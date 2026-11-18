# Task Spec: u15 spike-container-build-approach: Spike: container build approach (decision file)

> Branch: `GH-3-spike-container-build-approach-u15`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u15`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-3   Sub-task: st9 (`GH-13-containerised-stack`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Answer, by reading the repo and the build outputs, how each Nx esbuild/webpack output, the proto path and the Prisma client run in a slim image, and record the decision in the decision file.

## 2. Context Package
- Relevant contracts: `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st9) and section 7
- Dependencies: Blocked by: none inside st9 (first wave). st6, st7 and st8 are merged before st9 starts. NO docker and NO npx are needed or assumed: the decision is built from reads; a claim only a container run can confirm is listed under `Unverified` and is confirmed by the Dockerfile unit u17.

## 3. Scope
**In scope:**
- .decisions/u15-spike-container-build-approach.md
**Out of scope:**
1. Any change to repo source, Dockerfiles or contracts (u17 owns Dockerfiles).
2. Committing any file (the unit commits nothing).
**Permitted output:** the decision file named in section 9 is the one permitted output outside the worktree; `## 11` item 5 does not apply to it.
**Do NOT create:**
1. Repo files: the only output is the decision file named in section 9, outside the worktree (this unit's `.decisions/...` glob in section 3 exists only because scope-check needs one glob; no commit is expected).
2. A Dockerfile.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | ports, env names, `VIDEO_STORAGE_DIR` default `/data/videos`, `GRPC_PORT`, `DB_GRPC_ADDR` | contracts/runtime-env-ports.md |

## 5. Inherited Module API
Read-only inputs: apps/*/project.json build targets (esbuild `bundle: false` for app-server and db-server, webpack for app1), globals/src/lib/constants.ts (VIDEO_PROTO_PATH is cwd-relative), apps/db-server/prisma/schema.prisma, apps/db-server/src/app/utils/constants.ts, apps/db-server/prisma/seed.js (st7).

Test environment: none (no code).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| read-only inputs | the st9 worktree and the merged sub-tasks st1-st8 | read with ls, grep, jq and git only; write only the decision file |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| question 1a | state the requirement the VIDEO_STORAGE_DIR replacement (u3, merged) must meet in an image with no .git; confirm it by reading the merged constants.ts | assuming `git rev-parse` works in a slim image | spike-container-build-approach draft requirement 1a |
| question 1b | how `node apps/db-server/prisma/seed.js` runs in the slim image, whether `curl` or another health tool exists, whether Prisma engines need `libssl`, and how `ffmpeg` gets into the db-server image (the seed calls `ffmpeg -f lavfi`; record the install line) | assuming a TS runner or curl | spike-container-build-approach draft requirement 1b |
| no docker, no npx | read-only reads and `ls`/`grep`/`jq`/`git` only | running docker or npx (not granted to this unit) | review-architecture.md H6; plan P0b F2 |
| default recipe on overrun | multi-stage `node:20.14.0-slim` build running `npx nx build` per app with `prisma generate` in the build stage | an unmeasured image choice | spike-container-build-approach draft Notes |

## 8. Acceptance Criteria
- [ ] The decision file exists, is non-empty and has a line starting `DECISION:`.
- [ ] It answers questions 1, 1a and 1b of the spike draft and lists every claim it could not confirm by reading under a heading `Unverified`. This criterion is checked by the reviewer reading the diff, not by the done command.
- [ ] No file inside the worktree changed.

## 9. Verification Commands
```bash
# criteria 1-2
test -s /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md && grep -q DECISION: /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md && echo U15-OK
# criterion 2 (Unverified heading, not part of the done command; expect exit 0)
grep -q '^## Unverified' /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md
# criterion 3
git status --porcelain | wc -l
```
Done token: `U15-OK`; verifier: `test -s /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md && grep -q DECISION: /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md && echo U15-OK` (exit 0, last stdout line equals the token).
Decision file (the only output, outside the worktree): `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md`.

## 10. Branch and Worktree
`GH-3-spike-container-build-approach-u15` from `origin/main` (the sub-task branch `GH-13-containerised-stack` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u15`; never the main checkout. The branch exists only after the desk read back the key GH-3 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u15.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
