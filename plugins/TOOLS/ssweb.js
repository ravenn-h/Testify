import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { isURL } from "../../lib/utils.js";
import mess from "../../strings.js";
import { logCustom } from "../../lib/logger.js";

async function sendMessageWithQuote(
  sock,
  remoteJid,
  message,
  text,
  options = {}
) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // Input validation
    if (!content.trim() || content.trim() == "" || !isURL(content)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } https://google.com*_`
      );
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Initialize API
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API with parameters
    const buffer = await api.getBuffer("/api/ssweb", {
      url: content,
      delay: 6000, // 6 seconds
    });

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
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

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
  Commands: ["ssweb"],
  OnlyPremium: false,
  OnlyOwner: false,
};