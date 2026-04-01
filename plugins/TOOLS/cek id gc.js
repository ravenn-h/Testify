import { reply } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // Input validation
    if (!content) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _${
          prefix + command
        } https://chat.whatsapp.com/xxxxxxxxxxxxxxxx_`
      );
    }

    // Validate WhatsApp group link
    const regex = /https:\/\/chat\.whatsapp\.com\/([\w\d]+)/;
    const match = content.match(regex);
    if (!match || !match[1]) {
      return await reply(
        m,
        `_❌ Invalid group link. Make sure the link looks like this:_\nhttps://chat.whatsapp.com/xxxxxxxxxxxxxxxx`
      );
    }

    const inviteCode = match[1];

    // Get group information without joining
    const groupInfo = await sock.groupGetInviteInfo(inviteCode);

    const info = [
      `🆔 Group ID: ${groupInfo.id}`,
      `📛 Name: ${groupInfo.subject}`,
      `👥 Members Count: ${groupInfo.size}`,
    ].join("\n");

    return await reply(m, `_✅ Group Information:_\n${info}`);
  } catch (error) {
    console.error("Error in handle function:", error);

    const errorMessage = error.message || "An unknown error occurred.";
    return await sock.sendMessage(
      remoteJid,
      { text: `_❌ Error: ${errorMessage}_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["checkgroupid"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1,
};