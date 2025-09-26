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

  // Read domain from stdin
  const domain = (await Bun.stdin.text()).trim();

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
      url: service.url?.replace("{{ domain }}", domain),
      color: service.color,
      category: service.category,
    })
  );

  const config = {
    services: servicesToActivate
  };

  console.log(stringify(config));
}

main();
