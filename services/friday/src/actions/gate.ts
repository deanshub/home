import { callHAService } from "./ha-service";

export async function openGate(): Promise<void> {
  await callHAService("lock", "unlock", "lock.main_1_1_1_lock");
}
