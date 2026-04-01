import { reply } from "../../lib/utils.js";
import fs from "fs";
import path from "path";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content } = messageInfo;

  if (!content) {
    return await reply(
      m,
      `_Please enter a valid format_\n\n_Example:_ *${
        prefix + command
      } plugins/menu.js*`
    );
  }

  // Directory limit: bot working folder
  const baseDir = path.resolve(process.cwd());
  const targetPath = path.resolve(baseDir, content);

  // Protection to prevent path traversal outside working folder
  if (!targetPath.startsWith(baseDir)) {
    return await reply(m, "_File access denied: path not valid._");
  }

  // Validate file
  if (!fs.existsSync(targetPath)) {
    return await reply(m, `_File not found:_ *${content}*`);
  }

  if (path.extname(targetPath) !== ".js") {
    return await reply(m, `_Only .js files are allowed_`);
  }

  try {
    const fileContent = fs.readFileSync(targetPath, "utf-8");

    // If file content is too long, send as document
    if (fileContent.length > 4000) {
      await reply(m, "_File content is too long, sending as document..._");
      return await sock.sendMessage(
        m.key.remoteJid,
        {
          document: fs.readFileSync(targetPath),
          fileName: path.basename(targetPath),
          mimetype: "text/javascript",
        },
        { quoted: m }
      );
    }

    // Send file content as text
    return await reply(
      m,
      `📄 *File contents:* _${content}_\n\n` + "```js\n" + fileContent + "\n```"
    );
  } catch (err) {
    console.error(err);
    return await reply(m, "_Failed to read file._");
  }
}

export default {
  handle,
  Commands: ["viewcode"],
  OnlyPremium: false,
  OnlyOwner: true,
};
