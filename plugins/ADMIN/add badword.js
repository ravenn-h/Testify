import { addBadword, updateBadword, findBadword } from "../../lib/badword.js";
import { getGroupMetadata } from "../../lib/cache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, prefix, command, content, fullText } =
    messageInfo;

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

    if (!content || !content.trim()) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } tolol*_`,
        },
        { quoted: message }
      );
    }

    const args = fullText.trim().split(" ").slice(1);
    const dataGrub = await ensureGroupData(remoteJid);
    const responseMessage = await addBadwordToList(remoteJid, dataGrub, args);

    // Send response to group
    await sendResponse(sock, remoteJid, responseMessage, message);
  } catch (error) {
    await sendResponse(
      sock,
      remoteJid,
      "An error occurred while processing the command.",
      message
    );
  }
}

// Helper function to ensure group data is available
async function ensureGroupData(remoteJid) {
  let dataGrub = await findBadword(remoteJid);
  if (!dataGrub) {
    await addBadword(remoteJid, { listBadword: [] });
    dataGrub = { listBadword: [] };
  }
  return dataGrub;
}

// Function for adding words to the badword list
async function addBadwordToList(remoteJid, dataGrub, words) {
  if (words.length === 0) {
    return "⚠️ _Please provide the word you want to add. Example: .addbadword badword_";
  }

  const newWords = words.filter((word) => !dataGrub.listBadword.includes(word));
  if (newWords.length === 0) {
    return "⚠️ _All words already exist in the badword list._";
  }

  dataGrub.listBadword.push(...newWords);
  await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });
  return `✅ _Successfully added words:_ ${newWords.join(", ")}`;
}

// Function for sending response to group
async function sendResponse(sock, remoteJid, text, quotedMessage) {
  await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

export default {
  handle,
  Commands: ["addbadword"],
  OnlyPremium: false,
  OnlyOwner: false,
};
