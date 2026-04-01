import fs from "fs";
import path from "path";
import { determineUser } from "../../lib/utils.js";
import { sessions } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    content,
    sender,
    mentionedJid,
    isQuoted,
    prefix,
    command,
  } = messageInfo;

  try {
    if (!content) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_\n\n_💬 Example:_ _*${
            prefix + command
          } 6285246154386*_`,
        },
        { quoted: message }
      );
      return;
    }

    const userToAction = determineUser(mentionedJid, isQuoted, content);
    if (!userToAction) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } @NAME*_`,
        },
        { quoted: message }
      );
    }

    let targetNumber = userToAction.replace(/\D/g, ""); // Hanya angka

    if (targetNumber.length < 10 || targetNumber.length > 15) {
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Nomor not valid.` },
        { quoted: message }
      );
      return;
    }

    if (!targetNumber.endsWith("@s.whatsapp.net")) {
      targetNumber += "@s.whatsapp.net";
    }

    // Loading
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Make sure folder sesi ada
    const SESSION_PATH = "./session/";

    const senderId = targetNumber.replace("@s.whatsapp.net", "");
    const sessionPath = path.join(SESSION_PATH, senderId);
    const sessionExists = fs.existsSync(sessionPath);

    // Hapus sesi aktif
    const sockSesi = sessions.get(`session/${senderId}`);
    if (sockSesi) {
      const { updateJadibot } = require("@lib/jadibot");
      await updateJadibot(senderId, "stop");
      await sockSesi.ws.close(); // Tutup WebSocket
      sessions.delete(`session/${senderId}`); // Hapus dari daftar sesi
    }

    if (sessionExists) {
      // Hapus folder sesi
      await sock.sendMessage(
        remoteJid,
        { text: `✅ _${senderId} successful di stop_` },
        { quoted: message }
      );
      const { updateJadibot } = require("@lib/jadibot");
      await updateJadibot(senderId, "stop");
    } else {
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Folder sesi untuk ${senderId} not found._` },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ An error occurred while processing perintah.` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["stopjadibot"],
  OnlyPremium: false,
  OnlyOwner: true,
};
