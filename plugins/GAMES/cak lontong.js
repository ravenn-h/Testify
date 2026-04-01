import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;
import config from "../../config.js";

import { logWithTime } from "../../lib/utils.js";
import mess from "../../strings.js";

import {
  addUser,
  removeUser,
  getUser,
  isUserPlaying,
} from "../../database/temporary_db/cak lontong.js";

const WAKTU_GAMES = 60; // 60 seconds

const api = new ApiAutoresbot(config.APIKEY);

/**
 * Send message to user.
 * @param {Object} sock - Connection instance.
 * @param {string} remoteJid - User ID.
 * @param {Object} content - Message content.
 * @param {Object} options - Additional options for message sending.
 */
const sendMessage = async (sock, remoteJid, content, options = {}) => {
  try {
    await sock.sendMessage(remoteJid, content, options);
  } catch (error) {
    console.error(`Failed to send message to ${remoteJid}:`, error);
  }
};

/**
 * Handle the Cak Lontong game.
 * @param {Object} sock - Connection instance.
 * @param {Object} messageInfo - Message information.
 */
const handle = async (sock, messageInfo) => {
  const { remoteJid, message, fullText } = messageInfo;

  if (!fullText.includes("lontong")) {
    return true;
  }

  // Check if user is already playing
  if (isUserPlaying(remoteJid)) {
    await sendMessage(
      sock,
      remoteJid,
      { text: mess.game.isPlaying },
      { quoted: message }
    );
    return;
  }

  try {
    const response = await api.get("/api/game/caklontong");
    const { soal, jawaban, deskripsi } = response.data;

    // 60-second timer to answer
    const timer = setTimeout(async () => {
      if (isUserPlaying(remoteJid)) {
        removeUser(remoteJid);
        await sendMessage(
          sock,
          remoteJid,
          {
            text: `Time's up!\nAnswer: ${jawaban}\nDescription: ${deskripsi}\n\nWant to play? Type .cak lontong`,
          },
          { quoted: message }
        );
      }
    }, WAKTU_GAMES * 1000);

    // Add user to database
    addUser(remoteJid, {
      answer: jawaban.toLowerCase(),
      hadiah: 10, // Prize amount if won
      deskripsi,
      command: fullText,
      timer: timer,
    });

    // Send question to user
    await sendMessage(
      sock,
      remoteJid,
      { text: `*Answer the Following Question:*\n${soal}\n*Time: 60s*` },
      { quoted: message }
    );

    logWithTime("Caklontong", `Answer: ${jawaban}`);
  } catch (error) {
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n${
      error || "Unknown error"
    }`;
    await sendMessage(
      sock,
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
};

export default {
  handle,
  Commands: ["cak", "caklontong"],
  OnlyPremium: false,
  OnlyOwner: false,
};
