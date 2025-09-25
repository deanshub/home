#!/bin/bash
set -e

services=$(yq '.services[]' services.yaml)

while IFS= read -r dir; do
  echo "🚀 Processing $dir..."
  if ! docker compose -f "$dir/compose.yml" "$@"; then
    echo "❌ Failed on $dir"
    exit 1
  fi
  echo "✅ $dir completed"
done <<< "$services"

echo "🎉 All services processed successfully!"
