import { readUsers } from "../../lib/users.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Get only users with 'block' status
    const blockedUsers = Object.entries(users)
      .filter(([, userData]) => userData.status === "block")
      .map(([docId, userData]) => ({
        docId,
        username: userData.username,
        aliases: userData.aliases,
      }));

    if (blockedUsers.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ No users are blocked at this time." },
        { quoted: message }
      );
    }

    // Format user list (using username)
    const blockedList = blockedUsers
      .map((user, index) => `◧ *${user.username}*`)
      .join("\n");

    const textNotif = `📋 *LIST BLOCK:*\n\n${blockedList}\n\n_Total:_ *${blockedUsers.length}*`;

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
  Commands: ["listblock"],
  OnlyPremium: false,
  OnlyOwner: true,
};
