async function callDoorService(service: string): Promise<void> {
  await fetch(`https://ha.home.shubapp.com/api/services/lock/${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HA_TOKEN}`,
    },
    body: JSON.stringify({ entity_id: "lock.main" }),
  });
}

export async function open(): Promise<void> {
  await callDoorService("open");
}

export async function close(): Promise<void> {
  await callDoorService("lock");
}
