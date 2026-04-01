import { downloadQuotedMedia, reply } from "../../lib/utils.js";

import fs from "fs";
import path from "path";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, sender, prefix, command, type, isQuoted } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    if (mediaType !== "viewonce" || !isQuoted) {
      return await reply(
        m,
        `⚠️ _Reply to a view-once media with caption *${prefix + command}*_`
      );
    }

    // Show "Loading" reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Download
    const media = await downloadQuotedMedia(message);
    const mediaPath = path.join("tmp", media);

    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
    }

    // Read file into Buffer
    const mediaBuffer = fs.readFileSync(mediaPath);

    if (isQuoted?.rawMessageType === "audioMessage") {
      await sock.sendMessage(
        remoteJid,
        {
          audio: mediaBuffer,
          mimetype: "audio/mp4",
          ptt: true,
        },
        { quoted: message }
      );
      return;
    }

    if (isQuoted?.rawMessageType === "imageMessage") {
      await sock.sendMessage(
        remoteJid,
        {
          image: mediaBuffer,
          caption: mess.general.success,
        },
        { quoted: message }
      );
      return;
    }

    if (isQuoted?.rawMessageType === "videoMessage") {
      await sock.sendMessage(
        remoteJid,
        { video: mediaBuffer, caption: mess.general.success },
        { quoted: message }
      );
      return;
    }
  } catch (error) {
    console.error("Error while processing Hd command:", error);

    // Send more informative error message
    const errorMessage = `_An error occurred while processing the image._`;
    await reply(m, errorMessage);
  }
}

export default {
  handle,
  Commands: ["rvo"],
  OnlyPremium: true,
  OnlyOwner: false,
};