import { setPromote } from "../../lib/participants.js";
import { getGroupMetadata } from "../../lib/cache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, content, sender, command, prefix } =
    messageInfo;
  if (!isGroup) return; // Groups only

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

  // Validate empty input
  if (!content || !content.trim()) {
    const MSG = `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
      prefix + command
    } Congratulations @name you are now an admin*_
        
_*List Variable*_

${global.group.variable}`;
    return await sock.sendMessage(
      remoteJid,
      { text: MSG },
      { quoted: message }
    );
  }

  await setPromote(remoteJid, content);

  // Send success message
  return await sock.sendMessage(
    remoteJid,
    {
      text: `✅ _Promote message successfully set_\n\n_Make sure the feature is activated by typing *.on promote*_`,
    },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["setpromote"],
  OnlyPremium: false,
  OnlyOwner: false,
};
