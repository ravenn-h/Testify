import axios from "axios";
import { getServerSpecs } from "../../lib/startup.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, command } = messageInfo;

  try {
    // Send ⏰ reaction to indicate processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Get server specifications
    const {
      hostname,
      platform,
      architecture,
      totalMemory,
      freeMemory,
      uptime,
      mode,
    } = await getServerSpecs();

    // Get public IP
    const response = await axios.get("https://api.ipify.org?format=json");
    const publicIp = response.data.ip;

    // Build system info message
    const data = `◧ Hostname: ${hostname}
◧ Platform: ${platform}
◧ Architecture: ${architecture || "-"}
◧ Total Memory: ${totalMemory}
◧ Free Memory: ${freeMemory}
◧ Uptime: ${uptime}
◧ Public IP: ${publicIp}
◧ Mode: ${mode}`;

    // Send info message
    await sock.sendMessage(remoteJid, { text: data }, { quoted: message });
  } catch (error) {
    console.error("Error while handling command:", error.message);

    // Send error message to user
    await sock.sendMessage(
      remoteJid,
      { text: "❌ An error occurred while processing request." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["infosistem", "infosystem"],
  OnlyPremium: false,
  OnlyOwner: true,
};
