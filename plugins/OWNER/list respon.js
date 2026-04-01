import { getDataByGroupId } from "../../lib/list.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, senderType } = messageInfo;

  try {
    // Get list data by group
    const currentList = await getDataByGroupId("owner");

    // If no list found
    if (!currentList || !currentList.list) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ _No Response List found, type *addrespon* to create one_\n\n_Only *owners* can add/delete responses_",
      });
      return;
    }

    const keywordList = Object.keys(currentList.list);

    if (keywordList.length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ _No Response List found, type *addrespon* to create one_\n\n_Only *owners* can add/delete responses_",
      });
    } else {
      const formattedList = keywordList
        .map((keyword) => `◧ ${keyword.toUpperCase()}`)
        .join("\n");

      // Message template
      const templateMessage = `╭✄ *HERE IS THE RESPONSE LIST*\n\n${formattedList}\n╰──────────◇`;

      // Send message with mention
      await sendMessageWithMention(
        sock,
        remoteJid,
        templateMessage,
        message,
        senderType
      );
    }
  } catch (error) {
    console.error(error);
  }
}

export default {
  handle,
  Commands: ["listrespon"],
  OnlyPremium: false,
  OnlyOwner: true,
};
