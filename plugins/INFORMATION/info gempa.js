import ApiAutoresbotModule from "api-autoresbot";
const ApiAutoresbot = ApiAutoresbotModule.default || ApiAutoresbotModule;

import config from "../../config.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  // Loading icon to indicate process is running
  const loadingReaction = { react: { text: "⏰", key: message.key } };
  const errorMessage =
    "Sorry, an error occurred while processing your request. Try again later.";

  try {
    // Send loading reaction
    await sock.sendMessage(remoteJid, loadingReaction);

    const api = new ApiAutoresbot(config.APIKEY);

    // Call API endpoint to get earthquake information
    const response = await api.get(`/api/information/gempadirasakan`);

    // Validate API response
    if (response?.data?.length) {
      const gempaInfo = response.data[0];
      const capt = `_*Latest Earthquake Info*_

*◧ Date:* ${gempaInfo.Tanggal}
*◧ Region:* ${gempaInfo.Wilayah}
*◧ DateTime:* ${gempaInfo.DateTime}
*◧ Latitude:* ${gempaInfo.Lintang}
*◧ Longitude:* ${gempaInfo.Bujur}
*◧ Magnitude:* ${gempaInfo.Magnitude}
*◧ Depth:* ${gempaInfo.Kedalaman}
*◧ Felt:* ${gempaInfo.Dirasakan || "No felt information available"}
`;

      // Send earthquake info to user
      await sock.sendMessage(remoteJid, { text: capt }, { quoted: message });
    } else {
      // Send default message if data not available
      await sock.sendMessage(
        remoteJid,
        { text: "Sorry, no earthquake information available at this time." },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error calling earthquake API:", error);

    // Handle error and send message to user
    await sock.sendMessage(
      remoteJid,
      { text: `${errorMessage}\n\nError Details: ${error.message}` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["infogempa"],
  OnlyPremium: false,
  OnlyOwner: false,
};
