# Task Spec: u1 db-users-videos-schema: Prisma User model, Video owner columns, additive migration and its spec

> Branch: `GH-5-db-users-videos-schema-u1`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st1-u1`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-5   Sub-task: st1 (`GH-5-db-users-videos-schema`)   Persona / tier: implementer / design   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Add `model User` and `Video.owner_id/title/duration_s` to schema.prisma, one new additive migration directory, and migration.spec.ts proving the migration applies over a database that holds legacy Video rows.

## 2. Context Package
- Relevant contracts: `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019`, `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st1) and section 7
- Dependencies: Blocked by: none (independent). Done input: the INSTALLED ledger row for `bcryptjs` (st1 owns that package; the lead requests it in Wave 0, plan P5), visible as `"bcryptjs"` in package.json.
- Desk steps (not done by this unit): INSTALL `bcryptjs` (owner u1) in the st1 worktree before dispatch (plan P0a step 4).

## 3. Scope
**In scope:**
- apps/db-server/prisma/schema.prisma
- apps/db-server/prisma/migrations/**
- apps/db-server/prisma/migration.spec.ts
**Out of scope:**
1. Handler or gRPC code (st2), any app-server code.
2. protos/** (u2 owns the proto and stubs).
3. Seed files `apps/db-server/prisma/seed*` (st7 owns them).
4. Any edit to the two existing migration directories.
**Do NOT create:**
1. A down migration or a backup step (rollback = recreate the volume, db-schema pin).
2. A second migration directory.
3. `.env` or any file holding a database URL value.
4. Dependency edits to package.json or the lockfile (desk INSTALL only).

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019` | `model User` fields; `Video` gains `owner_id String?` (indexed relation to User.user_id), `title String?`, `duration_s Int?`; nullable columns only; existing migrations unchanged | contracts/db-schema.md |
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | DATABASE_URL, DIRECT_URL names (names only, never values) | contracts/runtime-env-ports.md |

## 5. Inherited Module API
Prisma 5.5.2 (`prisma` and `@prisma/client` pinned in package.json devDependencies/dependencies). Existing model `Video` in apps/db-server/prisma/schema.prisma (`@@id([video_id])`, `video_path` and `thumbnail_path` `@unique`). Migration SQL lives in `apps/db-server/prisma/migrations/<timestamp>_<name>/migration.sql`.

Test environment: Throwaway Postgres (test-plan.md A2 integration-env): the spec starts `postgres:16` through the docker socket /Users/xavier/.orbstack/run/docker.sock with a per-spec random container-name suffix on a random host port read back with `docker port`, runs `prisma migrate deploy`, sets DATABASE_URL and DIRECT_URL inline and removes the container at teardown. JWT_SECRET and demo passwords are generated at spec start with crypto.randomBytes and passed in memory; VIDEO_STORAGE_DIR is a per-spec temp dir; no secret literal in a diff (test-plan.md A2 spec-secrets).

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| `bcryptjs` | desk INSTALL, ledger row (plan P5) | installed for st3 and st7; this unit does not import it |
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| `User.user_id` | `String @id @default(uuid())` | an Int id or no default | contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019 |
| `User.created_at` | `BigInt` | `DateTime` | contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019 |
| `Video.owner_id` | `String?` (nullable) with an index and a relation to `User.user_id` | a non-null column, or a missing index | contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019 |
| migration shape | one NEW directory under apps/db-server/prisma/migrations; the two existing directories byte-identical | editing `20240624035006_init` or `20240629030819_changed_dates_to_big_int` | contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019 |
| legacy rows | legacy Video rows survive with `owner_id` NULL | a NOT NULL add that fails on existing rows | contracts/db-schema.md@d01c05399cac0a87b6b7d00ddb294f1674ced019 |
| sensitive path | `apps/db-server/prisma/migrations/` is in sensitive_paths and explicitly in scope for st1 (plan P13 grant.st1.1) | treating the path as out of bounds or touching other sensitive paths | plans/repo-profile.md sensitive_paths; architecture.md item 5 |
| Prisma client | run `npx prisma generate --schema apps/db-server/prisma/schema.prisma` in this worktree before any build or test | assuming `@prisma/client` is generated (`npm ci --ignore-scripts` skips it and only u1 generated it in its own worktree) | review-architecture.md H1; repo-profile.md commands.install |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |
| secrets in specs | generated at spec start with crypto.randomBytes, passed in memory | any literal JWT_SECRET, password or `.env` content in a diff | test-plan.md A2 spec-secrets; architecture.md item 10 |

## 8. Acceptance Criteria
- [ ] `schema.prisma` has `model User` and the three new Video columns exactly per the db-schema pin.
- [ ] A new additive migration directory exists and the two existing directories are unchanged.
- [ ] `npx prisma generate --schema apps/db-server/prisma/schema.prisma` exits 0.
- [ ] migration.spec.ts passes: copy the two existing migration directories to a temp dir, `prisma migrate deploy` against a throwaway postgres, insert legacy Video rows with `psql` in that container, then `prisma migrate deploy` with the full directory and assert the rows survive with `owner_id` NULL.
- [ ] `"bcryptjs"` is present in package.json (desk INSTALL done).

## 9. Verification Commands
```bash
# criteria 1-4 and 5
source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q bcryptjs package.json && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/prisma/migration.spec.ts && git diff --quiet origin/main -- apps/db-server/prisma/migrations/20240624035006_init apps/db-server/prisma/migrations/20240629030819_changed_dates_to_big_int && echo U1-OK
# criterion 1 (model and columns present)
grep -c -E 'model User|owner_id|duration_s|title' apps/db-server/prisma/schema.prisma
# criterion 2 (one new directory, two old unchanged; expect 3 directories)
ls -d apps/db-server/prisma/migrations/*/ | wc -l
# criterion 2 (existing migrations untouched)
git diff --quiet origin/main -- apps/db-server/prisma/migrations/20240624035006_init apps/db-server/prisma/migrations/20240629030819_changed_dates_to_big_int
```
Done token: `U1-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && grep -q bcryptjs package.json && npx prisma generate --schema apps/db-server/prisma/schema.prisma && npx jest -c apps/db-server/jest.config.ts --runInBand apps/db-server/prisma/migration.spec.ts && git diff --quiet origin/main -- apps/db-server/prisma/migrations/20240624035006_init apps/db-server/prisma/migrations/20240629030819_changed_dates_to_big_int && echo U1-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-5-db-users-videos-schema-u1` from `origin/main` (the sub-task branch `GH-5-db-users-videos-schema` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st1-u1`; never the main checkout. The branch exists only after the desk read back the key GH-5 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u1.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
