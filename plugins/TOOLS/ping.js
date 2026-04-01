import axios from "axios";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender } = messageInfo;

  const domain = "https://www.google.com";

  try {
    // First condition: If no content, return local response time only
    if (!content) {
      const startTime = process.hrtime();
      const endTime = process.hrtime(startTime);
      const responseTimeS = endTime[0] + endTime[1] / 1e9;

      await sock.sendMessage(
        remoteJid,
        {
          text: `⌬ _Response Time :_ ${responseTimeS.toFixed(6)} s`,
        },
        { quoted: message }
      );
      return;
    }

    // Second condition: If content exists, perform a ping to the domain
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const startTime = process.hrtime();
    await axios.get(domain);
    const endTime = process.hrtime(startTime);
    const responseTimeS = endTime[0] + endTime[1] / 1e9;

    await sock.sendMessage(
      remoteJid,
      {
        text: `⌬ _Response Time :_ ${responseTimeS.toFixed(
          6
        )} s\n⌬ _Ping :_ ${domain}`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in ping handler:", error);

    await sock.sendMessage(
      remoteJid,
      { text: "Sorry, an error occurred while pinging. Try again later!" },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["ping"],
  OnlyPremium: false,
  OnlyOwner: false,
};