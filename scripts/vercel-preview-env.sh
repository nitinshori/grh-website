#!/usr/bin/env bash
# Adds DATABASE_URL to Vercel's "preview" environment (no Git branch filter)
# without falling into the interactive "which branch?" prompt.
set -e
cd "$(dirname "$0")/.."

NEW_URL=$(grep "^DATABASE_URL_NEW=" .env.local | sed 's/^DATABASE_URL_NEW=//')
if [ -z "$NEW_URL" ]; then echo "❌ DATABASE_URL_NEW missing"; exit 1; fi

echo "Before:"
npx -y vercel@latest env ls 2>/dev/null | grep -i DATABASE_URL || true
echo

# Try the documented positional form first: env add NAME ENV BRANCH
# Empty branch = "all Preview branches"
echo "Attempting: env add DATABASE_URL preview ''"
printf '%s' "$NEW_URL" | npx -y vercel@latest env add DATABASE_URL preview '' 2>&1 || true
echo

echo "After:"
npx -y vercel@latest env ls 2>/dev/null | grep -i DATABASE_URL || true
