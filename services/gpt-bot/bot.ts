import { Telegraf } from "telegraf";
import { alternateImage, image, talk } from "./openai";
import { message } from "telegraf/filters";
import { getOrThrow } from "./getOrThrow";
import { isAdmin } from "./helpers";
import fetch from "node-fetch";
import { createWriteStream, createReadStream } from "fs";
import { ensureDir } from "fs-extra";
import { join } from "path";

export function createBot() {
  const bot = new Telegraf(getOrThrow("BOT_TOKEN"));
  bot.command("start", (ctx) => ctx.reply("Hello"));
  bot.command(
    "help",
    Telegraf.reply(
      "You can send me a message or command me to image with /img",
    ),
  );

  bot.command("img", async (ctx) => {
    if (!isAdmin(ctx)) {
      ctx.reply("You are not authorized to use this bot");
      return;
    }
    try {
      const text = ctx.message.text.replace("/img", "");
      const img = await image({ text });
      if (!img) {
        throw new Error("No image generated");
      }
      ctx.replyWithPhoto(img);

      //   //   if (isAdmin(ctx)) {
      //   //     await open();
      //   //     ctx.reply("Door open");
      //   //   } else if (isAuthorized(ctx)) {
      //   //     await open();
      //   //     const adminIds = getAllAdmins();
      //   //     adminIds.forEach((adminId) => {
      //   //       ctx.telegram.sendMessage(
      //   //         adminId,
      //   //         `Door opened by @${ctx.from.username} (${ctx.from.id}) "${ctx.from.first_name ?? ""} ${ctx.from.last_name ?? ""}"`,
      //   //       );
      //   //     });
      //   //     ctx.reply("Door open");
      //   //   } else {
      //   //     await requestFromAdmin(ctx, "open");
      //   //     ctx.reply("A request to open the door has been sent to the admins");
      //   //   }
    } catch (e) {
      console.error(e);
      ctx.reply(
        "I'm sorry, had an error processing your request. Please try again later.",
      );
    }
  });

  bot.on(message("text"), async (ctx) => {
    if (!isAdmin(ctx)) {
      ctx.reply("You are not authorized to use this bot");
      return;
    }
    try {
      const reply = await talk({ text: ctx.message.text });
      // ctx.reply(reply, { parse_mode: "MarkdownV2" });
      ctx.reply(reply ?? "I'm sorry, I don't understand", {
        parse_mode: "HTML",
      });
    } catch (e) {
      console.error(e);
      ctx.reply(
        "I'm sorry, had an error processing your request. Please try again later.",
      );
    }
  });

  bot.on(message("photo"), async (ctx) => {
    if (!isAdmin(ctx)) {
      ctx.reply("You are not authorized to use this bot");
      return;
    }
    try {
      const photoLink = await bot.telegram.getFileLink(
        ctx.message.photo[0].file_id,
      );
      const date = new Date();
      await ensureDir(join(import.meta.dir, "images"));
      const photoPath = join(import.meta.dir, `images/${date.getTime()}.png`);
      const response = await fetch(photoLink.toString());
      if (!response.ok || !response.body) {
        throw new Error("No image generated");
      }
      response.body.pipe(createWriteStream(photoPath));

      const file = createReadStream(photoPath);

      const img = await alternateImage({
        file,
      });
      if (!img) {
        throw new Error("No image generated");
      }
      ctx.replyWithPhoto(img);
    } catch (e) {
      console.error(e);
      ctx.reply(
        "I'm sorry, had an error processing your request. Please try again later.",
      );
    }
  });

  // set up menu buttons
  bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show help" },
    { command: "img", description: "Image Generation" },
  ]);

  bot.launch();

  return bot;
}

// function getSize(text: string): string | undefined {
//   const size = text.match(/(\d+)x(\d+)/);
//   if (size) {
//     return size[0];
//   }
// }
