import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import fs from "fs";
import { readUsers } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, type, isQuoted, prefix, command } =
    messageInfo;

  try {
    // Read user data
    const user = await readUsers();

    // Get all user IDs (jid)
    const statusJidList = Object.keys(user);

    const nomorTanpaBroadcast = statusJidList.filter(
      (jid) => jid !== "status@broadcast"
    );

    // Download media and determine media type
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);
    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;
    let mediaContent = content?.trim()
      ? content
      : isQuoted?.content?.caption || "";

    // Validate empty message
    if (!media && (!mediaContent || mediaContent.trim() === "")) {
      const tex = `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
        prefix + command
      } test*_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    if (media) {
      const mediaPath = `tmp/${media}`;

      // Check if file exists
      if (!fs.existsSync(mediaPath)) {
        throw new Error(`Media file not found: ${mediaPath}`);
      }

      // Send media according to type
      await sendMedia(
        sock,
        "status@broadcast",
        mediaType,
        mediaPath,
        mediaContent,
        nomorTanpaBroadcast
      );
    } else {
      await sock.sendMessage(
        "status@broadcast",
        { text: mediaContent },
        { statusJidList: nomorTanpaBroadcast }
      );
    }

    return await sock.sendMessage(
      remoteJid,
      { text: "Successfully sent WhatsApp status" },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing message:", error);
    await sock.sendMessage(remoteJid, {
      text: "An error occurred while processing the message.",
    });
  }
}

// Function for sending media
async function sendMedia(
  sock,
  remoteJid,
  type,
  mediaPath,
  caption,
  statusJidList
) {
  const mediaOptions = {
    audioMessage: { audio: fs.readFileSync(mediaPath) },
    imageMessage: { image: fs.readFileSync(mediaPath), caption },
    videoMessage: { video: fs.readFileSync(mediaPath), caption },
    documentMessage: { document: fs.readFileSync(mediaPath), caption },
  };

  if (mediaOptions[type]) {
    await sock.sendMessage(remoteJid, mediaOptions[type], { statusJidList });
  } else {
    throw new Error(`Unsupported media type: ${type}`);
  }
}

export default {
  handle,
  Commands: ["buatstory", "buatstori", "upsw"],
  OnlyPremium: false,
  OnlyOwner: true,
};
