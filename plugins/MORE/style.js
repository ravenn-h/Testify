import { reply, style } from "../../lib/utils.js";

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, content } = messageInfo;

  try {
    if (!content) {
      return await reply(
        m,
        `_⚠️ Usage format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_

ᴇxᴀᴍᴘʟᴇ ꜱᴛʏʟᴇ
𝓮𝔁𝓪𝓶𝓹𝓵𝓮 𝓼𝓽𝔂𝓵𝓮2
example style3
ⓔⓧⓐⓜⓟⓛⓔ ⓢⓣⓨⓛⓔ④
𝐞𝐱𝐚𝐦𝐩𝐥𝐞 𝐬𝐭𝐲𝐥𝐞𝟓
𝗲𝘅𝗮𝗺𝗽𝗹𝗲 𝘀𝘁𝘆𝗹𝗲𝟲
𝘦𝘹𝘢𝘮𝘱𝘭𝘦 𝘴𝘵𝘺𝘭𝘦7
𝙚𝙭𝙖𝙢𝙥𝙡𝙚 𝙨𝙩𝙮𝙡𝙚8
🄴🅇🄰🄼🄿🄻🄴 🅂🅃🅈🄻🄴9
🅴🆇🅰🅼🅿🅻🅴 🆂🆃🆈🅻🅴10
                
_Use .style2 to .style10_`
      );
    }

    const result = style(content);
    if (!result) {
      return await reply(
        m,
        "⚠️ _Failed to apply style. Please check your input._"
      );
    }

    await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
  } catch (error) {
    console.error("Error in handle function:", error);
    await sock.sendMessage(
      remoteJid,
      { text: `_Error: ${error.message}_` },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["style"],
  OnlyPremium: false,
  OnlyOwner: false,
};
