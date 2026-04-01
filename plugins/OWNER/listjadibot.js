import fs from "fs";
import path from "path";

// Function to handle the "listjadibot" command
async function handle(sock, messageInfo) {
  const { remoteJid, message, sender } = messageInfo;

  try {
    // Send reaction to indicate processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Session folder path
    const SESSION_PATH = "./session/";

    // Check if session folder exists
    if (!fs.existsSync(SESSION_PATH)) {
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Session folder not found.` },
        { quoted: message }
      );
      return;
    }

    // Read session folder contents
    const sessionFolders = fs.readdirSync(SESSION_PATH).filter((folderName) => {
      const folderPath = path.join(SESSION_PATH, folderName);
      return fs.lstatSync(folderPath).isDirectory(); // Make sure only folders
    });

    // If no subfolders inside session
    if (sessionFolders.length === 0) {
      await sock.sendMessage(
        remoteJid,
        { text: `📂 No jadibot found.` },
        { quoted: message }
      );
      return;
    }

    // Build phone number list from folder names
    const listMessage = `📜 *Jadibot List:*\n\n${sessionFolders
      .map((folder, index) => `*${index + 1}.* ${folder}`)
      .join("\n")}`;

    // Send list to user
    await sock.sendMessage(
      remoteJid,
      { text: listMessage },
      { quoted: message }
    );
  } catch (error) {
    console.error("An error occurred:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ An error occurred while processing command.` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["listjadibot"],
  OnlyPremium: false,
  OnlyOwner: true,
};
