import fs from "fs";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";

import { Sticker, StickerTypes } from "wa-sticker-formatter";

async function sendError(sock, remoteJid, message, errorMessage) {
  await sock.sendMessage(
    remoteJid,
    { text: errorMessage },
    { quoted: message }
  );
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, isQuoted, type } =
    messageInfo;
  const mediaType = isQuoted ? isQuoted.type : type;

  try {
    const [packname = "", author = ""] = content
      .split("|")
      .map((s) => s.trim());

    // Validate media type
    if (!["image", "sticker"].includes(mediaType)) {
      return sendError(
        sock,
        remoteJid,
        message,
        `⚠️ _Send/Reply to an image/sticker with caption *${prefix + command}*_`
      );
    }

    // Validate input content
    if (!content.trim()) {
      return sendError(
        sock,
        remoteJid,
        message,
        `_Example: *wm az creative*_

_Example 1: wm name_
_Example 2: wm youtube | creative_`
      );
    }

    // Download media
    const mediaPath = `./tmp/${
      isQuoted
        ? await downloadQuotedMedia(message)
        : await downloadMedia(message)
    }`;

    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
    }

    // Create sticker with watermark
    const sticker = new Sticker(mediaPath, {
      pack: packname,
      author: author,
      type: StickerTypes.FULL,
      quality: 50,
    });

    const buffer = await sticker.toBuffer();
    await sock.sendMessage(remoteJid, { sticker: buffer });
  } catch (error) {
    await sendError(
      sock,
      remoteJid,
      message,
      `Sorry, an error occurred while processing your request. Try again later.\n\nError: ${error.message}`
    );
  }
}

export default {
  handle,
  Commands: ["wm"],
  OnlyPremium: false,
  OnlyOwner: false,
};
