#!/usr/bin/env bash
set -e

# Wait for DB/Redis if using hostnames
if [ -n "$REDIS_URL" ]; then
  echo "Redis: $REDIS_URL"
fi

python manage.py migrate --noinput
# Start ASGI server (Daphne)
exec daphne -b 0.0.0.0 -p 8000 djchat.asgi:application