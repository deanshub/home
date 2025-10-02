# Home Server Management

A complete Docker-based home server setup with automated service management and reverse proxy configuration.

## Quick Start

1. **Clone and setup**

   ```bash
   git clone <repo>
   cd home
   ```

2. **Build casa controller**

   ```bash
   cd casa-controller
   ./build.sh
   cd ..
   ```

3. **Install casa globally (optional)**

   ```bash
   sudo ln -s $(pwd)/casa /usr/local/bin/casa
   ```

4. **Configure services**

   ```bash
   casa install  # Interactive service selection
   ```

5. **Deploy with Ansible**
   ```bash
   cd ansible
   ansible-playbook -i inventory.yml playbook.yml
   ```

## Casa Controller

Command-line tool for managing Docker Compose services:

```bash
# Service management
casa up                    # Start all services
casa down                  # Stop all services
casa restart               # Restart all services
casa status                # Check service status

# Individual services
casa up jellyfin           # Start specific service
casa log portainer         # View service logs

# Configuration
casa install               # Interactive service selection
casa config                # Generate Caddyfile
```

## Architecture

- **Services**: Docker Compose services in `services/` directory
- **Reverse Proxy**: Caddy with automatic HTTPS and DNS challenge
- **Configuration**: Centralized in `config.yaml`
- **Automation**: Ansible playbooks for deployment
- **Management**: Casa controller for service operations

## Service Structure

Each service in `services/SERVICE_NAME/compose.yml`:

```yaml
networks:
  caddy:
    external: true

services:
  service:
    image: example/service
    networks:
      - caddy
    labels:
      url: "https://service.{{ domain }}"
      title: "Service Name"
      category: "media"
      color: "blue"
    ports:
      - 8080:80
```

## Features

- **Automatic SSL** with DNS challenge (Cloudflare/Vercel)
- **Service Discovery** from compose file labels
- **Interactive Management** with casa controller
- **Status Monitoring** and log viewing
- **Automated Updates** with watchtower
- **Persistent Storage** on external media

## Available Services

### Infrastructure
- **Caddy** - Reverse proxy with automatic HTTPS
- **Tailscale** - VPN mesh networking
- **Mosquitto** - MQTT message broker
- **Watchtower** - Automatic container updates
- **Portainer** - Docker management interface

### Media Management
- **Jellyfin** - Media server and streaming
- **Sonarr** - TV series management
- **Radarr** - Movie management
- **Lidarr** - Music management
- **Bazarr** - Subtitle management
- **Prowlarr** - Indexer management
- **Flaresolverr** - Cloudflare bypass proxy
- **Transmission** - BitTorrent client
- **Filebrowser** - Web-based file manager

### Smart Home
- **Home Assistant** - Home automation platform

### Automation & Bots
- **n8n** - Workflow automation
- **Downloader** - Telegram download bot
- **Friday** - Personal assistant bot
- **Shopping Bot** - Shopping list manager bot
- **GPT Bot** - AI chat bot
- **Telegram Bot API** - Local Telegram Bot API server

### Network & Security
- **Pi-hole** - Network-wide ad blocker and DNS server

## Configuration

Edit `config.yaml` or use `casa install` for interactive setup:

```yaml
static_ip: "192.168.31.153"
username: "dean"
gateway_ip: "192.168.31.1"
domain: "home.shubapp.com"
services:
  - name: jellyfin
  - name: portainer
```

## Deployment

The Ansible playbook handles:

- Docker and Docker Compose installation
- Network creation
- Service deployment
- Caddy configuration
- System updates
