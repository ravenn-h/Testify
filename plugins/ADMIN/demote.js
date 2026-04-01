// DEMOTE: Demote admin to regular user
import mess from "../../strings.js";
import { sendMessageWithMention, determineUser } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    mentionedJid,
    content,
    isQuoted,
    prefix,
    command,
    senderType,
  } = messageInfo;
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

    const userToDemote = determineUser(mentionedJid, isQuoted, content);
    if (!userToDemote) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } @NAME*_`,
        },
        { quoted: message }
      );
    }

    // Process demote
    await sock.groupParticipantsUpdate(remoteJid, [userToDemote], "demote");

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      `@${userToDemote.split("@")[0]} _has been demoted from admin._`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in demote command:", error);

    // Send error message
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while trying to demote the admin." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["demote"],
  OnlyPremium: false,
  OnlyOwner: false,
};
