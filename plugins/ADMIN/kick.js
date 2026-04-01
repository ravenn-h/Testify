import mess from "../../strings.js";
import config from "../../config.js";
import { getGroupMetadata } from "../../lib/cache.js";
import { determineUser } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    mentionedJid,
    isQuoted,
    content,
    prefix,
    command,
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

    const targetNumber = userToAction.split("@")[0];

    if (targetNumber === config.phone_number_bot) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Cannot kick your own number_` },
        { quoted: message }
      );
    }

    // Remove user from group
    const kickResult = await sock.groupParticipantsUpdate(
      remoteJid,
      [userToAction],
      "remove"
    );
    if (kickResult && mess.action.user_kick) {
      return await sock.sendMessage(
        remoteJid,
        { text: mess.action.user_kick },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error handling kick:", error);
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while trying to remove the user. Make sure the bot has admin permissions.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["kick"],
  OnlyPremium: false,
  OnlyOwner: false,
};
