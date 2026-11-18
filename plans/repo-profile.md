# repo-profile.md  (writer: delivery-intake; sole authority, D22)
profile_version: 1
measured_utc: 2026-11-17T16:14:50Z
project_root: /Users/xavier/projects/nx_video_streamer
worktree_base: /Users/xavier/delivery/worktrees
default_branch: main
clones: [/Users/xavier/projects/nx_video_streamer]
linked_profiles: []
repo: {name: nx_video_streamer, type: nx-monorepo, package_scope: none, consumer_repos: [], registry: none}
commands:
  install: npm ci --ignore-scripts
  install_rebuild_allowlist: []
  lint: npx nx affected -t lint
  typecheck: none
  test: npx nx affected -t test
  build: npx nx affected -t build
  pack: none
  clean: none
  release: none
  publish: none
gates:
  command: npx nx affected -t lint test build --base=<base> --head=<head> --parallel=3
  parallel: 3
  min_free_kb: 20971520
  runner_slots: 4
node: {prefix_cmd: source ~/.nvm/nvm.sh && nvm use 20.14.0}
pr:
  author_identity: "local gh login sceptre12 (the desk pushes and opens PRs)"
  approval_rule: "owner 2026-11-17: agents open PRs on main; PR review runs; merge when no Blocking or Medium findings or after 3 rounds; leftover Mediums are backlogged"
  template_path: none
  label_rules: none
  commit_pattern: none
merge_method: squash
merge_route: pr
merge_reach: "main has no CI or deploy workflow; a merge deploys nothing"
version_bump_rule: none
plan_plane_pr: "none (plans_dir lives in the workspace repo, AM-33)"
ci:
  system: none
  status_read_skill: none
  required_checks: []
  min_push_spacing_s: 0
  max_open_pr_pipelines: 0
merge_pipeline: {stages: []}
secrets:
  pattern_file: /Users/xavier/projects/nx_video_streamer-worktrees/delivery/secrets-patterns.txt
  retrieval_env_vars: [DATABASE_URL, DIRECT_URL]
  hosts: []
zephyr:
  read_ops: []
  execute_tool: none
test_management_tool: none
tracker: github
release_tags:
  used: "no"
review_profile:
  mandatory_seats: []
  blocking_rules: ["any auth, session or per-user video access-control defect", "any committed secret"]
  coverage_thresholds: none
sensitive_paths: ['^\.env', '^apps/db-server/prisma/migrations/', '^protos/libs/gen/', '^\.github/']
ports: {lane_base: 36000}
lane_profile:
  lanes_max: 4
  dev_server_cmd: npx nx serve app1
lanes: []
e2e:
  harness: playwright
  context_file: none
  plugin_source: none
  prefix: none
  auth_mode: real login through the UI with run-generated demo accounts (cookie nvs_session); no auth bypass
  mock_gate: none (specs run against the real compose stack; no mocked backend)
  dist_scan_cmd: none (no mock code ships; nothing to scan in dist)
  remotes_resolution: none (app1 is the Module Federation host with no remotes, facts.md)
  serve_targets: [app1, app-server, db-server]
durations:
  pr_review_min: 10
  ci_round_min: 10
  unit_median_min: 15
