import { sendMessageWithMention } from "../../lib/utils.js";
import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
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

    // List all group members
    const memberList = participants
      .map((member, index) => `◧ @${member.id.split("@")[0]}`)
      .join("\n");

    // Check if there are no members
    if (!memberList) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _No members in this group._" },
        { quoted: message }
      );
    }

    // All group members notification text
    const textNotif = `📋 *All Group Members: ${participants.length}*\n\n${memberList}`;

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listalluser:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while displaying all group members." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listalluser"],
  OnlyPremium: false,
  OnlyOwner: false,
};
