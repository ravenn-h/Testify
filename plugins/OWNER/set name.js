async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validasi input nama
    if (!content || !content.trim()) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } resbot 4.0*_`,
        },
        { quoted: message }
      );
    }

    // Perbarui nama profil bot
    await sock.updateProfileName(content);

    // Kirim pesan sukses
    return await sock.sendMessage(
      remoteJid,
      { text: `_Sukses changing nama bot ke *${content}*_` },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing message:", error);

    // Kirim pesan error
    return await sock.sendMessage(
      remoteJid,
      { text: "An error occurred while processing the message." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["setname"],
  OnlyPremium: false,
  OnlyOwner: true,
};
