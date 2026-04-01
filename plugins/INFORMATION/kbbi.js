import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
const cleanHtml = (input) => input.replace(/<\/?[^>]+(>|$)/g, "");

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
    // Validate input
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} tree*_`
      );
    }

    // Show "Loading" reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Initialize API
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API with parameters
    const response = await api.get("/api/information/kbbi", { q: content });

    // Handle API response
    if (response.code === 200 && response.data) {
      const { kata, keterangan } = response.data;
      const bersih = cleanHtml(keterangan);
      const kbbiData = `_*Word:*_ ${kata}\n\n_*Meaning:*_ ${bersih}`;

      // Send text
      await sendMessageWithQuote(sock, remoteJid, message, kbbiData);
    } else {
      // Handle case if response is invalid or empty
      const errorMessage =
        response?.message ||
        "Sorry, no response from the server. Please try again later.";
      await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
  } catch (error) {
    // Handle error and send message to user
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError Details: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}
export default {
  handle,
  Commands: ["kbbi"],
  OnlyPremium: false,
  OnlyOwner: false,
};
