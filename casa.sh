#!/bin/bash
docker compose \
  -f home-assistant/compose.yml \
  -f downloader/compose.yml \
  -f friday/compose.yml \
  -f shopping-bot/compose.yml \
  -f gpt-bot/compose.yml \
  -f caddy/compose.yml \
  -f tailscale/compose.yml \
  -f mosquitto/compose.yml \
  -f filebrowser/compose.yml \
  -f transmission/compose.yml \
  -f jackett/compose.yml \
  -f flaresolverr/compose.yml \
  -f sonarr/compose.yml \
  -f radarr/compose.yml \
  -f bazarr/compose.yml \
  -f jellyfin/compose.yml \
  -f watchtower/compose.yml \
  "$@"
