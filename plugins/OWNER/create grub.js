async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate input
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
        prefix + command
      } group name*_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    // Create group
    const creategc = await sock.groupCreate(content, [
      "6285246154386@s.whatsapp.net",
    ]);

    // Lock group settings to admin only
    await sock
      .groupSettingUpdate(creategc.id, "locked")
      .then(() =>
        console.log(
          "Now *Only Admins Can Edit Group Settings*"
        )
      )
      .catch((err) => console.error("Error setting group:", err));

    // Get group invite link
    const response_creategc = await sock.groupInviteCode(creategc.id);

    // Send reply
    const replyText = `「 *Create Group* 」\n\n_▸ Link : https://chat.whatsapp.com/${response_creategc}_`;
    return await sock.sendMessage(
      remoteJid,
      { text: replyText },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error creating group:", error);
    return await sock.sendMessage(
      remoteJid,
      { text: "⚠️ _An error occurred while creating group._" },
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
