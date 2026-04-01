// Change Group Description

import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, content, prefix, command } =
    messageInfo;
  if (!isGroup) return; // Groups only

  try {
    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(
      (p) => (p.phoneNumber === sender || p.id === sender) && p.admin
    );
    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Validate input
    if (!content.trim() || content.trim() == "") {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } new description*_`,
        },
        { quoted: message }
      );
    }

    // Update group description
    await sock.groupUpdateDescription(remoteJid, content);

    // Send success message
    await sock.sendMessage(
      remoteJid,
      {
        text: `✅ _Group description successfully changed_ \n\n${content}`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in edit deskripsi command:", error);

    // Send error message
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while trying to rename the group. Make sure the format is correct and you have permission.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["editdesk", "editdeskripsi"],
  OnlyPremium: false,
  OnlyOwner: false,
};
