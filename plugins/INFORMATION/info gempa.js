import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  // Ikon loading untuk menunjukkan proses sedang berjalan
  const loadingReaction = { react: { text: "⏰", key: message.key } };
  const errorMessage =
    "Sorry, an error occurred while processing your request. Try again later.";

  try {
    // Mengirim reaksi loading
    await sock.sendMessage(remoteJid, loadingReaction);

    const api = new ApiAutoresbot(config.APIKEY);

    // Memanggil endpoint API untuk getting informasi gempa
    const response = await api.get(`/api/information/gempadirasakan`);

    // Validasi respons dari API
    if (response?.data?.length) {
      const gempaInfo = response.data[0];
      const capt = `_*Info Gempa Terbaru*_

*◧ Tanggal:* ${gempaInfo.Tanggal}
*◧ Wilayah:* ${gempaInfo.Wilayah}
*◧ DateTime:* ${gempaInfo.DateTime}
*◧ Lintang:* ${gempaInfo.Lintang}
*◧ Bujur:* ${gempaInfo.Bujur}
*◧ Magnitude:* ${gempaInfo.Magnitude}
*◧ Kedalaman:* ${gempaInfo.Kedalaman}
*◧ Felt:* ${gempaInfo.Dirasakan || "No felt information available"}
`;

      // Mengirim informasi gempa kepada user
      await sock.sendMessage(remoteJid, { text: capt }, { quoted: message });
    } else {
      // Mengirim pesan default jika data not available
      await sock.sendMessage(
        remoteJid,
        { text: "Maaf, none informasi gempa at this time." },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error saat memanggil API gempa:", error);

    // Menangani error dan sending pesan ke user
    await sock.sendMessage(
      remoteJid,
      { text: `${errorMessage}\n\nDetail Kesalahan: ${error.message}` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["infogempa"],
  OnlyPremium: false,
  OnlyOwner: false,
};
