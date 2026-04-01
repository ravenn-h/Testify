// PROMOTEME: Promotes the owner to admin if the bot is already an admin

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

    // Process promote
    await sock.groupParticipantsUpdate(remoteJid, [sender], "promote");

    // Send message
    await sock.sendMessage(
      remoteJid,
      { text: "✅ _Successfully Promoted to Admin_" },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in promoteme command:", error);

    // Send error message
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
