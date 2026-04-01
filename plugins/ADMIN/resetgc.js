import { getGroupMetadata } from "../../lib/cache.js";
import { deleteBadword } from "../../lib/badword.js";
import { deleteGroup } from "../../lib/group.js";
import { deleteAllListInGroup } from "../../lib/list.js";
import fs from "fs";
import path from "path";
import mess from "../../strings.js";

// Using cwd to determine absolute path of JSON file
const absenJson = path.join(
  process.cwd(),
  "database",
  "additional",
  "absen.json"
);
const groupParticipantJson = path.join(
  process.cwd(),
  "database",
  "additional",
  "group participant.json"
);
const totalChatJson = path.join(
  process.cwd(),
  "database",
  "additional",
  "totalchat.json"
);
const badwordJson = path.join(process.cwd(), "database", "badword.json");
const slrJson = path.join(process.cwd(), "database", "slr.json");
const listJson = path.join(process.cwd(), "database", "list.json");

// Function to check if sender is a group admin
async function isAdmin(sock, remoteJid, sender) {
  try {
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    return participants.some(
      (p) => (p.phoneNumber === sender || p.id === sender) && p.admin
    );
  } catch (error) {
    return false;
  }
}

// Main function for resetting group
async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender } = messageInfo;

  // Ensure only groups can run this feature
  if (!isGroup) return;

  try {
    // Check if sender is a group admin
    const adminStatus = await isAdmin(sock, remoteJid, sender);
    if (!adminStatus) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Perform group reset for specific remoteJid
    await resetGroupSettings(remoteJid);

    // Send confirmation message after successful reset
    await sock.sendMessage(
      remoteJid,
      { text: "Group settings have been successfully reset." },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in resetgc command:", error);

    // Send error message if an error occurs
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while resetting group settings." },
      { quoted: message }
    );
  }
}

// Function for resetting group settings by remoteJid
async function resetGroupSettings(remoteJid) {
  try {
    // Read data from all JSON files
    const absenData = JSON.parse(fs.readFileSync(absenJson, "utf8"));
    const groupParticipantData = JSON.parse(
      fs.readFileSync(groupParticipantJson, "utf8")
    );
    const totalChatData = JSON.parse(fs.readFileSync(totalChatJson, "utf8"));
    const badwordData = JSON.parse(fs.readFileSync(badwordJson, "utf8"));
    const slrData = JSON.parse(fs.readFileSync(slrJson, "utf8"));
    const listData = JSON.parse(fs.readFileSync(listJson, "utf8"));

    // Reset data in absen.json if it exists
    if (absenData[remoteJid]) {
      delete absenData[remoteJid];
      fs.writeFileSync(absenJson, JSON.stringify(absenData, null, 2));
    } else {
    }

    // Reset data in group participant.json if it exists
    if (groupParticipantData[remoteJid]) {
      delete groupParticipantData[remoteJid];
      fs.writeFileSync(
        groupParticipantJson,
        JSON.stringify(groupParticipantData, null, 2)
      );
    } else {
    }

    // Reset data in totalchat.json if it exists
    if (totalChatData[remoteJid]) {
      delete totalChatData[remoteJid];
      fs.writeFileSync(totalChatJson, JSON.stringify(totalChatData, null, 2));
    } else {
    }

    // Reset data in badword.json if it exists
    if (badwordData[remoteJid]) {
      delete badwordData[remoteJid];
      fs.writeFileSync(badwordJson, JSON.stringify(badwordData, null, 2));
    } else {
    }

    // Reset data in slr.json if it exists
    if (slrData[remoteJid]) {
      delete slrData[remoteJid];
      fs.writeFileSync(slrJson, JSON.stringify(slrData, null, 2));
    } else {
    }

    // Reset data in list.json if it exists
    if (listData[remoteJid]) {
      delete listData[remoteJid];
      fs.writeFileSync(listJson, JSON.stringify(listData, null, 2));
    } else {
    }

    await deleteGroup(remoteJid);
    await deleteBadword(remoteJid);
    await deleteAllListInGroup(remoteJid);
  } catch (error) {
    throw new Error("Failed to reset group settings.");
  }
}

export default {
  handle,
  Commands: ["resetgc"],
  OnlyPremium: false,
  OnlyOwner: false,
};
