import { getGroupMetadata, getProfilePictureUrl } from "../../lib/cache.js";
import axios from "axios";

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message, pushName, content, prefix, command } =
    messageInfo;
  try {
    // Validate content input
    if (!content) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } 1*_`,
        },
        { quoted: message }
      );
      return;
    }

    // Processing indicator
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Get group metadata and user profile
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const { size, subject, desc } = groupMetadata;
    const ppUser = await getProfilePictureUrl(sock, sender);
    const ppGroup = await getProfilePictureUrl(sock, remoteJid);

    let buffer;

    // Map content to API parameters
    const apiRoutes = {
      1: {
        endpoint: "https://api.autoresbot.com/api/maker/welcome1",
        params: {
          pp: ppUser,
          name: pushName,
          gcname: subject,
          member: size,
          ppgc: ppGroup,
        },
      },
      2: {
        endpoint: "https://api.autoresbot.com/api/maker/welcome2",
        params: {
          pp: ppUser,
          name: pushName,
          gcname: subject,
          member: size,
          ppgc: ppGroup,
          bg: "https://api.autoresbot.com/api/maker/bg-default",
        },
      },
      3: {
        endpoint: "https://api.autoresbot.com/api/maker/welcome3",
        params: {
          pp: ppUser,
          name: pushName,
          gcname: subject,
          desk: desc || "-",
          ppgc: ppGroup,
          bg: "https://api.autoresbot.com/api/maker/bg-default",
        },
      },
      4: {
        endpoint: "https://api.autoresbot.com/api/maker/welcome4",
        params: { pp: ppUser, name: pushName },
      },
      5: {
        endpoint: "https://api.autoresbot.com/api/maker/welcome5",
        params: { pp: ppUser, name: pushName },
      },
      6: {
        endpoint: "https://api.autoresbot.com/api/maker/welcome6",
        params: {
          pp: ppUser,
          name: pushName,
          gcname: subject,
          member: size,
          ppgc: ppGroup,
        },
      },
      7: {
        endpoint: "https://api.autoresbot.com/api/maker/welcome7",
        params: {
          pp: ppUser,
          name: pushName,
          gcname: subject,
          member: size,
          ppgc: ppGroup,
        },
      },
    };

    if (content == "text") {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_Welcome to the group ${subject}_\n\n_To use this template type_ *.templatewelcome ${content}*`,
        },
        { quoted: message }
      );
      return;
    }

    // Check if content is valid
    const route = apiRoutes[content];
    if (!route) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Format not valid! Choose a number 1-7 or *text*._`,
        },
        { quoted: message }
      );
      return;
    }
    try {
      const response = await axios.post(route.endpoint, route.params, {
        responseType: "arraybuffer", // Return data as buffer
      });
      buffer = Buffer.from(response.data);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        let responseData;

        try {
          // Try parsing response body as JSON
          responseData = JSON.parse(
            Buffer.from(error.response.data).toString()
          );
        } catch (parseErr) {
          // If unable to parse, show raw string
          responseData = Buffer.from(error.response.data).toString();
        }

        console.error(
          `Error fetching welcome buffer:
  Status: ${status} ${statusText}
  Response:`,
          responseData
        );
      } else if (error.request) {
        // Request sent, but no response received
        console.error("No response received from API:", error.request);
      } else {
        // Error while setting up the request
        console.error("Error in setting up the request:", error.message);
      }
      buffer = null;
    }

    // Send result to user
    await sock.sendMessage(
      remoteJid,
      {
        image: buffer,
        caption: `_To use this template type_ *.templatewelcome ${content}*`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in handle function:", error);
    await sock.sendMessage(
      remoteJid,
      {
        text: `_❌ An error occurred: ${error.message}_`,
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["teswelcome"],
  OnlyPremium: false,
  OnlyOwner: false,
};
