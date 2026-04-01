import { findAbsen } from "../../lib/absen.js";
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

    // Get attendance data for the group
    const data = await findAbsen(remoteJid);

    let textNotif;

    if (data && data.member.length > 0) {
      const absenteesCount = data?.member?.length || 0;
      const remainingCount = totalMembers - absenteesCount; // Count of members who have not checked in

      // If there is attendance data and members
      const memberList = data.member
        .map((member, index) => `${index + 1}. @${member.split("@")[0]}`)
        .join("\n");
      textNotif =
        `📋 *Today's Attendance List:*\n\n${memberList}\n\n` +
        `✔️ *${absenteesCount} member(s) have checked in.*\n` +
        `⏳ *${remainingCount} member(s) have not checked in yet.*`;
    } else {
      // If no members have checked in yet
      textNotif =
        "⚠️ No one has checked in today.\n" +
        `⏳ *${totalMembers} member(s) have not checked in yet.*`;
    }

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listabsen:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while displaying the attendance list." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listabsen"],
  OnlyPremium: false,
  OnlyOwner: false,
};
