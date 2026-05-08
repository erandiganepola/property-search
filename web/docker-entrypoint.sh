#!/bin/sh
# Replace build-time placeholders in the bundled assets with values from the
# container env, then exec the CMD (serve).
set -e

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
