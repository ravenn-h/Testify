import { reply } from "../../lib/utils.js";
import fs from "fs";
import { execSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

async function handle(sock, messageInfo) {
  const { m, remoteJid, message } = messageInfo;

  let oldVersion = "Not found";
  let newVersion = "Not found";
  let updateInfo = "";

  try {
    // Get old Baileys version
    const pkgPath = require.resolve("baileys/package.json");
    const pkg = require(pkgPath);
    oldVersion = pkg.version;
  } catch (error) {
    console.warn("[!] Failed to read old Baileys version:", error.message);
  }

  try {
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    execSync("npm install baileys", { stdio: "ignore" });

    // Clear require cache to read new version
    const resolvedPath = require.resolve("baileys/package.json");
    delete require.cache[resolvedPath];

    const newPkg = require(resolvedPath);
    newVersion = newPkg.version || "Not found";

    if (newVersion !== oldVersion) {
      updateInfo = `✅ *baileys* successfully updated from v${oldVersion} to v${newVersion}`;
    } else {
      updateInfo = `✅ *baileys* is already the latest version: v${newVersion}`;
    }
  } catch (err) {
    console.error("[!] Failed to update baileys:", err.message);
    updateInfo = "❌ An error occurred while updating *baileys*";
  }

  await reply(m, updateInfo);
}

export default {
  handle,
  Commands: ["updatebaileys", "updatebailey"],
  OnlyPremium: false,
  OnlyOwner: false,
};
