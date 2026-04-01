import { sendMessageWithMention } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Groups only

  try {
    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(
      (p) => (p.phoneNumber === sender || p.id === sender) && p.admin
    );
    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Filter participants with admin status
    const adminList = participants
      .filter((p) => p.admin !== null)
      .map((admin) => {
        // Get number with priority to phoneNumber first
        const jid = admin.phoneNumber || admin.id;
        const cleanNumber =
          typeof jid === "string" ? jid.split("@")[0] : "unknown";
        return `◧ @${cleanNumber}`;
      })
      .join("\n");

    // Check if there are no admins
    if (!adminList || adminList.trim() === "") {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _No admins in this group._" },
        { quoted: message }
      );
    }

    // Group admin list notification text
    const textNotif = `📋 *Group Admin List:*\n\n${adminList}`;

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listadmin:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while displaying the admin list." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listadmin"],
  OnlyPremium: false,
  OnlyOwner: false,
};
