import { Telegraf } from "telegraf";
import { open } from "../actions/door";
import {
  getAllAdmins,
  isAdmin,
  isAuthorized,
  requestFromAdmin,
} from "./helpers";

export function createBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  bot.command("start", (ctx) => ctx.reply("Hello"));
  bot.command("help", Telegraf.reply("You can control the door with /open"));
  bot.command("open", async (ctx) => {
    console.log(ctx.from);
    try {
      if (isAdmin(ctx)) {
        await open();
        ctx.reply("Door open");
      } else if (isAuthorized(ctx)) {
        await open();
        const adminIds = getAllAdmins();
        adminIds.forEach((adminId) => {
          ctx.telegram.sendMessage(
            adminId,
            `Door opened by ${ctx.from.username} (${ctx.from.id}) "${ctx.from.first_name ?? ""} ${ctx.from.last_name ?? ""}"`,
          );
        });
        ctx.reply("Door open");
      } else {
        await requestFromAdmin(ctx, "open");
        ctx.reply("A request to open the door has been sent to the admins");
      }
    } catch (e) {
      console.error(e);
      ctx.reply("Door couldn't be opened");
    }
  });

  bot.on("callback_query", async (ctx) => {
    const [action, userId] = ctx.callbackQuery.data.split("@");
    if (action === "open") {
      await open();
      ctx.answerCbQuery("Door opened");
      ctx.telegram.sendMessage(userId, "Door opened for you");
    } else {
      ctx.telegram.sendMessage(userId, "Request denied");
    }
    getAllAdmins().forEach((adminId) => {
      if (adminId !== ctx.from.id) {
        ctx.telegram.sendMessage(
          adminId,
          `Door ${action === "open" ? "opened" : "denied"} by Admin ${ctx.from.username} (${ctx.from.id}) "${ctx.from.first_name ?? ""} ${ctx.from.last_name ?? ""}"`,
        );
      }
    });
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
