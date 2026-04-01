import { reply } from "../../lib/utils.js";
import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content, mentionedJid } = messageInfo;

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

    // Validasi format nomor (10-15 digit)
    if (!/^\d{10,15}$/.test(targetNumber)) {
      return await reply(
        m,
        `⚠️ _Nomor not valid. Make sure formatnya benar_\n\n_Example: *${
          prefix + command
        } 628xxx*_`
      );
    }

    // Ambil data user dari database
    const dataUsers = await findUser(targetNumber);

    if (!dataUsers) {
      return await reply(
        m,
        `⚠️ _Nomor ${originalNumber} not found di database._\n\n` +
          `_Make sure nomor yang dimasukkan benar dan terdaftar dalam database._`
      );
    }

    const [docId, userData] = dataUsers;
    // Perbarui status user menjadi "active"
    await updateUser(targetNumber, { status: "active" });
    return await reply(
      m,
      `✅ _Nomor ${originalNumber} successful dibuka dari blacklist!_`
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
  Commands: ["unblacklist"],
  OnlyPremium: false,
  OnlyOwner: true,
};
