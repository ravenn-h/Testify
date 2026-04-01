import { reply, isURL } from "../../lib/utils.js";
import fetch from "node-fetch";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // Input validation
    if (!content || !content.includes("github.com")) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _${
          prefix + command
        } https://github.com/WhiskeySockets/Baileys.git_`
      );
    }

    if (!isURL(content)) {
      return await reply(m, `_Invalid link_`);
    }

    // React while processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Extract user and repository info from URL
    const regex =
      /(?:https|git)(?::\/\/|@)github\.com[/:]([^\/]+)\/([^\/]+)(?:\.git)?$/i;
    const match = content.match(regex);

    if (!match) {
      return await reply(m, `_Invalid URL_`);
    }

    let [, user, repo] = match;
    repo = repo.replace(/.git$/, "");
    const url = `https://api.github.com/repos/${user}/${repo}/zipball`;

    // Get filename from response headers
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      return await reply(
        m,
        `_Failed to fetch GitHub repository. Check the URL or try again later._`
      );
    }

    const contentDisposition = response.headers.get("content-disposition");
    const filenameMatch = contentDisposition?.match(
      /attachment; filename=(.+)/
    );
    const filename = filenameMatch ? filenameMatch[1] : `${repo}.zip`;

    // Send file as document
    await sock.sendMessage(
      remoteJid,
      {
        document: { url },
        fileName: filename,
        mimetype: "application/zip",
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in handle function:", error);
    const errorMessage = error.message || "An unknown error occurred.";
    return await reply(m, `_Error: ${errorMessage}_`);
  }
}

export default {
  handle,
  Commands: ["git"],
  OnlyPremium: false,
  OnlyOwner: false,
};