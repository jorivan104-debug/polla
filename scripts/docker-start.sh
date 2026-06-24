#!/bin/sh
set -e

PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"

echo "==> Polla Mundialista starting on ${HOSTNAME}:${PORT}"

mkdir -p /app/data

if [ -n "$DATABASE_URL" ] && command -v npx >/dev/null 2>&1; then
  echo "==> Running prisma db push..."
  npx prisma db push --accept-data-loss 2>/dev/null || echo "==> prisma db push skipped"
fi

if [ -f /app/server.js ]; then
  echo "==> Starting Next.js standalone (server.js)..."
  export PORT HOSTNAME
  exec node /app/server.js
fi

echo "==> Starting Next.js (next start)..."
exec npx next start -H "$HOSTNAME" -p "$PORT"
