import { addSewa, findSewa } from "../../lib/sewa.js";
import config from "../../config.js";
import { selisihHari, hariini } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, prefix, command } = messageInfo;

  // Validate empty or invalid format input
  if (!content || content.trim() === "") {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } https://chat.whatsapp.com/xxx 30*_\n\n_*30* means an extension of 30 days counted from the remaining subscription time_\n\n_If the Bot has not yet joined the Subscription Group, type *.sewabot*_`,
      },
      { quoted: message }
    );
  }

  // Split content into array to separate link and number of days
  const args = content.trim().split(" ");
  if (args.length < 2) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Format not valid. Example usage:\n\n_*${
          prefix + command
        } https://chat.whatsapp.com/xxx 30*_`,
      },
      { quoted: message }
    );
  }

  const linkGrub = args[0]; // Get group link
  const totalHari = parseInt(args[1], 10); // Convert days to number

  // Validate group link
  if (!linkGrub.includes("chat.whatsapp.com")) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Group link must contain 'chat.whatsapp.com'. Example usage:\n\n_*${
          prefix + command
        } https://chat.whatsapp.com/xxx 30*_`,
      },
      { quoted: message }
    );
  }

  // Validate number of days
  if (isNaN(totalHari) || totalHari <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Number of days not valid. Example usage:\n\n_*${
          prefix + command
        } https://chat.whatsapp.com/xxx 30*_`,
      },
      { quoted: message }
    );
  }

  // Extract group code from link
  const result_sewa = linkGrub.split("https://chat.whatsapp.com/")[1];
  let res_linkgc = "";

  const currentDate = new Date();
  const expirationDate = new Date(
    currentDate.getTime() + totalHari * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000
  );
  const timestampExpiration = expirationDate.getTime();

  try {
    const res = await sock.query({
      tag: "iq",
      attrs: { type: "get", xmlns: "w:g2", to: "@g.us" },
      content: [{ tag: "invite", attrs: { code: result_sewa } }],
    });

    res_linkgc = res.content[0].attrs.id;
    const res_namegc = res.content[0].attrs.subject;
    res_linkgc = res_linkgc + "@g.us";

    // Check if data exists
    const cekSewa = await findSewa(res_linkgc);
    if (!cekSewa) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _*Bot Number Has Never Joined*_\n\n_Please Type *.sewabot* to create a New Subscription_`,
        },
        { quoted: message }
      );
    }

    await sock
      .groupAcceptInvite(result_sewa)
      .then((res) => console.log(""))
      .catch((err) => console.log(""));

    const totalSewa =
      cekSewa.expired + totalHari * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000;

    await addSewa(res_linkgc, {
      linkGrub: linkGrub,
      expired: totalSewa,
    });

    // Send success message
    return await sock.sendMessage(
      remoteJid,
      {
        text:
          `_*Extension Successful*_` +
          `\n\nGroup Name : *${res_namegc}*` +
          `\nBot Number : ${config.phone_number_bot}` +
          `\nExpired : *${selisihHari(totalSewa)}*` +
          `\n\n_To check subscription status type *.ceksewa* in that group_`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Failed to join group:", error);

    // Default error message
    let info = "_Make sure the group link is valid._";

    // Check error message
    if (error instanceof Error && error.message.includes("not-authorized")) {
      info = `_You may have been removed from the group before. Solution: invite the bot back or add it manually._`;
    }

    // Send error message to user
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Failed to join the group._\n\n${info}`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["tambahsewa"],
  OnlyPremium: false,
  OnlyOwner: true,
};
