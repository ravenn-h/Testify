import { groupFetchAllParticipating } from "../../lib/cache.js";
import { downloadQuotedMedia, downloadMedia } from "../../lib/utils.js";
import fs from "fs";
import path from "path";
import axios from "axios";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const jeda = 5; // 5 seconds

let isRunning = false;

function detectFirstWhatsAppGroupLink(text) {
  const regex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{22}/;
  const match = text.match(regex);
  return match ? match[0] : null;
}

async function fetchGroupInfo(url) {
  try {
    const apiUrl = `https://api.autoresbot.com/api/stalker/whatsapp-group?url=${encodeURIComponent(
      url
    )}`;
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch group info for ${url}`, error.message);
    return null;
  }
}

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    content,
    sender,
    prefix,
    command,
    isQuoted,
    type,
  } = messageInfo;

  const useMentions = false; // Change to true if you want to use mentions

  const link = detectFirstWhatsAppGroupLink(content);

  try {
    if (isRunning) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _JPM Process is Running._ _Please wait until it finishes._`,
        },
        { quoted: message }
      );
    }

    // Validate empty or invalid format input
    if (!content || content.trim() === "") {
      return sendErrorMessage(sock, remoteJid, message, prefix, command);
    }

    isRunning = true;
    // Show temporary reaction for processing
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Get group metadata
    const groupFetchAll = await groupFetchAllParticipating(sock);
    if (!groupFetchAll) {
      isRunning = false;
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ No groups found.` },
        { quoted: message }
      );
    }

    // Filter groups based on certain conditions
    const groupIds = Object.values(groupFetchAll)
      .filter((group) => group.isCommunity == false) // Adjust condition as needed
      .map((group) => group.id);

    if (groupIds.length === 0) {
      isRunning = false;
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ No groups matching the condition were found.` },
        { quoted: message }
      );
    }

    // Get message info
    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;
    const pesangc = content; // Message content to send

    let imageLink;
    if (link) {
      const info = await fetchGroupInfo(link);
      if (info) {
        imageLink = info.imageLink;
      }
    }

    let buffer;
    if (mediaType === "imageMessage") {
      const media = isQuoted
        ? await downloadQuotedMedia(message)
        : await downloadMedia(message);

      const mediaPath = path.join("tmp", media);

      if (!fs.existsSync(mediaPath)) {
        throw new Error("Media file not found after download.");
      }

      buffer = fs.readFileSync(mediaPath);
    }

    // Send message to all groups
    for (const groupId of groupIds) {
      const participants = Object.values(
        groupFetchAll[groupId]?.participants || []
      );
      const mentions = useMentions ? participants.map((p) => p.id) : undefined;

      if (mediaType === "imageMessage") {
        await sock.sendMessage(groupId, {
          image: buffer,
          caption: pesangc,
          mentions: mentions,
        });
      } else if (imageLink) {
        await sock.sendMessage(groupId, {
          image: { url: imageLink },
          caption: pesangc,
          mentions: mentions,
        });
      } else {
        await sock.sendMessage(groupId, {
          text: pesangc,
          mentions: mentions,
        });
      }

      // 5 second delay
      await sleep(jeda * 1000);
    }

    isRunning = false;

    // Send success confirmation
    await sock.sendMessage(
      remoteJid,
      { text: `✅ Message successfully sent to ${groupIds.length} groups` },
      { quoted: message }
    );
  } catch (error) {
    isRunning = false;
    console.error("An error occurred:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `⚠️ An error occurred while processing command.` },
      { quoted: message }
    );
  }
}

function sendErrorMessage(sock, remoteJid, message, prefix, command) {
  return sock.sendMessage(
    remoteJid,
    {
      text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
        prefix + command
      } bot whatsapp announcement*_`,
    },
    { quoted: message }
  );
}
export default {
  handle,
  Commands: ["jpm"],
  OnlyPremium: false,
  OnlyOwner: true,
};
