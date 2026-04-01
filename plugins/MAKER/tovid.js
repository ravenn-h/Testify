import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import { sendImageAsSticker } from "../../lib/exif.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, type, isQuoted, content, prefix, command } =
    messageInfo;

  try {
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });
    const mediaType = isQuoted ? isQuoted.type : type;

    if (mediaType === "image" || mediaType === "sticker") {
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
      const buffer = await api.getBuffer("/api/convert/webptovideo", {
        url,
      });

      if (command == "togif") {
        await sock.sendMessage(remoteJid, {
          video: buffer,
          gifPlayback: true, // Make video play as GIF
          caption: "",
        });
        return;
      }
      await sock.sendMessage(remoteJid, {
        video: buffer,
        caption: "",
      });
    } else {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Send/Reply to media with caption *${prefix + command}*_` },
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
  Commands: ["tovid", "togif"],
  OnlyPremium: false,
  OnlyOwner: false,
};
