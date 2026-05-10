#!/usr/bin/env bash
# One-shot: sets the four launch env vars in Vercel for production+preview+development.
# Idempotent — removes any existing value first, then adds.
set -e

cd "$(dirname "$0")/.."

DATA_ENCRYPTION_KEY="LUT3tWkoHIwcQP3ztL4WghzBFa9J3aGjuwng4ooQiDA="
APP_URL="https://getrealhealthpgd.co.uk"
ADMIN_NOTIFY_EMAIL="info@getrealhealthpgd.co.uk"
GOCARDLESS_ENVIRONMENT="sandbox"

set_var () {
  local NAME="$1"; local VALUE="$2"
  for ENV in production preview development; do
    yes | npx -y vercel@latest env rm "$NAME" "$ENV" 2>&1 | tail -1 || true
    printf '%s' "$VALUE" | npx -y vercel@latest env add "$NAME" "$ENV" '' 2>&1 | tail -1
  done
  echo "  → $NAME set in production+preview+development"
  echo
}

set_var DATA_ENCRYPTION_KEY    "$DATA_ENCRYPTION_KEY"
set_var APP_URL                "$APP_URL"
set_var ADMIN_NOTIFY_EMAIL     "$ADMIN_NOTIFY_EMAIL"
set_var GOCARDLESS_ENVIRONMENT "$GOCARDLESS_ENVIRONMENT"

echo "✅ Four 'no-secret' env vars set."
echo "Still need from GoCardless dashboard:"
echo "  • GOCARDLESS_ACCESS_TOKEN"
echo "  • GOCARDLESS_WEBHOOK_SECRET"
