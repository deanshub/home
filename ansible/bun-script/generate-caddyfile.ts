import { readFile, writeFile } from "fs/promises";
import { parse } from "yaml";
import { existsSync } from "fs";
import { config as loadEnv } from "dotenv";

// Static proxy mappings for services that need extra configuration
const PROXY_TARGETS: Record<string, { config?: string }> = {
  n8n: {
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

async function getServiceTarget(
  serviceName: string,
  staticIp: string
): Promise<string | null> {
  const composePath = `../../services/${serviceName}/compose.yml`;
  const composeContent = await readFile(composePath, "utf8");
  const compose = parse(composeContent);

  // Get the first service in the compose file
  const services = compose.services || {};
  const serviceKey = Object.keys(services)[0];
  const service = services[serviceKey];

  if (!service?.ports) {
    return null;
  }

  // Extract port from ports array (format: "8080:80" or 8080)
  const portMapping = service.ports[0];
  let port;

  if (typeof portMapping === "string") {
    port = portMapping.split(":")[0];
  } else {
    port = portMapping;
  }

  // Check if service uses host networking
  if (service.network_mode === "host") {
    return `http://${staticIp}:${port}`;
  }

  return `${serviceName}:${port}`;
}

async function generateCaddyfile() {
  const yamlContent = await readFile("../../config.yaml", "utf8");
  const config = parse(yamlContent);

  const domain = config.domain;

  // Check for DNS provider tokens
  let tlsConfig = "";
  const envPath = "../../services/caddy/.env";
  if (existsSync(envPath)) {
    const env = loadEnv({ path: envPath }).parsed || {};

    if (env.CF_API_TOKEN && env.CF_API_TOKEN.trim()) {
      tlsConfig = `tls {
    dns cloudflare {env.CF_API_TOKEN}
  }`;
    } else if (env.VERCEL_API_TOKEN && env.VERCEL_API_TOKEN.trim()) {
      tlsConfig = `tls {
    dns vercel {env.VERCEL_API_TOKEN}
  }`;
    }
  }

  // Start Caddyfile
  let caddyfile = `{
    order cgi before respond
}

*.${domain}, ${domain} {
  ${tlsConfig}

  @test host test.${domain}
  handle @test {
    respond "test success!"
  }

`;

  // Add service handlers
  for (const service of config.services) {
    if (service.url) {
      const subdomain = service.url.split("//")[1].split(".")[0];
      const target = await getServiceTarget(service.name, config.static_ip);
      if (!target) {
        continue;
      }
      const extraConfig = PROXY_TARGETS[service.name]?.config || "";

      caddyfile += `  @${service.name} host ${subdomain}.${domain}
  handle @${service.name} {
    reverse_proxy ${target}
    ${extraConfig ?? ""}
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
