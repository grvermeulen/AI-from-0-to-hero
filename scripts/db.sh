#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

write_env() {
  local url="$1"
  if [ -f "$ENV_FILE" ]; then
    if grep -q '^DATABASE_URL=' "$ENV_FILE"; then
      sed -i '' -e "s#^DATABASE_URL=.*#DATABASE_URL=\"$url\"#" "$ENV_FILE" 2>/dev/null || \
      sed -i -e "s#^DATABASE_URL=.*#DATABASE_URL=\"$url\"#" "$ENV_FILE"
    else
      printf '\nDATABASE_URL="%s"\n' "$url" >> "$ENV_FILE"
    fi
  else
    printf 'DATABASE_URL="%s"\n' "$url" > "$ENV_FILE"
  fi
  echo "[db] Wrote DATABASE_URL to .env"
}

case "${1:-}" in
  docker-start)
    if docker ps -a --format '{{.Names}}' | grep -q '^qa-pg$'; then
      echo "[db] Starting existing container qa-pg" && docker start qa-pg >/dev/null
    else
      echo "[db] Creating and starting Postgres container qa-pg"
      docker run --name qa-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=qa_training -p 5432:5432 -d postgres:15-alpine >/dev/null
    fi
    echo "[db] Postgres ready on postgresql://postgres:postgres@localhost:5432/qa_training"
    ;;
  docker-stop)
    echo "[db] Stopping container qa-pg (if running)"
    docker stop qa-pg >/dev/null 2>&1 || true
    ;;
  env-docker)
    write_env "postgresql://postgres:postgres@localhost:5432/qa_training?schema=public"
    ;;
  env-url)
    URL="${DB_URL:-}"
    if [ -z "$URL" ]; then
      echo "[db] Set DB_URL env with your database url, e.g.:"
      echo "      DB_URL=postgresql://user:pass@host:5432/db?schema=public pnpm db:env:url"
      exit 1
    fi
    write_env "$URL"
    ;;
  show)
    echo "[db] Current .env DATABASE_URL:"
    if [ -f "$ENV_FILE" ]; then
      sed -n 's/^DATABASE_URL=//p' "$ENV_FILE"
    else
      echo "(no .env file)"
    fi
    ;;
  *)
    echo "Usage: $0 {docker-start|docker-stop|env-docker|env-url|show}"
    exit 1
    ;;
esac


