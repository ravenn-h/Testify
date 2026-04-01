import { getGroupMetadata, getProfilePictureUrl } from "../../lib/cache.js";
import axios from "axios";

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message, pushName, content, prefix, command } =
    messageInfo;
  try {
    // Validasi input konten
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

    // Indikator proses
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Ambil metadata grup dan profil user
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const { size, subject, desc } = groupMetadata;
    const ppUser = await getProfilePictureUrl(sock, sender);
    const ppGroup = await getProfilePictureUrl(sock, remoteJid);

    let buffer;

    // Mapping content ke parameter API
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

    // Periksa apakah content valid
    const route = apiRoutes[content];
    if (!route) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Format not valid! Pilih angka 1-7._ \n_ atau *text*_`,
        },
        { quoted: message }
      );
      return;
    }
    try {
      const response = await axios.post(route.endpoint, route.params, {
        responseType: "arraybuffer", // Mengembalikan data sebagai buffer
      });
      buffer = Buffer.from(response.data);
    } catch (error) {
      if (error.response) {
        // Error dari server, ambil detail responsenya
        const status = error.response.status;
        const statusText = error.response.statusText;
        let responseData;

        try {
          // Coba parsing body response sebagai JSON
          responseData = JSON.parse(
            Buffer.from(error.response.data).toString()
          );
        } catch (parseErr) {
          // Kalau tidak bisa di-parse, tampilkan raw string
          responseData = Buffer.from(error.response.data).toString();
        }

        console.error(
          `Error fetching welcome buffer:
  Status: ${status} ${statusText}
  Response:`,
          responseData
        );
      } else if (error.request) {
        // Request dikirim, tapi tidak ada response
        console.error("No response received from API:", error.request);
      } else {
        // Kesalahan saat preparing request
        console.error("Error in setting up the request:", error.message);
      }
      buffer = null;
    }

    // Kirim hasil ke user
    await sock.sendMessage(
      remoteJid,
      {
        image: buffer,
        caption: `_Untuk menggunakan template ini silakan ketik_ *.templatewelcome ${content}*`,
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
