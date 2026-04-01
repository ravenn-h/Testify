import { updateKeyword } from "../../lib/list.js";
import { getGroupMetadata } from "../../lib/cache.js";
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

    // Separate keyword and text
    const [keywordOld, keywordNew] = content
      .split("|")
      .map((item) => item.trim().toLowerCase());

    if (!keywordOld || !keywordNew) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } oldkey | newkey*_`,
        message
      );
    }

    const updatedStatus = await updateKeyword(idList, keywordOld, keywordNew);

    if (updatedStatus && updatedStatus.success) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        updatedStatus.message,
        message
      );
    } else {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        updatedStatus.message,
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
  Commands: ["renamelist"],
  OnlyPremium: false,
  OnlyOwner: false,
};
