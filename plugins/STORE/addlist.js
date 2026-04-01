import { addList, getDataByGroupId } from "../../lib/list.js";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";
import { deleteCache } from "../../lib/globalCache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    content,
    sender,
    isQuoted,
    command,
    prefix,
  } = messageInfo;

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

    // Validate message content
    if (!content.trim()) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `_⚠️ Usage format:_\n\n_Example:_ *${
          prefix + command
        } payment | Hello @name Payment is only via Dana ...*\n\n_To add a list with an image, send/reply with the image as caption_ *${
          prefix + command
        }*
                
_*List Variable*_

${global.group.variable}`,
        message
      );
    }

    let text = "";
    let keyword = "";

    const parts = content.split("|");
    keyword = parts.shift().trim(); // Keyword is trimmed to remove extra spaces at start & end
    text = parts.join("|"); // Join remaining elements without altering original spaces

    // Check if isQuoted is defined
    if (isQuoted) {
      switch (isQuoted.type) {
        case "text":
          text ||= isQuoted.text || "-";
          break;
        case "image":
          text ||= isQuoted.content?.caption || "-";
          break;
        case "sticker":
          text = "sticker";
          break;
        case "video":
          text ||= isQuoted.content?.caption || "-";
          break;
        case "audio":
          text ||= "-";
          break;
        case "document":
          text ||= "-";
          break;
      }
    }

    // Ensure keyword has a value to avoid error on trim()
    const lowercaseKeyword = (keyword || "").trim().toLowerCase();

    if (!keyword || !text) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `⚠️ _Format not valid!_\n\nExample: ${
          prefix + command
        } payment | Payment is only via Dana ...\n\n_To add a list with an image, send/reply with the image as caption_ *${
          prefix + command
        }*`,
        message
      );
    }

    // Check if keyword already exists
    const currentList = await getDataByGroupId(idList);

    if (currentList?.list?.[lowercaseKeyword]) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `⚠️ _Keyword *${lowercaseKeyword}* already exists!_\n\n_Please use a different keyword or use updatelist._`,
        message
      );
    }

    // Reset cache
    deleteCache(`list-${idList}`);

    // Handle media if any
    const mediaUrl = await handleMedia(messageInfo);

    // Add to database
    const result = await addList(idList, lowercaseKeyword, {
      text,
      media: mediaUrl,
    });
    if (result.success) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `${lowercaseKeyword} _has been added to the list_\n\n_Type *list* to view the list._`,
        message
      );
    }

    return sendMessageWithTemplate(
      sock,
      remoteJid,
      `❌ ${result.message}`,
      message
    );
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

// Function to handle media download
async function handleMedia({ isQuoted, type, message }) {
  const supportedMediaTypes = [
    "image",
    "audio",
    "sticker",
    "video",
    "document",
  ];

  if (isQuoted && supportedMediaTypes.includes(isQuoted.type)) {
    return await downloadQuotedMedia(message, true);
  } else if (supportedMediaTypes.includes(type)) {
    return await downloadMedia(message, true);
  }
  return null;
}

export default {
  handle,
  Commands: ["addlist"],
  OnlyPremium: false,
  OnlyOwner: false,
};
