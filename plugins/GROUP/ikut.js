async function handle(sock, messageInfo) {
  try {
    const { isGroup } = messageInfo;
    if (!isGroup) return; // Groups only

    await joinGiveaway(sock, messageInfo);
  } catch (err) {
    console.error("Error in handle:", err);
  }
}

async function joinGiveaway(sock, messageInfo) {
  try {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return; // Groups only

    // Make sure global.giveawayParticipants is initialized
    if (!global.giveawayParticipants) global.giveawayParticipants = {};
    if (!global.giveawayParticipants[remoteJid]) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠ Giveaway has not started! An admin can start one with the *.giveaway* command`,
        },
        { quoted: message }
      );
      return;
    }

    // Make sure the set exists
    const participants = global.giveawayParticipants[remoteJid];
    if (!(participants instanceof Set)) {
      global.giveawayParticipants[remoteJid] = new Set();
    }

    if (global.giveawayParticipants[remoteJid].has(sender)) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠ @${
            sender.split("@")[0]
          }, you have already joined the giveaway!`,
        },
        { quoted: message, mentions: [sender] }
      );
      return;
    }

    global.giveawayParticipants[remoteJid].add(sender);
    await sock.sendMessage(
      remoteJid,
      {
        text: `✅ @${sender.split("@")[0]} has joined the giveaway!`,
      },
      { quoted: message, mentions: [sender] }
    );
  } catch (err) {
    console.error("Error in joinGiveaway:", err);
  }
}

export default {
  handle,
  Commands: ["ikut"],
  OnlyPremium: false,
  OnlyOwner: false,
};
