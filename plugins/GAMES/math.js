import mess from "../../strings.js";
import {
  addUser,
  removeUser,
  isUserPlaying,
} from "../../database/temporary_db/math.js";
import { genMath, modes } from "../../lib/games/math.js";
import { logWithTime } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
try {
    const { remoteJid, message, sender, isGroup, command, content, fullText } =
    messageInfo;

  // Check if user is already playing
  const isPlaying = isUserPlaying(remoteJid);
  if (isPlaying) {
    return sock.sendMessage(
      remoteJid,
      { text: mess.game.isPlaying },
      { quoted: message }
    );
  }

  if (!content || content.trim() === "") {
    return sock.sendMessage(
      remoteJid,
      {
        text: `Example: *math medium*\n\nAvailable modes: ${Object.keys(
          modes
        ).join(" | ")}`,
      },
      { quoted: message }
    );
  }

  const mode = content.trim().toLowerCase();
  if (!modes[mode]) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `Mode not valid! \n\nAvailable modes: ${Object.keys(
          modes
        ).join(" | ")}`,
      },
      { quoted: message }
    );
  }

  let result;
  try {
    result = await genMath(mode);
  } catch (err) {
    console.log("Error generating math question:", err);
    return sock.sendMessage(
      remoteJid,
      {
        text: "An error occurred while starting the game. Please try again later.",
      },
      { quoted: message }
    );
  }

  // Set timer based on time from result
  const timer = setTimeout(async () => {
    if (isUserPlaying(remoteJid)) {
      removeUser(remoteJid); // Remove user if time runs out
      await sock.sendMessage(
        remoteJid,
        { text: `Time's up! The answer is: ${result.jawaban}` },
        { quoted: message }
      );
    }
  }, result.waktu); // Use time from result

  result.timer = timer;
  result.command = fullText;

  // Add user to the game
  addUser(remoteJid, result);

  const waktuDetik = (result.waktu / 1000).toFixed(2);
  await sock.sendMessage(
    remoteJid,
    {
      text: `*What is the result of: ${result.soal.toLowerCase()}*?\n\nTime: ${waktuDetik} seconds`,
    },
    { quoted: message }
  );
  console.log(`Answer: ${result.jawaban}`);
  logWithTime("Math", `Answer: ${result.jawaban}`);
} catch (error) {
  console.error("Error in math.js:", error);
  
}
}

export default {
  handle,
  Commands: ["kuismath", "math"],
  OnlyPremium: false,
  OnlyOwner: false,
};
