import { Telegraf } from "telegraf";
import { open } from "../actions/door";
import { isAdmin, isAuthorized, requestFromAdmin } from "./helpers";

export function createBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  bot.command("start", (ctx) => ctx.reply("Hello"));
  bot.command("help", Telegraf.reply("You can control the door with /open"));
  bot.command("open", async (ctx) => {
    console.log(ctx.from);
    try {
      if (isAdmin(ctx) || isAuthorized(ctx)) {
        await open();
        ctx.reply("Door open");
      } else {
        await requestFromAdmin(ctx, open);
        ctx.reply("A request to open the door has been sent to the admins");
      }
    } catch (e) {
      console.error(e);
      ctx.reply("Door couldn't be opened");
    }
  });

  bot.on("callback_query", async (ctx) => {
    console.log(ctx.callbackQuery.data);
    const [action, userId] = ctx.callbackQuery.data.split("@");
    if (action === "open") {
      await open();
      ctx.answerCbQuery("Door opened");
      ctx.telegram.sendMessage(userId, "Door opened for you");
    } else {
      ctx.telegram.sendMessage(userId, "Request denied");
    }
    ctx.editMessageReplyMarkup();
  });

  // set up menu buttons
  bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show help" },
    { command: "open", description: "Open the door" },
  ]);

  bot.launch();
  return bot;
}
