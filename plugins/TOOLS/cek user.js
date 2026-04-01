import { reply } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // Check if input is empty
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ Usage format:_\n\n📌 *${
          prefix + command
        } <number>*\n\n💬 *Example:* ${prefix + command} 6281234567890`
      );
    }

    // Get and clean input
    let phoneNumber = content.trim().replace(/[^0-9]/g, "");

    // Validate international phone number
    if (!/^\d{10,15}$/.test(phoneNumber)) {
      return await reply(
        m,
        `_❌ Invalid number._\nMake sure to use international format without + or other characters. Example: 6281234567890`
      );
    }

    // Ensure valid WhatsApp JID
    const userJid = phoneNumber.includes("@s.whatsapp.net")
      ? phoneNumber
      : `${phoneNumber}@s.whatsapp.net`;

    const result = await sock.onWhatsApp(userJid);

    if (result?.[0]?.exists) {
      return await reply(
        m,
        `✅ _Number *${phoneNumber}* is registered on WhatsApp._`
      );
    } else {
      return await reply(
        m,
        `❌ _Number *${phoneNumber}* not found on WhatsApp._`
      );
    }
  } catch (error) {
    console.error("Error in handle function:", error);
    const errorMessage = error?.message || "An unknown error occurred.";
    return await sock.sendMessage(
      remoteJid,
      { text: `_⚠️ Error: ${errorMessage}_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["cekuser"],
  OnlyPremium: false,
  OnlyOwner: false,
};