import { setGroupSchedule } from "../../lib/participants.js";
import { getGroupMetadata } from "../../lib/cache.js";
import moment from "moment-timezone";
import mess from "../../strings.js";
import { convertTime, getTimeRemaining } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, content, sender, command, prefix } =
    messageInfo;
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

  const currentTime = moment().tz("Asia/Jakarta").format("HH:mm");

  // Validate empty input
  if (!content || !content.trim()) {
    const MSG = `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
      prefix + command
    } 23:10*_
        
_The bot will automatically close the group at that time every day_ \n\n_To remove, type *.setclosegc off*_`;
    return await sock.sendMessage(
      remoteJid,
      { text: MSG },
      { quoted: message }
    );
  }

  if (content.trim() == "off") {
    await setGroupSchedule(sock, remoteJid, content.trim(), "closeTime");
    return await sock.sendMessage(
      remoteJid,
      { text: `_✅ Automatic group close schedule removed_` },
      { quoted: message }
    );
    return;
  }

  // Validate time format
  const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/; // Format HH:mm
  if (!timeRegex.test(content.trim())) {
    const MSG = `_⚠️ Time format not valid!_\n\n_Make sure the format is HH:mm (example: 23:10)_`;
    return await sock.sendMessage(
      remoteJid,
      { text: MSG },
      { quoted: message }
    );
  }

  // Proceed with saving schedule
  await setGroupSchedule(sock, remoteJid, content.trim(), "closeTime");

  const serverTime = convertTime(content.trim());
  const { hours, minutes } = getTimeRemaining(serverTime);

  // Send success message
  return await sock.sendMessage(
    remoteJid,
    {
      text: `✅ _Done! The group will automatically close at *${content.trim()}* WIB_ \n⏰ _In about ${hours}h ${minutes}m_\n\n_Make sure the bot is an admin to use this feature_`,
    },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["setclosegc"],
  OnlyPremium: false,
  OnlyOwner: false,
};
