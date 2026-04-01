import fs from "fs";
import path from "path";
import levenshtein from "fast-levenshtein"; // Make sure to install this package with `npm install fast-levenshtein`

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

  // Function for finding file in folder and sub-folders
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
    // Delete the found file
    fs.unlinkSync(foundFile);
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_✅ Plugin named *${fileName}* successfully deleted!_ \n\n_Restart server to apply changes_`,
      },
      { quoted: message }
    );
  } else if (closestMatch) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_❌ Plugin named *${fileName}* not found!_\n\n🔍 _Did you mean: *${path.basename(
          closestMatch
        )}*?_`,
      },
      { quoted: message }
    );
  } else {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_❌ Plugin named *${fileName}* not found and no similar file exists._`,
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
