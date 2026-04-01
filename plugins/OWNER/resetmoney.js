import { resetMoney } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;
  try {
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    await resetMoney();

    await sock.sendMessage(
      remoteJid,
      { text: "✅ _All User Money has been reset_" },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error during database reset:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "_❌ Maaf, an error occurred while resetting data._" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["resetmoney"],
  OnlyPremium: false,
  OnlyOwner: true,
};
