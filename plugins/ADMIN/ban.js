import mess from "../../strings.js";
import { addUserBlock } from "../../lib/group.js";
import { getGroupMetadata } from "../../lib/cache.js";
import { sendMessageWithMention, determineUser } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    isQuoted,
    content,
    prefix,
    command,
    mentionedJid,
    senderType,
  } = messageInfo;

  if (!isGroup) return; // Only Grub

  // Mendapatkan metadata grup
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

  // Menentukan user yang akan dikeluarkan
  const userToBan = determineUser(mentionedJid, isQuoted, content);
  if (!userToBan) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } 6285246154386*_`,
      },
      { quoted: message }
    );
  }

  const whatsappJid = userToBan;

  try {
    await addUserBlock(remoteJid, whatsappJid);
    await sendMessageWithMention(
      sock,
      remoteJid,
      `✅ @${whatsappJid.split("@")[0]} _Successfully banned from this group_`,
      message,
      senderType
    );
  } catch (error) {
    console.log(error);
    await sendMessageWithMention(
      sock,
      remoteJid,
      `❌ _Cannot ban the number_ @${whatsappJid.split("@")[0]}`,
      message,
      senderType
    );
  }
}

export default {
  handle,
  Commands: ["ban"],
  OnlyPremium: false,
  OnlyOwner: false,
};
