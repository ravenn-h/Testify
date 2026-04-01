import mess from "../../strings.js";
import {
  addUser,
  removeUser,
  getUser,
  isUserPlaying,
} from "../../database/temporary_db/tebak bom.js";
import { logWithTime } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, fullText } = messageInfo;

  // Check if message contains the word "bom"
  if (!fullText.includes("bom")) return true;

  // Check if user is already playing
  if (isUserPlaying(remoteJid)) {
    await sock.sendMessage(
      remoteJid,
      { text: mess.game.isPlaying },
      { quoted: message }
    );
    return;
  }

  // Fruit and bomb
  const buah = [
    "🍏",
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍉",
    "🍇",
    "🍓",
    "🍒",
    "🍑",
    "🥭",
    "🍅",
  ];

  const acakArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const tambahBom = (grid) => {
    const posisiBom = Math.floor(Math.random() * 9);
    grid[Math.floor(posisiBom / 3)][posisiBom % 3] = "💣";
    return posisiBom + 1;
  };

  // Generate fruit grid
  const grid = [
    acakArray(buah.slice(0, 3)),
    acakArray(buah.slice(3, 6)),
    acakArray(buah.slice(6, 9)),
  ];

  const posisiBomReal = tambahBom(grid);

  const bomView_User = `1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣`;
  const bomView_User_Abjad = `A B C D E F G H I`;

  // Add user to database
  addUser(remoteJid, {
    posisiBom: posisiBomReal,
    terjawab: [],
    ListBuah: grid,
    bomView_User: bomView_User_Abjad,
    hadiah: 5, // Prize amount if won
    moneyMenang: 10,
    moneyKalah: 25, // Deduction amount if lost
    command: fullText,
  });

  logWithTime("Tebak Bom", `BombPosition: ${posisiBomReal}`);

  // Send initial game message
  await sock.sendMessage(
    remoteJid,
    { text: `_*Bomb Guessing Game Started*_\n\n${bomView_User}` },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["tebak", "tebakbom"],
  OnlyPremium: false,
  OnlyOwner: false,
};
