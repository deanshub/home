import prompts from "prompts";
import { readFileSync } from "fs";
import { parse, stringify } from "yaml";

type ServiceInYaml = {
  name: string;
  label: string;
  url?: string;
  color?: string;
  category?: string;
};

async function main() {
  const yamlContent = readFileSync("../../services/services.yaml", "utf8");
  const data = parse(yamlContent) as { services: ServiceInYaml[] };

  // Get domain from user
  const domainResult = await prompts({
    type: "text",
    name: "domain",
    message: "Enter your domain",
    initial: "home.shubapp.com"
  });

  const result = await prompts({
    type: "multiselect",
    name: "services",
    message: "Select services to activate",
    choices: data.services.map((service: any) => ({
      title: service.label,
      value: service,
      selected: true,
    })),
  });

  const servicesToActivate: ServiceInYaml[] = result.services.map(
    (service: ServiceInYaml) => ({
      name: service.name,
      label: service.label,
      url: service.url?.replace("{{ domain }}", domainResult.domain),
      color: service.color,
      category: service.category,
    })
  );

  const config = {
    domain: domainResult.domain,
    services: servicesToActivate
  };

  console.log(stringify(config));
}

main();
