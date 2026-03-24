#!/bin/sh
set -e
# Railway encaminha para $PORT; o nginx tem de escutar exatamente aí ou vem 502.
PORT="${PORT:-80}"
PORT=$(printf '%s' "$PORT" | tr -cd '0-9')
[ -z "$PORT" ] && PORT=80

CFG="/etc/nginx/conf.d/default.conf"
# Substitui "listen 80;", "listen  8080 ;", tabs, etc. (BusyBox awk no Alpine)
awk -v p="$PORT" '
  {
    gsub(/listen[ \t]+[0-9][0-9]*[ \t]*;/, "listen " p ";")
    print
  }
' "$CFG" > "$CFG.tmp" && mv "$CFG.tmp" "$CFG"

echo "[entrypoint] nginx listen port=${PORT}"
exec nginx -g "daemon off;"
