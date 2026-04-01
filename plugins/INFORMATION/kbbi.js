import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
const cleanHtml = (input) => input.replace(/<\/?[^>]+(>|$)/g, "");

async function sendMessageWithQuote(
  sock,
  remoteJid,
  message,
  text,
  options = {}
) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validasi input
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} tree*_`
      );
    }

    // Tampilkan reaksi "Loading"
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Inisialisasi API
    const api = new ApiAutoresbot(config.APIKEY);

    // Memanggil API dengan parameter
    const response = await api.get("/api/information/kbbi", { q: content });

    // Menangani respons API
    if (response.code === 200 && response.data) {
      const { kata, keterangan } = response.data;
      const bersih = cleanHtml(keterangan);
      const kbbiData = `_*Kata:*_ ${kata}\n\n_*Arti:*_ ${bersih}`;

      // Kirimkan text
      await sendMessageWithQuote(sock, remoteJid, message, kbbiData);
    } else {
      // Menangani kasus jika respons tidak sesuai atau kosong
      const errorMessage =
        response?.message ||
        "Sorry, no response from the server. Please try again nanti.";
      await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
  } catch (error) {
    // Menangani kesalahan dan sending pesan ke user
    const errorMessage = `Maaf, an error occurred while processing your request. Please try again later.\n\nError Details: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}
export default {
  handle,
  Commands: ["kbbi"],
  OnlyPremium: false,
  OnlyOwner: false,
};
