import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, command, prefix } = messageInfo;

  // Validate empty input
  if (!content || content.trim() === "") {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Please enter a valid format_\n\n_Example: *${
          prefix + command
        } @tag 50*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Split the content
    const args = content.trim().split(/\s+/);
    if (args.length < 2) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Invalid format. Example:_ *${
            prefix + command
          } @tag 50*`,
        },
        { quoted: message }
      );
    }

    const target = args[0]; // Recipient number or tag

    const r = await convertToJid(sock, target);
    if (!r) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _User not found, make sure the target has chatted in this group_` },
        { quoted: message }
      );
    }
    const limitToSend = parseInt(args[1], 10);

    // Validate limit amount
    if (isNaN(limitToSend) || limitToSend <= 0) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _The limit amount must be a positive number_\n\n_Example: *${
            prefix + command
          } @tag 50*_`,
        },
        { quoted: message }
      );
    }

    // Helper function: extract numbers only
    function extractNumber(input) {
      input = input
        .trim()
        .replace(/^@/, "")                   // remove leading @
        .replace(/@s\.whatsapp\.net$/, "");   // remove trailing @s.whatsapp.net

      // Keep only digits
      const number = input.replace(/[^0-9]/g, "");

      // Return null if no digits found
      return number.length > 0 ? number : null;
    }

    // Extract pure numbers for target & sender
    const targetNumber = extractNumber(r);      // recipient
    const senderNumber = extractNumber(sender); // sender

    // Validate: cannot send to yourself
    if (targetNumber === senderNumber) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _You cannot send limit to your own number._` },
        { quoted: message }
      );
    }

    // Retrieve sender data
    const senderData = await findUser(sender);

    if (!senderData) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _You are not yet registered_` },
        { quoted: message }
      );
    }

    const [docId1, userData1] = senderData;

    // Validate whether sender has enough limit
    if (userData1.limit < limitToSend) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Your limit is insufficient to send ${limitToSend} limit(s)._`,
        },
        { quoted: message }
      );
    }

    // Retrieve receiver data
    const receiverData = await findUser(r);

    if (!receiverData) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _User with that number/tag was not found._` },
        { quoted: message }
      );
    }

    const [docId2, userData2] = receiverData;

    // Update limit for sender and receiver
    await updateUser(sender, { limit: userData1.limit - limitToSend });
    await updateUser(targetNumber, { limit: userData2.limit + limitToSend });

    // Send success message
    return await sock.sendMessage(
      remoteJid,
      {
        text: `✅ _Successfully sent ${limitToSend} limit(s) to ${targetNumber}._\n\nType *.me* to view your account details.`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("An error occurred:", error);

    // Send error message
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ An error occurred while processing your request. Please try again later.`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["sendlimit"],
  OnlyPremium: false,
  OnlyOwner: false,
};
