import mess from "../../strings.js";
import {
  addUser,
  removeUser,
  getUser,
  isUserPlaying,
} from "../../database/temporary_db/tictactoe.js";
import TicTacToe from "../../lib/games/tictactoe.js";

const WAKTU_GAMES = 60; // 60 seconds

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, isGroup, command } = messageInfo;

  const groupOnlyMessage = { text: mess.game.isGroup };
  const waitingMessage = `Waiting for partner (${WAKTU_GAMES} s)... \n\nType *${command}* to respond`;
  const timeoutMessage = `⏳ Time's up! No opponent wanted to play`;

  // Check if game is in a group
  if (!isGroup) {
    return sock.sendMessage(remoteJid, groupOnlyMessage, { quoted: message });
  }

  // Check if user is already playing
  const isPlaying = isUserPlaying(remoteJid);
  if (isPlaying) {
    const currentGame = getUser(remoteJid);
    if (currentGame.state === "PLAYING") return true;
    await sock.sendMessage(
      remoteJid,
      { text: mess.game.isPlaying },
      { quoted: message }
    );
    return true;
  }

  // Add user to database
  addUser(remoteJid, {
    id_room: remoteJid,
    playerX: sender,
    playerO: null,
    state: "WAITING",
    game: new TicTacToe(sender, "o"),
  });

  // Set 120-second timer
  setTimeout(async () => {
    if (isUserPlaying(remoteJid)) {
      const currentGame = getUser(remoteJid);
      if (currentGame.state === "PLAYING") return true;

      removeUser(remoteJid); // Remove user if time runs out
      await sock.sendMessage(
        remoteJid,
        { text: timeoutMessage },
        { quoted: message }
      );
      return true;
    }
  }, WAKTU_GAMES * 1000);

  // Send waiting message
  await sock.sendMessage(
    remoteJid,
    { text: waitingMessage },
    { quoted: message }
  );
  return true;
}

export default {
  handle,
  Commands: ["ttc", "ttt", "tictactoe"],
  OnlyPremium: false,
  OnlyOwner: false,
};
