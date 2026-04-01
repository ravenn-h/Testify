import { reply } from "../../lib/utils.js";
import { delOwner } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content } = messageInfo;

  // Validate empty input
  if (!content || !content.trim()) {
    return await reply(
      m,
      `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} 628xxx*_`
    );
  }

  // Clean input to numbers only
  const ownerNumber = content.replace(/\D/g, ""); // Remove non-numeric characters

  // Validate number format (10-15 digits)
  if (!/^\d{10,15}$/.test(ownerNumber)) {
    return await reply(
      m,
      `_Number not valid. Make sure the format is correct_\n\n_Example: *${
        prefix + command
      } 628xxx*_`
    );
  }

  // Remove number from owner list
  try {
    const result = delOwner(ownerNumber);
    if (result) {
      return await reply(
        m,
        `_Number ${ownerNumber} successfully removed from owner list._`
      );
    } else {
      return await reply(
        m,
        `_Number ${ownerNumber} has already been removed from owner list._`
      );
    }
  } catch (error) {
    console.error("Error while deleting owner:", error);
    return await reply(m, `_An error occurred while processing request._`);
  }
}

export default {
  handle,
  Commands: ["delowner"],
  OnlyPremium: false,
  OnlyOwner: true,
};
