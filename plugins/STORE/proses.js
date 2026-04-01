import {
  sendMessageWithMention,
  getCurrentTime,
  getCurrentDate,
  reply,
} from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";
import { sendImageAsSticker } from "../../lib/exif.js";
import { checkMessage } from "../../lib/participants.js";
import mess from "../../strings.js";
import config from "../../config.js";
import fs from "fs";

async function handle(sock, messageInfo) {
  const { m, remoteJid, sender, message, isQuoted, senderType } = messageInfo;

  try {
    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(
      (p) => (p.phoneNumber === sender || p.id === sender) && p.admin
    );
    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Validate the replied message
    if (!isQuoted) {
      return await reply(m, "⚠️ _Reply to an order in text form._");
    }

    const first_checksetdone = await checkMessage(remoteJid, "setproses");

    // Get current date and time
    const date = getCurrentDate();
    const time = getCurrentTime();

    // Get group metadata
    const groupName = groupMetadata.subject || "Group";

    // Prepare note from the quoted message
    const note = isQuoted.content?.caption
      ? isQuoted.content.caption
      : isQuoted.text;

    const quotedSender = `@${isQuoted.sender.split("@")[0]}`;

    if (first_checksetdone) {
      // If set process configuration exists
      try {
        if (first_checksetdone.endsWith(".webp")) {
          // Send sticker
          const buffer = fs.readFileSync(first_checksetdone);

          const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
          };

          await sendImageAsSticker(sock, remoteJid, buffer, options, message);
          return;
        } else {
          // Replace placeholders with actual values
          const messageSetdone = first_checksetdone
            .replace(/@time/g, time)
            .replace(/@tanggal/g, date)
            .replace(/@group/g, groupName)
            .replace(/@catatan/g, note)
            .replace(/@sender/g, quotedSender);

          await sendMessageWithMention(
            sock,
            remoteJid,
            messageSetdone,
            message,
            senderType
          );
          return;
        }
      } catch (error) {
        console.error("Error processing setproses:", error);
      }
    }

    // Default pending transaction message
    const templateMessage = `_*TRANSACTION PENDING ✅ 」*_

⏰ Time     : ${time} WIB
📅 Date     : ${date}
📂 Group    : ${groupName}
📝 Note     : ${note}

${quotedSender} _Thank you for your order!_`;

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      templateMessage,
      message,
      senderType
    );
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

export default {
  handle,
  Commands: ["proses"],
  OnlyPremium: false,
  OnlyOwner: false,
};
