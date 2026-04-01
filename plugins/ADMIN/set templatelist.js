import { setTemplateList } from "../../lib/participants.js";
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
    const usageMessage = `⚠️ *Usage Format:*

💬 *Example:* 
_${prefix}${command} 1_

_Only *1 to 9* is available_`;

    await sock.sendMessage(
      remoteJid,
      { text: usageMessage },
      { quoted: message }
    );
    return;
  }

  // Validate input must be a number from 1 to 9
  const validNumbers = /^[1-9]$/;
  if (!validNumbers.test(content.trim())) {
    const invalidMessage = `⚠️ _Input not valid!_

_Only numbers from *1* to *9* are allowed._`;
    await sock.sendMessage(
      remoteJid,
      { text: invalidMessage },
      { quoted: message }
    );
    return;
  }

  // Set list template
  await setTemplateList(remoteJid, content);

  // Send success message
  const successMessage = `✅ _List Template Successfully Set_

_Type *.list* to view the list_`;

  await sock.sendMessage(
    remoteJid,
    { text: successMessage },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["settemplatelist", "templatelist"],
  OnlyPremium: false,
  OnlyOwner: false,
};
