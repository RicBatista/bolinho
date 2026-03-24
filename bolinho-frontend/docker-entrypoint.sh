#!/bin/sh
set -e
# Railway injeta PORT — o proxy público fala com essa porta. Se o nginx ficar em 80, vem 502.
PORT="${PORT:-80}"
CFG="/etc/nginx/conf.d/default.conf"
# BusyBox sed (Alpine): compatível com "listen 80;" ou "listen  80 ;"
sed -i "s/listen[[:space:]][[:space:]]*[0-9][0-9]*[[:space:]]*;/listen ${PORT};/" "$CFG"
exec nginx -g "daemon off;"
