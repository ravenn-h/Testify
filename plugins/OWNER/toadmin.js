import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, prefix, command } = messageInfo;

  try {
    // Validate initial input
    if (!content || !content.includes("chat.whatsapp.com")) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_\n\n_💬 Example:_ *${
            prefix + command
          } https://chat.whatsapp.com/xxxx 628xxxxxxxx*`,
        },
        { quoted: message }
      );
    }

    // Send ⏰ reaction for processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Extract link and target number
    const parts = content.trim().split(/\s+/);
    const link = parts[0];
    const number = parts[1];

    const groupId = link.split("chat.whatsapp.com/")[1];
    if (!groupId || !number) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Format not valid. Make sure to include the link and number.` },
        { quoted: message }
      );
    }

    let groupJid;
    try {
      groupJid = await sock.groupAcceptInvite(groupId);
    } catch (e) {
      if (e.message.includes("conflict")) {
        groupJid = `${groupId}@g.us`; // Already joined
      } else {
        return await sock.sendMessage(
          remoteJid,
          { text: `⚠️ Failed to join group: ${e.message}` },
          { quoted: message }
        );
      }
    }

    // Now fetch metadata
    const groupMetadata = await getGroupMetadata(sock, groupJid);
    const participants = groupMetadata.participants;

    const targetJid = number.includes("@s.whatsapp.net")
      ? number
      : number.replace(/\D/g, "") + "@s.whatsapp.net";

    const isInGroup = participants.find((p) => p.id === targetJid);

    if (!isInGroup) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Number has not joined the group.` },
        { quoted: message }
      );
    }

    // Promote to admin
    await sock.groupParticipantsUpdate(groupJid, [targetJid], "promote");

    return await sock.sendMessage(
      remoteJid,
      { text: `✅ Number ${number} has been made admin in the group.` },
      { quoted: message }
    );
  } catch (error) {
    console.error("An error occurred:", error);
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ An error occurred. Make sure the bot has admin permission to manage the group. ${error.message}`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["toadmin"],
  OnlyPremium: false,
  OnlyOwner: true,
};
