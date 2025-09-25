import { createBot } from "./bot";
import { getFirstAdmin } from "./helpers";

const bot = createBot();

const firstAdminId = getFirstAdmin();
bot.telegram.sendMessage(firstAdminId, "Bot started");
