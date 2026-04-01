import { findAbsen, updateAbsen, createAbsen } from "../../lib/absen.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender } = messageInfo;
  if (!isGroup) return; // Only Grub

  try {
    const data = await findAbsen(remoteJid);
    let textNotif;

    if (data) {
      // Jika already exists absen
      // Cek apakah sender sudah absen
      if (data.member.includes(sender)) {
        textNotif = "⚠️ _Always checking in!_ _You have already checked in today!_";
      } else {
        // Tambahkan sender ke daftar member yang absen
        const updateData = {
          member: [...data.member, sender],
        };
        await updateAbsen(remoteJid, updateData);
        textNotif = "✅ _Check-in successful!_";
      }
    } else {
      // Pertama kali absen
      const insertData = {
        member: [sender],
      };
      await createAbsen(remoteJid, insertData);
      textNotif = "✅ _Check-in successful!_";
    }

    // Kirim pesan ke user
    return await sock.sendMessage(
      remoteJid,
      { text: textNotif },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error handling absen:", error);
    // Kirim pesan error ke user jika ada kesalahan
    return await sock.sendMessage(
      remoteJid,
      { text: "An error occurred while processing the check-in." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["absen"],
  OnlyPremium: false,
  OnlyOwner: false,
};
