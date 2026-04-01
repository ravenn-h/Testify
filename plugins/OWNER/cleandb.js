import { reply } from "../../lib/utils.js";
import { resetMemberOld } from "../../lib/users.js";
import { readGroup, replaceGroup } from "../../lib/group.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content, mentionedJid } = messageInfo;

  try {
    // Validate if no arguments
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ This feature will delete:_\n` +
          `• Group data that the bot has left\n` +
          `• User data that has been inactive for more than 30 days\n\n` +
          `_💡 How to use:_\n*${prefix + command} -y*`
      );
    }

    if (content == "-y") {
      const allGroups = await sock.groupFetchAllParticipating();
      const activeGroupIds = Object.keys(allGroups);

      // Get all saved group data
      const savedGroups = await readGroup();

      // Create new object with only active groups
      const filteredGroups = {};
      for (const groupId of activeGroupIds) {
        if (savedGroups[groupId]) {
          filteredGroups[groupId] = savedGroups[groupId];
        }
      }

      // Replace database contents with only active groups
      await replaceGroup(filteredGroups);

      await resetMemberOld();

      return await reply(m, `_✅ Successfully Cleaned DB_`);
    }
  } catch (error) {
    console.error("Error handling command:", error);
    return await reply(
      m,
      `_❌ An error occurred while processing command. Please try again later._`
    );
  }
}

export default {
  handle,
  Commands: ["cleandb"],
  OnlyPremium: false,
  OnlyOwner: true,
};
