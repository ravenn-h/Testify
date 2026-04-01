async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validasi input
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
        prefix + command
      } nama group*_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    // Membuat grup
    const creategc = await sock.groupCreate(content, [
      "6285246154386@s.whatsapp.net",
    ]);

    // // Mengunci pengaturan grup untuk admin saja
    await sock
      .groupSettingUpdate(creategc.id, "locked")
      .then(() =>
        console.log(
          "Sekarang *Hanya Admin Yang Dapat Mengedit Pengaturan Grup*"
        )
      )
      .catch((err) => console.error("Error mengatur grup:", err));

    // Mendapatkan tautan undangan grup
    const response_creategc = await sock.groupInviteCode(creategc.id);

    // Mengirimkan balasan
    const replyText = `「 *Create Group* 」\n\n_▸ Link : https://chat.whatsapp.com/${response_creategc}_`;
    return await sock.sendMessage(
      remoteJid,
      { text: replyText },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error membuat grup:", error);
    return await sock.sendMessage(
      remoteJid,
      { text: "⚠️ _An error occurred while membuat grup._" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: [
    "creategrup",
    "creategroup",
    "creategc",
    "creategroup",
    "creategroub",
  ],
  OnlyPremium: false,
  OnlyOwner: true,
};
