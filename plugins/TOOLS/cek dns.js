import { reply, isURL } from "../../lib/utils.js";

import axios from "axios";
import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // Input validation
    if (!content || !isURL(content)) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _${
          prefix + command
        } https://autoresbot.com_`
      );
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Check host using API
    const response = await axios.get("https://check-host.net/check-ping", {
      params: {
        host: content,
        max_nodes: 3,
      },
      headers: {
        Accept: "application/json",
      },
    });

    const responseData = response.data;
    if (!responseData.ok) {
      return await reply(m, "Failed to check host.");
    }

    const permanentLink = responseData.permanent_link;

    // Initialize and call Autoresbot API
    const api = new ApiAutoresbot(config.APIKEY);
    const buffer = await api.getBuffer("/api/ssweb", {
      url: permanentLink,
      delay: 6000, // 6 seconds
    });

    // Send message with screenshot
    await sock.sendMessage(
      remoteJid,
      {
        image: buffer,
        caption: mess.general.success,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in handle function:", error);

    const errorMessage = error.message || "An unknown error occurred.";
    return await sock.sendMessage(
      remoteJid,
      { text: `_Error: ${errorMessage}_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["checkdns"],
  OnlyPremium: false,
  OnlyOwner: false,
};