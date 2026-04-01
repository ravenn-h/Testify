import mess from "../../strings.js";
import { getTotalChatPerGroup } from "../../lib/totalchat.js";
import { sendMessageWithMention } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, isGroup, senderType } = messageInfo;
  if (!isGroup) return; // Groups only

  try {
    // ✅ Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata?.participants || [];

    // ✅ Check if sender is admin (using phoneNumber or id)
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

    // ✅ Get total chat per group
    const totalChatData = await getTotalChatPerGroup(remoteJid);

    // ✅ Combine participant data with their total chat count
    const chatWithParticipants = participants.map((participant) => {
      const jid = participant.phoneNumber || participant.id;
      const totalChat = totalChatData[jid] || 0;
      return { jid, totalChat };
    });

    if (chatWithParticipants.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "_No chat data for this group yet._" },
        { quoted: message }
      );
    }

    // ✅ Calculate total chat count
    const totalChatCount = chatWithParticipants.reduce(
      (sum, p) => sum + p.totalChat,
      0
    );

    // ✅ Sort by chat count
    const sortedMembers = chatWithParticipants.sort(
      (a, b) => b.totalChat - a.totalChat
    );

    // ✅ Format result
    let response = `══✪〘 *👥 Total Chat* 〙✪══\n\n`;
    sortedMembers.forEach(({ jid, totalChat }) => {
      const clean = typeof jid === "string" ? jid.split("@")[0] : "unknown";
      response += `◧ @${clean}: ${totalChat} chat\n`;
    });

    response += `\n\n📊 _Total chat in this group:_ *${totalChatCount}*`;

    // ✅ Send message with mention
    const mentionList = sortedMembers
      .map((m) => m.jid)
      .filter((j) => typeof j === "string");

    await sendMessageWithMention(sock, remoteJid, response, message, senderType, {
      mentions: mentionList,
    });
  } catch (error) {
    console.error("Error handling total chat command:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "❌ An error occurred while processing your request." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["totalchat"],
  OnlyPremium: false,
  OnlyOwner: false,
};
