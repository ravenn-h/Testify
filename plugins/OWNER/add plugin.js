import { reply } from "../../lib/utils.js";
import fs from "fs";
import path from "path";

async function handle(sock, messageInfo) {
  const { m, prefix, command, content } = messageInfo;

  // Split content based on '|' separator
  const parts = content.split("|").map((part) => part.trim());

  if (parts.length < 2) {
    return await reply(
      m,
      `_Please enter a valid format_\n\n_Example:_ _*${
        prefix + command
      } newfeature*_ | async function handle(sock, messageInfo) {\n    const { remoteJid, message } = messageInfo;\n    await sock.sendMessage(remoteJid, { text: 'test new feature' }, { quoted: message });\n}
            
export default {
    handle,
    Commands: ['newfeature'],
    OnlyPremium: false,
    OnlyOwner: false,
};`
    );
  }

  // First part is the new command name (newCommand)
  let newCommand = parts[0];

  // Check if newCommand does not end with '.js'
  if (!newCommand.endsWith(".js")) {
    newCommand += ".js"; // Add '.js' if missing
  }

  // Join all elements after the first to get remaining text as function body (functionBody)
  const functionBody = parts.slice(1).join("|");

  // Use cwd (current working directory)
  const folderPath = path.join(process.cwd(), "./plugins/FEATURES ADD/");

  // Make sure destination folder exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Create file content based on newCommand and functionBody
  const fileContent = functionBody;

  // Write new file with name matching newCommand
  const filePath = path.join(folderPath, `${newCommand}`);
  fs.writeFileSync(filePath, fileContent);

  return await reply(
    m,
    `_New plugin named *${newCommand}* successfully created!_\n\n_Restart server to apply changes_`
  );
}

export default {
  handle,
  Commands: ["addplugin", "addplugins"],
  OnlyPremium: false,
  OnlyOwner: true,
};
