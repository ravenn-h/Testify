// PROMOTE ALL: Promote all members to admin
import mess from "../../strings.js";
import { sendMessageWithMention } from "../../lib/utils.js";
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

    const members = groupMetadata.participants;

    // Filter only members who are not yet admins
    const nonAdmins = members
      .filter((participant) => !participant.admin)
      .map((participant) => participant.id);

    if (nonAdmins.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "_All members are already admins._" },
        { quoted: message }
      );
    }

    // Promote all non-admins to admin
    await sock.groupParticipantsUpdate(remoteJid, nonAdmins, "promote");

    // Send success message with number of promoted members
    await sendMessageWithMention(
      sock,
      remoteJid,
      `*${nonAdmins.length}* _member(s) have been promoted to admin._`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in promoteall command:", error);

    // Send error message
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while trying to promote members to admin.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["promoteall"],
  OnlyPremium: false,
  OnlyOwner: false,
};
