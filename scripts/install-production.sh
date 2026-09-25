#!/usr/bin/env bash
set -euo pipefail

APP_USER="examxx"
APP_DIR="/opt/examxx"
DATA_DIR="/var/lib/examxx/uploads"
CONFIG_DIR="/etc/examxx"
SERVICE_NAME="examxx"
PORT="8080"
BIND_ADDRESS="127.0.0.1"
ARTIFACT=""
DB_URL=""
DB_USERNAME=""
INSTALL_JRE=0

usage() {
  cat <<'USAGE'
Install the Examxx production service.

Usage:
  sudo ./scripts/install-production.sh \
    --artifact /path/to/examxx-0.0.1-SNAPSHOT.jar \
    --db-url 'jdbc:mysql://db-host:3306/examxx?...' \
    --db-username examxx_app

Required:
  --artifact PATH       Executable JAR produced by build-release.sh
  --db-url URL          JDBC URL for the production MySQL database
  --db-username USER    MySQL application user

Optional:
  --app-dir PATH        Application directory (default: /opt/examxx)
  --data-dir PATH       Upload directory (default: /var/lib/examxx/uploads)
  --port PORT           Local service port (default: 8080)
  --bind-address ADDR   Bind address (default: 127.0.0.1)
  --user USER           Linux service user (default: examxx)
  --install-jre         Install OpenJDK 17 JRE with apt/dnf/yum when required
  --help                Show this message

The database password is read securely from EXAMXX_DB_PASSWORD or an interactive prompt.
USAGE
}

fail() {
  echo "Error: $*" >&2
  exit 1
}

require_value() {
  [[ $# -eq 2 && -n "$2" ]] || fail "Missing value for $1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --artifact)
      require_value "$1" "${2:-}"
      ARTIFACT="$2"
      shift 2
      ;;
    --db-url)
      require_value "$1" "${2:-}"
      DB_URL="$2"
      shift 2
      ;;
    --db-username)
      require_value "$1" "${2:-}"
      DB_USERNAME="$2"
      shift 2
      ;;
    --app-dir)
      require_value "$1" "${2:-}"
      APP_DIR="$2"
      shift 2
      ;;
    --data-dir)
      require_value "$1" "${2:-}"
      DATA_DIR="$2"
      shift 2
      ;;
    --port)
      require_value "$1" "${2:-}"
      PORT="$2"
      shift 2
      ;;
    --bind-address)
      require_value "$1" "${2:-}"
      BIND_ADDRESS="$2"
      shift 2
      ;;
    --user)
      require_value "$1" "${2:-}"
      APP_USER="$2"
      shift 2
      ;;
    --install-jre)
      INSTALL_JRE=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

[[ "${EUID}" -eq 0 ]] || fail "Run this installer with sudo or as root."
[[ -n "$ARTIFACT" ]] || fail "--artifact is required."
[[ -f "$ARTIFACT" ]] || fail "Artifact does not exist: $ARTIFACT"
[[ -n "$DB_URL" ]] || fail "--db-url is required."
[[ -n "$DB_USERNAME" ]] || fail "--db-username is required."
[[ "$PORT" =~ ^[0-9]{1,5}$ ]] && (( PORT >= 1 && PORT <= 65535 )) || fail "Invalid port: $PORT"

java_major() {
  local version major
  command -v java >/dev/null 2>&1 || return 1
  version="$(java -version 2>&1 | awk -F '"' '/version/ { print $2; exit }')"
  major="${version%%.*}"
  if [[ "$major" == "1" ]]; then
    major="${version#1.}"
    major="${major%%.*}"
  fi
  [[ "$major" =~ ^[0-9]+$ ]] || return 1
  printf '%s\n' "$major"
}

install_jre() {
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y openjdk-17-jre-headless
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y java-17-openjdk-headless
  elif command -v yum >/dev/null 2>&1; then
    yum install -y java-17-openjdk-headless
  else
    fail "No supported package manager found. Install a Java 17 JRE manually."
  fi
}

current_java_major="$(java_major || true)"
if [[ -z "$current_java_major" || "$current_java_major" -lt 17 ]]; then
  if [[ "$INSTALL_JRE" -eq 1 ]]; then
    install_jre
    current_java_major="$(java_major || true)"
  fi
  [[ -n "$current_java_major" && "$current_java_major" -ge 17 ]] || \
    fail "Java 17 or newer is required. Re-run with --install-jre or install it manually."
fi

if [[ -z "${EXAMXX_DB_PASSWORD:-}" ]]; then
  read -r -s -p "MySQL password for ${DB_USERNAME}: " EXAMXX_DB_PASSWORD
  echo
fi
[[ -n "${EXAMXX_DB_PASSWORD:-}" ]] || fail "The database password cannot be empty."

for value in "$DB_URL" "$DB_USERNAME" "$EXAMXX_DB_PASSWORD" "$APP_DIR" "$DATA_DIR" "$CONFIG_DIR"; do
  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || fail "Newlines are not supported in configuration values."
done

quote_env_value() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$APP_DIR" --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

install -d -o "$APP_USER" -g "$APP_USER" -m 0750 "$APP_DIR" "$DATA_DIR"
install -d -o root -g "$APP_USER" -m 0750 "$CONFIG_DIR"

if [[ -f "$APP_DIR/examxx.jar" ]]; then
  cp -f "$APP_DIR/examxx.jar" "$APP_DIR/examxx.jar.previous"
  chown "$APP_USER:$APP_USER" "$APP_DIR/examxx.jar.previous"
fi
install -o "$APP_USER" -g "$APP_USER" -m 0640 "$ARTIFACT" "$APP_DIR/examxx.jar"

umask 077
{
  printf 'EXAMXX_DB_URL=%s\n' "$(quote_env_value "$DB_URL")"
  printf 'EXAMXX_DB_USERNAME=%s\n' "$(quote_env_value "$DB_USERNAME")"
  printf 'EXAMXX_DB_PASSWORD=%s\n' "$(quote_env_value "$EXAMXX_DB_PASSWORD")"
  printf 'EXAMXX_UPLOAD_DIR=%s\n' "$(quote_env_value "$DATA_DIR")"
  printf 'SERVER_PORT=%s\n' "$PORT"
  printf 'SERVER_ADDRESS=%s\n' "$(quote_env_value "$BIND_ADDRESS")"
} > "$CONFIG_DIR/examxx.env"
chown root:"$APP_USER" "$CONFIG_DIR/examxx.env"
chmod 0640 "$CONFIG_DIR/examxx.env"

JAVA_BIN="$(readlink -f "$(command -v java)")"
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<UNIT
[Unit]
Description=Examxx Spring Boot application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${CONFIG_DIR}/examxx.env
ExecStart=${JAVA_BIN} -jar ${APP_DIR}/examxx.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
UMask=0027
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
ReadWritePaths=${DATA_DIR}
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME" || {
  journalctl -u "$SERVICE_NAME" -n 100 --no-pager >&2 || true
  fail "Service failed to start."
}

if command -v curl >/dev/null 2>&1; then
  for _ in {1..15}; do
    if curl --fail --silent --show-error --max-time 2 "http://127.0.0.1:${PORT}/app/login" >/dev/null; then
      echo "Deployment succeeded. Local health check passed: /app/login"
      exit 0
    fi
    sleep 1
  done
  journalctl -u "$SERVICE_NAME" -n 100 --no-pager >&2 || true
  fail "Service is running but /app/login did not respond successfully."
fi

echo "Deployment succeeded. Service: ${SERVICE_NAME}; local URL: http://127.0.0.1:${PORT}/app/login"
