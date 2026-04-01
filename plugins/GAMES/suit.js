import mess from "../../strings.js";
import {
  addUser,
  removeUser,
  getUser,
  isUserPlaying,
} from "../../database/temporary_db/suit.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

const WAKTU_GAMES = 60; // 60 seconds

// Function to start the game
async function startGame(
  sock,
  remoteJid,
  player1,
  player2,
  message,
  senderType
) {
  addUser(remoteJid, {
    status: false,
    player1,
    player2,
    answer_player1: null,
    answer_player2: null,
    hadiah: 10,
    groupId: remoteJid,
  });

  const gameQuestion = `_*SUIT PvP*_\n\n@${player1.split`@`[0]} challenges @${
    player2.split`@`[0]
  } to a suit game.\n\nPlease @${
    player2.split`@`[0]
  } type *accept* or *reject* within ${WAKTU_GAMES}s`;
  await sendMessageWithMention(
    sock,
    remoteJid,
    gameQuestion,
    message,
    senderType
  );

  // Timer to cancel if no response
  setTimeout(async () => {
    if (isUserPlaying(remoteJid)) {
      removeUser(remoteJid);
      await sock.sendMessage(
        remoteJid,
        { text: "Time's up! Suit game cancelled." },
        { quoted: message }
      );
    }
  }, WAKTU_GAMES * 1000); // 2 minutes / 60 seconds
}

// Main function to handle command
async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, mentionedJid, senderType } = messageInfo;

  if (isUserPlaying(remoteJid)) {
    return await sock.sendMessage(
      remoteJid,
      { text: mess.game.isPlaying },
      { quoted: message }
    );
  }

  if (!mentionedJid || mentionedJid.length === 0) {
    return await sendMessageWithMention(
      sock,
      remoteJid,
      `_Who do you want to challenge?_\nTag the person.\n\nExample: suit @${
        sender.split`@`[0]
      }`,
      message,
      senderType
    );
  }

  const player1 = sender;

  const player2 = await convertToJid(sock, mentionedJid[0])

  if (player1 === player2) {
    return await sock.sendMessage(
      remoteJid,
      { text: "You cannot challenge yourself!" },
      { quoted: message }
    );
  }
  console.log(`
🎮 STARTING GAME
──────────────────────────────
Room        : ${remoteJid}
Player 1    : ${player1}
Player 2    : ${player2}
Sender Type : ${senderType}
──────────────────────────────
`);

  await startGame(sock, remoteJid, player1, player2, message, senderType);
}
export default {
  handle,
  Commands: ["suit"],
  OnlyPremium: false,
  OnlyOwner: false,
};
