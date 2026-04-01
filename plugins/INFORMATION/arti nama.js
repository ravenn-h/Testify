import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    if (!content.trim()) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } melinda*_`,
        },
        { quoted: message }
      );
    }

    // Loading
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);

    // Call API with error handling and response check
    const response = await api.get("/api/primbon/artinama", { text: content });

    if (response && response.data) {
      // Send message if response data is available
      await sock.sendMessage(
        remoteJid,
        { text: response.data },
        { quoted: message }
      );
    } else {
      // Send default message if response data is empty or none
      await sock.sendMessage(
        remoteJid,
        { text: "Sorry, no response from the server." },
        { quoted: message }
      );
    }
  } catch (error) {
    // Notify user if an error occurred
    await sock.sendMessage(
      remoteJid,
      {
        text: `Sorry, an error occurred while processing your request. Try again later.\n\n${error}`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["artinama"],
  OnlyPremium: false,
  OnlyOwner: false,
};
