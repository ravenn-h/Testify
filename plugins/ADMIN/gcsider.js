import { sendMessageWithMention } from "../../lib/utils.js";
import mess from "../../strings.js";
import { getActiveUsers } from "../../lib/users.js";
import { getGroupMetadata } from "../../lib/cache.js";

const TOTAL_HARI_SIDER = 30; // maximum inactivity days before considered a side account

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

    const listNotSider = await getActiveUsers(TOTAL_HARI_SIDER);

    // Check if there are no side account members in the group
    if (listNotSider.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "📋 _No side account members in this group._" },
        { quoted: message }
      );
    }

    // List of side account members in the group (all group members except those in listNotSider)
    const memberList = participants
      .filter(
        (participant) =>
          !listNotSider.some((active) => active.id === participant.id)
      ) // Get members not in listNotSider
      .map((participant) => `◧ @${participant.id.split("@")[0]}`) // Format output for group members
      .join("\n");

    // Count side account members in the group
    const countSider = participants.filter(
      (participant) =>
        !listNotSider.some((active) => active.id === participant.id)
    ).length;

    // Text of the message to be sent
    const teks_sider = `_*${countSider} of ${participants.length}* Group Members in ${groupMetadata.subject} Are Side Accounts_
        
_*Reasons:*_
➊ _Inactive for more than ${TOTAL_HARI_SIDER} days_
➋ _Joined but Never Participated_

_Please be active in the group as member cleanup may happen at any time_

_*Side Account Member List*_
${memberList}`;

    await sendMessageWithMention(
      sock,
      remoteJid,
      teks_sider,
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
  Commands: ["gcsider"],
  OnlyPremium: false,
  OnlyOwner: false,
};
