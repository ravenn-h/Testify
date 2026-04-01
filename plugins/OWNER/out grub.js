async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, sender } = messageInfo;

  try {
    // Validasi format input
    if (!content.trim() || !content.includes("@g.us")) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Format not valid._\n\nSilakan ketik: *.${command} IDGRUB*\n\nExample: ${
            prefix + command
          } 120363204743427585@g.us`,
        },
        { quoted: message }
      );
      return;
    }

    // Mencoba keluar dari grup
    try {
      await sock.groupLeave(content);
      await sock.sendMessage(
        remoteJid,
        {
          text: `✅ _Successful keluar dari grup dengan ID: *${content}*_`,
        },
        { quoted: message }
      );
    } catch (err) {
      console.error("Gagal keluar dari grup:", err);
      await sock.sendMessage(
        remoteJid,
        {
          text: "⚠️ Failed to leave the group. Make sure the group ID is correct or the bot has sufficient permission.",
        },
        { quoted: message }
      );
    }
  } catch (error) {
    // Kirim pesan kesalahan umum
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ _An error occurred while processing your request._",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["outgrup", "outgroup", "outgroup", "outgroub", "outgc"],
  OnlyPremium: false,
  OnlyOwner: true,
};
