export async function open() {
  await fetch("https://ha.home.shubapp.com/api/services/lock/open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HA_TOKEN}`,
    },
    body: JSON.stringify({ entity_id: "lock.main" }),
  });
}
