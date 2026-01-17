# Casa Controller

A command-line tool for managing Docker Compose services with automatic Caddyfile generation.

## Installation

```bash
./build.sh
```

## Commands

### Configuration
- `casa config` - Generate Caddyfile from service configurations

### Service Management
- `casa up` - Start all configured services
- `casa up SERVICE_NAME` - Start specific service
- `casa down` - Stop all configured services  
- `casa down SERVICE_NAME` - Stop specific service
- `casa restart` - Restart all configured services
- `casa restart SERVICE_NAME` - Restart specific service
- `casa pull` - Pull latest images for all configured services
- `casa pull SERVICE_NAME` - Pull latest image for specific service

### Service Installation
- `casa install` - Interactive service selection (add to config.yaml)
- `casa install SERVICE_NAME` - Install specific service to config.yaml
- `casa uninstall` - Interactive service removal (remove from config.yaml)
- `casa uninstall SERVICE_NAME` - Remove specific service from config.yaml

### Monitoring
- `casa status` - Show status of all configured services
- `casa status SERVICE_NAME` - Show status of specific service
- `casa log SERVICE_NAME` - View live logs for specific service

### Maintenance
- `casa reset SERVICE_NAME` - Stop service, remove config directory, and restart (useful for re-authentication)

## How It Works

1. **Services** are defined in `services/SERVICE_NAME/compose.yml` with labels:
   ```yaml
   labels:
     url: "https://service.{{ domain }}"
     title: "Service Name"
     category: "media"
     color: "blue"
   ```

2. **Configuration** is stored in `config.yaml` with selected services

3. **Caddyfile** is automatically generated from service labels for reverse proxy

## Service Structure

Each service directory should contain:
- `compose.yml` - Docker Compose configuration with proper labels
- Service must be connected to `caddy` network for reverse proxy

## Examples

```bash
# Interactive service selection
casa install

# Install specific service
casa install portainer

# Remove specific service
casa uninstall portainer

# Start all services
casa up

# Check service status
casa status

# View logs
casa log portainer

# Reset service (e.g., for tailscale re-authentication)
casa reset tailscale
```
