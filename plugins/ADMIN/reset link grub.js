import { getGroupMetadata } from "../../lib/cache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender } = messageInfo;
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

    await sock.groupRevokeInvite(remoteJid);
    await sock.sendMessage(
      remoteJid,
      { text: mess.action.resetgc },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in resetlinkgc command:");

    // Send error message
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while resetting the group link. Make sure the bot is an admin",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: [
    "resetlinkgc",
    "resetlinkgrup",
    "resetlinkgroup",
    "resetlinkgrub",
    "resetlinkgroub",
  ],
  OnlyPremium: false,
  OnlyOwner: false,
};
