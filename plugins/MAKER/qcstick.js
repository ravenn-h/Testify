import config from "../../config.js";
import { sendImageAsSticker } from "../../lib/exif.js";
import axios from "axios";

// Color name to hex code map
const colorMap = {
  merah: "#FF0000",
  hijau: "#00FF00",
  biru: "#0000FF",
  kuning: "#FFFF00",
  hitam: "#000000",
  putih: "#FFFFFF",
  abu: "#808080",
  jingga: "#FFA500",
  ungu: "#800080",
  pink: "#FFC0CB",
  coklat: "#A52A2A",
};

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
    const text = isQuoted?.text || content;

    // Validate content input
    if (!text) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } resbot | warna*_`,
        },
        { quoted: message }
      );
      return; // Stop execution if no content
    }

    // Split text and color code/name if available
    const [text2, bgColorInput] = text.split("|").map((item) => item.trim());

    // Check if color input is a color name or hex code
    const backgroundColor =
      colorMap[bgColorInput?.toLowerCase()] || bgColorInput || "#FFFFFF";

    // Send loading message with emoji reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Get user profile picture URL (fallback on failure)
    const ppnyauser = await sock
      .profilePictureUrl(sender, "image")
      .catch(() => "https://telegra.ph/file/6880771a42bad09dd6087.jpg");

    // JSON configuration for quote API
    const json = {
      type: "quote",
      format: "png",
      backgroundColor: backgroundColor,
      width: 700,
      height: 580,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: pushName,
            photo: {
              url: ppnyauser,
            },
          },
          text: text2,
          replyMessage: {},
        },
      ],
    };

    // Send request to quote API
    const response = await axios.post(
      "https://bot.lyo.su/quote/generate",
      json,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Convert base64 image to buffer
    const buffer = Buffer.from(response.data.result.image, "base64");

    // Send quote sticker
    const options = {
      packname: config.sticker_packname,
      author: config.sticker_author,
    };
    await sendImageAsSticker(sock, remoteJid, buffer, options, message);
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
  Commands: ["qcstick"],
  OnlyPremium: false,
  OnlyOwner: false,
};
