import { Telegraf } from "telegraf";
import { open, close } from "../actions/door";
import { openGate } from "../actions/gate";
import {
  getAllAdmins,
  isAdmin,
  isAuthorized,
  requestFromAdmin,
} from "./helpers";

type DoorAction = "open" | "close";

async function handleDoorCommand(ctx: any, action: DoorAction) {
  const doorFunction = action === "open" ? open : close;
  const actionPast = action === "open" ? "opened" : "closed";
  
  try {
    if (isAdmin(ctx)) {
      await doorFunction();
      ctx.reply(`Door ${actionPast}`);
    } else if (isAuthorized(ctx)) {
      await doorFunction();
      const adminIds = getAllAdmins();
      adminIds.forEach((adminId) => {
        ctx.telegram.sendMessage(
          adminId,
          `Door ${actionPast} by @${ctx.from!.username} (${ctx.from!.id}) "${ctx.from!.first_name ?? ""} ${ctx.from!.last_name ?? ""}"`,
        );
      });
      ctx.reply(`Door ${actionPast}`);
    } else {
      await requestFromAdmin(ctx, action);
      ctx.reply(`A request to ${action} the door has been sent to the admins`);
    }
  } catch (e) {
    console.error(e);
    ctx.reply(`Door couldn't be ${actionPast}`);
  }
}

async function handleGateCommand(ctx: any) {
  try {
    if (isAdmin(ctx)) {
      await openGate();
      ctx.reply("Gate opened");
    } else if (isAuthorized(ctx)) {
      await openGate();
      const adminIds = getAllAdmins();
      adminIds.forEach((adminId) => {
        ctx.telegram.sendMessage(
          adminId,
          `Gate opened by @${ctx.from!.username} (${ctx.from!.id}) "${ctx.from!.first_name ?? ""} ${ctx.from!.last_name ?? ""}"`,
        );
      });
      ctx.reply("Gate opened");
    } else {
      await requestFromAdmin(ctx, "gate");
      ctx.reply("A request to open the gate has been sent to the admins");
    }
  } catch (e) {
    console.error(e);
    ctx.reply("Gate couldn't be opened");
  }
}

export function createBot(): Telegraf {
  const bot = new Telegraf(process.env.BOT_TOKEN!);

  bot.command("start", (ctx) => ctx.reply("Hello"));
  bot.command("help", Telegraf.reply("You can control the door with /open and /close, and the gate with /gate"));
  bot.command("open", (ctx) => handleDoorCommand(ctx, "open"));
  bot.command("close", (ctx) => handleDoorCommand(ctx, "close"));
  bot.command("gate", (ctx) => handleGateCommand(ctx));

  bot.on("callback_query", async (ctx) => {
    if (!("data" in ctx.callbackQuery)) return;
    
    const [action, userId] = ctx.callbackQuery.data.split("@");
    if (action === "open") {
      await open();
      ctx.answerCbQuery("Door opened");
      ctx.telegram.sendMessage(userId, "Door opened for you");
    } else if (action === "close") {
      await close();
      ctx.answerCbQuery("Door closed");
      ctx.telegram.sendMessage(userId, "Door closed for you");
    } else {
      ctx.telegram.sendMessage(userId, "Request denied");
    }
    getAllAdmins().forEach((adminId) => {
      if (adminId !== ctx.from!.id) {
        ctx.telegram.sendMessage(
          adminId,
          `Door ${action === "open" ? "opened" : action === "close" ? "closed" : "denied"} by Admin @${ctx.from!.username} (${ctx.from!.id}) "${ctx.from!.first_name ?? ""} ${ctx.from!.last_name ?? ""}"`,
        );
      }
    });
    ctx.editMessageReplyMarkup(undefined);
  });

  // set up menu buttons
  bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show help" },
    { command: "open", description: "Open the door" },
    { command: "close", description: "Close the door" },
    { command: "gate", description: "Open the gate" },
  ]);

  bot.launch();

  return bot;
}
