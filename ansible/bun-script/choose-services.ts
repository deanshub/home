import prompts from "prompts";
import { readFileSync } from "fs";
import { parse, stringify } from "yaml";

async function main() {
  const yamlContent = readFileSync("../../services.yaml", "utf8");
  const data = parse(yamlContent);

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

  const servicesToActivate = stringify(result);

  console.log(servicesToActivate);
}

main();
