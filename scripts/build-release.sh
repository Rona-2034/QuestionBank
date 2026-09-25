#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

for command in node npm mvn; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

java_version="$(java -version 2>&1 | awk -F '"' '/version/ { print $2; exit }')"
java_major="${java_version%%.*}"
if [[ "$java_major" == "1" ]]; then
  java_major="${java_version#1.}"
  java_major="${java_major%%.*}"
fi
if [[ -z "$java_major" || "$java_major" -lt 17 ]]; then
  echo "JDK 17 or newer is required. Current Java version: ${java_version:-unknown}" >&2
  exit 1
fi

if [[ -f frontend/package-lock.json ]]; then
  (cd frontend && npm ci)
else
  (cd frontend && npm install)
fi

(cd frontend && npm run build:embedded)
mvn clean package

artifact="$(find target -maxdepth 1 -type f -name '*.jar' ! -name '*.jar.original' | head -n 1)"
if [[ -z "$artifact" ]]; then
  echo "Build succeeded but no executable JAR was found in target/." >&2
  exit 1
fi

echo
echo "Release artifact: $ROOT_DIR/$artifact"
