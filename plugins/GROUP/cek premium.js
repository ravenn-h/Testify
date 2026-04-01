import { findUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender } = messageInfo;

  try {
    // Retrieve user data
    const dataUsers = await findUser(sender);

    // If user not found, skip
    if (!dataUsers) {
      return;
    }

    const [docId, userData] = dataUsers;

    // Determine premium status with a clear message
    let premiumStatus;
    if (userData.premium) {
      const premiumEndDate = new Date(userData.premium);
      const now = new Date();

      if (premiumEndDate > now) {
        premiumStatus = `📋 _Your Premium period expires on:_ ${premiumEndDate.toLocaleString()}`;
      } else {
        premiumStatus = "📋 _Your Premium period has expired_";
      }
    } else {
      premiumStatus = "📋 _You currently do not have a premium period_";
    }

    const responseText = `_Hello_ @${sender.split("@")[0]} \n\n${premiumStatus}`;

    await sock.sendMessage(
      remoteJid,
      { text: responseText, mentions: [sender] },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error handling user data:", error);

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
  Commands: ["cekprem", "cekpremium"],
  OnlyPremium: false,
  OnlyOwner: false,
};
