import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    sender,
    mentionedJid,
    isQuoted,
    content,
    prefix,
    command,
    senderType,
  } = messageInfo;

  try {
    // Validasi input
    if (!content?.trim()) {
      const tex =
        `_⚠️ Format: *${prefix + command} id 30*_\n\n` +
        `_💬 Example: *${prefix + command} @tag 30*_`;

      return sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
    }

    let [nomorHp, jumlahHariPremium] = content.split(" ");

    // Validasi input lebih lanjut
    if (!nomorHp || !jumlahHariPremium || isNaN(jumlahHariPremium)) {
      const tex = "⚠️ _Make sure format yang benar : .addprem username/id 30_";
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

      // --- Cek user single function ---
  let dataUsers = await findUser(nomorHp);
  let userJid = nomorHp;

  if (!dataUsers) {
    // Jika tidak ketemu, coba dengan JID
    const r = await convertToJid(sock, nomorHp);
    userJid = r;
    dataUsers = await findUser(r);

    if (!dataUsers) {
      return sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Pengguna dengan username/id ${nomorHp} not found._`,
        },
        { quoted: message }
      );
    }
  }

    const [docId, userData] = dataUsers;

    // Hitung waktu premium baru dari hari ini
    const currentDate = new Date();
    const addedPremiumTime = currentDate.setDate(
      currentDate.getDate() + parseInt(jumlahHariPremium)
    ); // Menambahkan hari

    // Update data premium user
    userData.premium = new Date(addedPremiumTime).toISOString(); // Simpan dalam format ISO 8601

    // Update data user di database
    await updateUser(userJid, userData);

    // Tampilkan pesan bahwa premium sudah ditambahkan
    const premiumEndDate = new Date(addedPremiumTime);
    const responseText = `_Masa Premium user_ ${userJid} _telah diperpanjang hingga:_ ${premiumEndDate.toLocaleString()}`;

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
  Commands: ["addprem", "addpremium"],
  OnlyPremium: false,
  OnlyOwner: true, // Hanya owner yang bisa akses
};
