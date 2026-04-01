import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;
import config from "../../config.js";

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

    // Buat instance API dan ambil data dari endpoint
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.getBuffer("/api/maker/attp2", { text: text });

    // Kirimkan stiker sebagai respon
    await sock.sendMessage(
      remoteJid,
      {
        sticker: response,
      },
      { quoted: message }
    );
  } catch (error) {
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
  Commands: ["attp"],
  OnlyPremium: false,
  OnlyOwner: false,
};
