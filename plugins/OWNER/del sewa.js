import { deleteSewa } from "../../lib/sewa.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  // Validasi input
  if (!content || !content.trim()) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_\n\n_💬 Example:_ _*${
          prefix + command
        } 123xxxxx@g.us*_\n\n_Untuk getting ID grup, silakan ketik *.listsewa*_`,
      },
      { quoted: message }
    );
  }

  // Validasi format ID grup
  if (!content.includes("@g.us")) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format not valid!_\n\n_Make sure ID grup mengandung '@g.us'._\n\n_💬 Contoh useran:_ _*${
          prefix + command
        } 123xxxxx@g.us*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Hapus data sewa berdasarkan ID grup
    const result = await deleteSewa(content.trim());

    if (result) {
      // Pesan successful
      return await sock.sendMessage(
        remoteJid,
        {
          text: `✅ _Successful deleting data sewa untuk ID grup:_ *${content}*`,
        },
        { quoted: message }
      );
    } else {
      // Pesan jika ID not found
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _ID grup not found:_ *${content}*\n\n_Make sure ID grup benar atau tersedia di daftar sewa._`,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Gagal deleting ID grup:", error);

    // Pesan error
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _An error occurred while deleting data sewa._\n\n_Error:_ ${error.message}`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["delsewa"],
  OnlyPremium: false,
  OnlyOwner: true,
};
