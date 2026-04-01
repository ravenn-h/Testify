import { downloadQuotedMedia, downloadMedia, reply } from "../../lib/utils.js";
import FormData from "form-data";
import fs from "fs-extra";
import path from "path";
import axios from "axios";

async function upload(filePath) {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.put(
      "https://autoresbot.com/tmp-files/upload",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Referer: "https://autoresbot.com/",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Edg/126.0.0.0",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, isQuoted, type, content, prefix, command } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    if (mediaType !== "image" && mediaType !== "sticker") {
      return await reply(
        m,
        `⚠️ _Send/Reply to an image/sticker with caption *${prefix + command}*_`
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

    const result = await upload(mediaPath);

    await reply(
      m,
      `_✅ Upload successful!_
📎 *Link*: ${result.data.url}
            
_This file will automatically expire 1 week after upload. However, if the file is accessed again before expiration, its active period will be extended by 1 more week._`
    );
  } catch (error) {
    console.error("Error in translation handler:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "Sorry, an error occurred. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["tourl"],
  OnlyPremium: false,
  OnlyOwner: false,
};