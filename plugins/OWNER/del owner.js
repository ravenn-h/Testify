import { reply } from "../../lib/utils.js";
import { delOwner } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content } = messageInfo;

  // Validasi input kosong
  if (!content || !content.trim()) {
    return await reply(
      m,
      `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} 628xxx*_`
    );
  }

  // Membersihkan input menjadi hanya angka
  const ownerNumber = content.replace(/\D/g, ""); // Menghapus karakter non-angka

  // Validasi format nomor (10-15 digit)
  if (!/^\d{10,15}$/.test(ownerNumber)) {
    return await reply(
      m,
      `_Nomor not valid. Make sure formatnya benar_\n\n_Example: *${
        prefix + command
      } 628xxx*_`
    );
  }

  // Menambahkan nomor ke daftar owner
  try {
    const result = delOwner(ownerNumber);
    if (result) {
      return await reply(
        m,
        `_Nomor ${ownerNumber} successful dihapus dari daftar owner._`
      );
    } else {
      return await reply(
        m,
        `_Nomor ${ownerNumber} sudah dihapus dari daftar owner._`
      );
    }
  } catch (error) {
    console.error("Error saat deleting owner:", error);
    return await reply(m, `_An error occurred while processing permintaan._`);
  }
}

export default {
  handle,
  Commands: ["delowner"],
  OnlyPremium: false,
  OnlyOwner: true,
};
