import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, content, sender, pushName } =
    messageInfo;
  if (!isGroup) return; // Only Grub

  try {
    // Ambil data user dari database
    const dataUsers = await findUser(sender);

    if (dataUsers) {
      const [docId, userData] = dataUsers;

      const alasan = content
        ? `Reason: ${
            content.length > 100 ? content.slice(0, 100) + "..." : content
          }`
        : "No Reason";

      const waktuSekarang = new Date();

      // Perbarui status user menjadi AFK
      await updateUser(sender, {
        status: "afk",
        afk: {
          lastChat: waktuSekarang.toISOString(),
          alasan,
        },
      });

      // Kirim pesan ke grup atau chat pribadi
      await sock.sendMessage(
        remoteJid,
        { text: `😓 Oh no, ${pushName} has gone AFK.\n\n📌 ${alasan}` },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error in AFK command:", error);

    // Kirim pesan error jika terjadi masalah
    await sock.sendMessage(
      remoteJid,
      {
        text: "❌ An error occurred while processing the command. Please try again later.",
      },
      { quoted: message }
    );
  }
}
export default {
  handle,
  Commands: ["afk"],
  OnlyPremium: false,
  OnlyOwner: false,
};
