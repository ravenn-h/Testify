import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, senderType } =
    messageInfo;

  // --- Validate input ---
  if (!content?.trim()) {
    const tex =
      `_⚠️ Format: *${prefix + command} tag 50*_\n\n` +
      `_💬 Example: *${prefix + command} @tag 50*_`;
    return sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
  }

  // Separate target & money amount
  const [rawNumber, rawMoney] = content.split(" ").map((s) => s.trim());

  if (!rawNumber || !rawMoney) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `_Please enter the correct format_\n\n_Example: *${
          prefix + command
        } @tag 50*_`,
      },
      { quoted: message }
    );
  }

  // Validate money amount
  const moneyToAdd = parseInt(rawMoney, 10);
  if (isNaN(moneyToAdd) || moneyToAdd <= 0) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Money amount must be a positive number_\n\n_Example: *${
          prefix + command
        } @tag 50*_`,
      },
      { quoted: message }
    );
  }

  // --- Get user data ---
  const r = await convertToJid(sock, rawNumber);
  const dataUsers = await findUser(r);
  if (!dataUsers) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _User with id ${r} not found._`,
      },
      { quoted: message }
    );
  }

  const [docId, userData] = dataUsers;

  // --- Update user data ---
  await updateUser(r, {
    money: (userData.money || 0) + moneyToAdd,
  });

  // --- Send confirmation message ---
  await sendMessageWithMention(
    sock,
    remoteJid,
    `✅ _Money successfully added ${moneyToAdd}._`,
    message,
    senderType
  );
}

export default {
  handle,
  Commands: ["addmoney"],
  OnlyPremium: false,
  OnlyOwner: true,
};
