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
    // Cek jika none teks/konten
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

    // Hanya proses image dan sticker
    if (mediaType !== "image" && mediaType !== "sticker") {
      return sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_`,
        },
        { quoted: message }
      );
    }

    // Pisahkan teks smeme
    const [smemeText1 = "", smemeText2 = ""] = (content || "").split("|");

    // Unduh media
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);

    const mediaPath = path.join("tmp", media);
    if (!fs.existsSync(mediaPath)) {
      throw new Error("File media not found setelah diunduh.");
    }

    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.tmpUpload(mediaPath);

    if (!response || response.code !== 200) {
      throw new Error("File upload failed or no URL available.");
    }
    const url = response.data.url;

    if (url) {
      // Ambil buffer hasil API smeme

      const buffer = await api.getBuffer("/api/maker/smeme", {
        text: smemeText1,
        text2: smemeText2,
        pp: url,
        width: 500,
        height: 500,
      });

      // Konversi ke webp
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
      { text: "Maaf, an error occurred. Try again later!" },
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
