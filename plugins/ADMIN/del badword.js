import { addBadword, updateBadword, findBadword } from "../../lib/badword.js";
import { getGroupMetadata } from "../../lib/cache.js";
import mess from "../../strings.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, command, fullText } = messageInfo;

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

    // Make sure group data is available
    let dataGrub = await ensureGroupData(remoteJid);

    // Get arguments from message
    const args = fullText.trim().split(" ").slice(1);
    let responseMessage = await removeBadwordFromList(
      remoteJid,
      dataGrub,
      args
    );

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

// Function for removing words from the badword list
async function removeBadwordFromList(remoteJid, dataGrub, words) {
  if (words.length === 0) {
    return "⚠️ _Please provide the word you want to remove._";
  }

  const deletedWords = [];
  dataGrub.listBadword = dataGrub.listBadword.filter((word) => {
    // Convert all words to lowercase for comparison
    const lowerCaseWord = word.toLowerCase();
    const lowerCaseWords = words.map((w) => w.toLowerCase());

    if (lowerCaseWords.includes(lowerCaseWord)) {
      deletedWords.push(word);
      return false;
    }
    return true;
  });

  if (deletedWords.length === 0) {
    return "⚠️ _No words were found in the badword list._";
  }

  await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });
  return `✅ _The following words were successfully removed from the badword list:_ ${deletedWords.join(
    ", "
  )}`;
}

// Function for sending response to group
async function sendResponse(sock, remoteJid, text, quotedMessage) {
  await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

export default {
  handle,
  Commands: ["delbadword"],
  OnlyPremium: false,
  OnlyOwner: false,
};
