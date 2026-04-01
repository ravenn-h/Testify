// DEMOTE ALL: Demote all admins to regular users
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
    const members = participants;

    // Filter only members who are admins
    const admins = members
      .filter((participant) => participant.admin)
      .map((participant) => participant.id);

    if (admins.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "No admins to demote." },
        { quoted: message }
      );
    }

    // Demote all admins to regular users
    await sock.groupParticipantsUpdate(remoteJid, admins, "demote");

    // Send success message with number of demoted admins
    await sendMessageWithMention(
      sock,
      remoteJid,
      `*${admins.length}* _admin(s) have been demoted to regular users._`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in demoteall command:", error);

    // Send error message
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while trying to demote admins to regular users.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["demoteall"],
  OnlyPremium: false,
  OnlyOwner: false,
};
