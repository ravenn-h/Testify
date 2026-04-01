import { downloadQuotedMedia, downloadMedia, convertAudioToOpus, reply } from "../../lib/utils.js";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, isQuoted, type, content, prefix, command } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    if (mediaType !== "audio" && mediaType !== "video") {
      return await reply(
        m,
        `⚠️ _Send/Reply to an Audio with caption *${prefix + command}*_`
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

    // Temporary folder in project root
    const tmpFolder = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true });

    const mediaPath = path.join(tmpFolder, media);
    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
    }

    // Unique file names
    const inputPath = path.join(tmpFolder, `${uuidv4()}.mp4`);
    const outputPath = path.join(tmpFolder, `${uuidv4()}.opus`);

    // Save media buffer to inputPath
    const mediaBuffer = fs.readFileSync(mediaPath);
    await fs.writeFile(inputPath, mediaBuffer);

    try {
      const convertedPath = await convertAudioToOpus(inputPath);
      const bufferFinal = await fs.readFile(`${convertedPath}`);

      await sock.sendMessage(
        remoteJid,
        {
          audio: bufferFinal,
          mimetype: "audio/mp4",
          ptt: true,
        },
        { quoted: message }
      );
      return;
    } catch (err) {
      console.log("Conversion to Opus failed, continuing with original file.");
    }

    // Send audio
    await sock.sendMessage(
      remoteJid,
      {
        audio: { url: outputPath },
        mimetype: "audio/mp4",
      },
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
  Commands: ["tovn"],
  OnlyPremium: false,
  OnlyOwner: false,
};