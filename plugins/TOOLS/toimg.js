import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import fs from "fs";
import path from "path";
import mess from "../../strings.js";
import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, type, isQuoted, content, prefix, command } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    if (mediaType === "sticker") {
      await sock.sendMessage(remoteJid, {
        react: { text: "⏰", key: message.key },
      });

      const media = isQuoted
        ? await downloadQuotedMedia(message)
        : await downloadMedia(message);

      const mediaPath = path.join("tmp", media);
      if (!fs.existsSync(mediaPath)) {
        throw new Error("Media file not found after download.");
      }

      const api = new ApiAutoresbot(config.APIKEY);
      const response = await api.tmpUpload(mediaPath);

      if (!response || response.code !== 200) {
        throw new Error("File upload failed or no URL available.");
      }

      const url = response.data.url;
      const buffer = await api.getBuffer("/api/convert/giftoimage", { url });

      await sock.sendMessage(
        remoteJid,
        {
          image: buffer,
          caption: mess.general.success,
        },
        { quoted: message }
      );
    } else {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Send/Reply to a sticker with caption *${prefix + command}*_`,
        },
        { quoted: message }
      );
    }
  } catch (error) {
    console.log(error);
    await sock.sendMessage(
      remoteJid,
      { text: "Sorry, an error occurred. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["toimg"],
  OnlyPremium: false,
  OnlyOwner: false,
};