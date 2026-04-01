import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

import { downloadToBuffer, isURL } from "../../lib/utils.js";

import mess from "../../strings.js";
import { logCustom } from "../../lib/logger.js";

async function sendMessageWithQuote(
  sock,
  remoteJid,
  message,
  text,
  options = {}
) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

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
        } https://twitter.com/gofoodindonesia/status/1229369819511709697*_`
      );
    }

    if (!isURL(content)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Link not valid_`
      );
    }

    // Show loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Initialize API
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API with parameters
    const response = await api.get("/api/downloader/twitter", {
      url: content,
    });

    // Download file to buffer
    const audioBuffer = await downloadToBuffer(response.data[0], "mp4");

    // Handle API response
    if (response.code === 200 && response.data) {
      await sock.sendMessage(
        remoteJid,
        {
          video: audioBuffer,
          mimetype: "video/mp4",
          caption: mess.general.success,
        },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

      // Handle case where response is invalid or empty
      const errorMessage =
        response?.message ||
        "Sorry, no response from the server. Please try again later.";
      await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
  } catch (error) {
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
  Commands: ["tw", "twitter"],
  OnlyPremium: false,
  OnlyOwner: false,
};
