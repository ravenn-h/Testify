import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";
import { extractLink, downloadToBuffer } from "../../lib/utils.js";

// Function to send message with quote
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

// Delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to retry API request up to 3 times
async function fetchWithRetry(api, endpoint, params, maxRetries = 3, delayMs = 5000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get(endpoint, params);
      if (response && response.status) {
        console.log(`✅ Succeeded on attempt ${attempt}`);
        return response;
      }
      throw new Error(`API response invalid (attempt ${attempt})`);
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

// Main handler function
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const validLink = extractLink(content);

    if (!content.trim() || content.trim() === "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } https://www.youtube.com/watch?v=xxxxx*_`
      );
    }

    // Send loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);

    // Try API request up to 3 times
    const response = await fetchWithRetry(
      api,
      "/api/downloader/ytplay",
      { url: validLink, format: "m4a" },
      3,
      5000
    );

    if (response.status) {
      const url_media = response.data.url;

      const audioBuffer = await downloadToBuffer(url_media, "mp3");

      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
      await sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "Sorry, could not find audio from the URL you provided."
      );
    }
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError Details: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["ytmp3"],
  OnlyPremium: false,
  OnlyOwner: false,
};
