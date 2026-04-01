import { sendMessageWithMention } from "../lib/utils.js";
import { listOwner } from "../lib/users.js";
import config from "../config.js";

export async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, senderType } = messageInfo;

  const data = listOwner();

  let list = [];
  let no = 1;

  for (const item of data) {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:Owner ${no}
FN:Owner ${no}
TEL;waid=${item.split("@")[0]}:${item.split("@")[0]}
EMAIL;type=INTERNET:${config.owner_email}
URL:https://github.com/kartlzyounkaaa
ADR:;;${config.region};;;
END:VCARD`;

    list.push({
      displayName: `Owner ${no}`,
      vcard: vcard,
    });
    no++;
  }

  if (data.length === 0) {
    return await sendMessageWithMention(
      sock,
      remoteJid,
      "Owner not registered!",
      message,
      senderType
    );
  }

  // Send contact message
  const chatId = await sock.sendMessage(
    remoteJid,
    {
      contacts: {
        displayName: `Owner List (${data.length})`,
        contacts: list,
      },
    },
    { quoted: message }
  );

  // Send message with mention
  await sendMessageWithMention(
    sock,
    remoteJid,
    `Hi @${sender.split("@")[0]}, here is the list of this bot's owners`,
    chatId,
    senderType
  );
}

export default {
  Commands: ["owner"],
  OnlyPremium: false,
  OnlyOwner: false,
  handle,
};