#!/bin/bash

  # Movies: check if downloads exist in movies library
  for dir in /media/external/library/downloads/*/; do
    basename=$(basename "$dir")
    name=$(echo "$basename" | tr '.' ' ' | awk '{print $1, $2}')
    if [ -n "$name" ] && [ "$name" != " " ]; then
      found=$(find /media/external/library/movies -maxdepth 1 -iname "*${name}*" 2>/dev/null)
      if [ -n "$found" ]; then
        echo "DUP: $basename"
        echo "  → $found"
        echo "  rm -rf \"$dir\""
        echo ""
      fi
    fi
  done

  # TV: check if download folders match TV shows
  for dir in /media/external/library/downloads/*/; do
    basename=$(basename "$dir")
    name=$(echo "$basename" | grep -oP '^[A-Za-z0-9\.]+(?=\.S\d+)' | tr '.' ' ')
    if [ -n "$name" ]; then
      found=$(find /media/external/library/tv -maxdepth 1 -iname "*${name}*" 2>/dev/null)
      if [ -n "$found" ]; then
        echo "DUP: $basename"
        echo "  → $found"
        echo "  rm -rf \"$dir\""
        echo ""
      fi
    fi
  done

