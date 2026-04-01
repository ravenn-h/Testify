import { reply } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // Cek jika none input
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ Usage format:_\n\n📌 *${
          prefix + command
        } <nomor>*\n\n💬 *Example:* ${prefix + command} 6281234567890`
      );
    }

    // Ambil dan bersihkan input
    let phoneNumber = content.trim().replace(/[^0-9]/g, "");

    // Validasi nomor HP internasional
    if (!/^\d{10,15}$/.test(phoneNumber)) {
      return await reply(
        m,
        `_❌ Nomor not valid._\nMake sure menggunakan format internasional tanpa + atau karakter lain. Example: 6281234567890`
      );
    }

    // Make sure JID WhatsApp valid
    const userJid = phoneNumber.includes("@s.whatsapp.net")
      ? phoneNumber
      : `${phoneNumber}@s.whatsapp.net`;

    const result = await sock.onWhatsApp(userJid);

    if (result?.[0]?.exists) {
      return await reply(
        m,
        `✅ _Nomor *${phoneNumber}* terdaftar di WhatsApp._`
      );
    } else {
      return await reply(
        m,
        `❌ _Nomor *${phoneNumber}* not found di WhatsApp._`
      );
    }
  } catch (error) {
    console.error("Kesalahan di fungsi handle:", error);
    const errorMessage = error?.message || "An error occurred tak dikenal.";
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
