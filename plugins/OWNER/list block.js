import { readUsers } from "../../lib/users.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Ambil hanya user yang statusnya 'block'
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
        { text: "⚠️ Tidak ada user yang diblokir at this time." },
        { quoted: message }
      );
    }

    // Format daftar user (pakai username)
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
      { text: "An error occurred while processing data user." },
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
