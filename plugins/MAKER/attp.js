import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;
import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, isQuoted, prefix, command } =
    messageInfo;

  try {
    const text =
      content && content.trim() !== "" ? content : isQuoted?.text ?? null;
    // Validate content input
    if (!text) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } resbot*_`,
        },
        { quoted: message }
      );
      return; // Stop execution if no content
    }

    // Send loading message with emoji reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Create API instance and fetch data from endpoint
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.getBuffer("/api/maker/attp2", { text: text });

    // Send sticker as response
    await sock.sendMessage(
      remoteJid,
      {
        sticker: response,
      },
      { quoted: message }
    );
  } catch (error) {
    // Handle error and send error message to user
    const errorMessage = `Sorry, an error occurred while processing your request. Try again later.\n\nError: ${error.message}`;
    await sock.sendMessage(
      remoteJid,
      {
        text: errorMessage,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["attp"],
  OnlyPremium: false,
  OnlyOwner: false,
};
