import { deleteList, getDataByGroupId } from "../../lib/list.js";
import { deleteCache } from "../../lib/globalCache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, command, prefix } = messageInfo;

  try {
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
    const currentList = await getDataByGroupId("owner");
    const lowercaseKeyword = content.trim().toLowerCase();

    if (currentList?.list?.[lowercaseKeyword]) {
      await deleteList("owner", lowercaseKeyword);
      deleteCache(`list-owner`); // reset cache
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `✅ _Keyword *${lowercaseKeyword}* successfully deleted._`,
        message
      );
    } else {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `⚠️ _Keyword *${lowercaseKeyword}* not found._`,
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

// Function for sending message with template
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
  return sock.sendMessage(remoteJid, { text }, { quoted });
}

export default {
  handle,
  Commands: ["delrespon", "deleterespon"],
  OnlyPremium: false,
  OnlyOwner: true,
};
