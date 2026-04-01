import {
  addUser,
  isUserPlaying,
} from "../../database/temporary_db/blackjack.js";
import { findUser, updateUser } from "../../lib/users.js";

let mode = "hard"; // normal, hard, setan (setan mode is unwinnable)

let kartu_blackjack_player = [];
let kartu_blackjack_computer = [];

if (mode === "normal") {
  kartu_blackjack_player = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "J",
    "K",
    "Q",
  ];
  kartu_blackjack_computer = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "J",
    "K",
    "Q",
  ];
} else if (mode === "hard") {
  kartu_blackjack_player = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "J",
    "K",
    "Q",
  ];
  kartu_blackjack_computer = ["8", "9", "J", "K", "Q"];
} else if (mode === "setan") {
  kartu_blackjack_player = ["A", "2", "3", "4", "5", "6", "7", "8", "9"];
  kartu_blackjack_computer = ["J", "K", "Q"];
}

function getRandomCard(deck) {
  return deck[Math.floor(Math.random() * deck.length)];
}

// Function to calculate card values
function getNilaiKartu_Blackjack(kartu) {
  return kartu.reduce((total, kartu) => {
    if (["J", "Q", "K"].includes(kartu)) return total + 10;
    if (kartu === "A") return total + 1; // Can be set to 1 or 11
    return total + (parseInt(kartu) || 0);
  }, 0);
}

// Function to handle game
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, fullText, sender } = messageInfo;

  // Check if user is already playing
  if (isUserPlaying(sender)) {
    return await sock.sendMessage(
      remoteJid,
      { text: "⚠️ _A Blackjack game is already in progress._" },
      { quoted: message }
    );
  }

  // Validate bet input
  const taruhan = parseInt(content);
  if (!taruhan || taruhan <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_Enter a valid bet amount (example: *.blackjack 500*)_`,
      },
      { quoted: message }
    );
  }

  // Fetch user data
  const dataUsers = await findUser(sender);
  if (!dataUsers) {
    return await sock.sendMessage(
      remoteJid,
      { text: "User data not found!" },
      { quoted: message }
    );
  }

  const [docId, userData] = dataUsers;

  const moneyUsers = userData.money || 0;
  if (moneyUsers < taruhan) {
    return await sock.sendMessage(
      remoteJid,
      { text: `You do not have enough money.\n\nYour Money: ${moneyUsers}` },
      { quoted: message }
    );
  }

  const playerCards = [
    getRandomCard(kartu_blackjack_player),
    getRandomCard(kartu_blackjack_player),
  ];
  const computerCards = [
    getRandomCard(kartu_blackjack_computer),
    getRandomCard(kartu_blackjack_computer),
  ];

  const totalPlayer = getNilaiKartu_Blackjack(playerCards);

  // Update user balance
  const updatedMoney = moneyUsers - taruhan;
  await updateUser(sender, { money: updatedMoney });

  // Add user to game
  addUser(sender, {
    playerCards,
    computerCards,
    taruhan,
    mode,
  });

  const replyMessage = `🎰 *BLACKJACK* 🎰

🃏 Your Cards: ${playerCards.join(", ")}
🎯 Total: ${totalPlayer}

💻 Computer Cards: ${computerCards[0]}, ?

💰 Bet: *${taruhan}*

Type *hit* to draw an additional card.
Type *stand* to end your turn.`;

  await sock.sendMessage(
    remoteJid,
    { text: replyMessage },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["bj", "blackjack"],
  OnlyPremium: false,
  OnlyOwner: false,
};
