// const yts = require("yt-search");
import yts from "yt-search";

import { logCustom } from "../../lib/logger.js";

// Function to send message with quote
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

// Function to handle YouTube search
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate input
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } sunflower*_`
      );
    }

    // Show loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Perform search using yts
    const search = await yts(content);

    // Build search result text
    let teks = `*YouTube Search*\n\nResult for: _${content}_\n\n`;
    let no = 1;

    for (let video of search.all) {
      teks +=
        `⭔ No: ${no++}\n` +
        `⭔ Type: ${video.type}\n` +
        `⭔ Video ID: ${video.videoId}\n` +
        `⭔ Title: ${video.title}\n` +
        `⭔ Views: ${video.views}\n` +
        `⭔ Duration: ${video.timestamp}\n` +
        `⭔ Upload At: ${video.ago}\n` +
        `⭔ URL: ${video.url}\n\n` +
        `─────────────────\n\n`;
    }

    // Send search results
    await sock.sendMessage(
      remoteJid,
      {
        image: { url: search.all[0].thumbnail },
        caption: teks,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error while searching YouTube:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Handle error and send message to user
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError Details: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["yts", "ytsearch"],
  OnlyPremium: false,
  OnlyOwner: false,
};
