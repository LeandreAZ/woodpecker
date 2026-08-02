#!/bin/sh
set -eu

cd /app

if [ ! -x node_modules/.bin/vite ]; then
  echo "[frontend] Installing npm dependencies..."
  npm install
fi

exec npm run dev -- --host 0.0.0.0
