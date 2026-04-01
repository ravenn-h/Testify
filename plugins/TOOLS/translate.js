import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";
import { reply } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, content, prefix, command } = messageInfo;

  if (!content) {
    await reply(
      m,
      `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
        prefix + command
      } i am from indonesia*_`
    );
    return;
  }

  try {
    // Show reaction while processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Initialize API
    const api = new ApiAutoresbot(config.APIKEY);

    // Run two API requests in parallel
    const [data1, data2] = await Promise.all([
      api.get("/api/translate/en-id", { text: content }),
      api.get("/api/translate/id-en", { text: content }),
    ]);

    // Send translation results
    await reply(m, `◧ Indonesia: ${data1.data}\n\n◧ English: ${data2.data}`);
  } catch (error) {
    console.error("Error in translation handler:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    await sock.sendMessage(
      remoteJid,
      { text: "Sorry, an error occurred. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["ts", "translate"],
  OnlyPremium: false,
  OnlyOwner: false,
};