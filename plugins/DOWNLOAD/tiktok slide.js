const limit = 4; // number of images to send

import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

import { extractLink } from "../../lib/utils.js";
import { logCustom } from "../../lib/logger.js";

function isTikTokUrl(url) {
  return /tiktok\.com/i.test(url);
}

async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const validLink = extractLink(content);

    // Validate input
    if (!content?.trim() || !isTikTokUrl(content)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } https://vt.tiktok.com/ZSjqUj8cc/*_`
      );
    }

    // Show loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏳", key: message.key },
    });

    // Initialize API with APIKEY from config
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API to download images
    const response = await api.get("/api/downloader/tiktok-slide", {
      url: validLink,
    });

    // Validate response
    if (!response || !response.data || response.data.length === 0) {
      throw new Error("No images found at that URL.");
    }

    // Send images up to the limit
    const imagesToSend = response.data.slice(0, limit);
    for (const imageUrl of imagesToSend) {
      await sock.sendMessage(remoteJid, {
        image: { url: imageUrl },
        caption: ``,
      });
    }
  } catch (error) {
    console.error("Error processing TikTok command:", error);
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
  Commands: ["ttslide", "tiktokslide"], // Supported commands
  OnlyPremium: false,
  OnlyOwner: false,
};
