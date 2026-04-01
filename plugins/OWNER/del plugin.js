import fs from "fs";
import path from "path";
import levenshtein from "fast-levenshtein"; // Make sure untuk menginstal package ini dengan `npm install fast-levenshtein`

async function handle(sock, messageInfo) {
  const { m, prefix, command, content, remoteJid, message } = messageInfo;

  if (!content.trim()) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } qc.js*_`,
      },
      { quoted: message }
    );
  }

  const fileName = content.trim();
  const folderPath = path.join(process.cwd(), "./plugins/");

  // Fungsi untuk mencari file dalam folder dan sub-folder
  function findFileAndClosestMatch(dir, targetFileName) {
    let foundFile = null;
    let closestMatch = null;
    let closestDistance = Infinity;

    function search(directory) {
      const files = fs.readdirSync(directory);

      for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          search(fullPath);
        } else {
          if (file === targetFileName) {
            foundFile = fullPath;
          }

          const distance = levenshtein.get(file, targetFileName);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMatch = fullPath;
          }
        }
      }
    }

    search(dir);
    return { foundFile, closestMatch };
  }

  const { foundFile, closestMatch } = findFileAndClosestMatch(
    folderPath,
    fileName
  );

  if (foundFile) {
    // Menghapus file yang ditemukan
    fs.unlinkSync(foundFile);
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_✅ Plugin dengan nama *${fileName}* successful dihapus!_ \n\n_Restart server untuk menerapkan perubahan_`,
      },
      { quoted: message }
    );
  } else if (closestMatch) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_❌ Plugin dengan nama *${fileName}* not found!_\n\n🔍 _Apakah maksud Anda: *${path.basename(
          closestMatch
        )}*?_`,
      },
      { quoted: message }
    );
  } else {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_❌ Plugin dengan nama *${fileName}* not found dan none file yang mirip._`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["delplugin", "delplugins"],
  OnlyPremium: false,
  OnlyOwner: true,
};
