import { findAbsen } from "../../lib/absen.js";
import { sendMessageWithMention } from "../../lib/utils.js";
import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Only Grub

  try {
    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const totalMembers = participants.length;

    const isAdmin = participants.some(
      (p) => (p.phoneNumber === sender || p.id === sender) && p.admin
    );
    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Ambil data absen untuk grup yang sesuai
    const data = await findAbsen(remoteJid);

    let textNotif;

    if (data && data.member.length > 0) {
      const absenteesCount = data?.member?.length || 0;
      const remainingCount = totalMembers - absenteesCount; // Jumlah yang belum absen

      // Jika ada data absen dan member
      const memberList = data.member
        .map((member, index) => `${index + 1}. @${member.split("@")[0]}`)
        .join("\n");
      textNotif =
        `📋 *Daftar Absen Hari Ini:*\n\n${memberList}\n\n` +
        `✔️ *${absenteesCount} orang telah absen.*\n` +
        `⏳ *Tersisa ${remainingCount} orang yang belum absen.*`;
    } else {
      // Jika belum ada member yang absen
      textNotif =
        "⚠️ No one has checked in today.\n" +
        `⏳ *Tersisa ${totalMembers} orang yang belum absen.*`;
    }

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listabsen:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while displaying daftar absen." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listabsen"],
  OnlyPremium: false,
  OnlyOwner: false,
};
