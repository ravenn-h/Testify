import fs from "fs/promises";
import path from "path";
import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

const api = new ApiAutoresbot(config.APIKEY);
import { textToAudio } from "../../lib/features.js";
import {
  convertAudioToCompatibleFormat,
  generateUniqueFilename,
} from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, fullText, pushName } = messageInfo;

  if (!fullText.includes("odam")) return true;

  const nameCekodam = content.trim() || pushName;

  try {
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Call Kodam API
    const response = await api.get(`/api/game/kodam`);
    if (!response?.data) {
      console.error("⚠️ API response is empty or invalid:", response);
      return false;
    }

    const kodam = response.data;
    const resultKodam = `Nama, ${nameCekodam} , , , Kodam , ${kodam}`;
    let bufferAudio = await textToAudio(resultKodam);

    if (!bufferAudio) {
      console.error("⚠️ Failed to generate audio from text.");
      return false;
    }

    const inputPath = path.join(process.cwd(), generateUniqueFilename());
    await fs.writeFile(inputPath, bufferAudio);

    let bufferFinal = bufferAudio; // Default: use original buffer

    try {
      const convertedPath = await convertAudioToCompatibleFormat(inputPath);
      bufferFinal = await fs.readFile(convertedPath);
    } catch (err) {}

    await sock.sendMessage(
      remoteJid,
      {
        audio: bufferFinal,
        mimetype: "audio/mp4",
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("⚠️ An error occurred:", error);

    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n${
      error.message || "Unknown error"
    }`;
    await sock.sendMessage(
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
}
export default {
  handle,
  Commands: ["kodam", "cekkodam", "cekkhodam", "cekodam"],
  OnlyPremium: false,
  OnlyOwner: false,
};
