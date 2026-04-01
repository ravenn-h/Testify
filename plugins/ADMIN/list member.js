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

    // Filter non-admin participants
    const memberList = participants
      .filter((participant) => participant.admin === null)
      .map((member, index) => `◧ @${member.id.split("@")[0]}`)
      .join("\n");

    // Check if there are no non-admin members
    if (!memberList) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ No non-admin members in this group." },
        { quoted: message }
      );
    }

    // Non-admin member list notification text
    const textNotif = `📋 *Non-Admin Member List:*\n\n${memberList}`;

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listmember:", error);
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while displaying the non-admin member list.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listmember"],
  OnlyPremium: false,
  OnlyOwner: false,
};
