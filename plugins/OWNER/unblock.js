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
        `⚠️ _Please enter a valid format_\n\n_Example: *${
          prefix + command
        } 628xxx*_`
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
        `⚠️ _Number ${originalNumber} not found in database._\n\n` +
          `_Make sure the number entered is correct and registered in the database._`
      );
    }

    // Update user status to "active"
    await updateUser(originalNumber, { status: "active" });
    await sock.updateBlockStatus(`${originalNumber}${extSender}`, "unblock");
    return await reply(
      m,
      `✅ _Number ${originalNumber} successfully unblocked!_`
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
  Commands: ["unblock"],
  OnlyPremium: false,
  OnlyOwner: true,
};
