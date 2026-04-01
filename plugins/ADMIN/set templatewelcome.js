import { setTemplateWelcome } from "../../lib/participants.js";
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
_${prefix}${command} 2_

_Only *1 to 7* or *text* is available_

_To preview the welcome image, type *.teswelcome*_`;

    await sock.sendMessage(
      remoteJid,
      { text: usageMessage },
      { quoted: message }
    );
    return;
  }

  if (content == "text") {
    // Set template
    await setTemplateWelcome(remoteJid, content);

    // Send success message
    const successMessage = `✅ _Welcome Template Successfully Set_`;
    await sock.sendMessage(
      remoteJid,
      { text: successMessage },
      { quoted: message }
    );
    return;
  }

  const validNumbers = /^[1-7]$/;
  if (!validNumbers.test(content.trim())) {
    const invalidMessage = `⚠️ _Input not valid!_

_Only numbers from *1* to *7* are allowed._`;
    await sock.sendMessage(
      remoteJid,
      { text: invalidMessage },
      { quoted: message }
    );
    return;
  }

  // Set template
  await setTemplateWelcome(remoteJid, content);

  // Send success message
  const successMessage = `✅ _Welcome Template Successfully Set_`;
  await sock.sendMessage(
    remoteJid,
    { text: successMessage },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["settemplatewelcome", "templatewelcome"],
  OnlyPremium: false,
  OnlyOwner: false,
};
