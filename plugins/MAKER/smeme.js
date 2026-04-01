import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { sendImageAsSticker } from "../../lib/exif.js";

import {
  downloadQuotedMedia,
  downloadMedia,
  uploadTmpFile,
} from "../../lib/utils.js";

import sharp from "sharp";

import fs from "fs";
import path from "path";

async function handle(sock, messageInfo) {
  const { remoteJid, message, type, isQuoted, content, prefix, command } =
    messageInfo;
  try {
    // Check if no text/content
    if (!content) {
      return sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } resbot*_`,
        },
        { quoted: message }
      );
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const mediaType = isQuoted ? isQuoted.type : type;

    // Only process image and sticker
    if (mediaType !== "image" && mediaType !== "sticker") {
      return sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Send/Reply to an image with caption *${prefix + command}*_`,
        },
        { quoted: message }
      );
    }

    // Split smeme text
    const [smemeText1 = "", smemeText2 = ""] = (content || "").split("|");

    // Download media
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);

    const mediaPath = path.join("tmp", media);
    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
    }

    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.tmpUpload(mediaPath);

    if (!response || response.code !== 200) {
      throw new Error("File upload failed or no URL available.");
    }
    const url = response.data.url;

    if (url) {
      // Get buffer result from smeme API

      const buffer = await api.getBuffer("/api/maker/smeme", {
        text: smemeText1,
        text2: smemeText2,
        pp: url,
        width: 500,
        height: 500,
      });

      // Convert to webp
      const webpBuffer = await sharp(buffer).webp().toBuffer();

      const options = {
        packname: config.sticker_packname,
        author: config.sticker_author,
      };

      await sendImageAsSticker(sock, remoteJid, webpBuffer, options, message);
    }
  } catch (error) {
    await sock.sendMessage(
      remoteJid,
      { text: "Sorry, an error occurred. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["smeme"],
  OnlyPremium: false,
  OnlyOwner: false,
};
