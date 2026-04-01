import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, command, prefix } = messageInfo;

  // Validasi input kosong
  if (!content || content.trim() === "") {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Masukkan format yang valid_\n\n_Contoh: *${
          prefix + command
        } @tag 50*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Pisahkan konten
    const args = content.trim().split(/\s+/);
    if (args.length < 2) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Format not valid. Contoh:_ *${
            prefix + command
          } @tag 50*`,
        },
        { quoted: message }
      );
    }

    const target = args[0]; // Nomor penerima atau tag
 
    const r = await convertToJid(sock, target);
    if(!r) {
       return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _User not found, make sure the target has chatted in this group_` },
        { quoted: message }
      );
    }
    const limitToSend = parseInt(args[1], 10);

    // Validasi jumlah limit
    if (isNaN(limitToSend) || limitToSend <= 0) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Jumlah limit harus berupa angka positif_\n\n_Contoh: *${
            prefix + command
          } @tag 50*_`,
        },
        { quoted: message }
      );
    }

    // Fungsi helper: ekstrak hanya nomor
    function extractNumber(input) {
      input = input
        .trim()
        .replace(/^@/, "") // hapus awalan @
        .replace(/@s\.whatsapp\.net$/, ""); // hapus akhiran @s.whatsapp.net

      // Ambil hanya angka
      const number = input.replace(/[^0-9]/g, "");

      // Kalau hasilnya tidak ada angka sama sekali, kembalikan null atau ""
      return number.length > 0 ? number : null;
    }

    // Ambil nomor murni target & sender
    const targetNumber = extractNumber(r); // si penerima
    const senderNumber = extractNumber(sender); // si pengirim

    // Validasi: Tidak bisa kirim ke diri sendiri
    if (targetNumber === senderNumber) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _You cannot send limit to your own number._` },
        { quoted: message }
      );
    }

    // Ambil data user pengirim
    const senderData = await findUser(sender);

    if (!senderData) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _You are not yet registered_` },
        { quoted: message }
      );
    }

    const [docId1, userData1] = senderData;

    // Validasi apakah pengirim memiliki cukup limit
    if (userData1.limit < limitToSend) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Your limit is insufficient to send ${limitToSend} limit(s)._`,
        },
        { quoted: message }
      );
    }

    // Ambil data penerima
    const receiverData = await findUser(r);

    if (!receiverData) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Pengguna dengan nomor/tag tersebut not found._` },
        { quoted: message }
      );
    }

    const [docId2, userData2] = receiverData;

    // Update limit user pengirim dan penerima
    await updateUser(sender, { limit: userData1.limit - limitToSend });
    await updateUser(targetNumber, { limit: userData2.limit + limitToSend });

    // Kirim pesan berhasil
    return await sock.sendMessage(
      remoteJid,
      {
        text: `✅ _Successfully sent ${limitToSend} limit(s) to ${targetNumber}._\n\nType *.me* to view your account details.`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("An error occurred:", error);

    // Kirim pesan error
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ An error occurred while processing your request. Please try again nanti.`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["sendlimit"],
  OnlyPremium: false,
  OnlyOwner: false,
};
