import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import { textToAudio } from "../../lib/features.js";
import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";
const api = new ApiAutoresbot(config.APIKEY);

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    if (!content.trim()) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } penemu facebook*_`,
        },
        { quoted: message }
      );
    }

    // Loading
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Memanggil API dengan penanganan kesalahan dan pengecekan respons
    const contentShort = `${content} and write as concisely as possible`;
    const response = await api.get("/api/gemini", { text: contentShort });

    if (response && response.data) {
      //await sock.sendMessage(remoteJid, { text:response.data }, { quoted: message });

      let bufferAudioResult;
      try {
        const bufferAudio = await textToAudio(response.data);
        if (bufferAudio) {
          bufferAudioResult = bufferAudio;
        }
      } catch {
        const buffer = await api.getBuffer("/api/tts", { text: response.data });
        bufferAudioResult = buffer;
      }

      return await sock.sendMessage(
        remoteJid,
        { audio: bufferAudioResult, mimetype: "audio/mp4" },
        { quoted: message }
      );
    } else {
      // Mengirim pesan default jika respons data kosong atau tidak ada
      return await sock.sendMessage(
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
  Commands: ["voiceai"],
  OnlyPremium: false,
  OnlyOwner: false,
};
