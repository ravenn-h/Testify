import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender } = messageInfo;

  if (!isGroup) {
    // Groups only
    await sock.sendMessage(
      remoteJid,
      { text: mess.general.isGroup },
      { quoted: message }
    );
    return;
  }

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

  try {
    const participantIds = participants.map((p) => p.id);

    await sock.sendMessage(remoteJid, {
      text: `✅ Group *${groupMetadata.subject}* has been fixed!\nParticipants: ${participantIds.length} member(s).`,
      mentions: participantIds,
    });

    // To delete specific messages from chat (clear), make sure `message` has a `key`
    if (message && message.key && message.key.id) {
      await sock.chatModify(
        {
          clear: {
            messages: [{ id: message.key.id, fromMe: message.key.fromMe }],
          },
        },
        remoteJid
      );
    }

    await sock.sendMessage(
      remoteJid,
      { text: "✔️ Fix chat successful!" },
      { quoted: message }
    );
  } catch (err) {
    console.error("Error fixing chat:", err);
    await sock.sendMessage(
      remoteJid,
      { text: "❌ Failed to fix chat!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["fixchat"],
  OnlyPremium: false,
  OnlyOwner: false,
};
