import mess from "../../strings.js";
import { logWithTime } from "../../lib/utils.js";
import {
  addUser,
  removeUser,
  isUserPlaying,
} from "../../database/temporary_db/tebak angka.js";

const WAKTU_GAMES = 60; // 60 seconds

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, fullText } = messageInfo;

  let level_tebakangka = "";

  if (!fullText.includes("angka")) {
    return true; // Skip this plugin
  }

  const validLevels = ["easy", "normal", "hard", "expert", "setan"];
  const args = content.split(" ");
  const KATA_TERAKHIR = args[args.length - 1];

  if (validLevels.includes(KATA_TERAKHIR)) {
    level_tebakangka = KATA_TERAKHIR;
  } else {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `Enter a Level\n\nExample *tebak angka easy*\n\n*Options*\neasy\nnormal\nhard\nexpert\nsetan`,
      },
      { quoted: message }
    );
  }

  const levelMap = {
    easy: 10,
    normal: 100,
    hard: 1000,
    expert: 10000,
    setan: 10000000000,
  };

  const akhir_angkaAcak = levelMap[level_tebakangka];
  const angkaAcak = Math.floor(Math.random() * akhir_angkaAcak) + 1;
  if (isUserPlaying(remoteJid)) {
    return await sock.sendMessage(
      remoteJid,
      { text: mess.game.isPlaying },
      { quoted: message }
    );
  }

  // Create a new timer for user
  const timer = setTimeout(async () => {
    if (!isUserPlaying(remoteJid)) return;

    removeUser(remoteJid); // Remove user from database if time runs out

    if (mess.game_handler.waktu_habis) {
      const messageWarning = mess.game_handler.waktu_habis.replace(
        "@answer",
        angkaAcak
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
    angkaAcak,
    level: level_tebakangka,
    angkaEnd: akhir_angkaAcak,
    attempts: 6, // number of attempts
    hadiah: 10, // prize amount if won
    command: fullText,
    timer: timer,
  });

  // Send initial message
  await sock.sendMessage(
    remoteJid,
    {
      text: `Game started! Guess a number from 1 to ${akhir_angkaAcak} for level *${level_tebakangka}*. You have ${WAKTU_GAMES}s`,
    },
    { quoted: message }
  );

  logWithTime("Tebak Angka", `Answer: ${angkaAcak}`);
}

export default {
  handle,
  Commands: ["tebak", "tebakangka"],
  OnlyPremium: false,
  OnlyOwner: false,
};
