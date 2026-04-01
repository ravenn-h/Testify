import { getGroupMetadata } from "../../lib/cache.js";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import fs from "fs";
import path from "path";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    content,
    sender,
    prefix,
    command,
    isQuoted,
    type,
  } = messageInfo;

  try {
    // Validate empty or invalid format input
    if (!content || content.trim() === "") {
      return sendErrorMessage(sock, remoteJid, message, prefix, command);
    }

    // Separate Group ID and message from content
    const [idgc, pesangc] = content
      .trim()
      .split("|")
      .map((part) => part.trim());

    if (!idgc || !pesangc) {
      return sendErrorMessage(sock, remoteJid, message, prefix, command);
    }

    // Show temporary reaction for processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, idgc).catch(() => null);
    if (!groupMetadata) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Group ID not valid or group not found.` },
        { quoted: message }
      );
    }

    const participants = groupMetadata.participants;

    // Get message info
    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

    // Send with media
    if (mediaType == "imageMessage") {
      const media = isQuoted
        ? await downloadQuotedMedia(message)
        : await downloadMedia(message);
      const mediaPath = path.join("tmp", media);

      if (!fs.existsSync(mediaPath)) {
        throw new Error("Media file not found after download.");
      }
      const buffer = fs.readFileSync(mediaPath);
      await sock.sendMessage(idgc, {
        image: buffer,
        caption: pesangc,
        mentions: participants.map((p) => p.id),
      });
      return;
    } else {
      await sock.sendMessage(idgc, {
        text: pesangc,
        mentions: participants.map((p) => p.id),
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ An error occurred while processing command.` },
      { quoted: message }
    );
  }
}

function sendErrorMessage(sock, remoteJid, message, prefix, command) {
  return sock.sendMessage(
    remoteJid,
    {
      text: `Enter the Group ID with the correct format.

Example:
${prefix + command} 1234567889@g.us | Message to send`,
    },
    { quoted: message }
  );
}
export default {
  handle,
  Commands: ["gctag"],
  OnlyPremium: false,
  OnlyOwner: true,
};
