import { deleteSewa } from "../../lib/sewa.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  // Validate input
  if (!content || !content.trim()) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_\n\n_💬 Example:_ _*${
          prefix + command
        } 123xxxxx@g.us*_\n\n_To get Group ID, please type *.listsewa*_`,
      },
      { quoted: message }
    );
  }

  // Validate group ID format
  if (!content.includes("@g.us")) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format not valid!_\n\n_Make sure Group ID contains '@g.us'._\n\n_💬 Example usage:_ _*${
          prefix + command
        } 123xxxxx@g.us*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Delete subscription data based on group ID
    const result = await deleteSewa(content.trim());

    if (result) {
      // Success message
      return await sock.sendMessage(
        remoteJid,
        {
          text: `✅ _Successfully deleted subscription data for Group ID:_ *${content}*`,
        },
        { quoted: message }
      );
    } else {
      // Message if ID not found
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Group ID not found:_ *${content}*\n\n_Make sure the Group ID is correct or available in the subscription list._`,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Failed to delete Group ID:", error);

    // Error message
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _An error occurred while deleting subscription data._\n\n_Error:_ ${error.message}`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["delsewa"],
  OnlyPremium: false,
  OnlyOwner: true,
};
