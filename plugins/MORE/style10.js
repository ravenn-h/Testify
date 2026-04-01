const font =
  "🅰 🅱 🅲 🅳 🅴 🅵 🅶 🅷 🅸 🅹 🅺 🅻 🅼 🅽 🅾 🅿 🆀 🆁 🆂 🆃 🆄 🆅 🆆 🆇 🆈 🆉 0 1 2 3 4 5 6 7 8 9 🅰 🅱 🅲 🅳 🅴 🅵 🅶 🅷 🅸 🅹 🅺 🅻 🅼 🅽 🅾 🅿 🆀 🆁 🆂 🆃 🆄 🆅 🆆 🆇 🆈 🆉";
const commandName = "style10";

import { reply, style } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    if (!content) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } resbot*_`
      );
    }

    const result = style(content, font);
    if (!result) {
      return await reply(
        m,
        "⚠️ _Failed to apply style. Please check your input._"
      );
    }

    await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
  } catch (error) {
    console.error("Error in handle function:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `_Error: ${error.message}_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: [commandName],
  OnlyPremium: false,
  OnlyOwner: false,
};
