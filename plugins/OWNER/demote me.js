// DEMOTEME: Demotes the owner to member if the bot is already an admin

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

    // Process demote
    await sock.groupParticipantsUpdate(remoteJid, [sender], "demote");

    // Send message
    await sock.sendMessage(
      remoteJid,
      { text: "✅ _Successfully Demoted to Member_" },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in promoteme command:");

    // Send error message
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while trying to demote to member. Make sure the Bot is already an admin",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["demoteme"],
  OnlyPremium: false,
  OnlyOwner: true,
};
