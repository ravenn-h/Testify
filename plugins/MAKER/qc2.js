import config from "../../config.js";
import { sendImageAsSticker } from "../../lib/exif.js";
import { quote } from "../../lib/scrape/quote.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    sender,
    message,
    content,
    isQuoted,
    prefix,
    command,
    pushName,
  } = messageInfo;

  try {
    const text = content ?? isQuoted?.text ?? null;

    // Validate content input
    if (!text) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } resbot*_`,
        },
        { quoted: message }
      );
      return; // Stop execution if no content
    }

    // Send loading message with emoji reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Get user profile picture URL (fallback on failure)
    const ppnyauser = await sock
      .profilePictureUrl(sender, "image")
      .catch(() => "https://telegra.ph/file/6880771a42bad09dd6087.jpg");

    // Generate result from quote API
    const rest = await quote(text, pushName, ppnyauser);

    // Send quote sticker
    const options = {
      packname: config.sticker_packname,
      author: config.sticker_author,
    };
    await sendImageAsSticker(sock, remoteJid, rest.result, options, message);
  } catch (error) {
    // Handle error and send error message to user
    const errorMessage = `Sorry, an error occurred while processing your request. Try again later.\n\nError: ${error.message}`;
    await sock.sendMessage(
      remoteJid,
      {
        text: errorMessage,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["qc2"],
  OnlyPremium: false,
  OnlyOwner: false,
};
