import { reply, isURL } from "../../lib/utils.js";
import fetch from "node-fetch";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // Validasi input
    if (!content || !content.includes("github.com")) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _${
          prefix + command
        } https://github.com/WhiskeySockets/Baileys.git_`
      );
    }

    if (!isURL(content)) {
      return await reply(m, `_Link not valid_`);
    }

    // Berikan reaksi saat proses berlangsung
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Ekstrak informasi user dan repositori dari URL
    const regex =
      /(?:https|git)(?::\/\/|@)github\.com[/:]([^\/]+)\/([^\/]+)(?:\.git)?$/i;
    const match = content.match(regex);

    if (!match) {
      return await reply(m, `_URL not valid untuk repositori GitHub_`);
    }

    let [, user, repo] = match;
    repo = repo.replace(/.git$/, "");
    const url = `https://api.github.com/repos/${user}/${repo}/zipball`;

    // Ambil nama file dari header respons
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      return await reply(
        m,
        `_Gagal mengambil repositori GitHub. Periksa URL atau try again later._`
      );
    }

    const contentDisposition = response.headers.get("content-disposition");
    const filenameMatch = contentDisposition?.match(
      /attachment; filename=(.+)/
    );
    const filename = filenameMatch ? filenameMatch[1] : `${repo}.zip`;

    // Kirim file sebagai dokumen
    await sock.sendMessage(
      remoteJid,
      {
        document: { url },
        fileName: filename,
        mimetype: "application/zip",
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Kesalahan di fungsi handle:", error);
    const errorMessage = error.message || "An error occurred tak dikenal.";
    return await reply(m, `_Error: ${errorMessage}_`);
  }
}

export default {
  handle,
  Commands: ["git"],
  OnlyPremium: false,
  OnlyOwner: false,
};
