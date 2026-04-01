import { resetGroupData } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";
import { deleteCache, clearCache } from "../../lib/globalCache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, prefix, command } = messageInfo;

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

    // If command is empty or just spaces
    if (!content.trim()) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _This command will delete all lists in this group_ \n\nType *${
            prefix + command
          } -y* to proceed.`,
        },
        { quoted: message }
      );
      return;
    }

    if (content.trim() === "-y") {
      await resetGroupData(remoteJid);
      deleteCache(`list-group`); // Reset cache
      await sock.sendMessage(
        remoteJid,
        { text: "_All lists in this group have been successfully reset_" },
        { quoted: message }
      );
    }
  } catch (error) {
    await sock.sendMessage(
      remoteJid,
      { text: "_❌ Sorry, an error occurred while processing data._" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["resetlist"],
  OnlyPremium: false,
  OnlyOwner: false,
};
