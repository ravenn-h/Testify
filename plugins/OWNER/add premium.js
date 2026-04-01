import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    sender,
    mentionedJid,
    isQuoted,
    content,
    prefix,
    command,
    senderType,
  } = messageInfo;

  try {
    // Validate input
    if (!content?.trim()) {
      const tex =
        `_⚠️ Format: *${prefix + command} id 30*_\n\n` +
        `_💬 Example: *${prefix + command} @tag 30*_`;

      return sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
    }

    let [nomorHp, jumlahHariPremium] = content.split(" ");

    // Further input validation
    if (!nomorHp || !jumlahHariPremium || isNaN(jumlahHariPremium)) {
      const tex = "⚠️ _Make sure the correct format: .addprem username/id 30_";
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    // --- Check user with single function ---
    let dataUsers = await findUser(nomorHp);
    let userJid = nomorHp;

    if (!dataUsers) {
      // If not found, try with JID
      const r = await convertToJid(sock, nomorHp);
      userJid = r;
      dataUsers = await findUser(r);

      if (!dataUsers) {
        return sock.sendMessage(
          remoteJid,
          {
            text: `⚠️ _User with username/id ${nomorHp} not found._`,
          },
          { quoted: message }
        );
      }
    }

    const [docId, userData] = dataUsers;

    // Calculate new premium time from today
    const currentDate = new Date();
    const addedPremiumTime = currentDate.setDate(
      currentDate.getDate() + parseInt(jumlahHariPremium)
    ); // Add days

    // Update user premium data
    userData.premium = new Date(addedPremiumTime).toISOString(); // Store in ISO 8601 format

    // Update user data in database
    await updateUser(userJid, userData);

    // Display message that premium has been added
    const premiumEndDate = new Date(addedPremiumTime);
    const responseText = `_Premium period for user_ ${userJid} _has been extended until:_ ${premiumEndDate.toLocaleString()}`;

    // Send message with mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium addition:", error);

    // Send error message to user
    await sock.sendMessage(
      remoteJid,
      {
        text: "An error occurred while processing data. Please try again later.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["addprem", "addpremium"],
  OnlyPremium: false,
  OnlyOwner: true, // Only owner can access
};
