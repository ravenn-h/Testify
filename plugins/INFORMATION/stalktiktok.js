import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    const trimmedContent = content.trim();

    // Validasi input user
    if (!trimmedContent) {
      return await sendErrorMessage(
        sock,
        remoteJid,
        `_Enter a TikTok Username_\n\nExample: _${prefix + command} kompascom_`,
        message
      );
    }

    const user_id = trimmedContent;

    // Mengirim reaksi loading
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Inisialisasi API dan memanggil endpoint
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get("/api/stalker/tiktok", {
      username: user_id,
    });

    // Validasi respons API
    if (response?.data) {
      const { nickname, desc, avatar, follower, following } = response.data;

      const resultTiktok = `
*STALKER TIKTOK*

◧ *Username*: ${user_id || "Unknown"}
◧ *Nickname*: ${nickname || "Unknown"}
◧ *Description*: ${desc || "Unknown"}
◧ *Follower*: ${follower || "Unknown"}
◧ *Following*: ${following || "Unknown"}
`;

      try {
        // Kirim gambar jika avatar ada dan valid
        if (Array.isArray(avatar) && avatar[0]) {
          return await sock.sendMessage(
            remoteJid,
            { image: { url: avatar[0] }, caption: resultTiktok },
            { quoted: message }
          );
        }
      } catch (error) {
        //console.warn("Failed to send avatar image:", error.message || error);
      }

      // Kirim teks jika avatar gagal atau none
      return await sock.sendMessage(
        remoteJid,
        { text: resultTiktok },
        { quoted: message }
      );
    }

    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    // Jika respons none data
    await sendErrorMessage(
      sock,
      remoteJid,
      "Sorry, no TikTok user data was found.",
      message
    );
  } catch (error) {
    console.error("Error:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Penanganan kesalahan dengan pesan ke user
    await sendErrorMessage(
      sock,
      remoteJid,
      `Maaf, an error occurred while processing permintaan Anda. Try again later.\n\n*Detail*: ${
        error.message || error
      }`,
      message
    );
  }
}

// Fungsi utilitas untuk sending pesan kesalahan
async function sendErrorMessage(sock, remoteJid, text, quotedMessage) {
  await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

export default {
  handle,
  Commands: ["stalktiktok"],
  OnlyPremium: false,
  OnlyOwner: false,
};
