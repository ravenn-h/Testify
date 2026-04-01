import fs from "fs";
import { exec } from "child_process";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  try {
    // Send reaction message to indicate process has started
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Create restaring.txt file with the sender's JID (remoteJid)
    fs.writeFile("restaring.txt", remoteJid, (err) => {
      if (err) {
        console.error("An error occurred while creating file:", err);
        return;
      }
    });

    await sleep(2000);

    exec(`node index`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

export default {
  handle,
  Commands: ["restart"],
  OnlyPremium: false,
  OnlyOwner: true,
};
