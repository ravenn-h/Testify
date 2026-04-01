import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";
import { logCustom } from "../../lib/logger.js";

import { reply } from "../../lib/utils.js";
import moment from "moment-timezone";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate if no content
    if (!content) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _${
          prefix + command
        } https://chat.whatsapp.com/GtaKoZ3HCB21CG3BF3gmQ3_`
      );
    }

    // Extract invite code from link
    const inviteCode = content.split("https://chat.whatsapp.com/")[1];
    if (!inviteCode) {
      return await reply(m, "⚠️ _Invalid Link_");
    }

    // Send "⏳" reaction as processing indicator
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Query to get group information
    const response = await sock.query({
      tag: "iq",
      attrs: {
        type: "get",
        xmlns: "w:g2",
        to: "@g.us",
      },
      content: [{ tag: "invite", attrs: { code: inviteCode } }],
    });

    const groupInfo = response.content[0]?.attrs || {};
    const groupDetails = `「 _*Inspected Group Link*_ 」\n\n◧ Name : ${
      groupInfo.subject || "undefined"
    }\n◧ Desc : ${
      groupInfo.s_t
        ? moment(groupInfo.s_t * 1000)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY, HH:mm:ss")
        : "undefined"
    }\n◧ Owner : ${
      groupInfo.creator ? "@" + groupInfo.creator.split("@")[0] : "undefined"
    }\n◧ Created : ${
      groupInfo.creation
        ? moment(groupInfo.creation * 1000)
            .tz("Asia/Jakarta")
            .format("DD-MM-YYYY, HH:mm:ss")
        : "undefined"
    }\n◧ Size : ${groupInfo.size || "undefined"} Member\n◧ ID : ${
      groupInfo.id || "undefined"
    }`;

    // Get group profile picture
    let ppUrl = null;
    try {
      ppUrl = await sock.profilePictureUrl(`${groupInfo.id}@g.us`, "image");
    } catch {
      const api = new ApiAutoresbot(config.APIKEY);
      const apiResponse = await api.get("/api/stalker/whatsapp-group", {
        url: content,
      });

      if (!apiResponse || !apiResponse.data) {
        throw new Error("File upload failed or no URL available.");
      }
      ppUrl = apiResponse.data.imageLink;
    }

    // Send message with or without image
    if (ppUrl) {
      await sock.sendMessage(
        remoteJid,
        {
          image: { url: ppUrl },
          caption: groupDetails,
        },
        { quoted: message }
      );
    } else {
      await reply(m, groupDetails);
    }
  } catch (error) {
    console.error("Error while processing group:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Send error message
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while retrieving group info. Make sure the format is correct and the bot has permission.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["inspect"],
  OnlyPremium: false,
  OnlyOwner: false,
};