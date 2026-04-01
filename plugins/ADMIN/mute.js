import { findGroup, updateGroup } from "../../lib/group.js";
import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, command } = messageInfo;
  if (!isGroup) return; // Groups only

  try {
    // Get group metadata
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(
      (p) => (p.phoneNumber === sender || p.id === sender) && p.admin
    );
    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Find group data by ID
    const dataGroup = await findGroup(remoteJid);
    if (!dataGroup) {
      throw new Error("Group data not found.");
    }

    // Response based on command
    let responseText = "";
    let updateData = false;

    if (command === "mute") {
      updateData = { fitur: { ["mute"]: true } };
      responseText = mess.action.mute;
    } else if (command === "unmute") {
      updateData = { fitur: { ["mute"]: false } };
      responseText = mess.action.unmute;
    } else {
      responseText = "_Command not recognized._";
    }

    // Update group data if command is valid
    if (updateData) {
      await updateGroup(remoteJid, updateData);
    }

    // Send message to group
    await sock.sendMessage(
      remoteJid,
      { text: responseText },
      { quoted: message }
    );
  } catch (error) {
    // Handle error
    console.error(error.message);
    await sock.sendMessage(
      remoteJid,
      { text: "An error occurred while processing the command. Please try again." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["mute", "unmute"],
  OnlyPremium: false,
  OnlyOwner: false,
};
