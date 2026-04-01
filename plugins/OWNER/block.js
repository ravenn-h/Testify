import { reply } from "../../lib/utils.js";
import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content, mentionedJid, senderType } = messageInfo;

  const extSender = senderType === "user" ? "@whatsapp.net" : "@lid";

  try {
    // Validasi input kosong
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} 628xxx*_
                
_Fitur *block* akan membuat user cannot menggunakan bot di semua group dan chat pribadi_

_gunakan fitur *ban* untuk memblokir user di group ini saja_`
      );
    }

    // Tentukan nomor target
    let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, "");
    const originalNumber = targetNumber;

    // Ambil data user dari database
    const dataUsers = await findUser(originalNumber);

    if (!dataUsers) {
      return await reply(
        m,
        `_⚠️ Nomor ${originalNumber} not found di database._\n\n` +
          `_Make sure nomor yang dimasukkan benar dan terdaftar dalam database._`
      );
    }
    // Perbarui status user menjadi "block"
    await updateUser(originalNumber, { status: "block" });
    await sock.updateBlockStatus(`${targetNumber}${extSender}`, "block");
    return await reply(
      m,
      `_✅ Nomor ${originalNumber} successful diblokir!_\n\n` +
        `_⚠️ Info: Nomor yang telah diblokir cannot menggunakan semua fitur bot hingga proses pembukaan blokir dilakukan melalui perintah *${prefix}unblock*._`
    );
  } catch (error) {
    console.error("Error handling command:", error);
    return await reply(
      m,
      `_An error occurred while processing permintaan. Please try again nanti._`
    );
  }
}

export default {
  handle,
  Commands: ["block"],
  OnlyPremium: false,
  OnlyOwner: true,
};
