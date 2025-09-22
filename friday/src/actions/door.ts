import { callHAService } from "./ha-service";

export async function open(): Promise<void> {
  await callHAService("lock", "open", "lock.main");
}

export async function close(): Promise<void> {
  await callHAService("lock", "lock", "lock.main");
}
