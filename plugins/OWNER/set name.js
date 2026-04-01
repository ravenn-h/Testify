async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate name input
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

    // Update bot profile name
    await sock.updateProfileName(content);

    // Send success message
    return await sock.sendMessage(
      remoteJid,
      { text: `_Successfully changed bot name to *${content}*_` },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing message:", error);

    // Send error message
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
