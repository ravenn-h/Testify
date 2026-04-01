import { reply } from "../../lib/utils.js";
import { addOwner } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content } = messageInfo;

  // Validate empty input
  if (!content || !content.trim()) {
    return await reply(
      m,
      `_Please enter a valid format_\n\n_Example: *${prefix + command} 628xxx*_`
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

  // Add number to owner list
  try {
    const result = addOwner(ownerNumber);
    if (result) {
      return await reply(
        m,
        `_Number ${ownerNumber} successfully added as owner._`
      );
    } else {
      return await reply(
        m,
        `_Number ${ownerNumber} already exists in the owner list._`
      );
    }
  } catch (error) {
    console.error("Error while adding owner:", error);
    return await reply(m, `_An error occurred while processing request._`);
  }
}

export default {
  handle,
  Commands: ["addowner"],
  OnlyPremium: false,
  OnlyOwner: true,
};
