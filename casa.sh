#!/bin/bash
set -e

compose_dirs=(
  "home-assistant"
  "downloader"
  "friday"
  "shopping-bot"
  "gpt-bot"
  "caddy"
  "tailscale"
  "mosquitto"
  "filebrowser"
  "transmission"
  "jackett"
  "flaresolverr"
  "sonarr"
  "radarr"
  "bazarr"
  "jellyfin"
  "watchtower"
)

for dir in "${compose_dirs[@]}"; do
  echo "🚀 Processing $dir..."
  if ! docker compose -f "$dir/compose.yml" "$@"; then
    echo "❌ Failed on $dir"
    exit 1
  fi
  echo "✅ $dir completed"
done

echo "🎉 All services processed successfully!"
