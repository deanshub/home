export async function callHAService(domain: string, service: string, entityId: string): Promise<void> {
  await fetch(`https://ha.home.shubapp.com/api/services/${domain}/${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HA_TOKEN}`,
    },
    body: JSON.stringify({ entity_id: entityId }),
  });
}
