#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR"
FRONTEND_DIR="$ROOT_DIR/frontend"
PORT="${E2E_PORT:-8085}"
BASE_URL="http://127.0.0.1:${PORT}"
JETTY_LOG="${JETTY_LOG:-/tmp/examxx-jetty-e2e.log}"

cleanup() {
  if [[ -n "${JETTY_PID:-}" ]] && kill -0 "$JETTY_PID" >/dev/null 2>&1; then
    kill "$JETTY_PID" >/dev/null 2>&1 || true
    wait "$JETTY_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

mkdir -p "$(dirname "$JETTY_LOG")"

pushd "$APP_DIR" >/dev/null
mvn -q -DskipTests package
nohup mvn org.eclipse.jetty:jetty-maven-plugin:9.4.57.v20241219:run \
  -Djetty.port="$PORT" \
  -Ddb.driverClass=org.h2.Driver \
  "-Ddb.jdbcUrl=jdbc:h2:mem:examxxe2e;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=false;INIT=RUNSCRIPT FROM 'classpath:h2/e2e-schema.sql'\;RUNSCRIPT FROM 'classpath:h2/e2e-seed.sql'" \
  -Ddb.user=sa \
  -Ddb.password= \
  >"$JETTY_LOG" 2>&1 &
JETTY_PID=$!
popd >/dev/null

for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL/app/login" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! curl -fsS "$BASE_URL/app/login" >/dev/null 2>&1; then
  echo "Jetty failed to start. Tail of $JETTY_LOG:" >&2
  tail -n 120 "$JETTY_LOG" >&2 || true
  exit 1
fi

pushd "$FRONTEND_DIR" >/dev/null
echo "Installing Playwright Chromium if needed..."
npx playwright install chromium >/dev/null
npm run e2e -- --reporter=line
popd >/dev/null
