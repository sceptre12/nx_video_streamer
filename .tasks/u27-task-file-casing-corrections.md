# Task Spec: u27 task-file-casing-corrections: Land the corrected u2, u3, u4, u5 and u7 task files and the st11 task files on main

> Branch: `GH-16-main-baseline-repair-u27`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u27`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/docs-writer.md
> Ticket: GH-16   Sub-task: st11 (`GH-16-main-baseline-repair`)   Persona / tier: docs-writer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Copy ten task files, byte for byte, from the primary repo working tree into this worktree and commit them: the corrected `.tasks/u2`, `u3`, `u4`, `u5` and `u7` files (u2's VideoItem.ts check token `ownerId`; the casing rule in u3, u4, u5 and u7; the u5 casing acceptance check) and the new st11 task files `u24`, `u25`, `u26`, `u27`, `u28`. This is the plan's fallback for a second plan PR (plan P0b F15: mode `plan-pr` is `st0` only).

## 2. Context Package
- Relevant contracts: none (task files only; contracts/** stays st0's).
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/dispatch-plan.md` P0b F14 (casing rule) and F15 (fallback).
- Dependencies: Blocked by: none (independent). No desk package install.
- Source files (read only): `/Users/xavier/projects/nx_video_streamer/.tasks/<name>.md` for the ten names in section 3; they are the reviewed plan copies.
- Task file location: until this unit lands it on the sub-task branch, this file is read from `/Users/xavier/projects/nx_video_streamer/.tasks/u27-task-file-casing-corrections.md` (plan P0b F15).

