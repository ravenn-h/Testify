import mess from "../../strings.js";
import { getGroupMetadata } from "../../lib/cache.js";

global.giveawayParticipants = global.giveawayParticipants || {};

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, content, prefix, command } =
    messageInfo;
  if (!isGroup) return;

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

  // Start Giveaway
  if (command === "giveaway") {
    if (!global.giveawayParticipants[remoteJid]) {
      global.giveawayParticipants[remoteJid] = new Set();
    }
    await sock.sendMessage(
      remoteJid,
      {
        text: `🎉 *GIVEAWAY STARTED!* 🎉\n\nType *.ikut* to join.\n\nUse *.mulaigiveaway <number_of_winners>* to draw winners.`,
      },
      { quoted: message }
    );
    return;
  }

  // Start Giveaway Draw
  if (command === "mulaigiveaway") {
    if (!global.giveawayParticipants[remoteJid]) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠ Giveaway has not started. Type *.giveaway* to start`,
        },
        { quoted: message }
      );
      return;
    }

    if (!content || isNaN(content) || parseInt(content) <= 0) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `⚠ Use format: *.mulaigiveaway <number_of_winners>*`,
        },
        { quoted: message }
      );
      return;
    }

    const jumlahPemenang = parseInt(content);
    await startGiveaway(sock, remoteJid, message, jumlahPemenang);
  }
}

async function startGiveaway(sock, remoteJid, message, jumlahPemenang) {
  if (
    !global.giveawayParticipants[remoteJid] ||
    global.giveawayParticipants[remoteJid].size === 0
  ) {
    await sock.sendMessage(
      remoteJid,
      {
        text: `❌ No participants joined the giveaway!`,
      },
      { quoted: message }
    );
    return;
  }

  const participantsArray = Array.from(global.giveawayParticipants[remoteJid]);

  if (jumlahPemenang > participantsArray.length) {
    await sock.sendMessage(
      remoteJid,
      {
        text: `⚠ Total participants: ${participantsArray.length}`,
      },
      { quoted: message }
    );
    return;
  }

  // Randomly select winners
  const shuffled = participantsArray.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, jumlahPemenang);

  const winnerMentions = winners
    .map((winner) => `@${winner.split("@")[0]}`)
    .join("\n");
  await sock.sendMessage(
    remoteJid,
    {
      text: `🎉 *Giveaway Winners:* 🎉\n\n◧ ${winnerMentions}`,
      mentions: winners,
    },
    { quoted: message }
  );

  // Reset participants after giveaway ends
  delete global.giveawayParticipants[remoteJid];
}

export default {
  handle,
  Commands: ["giveaway", "mulaigiveaway"],
  OnlyPremium: false,
  OnlyOwner: false,
};
