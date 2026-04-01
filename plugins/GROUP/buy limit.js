import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, prefix, command } = messageInfo;

  // Validate empty input
  if (!content || content.trim() === "") {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } 50*_\n\n_Note : *1* limit = *20* money_`,
      },
      { quoted: message }
    );
  }

  // Make sure `content` is a number only
  const limitToBuy = parseInt(content.trim(), 10);
  if (isNaN(limitToBuy) || limitToBuy <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _The limit amount must be a positive number_\n\n_Example: *buylimit 50*_`,
      },
      { quoted: message }
    );
  }

  // Price per limit
  const pricePerLimit = 20;
  const totalCost = limitToBuy * pricePerLimit;

  // Retrieve user data
  const dataUsers = findUser(sender);

  if (!dataUsers) return;

  const [docId, userData] = dataUsers;

  // Validate whether the user has enough balance
  if (userData.money < totalCost) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Your balance is insufficient to buy *${limitToBuy}* limit(s)._\n\n_Total price:_ ${totalCost} money\n_Your balance:_ ${userData.money} money`,
      },
      { quoted: message }
    );
  }

  // Update user data
  updateUser(sender, {
    limit: userData.limit + limitToBuy, // Add limit
    money: userData.money - totalCost,  // Deduct balance
  });

  // Send success message
  return await sock.sendMessage(
    remoteJid,
    {
      text: `✅ _Limit purchase successful! 🎉_\n\n_Your limit increased by: *${limitToBuy}*_\n_Your balance:_ ${
        userData.money - totalCost
      } money`,
    },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["buylimit"],
  OnlyPremium: false,
  OnlyOwner: false,
};
