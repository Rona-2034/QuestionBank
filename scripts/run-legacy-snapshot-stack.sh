#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT="${LEGACY_BACKEND_PORT:-8086}"
FRONTEND_PORT="${LEGACY_FRONTEND_PORT:-4173}"
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"
JETTY_LOG="${JETTY_LOG:-/tmp/examxx-legacy-jetty.log}"
FRONTEND_LOG="${FRONTEND_LOG:-/tmp/examxx-legacy-frontend.log}"
CURRENT_STEP="initializing"

cleanup() {
  local exit_code=$?
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
    wait "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${JETTY_PID:-}" ]] && kill -0 "$JETTY_PID" >/dev/null 2>&1; then
    kill "$JETTY_PID" >/dev/null 2>&1 || true
    wait "$JETTY_PID" >/dev/null 2>&1 || true
  fi
  if [[ $exit_code -ne 0 ]]; then
    echo "Legacy snapshot flow failed at step: $CURRENT_STEP" >&2
    echo "Jetty log: $JETTY_LOG" >&2
    echo "Frontend log: $FRONTEND_LOG" >&2
  fi
  exit $exit_code
}

trap cleanup EXIT

log_step() {
  CURRENT_STEP="$1"
  echo "==> $CURRENT_STEP"
}

mkdir -p "$(dirname "$JETTY_LOG")" "$(dirname "$FRONTEND_LOG")"

pushd "$APP_DIR" >/dev/null
log_step "package-war"
mvn -q -DskipTests package

log_step "start-legacy-backend"
nohup mvn org.eclipse.jetty:jetty-maven-plugin:9.4.57.v20241219:run \
  -Djetty.port="$BACKEND_PORT" \
  "-Dapp.cors.allowedOrigins=http://127.0.0.1:${FRONTEND_PORT},http://localhost:${FRONTEND_PORT}" \
  -Ddb.driverClass=org.h2.Driver \
  "-Ddb.jdbcUrl=jdbc:h2:mem:examxxlegacy;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=false;INIT=RUNSCRIPT FROM 'classpath:h2/legacy-schema.sql'\;RUNSCRIPT FROM 'classpath:h2/legacy-seed.sql'" \
  -Ddb.user=sa \
  -Ddb.password= \
  >"$JETTY_LOG" 2>&1 &
JETTY_PID=$!
popd >/dev/null

for _ in $(seq 1 90); do
  if curl -fsS "$BACKEND_URL/api/app/auth/me" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log_step "wait-for-legacy-backend"
if ! curl -fsS "$BACKEND_URL/api/app/auth/me" >/dev/null 2>&1; then
  echo "Jetty failed to start. Tail of $JETTY_LOG:" >&2
  tail -n 120 "$JETTY_LOG" >&2 || true
  exit 1
fi

pushd "$FRONTEND_DIR" >/dev/null
log_step "build-standalone-frontend"
VITE_API_BASE_URL="$BACKEND_URL" npm run build >"$FRONTEND_LOG" 2>&1

log_step "start-frontend-preview"
nohup npm run preview -- --host 127.0.0.1 --port "$FRONTEND_PORT" >>"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
popd >/dev/null

for _ in $(seq 1 60); do
  if curl -fsS "$FRONTEND_URL/app/login" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log_step "wait-for-frontend-preview"
if ! curl -fsS "$FRONTEND_URL/app/login" >/dev/null 2>&1; then
  echo "Frontend preview failed to start. Tail of $FRONTEND_LOG:" >&2
  tail -n 120 "$FRONTEND_LOG" >&2 || true
  exit 1
fi

pushd "$FRONTEND_DIR" >/dev/null
log_step "ensure-playwright-browser"
npx playwright install chromium >/dev/null

log_step "playwright-legacy-snapshot"
E2E_BASE_URL="$FRONTEND_URL" npx playwright test tests/legacy-snapshot.spec.ts --reporter=line
popd >/dev/null

log_step "legacy-snapshot-complete"
echo "Legacy snapshot frontend verified at: $FRONTEND_URL/app/login"
