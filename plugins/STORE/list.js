import { getDataByGroupId } from "../../lib/list.js";
import { applyTemplate } from "../../database/templates/list.js";
import { getGroupMetadata } from "../../lib/cache.js";
import { checkMessage } from "../../lib/participants.js";
import fs from "fs/promises";

import {
  sendMessageWithMention,
  getCurrentTime,
  getCurrentDate,
  getGreeting,
  getHari,
} from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, sender, message, content, senderType } =
    messageInfo;

  let idList = remoteJid;

  if (!isGroup) {
    // Private Chat
    idList = "owner";
  } else {
  }

  const first_checksetlist = await checkMessage(remoteJid, "setlist");

  let defaultLIst = 1;
  const result = await checkMessage(remoteJid, "templatelist");

  if (result) {
    defaultLIst = result;
  }

  let nameGrub = "";
  let size = "";
  let desc = "";

  if (isGroup) {
    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    nameGrub = groupMetadata.subject || "";
    size = groupMetadata.size || "";
    desc = groupMetadata.desc || "";
  }

  try {
    // Get list data by group
    const currentList = await getDataByGroupId(idList);

    // If no list
    if (!currentList || !currentList.list) {
      await sock.sendMessage(remoteJid, {
        text: "_No list in this group, type *addlist* to create one_\n\n_Only *admins* can add/delete lists_",
      });
      return;
    }

    if (Object.keys(currentList.list).length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "_No list in this group, type *addlist* to create one_\n\n_Only *admins* can add/delete lists_",
      });
      return;
    }

    const keywordList = Object.keys(currentList.list);

    const keywordList2 = Object.keys(currentList.list).sort();

    const firstElement =
      content > 0 && content <= keywordList.length
        ? keywordList[content - 1]
        : false;

    if (!firstElement) {
      // Dynamic data to insert
      const data = {
        name: `@${sender.split("@")[0]}`,
        date: getCurrentDate(),
        day: getHari(),
        desc: desc,
        group: nameGrub,
        greeting: getGreeting(),
        size: size,
        time: `${getCurrentTime()} WIB`,
        list: keywordList,
      };

      if (first_checksetlist) {
        // If set list configuration exists

        let lines = first_checksetlist.split("\n"); // Split text into array per line
        let formattedList = []; // Array to store formatted text

        for (let line of lines) {
          if (line.includes("@x")) {
            let template = line.replace("@x", "").trim(); // Get symbol before @x
            let listItems = keywordList2
              .map((item) => `${template} ${item}`)
              .join("\n"); // Build list
            formattedList.push(listItems); // Insert formatted list
          } else {
            formattedList.push(line); // If not @x, add directly
          }
        }

        let message2 = formattedList.join("\n"); // Join back into full text

        message2 = message2
          .replace(/@name/g, data.name)
          .replace(/@date/g, data.date)
          .replace(/@day/g, data.day)
          .replace(/@desc/g, data.desc)
          .replace(/@group/g, data.group)
          .replace(/@greeting/g, data.greeting)
          .replace(/@size/g, data.size)
          .replace(/@time/g, data.time);

        return await sendMessageWithMention(
          sock,
          remoteJid,
          message2,
          message,
          senderType
        );
      }

      const finalMessage = applyTemplate(defaultLIst, data);
      return await sendMessageWithMention(
        sock,
        remoteJid,
        finalMessage,
        message,
        senderType
      );
    }

    const searchResult = Object.keys(currentList.list).filter((item) =>
      item.toLowerCase().includes(firstElement.toLowerCase())
    );

    if (searchResult.length === 0) {
      return await sock.sendMessage(remoteJid, {
        text: "_No list found_",
      });
    } else {
      const { text, media } = currentList.list[searchResult[0]].content;

      if (media) {
        const buffer = await getMediaBuffer(media);
        if (buffer) {
          await sendMediaMessage(sock, remoteJid, buffer, text, message);
        } else {
          console.error(`Media not found or failed to read: ${media}`);
        }
      } else {
        // Send message with mention
        await sendMessageWithMention(
          sock,
          remoteJid,
          text,
          message,
          senderType
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function getMediaBuffer(mediaFileName) {
  const filePath = `./database/media/${mediaFileName}`;
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    console.error(`Failed to read media file: ${filePath}`, error);
    return null;
  }
}

async function sendMediaMessage(sock, remoteJid, buffer, caption, quoted) {
  try {
    await sock.sendMessage(remoteJid, { image: buffer, caption }, { quoted });
  } catch (error) {
    console.error("Failed to send media message:", error);
  }
}

export default {
  handle,
  Commands: ["list"],
  OnlyPremium: false,
  OnlyOwner: false,
};
