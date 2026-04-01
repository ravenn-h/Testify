import { readFileAsBuffer } from "../../lib/fileHelper.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(
  __dirname,
  "../../database/assets/game truth dare.jpg"
);
const buffer = readFileAsBuffer(filePath);

// Daftar dare
const dares = [
  'Send a message to your ex saying "I still like you"',
  "Call your crush/partner right now and screenshot the result for the players",
  "Take a selfie and share it with one group member",
  'Say "YOU ARE SO BEAUTIFUL, NO JOKE" to a guy',
  "Screenshot your WhatsApp recent calls",
  'Drop the "🤸💨" emoji every time you type in the group/pc for 1 day',
  'Send a voice note saying "Can I call u baby?"',
  "Drop a song lyric/quote, then tag the member that fits it",
  "Use a photo of Sule as your profile picture for 3 days",
  "Type using a local dialect for 24 hours",
  'Change your name to "I am a child of Lucinta Luna" for 5 hours',
  'Chat the WhatsApp contact matching your battery %, say "I am lucky to have you"',
  'Prank your ex and say "I love you, want to get back together"',
  "Record a voice note reciting Surah Al-Kauthar",
  'Say "I have a crush on you, want to be my partner?" to the last person of the opposite gender you chatted (WhatsApp/Telegram), wait for a reply, then screenshot and drop in the group',
  "Describe your ideal partner type!",
  "Snap/post a photo of your partner/crush",
  "Scream nonsense then send a voice note to the group",
  "Take a selfie and send it to one of your friends",
  'Send a photo of yourself with caption "I am an orphan"',
  "Scream using harsh words in a voice note and send it to the group",
  'Shout "I am so bored!" in front of your house',
  'Change your name to "BOWO" for 24 hours',
  "Pretend to be possessed, e.g., by a tiger, grasshopper, refrigerator, etc.",
];

// Fungsi untuk menangani pesan
async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  // Pilih dare secara acak
  const selectedDare = dares[Math.floor(Math.random() * dares.length)];

  // Kirim pesan dengan gambar dan caption
  await sock.sendMessage(
    remoteJid,
    {
      image: buffer,
      caption: `*Dare*\n\n${selectedDare}`,
    },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["dare"],
  OnlyPremium: false,
  OnlyOwner: false,
};
