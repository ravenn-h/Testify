import { listSewa } from "../../lib/sewa.js";
import { selisihHari } from "../../lib/utils.js";
import { groupFetchAllParticipating } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message } = messageInfo;

  try {
    // Get list data by group
    const sewa = await listSewa();

    // If no list found
    if (!sewa || Object.keys(sewa).length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ _No subscription list found_",
      });
      return;
    }

    // Convert object to array and sort by earliest expired time
    const sortedSewa = Object.entries(sewa).sort(
      ([, a], [, b]) => a.expired - b.expired
    );

    const allGroups = await groupFetchAllParticipating(sock);

    // Build list to display
    let listMessage = "*▧ 「 LIST SEWA* 」\n\n";
    sortedSewa.forEach(([groupId, data], index) => {
      // Get subject from allGroups if available
      const subject = allGroups[groupId]
        ? allGroups[groupId].subject
        : "Group Name Not Found";

      listMessage += `╭─
│ Subject : ${subject}
│ Group ID : ${groupId}
│ Expired : ${selisihHari(data.expired)}
╰────────────────────────\n`;
    });

    listMessage += `\n*Total : ${sortedSewa.length}*`;

    // Send subscription list message
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
  Commands: ["listsewa"],
  OnlyPremium: false,
  OnlyOwner: true,
};
