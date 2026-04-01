async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, prefix, command } = messageInfo;

  try {
    // Validate empty or invalid format input
    if (
      !content ||
      content.trim() === "" ||
      !content.includes("whatsapp.com")
    ) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } https://chat.whatsapp.com/xxx*_`,
        },
        { quoted: message }
      );
    }

    // Send ⏰ reaction to indicate processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Extract group ID from link
    const groupId = content.split("chat.whatsapp.com/")[1];
    if (!groupId) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Group link not valid.` },
        { quoted: message }
      );
    }

    // Join group using invite link
    try {
      await sock.groupAcceptInvite(groupId);
      await sock.sendMessage(
        remoteJid,
        { text: `✅ Successfully joined the group.` },
        { quoted: message }
      );
    } catch (error) {
      let info = "_Make sure the group link is valid._";

      // Check error message
      if (error instanceof Error && error.message.includes("not-authorized")) {
        info = `_You may have been removed from the group before. Solution: invite the bot back or add it manually._`;
      }

      if (error instanceof Error && error.message.includes("conflict")) {
        info = `_Bot was already in the group previously_`;
      }

      // Send error message to user
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Failed to join the group._\n\n${info}`,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ An error occurred while processing command.` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["join"],
  OnlyPremium: false,
  OnlyOwner: true,
};
