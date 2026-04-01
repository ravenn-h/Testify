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
  isUserPlaying,
} from "../../database/temporary_db/tebak bendera.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, fullText } = messageInfo;

  if (!fullText.includes("bendera")) {
    return true;
  }

  try {
    const response = await api.get(`/api/game/bendera`);

    const UrlData = response.data.url_download;
    const answer = response.data.name;

    // When already playing
    if (isUserPlaying(remoteJid)) {
      return await sock.sendMessage(
        remoteJid,
        { text: mess.game.isPlaying },
        { quoted: message }
      );
    }

    // Set 60-second timer
    const timer = setTimeout(async () => {
      if (!isUserPlaying(remoteJid)) return;

      removeUser(remoteJid); // Remove user from database if time runs out

      if (mess.game_handler.waktu_habis) {
        const messageWarning = mess.game_handler.waktu_habis.replace(
          "@answer",
          answer
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
      answer: answer.toLowerCase(),
      hadiah: 10, // prize amount if won
      command: fullText,
      timer: timer,
    });

    await sock.sendMessage(
      remoteJid,
      {
        image: { url: UrlData },
        caption: `Name the Country Shown Above\n\nTime: ${WAKTU_GAMES}s`,
      },
      { quoted: message }
    );

    logWithTime("Tebak Bendera", `Answer: ${answer}`);
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
  Commands: ["tebak", "tebakbendera"],
  OnlyPremium: false,
  OnlyOwner: false,
};
