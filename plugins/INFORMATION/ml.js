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
        { text: `_Enter your GAME ID_\n\n${prefix + command} 427679814 9954` },
        { quoted: message }
      );
    }

    const [user_id, server] = trimmedContent.split(" ");

    if (!user_id || !server) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Wrong format. Use:_\n\n${
            prefix + command
          } <user_id> <server>`,
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
    const response = await api.get("/api/stalker/ml", { user_id, server });

    if (response?.data) {
      const { username, this_login_country, region} = response.data;

      const gameDataId = `🎮 | *MOBILE LEGEND*

◧ User ID : ${user_id}
◧ Server : ${server}
◧ Username : ${username || "Unknown"}
◧ Country : ${this_login_country || region || "Not available"}`;

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
  Commands: ["ml", "mlcek"],
  OnlyPremium: false,
  OnlyOwner: false,
};
