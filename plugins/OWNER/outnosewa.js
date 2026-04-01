import { listSewa } from "../../lib/sewa.js";
import { groupFetchAllParticipating } from "../../lib/cache.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handle(sock, messageInfo) {
  const { remoteJid } = messageInfo;

  try {
    const sewa = await listSewa();
    const allGroups = await groupFetchAllParticipating(sock);

    let count = 0;
    let listMessage = "*▧ 「 LIST OF UNSUBSCRIBED GROUPS 」*\n\n";

    for (const [groupId, groupData] of Object.entries(allGroups)) {
      if (!sewa[groupId]) {
        try {
          await sock.groupLeave(groupId);
          await sleep(2000); // 2 second delay to avoid spam
          listMessage += `╭───────────────
│ *Subject* : ${groupData.subject}
│ *Group ID* : ${groupId}
╰───────────────\n\n`;
          count++;
        } catch (leaveErr) {
          console.error(`Failed to leave group ${groupId}:`, leaveErr.message);
          listMessage += `⚠️ *Failed to leave group: ${groupData.subject} (${groupId})*\n\n`;
        }
      }
    }

    if (count === 0) {
      listMessage = "✅ _All groups have an active subscription._";
    } else {
      listMessage += `*Total left: ${count} group(s).*`;
    }

    await sock.sendMessage(remoteJid, { text: listMessage });
  } catch (error) {
    await sock.sendMessage(remoteJid, {
      text: "_An error occurred while fetching unsubscribed group data._",
    });
  }
}

export default {
  handle,
  Commands: ["outnosewa"],
  OnlyPremium: false,
  OnlyOwner: true,
};
