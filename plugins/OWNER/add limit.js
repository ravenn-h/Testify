import { findUser, updateUser } from "../../lib/users.js";
import { sendMessageWithMention, convertToJid } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, senderType } =
    messageInfo;

  // --- Validate input ---
  if (!content?.trim()) {
    const tex =
      `_⚠️ Format: *${prefix + command} tag 30*_\n\n` +
      `_💬 Example: *${prefix + command} @tag 50*_`;
    return sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
  }

  // Separate target and limit amount
  const [rawNumber, rawLimit] = content.split(" ").map((s) => s.trim());

  if (!rawNumber || !rawLimit) {
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

  // Validate limit amount
  const limitToAdd = parseInt(rawLimit, 10);
  if (isNaN(limitToAdd) || limitToAdd <= 0) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Limit amount must be a positive number_\n\n_Example: *${
          prefix + command
        } username/id 5*_`,
      },
      { quoted: message }
    );
  }

  // --- Check user with single function ---
  let dataUsers = await findUser(rawNumber);
  let userJid = rawNumber;

  if (!dataUsers) {
    // If not found, try with JID
    const r = await convertToJid(sock, rawNumber);
    userJid = r;
    dataUsers = await findUser(r);

    if (!dataUsers) {
      return sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _User with username/id ${rawNumber} not found._`,
        },
        { quoted: message }
      );
    }
  }

  const userId = dataUsers[0];

  const [docId, userData] = dataUsers;

  // --- Update user data ---
  await updateUser(userJid, {
    limit: (userData.limit || 0) + limitToAdd,
  });

  // --- Send confirmation message ---
  await sendMessageWithMention(
    sock,
    remoteJid,
    `✅ _Limit successfully added ${limitToAdd}_`,
    message,
    senderType
  );
}

export default {
  handle,
  Commands: ["addlimit"],
  OnlyPremium: false,
  OnlyOwner: true,
};
