import yts from "yt-search";
import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";
import { downloadToBuffer } from "../../lib/utils.js";

// Function to send message with quote
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  return sock.sendMessage(remoteJid, { text }, { quoted: message });
}

// Function to send reaction
async function sendReaction(sock, message, reaction) {
  return sock.sendMessage(message.key.remoteJid, {
    react: { text: reaction, key: message.key },
  });
}

// YouTube search function
async function searchYouTube(query) {
  const searchResults = await yts(query);
  return (
    searchResults.all.find((item) => item.type === "video") ||
    searchResults.all[0]
  );
}

// Delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to call API with retry (max 3x, 5 second delay)
async function fetchWithRetry(api, endpoint, params, maxRetries = 3, delayMs = 5000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get(endpoint, params);
      if (response && response.status) {
        console.log(`✅ API succeeded on attempt ${attempt}`);
        return response;
      }
      throw new Error(`Response not valid (attempt ${attempt})`);
    } catch (err) {
      lastError = err;
      console.warn(`❌ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delayMs / 1000} seconds before retrying...`);
        await delay(delayMs);
      }
    }
  }
  throw lastError;
}

// Main function
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const query = content.trim();
    if (!query) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } sunflower*_`
      );
    }

    await sendReaction(sock, message, "⏰");

    // YouTube search
    const video = await searchYouTube(query);

    if (!video || !video.url) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "⛔ _Could not find a matching video_"
      );
    }

    if (video.seconds > 3600) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "_Sorry, the video is too large to send via WhatsApp._"
      );
    }

    const caption = `*YOUTUBE DOWNLOADER*\n\n◧ Title: ${video.title}\n◧ Duration: ${video.timestamp}\n◧ Uploaded: ${video.ago}\n◧ Views: ${video.views}\n◧ Description: ${video.description}`;

    // Initialize API and use fetchWithRetry
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await fetchWithRetry(
      api,
      "/api/downloader/ytplay",
      { url: video.url, format: "m4a" },
      3,
      5000
    );

    if (response && response.status) {
      const url_media = response.data.url;

      // Send image with caption
      await sock.sendMessage(
        remoteJid,
        { image: { url: video.thumbnail }, caption },
        { quoted: message }
      );

      // Download audio file to buffer
      const audioBuffer = await downloadToBuffer(url_media, "mp3");

      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          fileName: `yt.mp3`,
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } else {
      await sendReaction(sock, message, "❗");
    }
  } catch (error) {
    console.error("Error while handling command:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    const errorMessage = `⚠️ Sorry, an error occurred while processing your request. Please try again later.\n\n💡 Details: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["play"],
  OnlyPremium: false,
  OnlyOwner: false,
};
