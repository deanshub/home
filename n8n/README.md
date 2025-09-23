# N8N Setup

Self-hosted n8n workflow automation platform with Caddy reverse proxy.

## Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Update domain in `.env` and `docker-compose.yml`

3. Create Caddy network:
```bash
docker network create caddy
```

4. Start services:
```bash
docker-compose up -d
```

## Access

- Web interface: https://n8n.yourdomain.com
- Initial setup will prompt for admin user creation

## Data

- Workflows and data stored in `n8n_data` Docker volume
- Logs available in `/var/log/caddy/n8n.log`

## Backup

```bash
docker run --rm -v n8n_n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .
```
