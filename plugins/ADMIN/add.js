import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

const FITUR = false; // set to true to force enable

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, content, prefix, command } =
    messageInfo;

  if (!FITUR) {
    await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ This feature is currently disabled due to ban risk_`,
      },
      { quoted: message }
    );
    return;
  }

  if (!isGroup) {
    // Groups only
    await sock.sendMessage(
      remoteJid,
      { text: mess.general.isGroup },
      { quoted: message }
    );
    return;
  }

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

  // Validate phone number input
  const nomor = content.replace(/[^0-9]/g, "");
  const whatsappJid = `${nomor}@s.whatsapp.net`;

  // Validate phone number format
  if (!/^\d{10,15}$/.test(nomor)) {
    // Phone number length must be 10 to 15 digits
    await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } 6285246154386*_`,
      },
      { quoted: message }
    );
    return;
  }

  try {
    // Add user to group
    const response = await sock.groupParticipantsUpdate(
      remoteJid,
      [whatsappJid],
      "add"
    );
    const status = response[0]?.status;

    if (status == 409) {
      // If number already exists in group
      await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Number *${nomor}* is already in the group._` },
        { quoted: message }
      );
    } else if (status == 403) {
      // If privacy settings prevent adding
      await sock.sendMessage(
        remoteJid,
        {
          text: `❌ _Cannot add number *${nomor}* due to the user's privacy settings._`,
        },
        { quoted: message }
      );
    } else {
      await sock.sendMessage(
        remoteJid,
        { text: `✅ _Successfully added member *${nomor}* to the group._` },
        { quoted: message }
      );
    }
  } catch (error) {
    // If an unexpected error occurs
    await sock.sendMessage(
      remoteJid,
      {
        text: `❌ _Cannot add number *${nomor}* to the group._`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["add"],
  OnlyPremium: false,
  OnlyOwner: false,
};
