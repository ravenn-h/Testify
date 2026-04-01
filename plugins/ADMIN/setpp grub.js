import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";
import path from "path";
import mess from "../../strings.js";
import { fileURLToPath } from "url";

// Gantikan require.main.filename dengan cara ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mainDir = path.resolve(__dirname, "../../");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    type,
    isQuoted,
    prefix,
    command,
    sender,
  } = messageInfo;

  if (!isGroup) return; // Hanya untuk grup

  try {
    // Ambil metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(
      (p) => (p.phoneNumber === sender || p.id === sender) && p.admin
    );

    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Unduh media (gambar)
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);

    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

    if (media && mediaType === "imageMessage") {
      const groupId = groupMetadata.id;
      const mediaPath = path.join(mainDir, "tmp", media);

      // Update foto profil grup
      await sock.updateProfilePicture(groupId, { url: mediaPath });

      return await sock.sendMessage(
        remoteJid,
        { text: `_✅ Success! Group profile photo has been updated._` },
        { quoted: message }
      );
    }

    // Jika media not valid
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Send or reply to an image with caption *${prefix + command}*`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing message:", error);

    await sock.sendMessage(remoteJid, {
      text: "❌ An error occurred while changing the group profile photo. Make sure the bot is an admin.",
    });
  }
}

export default {
  handle,
  Commands: ["setppgc", "setppgroub", "setppgrub", "setppgroup", "setppgrup"],
  OnlyPremium: false,
  OnlyOwner: false,
};
