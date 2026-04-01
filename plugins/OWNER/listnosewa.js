import { listSewa } from "../../lib/sewa.js";
import { groupFetchAllParticipating } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid } = messageInfo;

  try {
    // Get all subscription data
    const sewa = await listSewa();

    // Get all groups the bot is in
    const allGroups = await groupFetchAllParticipating(sock);

    let count = 0;
    let listMessage = "*▧ 「 LIST NON-SUBSCRIPTION GROUPS 」*\n\n";

    // Iterate all groups
    for (const [groupId, groupData] of Object.entries(allGroups)) {
      if (!sewa[groupId]) {
        listMessage += `╭─
│ Subject : ${groupData.subject}
│ Group ID : ${groupId}
╰────────────────────────\n`;
        count++;
      }
    }

    listMessage += `\n*Total : ${count}*`;

    if (count === 0) {
      listMessage = "✅ _All groups are subscription groups._";
    }

    await sock.sendMessage(remoteJid, {
      text: listMessage,
    });
  } catch (error) {
    await sock.sendMessage(remoteJid, {
      text: "_An error occurred while retrieving non-subscription group data._",
    });
  }
}

export default {
  handle,
  Commands: ["listnosewa"],
  OnlyPremium: false,
  OnlyOwner: true,
};
