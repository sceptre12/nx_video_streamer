# Task Spec: u2 db-users-videos-schema: Proto additions and regenerated stubs

> Branch: `GH-5-db-users-videos-schema-u2`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st1-u2`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-5   Sub-task: st1 (`GH-5-db-users-videos-schema`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Add the gRPC additions of the grpc-db pin to protos/src/video/v1/video.proto and regenerate protos/libs/gen/** (only this unit regenerates it).

## 2. Context Package
- Relevant contracts: `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st1) and section 7
- Dependencies: Blocked by: none (independent). The two generator commands need the network (remote buf plugins, protos/buf.gen.yaml:4,7), so they run by the desk (plan P10a c21, review-architecture.md H6); the executor commits the produced files.
- Desk steps (not done by this unit): `npx nx run protos:build` runs by the desk with network (plan P10a c21); the executor commits its output.

## 3. Scope
**In scope:**
- protos/src/video/v1/video.proto
- protos/libs/gen/**
**Out of scope:**
1. Handler code (st2), app-server clients (st3).
2. Any edit to contracts/grpc-db.md (st0 owns contracts/).
3. Changes to protos/buf.gen.yaml or protos/project.json.
**Do NOT create:**
1. A second .proto file.
2. Hand-edited files under protos/libs/gen/** (they are generated output only).
3. Dependency edits.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863` | messages `User`, `CreateUserRequest/Response`, `GetUserByUsernameRequest`, `GetUserByIdRequest`, `GetUserResponse`, `ListVideosByOwnerRequest`, `GetVideoForOwnerRequest`; rpcs `CreateUser`, `GetUserByUsername`, `GetUserById`, `ListVideosByOwner`, `GetVideoForOwner`; `VideoItem` +7,8,9; `CreateVideoRequest.owner_id=3`; `UpdateVideoStreamingStateRequest.owner_id=3`; `GetVideoResponse` +7,8,9 | contracts/grpc-db.md until this unit merges, then protos/src/video/v1/video.proto |

## 5. Inherited Module API
Existing service `DbComService` in protos/src/video/v1/video.proto. Nx project `protos` targets: `generate_protos` (`buf generate`), `build_types` (`proto-loader-gen-types --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --outDir ./libs/gen/protobuf-types`), `build`, `lint` (`buf lint`), measured in protos/project.json.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| node 20.14.0 via nvm | desk INSTALL (manager nvm) before dispatch, plan P0a step 2 | use the prefix of risky-values row 'node prefix' |
| node_modules | desk `npm ci --ignore-scripts` in the sub-task worktree (plan P0a step 3); the unit worktree's `node_modules` is a symlink to the sub-task worktree's `node_modules`, created by the lead right after the unit worktree is cut and before the unit starts (plan P0a step 3); the symlink is git-ignored | do not run an installer; a missing package is an INSTALL request to the desk |
| buf remote plugins | protos/buf.gen.yaml:4,7 (network) | run only through the desk (P10a c21) |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| field numbers | appended only: VideoItem 7,8,9; CreateVideoRequest.owner_id=3; UpdateVideoStreamingStateRequest.owner_id=3; existing numbers untouched | renumbering or reusing a number | contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863 |
| `longs` loader option | `String` (protos/project.json build_types `--longs=String`); int64 crosses as a string | changing the option | contracts/grpc-db.md@2ded721b5b33b467e3531a38b115d85ccf3a5863 |
| sensitive path | `protos/libs/gen/**` is in sensitive_paths and explicitly in scope for st1 (plan P13 grant.st1.2) | committing any other sensitive path | plans/repo-profile.md sensitive_paths; architecture.md item 5 |
| regeneration owner | only u2 regenerates `protos/libs/gen/**` | any other unit running the generator | architecture.md item 7 |
| node prefix | `source ~/.nvm/nvm.sh && nvm use 20.14.0` in every shell call | system node v22.13.0 (node 20.14.0 is installed by the desk before dispatch) | repo-profile.md node.prefix_cmd |

## 8. Acceptance Criteria
- [ ] video.proto contains every message and rpc name of the grpc-db pin (names present; the section 7 field numbers are read by the verifier from the diff, no command checks them).
- [ ] `npx nx run protos:build` exits 0 and the regenerated files include `CreateUser` in DbComService.ts and `owner_id` in VideoItem.ts.
- [ ] No file outside `protos/src/video/v1/video.proto` and `protos/libs/gen/**` changed.

## 9. Verification Commands
```bash
# criteria 1-2
source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx nx run protos:build && grep -q CreateUser protos/libs/gen/protobuf-types/src/video/v1/DbComService.ts && grep -q owner_id protos/libs/gen/protobuf-types/src/video/v1/VideoItem.ts && echo U2-OK
# criterion 1 (rpcs and fields in the proto)
grep -c -E 'rpc (CreateUser|GetUserByUsername|GetUserById|ListVideosByOwner|GetVideoForOwner)|owner_id' protos/src/video/v1/video.proto
# criterion 3 (expect 0)
git diff --name-only origin/main | grep -v -E '^(protos/src/video/v1/video.proto|protos/libs/gen/)' | wc -l
```
Done token: `U2-OK`; verifier: `source ~/.nvm/nvm.sh && nvm use 20.14.0 && npx nx run protos:build && grep -q CreateUser protos/libs/gen/protobuf-types/src/video/v1/DbComService.ts && grep -q owner_id protos/libs/gen/protobuf-types/src/video/v1/VideoItem.ts && echo U2-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-5-db-users-videos-schema-u2` from `origin/main` (the sub-task branch `GH-5-db-users-videos-schema` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st1-u2`; never the main checkout. The branch exists only after the desk read back the key GH-5 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u2.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