## 3. Scope
**In scope:**
- .tasks/u2-*.md
- .tasks/u3-*.md
- .tasks/u4-*.md
- .tasks/u5-*.md
- .tasks/u7-*.md
- .tasks/u24-*.md
- .tasks/u25-*.md
- .tasks/u26-*.md
- .tasks/u27-*.md
- .tasks/u28-*.md
**Out of scope:**
1. Any other `.tasks` file, `contracts/**`, `plans/repo-profile.md`.
2. Editing the content: the files are copied unchanged from the primary repo working tree.
3. Code under apps/** or protos/** (u24, u25, u26).
**Do NOT create:**
1. A task file not named in this section.
2. A rewritten or reformatted copy (no trailing-space or line-ending change).
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| none | the copies must equal the primary repo working tree files byte for byte | plan P0b F15 |

## 5. Inherited Module API
The ten names: `u2-db-users-videos-schema.md`, `u3-db-server-grpc-users-videos.md`, `u4-db-server-grpc-users-videos.md`, `u5-account-auth.md`, `u7-account-auth.md`, `u24-ts-expect-error-lint.md`, `u25-jest-no-tests-and-db-server-spec.md`, `u26-app2-production-build.md`, `u27-task-file-casing-corrections.md`, `u28-regenerate-protobuf-stubs.md`. The first five exist on main (`002db0cf3fb2ccb4cb06741305f0f5478c6203b3`, committed by the st0 plan PR #15); the last five are new.

Test environment: none.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| the ten source files | `/Users/xavier/projects/nx_video_streamer/.tasks/` (primary repo working tree) | read only; `cp` each into `.tasks/` of this worktree |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| copy | `cp /Users/xavier/projects/nx_video_streamer/.tasks/<name>.md .tasks/<name>.md` for each of the ten names, then one commit | hand edits, or copying any other `.tasks` file from the primary working tree (11 of the other 18 working-tree copies there differ from main, plan P0b F15) | plan P0b F15 |
| u2 token | the VideoItem.ts check reads `grep -q ownerId protos/libs/gen/protobuf-types/src/video/v1/VideoItem.ts` (equal to the plan P4 u2 row) | `owner_id` in the VideoItem.ts check | plan P0b F14 |
| casing rule | a `field casing (Casing rule)` row in section 7 of u3, u4, u5 and u7 | dropping the row | plan P0b F14 |

## 8. Acceptance Criteria
- [ ] Each of the ten files in this worktree equals its primary repo working tree source byte for byte.
- [ ] u2's VideoItem.ts check reads `ownerId`, and u3, u4, u5 and u7 each carry the casing rule row.

## 9. Verification Commands
```bash
# criteria 1-2
cmp -s .tasks/u2-db-users-videos-schema.md /Users/xavier/projects/nx_video_streamer/.tasks/u2-db-users-videos-schema.md && cmp -s .tasks/u3-db-server-grpc-users-videos.md /Users/xavier/projects/nx_video_streamer/.tasks/u3-db-server-grpc-users-videos.md && cmp -s .tasks/u4-db-server-grpc-users-videos.md /Users/xavier/projects/nx_video_streamer/.tasks/u4-db-server-grpc-users-videos.md && cmp -s .tasks/u5-account-auth.md /Users/xavier/projects/nx_video_streamer/.tasks/u5-account-auth.md && cmp -s .tasks/u7-account-auth.md /Users/xavier/projects/nx_video_streamer/.tasks/u7-account-auth.md && cmp -s .tasks/u24-ts-expect-error-lint.md /Users/xavier/projects/nx_video_streamer/.tasks/u24-ts-expect-error-lint.md && cmp -s .tasks/u25-jest-no-tests-and-db-server-spec.md /Users/xavier/projects/nx_video_streamer/.tasks/u25-jest-no-tests-and-db-server-spec.md && cmp -s .tasks/u26-app2-production-build.md /Users/xavier/projects/nx_video_streamer/.tasks/u26-app2-production-build.md && cmp -s .tasks/u27-task-file-casing-corrections.md /Users/xavier/projects/nx_video_streamer/.tasks/u27-task-file-casing-corrections.md && cmp -s .tasks/u28-regenerate-protobuf-stubs.md /Users/xavier/projects/nx_video_streamer/.tasks/u28-regenerate-protobuf-stubs.md && grep -q ownerId.protos/libs/gen/protobuf-types/src/video/v1/VideoItem.ts .tasks/u2-db-users-videos-schema.md && grep -q Casing.rule .tasks/u3-db-server-grpc-users-videos.md && grep -q Casing.rule .tasks/u4-db-server-grpc-users-videos.md && grep -q Casing.rule .tasks/u5-account-auth.md && grep -q Casing.rule .tasks/u7-account-auth.md && echo U27-OK
```
Done token: `U27-OK`; verifier: `cmp -s .tasks/u2-db-users-videos-schema.md /Users/xavier/projects/nx_video_streamer/.tasks/u2-db-users-videos-schema.md && cmp -s .tasks/u3-db-server-grpc-users-videos.md /Users/xavier/projects/nx_video_streamer/.tasks/u3-db-server-grpc-users-videos.md && cmp -s .tasks/u4-db-server-grpc-users-videos.md /Users/xavier/projects/nx_video_streamer/.tasks/u4-db-server-grpc-users-videos.md && cmp -s .tasks/u5-account-auth.md /Users/xavier/projects/nx_video_streamer/.tasks/u5-account-auth.md && cmp -s .tasks/u7-account-auth.md /Users/xavier/projects/nx_video_streamer/.tasks/u7-account-auth.md && cmp -s .tasks/u24-ts-expect-error-lint.md /Users/xavier/projects/nx_video_streamer/.tasks/u24-ts-expect-error-lint.md && cmp -s .tasks/u25-jest-no-tests-and-db-server-spec.md /Users/xavier/projects/nx_video_streamer/.tasks/u25-jest-no-tests-and-db-server-spec.md && cmp -s .tasks/u26-app2-production-build.md /Users/xavier/projects/nx_video_streamer/.tasks/u26-app2-production-build.md && cmp -s .tasks/u27-task-file-casing-corrections.md /Users/xavier/projects/nx_video_streamer/.tasks/u27-task-file-casing-corrections.md && cmp -s .tasks/u28-regenerate-protobuf-stubs.md /Users/xavier/projects/nx_video_streamer/.tasks/u28-regenerate-protobuf-stubs.md && grep -q ownerId.protos/libs/gen/protobuf-types/src/video/v1/VideoItem.ts .tasks/u2-db-users-videos-schema.md && grep -q Casing.rule .tasks/u3-db-server-grpc-users-videos.md && grep -q Casing.rule .tasks/u4-db-server-grpc-users-videos.md && grep -q Casing.rule .tasks/u5-account-auth.md && grep -q Casing.rule .tasks/u7-account-auth.md && echo U27-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-16-main-baseline-repair-u27` from `origin/main` (the sub-task branch `GH-16-main-baseline-repair` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u27`; never the main checkout. The branch exists only after the desk read back the key GH-16 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u27.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
