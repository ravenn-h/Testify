import { findAbsen } from "../../lib/absen.js";
import { sendMessageWithMention } from "../../lib/utils.js";
import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Can only be used in groups

  try {
    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const totalMembers = participants.length;

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

    // Get attendance data
    const data = await findAbsen(remoteJid);
    const absenMembers = data?.member || [];

    // Get list of members who have not checked in
    const noAbsenMembers = participants
      .filter((p) => !absenMembers.includes(p.id))
      .map((p, index) => `${index + 1}. @${p.id.split("@")[0]}`);

    let textNotif;
    if (noAbsenMembers.length > 0) {
      textNotif =
        `📋 *Members Who Have Not Checked In:*\n\n${noAbsenMembers.join("\n")}\n\n` +
        `⏳ *${noAbsenMembers.length} member(s) have not checked in today.*`;
    } else {
      textNotif = "✅ All members have checked in today.";
    }

    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listnoabsen:", error);
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while displaying the list of members who have not checked in.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listnoabsen"],
  OnlyPremium: false,
  OnlyOwner: false,
};
