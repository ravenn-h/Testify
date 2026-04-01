import axios from "axios";
import { reply, isURL } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;
  const startTime = performance.now();

  try {
    // Input validation
    if (!content || !isURL(content)) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n💬 _Example:_ _${
          prefix + command
        } https://autoresbot.com_`
      );
    }

    // Send loading reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Perform GET request
    const response = await axios.get(content);
    const endTime = performance.now();
    const responseTime = (endTime - startTime).toFixed(2);

    // Check content type from response headers
    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      // If JSON, display JSON content
      const jsonData = JSON.stringify(response.data, null, 2);
      const jsonResponse = `Website Info:
- Status: ${response.status}
- Response Time: ${responseTime} ms

JSON Data:
${jsonData}`;
      return await reply(m, jsonResponse);
    }

    // If not JSON, parse HTML to extract title and meta description
    const html = response.data;
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const metaMatch = html.match(
      /<meta\s+name="description"\s+content="(.*?)"/i
    );

    const title = titleMatch ? titleMatch[1] : "Not found";
    const metaDescription = metaMatch ? metaMatch[1] : "Not found";

    const infoGet = `Website Info:
- Title: ${title}
- Meta Description: ${metaDescription}
- Status: ${response.status}
- Response Time: ${responseTime} ms`;

    await reply(m, infoGet);
  } catch (error) {
    // Error handling
    const errorMessage = `Sorry, an error occurred while processing your request. Try again later.\n\nError Details: ${error.message}`;
    await sock.sendMessage(
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["get"],
  OnlyPremium: false,
  OnlyOwner: false,
};