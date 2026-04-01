import { readUsers } from "../../lib/users.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Get only users with a valid (not expired) premium attribute
    const premiumUsers = Object.entries(users)
      .filter(
        ([docId, userData]) =>
          userData.premium && new Date(userData.premium) > new Date()
      )
      .map(([docId, userData]) => ({
        docId,
        username: userData.username,
        premium: userData.premium,
        aliases: userData.aliases,
      }));

    if (premiumUsers.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ No users have premium at this time." },
        { quoted: message }
      );
    }

    function cleanJid(jid) {
      return jid.replace(/@[\w.]+whatsapp\.net/i, "");
    }

    // Format premium user list using username
    const premiumList = premiumUsers
      .map((user, index) => {
        const uname = cleanJid(user.aliases[0]);
        return `◧ *@${uname}* (Premium until: ${new Date(
          user.premium
        ).toLocaleDateString()})`;
      })
      .join("\n");

    const textNotif = `📋 *LIST PREMIUM:*\n\n${premiumList}\n\n_Total:_ *${premiumUsers.length}*`;

    // Send message (with or without mention based on aliases)
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
  Commands: ["listprem", "listpremium"],
  OnlyPremium: false,
  OnlyOwner: true,
};
