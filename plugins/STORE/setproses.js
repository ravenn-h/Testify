import { getGroupMetadata } from "../../lib/cache.js";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import mess from "../../strings.js";
import fs from "fs";
import path from "path";
import { setProses, deleteMessage } from "../../lib/participants.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    content,
    sender,
    command,
    prefix,
    isQuoted,
    type,
  } = messageInfo;

  // Check if message comes from a group
  if (!isGroup) return;

  // Get group metadata
  const groupMetadata = await getGroupMetadata(sock, remoteJid);
  const participants = groupMetadata.participants;

  // Check if sender is an admin
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

  const mediaType = isQuoted ? isQuoted.type : type;

  if (mediaType == "sticker") {
    const media = isQuoted
      ? await downloadQuotedMedia(message, true)
      : await downloadMedia(message, true);
    const mediaPath = path.join("database", "media", media);

    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
    }
    await setProses(remoteJid, mediaPath);

    // Send success message
    const successMessage = `✅ _Set Process Successfully Configured_

_Type .setproses reset to revert to default_`;
    await sock.sendMessage(
      remoteJid,
      { text: successMessage },
      { quoted: message }
    );
    return;
  }

  // Validate empty input
  if (!content || !content.trim()) {
    const usageMessage = `⚠️ *Usage format:*

💬 *Example:* 
_${prefix}${command} PROCESS_

Time   : @time
Date   : @tanggal
Group  : @group
Note   : @catatan

@sender Your order is being processed
`;

    await sock.sendMessage(
      remoteJid,
      { text: usageMessage },
      { quoted: message }
    );
    return;
  }

  // Set template
  await setProses(remoteJid, content);

  if (content.toLowerCase() == "reset") {
    await deleteMessage(remoteJid, "setproses");
    await sock.sendMessage(
      remoteJid,
      { text: "_✅ Setproses successfully reset_" },
      { quoted: message }
    );
    return;
  }
  // Send success message
  const successMessage = `✅ _Set Process Successfully Configured_

_Type .setproses reset to revert to default_`;

  await sock.sendMessage(
    remoteJid,
    { text: successMessage },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["setproses"],
  OnlyPremium: false,
  OnlyOwner: false,
};
