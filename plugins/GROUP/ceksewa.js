import { findSewa } from "../../lib/sewa.js";
import { selisihHari } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message } = messageInfo;
  if (!isGroup) return; // Groups only

  // Get group metadata
  const { subject } = await getGroupMetadata(sock, remoteJid);

  // Check subscription data
  const dataSewa = await findSewa(remoteJid);

  if (!dataSewa) {
    // Group does not have a bot subscription
    await sock.sendMessage(
      remoteJid,
      { text: "_This Group Does Not Have a Bot Subscription_" },
      { quoted: message }
    );
    return;
  }

  // Check subscription duration
  const remainingDays = selisihHari(dataSewa.expired);

  // Send subscription info
  await sock.sendMessage(
    remoteJid,
    {
      text: `_*Group Name:*_ ${subject}

_*Bot Subscription:*_ _*${remainingDays}*_`,
    },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["ceksewa"],
  OnlyPremium: false,
  OnlyOwner: false,
};
