import { tiktokSearch } from "../../lib/scrape/tiktok.js";
import { logCustom } from "../../lib/logger.js";
import { downloadToBuffer } from "../../lib/utils.js";

async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate input: ensure content exists
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } cute cat*_`
      );
    }

    // Show loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Call API to get TikTok video data
    const response = await tiktokSearch(content);

    // Download file to buffer
    const audioBuffer = await downloadToBuffer(response.no_watermark, "mp4");

    // Send video without watermark and caption
    await sock.sendMessage(
      remoteJid,
      {
        video: audioBuffer,
        caption: response.title,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing TikTok command:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    // Send a more informative error message
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["tiktoksearch", "ttsearch", "tts"], // Commands handled by this handler
  OnlyPremium: false,
  OnlyOwner: false,
};
