# Task Spec: u28 regenerate-protobuf-stubs: Commit the protobuf stubs that `buf generate` produces from main's unchanged proto

> Branch: `GH-16-main-baseline-repair-u28`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u28`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-16   Sub-task: st11 (`GH-16-main-baseline-repair`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Regenerate `protos/libs/gen/**` from the unchanged `protos/src/video/v1/video.proto` with `npx nx run protos:generate_protos` and commit the output, so that a later regeneration (the gate's `protos:build` through `^build`) leaves the tree clean.

## 2. Context Package
- Relevant contracts: none changed (the proto is not edited; `contracts/grpc-db.md` stays st1's to apply).
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/dispatch-plan.md` P0b F15; the drift is measured in `/Users/xavier/delivery/run-1-20261117/baseline-gates.md` ("`protos:generate_protos` modified 2 tracked files (`protos/libs/gen/src/video/v1/video_connect.ts`, `video_pb.ts`)").
- Dependencies: Blocked by: none (independent; no other st11 unit edits `protos/libs/gen/**`). No desk package install.
- Desk steps (not done by this unit): `npx nx run protos:generate_protos` needs the network (remote buf plugins, protos/buf.gen.yaml:4,7), so the desk runs it in this unit worktree as a GATE-RUN (plan P10a c54, the c21 pattern); the executor commits the produced files. The lead may re-run the plain-git clauses of the done command (`git diff --quiet`) itself.
- Task file location: until u27 lands it on the sub-task branch, this file is read from `/Users/xavier/projects/nx_video_streamer/.tasks/u28-regenerate-protobuf-stubs.md` (plan P0b F15).

## 3. Scope
**In scope:**
- protos/libs/gen/**
**Out of scope:**
1. `protos/src/video/v1/video.proto` and any proto change (u2 in st1 owns the proto additions).
2. `protos/buf.gen.yaml`, `protos/project.json`, plugin pins.
3. Any file outside `protos/libs/gen/**`.
**Do NOT create:**
1. Hand-edited files under `protos/libs/gen/**` (generated output only).
2. A second generator config.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| none | the proto is unchanged; the stubs are its generated output | protos/src/video/v1/video.proto on main |

## 5. Inherited Module API
Nx project `protos`: `generate_protos` runs `buf generate` (remote plugins, protos/buf.gen.yaml:4,7); `build_types`, `build`, `lint` as measured in protos/project.json. On main `002db0cf` the desk measured that `generate_protos` rewrites `protos/libs/gen/src/video/v1/video_connect.ts` and `video_pb.ts` and that `build_types` output is unchanged (baseline-gates.md: only those 2 tracked files modified after the full run-many).

Test environment: none (generation only).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3, P10a c49); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| buf remote plugins | protos/buf.gen.yaml:4,7 (network) | run only through the desk (P10a c54) |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| sensitive path | `protos/libs/gen/**` is in sensitive_paths and explicitly in scope for u28 (plan P13 grant.st11.1) | committing any other sensitive path | plans/repo-profile.md sensitive_paths |
| proto | `protos/src/**` unchanged against origin/main | editing video.proto (st1's u2 adds fields later) | plan P5 |
| output | commit exactly what the desk-run generation wrote; afterwards a second generation leaves `protos/libs/gen/**` clean | hand edits, or committing a partial set | baseline-gates.md |
| regeneration owner | in st11 only u28 regenerates `protos/libs/gen/**`; in st1 only u2 | another st11 unit running the generator | plan P5 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] `npx nx run protos:generate_protos` exits 0 in the unit worktree (desk-run) and afterwards `git diff --quiet HEAD -- protos/libs/gen` exits 0 (the committed stubs equal the generated ones); no untracked file appears under protos/libs/gen (verifier-read side command in section 9, outside the done token; expect no output).
- [ ] `protos/src/**` is unchanged against origin/main.
- [ ] No file outside `protos/libs/gen/**` changed (verifier-read side command in section 9, outside the done token; expect 0).

## 9. Verification Commands
```bash
# criteria 1-2
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx nx run protos:generate_protos && git diff --quiet HEAD -- protos/libs/gen && git diff --quiet origin/main -- protos/src && echo U28-OK
# criterion 1 (untracked generated files; expect no output)
git status --porcelain -- protos/libs/gen
# criterion 3 (expect 0)
git diff --name-only origin/main | grep -v '^protos/libs/gen/' | wc -l
```
Done token: `U28-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx nx run protos:generate_protos && git diff --quiet HEAD -- protos/libs/gen && git diff --quiet origin/main -- protos/src && echo U28-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-16-main-baseline-repair-u28` from `origin/main` (the sub-task branch `GH-16-main-baseline-repair` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u28`; never the main checkout. The branch exists only after the desk read back the key GH-16 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u28.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
