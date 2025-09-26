import { createBot } from "./src/bot/bot";
import { getFirstAdmin } from "./src/bot/helpers";

const bot = createBot();

const firstAdminId = getFirstAdmin();
bot.telegram.sendMessage(firstAdminId, "Bot started");
