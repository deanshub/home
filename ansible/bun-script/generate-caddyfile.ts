import { readFile, writeFile, readdir } from "fs/promises";
import { parse } from "yaml";
import { existsSync } from "fs";
import { config as loadEnv } from "dotenv";

interface CasaConfig {
  static_ip: string;
  username: string;
  gateway_ip: string;
  domain: string;
  services: ActiveService[];
}

interface ActiveService {
  name: string;
  label: string;
  category: string;
  url?: string;
  color?: string;
}

interface ServiceInfo {
  name: string;
  url: string;
  title: string;
  category: string;
  target: string;
}

// Static proxy mappings for services that need extra configuration
const EXTRA_CONFIG: Record<string, { config?: string }> = {
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

async function getServiceInfo(
  serviceName: string,
  staticIp: string
): Promise<ServiceInfo | null> {
  const composePath = `../../services/${serviceName}/compose.yml`;
  if (!existsSync(composePath)) {
    return null;
  }
  const composeContent = await readFile(composePath, "utf8");
  const compose = parse(composeContent);

  // Get the first service in the compose file
  const services = compose.services || {};
  const serviceKey = Object.keys(services)[0];
  const service = services[serviceKey];

  const labels = service.labels || {};

  // Skip services without URL labels (infrastructure services)
  if (!labels.url) {
    return null;
  }

  let target = `${serviceName}:80`; // fallback

  // Check for explicit target override in labels
  if (labels.target) {
    target = labels.target;
  } else if (!service.ports) {
    return null;
  } else {
    // Extract port from ports array (format: "8080:80" or "8080:80/tcp" or 8080)
    const portMapping = service.ports[0];
    let port;

    if (typeof portMapping === "string") {
      // Use internal port (right side of mapping), remove protocol suffix
      const parts = portMapping.split(":");
      port = parts[0].split("/")[0]; // Remove /tcp or /udp suffix
    } else {
      port = portMapping;
    }

    if (!port) {
      return null;
    }

    // Check if service uses host networking
    if (service.network_mode === "host") {
      target = `http://${staticIp}:${port}`;
    } else {
      target = `${serviceName}:${port}`;
    }
  }

  return {
    name: serviceName,
    url: labels.url,
    title: labels.title,
    category: labels.category,
    target,
  };
}

// async function getAllServices(staticIp: string) {
//   const servicesDir = "../../services";
//   const serviceDirs = (
//     await readdir(servicesDir, { withFileTypes: true })
//   ).sort();

//   const services: ServiceInfo[] = [];
//   for (const dirent of serviceDirs) {
//     if (dirent.isDirectory()) {
//       const serviceInfo = await getServiceInfo(dirent.name, staticIp);
//       if (serviceInfo) {
//         services.push(serviceInfo);
//       }
//     }
//   }

//   return services;
// }

async function generateCaddyfile() {
  const yamlContent = await readFile("../../config.yaml", "utf8");
  const config = parse(yamlContent) as CasaConfig;

  const domain = config.domain;
  // const allServices = await getAllServices(config.static_ip);

  // Check for DNS provider tokens
  let tlsConfig = "";
  const envPath = "../../services/caddy/.env";
  if (existsSync(envPath)) {
    const env = loadEnv({ path: envPath }).parsed || {};

    if (env.CF_API_TOKEN && env.CF_API_TOKEN.trim()) {
      tlsConfig = `tls {
    dns cloudflare {env.CF_API_TOKEN}
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
    if (!service.url) {
      continue;
    }
    const subdomain = service.url.split("//")[1].split(".")[0];
    const extraConfig = EXTRA_CONFIG[service.name]?.config ?? "";
    const serviceInfo = await getServiceInfo(service.name, config.static_ip);
    if (!serviceInfo?.target) {
      continue;
    }

    caddyfile += `  @${service.name} host ${subdomain}.${domain}
  handle @${service.name} {
    reverse_proxy ${serviceInfo.target}
    ${extraConfig}
  }
`;
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

  @ai host ai.${domain}
  handle @ai {
    reverse_proxy http://192.168.31.153:11434
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
