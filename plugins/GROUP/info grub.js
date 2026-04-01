import fs from "fs";
import path from "path";
import { getGroupMetadata } from "../../lib/cache.js";

function getGroupSchedule(filePath) {
  if (!fs.existsSync(filePath)) return { openTime: "-", closeTime: "-" };

  const schedules = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let openTime = "-";
  let closeTime = "-";

  for (const groupData of Object.values(schedules)) {
    openTime = groupData.openTime ?? openTime;
    closeTime = groupData.closeTime ?? closeTime;
  }

  return { openTime, closeTime };
}

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message } = messageInfo;
  if (!isGroup) return; // Groups only

  try {
    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);

    const jsonPath = path.resolve(
      process.cwd(),
      "./database/additional/group participant.json"
    );
    const { openTime, closeTime } = getGroupSchedule(jsonPath);

    let response = await sock.groupInviteCode(remoteJid);
    let text = `┏━『 *${groupMetadata.subject}* 』━◧
┣
┣» Members : ${groupMetadata.size}
┣» ID  : ${groupMetadata.id}
┣» Link : https://chat.whatsapp.com/${response}
┣
┣ *SCHEDULED*
┣» Open Group  : ${openTime}
┣» Close Group  : ${closeTime}
┗━━━━━━━━━━━━━◧
`;

    // Send success message
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
  } catch (error) {
    // Send error message
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while getting group info. Make sure the format is correct and the bot has permission.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["infogc", "infogrub", "infogroub", "infogrup", "infogroup"],
  OnlyPremium: false,
  OnlyOwner: false,
};
