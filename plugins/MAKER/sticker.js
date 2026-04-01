import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import { sendImageAsSticker } from "../../lib/exif.js";
import config from "../../config.js";
import fs from "fs";
import path from "path";

async function handle(sock, messageInfo) {
  const { remoteJid, message, type, isQuoted, prefix, command } = messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    if (mediaType === "image" || mediaType === "video") {
      // Download media
      const media = isQuoted
        ? await downloadQuotedMedia(message)
        : await downloadMedia(message);

      const mediaPath = path.join("tmp", media);

      if (!fs.existsSync(mediaPath)) {
        throw new Error("Media file not found after download.");
      }

      const buffer = fs.readFileSync(mediaPath);

      const options = {
        packname: config.sticker_packname,
        author: config.sticker_author,
      };

      // Send sticker
      await sendImageAsSticker(sock, remoteJid, buffer, options, message);

      // Delete temporary file
      fs.unlinkSync(mediaPath);
    } else {
      // If message is not an image or video
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Send/Reply to an image with caption *${prefix + command}*_`,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("An error occurred while processing sticker:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "Sorry, an error occurred. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["sticker", "stiker", "s"],
  OnlyPremium: false,
  OnlyOwner: false,
};
