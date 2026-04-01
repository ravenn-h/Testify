import { getDataByGroupId } from "../../lib/list.js";
import { sendMessageWithMention } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, senderType } = messageInfo;

  try {
    // Ambil data list berdasarkan grup
    const currentList = await getDataByGroupId("owner");

    // Jika none list
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

      // Template pesan
      const templateMessage = `╭✄ *BERIKUT DAFTAR RESPON*\n\n${formattedList}\n╰──────────◇`;

      // Kirim pesan dengan mention
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
