#!/usr/bin/env bash
set -euo pipefail

: "${EXAMXX_DB_PASSWORD:?Set EXAMXX_DB_PASSWORD before starting the application}"

java_version="$(java -version 2>&1 | awk -F '"' '/version/ { print $2; exit }')"
java_major="${java_version%%.*}"
if [[ "$java_major" == "1" ]]; then
  java_major="${java_version#1.}"
  java_major="${java_major%%.*}"
fi

if [[ -z "$java_major" || "$java_major" -lt 17 ]]; then
  echo "JDK 17 or newer is required. Current Java version: ${java_version:-unknown}" >&2
  echo "Set JAVA_HOME to a JDK 17 installation and prepend \$JAVA_HOME/bin to PATH." >&2
  exit 1
fi

if [[ ! -d frontend/node_modules ]]; then
  (cd frontend && npm install)
fi

(cd frontend && npm run build:embedded)
mvn -DskipTests package
exec java -jar target/examxx-0.0.1-SNAPSHOT.jar
