import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import fs from "fs";
import path from "path";
import mess from "../../strings.js";
import config from "../../config.js";

import { downloadQuotedMedia, downloadMedia, reply } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, content, prefix, command, type, isQuoted } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;
    if (mediaType !== "image") {
      return await reply(
        m,
        `⚠️ _Send/Reply to an image with caption *${prefix + command}*_`
      );
    }

    // Show "Loading" reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Download & Upload media
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

    const MediaBuffer = await api.getBuffer("/api/maker/wasted", { url });

    if (!Buffer.isBuffer(MediaBuffer)) {
      throw new Error("Invalid response: Expected Buffer.");
    }

    await sock.sendMessage(
      remoteJid,
      {
        image: MediaBuffer,
        caption: mess.general.success,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error while processing Hd command:", error);

    // Send more informative error message
    const errorMessage = `_An error occurred while processing the image._`;
    await reply(m, errorMessage);
  }
}

export default {
  handle,
  Commands: ["wasted"], // Commands processed by this handler
  OnlyPremium: false,
  OnlyOwner: false,
};
