import fs from "fs";
import path from "path";

// Fungsi untuk menangani perintah "listjadibot"
async function handle(sock, messageInfo) {
  const { remoteJid, message, sender } = messageInfo;

  try {
    // Kirim reaksi sebagai tanda sedang diproses
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Path folder sesi
    const SESSION_PATH = "./session/";

    // Periksa apakah folder sesi ada
    if (!fs.existsSync(SESSION_PATH)) {
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Folder sesi not found.` },
        { quoted: message }
      );
      return;
    }

    // Baca isi folder sesi
    const sessionFolders = fs.readdirSync(SESSION_PATH).filter((folderName) => {
      const folderPath = path.join(SESSION_PATH, folderName);
      return fs.lstatSync(folderPath).isDirectory(); // Make sure hanya folder
    });

    // Jika none subfolder di dalam sesi
    if (sessionFolders.length === 0) {
      await sock.sendMessage(
        remoteJid,
        { text: `📂 Tidak ada jadibot yang ditemukan.` },
        { quoted: message }
      );
      return;
    }

    // Buat daftar nomor telepon dari nama folder
    const listMessage = `📜 *Daftar Jadibot:*\n\n${sessionFolders
      .map((folder, index) => `*${index + 1}.* ${folder}`)
      .join("\n")}`;

    // Kirim daftar ke user
    await sock.sendMessage(
      remoteJid,
      { text: listMessage },
      { quoted: message }
    );
  } catch (error) {
    console.error("An error occurred:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ An error occurred while processing perintah.` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listjadibot"],
  OnlyPremium: false,
  OnlyOwner: true,
};
