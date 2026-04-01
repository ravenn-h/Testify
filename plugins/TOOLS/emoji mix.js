import { reply, fetchJson, getBuffer } from "../../lib/utils.js";
import { sendImageAsSticker } from "../../lib/exif.js";
import sharp from "sharp";

import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;
  
  try {
    // Input validation
    if (!content || !content.includes("+")) {
      return await reply(m, `_*Example:*_ ${prefix + command} 😅+🤔`);
    }
    
    let [emoji1, emoji2] = content.split("+").map((e) => e.trim());
    if (!emoji1 || !emoji2) {
      return await reply(m, `_*Example:*_ ${prefix + command} 😅+🤔`);
    }
    
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });
    
    // Fetch data from Emoji Kitchen API
    const apiResponse = await fetchJson(
      `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(
        emoji1.trim()
      )}_${encodeURIComponent(emoji2.trim())}`
    );
    
    if (
      !apiResponse ||
      !apiResponse.results ||
      apiResponse.results.length === 0
    ) {
      throw new Error(
        `No results found for emoji combination ${emoji1} and ${emoji2}.`
      );
    }
    
    const imageUrl = apiResponse.results[0].url;
    const imageBuffer = await getBuffer(imageUrl);
    const webpBuffer = await sharp(imageBuffer).webp().toBuffer();
    
    // Send sticker
    const options = {
      packname: config.sticker_packname,
      author: config.sticker_author,
    };
    
    await sendImageAsSticker(sock, remoteJid, webpBuffer, options, message);
  } catch (error) {
    console.error("Error in handle function:", error);
    const errorMessage = error.message || "An unknown error occurred.";
    return await reply(m, `_Error: ${errorMessage}_`);
  }
}

export default {
  handle,
  Commands: ["emojimix"],
  OnlyPremium: false,
  OnlyOwner: false,
};