# Task Spec: u17 containerised-stack: Dockerfiles for db-server and app-server and .dockerignore

> Branch: `GH-13-containerised-stack-u17`   Worktree: `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u17`
> Brief (informational copy; the binding `Brief:` line is the one in the work_item instruction, C1.2): skills/delivery-run/references/briefs-v2/implementer.md
> Ticket: GH-13   Sub-task: st9 (`GH-13-containerised-stack`)   Persona / tier: implementer / execute   Budget: 15 min (repo profile durations.unit_median_min)

## 1. Objective
Write the slim-image Dockerfiles for db-server (with `prisma migrate deploy` before listen and the seed script) and app-server per the container-build decision, and a .dockerignore that lists `.env`.

## 2. Context Package
- Relevant contracts: `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd`
- Relevant architecture: `/Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/architecture.md` section 5 (sub-task row st9) and section 7
- Dependencies: Blocked by: u15 (its Integrator item i15: the decision file at /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md). The images are built by the lead through the docker socket.
- Desk steps (not done by this unit): none (the lead runs docker through the granted socket).

## 3. Scope
**In scope:**
- apps/db-server/Dockerfile*
- apps/app-server/Dockerfile*
- .dockerignore
**Out of scope:**
1. The ui image and nginx.conf (u18).
2. docker-compose.yml and scripts (u19).
3. Changes to application source (st1-st8).
**Do NOT create:**
1. A secret in an image ARG or ENV.
2. A `.env` copied into an image.
3. Dockerfiles outside apps/db-server and apps/app-server.

## 4. Contracts
| Contract | Field / Value | Authority |
|---|---|---|
| `contracts/runtime-env-ports.md@d0d726000f0884e938bb5e0292434657f4198abd` | base image `node:20.14.0-slim` (default, proposed); `HOST=0.0.0.0`; `PORT`; `GRPC_PORT`; `VIDEO_STORAGE_DIR` default `/data/videos`; `DB_GRPC_ADDR`; DIRECT_URL equals DATABASE_URL in compose; no secret baked into an image | contracts/runtime-env-ports.md |

## 5. Inherited Module API
From the spike decision file and the merged sub-tasks: the db-server build output `dist/apps/db-server` (esbuild, bundle false, generatePackageJson true), `protos/src/video/v1/video.proto` (cwd-relative), the Prisma CLI (a devDependency today, must stay in the image), `apps/db-server/prisma/seed.js` (st7).

Test environment: docker build only; no ports are bound.

## 6. What You Inherit
| Thing | Source | Notes |
|---|---|---|
| container-build decision | /Users/xavier/projects/agent-hq-workspace/plans/nx_video_streamer/run-1-20261117/spikes/spike-container-build-approach-decision.md | follow it; if it is `Unverified` on a point, the failing `docker build` or the u19 smoke is the confirmation |
| docker socket | /Users/xavier/.orbstack/run/docker.sock (sandbox overlay, plan P13) | use `docker` only for throwaway containers named with the run id and a random suffix; remove them at teardown |

## 7. Known Risky Values
| Value | Correct | Wrong | Source |
|---|---|---|---|
| db-server entrypoint | runs `prisma migrate deploy` before it listens; the Prisma CLI stays in the image | no migration step | release-plan.md Flags row; containerised-stack draft requirement 5 |
| db-server entrypoint reuse | the compose `seed` service (u19) reuses this image and overrides `entrypoint` and `command` explicitly; keep the default entrypoint (`prisma migrate deploy`, then listen) for the `db-server` service only, and do not make the entrypoint depend on being the only container started from the image | an entrypoint that cannot be overridden by compose | u19 seed service row |
| secrets | no secret as image ARG or ENV; `.env` listed in `.dockerignore` | copying `.env` or baking JWT_SECRET | architecture.md item 10; containerised-stack draft requirement 3 |
| image tags | `nvs-run-1-20261117-<service>:<unit>` (run id in the name so cleanup can find them) | untagged or generic names | delivery-cleanup (catalog rows of kind image) |
| ffmpeg in the db-server image | install `ffmpeg` in the final stage (for example `apt-get install -y --no-install-recommends ffmpeg`) because the compose seed runs u12's `seed.js`, which shells out to ffmpeg (u12 section 7); `docker run --rm --entrypoint ffmpeg <image> -version` exits 0; the installed ffmpeg must include the `libvpx-vp9` encoder because u12's seed encodes VP9 (a Debian `ffmpeg` package includes it; the done command does not check the encoder, the u19 smoke does) | a slim image with no ffmpeg (the seed would fail only at the u19 smoke) | contracts/runtime-env-ports.md (seed exits 0); u12 section 7 |
| proto path | the image working directory contains `protos/src/video/v1/video.proto` (VIDEO_PROTO_PATH is cwd-relative) | running from another cwd | globals/src/lib/constants.ts:1 (measured) |

## 8. Acceptance Criteria
- [ ] `docker build -f apps/db-server/Dockerfile .` exits 0.
- [ ] `docker build -f apps/app-server/Dockerfile .` exits 0.
- [ ] The db-server image contains `ffmpeg` (the compose `seed` service runs u12's seed, which calls `ffmpeg -f lavfi`; the done command runs `ffmpeg -version` in the image).
- [ ] `.dockerignore` lists `.env` (the done command checks the exact line `.env`).
- [ ] Neither Dockerfile contains the text SECRET or PASSWORD in any case, so no ENV or ARG line carries a secret value (the done command checks this; keep comments free of those words).

## 9. Verification Commands
```bash
# criteria 1-4
docker build -f apps/db-server/Dockerfile -t nvs-run-1-20261117-db-server:u17 . && docker build -f apps/app-server/Dockerfile -t nvs-run-1-20261117-app-server:u17 . && docker run --rm --entrypoint ffmpeg nvs-run-1-20261117-db-server:u17 -version && grep -qxF .env .dockerignore && ! grep -q -i -e SECRET -e PASSWORD apps/db-server/Dockerfile apps/app-server/Dockerfile && echo U17-OK
# criteria 3-4 are part of the done command above (exact .env line in .dockerignore; no SECRET or PASSWORD text in either Dockerfile)
```
Done token: `U17-OK`; verifier: `docker build -f apps/db-server/Dockerfile -t nvs-run-1-20261117-db-server:u17 . && docker build -f apps/app-server/Dockerfile -t nvs-run-1-20261117-app-server:u17 . && docker run --rm --entrypoint ffmpeg nvs-run-1-20261117-db-server:u17 -version && grep -qxF .env .dockerignore && ! grep -q -i -e SECRET -e PASSWORD apps/db-server/Dockerfile apps/app-server/Dockerfile && echo U17-OK` (exit 0, last stdout line equals the token).

## 10. Branch and Worktree
`GH-13-containerised-stack-u17` from `origin/main` (the sub-task branch `GH-13-containerised-stack` once it holds the Wave 0 commit) in the unit worktree `/Users/xavier/delivery/worktrees/run-1-20261117-st9-u17`; never the main checkout. The branch exists only after the desk read back the key GH-13 (3.0). Unit branch rule of this plan: `<sub-task branch>-<unit>`.

## 11. Decision Gate Reminder
On any of these, write `.decisions/u17.md` (template: `skills/delivery-run/references/templates/decisions-fork.md`) and stop; do not guess:
1. a value that differs between two contracts
2. a dependency that does not exist yet
3. an unclear scope boundary
4. criteria that cannot be verified with the commands given
5. anything that needs a file outside section 3
