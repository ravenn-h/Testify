import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { sendImageAsSticker } from "../../lib/exif.js";
import { logCustom } from "../../lib/logger.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, isQuoted, prefix, command } =
    messageInfo;

  try {
    const text =
      content && content.trim() !== "" ? content : isQuoted?.text ?? null;

    // Validasi input konten
    if (!text) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } resbot*_`,
        },
        { quoted: message }
      );
      return; // Hentikan eksekusi jika none konten
    }

    // Kirimkan pesan loading dengan reaksi emoji
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Bersihkan konten
    const sanitizedContent = encodeURIComponent(
      text.trim().replace(/\n+/g, " ")
    );

    // Buat instance API dan ambil data dari endpoint
    const api = new ApiAutoresbot(config.APIKEY);
    const buffer = await api.getBuffer("/api/maker/bratvid", {
      text: sanitizedContent,
    });
    //https://api.autoresbot.com/api/maker/bratvid?apikey=apikey_premium_9b85434f815b696e7809b61a4755b8a8&text=oi%20mnati%20aja
    const options = {
      packname: config.sticker_packname,
      author: config.sticker_author,
    };

    // Kirim stiker
    await sendImageAsSticker(sock, remoteJid, buffer, options, message);
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    // Tangani kesalahan dan kirimkan pesan error ke user
    const errorMessage = `Maaf, an error occurred while processing permintaan Anda. Try again later.\n\nError: ${error.message}`;
    await sock.sendMessage(
      remoteJid,
      {
        text: errorMessage,
      },
      { quoted: message }
    );
  }
}
export default {
  handle,
  Commands: ["bratvid"],
  OnlyPremium: false,
  OnlyOwner: false,
};
