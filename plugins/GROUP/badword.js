import { addBadword, findBadword } from "../../lib/badword.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message } = messageInfo;
  if (!isGroup) return; // Groups only

  try {
    // Retrieve bad word data for the specific group and global list
    const dataGrub = await ensureGroupData(remoteJid);
    const dataGrub2 = await ensureGroupData("global-badword");

    // Format group bad word list
    const badwordList =
      dataGrub.listBadword.length > 0
        ? dataGrub.listBadword.map((item) => `◧ ${item}`).join("\n")
        : "_(No bad words in this group)_";

    // Format global bad word list
    const globalBadwordList =
      dataGrub2.listBadword.length > 0
        ? dataGrub2.listBadword.map((item) => `◧ ${item}`).join("\n")
        : "_(No global bad words)_";

    // Format final response message
    const responseMessage =
      `*▧ 「 LIST BADWORDS 」*\n\n` +
      `*📌 Group Bad Word List:*\n${badwordList}\n\n` +
      `*🌍 Global Bad Word List:*\n${globalBadwordList}
            
⚠️ _Note_ ⚠️
.on badword (delete)
.on badwordv2 (kick)
.on badwordv3 (warning (4x) then kick)`;

    // Send response to the group
    return await sendResponse(sock, remoteJid, responseMessage, message);
  } catch (error) {
    return await sendResponse(
      sock,
      remoteJid,
      "An error occurred while processing the command.",
      message
    );
  }
}

async function ensureGroupData(remoteJid) {
  let dataGrub = await findBadword(remoteJid);
  if (!dataGrub) {
    await addBadword(remoteJid, { listBadword: [] });
    dataGrub = { listBadword: [] };
  }
  return dataGrub;
}

async function sendResponse(sock, remoteJid, text, quotedMessage) {
  await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

export default {
  handle,
  Commands: ["badword", "listbadword"],
  OnlyPremium: false,
  OnlyOwner: false,
};
