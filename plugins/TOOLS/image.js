import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

import { getBuffer } from "../../lib/utils.js";
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
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Input validation
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } cat*_`
      );
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);

    const response = await api.get("/api/search/pinterest", { text: content });

    if (response.code === 200 && response.data) {
      const buffer = await getBuffer(response.data);
      return await sock.sendMessage(
        remoteJid,
        { image: buffer, caption: mess.general.success },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
      const errorMessage =
        response?.message ||
        "Sorry, no response from the server. Please try again later.";
      return await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError Details: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["image", "img"],
  OnlyPremium: false,
  OnlyOwner: false,
};