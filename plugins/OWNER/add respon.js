import { addList, getDataByGroupId } from "../../lib/list.js";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import { deleteCache } from "../../lib/globalCache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, command, prefix } = messageInfo;

  try {
    // Validate message content
    if (!content.trim()) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `_Enter the Command and Message_\n\nExample: ${
          prefix + command
        } donation | Here is the donation link...\n\n_If you want to add a response with an image, please send/reply to the image with caption_ *${
          prefix + command
        }*`,
        message
      );
    }

    // Separate keyword and text
    const [keyword, text] = content.split("|").map((item) => item.trim());
    const lowercaseKeyword = keyword.trim().toLowerCase();

    if (!keyword || !text) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `⚠️ _Format not valid!_\n\nExample: *${
          prefix + command
        } donation | Here is the donation link...*\n\n_If you want to add a response with an image, please send/reply to the image with caption_ *${
          prefix + command
        }*`,
        message
      );
    }

    // Check if keyword already exists
    const currentList = await getDataByGroupId(remoteJid);

    if (currentList?.list?.[lowercaseKeyword]) {
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `_⚠️ Keyword *${lowercaseKeyword}* already exists!_\n_Please use another keyword or *.updaterespon*_`,
        message
      );
    }

    // Handle media if any
    const mediaUrl = await handleMedia(messageInfo);

    // Add to database
    const result = await addList("owner", lowercaseKeyword, {
      text,
      media: mediaUrl,
    });
    if (result.success) {
      deleteCache(`list-owner`); // reset cache
      return sendMessageWithTemplate(
        sock,
        remoteJid,
        `${lowercaseKeyword} _has been added to the response list_\n\n_Type *listrespon* to view the response list._`,
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

// Function for sending message with template
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
  return sock.sendMessage(remoteJid, { text }, { quoted });
}

// Function for handling media downloads
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
  Commands: ["addrespon"],
  OnlyPremium: false,
  OnlyOwner: true,
};
