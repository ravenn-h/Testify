import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_Enter your GAME ID_\n\n${prefix + command} 8370310025568788107`,
        },
        { quoted: message }
      );
    }

    const user_id = trimmedContent;
    if (!user_id) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Wrong format. Use:_\n\n${prefix + command} <user_id>`,
        },
        { quoted: message }
      );
    }

    // Send loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);

    // Call API
    const response = await api.get("/api/stalker/cod-mobile", { user_id });

    if (response?.data) {
      const { username } = response.data;

      const gameDataId = `🎮 | *Call OF Duty*

◧ User ID : ${user_id}
◧ Username : ${username || "Unknown"}`;

      // Send retrieved data
      await sock.sendMessage(
        remoteJid,
        { text: gameDataId },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
      // Empty response or no data
      await sock.sendMessage(
        remoteJid,
        { text: "Sorry, no response from the server." },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error:", error);

    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    // Handle error with message to user
    await sock.sendMessage(
      remoteJid,
      {
        text: `Sorry, an error occurred while processing your request. Try again later.\n\nDetail: ${
          error.message || error
        }`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["codcek", "cod"],
  OnlyPremium: false,
  OnlyOwner: false,
};
