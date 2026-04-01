import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    const trimmedContent = content.trim();

    // Validate user input
    if (!trimmedContent) {
      return await sendErrorMessage(
        sock,
        remoteJid,
        `_Enter a TikTok Username_\n\nExample: _${prefix + command} kompascom_`,
        message
      );
    }

    const user_id = trimmedContent;

    // Send loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Initialize API and call endpoint
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get("/api/stalker/tiktok", {
      username: user_id,
    });

    // Validate API response
    if (response?.data) {
      const { nickname, desc, avatar, follower, following } = response.data;

      const resultTiktok = `
*STALKER TIKTOK*

◧ *Username*: ${user_id || "Unknown"}
◧ *Nickname*: ${nickname || "Unknown"}
◧ *Description*: ${desc || "Unknown"}
◧ *Follower*: ${follower || "Unknown"}
◧ *Following*: ${following || "Unknown"}
`;

      try {
        // Send image if avatar exists and is valid
        if (Array.isArray(avatar) && avatar[0]) {
          return await sock.sendMessage(
            remoteJid,
            { image: { url: avatar[0] }, caption: resultTiktok },
            { quoted: message }
          );
        }
      } catch (error) {
        //console.warn("Failed to send avatar image:", error.message || error);
      }

      // Send text if avatar fails or is absent
      return await sock.sendMessage(
        remoteJid,
        { text: resultTiktok },
        { quoted: message }
      );
    }

    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    // If response has no data
    await sendErrorMessage(
      sock,
      remoteJid,
      "Sorry, no TikTok user data was found.",
      message
    );
  } catch (error) {
    console.error("Error:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Handle error with message to user
    await sendErrorMessage(
      sock,
      remoteJid,
      `Sorry, an error occurred while processing your request. Try again later.\n\n*Detail*: ${
        error.message || error
      }`,
      message
    );
  }
}

// Utility function for sending error messages
async function sendErrorMessage(sock, remoteJid, text, quotedMessage) {
  await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

export default {
  handle,
  Commands: ["stalktiktok"],
  OnlyPremium: false,
  OnlyOwner: false,
};
