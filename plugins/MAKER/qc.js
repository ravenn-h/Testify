import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { getProfilePictureUrl } from "../../lib/cache.js";
import { sendImageAsSticker } from "../../lib/exif.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    sender,
    content,
    isQuoted,
    prefix,
    command,
    pushName,
  } = messageInfo;

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

    const ppUser = await getProfilePictureUrl(sock, sender);

    // Buat instance API dan ambil data dari endpoint
    const api = new ApiAutoresbot(config.APIKEY);
    const buffer = await api.getBuffer("/api/maker/qc", {
      name: pushName,
      pp: ppUser,
      text: text,
    });

    const options = {
      packname: config.sticker_packname,
      author: config.sticker_author,
    };

    // Kirim stiker
    await sendImageAsSticker(sock, remoteJid, buffer, options, message);
  } catch (error) {
    console.log(error);
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
  Commands: ["qc"],
  OnlyPremium: false,
  OnlyOwner: false,
};
