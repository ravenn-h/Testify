import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

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
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _${
          prefix + command
        } 66.249.66.207_`
      );
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);

    // Call API with parameters
    const response = await api.get("/api/stalker/ip", {
      ip: content,
    });

    if (response && response.data) {
      // Convert data to string (formatted)
      const responseDataString = JSON.stringify(response.data, null, 2);
      return await sock.sendMessage(
        remoteJid,
        { text: `${responseDataString}` },
        { quoted: message }
      );
    } else {
      // If no data found
      return await sock.sendMessage(
        remoteJid,
        { text: "No data found from the API." },
        { quoted: message }
      );
    }
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
  Commands: ["ipcheck", "checkip", "cekip", "ipchecker"],
  OnlyPremium: false,
  OnlyOwner: false,
};