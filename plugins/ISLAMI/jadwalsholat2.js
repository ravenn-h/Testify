import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  try {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    if (!content) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } sambas*_`,
        },
        { quoted: message }
      );
      return; // Hentikan eksekusi jika none konten
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });
    const api = new ApiAutoresbot(config.APIKEY);
    const buffer = await api.getBuffer(`/api/maker/jadwalsholat`, {
      kota: content,
    });

    await sock.sendMessage(
      remoteJid,
      { image: buffer, caption: mess.general.success },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in handle function:", error.message);
  }
}

export default {
  handle,
  Commands: ["jadwalsholat2"],
  OnlyPremium: false,
  OnlyOwner: false,
};
