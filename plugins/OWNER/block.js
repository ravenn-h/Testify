import { reply } from "../../lib/utils.js";
import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content, mentionedJid, senderType } = messageInfo;

  const extSender = senderType === "user" ? "@whatsapp.net" : "@lid";

  try {
    // Validate empty input
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} 628xxx*_
                
_The *block* feature will prevent the user from using the bot in all groups and private chats_

_use the *ban* feature to block the user in this group only_`
      );
    }

    // Determine target number
    let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, "");
    const originalNumber = targetNumber;

    // Get user data from database
    const dataUsers = await findUser(originalNumber);

    if (!dataUsers) {
      return await reply(
        m,
        `_⚠️ Number ${originalNumber} not found in database._\n\n` +
          `_Make sure the number entered is correct and registered in the database._`
      );
    }
    // Update user status to "block"
    await updateUser(originalNumber, { status: "block" });
    await sock.updateBlockStatus(`${targetNumber}${extSender}`, "block");
    return await reply(
      m,
      `_✅ Number ${originalNumber} successfully blocked!_\n\n` +
        `_⚠️ Info: Blocked numbers cannot use any bot features until unblocked via the *${prefix}unblock* command._`
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
  Commands: ["block"],
  OnlyPremium: false,
  OnlyOwner: true,
};
