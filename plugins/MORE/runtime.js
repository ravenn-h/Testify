import os from "os";
import { execSync } from "child_process";

import fs from "fs";
import path from "path";

// Uptime format function
function getUptime(seconds) {
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// More flexible platform function
function getPlatform() {
  const platform = os.platform();
  if (platform === "win32") return "Windows";
  if (platform === "linux") return "Linux";
  return platform;
}

// OS-dependent disk info function
function getDiskInfo() {
  try {
    if (os.platform() === "win32") {
      const stdout = execSync(
        "wmic logicaldisk get size,freespace,caption"
      ).toString();
      const lines = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      const diskData = lines.slice(1).map((line) => {
        const [drive, free, total] = line.trim().split(/\s+/);
        return {
          drive,
          total: (parseInt(total) / 1024 ** 3).toFixed(2) + " GB",
          free: (parseInt(free) / 1024 ** 3).toFixed(2) + " GB",
          used:
            ((parseInt(total) - parseInt(free)) / 1024 ** 3).toFixed(2) + " GB",
        };
      });
      // Get drive C as default
      return diskData.find((d) => d.drive === "C:") || diskData[0];
    } else {
      const total = execSync("df -h --output=size / | tail -1")
        .toString()
        .trim();
      const free = execSync("df -h --output=avail / | tail -1")
        .toString()
        .trim();
      const used = execSync("df -h --output=used / | tail -1")
        .toString()
        .trim();
      return { total, free, used };
    }
  } catch (err) {
    return { total: "N/A", free: "N/A", used: "N/A" };
  }
}

// Bot start time
const botStartTime = Date.now();

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;
  const start = process.hrtime();
  const end = process.hrtime(start);
  const responseSpeed = (end[0] + end[1] / 1e6).toFixed(4) + "s";

  const platformName = getPlatform();
  const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB";
  const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB";
  const usedRam =
    ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2) + " GB";
  const { total: totalDisk, free: freeDisk, used: usedDisk } = getDiskInfo();
  const cpuCores = os.cpus().length;
  const uptimeVPS = getUptime(os.uptime());
  const botRuntime = getUptime((Date.now() - botStartTime) / 1000);

  const dbSize = (() => {
    let totalSize = 0;
    const folderPath = "./session";
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach((file) => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) totalSize += stats.size;
      });
    }
    return (totalSize / (1024 * 1024)).toFixed(2) + " MB";
  })();

  await sock.sendMessage(
    remoteJid,
    {
      text:
        `• *INFORMATION SERVER*\n\n` +
        `⌬ *Platform* : \`\`\`${platformName}\`\`\`\n` +
        `⌬ *Total Ram* : \`\`\`${totalRam}\`\`\`\n` +
        `⌬ *Free Ram* : \`\`\`${freeRam}\`\`\`\n` +
        `⌬ *Used Ram* : \`\`\`${usedRam}\`\`\`\n` +
        `⌬ *Total Disk* : \`\`\`${totalDisk}\`\`\`\n` +
        `⌬ *Free Disk* : \`\`\`${freeDisk}\`\`\`\n` +
        `⌬ *Used Disk* : \`\`\`${usedDisk}\`\`\`\n` +
        `⌬ *Total Cpu* : \`\`\`${cpuCores} Core\`\`\`\n` +
        `⌬ *Runtime VPS* : \`\`\`${uptimeVPS}\`\`\`\n` +
        `____________________________________\n` +
        `• *INFORMATION BOT*\n\n` +
        `⌬ *Response Time* : \`\`\`${responseSpeed}\`\`\`\n` +
        `⌬ *Runtime Bot* : \`\`\`${botRuntime}\`\`\`\n` +
        `⌬ *Database* : \`\`\`${dbSize}\`\`\``,
    },
    { quoted: message }
  );
}
export default {
  handle,
  Commands: ["runtime"],
  OnlyPremium: false,
  OnlyOwner: false,
};
