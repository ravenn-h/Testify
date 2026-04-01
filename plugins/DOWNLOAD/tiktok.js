import { tiktok } from "../../lib/scrape/tiktok.js";

import { logCustom } from "../../lib/logger.js";
import { extractLink, downloadToBuffer } from "../../lib/utils.js";
/**
 * Send message with quote
 * @param {object} sock - WhatsApp connection instance
 * @param {string} remoteJid - Sender message ID
 * @param {object} message - Quoted message
 * @param {string} text - Text message to send
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Validate whether the given URL is a valid TikTok URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isTikTokUrl(url) {
  return /tiktok\.com/i.test(url);
}

/**
 * Main function to handle TikTok commands
 * @param {object} sock - WhatsApp connection instance
 * @param {object} messageInfo - Information about the received message
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  const validLink = extractLink(content);

  try {
    // Validate input: ensure content exists
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } link*_`
      );
    }

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

    // Call API to get TikTok video data
    const response = await tiktok(validLink);

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
  Commands: ["tt", "tiktok"], // Commands handled by this handler
  OnlyPremium: false,
  OnlyOwner: false,
};
