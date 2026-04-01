import "./lib/version.js";
import { checkAndInstallModules, clearDirectory } from "./lib/utils.js";

console.log(`[✔] Start App ...`);

// ─── Check Node Version ────────────────────────────
const [major] = process.versions.node.split(".").map(Number);

if (major < 20 || major >= 21) {
  console.error(`❌ This script is only compatible with Node.js version 20.x`);
  console.error(
    `ℹ️ If you are running this script through a panel, open the *Startup* menu, then change the *Docker Image* to Node.js version 20`
  );

  // Wait 1 minute then exit
  setTimeout(() => process.exit(1), 60_000);
} else {
  process.env.TZ = "Africa/Abidjan"; // Main timezone

  const config = (await import("./config.js")).default;

  const BOT_NUMBER = config.phone_number_bot || "";

  // ─── Crash report function ────────────────────────
  async function reportCrash(status) {
    // Crash report can be enabled later
    // const axios = (await import('axios')).default;
    // const reportUrl = `https://example.com/api/${BOT_NUMBER}/status?status=${encodeURIComponent(status)}`;
    // try {
    //   await axios.get(reportUrl);
    //   console.log('✅ Crash report sent successfully.');
    // } catch (err) {
    //   console.error('❌ Failed to send crash report:', err.message);
    // }
  }

  // ─── Start App ────────────────────────────────────
  try {
    clearDirectory("./tmp");

      // Run every 3 hours (3 hours = 10800000 ms)
    setInterval(() => {
      console.log("[SCHEDULE] Cleaning tmp folder...");
      clearDirectory("./tmp");
    }, 3 * 60 * 60 * 1000);

    console.log('[✔] Cache cleaned successfully.');
    
    await checkAndInstallModules([
      "follow-redirects",
      "jimp@1.6.0",
      "qrcode-reader",
      "wa-sticker-formatter",
      "api-autoresbot@1.0.6",
    ]);

    const { start_app } = await import("./lib/startup.js");
    await start_app();
  } catch (err) {
    console.error("Error in start_app process:", err.message);
    await reportCrash("inactive");
    process.exit(1);
  }

  // ─── Error Handler ────────────────────────────────
  process.on("uncaughtException", async (err) => {
    console.error("❌ Uncaught Exception:", err);
    await reportCrash("inactive");
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason, promise) => {
    console.error("❌ Unhandled Rejection:", reason);
    await reportCrash("inactive");
    process.exit(1);
  });
}
