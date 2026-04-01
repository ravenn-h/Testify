import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function sendTextMessage(sock, remoteJid, text, quoted) {
  // Helper function for sending text message
  return await sock.sendMessage(remoteJid, { text }, { quoted });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, isQuoted } = messageInfo;

  try {
    // Get group metadata
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

    // Default message if no content
    const messageContent = content?.trim() || "empty";

    // Create tag all text
    let teks = `══✪〘 *👥 Tag All* 〙✪══\n➲ *Message: ${messageContent}*\n\n`;
    const mentions = participants.map((member) => {
      teks += `⭔ @${member.id.split("@")[0]}\n`;
      return member.id;
    });

    // Send message with mentions
    await sock.sendMessage(
      remoteJid,
      { text: teks, mentions },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error:", error);
    // Handle error with message to user
    await sendTextMessage(
      sock,
      remoteJid,
      `⚠️ An error occurred: ${error.message}`,
      message
    );
  }
}

export default {
  handle,
  Commands: ["tagall"],
  OnlyPremium: false,
  OnlyOwner: false,
};
