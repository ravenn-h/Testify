import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import mess from "../../strings.js";
import { logWithTime } from "../../lib/utils.js";
import {
  addUser,
  isUserPlaying,
} from "../../database/temporary_db/family100.js";

const api = new ApiAutoresbot(config.APIKEY);

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  try {
    // Check if user is already playing
    if (isUserPlaying(remoteJid)) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.game.isPlaying },
        { quoted: message }
      );
      return;
    }

    // Fetch game data from API
    const response = await api.get(`/api/game/family100`);
    const gameData = response?.data;

    if (!gameData) {
      throw new Error("Failed to fetch game data");
    }

    const { soal, jawaban } = gameData;
    console.log(jawaban);

    logWithTime("Family100", `Answer: ${jawaban}`);

    // Add user to game database
    addUser(remoteJid, {
      soal,
      answer: jawaban,
      terjawab: Array(jawaban.length).fill(false), // Array for answers already guessed
      hadiahPerJawabanBenar: 1, // Prize for each correct answer
      hadiahJikaMenang: 20, // Prize if all answers are guessed (win)
    });

    // Format question message
    const hasSpacedAnswer = jawaban.some((answer) => answer.includes(" "));
    const messageText = `*Answer the Following Question:*\n${soal}\n\nThere are *${
      jawaban.length
    }* answer(s)${hasSpacedAnswer ? " (some answers contain spaces)" : ""}.`;

    // Send message to user
    await sock.sendMessage(
      remoteJid,
      { text: messageText },
      { quoted: message }
    );
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
  Commands: ["family100"],
  OnlyPremium: false,
  OnlyOwner: false,
};
