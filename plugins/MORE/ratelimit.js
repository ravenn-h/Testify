import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;
  const rateLimitSeconds = config.rate_limit / 1000; // Convert to seconds

  const response = `⏱️ *Rate Limit Bot*

🕒 _Command usage time limit_: *${rateLimitSeconds} seconds*

📌 *Why is there a limit?*
To prevent the bot from sending too many messages in a short time and avoid spam. Each new command can be processed after a ${rateLimitSeconds}-second delay.

🙏 Thank you for your understanding!`;

  await sock.sendMessage(remoteJid, { text: response }, { quoted: message });
}

export default {
  handle,
  Commands: ["ratelimit"],
  OnlyPremium: false,
  OnlyOwner: false,
};
