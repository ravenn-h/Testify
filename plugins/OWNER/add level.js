import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, senderType } =
    messageInfo;

  // --- Validate input ---
  if (!content?.trim()) {
    const tex =
      `_⚠️ Format: *${prefix + command} tag 30*_\n\n` +
      `_💬 Example: *${prefix + command} @tag 30*_`;
    return sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
  }

  const [rawNumber, rawLevel] = content.split(" ").map((s) => s.trim());

  if (!rawNumber || !rawLevel) {
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

  const levelToAdd = parseInt(rawLevel, 10);
  if (isNaN(levelToAdd) || levelToAdd <= 0) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Level amount must be a positive number_\n\n_Example: *${
          prefix + command
        } username/id 5*_`,
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
        text: `⚠️ _User with username/id ${r} not found._`,
      },
      { quoted: message }
    );
  }

  const [docId, userData] = dataUsers;

  // --- Update user data ---
  await updateUser(r, {
    level: (userData.level || 0) + levelToAdd,
  });

  // --- Send confirmation message ---
  await sendMessageWithMention(
    sock,
    remoteJid,
    `✅ _Level successfully added ${levelToAdd}._`,
    message,
    senderType
  );
}

export default {
  handle,
  Commands: ["addlevel"],
  OnlyPremium: false,
  OnlyOwner: true,
};
