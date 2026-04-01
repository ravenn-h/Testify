import { deleteList, getDataByGroupId } from "../../lib/list.js";
import { getGroupMetadata } from "../../lib/cache.js";
import { deleteCache } from "../../lib/globalCache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, content, sender, command, prefix } =
    messageInfo;

  try {
    let idList = remoteJid;

    if (!isGroup) {
      // Private Chat
      idList = "owner";
    } else {
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
    }

    // Validate content input
    if (!content) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } payment*_`,
        },
        { quoted: message }
      );
      return; // Stop execution if no content
    }

    // Check if keyword already exists
    const currentList = await getDataByGroupId(idList);
    const lowercaseKeyword = content.trim().toLowerCase();

    if (currentList?.list?.[lowercaseKeyword]) {
      await deleteList(idList, lowercaseKeyword);
      deleteCache(`list-${idList}`);
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `Keyword *${lowercaseKeyword}* successfully deleted.`,
        message
      );
    } else {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `Keyword *${lowercaseKeyword}* not found.`,
        message
      );
    }
  } catch (error) {
    console.error("Error processing command:", error);
    return sendMessageWithTemplate(
      sock,
      remoteJid,
      "_❌ Sorry, an error occurred while processing data._",
      message
    );
  }
}

// Function to send message with template
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
  return sock.sendMessage(remoteJid, { text }, { quoted });
}

export default {
  handle,
  Commands: ["dellist", "deletelist"],
  OnlyPremium: false,
  OnlyOwner: false,
};
