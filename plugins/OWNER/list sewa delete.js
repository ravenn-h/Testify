import { listSewa, deleteSewa } from "../../lib/sewa.js";
import { selisihHari } from "../../lib/utils.js";
import { groupFetchAllParticipating } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid } = messageInfo;

  try {
    const sewa = await listSewa();

    if (!sewa || Object.keys(sewa).length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ _No subscription list found_",
      });
      return;
    }

    const sortedSewa = Object.entries(sewa).sort(
      ([, a], [, b]) => a.expired - b.expired
    );
    const allGroups = await groupFetchAllParticipating(sock);

    let listMessage = "*▧ 「 LIST SEWA 」*\n\n";
    let count = 0;

    for (const [groupId, data] of sortedSewa) {
      const subject =
        allGroups[groupId]?.subject || "Group Name Not Found";

      if (subject === "Group Name Not Found") {
        // Delete subscription data based on group ID
        await deleteSewa(groupId);
        continue;
      }

      listMessage += `╭─
│ Subject : ${subject}
│ Group ID : ${groupId}
│ Expired : ${selisihHari(data.expired)}
╰────────────────────────\n`;

      count++;
    }

    listMessage += `\n*Total : ${count}*`;

    await sock.sendMessage(remoteJid, {
      text: listMessage,
    });
  } catch (error) {
    await sock.sendMessage(remoteJid, {
      text: "_An error occurred while retrieving the subscription list_",
    });
  }
}

export default {
  handle,
  Commands: ["listsewa2"],
  OnlyPremium: false,
  OnlyOwner: true,
};
