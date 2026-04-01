// PROMOTEME: Menjadikan owner ke admin jika bot sudah admin

import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, isGroup } = messageInfo;

  try {
    if (!isGroup) {
      return await sock.sendMessage(
        remoteJid,
        { text: mess.general.isGroup },
        { quoted: message }
      );
    }

    // Proses demote
    await sock.groupParticipantsUpdate(remoteJid, [sender], "promote");

    // Kirim pesan
    await sock.sendMessage(
      remoteJid,
      { text: "✅ _Successful Menjadi Admin_" },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in promoteme command:", error);

    // Kirim pesan kesalahan
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while trying to promote to admin. Make sure the Bot is already an admin",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["promoteme"],
  OnlyPremium: false,
  OnlyOwner: true,
};
