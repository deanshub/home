import { readFile, writeFile } from "fs/promises";
import { parse } from "yaml";

// Static proxy mappings
const PROXY_TARGETS: Record<string, { target: string; config?: string }> = {
  homeassistant: { target: "http://192.168.31.153:8123" },
  sonarr: { target: "sonarr:8989" },
  radarr: { target: "radarr:7878" },
  prowlarr: { target: "prowlarr:9696" },
  flaresolverr: { target: "flaresolverr:8191" },
  bazarr: { target: "bazarr:6767" },
  jellyfin: { target: "http://192.168.31.153:8096" },
  transmission: { target: "transmission:9091" },
  filebrowser: { target: "filebrowser:80" },
  n8n: {
    target: "n8n:5678",
    config: `header {
      Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
      X-Content-Type-Options "nosniff"
      X-Frame-Options "DENY"
      X-XSS-Protection "1; mode=block"
      Referrer-Policy "strict-origin-when-cross-origin"
    }
    encode gzip`,
  },
};

async function generateCaddyfile() {
  const yamlContent = await readFile("../../config.yaml", "utf8");
  const config = parse(yamlContent);

  const domain = config.domain;

  // Start Caddyfile
  let caddyfile = `{
    order cgi before respond
}

*.${domain}, ${domain} {
  tls {
    dns cloudflare {env.CF_API_TOKEN}
  }

  @test host test.${domain}
  handle @test {
    respond "test success!"
  }

`;

  // Add service handlers
  for (const service of config.services) {
    if (service.url && PROXY_TARGETS[service.name]) {
      const subdomain = service.url.split("//")[1].split(".")[0];
      const proxyConfig = PROXY_TARGETS[service.name];

      caddyfile += `  @${service.name} host ${subdomain}.${domain}
  handle @${service.name} {
    reverse_proxy ${proxyConfig.target}`;

      if (proxyConfig.config) {
        caddyfile += `
    ${proxyConfig.config}`;
      }

      caddyfile += `
  }

`;
    }
  }

  // Add static handlers
  caddyfile += `  @caddy host caddy.${domain}
  handle @caddy {
    request_header Host "localhost:2019"
    reverse_proxy http://localhost:2019
  }

  @apps host apps.${domain}
  handle @apps {
    root /* /apps/
    @html {
        file {
            try_files {path} {file} {path}/index.html {file}/index.html /index.html
        }
    }
    route @html {
        file_server browse
    }

    cgi /* /apps/{file}/dist/{file}
  }

  @home host ${domain}
  handle @home {
    root * /srv
    templates
    file_server
  }

  handle {
    respond "Hello, world!"
  }
}`;

  await writeFile("../../services/caddy/Caddyfile", caddyfile);
  console.log("Caddyfile generated successfully!");
}

generateCaddyfile();
