import fs from "fs";
import sharp from "sharp";
import mess from "../../strings.js";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, isQuoted, type, prefix, command } =
    messageInfo;

  // Determine media type
  const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

  // Validate media type
  if (mediaType !== "imageMessage") {
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ _Send/Reply to an image with caption *${prefix + command}*_` },
      { quoted: message }
    );
    return;
  }

  // Validate rotation input
  const rotationAngle = parseInt(content, 10);
  if (isNaN(rotationAngle) || rotationAngle < 1 || rotationAngle > 360) {
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ _Enter a rotation value between 1 - 360_" },
      { quoted: message }
    );
    return;
  }

  try {
    // Download media
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);
    const mediaPath = `tmp/${media}`;

    // Make sure file exists before processing
    if (!fs.existsSync(mediaPath)) {
      await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _Image file not found._" },
        { quoted: message }
      );
      return;
    }

    // Show "Loading" reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const outputImagePath = `tmp/tmp_rotate_${Date.now()}.jpg`;
    await sharp(mediaPath).rotate(rotationAngle).toFile(outputImagePath);
    await sock.sendMessage(
      remoteJid,
      {
        image: { url: outputImagePath },
        caption: mess.general.success,
      },
      { quoted: message }
    );
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
  Commands: ["rotate"],
  OnlyPremium: false,
  OnlyOwner: false,
};
