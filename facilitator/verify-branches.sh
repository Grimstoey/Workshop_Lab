#!/usr/bin/env bash
# Dry-run check: every lab/solution/demo branch must typecheck and pass
# unit, integration and e2e tests. Runs in a throwaway git worktree so your
# own checkout is untouched.
#
#   facilitator/verify-branches.sh              # all branches
#   facilitator/verify-branches.sh 'jest/lab/*' # only matching branches
#
# Takes ~15 minutes. Needs Docker running and `npm ci` done in app/.
set -uo pipefail

repo=$(git rev-parse --show-toplevel)
pattern=${1:-*}
worktree=$(mktemp -d)/verify

cleanup() {
  (cd "$worktree/app" 2>/dev/null && docker compose --profile e2e --profile tools down -v >/dev/null 2>&1)
  git -C "$repo" worktree remove --force "$worktree" >/dev/null 2>&1
}
trap cleanup EXIT

git -C "$repo" worktree add -q --detach "$worktree" main
ln -s "$repo/app/node_modules" "$worktree/app/node_modules"
(cd "$repo/app" && docker compose --profile e2e --profile tools down -v >/dev/null 2>&1)

jest_summary() { grep -Eo 'Tests: .*' | tail -1 | tr -s ' ' | sed 's/^Tests: //'; }
playwright_summary() { grep -Eo '[0-9]+ (passed|failed|flaky|skipped)' | paste -sd ',' - | sed 's/,/, /g'; }

for branch in $(git -C "$repo" branch --format='%(refname:short)' --list "$pattern" | sort); do
  git -C "$worktree" checkout -q --detach "$branch"
  cd "$worktree/app"

  if npx tsc --noEmit >/dev/null 2>&1; then tsc=ok; else tsc=FAIL; fi
  unit=$(npx jest --selectProjects unit 2>&1 | jest_summary)
  integration_log=$(npm run test:integration 2>&1)
  integration=$(echo "$integration_log" | jest_summary)
  echo "$integration_log" | grep -q 'did not exit' && integration="$integration (did not exit)"
  e2e=$(npm run test:e2e 2>&1 | playwright_summary)

  printf '%-32s tsc=%-4s | unit: %-30s | integ: %-44s | e2e: %s\n' \
    "$branch" "$tsc" "${unit:-NO RESULT}" "${integration:-NO RESULT}" "${e2e:-NO RESULT}"
  docker compose --profile e2e --profile tools down -v >/dev/null 2>&1
done
