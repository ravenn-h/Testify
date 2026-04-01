import { listSewa } from "../../lib/sewa.js";

async function handle(sock, messageInfo) {
  const { remoteJid } = messageInfo;

  try {
    const sewa = await listSewa();

    // If no list found
    if (!sewa || Object.keys(sewa).length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ _No subscription list found_",
      });
      return;
    }

    const listMessage = `*Total : ${Object.keys(sewa).length}*`;

    // Send subscription list message
    await sock.sendMessage(remoteJid, {
      text: listMessage,
    });
  } catch (error) {
    await sock.sendMessage(remoteJid, {
      text: "_An error occurred while retrieving the subscription list_",
    });
  }
}

export default {
  handle,
  Commands: ["totalsewa"],
  OnlyPremium: false,
  OnlyOwner: true,
};
