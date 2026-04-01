import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import mess from "../../strings.js";

// Function to generate random number in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to format time "HH:mm"
function randomTime(baseDate = new Date()) {
  let hour = randomInt(0, 23);
  let minute = randomInt(0, 59);
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    sender,
    content,
    isQuoted,
    prefix,
    command,
    pushName,
  } = messageInfo;

  try {
    const text =
      content && content.trim() !== "" ? content : isQuoted?.text ?? null;

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
      return;
    }

    // Send loading message with emoji reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Function to format WIB time (GMT+7)
    function getWaktuIndonesia() {
      const date = new Date();
      // Convert to GMT+7
      const options = { timeZone: "Asia/Jakarta", hour12: false };
      const formatter = new Intl.DateTimeFormat("id-ID", {
        ...options,
        hour: "2-digit",
        minute: "2-digit",
      });
      return formatter.format(date);
    }

    // Inside handle():
    const chatTime = getWaktuIndonesia();
    const statusBarTime = getWaktuIndonesia();

    // Random value
    const batteryLevel = randomInt(5, 100).toString(); // between 5% - 100%

    // Create API instance and fetch data from endpoint
    const api = new ApiAutoresbot(config.APIKEY);
    const buffer = await api.getBuffer("/api/maker/iqc", {
      text,
      chatTime,
      statusBarTime,
      batteryLevel,
      operator: "Telkomsel 4G",
      language: "ID", // ID & EN
    });

    await sock.sendMessage(
      remoteJid,
      {
        image: buffer,
        caption: `${mess.general.success}`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.log(error);
    const errorMessage = `Sorry, an error occurred while processing your request. Try again later.\n\nError: ${error.message}`;
    await sock.sendMessage(
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["iqc"],
  OnlyPremium: false,
  OnlyOwner: false,
};
