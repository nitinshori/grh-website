#!/usr/bin/env bash
# One-shot: replace DATABASE_URL in Vercel with the eu-west-2 value, then redeploy.
set -e
cd "$(dirname "$0")/.."

NEW_URL=$(grep "^DATABASE_URL_NEW=" .env.local | sed 's/^DATABASE_URL_NEW=//')
if [ -z "$NEW_URL" ]; then echo "❌ DATABASE_URL_NEW missing"; exit 1; fi
echo "Target tail: ...${NEW_URL: -50}"
echo

echo "=== Current DATABASE_URL state ==="
npx -y vercel@latest env ls 2>/dev/null | grep -i DATABASE_URL || true
echo

# Preview: missing — add only (no branch prompt because we pipe two newlines)
echo "=== preview (add) ==="
printf '%s\n\n' "$NEW_URL" | npx -y vercel@latest env add DATABASE_URL preview || true
echo

echo "=== Final state ==="
npx -y vercel@latest env ls 2>/dev/null | grep -i DATABASE_URL || true
echo

echo "=== Triggering production redeploy ==="
npx -y vercel@latest deploy --prod
