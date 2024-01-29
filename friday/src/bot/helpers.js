const ADMINS = process.env.ADMINS.split(",").map(Number);
const AUTHORIZED = process.env.AUTHORIZED.split(",").map(Number);

export function isAdmin(ctx) {
  return ADMINS.includes(ctx.from.id);
}

export function getFirstAdmin() {
  return ADMINS[0];
}

export function isAuthorized(ctx) {
  const now = new Date();
  // now is between 8am and 8pm
  return (
    AUTHORIZED.includes(ctx.from.id) &&
    now.getHours() >= 8 &&
    now.getHours() <= 20
  );
}

export async function requestFromAdmin(ctx, action) {
  ADMINS.forEach((admin) => {
    ctx.telegram.sendMessage(
      admin,
      `User ${ctx.from.username} (${ctx.from.id}) "${ctx.from.first_name ?? ""} ${ctx.from.last_name ?? ""}" requested to open the door`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open",
                callback_data: `open@${ctx.from.id}`,
              },
              {
                text: "Nope",
                callback_data: `nope@${ctx.from.id}`,
              },
            ],
          ],
        },
      },
    );
  });
}
