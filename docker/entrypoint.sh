#!/bin/bash
set -e

echo "=== Starting QuantTrade Platform Container ==="
echo "Port: ${PORT:-3000}"
echo "Storage: ${STORAGE_PATH:-/app/data/storage}"
echo "Environment: ${ENVIRONMENT:-production}"

# Initialize local directories
mkdir -p /app/data/storage /app/data/features /app/logs

# If PORT is set to something other than 3000, substitute in nginx.conf
if [ -n "$PORT" ] && [ "$PORT" != "3000" ]; then
    sed -i "s/listen 3000;/listen $PORT;/g" /etc/nginx/nginx.conf
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
