#!/data/data/com.termux/files/usr/bin/sh
# Start from the app folder: sh start-termux.sh
cd "$(dirname "$0")" || exit 1
printf 'Martyns Law Readiness Check: open http://127.0.0.1:8765 in your browser.\n'
exec python -m http.server 8765 --bind 127.0.0.1
