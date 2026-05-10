#!/usr/bin/env bash
set -e

ENV_FILE="$(dirname "$0")/../.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

echo "Paste your new Neon connection string (input is hidden), then press Return:"
read -s NEW_URL
echo

if [[ ! "$NEW_URL" =~ ^postgresql:// ]]; then
  echo "❌ That doesn't look like a postgres URL (must start with postgresql://)" >&2
  exit 1
fi

if ! echo "$NEW_URL" | grep -q "eu-west-2"; then
  echo "⚠️  Warning: URL doesn't contain 'eu-west-2'. Continue anyway? (y/N)"
  read -r CONFIRM
  [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ] && exit 1
fi

# Replace any existing DATABASE_URL_NEW line
if grep -q "^DATABASE_URL_NEW=" "$ENV_FILE"; then
  # macOS sed needs '' after -i
  sed -i '' "s|^DATABASE_URL_NEW=.*|DATABASE_URL_NEW=${NEW_URL}|" "$ENV_FILE"
  echo "✅ Updated DATABASE_URL_NEW in .env.local"
else
  echo "" >> "$ENV_FILE"
  echo "DATABASE_URL_NEW=${NEW_URL}" >> "$ENV_FILE"
  echo "✅ Added DATABASE_URL_NEW to .env.local"
fi

# Mask for display
MASKED=$(echo "$NEW_URL" | sed -E 's|:[^@]+@|:***@|')
echo "   $MASKED"
