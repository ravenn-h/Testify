import { readUsers } from "../../lib/users.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Get only users with 'blacklist' status
    const blacklistedUsers = Object.entries(users)
      .filter(([, userData]) => userData.status === "blacklist")
      .map(([docId, userData]) => ({
        docId,
        username: userData.username,
        aliases: userData.aliases,
      }));

    if (blacklistedUsers.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ No users are blacklisted at this time." },
        { quoted: message }
      );
    }

    // Format blacklist (using username)
    const blockedList = blacklistedUsers
      .map((user, index) => `◧ *${user.username}*`)
      .join("\n");

    const textNotif = `📋 *BLACKLIST:*\n\n${blockedList}\n\n_Total:_ *${blacklistedUsers.length}*`;

    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "An error occurred while processing user data." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listblacklist"],
  OnlyPremium: false,
  OnlyOwner: true,
};
