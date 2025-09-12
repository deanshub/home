async function callDoorService(service: string, entityId: string): Promise<void> {
  await fetch(`https://ha.home.shubapp.com/api/services/lock/${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HA_TOKEN}`,
    },
    body: JSON.stringify({ entity_id: entityId }),
  });
}

export async function open(): Promise<void> {
  await callDoorService("open", "lock.main_unlatch");
}

export async function close(): Promise<void> {
  await callDoorService("lock", "lock.main");
}
