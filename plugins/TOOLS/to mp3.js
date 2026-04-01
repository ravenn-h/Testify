import { downloadQuotedMedia, downloadMedia, reply } from "../../lib/utils.js";

import fs from "fs-extra";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid"; // For generating unique UUIDs

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, isQuoted, type, content, prefix, command } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    if (mediaType !== "video") {
      return await reply(
        m,
        `⚠️ _Send/Reply to a video with caption *${prefix + command}*_`
      );
    }

    // Show "Loading" reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Download media
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);

    const mediaPath = path.join("tmp", media);

    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
    }

    // Use UUID to create unique filenames
    const inputPath = path.join(__dirname, `${uuidv4()}.mp4`);
    const outputPath = path.join(__dirname, `${uuidv4()}.mp3`);

    // Read file into buffer and save it with a unique name
    const mediaBuffer = fs.readFileSync(mediaPath);
    await fs.writeFile(inputPath, mediaBuffer);

    // Convert video to MP3
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    // Read output file as buffer
    const outputBuffer = await fs.readFile(outputPath);

    // Send the converted MP3 file
    await sock.sendMessage(
      remoteJid,
      { audio: { url: outputPath }, mimetype: "audio/mp4" },
      { quoted: message }
    );

    // Delete temporary files
    await fs.unlink(inputPath);
    await fs.unlink(outputPath);
  } catch (error) {
    console.error("Error in handler:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "Sorry, an error occurred. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["tomp3"],
  OnlyPremium: false,
  OnlyOwner: false,
};