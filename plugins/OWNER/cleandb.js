import { reply } from "../../lib/utils.js";
import { resetMemberOld } from "../../lib/users.js";
import { readGroup, replaceGroup } from "../../lib/group.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content, mentionedJid } = messageInfo;

  try {
    // Validasi jika none argumen
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ Fitur ini akan deleting:_\n` +
          `• Data grup yang sudah keluar dari bot\n` +
          `• Data user yang tidak aktif selama lebih dari 30 hari\n\n` +
          `_💡 Cara pakai:_\n*${prefix + command} -y*`
      );
    }

    if (content == "-y") {
      const allGroups = await sock.groupFetchAllParticipating();
      const activeGroupIds = Object.keys(allGroups);

      // Ambil semua data group tersimpan
      const savedGroups = await readGroup();

      // Buat objek baru hanya dengan grup yang masih aktif
      const filteredGroups = {};
      for (const groupId of activeGroupIds) {
        if (savedGroups[groupId]) {
          filteredGroups[groupId] = savedGroups[groupId];
        }
      }

      // Replace isi database dengan hanya grup aktif
      await replaceGroup(filteredGroups);

      await resetMemberOld();

      return await reply(m, `_✅ Successful Membersihkan DB_`);
    }
  } catch (error) {
    console.error("Error handling command:", error);
    return await reply(
      m,
      `_❌ An error occurred while processing perintah. Please try again nanti._`
    );
  }
}

export default {
  handle,
  Commands: ["cleandb"],
  OnlyPremium: false,
  OnlyOwner: true,
};
