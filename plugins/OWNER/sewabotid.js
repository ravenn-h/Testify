import { addSewa, findSewa } from "../../lib/sewa.js";
import config from "../../config.js";
import { selisihHari, hariini } from "../../lib/utils.js";
import { deleteCache } from "../../lib/globalCache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, prefix, command } = messageInfo;

  // Validate empty or invalid format input
  if (!content || content.trim() === "") {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } xxxx@g.us 30*_\n\n_*30* means 30 days, bot will automatically leave when time expires_\n\n_If the Bot has already joined the Subscription Group and you want to extend, type *.tambahsewa*_`,
      },
      { quoted: message }
    );
  }

  // Split content into array to separate link and number of days
  const args = content.trim().split(" ");
  if (args.length < 2) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Format not valid. Example usage:\n\n_*${
          prefix + command
        } xxx@g.us 30*_`,
      },
      { quoted: message }
    );
  }

  const linkGrub = args[0]; // Get group link
  const totalHari = parseInt(args[1], 10); // Convert days to number

  // Validate group link
  if (!linkGrub.includes("@g.us")) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Group ID must contain '@g.us'. Example usage:\n\n_*${
          prefix + command
        } xxx@g.us 30*_`,
      },
      { quoted: message }
    );
  }

  // Validate number of days
  if (isNaN(totalHari) || totalHari <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Number of days not valid. Example usage:\n\n_*${
          prefix + command
        } xxx@g.us 30*_`,
      },
      { quoted: message }
    );
  }

  const currentDate = new Date();
  const expirationDate = new Date(
    currentDate.getTime() + totalHari * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000
  );
  const timestampExpiration = expirationDate.getTime();

  try {
    // Process adding subscription to database
    await addSewa(linkGrub, {
      linkGrub: linkGrub,
      start: hariini,
      expired: timestampExpiration,
    });

    deleteCache(`sewa-${remoteJid}`); // reset cache

    // Send success message
    return await sock.sendMessage(
      remoteJid,
      {
        text:
          `_*Bot Has Joined*_` +
          `\nBot Number : ${config.phone_number_bot}` +
          `\nExpired : *${selisihHari(timestampExpiration)}*` +
          `\n\n_To check subscription status type *.ceksewa* in that group_`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.log(error);

    // Default error message
    let info = "_Make sure the group link is valid._";

    // Check error message
    if (error instanceof Error && error.message.includes("not-authorized")) {
      info = `_You may have been removed from the group before. Solution: invite the bot back or add it manually._`;
    }

    // Send error message to user
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Failed to join the group._\n\n${info}`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["sewabotid"],
  OnlyPremium: false,
  OnlyOwner: true,
};
