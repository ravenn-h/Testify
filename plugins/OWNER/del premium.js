import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, prefix, command, senderType } =
    messageInfo;

  try {
    // Validasi input
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
        prefix + command
      } 6285246154386*_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    let nomorHp = content;

    // Validasi input lebih lanjut
    if (!nomorHp) {
      const tex = "_Make sure format yang benar : .delprem 6285246154386_";
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    nomorHp = nomorHp.replace(/\D/g, "");

    // Ambil data user
    let dataUsers = await findUser(nomorHp);

    // Jika user not found, tambahkan user baru
    if (!dataUsers) {
      return await sock.sendMessage(
        remoteJid,
        { text: "none user di temukan" },
        { quoted: message }
      );
    }

    const [docId, userData] = dataUsers;

    userData.premium = null;

    // Update data user di database
    await updateUser(nomorHp, userData);

    const responseText = `_Pengguna_ @${
      nomorHp.split("@")[0]
    } _telah di hapus dari premium:_`;

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium addition:", error);

    // Kirim pesan kesalahan ke user
    await sock.sendMessage(
      remoteJid,
      {
        text: "An error occurred while processing data. Please try again nanti.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["delprem", "delpremium"],
  OnlyPremium: false,
  OnlyOwner: true, // Hanya owner yang bisa akses
};
