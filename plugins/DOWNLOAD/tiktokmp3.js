import { tiktok } from "../../lib/scrape/tiktok.js";
import { logCustom } from "../../lib/logger.js";
import {
  forceConvertToM4a,
  extractLink,
  downloadToBuffer,
} from "../../lib/utils.js";

/**
 * Mengirim pesan teks dengan quote
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Validasi apakah URL berasal dari TikTok
 */
function isTikTokUrl(url) {
  return /tiktok\.com/i.test(url);
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const trimmedContent = content.trim();

    // Validasi input kosong
    if (!trimmedContent) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Usage format:_\n_💬 Example:_ _*${prefix + command} linknya*_`
      );
    }

    const validLink = extractLink(trimmedContent);

    // Validasi URL TikTok
    if (!isTikTokUrl(validLink)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "The URL you entered is not valid. Make sure the URL is from TikTok."
      );
    }

    // Tampilkan reaksi "Loading"
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Ambil data TikTok
    const response = await tiktok(validLink);

    // Validasi response.music
    if (!response?.music) {
      console.error(
        "Error: No music URL found in the response."
      );
      logCustom("info", trimmedContent, `ERROR-COMMAND-${command}.txt`);
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "Gagal mengambil audio dari TikTok. Try again later."
      );
    }

    let outputUrl = response.music;

    try {
      // Konversi ke M4A jika memungkinkan
      outputUrl = await forceConvertToM4a({ url: response.music });
      const audioBuffer = await downloadToBuffer(outputUrl, "mp3");

      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          fileName: "tiktok.mp3",
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } catch (conversionError) {
      await sock.sendMessage(
        remoteJid,
        {
          audio: { url: outputUrl },
          fileName: "tiktok.mp3",
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    }
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    const errorMessage = `Sorry, an error occurred saat processing permintaan Anda.\n\n*Error Details:* ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

export default {
  handle,
  Commands: ["tiktokmp3", "ttmp3"],
  OnlyPremium: false,
  OnlyOwner: false,
};
