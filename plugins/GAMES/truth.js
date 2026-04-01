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

// Daftar pertanyaan truth
const truths = [
  "Have you ever liked someone? How long did it last?",
  "If you could, who in the group/outside the group would you want as your best friend? (can be same/different)",
  "What is your biggest fear?",
  "Have you ever liked someone and felt they liked you back?",
  "What is the name of your friend's ex that you secretly liked?",
  "Have you ever stolen money from your mom or dad? Why?",
  "What makes you happy when you are sad?",
  "Have you ever had unrequited love? If so, who was it? How did it feel?",
  "Have you ever been someone's secret affair?",
  "What is the thing you fear the most?",
  "Who is the most influential person in your life?",
  "What is the most proud achievement you got this year?",
  "Who can make you feel excited?",
  "Who has ever made you feel excited?",
  "(For Muslims) Have you ever skipped prayers for a whole day?",
  "Who here comes closest to your ideal partner type?",
  "Who do you like to play games with?",
  "Have you ever rejected someone? Why?",
  "Name an event that hurt you that you still remember!",
  "What achievements have you gained this year?",
  "What was your worst habit in school?",
];

// Fungsi untuk menangani pesan
async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  // Pilih truth secara acak
  const selectedTruth = truths[Math.floor(Math.random() * truths.length)];

  // Kirim pesan dengan gambar dan caption
  await sock.sendMessage(
    remoteJid,
    {
      image: buffer,
      caption: `*Truth*\n\n${selectedTruth}`,
    },
    { quoted: message }
  );
}
export default {
  handle,
  Commands: ["truth"],
  OnlyPremium: false,
  OnlyOwner: false,
};
