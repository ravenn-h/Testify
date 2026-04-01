import { findUser, updateUser } from "../../lib/users.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, sender, command, prefix } = messageInfo;

  // Daftar role yang valid
  const roleArr = [
    "gamers",
    "coding",
    "conqueror",
    "100",
    "content creator",
    "fotografer",
    "music",
    "ilmuwan",
    "petualang",
    "hacker",
    "snake",
    "bull",
    "bear",
    "tiger",
    "cobra",
    "wolf",
    "imortal",
  ];

  // Validasi input kosong
  if (!content || !content.trim()) {
    const roleERR = `_Pilih Role Di Bawah:_\n\n${roleArr
      .map((role) => `◧ ${role}`)
      .join("\n")}\n\n_Contoh_: _*${prefix + command} music*_`;
    return await sock.sendMessage(
      remoteJid,
      { text: roleERR },
      { quoted: message }
    );
  }

  // Validasi role not found
  if (!roleArr.includes(content.toLowerCase())) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ Role "${content}" not valid. Please choose one of the roles below:\n\n${roleArr
          .map((role) => `◧ ${role}`)
          .join("\n")}`,
      },
      { quoted: message }
    );
  }

  // Ambil data user
  try {
    const dataUsers = findUser(sender);

    const [docId, userData] = dataUsers;

    // Validasi level user
    if (userData.level < 10) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _To change the account role, the minimum level is 10._\n\n_Your current level: ${userData.level}_`,
        },
        { quoted: message }
      );
    }

    // Update role user
    updateUser(sender, { achievement: content });

    // Kirim pesan berhasil
    return await sock.sendMessage(
      remoteJid,
      {
        text: `✅ _Berhasil changing role akun ke_ "${content}".\n\n_Ketik *.me* untuk melihat detail akun._`,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error saat processing user:", error);

    // Kirim pesan kesalahan
    return await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while processing your request. Please try again nanti.",
      },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["setakun"],
  OnlyPremium: false,
  OnlyOwner: false,
};
