#!/bin/sh
set -e
# Railway define PORT dinamicamente; o default.conf usa listen 80.
if [ -n "$PORT" ]; then
  sed -i "s/listen 80;/listen ${PORT};/" /etc/nginx/conf.d/default.conf
fi
exec nginx -g "daemon off;"
