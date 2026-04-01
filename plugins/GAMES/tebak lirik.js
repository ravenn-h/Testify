import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
const api = new ApiAutoresbot(config.APIKEY);

import mess from "../../strings.js";
import { logWithTime } from "../../lib/utils.js";

const WAKTU_GAMES = 60; // 60 seconds

import {
  addUser,
  removeUser,
  getUser,
  isUserPlaying,
} from "../../database/temporary_db/tebak lirik.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, fullText } = messageInfo;

  if (!fullText.includes("lirik")) {
    return true;
  }

  try {
    const response = await api.get(`/api/game/tebaklirik`);

    const soal = response.data.soal;
    const jawaban = response.data.jawaban;

    // When already playing
    if (isUserPlaying(remoteJid)) {
      return await sock.sendMessage(
        remoteJid,
        { text: mess.game.isPlaying },
        { quoted: message }
      );
    }

    // Create new timer for user
    const timer = setTimeout(async () => {
      if (!isUserPlaying(remoteJid)) return;

      removeUser(remoteJid); // Remove user from database if time runs out

      if (mess.game_handler.waktu_habis) {
        const messageWarning = mess.game_handler.waktu_habis.replace(
          "@answer",
          jawaban
        );
        await sock.sendMessage(
          remoteJid,
          { text: messageWarning },
          { quoted: message }
        );
      }
    }, WAKTU_GAMES * 1000);

    // Add user to database
    addUser(remoteJid, {
      answer: jawaban.toLowerCase(),
      hadiah: 10, // prize amount if won
      command: fullText,
      timer: timer,
    });

    await sock.sendMessage(
      remoteJid,
      {
        text: `Please Answer the Following Question\n\n${soal}\nTime: ${WAKTU_GAMES}s`,
      },
      { quoted: message }
    );

    logWithTime("Tebak lirik", `Answer: ${jawaban}`);
  } catch (error) {
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n${
      error || "Unknown error"
    }`;
    await sock.sendMessage(
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["tebak", "tebaklirik"],
  OnlyPremium: false,
  OnlyOwner: false,
};
