import { tiktok } from "../../lib/scrape/tiktok.js";
import { logCustom } from "../../lib/logger.js";
import {
  forceConvertToM4a,
  extractLink,
  downloadToBuffer,
} from "../../lib/utils.js";

/**
 * Send text message with quote
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Validate whether URL is from TikTok
 */
function isTikTokUrl(url) {
  return /tiktok\.com/i.test(url);
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const trimmedContent = content.trim();

    // Validate empty input
    if (!trimmedContent) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_\n_💬 Example:_ _*${prefix + command} link*_`
      );
    }

    const validLink = extractLink(trimmedContent);

    // Validate TikTok URL
    if (!isTikTokUrl(validLink)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "The URL you entered is not valid. Make sure the URL is from TikTok."
      );
    }

    // Show loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Get TikTok data
    const response = await tiktok(validLink);

    // Validate response.music
    if (!response?.music) {
      console.error(
        "Error: No music URL found in the response."
      );
      logCustom("info", trimmedContent, `ERROR-COMMAND-${command}.txt`);
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "Failed to retrieve audio from TikTok. Please try again later."
      );
    }

    let outputUrl = response.music;

    try {
      // Convert to M4A if possible
      outputUrl = await forceConvertToM4a({ url: response.music });
      const audioBuffer = await downloadToBuffer(outputUrl, "mp3");

      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          fileName: "tiktok.mp3",
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } catch (conversionError) {
      await sock.sendMessage(
        remoteJid,
        {
          audio: { url: outputUrl },
          fileName: "tiktok.mp3",
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    }
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    const errorMessage = `Sorry, an error occurred while processing your request.\n\n*Error Details:* ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["tiktokmp3", "ttmp3"],
  OnlyPremium: false,
  OnlyOwner: false,
};
