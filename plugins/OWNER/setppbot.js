import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import config from "../../config.js";
import path from "path";

// Project root directory
const rootDir = process.cwd();

async function handle(sock, messageInfo) {
  const { remoteJid, message, type, isQuoted, prefix, command } = messageInfo;

  try {
    // Download media (image) and determine media type
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);
    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

    if (media && mediaType === "imageMessage") {
      const botJid = `${config.phone_number_bot}@s.whatsapp.net`;
      // Full path to the tmp folder
      const mediaPath = path.join(rootDir, "tmp", media);

      await sock.updateProfilePicture(botJid, { url: mediaPath });

      return await sock.sendMessage(
        remoteJid,
        { text: `_Successfully changed Bot Profile Picture_` },
        { quoted: message }
      );
    }

    // If media is not valid, send instructions
    return await sock.sendMessage(
      remoteJid,
      { text: `⚠️ _Send/Reply to an image with the caption *${prefix + command}*_` },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing message:", error);

    // Send error message
    await sock.sendMessage(remoteJid, {
      text: "An error occurred while processing the message.",
    });
  }
}

export default {
  handle,
  Commands: ["setppbot"],
  OnlyPremium: false,
  OnlyOwner: true,
};
