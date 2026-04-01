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
        `⚠️ _Masukkan format yang valid_\n\n_Example: *${
          prefix + command
        } 628xxx*_`
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
        `⚠️ _Nomor ${originalNumber} not found di database._\n\n` +
          `_Make sure nomor yang dimasukkan benar dan terdaftar dalam database._`
      );
    }

    // Perbarui status user menjadi "block"
    await updateUser(originalNumber, { status: "active" });
    await sock.updateBlockStatus(`${originalNumber}${extSender}`, "unblock");
    return await reply(
      m,
      `✅ _Nomor ${originalNumber} successful dibuka dari pemblokiran!_`
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
  Commands: ["unblock"],
  OnlyPremium: false,
  OnlyOwner: true,
};
