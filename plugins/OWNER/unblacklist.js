import { reply } from "../../lib/utils.js";
import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content, mentionedJid } = messageInfo;

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

    // Validate number format (10-15 digits)
    if (!/^\d{10,15}$/.test(targetNumber)) {
      return await reply(
        m,
        `⚠️ _Number not valid. Make sure the format is correct_\n\n_Example: *${
          prefix + command
        } 628xxx*_`
      );
    }

    // Get user data from database
    const dataUsers = await findUser(targetNumber);

    if (!dataUsers) {
      return await reply(
        m,
        `⚠️ _Number ${originalNumber} not found in database._\n\n` +
          `_Make sure the number entered is correct and registered in the database._`
      );
    }

    const [docId, userData] = dataUsers;
    // Update user status to "active"
    await updateUser(targetNumber, { status: "active" });
    return await reply(
      m,
      `✅ _Number ${originalNumber} successfully removed from blacklist!_`
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
  Commands: ["unblacklist"],
  OnlyPremium: false,
  OnlyOwner: true,
};
