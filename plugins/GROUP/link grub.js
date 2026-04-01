import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, isGroup } = messageInfo;

  try {
    // Check whether the command is executed in a group
    if (!isGroup) {
      return await sock.sendMessage(
        remoteJid,
        { text: mess.general.isGroup },
        { quoted: message }
      );
    }

    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const groupInviteCode = await sock.groupInviteCode(remoteJid);

    // Build the reply text
    const text = `https://chat.whatsapp.com/${groupInviteCode}`;

    // Send the reply
    return await sock.sendMessage(remoteJid, { text }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ _An error occurred while displaying the group link._ \n\n_Make sure the Bot is an admin_",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["linkgrup", "linkgroup", "linkgc", "linkgrub", "linkgroub"],
  OnlyPremium: false,
  OnlyOwner: false,
};
