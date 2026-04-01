import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import axios from "axios";
import fse from "fs-extra";
import config from "../../config.js";
import { execSync } from "child_process";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content } = messageInfo;

  async function checkWordInFile() {
    try {
      const r = await fsp.readFile(
        `${process.cwd()}/plugins/OWNER/update.js`,
        "utf8"
      );
      return /require\(["']path["']\)/.test(r.slice(0, 200));
    } catch (r) {
      console.error("Error reading file:", r);
      return false;
    }
  }

  const isNoenc = await checkWordInFile();
  const token = isNoenc ? "NOENC" : "";
  const version = global.version;

  await sock.sendMessage(remoteJid, {
    react: { text: "⏰", key: message.key },
  });

  try {
    const serverUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&token=${token}`;

    let data;
    try {
      const response = await axios.get(serverUrl);
      data = response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        `_Failed to retrieve update data from server. Please try again later._`;
      await sock.sendMessage(
        remoteJid,
        { text: errorMessage },
        { quoted: message }
      );
      return;
    }

    if (data.status && data.updates.length === 0) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ _Script is already using the latest version._\n\n_Version : ${global.version}_`,
        quoted: message,
      });
      return;
    }

    let zipData;
    try {
      let zipUrl;
      if (content.toLowerCase() === "-y") {
        zipUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&update=true&token=${token}`;
      } else {
        const latestUpdate = data.updates[data.updates.length - 1];
        let messageText =
          `✅ _Update Available_\n\n` +
          `_Current Version_ : ${global.version}\n` +
          `_Available Version_ : ${latestUpdate.version}\n\n` +
          `◧ *List Update Files*\n\n` +
          latestUpdate.files.map((item) => `- ${item.name}`).join("\n") +
          `\n\n_Update Notes_ : ${latestUpdate.noted}\n\n` +
          `_To update the script type *.updateforce -y*_\n\n` +
          `⚠️ _This process will update the script to the latest version entirely_`;

        await sock.sendMessage(
          remoteJid,
          { text: messageText },
          { quoted: message }
        );
        return;
      }

      zipData = await axios.get(zipUrl, { responseType: "arraybuffer" });
    } catch (error) {
      console.error("Error downloading update ZIP:", error.message);
      await sock.sendMessage(remoteJid, {
        text: `⚠️ _Failed to download update file. Please try again later._`,
        quoted: message,
      });
      return;
    }

    if (!zipData) return;

    const zipFilePath = path.join(process.cwd(), "updates.zip");
    fs.writeFileSync(zipFilePath, zipData.data);

    const outputDir = path.join(process.cwd(), "updates");
    fse.removeSync(outputDir);
    fs.mkdirSync(outputDir, { recursive: true });

    try {
      console.log("📂 Extracting ZIP using system unzip...");
      execSync(`unzip -o updates.zip -d updates/`, { stdio: "inherit" });
    } catch (error) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ Update only supports Linux OS`,
        quoted: message,
      });
      console.error("❌ Failed to extract ZIP file:", error);
      return;
    } finally {
      fs.unlinkSync(zipFilePath); // Delete ZIP after extraction is complete
    }

    const sourceDir = path.join(outputDir, "files");
    const targetDir = process.cwd();

    if (!fs.existsSync(sourceDir)) {
      console.error(`❌ Source folder not found: ${sourceDir}`);
      await sock.sendMessage(remoteJid, {
        text: `❌ _Source folder not found!_`,
        quoted: message,
      });
      return;
    }
    try {
      fse.copySync(sourceDir, targetDir, { overwrite: true });
    } catch (error) {
      console.error("Error copying files:", error.message);
      await sock.sendMessage(remoteJid, {
        text: `⚠️ _Failed to copy update files._`,
        quoted: message,
      });
      return;
    }

    fse.removeSync(outputDir);

    await sock.sendMessage(remoteJid, {
      text: `✅ _Update completed successfully!_ \n\n_Please restart your server or type *.restart*_`,
      quoted: message,
    });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    await sock.sendMessage(remoteJid, {
      text: `❌ _Failed to update script. Please try again later._`,
      quoted: message,
    });
  }
}

export default {
  handle,
  Commands: ["update"],
  OnlyPremium: false,
  OnlyOwner: true,
};
