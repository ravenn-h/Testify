import { resetLimit } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;
  try {
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    await resetLimit();

    await sock.sendMessage(
      remoteJid,
      { text: "✅ _All User Limits have been reset_" },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error during database reset:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "_❌ Sorry, an error occurred while resetting data._" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["resetlimit"],
  OnlyPremium: false,
  OnlyOwner: true,
};
