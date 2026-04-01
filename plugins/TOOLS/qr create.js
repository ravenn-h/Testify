import qrcode from "qrcode";

import mess from "../../strings.js";
import { reply } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  // Input validation
  if (!content) {
    return await reply(
      m,
      `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_`
    );
  }

  try {
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const resultQr = await qrcode.toDataURL(content, { scale: 8 });
    const buffer = Buffer.from(
      resultQr.replace("data:image/png;base64,", ""),
      "base64"
    );

    // Send QR image
    await sock.sendMessage(
      remoteJid,
      {
        image: buffer,
        caption: mess.general.success,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in handle function:", error);

    const errorMessage = error.message || "An unknown error occurred.";
    return await sock.sendMessage(
      remoteJid,
      { text: `_Error: ${errorMessage}_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["createqr"],
  OnlyPremium: false,
  OnlyOwner: false,
};