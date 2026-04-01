import { setList, deleteMessage } from "../../lib/participants.js";
import { getGroupMetadata } from "../../lib/cache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, content, sender, command, prefix } =
    messageInfo;

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

  // Validate empty input
  if (!content || !content.trim()) {
    const usageMessage = `⚠️ *Usage format:*

💬 *Example:* 
_${prefix}${command} LIST STORE_

_Here is the list_
⌬ @x

════════════
_Available parameters_

☍ @x${global.group.variable}
`;

    await sock.sendMessage(
      remoteJid,
      { text: usageMessage },
      { quoted: message }
    );
    return;
  }

  // Set list template
  await setList(remoteJid, content);

  if (content.toLowerCase() == "reset") {
    await deleteMessage(remoteJid, "setlist");
    await sock.sendMessage(
      remoteJid,
      { text: "_✅ Setlist successfully reset_" },
      { quoted: message }
    );
    return;
  }
  // Send success message
  const successMessage = `✅ _List Template Successfully Set_

_Type *.list* to view the list or type .setlist reset to revert to default_`;

  await sock.sendMessage(
    remoteJid,
    { text: successMessage },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["setlist"],
  OnlyPremium: false,
  OnlyOwner: false,
};
