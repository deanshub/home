#!/bin/bash
set -e

while IFS= read -r dir; do
  echo "🚀 Processing $dir..."
  if ! docker compose -f "$dir/compose.yml" "$@"; then
    echo "❌ Failed on $dir"
    exit 1
  fi
  echo "✅ $dir completed"
done < services.txt

echo "🎉 All services processed successfully!"
