import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, content, sender, pushName } =
    messageInfo;
  if (!isGroup) return; // Groups only

  try {
    // Retrieve user data from database
    const dataUsers = await findUser(sender);

    if (dataUsers) {
      const [docId, userData] = dataUsers;

      const reason = content
        ? `Reason: ${
            content.length > 100 ? content.slice(0, 100) + "..." : content
          }`
        : "No Reason";

      const currentTime = new Date();

      // Update user status to AFK
      await updateUser(sender, {
        status: "afk",
        afk: {
          lastChat: currentTime.toISOString(),
          reason,
        },
      });

      // Send message to the group or private chat
      await sock.sendMessage(
        remoteJid,
        { text: `😓 Oh no, ${pushName} has gone AFK.\n\n📌 ${reason}` },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error in AFK command:", error);

    // Send error message if something goes wrong
    await sock.sendMessage(
      remoteJid,
      {
        text: "❌ An error occurred while processing the command. Please try again later.",
      },
      { quoted: message }
    );
  }
}
export default {
  handle,
  Commands: ["afk"],
  OnlyPremium: false,
  OnlyOwner: false,
};
