import config from "../../config.js";
import { reply, extractNumber } from "../../lib/utils.js";
import { findUser, updateUser, isOwner } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, remoteJid, command, content, mentionedJid, message } =
    messageInfo;

  try {
    // Validate empty input
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} 628xxx*_
                
_The *blacklist* feature will kick the user from all groups (requires .on detectblacklist2)_`
      );
    }

    // Determine target number
    let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, "");
    let originalNumber = targetNumber;

    // Validate number format (10-15 digits)
    if (!/^\d{10,15}$/.test(targetNumber)) {
      return await reply(
        m,
        `_Number not valid. Make sure the format is correct_\n\n_Example: *${
          prefix + command
        } 628xxx*_`
      );
    }

    targetNumber = extractNumber(targetNumber);
    const botNumber = extractNumber(config.phone_number_bot);

    if (botNumber == targetNumber) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Cannot blacklist the bot number_` },
        { quoted: message }
      );
    }

    if (isOwner(targetNumber)) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Cannot blacklist the owner number_` },
        { quoted: message }
      );
    }

    // Get user data from database
    const dataUsers = await findUser(targetNumber);

    if (!dataUsers) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _User with that number/tag not found._` },
        { quoted: message }
      );
    }

    const [docId, userData] = dataUsers;

    // Update user status to "blacklist"
    await updateUser(targetNumber, { status: "blacklist" });
    return await reply(
      m,
      `_✅ Number ${originalNumber} successfully blacklisted!_\n\n` +
        `_⚠️ Info: Blacklisted numbers will be detected if present in a group and the feature is active_ \n
_(.on detectblacklist)_ warning only
_(.on detectblacklist2)_ kick member`
    );
  } catch (error) {
    console.error("Error handling command:", error);
    return await reply(
      m,
      `_An error occurred while processing request. Please try again later._`
    );
  }
}

export default {
  handle,
  Commands: ["blacklist"],
  OnlyPremium: false,
  OnlyOwner: true,
};
