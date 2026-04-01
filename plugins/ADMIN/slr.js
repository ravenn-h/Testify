import mess from "../../strings.js";
import { addSlr } from "../../lib/slr.js";
import { getGroupMetadata } from "../../lib/cache.js";

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
  } = messageInfo;

  if (!isGroup) return; // Groups only

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

  if (!content) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } admin is slow to respond*_\n\n_To disable this feature type *.slr off*_`,
      },
      { quoted: message }
    );
  }

  if (content.toLowerCase() == "off") {
    await addSlr(remoteJid, false, "");
    return await sock.sendMessage(
      remoteJid,
      { text: `✅ _SLR successfully disabled_` },
      { quoted: message }
    );
  } else {
    await addSlr(remoteJid, true, content.trim());
    return await sock.sendMessage(
      remoteJid,
      { text: `✅ _SLR successfully set_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["slr"],
  OnlyPremium: false,
  OnlyOwner: false,
};
