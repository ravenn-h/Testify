import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, prefix, command } = messageInfo;

  // Validasi input kosong
  if (!content || content.trim() === "") {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } 50*_\n\n_Ket : *1* limit = *20* money_`,
      },
      { quoted: message }
    );
  }

  // Make sure `content` hanya angka
  const limitToBuy = parseInt(content.trim(), 10);
  if (isNaN(limitToBuy) || limitToBuy <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Jumlah limit harus berupa angka positif_\n\n_Contoh: *buylimit 50*_`,
      },
      { quoted: message }
    );
  }

  // Harga per limit
  const pricePerLimit = 20;
  const totalCost = limitToBuy * pricePerLimit;

  // Ambil data user
  const dataUsers = findUser(sender);

  if (!dataUsers) return;

  const [docId, userData] = dataUsers;

  // Validasi apakah user memiliki cukup saldo
  if (userData.money < totalCost) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Your balance is insufficient to buy *${limitToBuy}* limit(s)._\n\n_Total price:_ ${totalCost} money\n_Your balance:_ ${userData.money} money`,
      },
      { quoted: message }
    );
  }

  // Update data user
  updateUser(sender, {
    limit: userData.limit + limitToBuy, // Tambah limit
    money: userData.money - totalCost, // Kurangi saldo
  });

  // Kirim pesan berhasil
  return await sock.sendMessage(
    remoteJid,
    {
      text: `✅ _Limit purchase successful! 🎉_\n\n_Your limit increased by: *${limitToBuy}*_\n_Your balance:_ ${
        userData.money - totalCost
      } money`,
    },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["buylimit"],
  OnlyPremium: false,
  OnlyOwner: false,
};
