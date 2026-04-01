import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, prefix, command, senderType } =
    messageInfo;

  try {
    // Validate input
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
        prefix + command
      } 6285246154386*_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    let nomorHp = content;

    // Further input validation
    if (!nomorHp) {
      const tex = "_Make sure the correct format: .delprem 6285246154386_";
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    nomorHp = nomorHp.replace(/\D/g, "");

    // Get user data
    let dataUsers = await findUser(nomorHp);

    // If user not found
    if (!dataUsers) {
      return await sock.sendMessage(
        remoteJid,
        { text: "no user found" },
        { quoted: message }
      );
    }

    const [docId, userData] = dataUsers;

    userData.premium = null;

    // Update user data in database
    await updateUser(nomorHp, userData);

    const responseText = `_User_ @${
      nomorHp.split("@")[0]
    } _has been removed from premium:_`;

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium removal:", error);

    // Send error message to user
    await sock.sendMessage(
      remoteJid,
      {
        text: "An error occurred while processing data. Please try again later.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["delprem", "delpremium"],
  OnlyPremium: false,
  OnlyOwner: true, // Only owner can access
};
