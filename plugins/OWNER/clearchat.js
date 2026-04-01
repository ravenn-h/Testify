async function delay(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration * 1000));
}

// Main function
const clearAllChats = async (sock) => {
  try {
    // Get all chat JIDs, default to empty array if none
    const chats = Object.keys(sock.chats || {});

    if (chats.length === 0) {
      console.log("⚠️ No chats to delete.");
      return;
    }

    for (const jid of chats) {
      try {
        // 1. Clear chat message contents
        await sock.chatModify({ clear: { type: "all" } }, jid);

        await delay(300); // delay to avoid rate limit

        // 2. Delete chat from list
        await sock.chatModify({ delete: true }, jid);

        console.log(`✅ Chat ${jid} cleared & deleted`);
      } catch (err) {
        console.error(`⚠️ Failed to delete chat ${jid}:`, err.message);
      }
    }

    console.log("🎉 All chats have been cleared!");
  } catch (err) {
    console.error("❌ Failed to clear all chats:", err.message);
  }
};

async function handle(sock, messageInfo) {
  const { remoteJid } = messageInfo;

  await sock.sendMessage(remoteJid, {
    text: "⏳ Deleting all chats...",
  });
  await clearAllChats(sock);
  await sock.sendMessage(remoteJid, {
    text: "✅ All chats successfully deleted!",
  });
}

export default {
  handle,
  Commands: ["clearchat"],
  OnlyPremium: false,
  OnlyOwner: true,
};
