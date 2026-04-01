// const { igdl } = require("btch-downloader");
import { igdl } from "btch-downloader";

import mess from "../../strings.js";
import { logCustom } from "../../lib/logger.js";
import { downloadToBuffer } from "../../lib/utils.js";

/**
 * Send message with quote
 * @param {object} sock - WebSocket connection object
 * @param {string} remoteJid - Target user ID
 * @param {object} message - Original quoted message
 * @param {string} text - Text message to send
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Validate whether the given URL is a valid Instagram URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isIGUrl(url) {
  return /instagram\.com/i.test(url);
}

/**
 * Main function to handle Instagram media download requests
 * @param {object} sock - WebSocket connection object
 * @param {object} messageInfo - Message info including content and sender
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate input: ensure content exists and URL is valid
    if (!content?.trim() || !isIGUrl(content)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } https://www.instagram.com/xxx*_`
      );
    }

    // Show loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Call igdl API to get media
    const response = await igdl(content);

    if (!response || response.length === 0) {
      throw new Error("No media found at that URL.");
    }

    // Get the first media from the response
    const firstMedia = response[0];
    const urlMedia = firstMedia.url;

    // Try to determine content type from file extension
    const fileExtension = urlMedia.split(".").pop();
    const isImage = ["jpg", "jpeg", "png", "webp"].includes(
      fileExtension.toLowerCase()
    );

    const audioBuffer = await downloadToBuffer(urlMedia, "jpg");

    if (isImage) {
      // Download file to buffer

      // Send media as image
      await sock.sendMessage(
        remoteJid,
        { image: audioBuffer, caption: mess.general.success },
        { quoted: message }
      );
    } else {
      // Send media as video
      await sock.sendMessage(
        remoteJid,
        { video: audioBuffer, caption: mess.general.success },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error processing Instagram:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Send a more descriptive error message
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${
      error.message || "Unknown error"
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["ig", "instagram"], // Commands supported by this handler
  OnlyPremium: false,
  OnlyOwner: false,
};
