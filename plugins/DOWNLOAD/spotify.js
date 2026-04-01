import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

import { logCustom } from "../../lib/logger.js";

async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate input
    const query = content.trim();
    if (!query) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_\n\n_💬 Example:_ _*${
          prefix + command
        } sunflower*_`
      );
    }

    // Show loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Initialize API
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API with parameters
    const response = await api.get("/api/search/spotify", { text: query });

    // Handle API response
    const results = response?.data;
    if (Array.isArray(results) && results.length > 0) {
      let reply = `🔍 *Spotify Search Results for "${query}":*\n\n`;
      results.forEach((item, index) => {
        const { title, artist, url, duration, popularity, preview } = item;

        reply += `*${index + 1}. ${title}*\n`;
        reply += `   🎤 *Artist:* ${artist}\n`;
        reply += `   ⏱️ *Duration:* ${(duration / 1000).toFixed(0)} sec\n`;
        reply += `   🌟 *Popularity:* ${popularity}\n`;
        reply += `   🔗 ${url}\n`;
        if (preview) {
          reply += `   🎵 ${preview}\n`;
        }
        reply += `\n`;
      });

      // Send search results
      await sendMessageWithQuote(sock, remoteJid, message, reply.trim());
    } else {
      // Message if data is empty
      await sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "⚠️ Sorry, no results found for your search."
      );
    }
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Handle error
    await sock.sendMessage(
      remoteJid,
      {
        text: `❌ Sorry, an error occurred while processing your request. Please try again later.\n\n*Error:* ${error.message}`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["spotify"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Number of limits to deduct
};
