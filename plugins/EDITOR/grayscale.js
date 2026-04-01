import fs from "fs";
import sharp from "sharp";
import mess from "../../strings.js";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, isQuoted, type, prefix, command } =
    messageInfo;

  // Tentukan tipe media
  const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

  // Validasi tipe media
  if (mediaType !== "imageMessage") {
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ _Send/Reply to an image with caption *${prefix + command}*_` },
      { quoted: message }
    );
    return;
  }

  try {
    // Unduh media
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);
    const mediaPath = `tmp/${media}`;

    // Make sure file ada sebelum diproses
    if (!fs.existsSync(mediaPath)) {
      await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _Image file not found._" },
        { quoted: message }
      );
      return;
    }

    // Tampilkan reaksi "Loading"
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const outputImagePath = `tmp/tmp_flipx${Date.now()}.jpg`;

    await sharp(mediaPath).grayscale().toFile(outputImagePath);

    // Make sure file hasil ada dan valid
    if (fs.existsSync(outputImagePath)) {
      await sock.sendMessage(
        remoteJid,
        {
          image: { url: outputImagePath },
          caption: mess.general.success,
        },
        { quoted: message }
      );
    } else {
      throw new Error("Sharpened output file not found.");
    }
  } catch (error) {
    console.error("Error processing image:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "_An error occurred while processing the image._" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["grayscale"],
  OnlyPremium: false,
  OnlyOwner: false,
};
