# Task Spec: u24 ts-expect-error-lint: Replace the 13 `@ts-ignore` comments with `@ts-expect-error` plus a reason

> Branch: `GH-16-main-baseline-repair-u24`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u24`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-16   Sub-task: st11 (`GH-16-main-baseline-repair`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Replace the 13 `@ts-ignore` comments in app-server and db-server with `@ts-expect-error` plus a one-line reason, behaviour unchanged, so `app-server:lint` and `db-server:lint` pass `@typescript-eslint/ban-ts-comment`.

## 2. Context Package
- Relevant contracts: none (the unit changes comment directives only); the failure is measured in `/Users/xavier/delivery/run-1-20261117/baseline-gates.md` rows `app-server:lint` and `db-server:lint` (main `002db0cf3fb2ccb4cb06741305f0f5478c6203b3`).
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/dispatch-plan.md` P0b F15 (main baseline repair; owner ruling "Fix main's failures in this run").
- Dependencies: Blocked by: none (independent). No desk package install.
- Desk steps (not done by this unit): the done command runs `npx prisma generate` (engines, network) and is run by the desk as a GATE-RUN (plan P10a c50).
- Task file location: until u27 lands it on the sub-task branch, this file is read from `/Users/xavier/projects/nx_video_streamer/.tasks/u24-ts-expect-error-lint.md` (plan P0b F15).

## 3. Scope
**In scope:**
- apps/app-server/src/app/grpc/services/createVideo.ts
- apps/app-server/src/app/grpc/services/updateVideoStreamingState.ts
- apps/db-server/src/app/grpc/services/handleCreatingVideo.ts
- apps/db-server/src/app/grpc/services/handleUpdatingStreamingState.ts
- apps/db-server/src/main.ts
**Out of scope:**
1. Any change other than the 13 comment lines: no retyping, no renamed fields, no logic edit (design answer fixed by the coordinator: `@ts-expect-error`, not retyping).
2. The two `no-unused-vars` warnings in apps/db-server/src/app/video_processor/streamVideoToServer/index.ts:51 (warnings; lint exits 0 with them).
3. Lint configuration (`.eslintrc.json` at any level).
**Do NOT create:**
1. `eslint-disable` comments.
2. New type declarations, casts or interfaces.
3. Dependency edits to package.json or the lockfile.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| none | no contract field is read or written; the gate failure is the measured row | `/Users/xavier/delivery/run-1-20261117/baseline-gates.md` (app-server:lint, db-server:lint) |

## 5. Inherited Module API
typescript 5.4.5 and @typescript-eslint/eslint-plugin 7.13.1 (measured in the baseline worktree's node_modules); `lint` is the inferred `@nx/eslint/plugin` target (`eslint .`, no `dependsOn`, measured: `npx nx show project app-server --json`). What each directive hides (measured with the TypeScript compiler API, directives turned into plain comments): the 10 gRPC sites hide TS2339/TS2561 casing errors (keepCase runtime objects are snake_case, the generated types under protos/libs/gen/protobuf-types are camelCase); the 3 main.ts sites hide TS2345 (socket.io event names not in the typed event map). With all 13 swapped to `@ts-expect-error`, `tsc --noEmit` reports 0 diagnostics for both apps (no TS2578 unused directive).

Test environment: none (no spec; lint and type check only).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3, P10a c49); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| Prisma client | `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in the done command | db-server's `db/**` imports `@prisma/client`, so its type check needs the generated client |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| directive form | `// @ts-expect-error <reason>` on the same line the `@ts-ignore` was on, reason at least 3 characters | a bare `// @ts-expect-error` (fails `allow-with-description`) | @typescript-eslint/eslint-plugin 7.13.1 recommended `ban-ts-comment` |
| reason, 10 gRPC sites (createVideo.ts 31, 38, 43; updateVideoStreamingState.ts 31, 39, 43; handleCreatingVideo.ts 21, 74; handleUpdatingStreamingState.ts 7, 26) | `keepCase runtime field is snake_case; generated type is camelCase` (default) | a reason that claims a different cause | measured: TS2339/TS2561 under each site (plan P0b F15) |
| reason, 3 socket sites (main.ts 58, 64, 70) | `socket.io event name is not in the typed event map` (default) | a reason that claims a different cause | measured: TS2345 under each site (plan P0b F15) |
| count | exactly 13 `@ts-expect-error` and 0 `@ts-ignore` in apps/app-server/src and apps/db-server/src | deleting a directive (the hidden error returns) or adding one | baseline-gates.md (13 errors) |
| behaviour | unchanged; `tsc --noEmit` of both apps reports 0 diagnostics | an unused directive (TS2578) or any code edit | measured (plan P0b F15) |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] No `@ts-ignore` remains in apps/app-server/src or apps/db-server/src (in the done command); exactly 13 `@ts-expect-error` directives exist there (verifier-read side command in section 9, outside the done token; expect 13).
- [ ] `npx tsc --noEmit -p apps/app-server/tsconfig.app.json` and `npx tsc --noEmit -p apps/db-server/tsconfig.app.json` exit 0.
- [ ] `npx nx run-many -t lint -p app-server db-server --skip-nx-cache` exits 0.
- [ ] The diff changes only the 13 comment lines (verifier-read side command in section 9, outside the done token; expect 0).

## 9. Verification Commands
```bash
# criteria 1 (no @ts-ignore), 2 and 3
source ~/.nvm/nvm.sh && nvm use 20.14.0 && ! grep -rqn @ts-ignore apps/app-server/src apps/db-server/src && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx tsc --noEmit -p apps/app-server/tsconfig.app.json && npx tsc --noEmit -p apps/db-server/tsconfig.app.json && npx nx run-many -t lint -p app-server db-server --skip-nx-cache && echo U24-OK
# criterion 1 (count; expect 13)
grep -rn @ts-expect-error apps/app-server/src apps/db-server/src | wc -l
# criterion 4 (changed lines that are not a directive line; expect 0)
git diff -U0 origin/main -- apps/app-server/src apps/db-server/src | grep -E '^[-+][^-+]' | grep -v -E '@ts-(ignore|expect-error)' | wc -l
```
Done token: `U24-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && ! grep -rqn @ts-ignore apps/app-server/src apps/db-server/src && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx tsc --noEmit -p apps/app-server/tsconfig.app.json && npx tsc --noEmit -p apps/db-server/tsconfig.app.json && npx nx run-many -t lint -p app-server db-server --skip-nx-cache && echo U24-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-16-main-baseline-repair-u24` from `origin/main` (the sub-task branch `GH-16-main-baseline-repair` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u24`; never the main checkout. The branch exists only after the desk read back the key GH-16 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u24.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
