import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;
import config from "../../config.js";
import { downloadToBuffer } from "../../lib/utils.js";
import { logCustom } from "../../lib/logger.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, isQuoted } =
    messageInfo;

  // Get the sent text or text from the quoted message
  const text = content?.trim() || isQuoted?.text?.trim() || null;

  // Validate input
  if (!text || text.length < 1) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix}${command} halo google*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Loading
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Call API
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get("/api/sound/textanime", { text });

    if (response?.data) {
      // Download API result to buffer
      const audioBuffer = await downloadToBuffer(response.data, "mp4");

      // Send as PTT audio
      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } else {
      throw new Error("API response is empty or invalid.");
    }
  } catch (error) {
    // Log error to file
    logCustom("error", text, `ERROR-COMMAND-${command}.txt`);
    console.error("⚠️ An error occurred:", error);

    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Failed: Check your API key! (.apikey)_`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["vnanime"],
  OnlyPremium: false,
  OnlyOwner: false,
};
