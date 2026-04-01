async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, sender } = messageInfo;

  try {
    // Validate input format
    if (!content.trim() || !content.includes("@g.us")) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Format not valid._\n\nPlease type: *.${command} GROUPID*\n\nExample: ${
            prefix + command
          } 120363204743427585@g.us`,
        },
        { quoted: message }
      );
      return;
    }

    // Attempt to leave the group
    try {
      await sock.groupLeave(content);
      await sock.sendMessage(
        remoteJid,
        {
          text: `✅ _Successfully left the group with ID: *${content}*_`,
        },
        { quoted: message }
      );
    } catch (err) {
      console.error("Failed to leave group:", err);
      await sock.sendMessage(
        remoteJid,
        {
          text: "⚠️ Failed to leave the group. Make sure the group ID is correct or the bot has sufficient permission.",
        },
        { quoted: message }
      );
    }
  } catch (error) {
    // Send general error message
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
