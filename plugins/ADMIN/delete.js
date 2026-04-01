import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, isQuoted, sender } = messageInfo;
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

    // If there is a quoted message, delete it
    if (isQuoted) {
      await sock.sendMessage(remoteJid, {
        delete: {
          remoteJid,
          id: isQuoted.id,
          participant: isQuoted.sender,
        },
      });
    } else {
      await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _Reply to the message you want to delete_" },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error handling command:", error);
    await sock.sendMessage(remoteJid, {
      text: "An error occurred. Please try again.",
    });
  }
}

export default {
  handle,
  Commands: ["del", "delete"],
  OnlyPremium: false,
  OnlyOwner: false,
};
