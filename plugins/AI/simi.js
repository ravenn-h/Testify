import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;
import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";
const api = new ApiAutoresbot(config.APIKEY);

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    if (!content.trim()) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } who are you*_`,
        },
        { quoted: message }
      );
    }

    // Loading
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Memanggil API dengan penanganan kesalahan dan pengecekan respons
    const response = await api.get("/api/simi", {
      text: content,
      language: "id",
    });

    if (response && response.data) {
      // Mengirim pesan jika data dari respons tersedia
      await sock.sendMessage(
        remoteJid,
        { text: response.data },
        { quoted: message }
      );
    } else {
      // Mengirim pesan default jika respons data kosong atau tidak ada
      await sock.sendMessage(
        remoteJid,
        { text: "Sorry, no response from the server." },
        { quoted: message }
      );
    }
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Failed: Check your API key! (.apikey)_`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["simi"],
  OnlyPremium: false,
  OnlyOwner: false,
};
