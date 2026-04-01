import { findUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender } = messageInfo;

  try {
    // Ambil data user
    const dataUsers = await findUser(sender);

    // Jika user not found, tambahkan user baru
    if (!dataUsers) {
      return;
    }

    const [docId, userData] = dataUsers;

    // Tentukan status premium dengan kalimat yang lebih baik
    let premiumStatus;
    if (userData.premium) {
      const premiumEndDate = new Date(userData.premium);
      const now = new Date();

      if (premiumEndDate > now) {
        premiumStatus = `📋 _Masa Premium kamu hingga:_ ${premiumEndDate.toLocaleString()}`;
      } else {
        premiumStatus = "📋 _Your Premium period has expired_";
      }
    } else {
      premiumStatus = "📋 _You currently do not have a premium period_";
    }

    const responseText = `_Halo_ @${sender.split("@")[0]} \n\n${premiumStatus}`;

    await sock.sendMessage(
      remoteJid,
      { text: responseText, mentions: [sender] },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error handling user data:", error);

    // Kirim pesan kesalahan ke user
    await sock.sendMessage(
      remoteJid,
      {
        text: "An error occurred while processing data. Please try again nanti.",
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
