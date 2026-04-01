import { groupFetchAllParticipating } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, command, sender } = messageInfo;

  try {
    // If command is empty or only spaces
    if (!content.trim()) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _This command will remove the bot from all WhatsApp groups._ \n\nPlease type *.${command} -y* to continue.`,
        },
        { quoted: message }
      );
      return;
    }

    // If user confirms with "-y"
    if (content.trim() === "-y") {
      const allGroups = await groupFetchAllParticipating(sock);

      // Loop to leave all groups
      const leavePromises = Object.values(allGroups).map((group) => {
        if (group.id !== remoteJid) {
          return sock.groupLeave(group.id);
        }
        return null;
      });

      // Wait for all groups to be processed
      await Promise.all(leavePromises);

      await sock.sendMessage(
        remoteJid,
        { text: "✅ _Successfully left all groups, except this one_" },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);

    // Send error message
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while processing your request." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: [
    "outallgrup",
    "outallgroup",
    "outallgroup",
    "outallgroub",
    "outallgc",
  ],
  OnlyPremium: false,
  OnlyOwner: true,
};
