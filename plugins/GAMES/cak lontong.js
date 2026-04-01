import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;
import config from "../../config.js";

import { logWithTime } from "../../lib/utils.js";
import mess from "../../strings.js";

import {
  addUser,
  removeUser,
  getUser,
  isUserPlaying,
} from "../../database/temporary_db/cak lontong.js";

const WAKTU_GAMES = 60; // 60 detik

const api = new ApiAutoresbot(config.APIKEY);

/**
 * Mengirim pesan ke user.
 * @param {Object} sock - Instance koneksi.
 * @param {string} remoteJid - ID user.
 * @param {Object} content - Konten pesan.
 * @param {Object} options - Opsi tambahan untuk pengiriman pesan.
 */
const sendMessage = async (sock, remoteJid, content, options = {}) => {
  try {
    await sock.sendMessage(remoteJid, content, options);
  } catch (error) {
    console.error(`Failed to send pesan ke ${remoteJid}:`, error);
  }
};

/**
 * Menangani game Cak Lontong.
 * @param {Object} sock - Instance koneksi.
 * @param {Object} messageInfo - Informasi pesan.
 */
const handle = async (sock, messageInfo) => {
  const { remoteJid, message, fullText } = messageInfo;

  if (!fullText.includes("lontong")) {
    return true;
  }

  // Cek apakah user sudah bermain
  if (isUserPlaying(remoteJid)) {
    await sendMessage(
      sock,
      remoteJid,
      { text: mess.game.isPlaying },
      { quoted: message }
    );
    return;
  }

  try {
    const response = await api.get("/api/game/caklontong");
    const { soal, jawaban, deskripsi } = response.data;

    // Timer 60 detik untuk menjawab
    const timer = setTimeout(async () => {
      if (isUserPlaying(remoteJid)) {
        removeUser(remoteJid);
        await sendMessage(
          sock,
          remoteJid,
          {
            text: `Time's up!\nAnswer: ${jawaban}\nDescription: ${deskripsi}\n\nWant to play? Type .cak lontong`,
          },
          { quoted: message }
        );
      }
    }, WAKTU_GAMES * 1000);

    // Tambahkan user ke database
    addUser(remoteJid, {
      answer: jawaban.toLowerCase(),
      hadiah: 10, // Jumlah hadiah jika menang
      deskripsi,
      command: fullText,
      timer: timer,
    });

    // Kirim pertanyaan ke user
    await sendMessage(
      sock,
      remoteJid,
      { text: `*Jawablah Pertanyaan Berikut :*\n${soal}\n*Waktu : 60s*` },
      { quoted: message }
    );

    logWithTime("Caklontong", `Jawaban : ${jawaban}`);
  } catch (error) {
    const errorMessage = `Maaf, an error occurred while processing permintaan Anda. Mohon try again later.\n\n${
      error || "Unknown error"
    }`;
    await sendMessage(
      sock,
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
};

export default {
  handle,
  Commands: ["cak", "caklontong"],
  OnlyPremium: false,
  OnlyOwner: false,
};
