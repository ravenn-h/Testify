import fs from "fs";
import path from "path";

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  try {
    const sessionPath = path.join(process.cwd(), "session");
    if (!fs.existsSync(sessionPath)) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ Session folder not found.` },
        { quoted: message }
      );
    }

    let sessions = fs
      .readdirSync(sessionPath)
      .filter((a) => a !== "creds.json");

    if (sessions.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: `✅ No sessions need to be deleted.` },
        { quoted: message }
      );
    }

    sessions.forEach((file) => {
      fs.unlinkSync(path.join(sessionPath, file));
    });

    await sock.sendMessage(
      remoteJid,
      { text: `✅ All sessions have been deleted.` },
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
  Commands: ["clearsesi"],
  OnlyPremium: false,
  OnlyOwner: true,
};
