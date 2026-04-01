import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

const FITUR = false; // jadikan true jika ingin maksa di aktifkan

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, content, prefix, command } =
    messageInfo;

  if (!FITUR) {
    await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ This feature is currently disabled due to ban risk_`,
      },
      { quoted: message }
    );
    return;
  }

  if (!isGroup) {
    // Khusus Grub
    await sock.sendMessage(
      remoteJid,
      { text: mess.general.isGroup },
      { quoted: message }
    );
    return;
  }

  // Mendapatkan metadata grup
  const groupMetadata = await getGroupMetadata(sock, remoteJid);
  const participants = groupMetadata.participants;
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

  // Validasi input nomor telepon
  const nomor = content.replace(/[^0-9]/g, "");
  const whatsappJid = `${nomor}@s.whatsapp.net`;

  // Validasi format nomor telepon
  if (!/^\d{10,15}$/.test(nomor)) {
    // Panjang nomor telepon minimal 10 dan maksimal 15 digit
    await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } 6285246154386*_`,
      },
      { quoted: message }
    );
    return;
  }

  try {
    // Menambahkan user ke grup
    const response = await sock.groupParticipantsUpdate(
      remoteJid,
      [whatsappJid],
      "add"
    );
    const status = response[0]?.status;

    if (status == 409) {
      // Jika nomor already exists di grup
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Number *${nomor}* is already in the group._` },
        { quoted: message }
      );
    } else if (status == 403) {
      // Jika pengaturan privasi tidak memungkinkan penambahan
      await sock.sendMessage(
        remoteJid,
        {
          text: `❌ _Cannot add number *${nomor}* due to the user's privacy settings._`,
        },
        { quoted: message }
      );
    } else {
      await sock.sendMessage(
        remoteJid,
        { text: `✅ _Successfully added member *${nomor}* to the group._` },
        { quoted: message }
      );
    }
  } catch (error) {
    // Jika terjadi error yang tidak terduga
    await sock.sendMessage(
      remoteJid,
      {
        text: `❌ _Cannot add number *${nomor}* to the group._`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["add"],
  OnlyPremium: false,
  OnlyOwner: false,
};
