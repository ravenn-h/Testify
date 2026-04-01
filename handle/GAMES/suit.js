import {
  removeUser,
  getUser,
  isUserPlaying,
  updateUser,
  findDataByKey,
} from "../../database/temporary_db/suit.js";
import config from "../../config.js";
import { sendMessageWithMention } from "../../lib/utils.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return "draw";

  const winningCombinations = {
    batu: "gunting", // Batu mengalahkan Gunting
    gunting: "kertas", // Gunting mengalahkan Kertas
    kertas: "batu", // Kertas mengalahkan Batu
  };

  return winningCombinations[choice1] === choice2 ? "player1" : "player2";
}

async function process(sock, messageInfo) {
  const { fullText, message, sender, isGroup, senderType } = messageInfo;
  const { remoteJid } = messageInfo;
  
  let gameData = isGroup
    ? isUserPlaying(remoteJid)
      ? getUser(remoteJid)
      : null
    : findDataByKey({ player1: sender }) || findDataByKey({ player2: sender });

  if (!gameData) {
    return true;
  }

  const { player1, player2, groupId, status, answer_player1, answer_player2 } =
    gameData;

  if (!status && player2 === sender) {
    if (fullText.toLowerCase() === "terima" || fullText.toLowerCase() === "accept") {
      updateUser(groupId, { status: true });

      return await sock.sendMessage(
        groupId,
        {
          text: `🎯 _Game started!_ \n\n_Please message the bot and send *paper, rock or scissors*_\nwa.me/${config.phone_number_bot}`,
        },
        { quoted: message }
      );
    } else if (fullText.toLowerCase() === "tolak" || fullText.toLowerCase() === "decline") {
      removeUser(groupId);

      return await sock.sendMessage(
        groupId,
        { text: `Rock-Paper-Scissors game cancelled because the challenge was declined.` },
        { quoted: message }
      );
    }
  }

  if (fullText.toLowerCase().includes("nyerah") || fullText.toLowerCase().includes("give up")) {
    removeUser(groupId);
    return await sock.sendMessage(
      groupId,
      { text: `Rock-Paper-Scissors game ended because a player gave up.` },
      { quoted: message }
    );
  }

  if (["batu", "kertas", "gunting"].includes(fullText.toLowerCase())) {
    const choice = fullText.toLowerCase();
    if (player1 === sender && !answer_player1) {
      updateUser(groupId, { answer_player1: choice });
      await delay(1000);
      await sock.sendMessage(sender, {
        text: `Pilihanmu (${choice}) telah diterima.`,
      });
    } else if (player2 === sender && !answer_player2) {
      updateUser(groupId, { answer_player2: choice });
      await delay(3000);
      await sock.sendMessage(sender, {
        text: `Pilihanmu (${choice}) telah diterima.`,
      });
    } else {
      return false;
    }

    const updatedGameData = getUser(groupId);
    if (
      updatedGameData &&
      updatedGameData.answer_player1 &&
      updatedGameData.answer_player2
    ) {
      const winner = determineWinner(
        updatedGameData.answer_player1,
        updatedGameData.answer_player2
      );
      const choicePlayer1 = updatedGameData.answer_player1 || "not chosen";
      const choicePlayer2 = updatedGameData.answer_player2 || "not chosen";

      let resultMessage;
      if (winner === "player1") {
        resultMessage = `Winner is @${
          updatedGameData.player1.split`@`[0]
        } 🎉\n\nPilihan:\n@${
          updatedGameData.player1.split`@`[0]
        } : ${choicePlayer1}\n@${
          updatedGameData.player2.split`@`[0]
        } : ${choicePlayer2}`;
      } else if (winner === "player2") {
        resultMessage = `Pemenang adalah @${
          updatedGameData.player2.split`@`[0]
        } 🎉\n\nPilihan:\nPlayer 1 ( @${
          updatedGameData.player1.split`@`[0]
        } ): ${choicePlayer1}\nPlayer 2 ( @${
          updatedGameData.player2.split`@`[0]
        } ): ${choicePlayer2}`;
      } else {
        resultMessage = `It's a draw! 🤝\n\nPilihan:\n@${
          updatedGameData.player1.split`@`[0]
        } : ${choicePlayer1}\n@${
          updatedGameData.player2.split`@`[0]
        } : ${choicePlayer2}`;
      }
      removeUser(groupId);
      await delay(3000);
      await sendMessageWithMention(
        sock,
        groupId,
        resultMessage,
        message,
        senderType
      );
    }

    return false;
  }

  return true;
}

export const name = "Suit";
export const priority = 9;
export { process };
