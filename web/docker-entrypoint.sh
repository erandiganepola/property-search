#!/bin/sh
# Replace build-time placeholders in the bundled assets with values from the
# container env (or a mounted .env file), then exec the CMD (serve).
set -e

# Some hosts (e.g. WSO2 Choreo Web Application components) only expose runtime
# config via a file mount. Try the configured path; if it's a regular file,
# source it directly. If it's a directory (some K8s ConfigMap mount shapes
# materialise the path as a dir containing the file), source any *.env file
# inside it. Quietly skip when nothing is found — vars may be coming from
# the regular process env instead.
load_env() {
  if [ -f "$1" ] && [ -r "$1" ]; then
    echo "[replace-env] Loading env from $1"
    set -a
    # shellcheck disable=SC1090
    . "$1"
    set +a
    return 0
  fi
  return 1
}

ENV_FILE="${ENV_FILE:-/app/.env}"
if [ -d "$ENV_FILE" ]; then
  for f in "$ENV_FILE"/*; do
    load_env "$f" && break
  done
else
  load_env "$ENV_FILE" || true
fi

DIR=/app/dist
PLACEHOLDERS="VITE_ASGARDEO_CLIENT_ID VITE_ASGARDEO_BASE_URL VITE_ASGARDEO_SIGN_IN_REDIRECT_URL VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL VITE_AGENT_SERVICE_URL"

for name in $PLACEHOLDERS; do
  value=$(printenv "$name" 2>/dev/null || true)
  if [ -n "$value" ]; then
    echo "[replace-env] Substituting __${name}__"
    # `|` as sed delimiter avoids escaping `/` in URLs.
    find "$DIR" -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' \) \
      -exec sed -i "s|__${name}__|${value}|g" {} +
  else
    echo "[replace-env] $name unset, leaving placeholder"
  fi
done

exec "$@"
