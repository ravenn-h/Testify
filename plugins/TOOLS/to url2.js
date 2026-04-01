import { downloadQuotedMedia, downloadMedia, reply } from "../../lib/utils.js";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

async function uploadToCatbox(filePath) {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(filePath));

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Upload failed:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Upload to Catbox failed.");
  }
}

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, isQuoted, type, prefix, command } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    if (
      !["image", "sticker", "video", "audio", "document"].includes(mediaType)
    ) {
      return await reply(
        m,
        `⚠️ _Send/Reply to a document with caption *${prefix + command}*_`
      );
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏳", key: message.key },
    });

    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);

    const mediaPath = path.join("tmp", media);

    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
    }

    const result = await uploadToCatbox(mediaPath);

    await reply(
      m,
      `_✅ Upload successful!_
📎 *Link*: ${result}`
    );

    fs.unlinkSync(mediaPath); // Delete file after upload
  } catch (error) {
    console.error("Error in handle function:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ Sorry, an error occurred while uploading. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["tourl2"],
  OnlyPremium: false,
  OnlyOwner: false,
};