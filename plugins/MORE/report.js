import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { reply } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, content, prefix, command } = messageInfo;

  try {
    // Validate content
    if (!content) {
      return await reply(
        m,
        `⚠️ _Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        }* error play music, Here is the link https://tiktok.com_`
      );
    }

    if (content.length < 30) {
      return await reply(m, `_⚠️ Minimum 30 Characters_`);
    }

    // Prepare data
    const title = `Bug Report Resbot V${global.version}`;
    const api = new ApiAutoresbot(config.APIKEY);

    // Send report to API
    const response = await api.get(`/api/database/report-issues`, {
      title,
      description: content,
    });

    if (response && response.status) {
      await sock.sendMessage(
        remoteJid,
        {
          text: "✅ Report successfully sent. Thank you for your contribution!",
        },
        { quoted: m }
      );
    } else {
      throw new Error("No data from API.");
    }
  } catch (error) {
    console.error("Error while sending report:", error.message);
    await reply(m, `⚠️ ${error.message}`);
  }
}

export default {
  handle,
  Commands: ["report"],
  OnlyPremium: false,
  OnlyOwner: false,
};
