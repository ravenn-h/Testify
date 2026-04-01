import {
  convertAudioToCompatibleFormat,
  generateUniqueFilename,
  downloadQuotedMedia,
  downloadMedia,
  reply,
} from "../../lib/utils.js";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { exec as exec2 } from "child_process";
import util from "util";

const exec = util.promisify(exec2);

/**
 * Change audio pitch using ffmpeg
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {number} sampleRate
 * @returns {Promise<Buffer>}
 */
async function changePitch(inputPath, outputPath, sampleRate = 44100) {
  try {
    // Use different input ≠ output to avoid ffmpeg error
    const command = `ffmpeg -i "${inputPath}" -af "asetrate=${sampleRate},aresample=${sampleRate}" "${outputPath}" -y`;
    await exec(command);
    return await fsp.readFile(outputPath);
  } catch (error) {
    console.error("An error occurred while changing pitch:", error);
    throw error;
  }
}

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content, isQuoted } =
    messageInfo;

  try {
    // Media validation
    const mediaType = isQuoted?.type;
    if (mediaType !== "audio") {
      return await reply(
        m,
        `⚠️ _Reply to an audio/vn with caption *${prefix + command}*_`
      );
    }

    // Character validation
    if (!content) {
      return await reply(
        m,
        `⚠️ _Reply to an audio/vn with caption *${prefix + command}*_\n\n` +
          `_*Enter a character*_\n> squirrel\n> giant\n> monster\n> robot\n> baby\n> oldman\n> alien\n\n` +
          `Example: _*${prefix + command} squirrel*_`
      );
    }

    // Loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Make sure tmp folder exists
    const tmpFolder = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true });

    // Download media
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);

    const mediaPath = path.join(tmpFolder, media);

    // Character list and pitch values
    const characterPitchPairs = [
      { character: "squirrel", pitch: 48000 },
      { character: "giant", pitch: 22050 },
      { character: "monster", pitch: 40000 },
      { character: "robot", pitch: 32000 },
      { character: "baby", pitch: 16000 },
      { character: "oldman", pitch: 20000 },
      { character: "alien", pitch: 55000 },
    ];

    const selectedPair = characterPitchPairs.find(
      (pair) => pair.character === content.toLowerCase()
    );

    if (!selectedPair) {
      return await reply(
        m,
        `_*Enter a character*_\n> squirrel\n> giant\n> monster\n> robot\n> baby\n> oldman\n> alien\n\n` +
          `Example: _*${prefix + command} squirrel*_`
      );
    }

    // Unique output file for ffmpeg
    const outputPath = path.join(tmpFolder, `voicechanger_${Date.now()}.mp3`);

    // Convert pitch
    const audioBuffer = await changePitch(
      mediaPath,
      outputPath,
      selectedPair.pitch
    );

    // Save to unique file for WA compatibility
    const inputPath = path.join(tmpFolder, `voicechanger2_${Date.now()}.mp3`);
    await fsp.writeFile(inputPath, audioBuffer);

    // Convert to WA-compatible format & send
    let bufferToSend = audioBuffer;
    try {
      bufferToSend = await convertAudioToCompatibleFormat(inputPath);
      await sock.sendMessage(
        remoteJid,
        { audio: { url: bufferToSend }, mimetype: "audio/mp4" },
        { quoted: message }
      );
    } catch (err) {
      console.warn("Audio conversion failed, using original buffer:", err.message);
      await sock.sendMessage(
        remoteJid,
        { audio: bufferToSend, mimetype: "audio/mp4" },
        { quoted: message }
      );
    }

    // Delete temporary files
    await Promise.all([
      fsp.unlink(inputPath),
      fsp.unlink(outputPath),
      fsp.unlink(mediaPath),
    ]);
  } catch (error) {
    console.error("Error in handle function:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `_Error: ${error.message}_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["voicechanger"],
  OnlyPremium: false,
  OnlyOwner: false,
};