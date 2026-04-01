// PROMOTE: Promote users to admin

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

    // Determine user
    const userToAction = determineUser(mentionedJid, isQuoted, content);
    if (!userToAction) {
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

    // Process promote
    await sock.groupParticipantsUpdate(remoteJid, [userToAction], "promote");

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      `@${userToAction.split("@")[0]} has been promoted to admin`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in promote command:", error);

    // Send error message
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while trying to promote to admin." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["promote"],
  OnlyPremium: false,
  OnlyOwner: false,
};
