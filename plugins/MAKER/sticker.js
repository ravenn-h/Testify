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
        throw new Error("File media not found setelah diunduh.");
      }

      const buffer = fs.readFileSync(mediaPath);

      const options = {
        packname: config.sticker_packname,
        author: config.sticker_author,
      };

      // Kirim stiker
      await sendImageAsSticker(sock, remoteJid, buffer, options, message);

      // Hapus file sementara
      fs.unlinkSync(mediaPath);
    } else {
      // Jika pesan bukan gambar atau video
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_`,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("An error occurred while processing stiker:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "Maaf, an error occurred. Try again later!" },
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
