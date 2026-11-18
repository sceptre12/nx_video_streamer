# Task Spec: u12 seed-demo-accounts-and-videos: ffmpeg demo seed: two accounts and sample MP4s, idempotent

> Branch: `GH-11-seed-demo-accounts-and-videos-u12`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st7-u12`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-11   Sub-task: st7 (`GH-11-seed-demo-accounts-and-videos`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Write the plain-node seed `apps/db-server/prisma/seed.js` that creates accounts `demo1` and `demo2` with passwords read from env, generates sample MP4s with ffmpeg and inserts Video rows, safe to run twice, plus seed.spec.ts.

## 2. Context Package
- Relevant contracts: `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st7) and section 7
- Dependencies: Blocked by: st1 merged (schema and `bcryptjs`). Needs `ffmpeg` on PATH (measured /opt/homebrew/bin/ffmpeg).
- Desk steps (not done by this unit): `npx prisma generate` (engines, network) by the desk (P10a c31).

## 3. Scope
**In scope:**
- apps/db-server/prisma/seed*
- apps/db-server/prisma/seed*/**
- scripts/seed/**
**Out of scope:**
1. db-server handlers, app-server code.
2. Compose wiring of the seed service (st9).
3. Generating or printing passwords.
**Do NOT create:**
1. A TypeScript seed or a ts-node dependency (the build input is `src/**/*.ts` only, apps/db-server/tsconfig.app.json:9).
2. Committed MP4 files or any committed password.
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019` | `password_hash` algorithm and cost: see contracts/db-schema.md (password_hash row); Video rows with `owner_id`, `title`, `duration_s`; relative `video_path` and `thumbnail_path` (both `@unique`) | contracts/db-schema.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | usernames `demo1` and `demo2` are fixed values; passwords from `DEMO_USER1_PASSWORD` and `DEMO_USER2_PASSWORD`; `VIDEO_STORAGE_DIR`; `DATABASE_URL` | contracts/runtime-env-ports.md |

## 5. Inherited Module API
Created by u12: `apps/db-server/prisma/seed.js` (CommonJS, run as `node apps/db-server/prisma/seed.js`). Uses `@prisma/client` (generated) and `bcryptjs` (st1). No shared helper from other sub-tasks (st7 runs parallel with st2).

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. The spec runs `node apps/db-server/prisma/seed.js` with DEMO_USER1_PASSWORD, DEMO_USER2_PASSWORD, VIDEO_STORAGE_DIR and DATABASE_URL set inline. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| `bcryptjs` | installed by st1 | hash cost per contracts/db-schema.md |
| ffmpeg | `which ffmpeg` -> /opt/homebrew/bin/ffmpeg (facts.md) | generate sample files with `-f lavfi` sources; no committed media; the ffmpeg on PATH must have the `libvpx-vp9` encoder (measured present locally via `ffmpeg -encoders`; a build without it is a desk INSTALL request, not a fallback to another codec) |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| video codec | encode the sample MP4s as VP9 in an MP4 container: `-f lavfi -i testsrc=duration=2:size=320x240:rate=15 -c:v libvpx-vp9 -pix_fmt yuv420p -an` (add `-movflags +faststart`); Playwright's bundled chromium decodes VP9 and has no H.264, and u22's playback check (readyState 4) runs in it | the ffmpeg default (H.264) or any codec chromium cannot decode, so the playback check could fail for a non-product reason | dispatch-plan.md P10a c18 (Playwright bundled chromium); u22 section 8 |
| usernames | `demo1`, `demo2` literal (not secret) | variables or other names | contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd |
| passwords | read from `DEMO_USER1_PASSWORD` and `DEMO_USER2_PASSWORD`; the seed never generates or prints them | a literal or generated password | contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd |
| re-run | second run exits 0, row counts unchanged, password_hash upserted from env so a changed password still logs in; videos skipped by existing `video_id` | duplicate rows or an exit 1 | seed-demo-accounts-and-videos draft requirements 1-2 |
| paths | stored `video_path` and `thumbnail_path` relative to VIDEO_STORAGE_DIR | absolute paths | contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019 |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] The seed creates two accounts and playable MP4 files: each file is non-empty, has an `ftyp` box at bytes 4-8 and passes `ffprobe` with exit 0 (seed.spec.ts).
- [ ] Every generated MP4 has video codec `vp9` in an mp4 container: seed.spec.ts runs `ffprobe` on each file and asserts `codec_name` is `vp9` (seed.spec.ts).
- [ ] A second run exits 0, row counts are unchanged and the env password still verifies (seed.spec.ts).
- [ ] The seed prints account names only and never a password (seed.spec.ts asserts the output).
- [ ] The seed runs with plain `node` and no TypeScript runner (seed.spec.ts spawns `node apps/db-server/prisma/seed.js`).

## 9. Verification Commands
```bash
# all criteria
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/prisma/seed.spec.ts && echo U12-OK
```
Done token: `U12-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/prisma/seed.spec.ts && echo U12-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-11-seed-demo-accounts-and-videos-u12` from `origin/main` (the sub-task branch `GH-11-seed-demo-accounts-and-videos` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st7-u12`; never the main checkout. The branch exists only after the desk read back the key GH-11 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u12.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
