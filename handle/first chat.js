const respondedSenders = new Set();
import { getGreeting } from "../lib/utils.js";

async function process(sock, messageInfo) {
  const { sender, remoteJid, isGroup, message, pushName, fullText } =
    messageInfo;

  // KOMENTARI INI UNTUK MENGHIDUPKAN
  return true;

  const salam = getGreeting();
  if (isGroup) return true; // Abaikan jika pesan berasal dari grup
  if (pushName == "Unknown") return true;
  if (!fullText) return true;
  if (["batu", "kertas", "gunting", "rock", "paper", "scissors"].includes(fullText.toLowerCase())) return;

  if (remoteJid == "status@broadcast") return true; // abaikan story

  // Cek apakah sender sudah pernah diberi respons
  if (respondedSenders.has(sender)) return true;

  const response = `🌟 _*Automated Message*_ 🌟 

👋 _${salam}_ *${pushName}*, _This number is a bot available for rental in a group._

⚠️ _We strictly prohibit using our bot for fraud or any other illegal activities._

_*More Information*_
📞 Owner : https://wa.me/6285246154386?text=sewabot+4.0
💻 Website : https://autoresbot.com
👉 Channel : https://www.whatsapp.com/channel/0029VaDSRuf05MUekJbazP1D`;

  try {
    // Kirim pesan balasan ke pengirim
    await sock.sendMessage(sender, { text: response }, { quoted: message });

    // Tandai pengirim sebagai sudah diberi respons
    respondedSenders.add(sender);
  } catch (error) {
    console.error("Error in first chat process:", error);
  }

  return true;
}

export default {
  name: "First Chat",
  priority: 10,
  process,
};
