#!/bin/bash

# Create Caddy network if it doesn't exist
docker network create caddy 2>/dev/null || true

# Start n8n
docker-compose up -d

echo "N8N started successfully!"
echo "Access at: https://n8n.yourdomain.com"
