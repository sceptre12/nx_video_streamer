# Task Spec: u26 app2-production-build: app2 styles entry and a typed VideoMenu prop

> Branch: `GH-16-main-baseline-repair-u26`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u26`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-16   Sub-task: st11 (`GH-16-main-baseline-repair`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Make `app2:build:production` compile: point the app2 build `styles` entry at the existing `apps/app2/src/styles.css`, and type the `selectedVideo` prop of `apps/app2/src/app/VideoMenu.tsx` (TS7031).

## 2. Context Package
- Relevant contracts: none (app2 is outside every contract).
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/dispatch-plan.md` P0b F15; the failure is measured in `/Users/xavier/delivery/run-1-20261117/baseline-gates.md` row `app2:build:production` (missing `styles.tailwind`; TS7031 at VideoMenu.tsx:1:22).
- Dependencies: Blocked by: u25 (its Integrator item i25 in the same wave: u25 adds the `test` target to `apps/app2/project.json`, the file this unit edits after it; plan P5).
- Desk steps (not done by this unit): the done command runs as a desk GATE-RUN (plan P10a c52); it needs no network (the app2 build has no `dependsOn`, measured).
- Task file location: until u27 lands it on the sub-task branch, this file is read from `/Users/xavier/projects/nx_video_streamer/.tasks/u26-app2-production-build.md` (plan P0b F15).

## 3. Scope
**In scope:**
- apps/app2/project.json
- apps/app2/src/app/VideoMenu.tsx
**Out of scope:**
1. Any project.json key other than the one `styles` entry (the `test` target is u25's).
2. app2 components other than VideoMenu.tsx, and the two `no-unused-vars` warnings in apps/app2/src/app/app.tsx:14 (warnings; lint exits 0).
3. Creating `styles.tailwind` (design answer fixed by the coordinator: point at styles.css).
**Do NOT create:**
1. A new stylesheet.
2. A `// @ts-ignore`, `// @ts-expect-error` or `any` for the prop.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| none | no contract governs app2 | `/Users/xavier/delivery/run-1-20261117/baseline-gates.md` (app2:build:production) |

## 5. Inherited Module API
`apps/app2/project.json:20` reads `"styles": ["apps/app2/src/styles.tailwind"]`; `apps/app2/src/styles.css` exists and holds the three `@tailwind` directives; no other file names `styles.tailwind` (measured: `grep -rn styles.tailwind apps *.json`). `VideoMenu.tsx:1` is `const VideoMenu = ({ selectedVideo }) => {`; no file renders `VideoMenu` today, and the only `selectedVideo` holder is `apps/app2/src/app/app.tsx:14` `useState(null)` (measured: `grep -rn VideoMenu apps/app2/src`). The app2 build target is `@nx/webpack:webpack` with no `dependsOn` (measured: `npx nx show project app2 --json`). In a scratch copy of main with `styles.css` and a typed prop, `npx nx build app2 --configuration=production --skip-nx-cache` printed "webpack compiled successfully", rc 0 (measured).

Test environment: none (build only).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| u25's `targets.test` entry in apps/app2/project.json | merged u25 (i25) | keep it unchanged |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3, P10a c49); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| styles entry | `"styles": ["apps/app2/src/styles.css"]` | `styles.tailwind` (missing file) or a second stylesheet | baseline-gates.md; design answer (coordinator) |
| prop type | an interface `VideoMenuProps { selectedVideo: string \| null; }` and `({ selectedVideo }: VideoMenuProps)` (default: matches the `useState(null)` holder in app.tsx:14 and the string `video_id` of the api-http pin) | `any`, an untyped destructure, or a directive | baseline-gates.md (TS7031); measured (section 5) |
| u25's edit | `targets.test.options.passWithNoTests` stays `true` | dropping or rewriting u25's `test` target | plan P5 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] apps/app2/project.json names `apps/app2/src/styles.css` and no longer names `styles.tailwind`; u25's `passWithNoTests` entry is still present.
- [ ] `npx nx build app2 --configuration=production --skip-nx-cache` exits 0 (no TS7031, no missing module).
- [ ] VideoMenu's prop is typed with no `any` and no directive (verifier-read side command in section 9, outside the done token; expect 0).

## 9. Verification Commands
```bash
# criteria 1-2
source ~/.nvm/nvm.sh && nvm use 20.14.0 && jq -e .targets.test.options.passWithNoTests apps/app2/project.json && grep -q apps/app2/src/styles.css apps/app2/project.json && ! grep -q styles.tailwind apps/app2/project.json && npx nx build app2 --configuration=production --skip-nx-cache && echo U26-OK
# criterion 3 (expect 0)
grep -c -E 'any|@ts-' apps/app2/src/app/VideoMenu.tsx
```
Done token: `U26-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && jq -e .targets.test.options.passWithNoTests apps/app2/project.json && grep -q apps/app2/src/styles.css apps/app2/project.json && ! grep -q styles.tailwind apps/app2/project.json && npx nx build app2 --configuration=production --skip-nx-cache && echo U26-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-16-main-baseline-repair-u26` from the sub-task branch `GH-16-main-baseline-repair` after i25 merged (cut by the lead from the sub-task head) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st11-u26`; never the main checkout. The branch exists only after the desk read back the key GH-16 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u26.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
