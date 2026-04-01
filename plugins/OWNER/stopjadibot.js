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

    let targetNumber = userToAction.replace(/\D/g, ""); // Numbers only

    if (targetNumber.length < 10 || targetNumber.length > 15) {
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Number not valid.` },
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

    // Make sure session folder exists
    const SESSION_PATH = "./session/";

    const senderId = targetNumber.replace("@s.whatsapp.net", "");
    const sessionPath = path.join(SESSION_PATH, senderId);
    const sessionExists = fs.existsSync(sessionPath);

    // Delete active session
    const sockSesi = sessions.get(`session/${senderId}`);
    if (sockSesi) {
      const { updateJadibot } = require("@lib/jadibot");
      await updateJadibot(senderId, "stop");
      await sockSesi.ws.close(); // Close WebSocket
      sessions.delete(`session/${senderId}`); // Remove from session list
    }

    if (sessionExists) {
      // Delete session folder
      await sock.sendMessage(
        remoteJid,
        { text: `✅ _${senderId} successfully stopped_` },
        { quoted: message }
      );
      const { updateJadibot } = require("@lib/jadibot");
      await updateJadibot(senderId, "stop");
    } else {
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Session folder for ${senderId} not found._` },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ An error occurred while processing command.` },
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
