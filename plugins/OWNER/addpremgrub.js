import { findUser, updateUser, registerUser } from "../../lib/users.js";
import { sendMessageWithMention } from "../../lib/utils.js";
import { getGroupMetadata } from "../../lib/cache.js";

let inProccess = false;

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, prefix, command, senderType } =
    messageInfo;

  try {
    if (inProccess) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `_Process is in progress, please wait until it finishes_`,
        message,
        senderType
      );
      return;
    }

    // Validate input
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Usage format:_ \n\n💬 Example:\n*${prefix + command}* https://chat.whatsapp.com/xxx 30`;
      return await sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
    }

    let [linkgroup, jumlahHariPremium] = content.split(" ");

    if (!linkgroup.includes("chat.whatsapp.com") || isNaN(jumlahHariPremium)) {
      const tex = `⚠️ _Make sure the correct format:_\n${prefix + command} https://chat.whatsapp.com/xxx 30`;
      return await sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    inProccess = true;
    jumlahHariPremium = parseInt(jumlahHariPremium);

    const idFromGc = linkgroup.split("https://chat.whatsapp.com/")[1];

    const res = await sock.query({
      tag: "iq",
      attrs: { type: "get", xmlns: "w:g2", to: "@g.us" },
      content: [{ tag: "invite", attrs: { code: idFromGc } }],
    });

    if (!res.content[0]?.attrs?.id) {
      const tex = `⚠️ _Group link not valid or make sure bot has already joined_`;
      await sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
      inProccess = false;
      return;
    }

    const groupId = res.content[0].attrs.id + "@g.us";

    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, groupId);
    const participants = groupMetadata?.participants || [];

    let successCount = 0;
    let failedCount = 0;

    for (const member of participants) {
      try {
        // Get valid JID: prioritize phoneNumber, fallback to id
        const id_users = member.phoneNumber || member.id;

        if (typeof id_users !== "string") {
          console.warn("Skip participant without valid ID:", member);
          failedCount++;
          continue;
        }

        // Get user data
        let dataUsers = await findUser(id_users);

        // Calculate new premium date
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + jumlahHariPremium);

        if (!dataUsers) {
          console.warn(`User not yet registered: ${id_users}, attempting registration`);

          const username = `user_${id_users.toLowerCase()}`;
          const res = registerUser(id_users, username);
          dataUsers = await findUser(id_users);
        }

        const [docId, userData] = dataUsers;

        userData.premium = currentDate.toISOString();
        await updateUser(id_users, userData);

        successCount++;
      } catch (error) {
        console.error(`Failed to add premium for member:`, error);
        failedCount++;
      }
    }

    inProccess = false;

    const responseText = `✅ Successfully added *${successCount}* users to premium membership.\n❌ Failed: *${failedCount}*`;
    await sendMessageWithMention(sock, remoteJid, responseText, message, senderType);
  } catch (error) {
    console.error("Error processing premium addition:", error);
    inProccess = false;
    await sock.sendMessage(
      remoteJid,
      { text: "❌ An error occurred while processing data." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["addpremgroup", "addpremiumgroup"],
  OnlyPremium: false,
  OnlyOwner: true, // Only owner can access
};
