// handle/menu.js
import menuProxy, { loadMenuOnce } from "../database/menu.js";
import config from "../config.js";
import { readFileAsBuffer } from "../lib/fileHelper.js";
import { reply, style, getCurrentDate, readMore } from "../lib/utils.js";
import { isOwner, isPremiumUser } from "../lib/users.js";
import fs from "fs/promises";
import path from "path";

// konstanta
const linkGroup = "https://chat.whatsapp.com/JeijvuGffXh8rjicZkCSzy?mode=hqrt2";
const AUDIO_MENU = true;
const soundPagi = "pagi.opus";
const soundSiang = "siang.opus";
const soundSore = "sore.opus";
const soundPetang = "petang.opus";
const soundMalam = "malam.opus"; // ./database/audio

async function getGreeting() {
  const now = new Date();
  const wibHours = (now.getUTCHours() + 7) % 24;

  let fileName;
  if (wibHours >= 5 && wibHours <= 10) fileName = soundPagi;
  else if (wibHours >= 11 && wibHours < 15) fileName = soundSiang;
  else if (wibHours >= 15 && wibHours <= 18) fileName = soundSore;
  else if (wibHours > 18 && wibHours <= 19) fileName = soundPetang;
  else fileName = soundMalam;

  try {
    return await fs.readFile(
      path.join(process.cwd(), "database", "audio", fileName)
    );
  } catch (err) {
    console.error("Error reading audio file:", err);
    return null;
  }
}

const formatMenu = (title, items) => {
  const formattedItems = items.map((item) => {
    if (typeof item === "string") return `├ ${item}`;
    if (typeof item === "object" && item.command && item.description)
      return `├ ${item.command} ${item.description}`;
    return "├ [Invalid item]";
  });

  return `╭──『 *${title.toUpperCase()}* 』\n${formattedItems.join(
    "\n"
  )}\n╰───────────❒`;
};

async function handle(sock, messageInfo) {
  const { m, remoteJid, pushName, sender, content, command, message } =
    messageInfo;

  const roleUser = isOwner(sender)
    ? "Owner"
    : isPremiumUser(sender)
    ? "Premium"
    : "user";

  const date = getCurrentDate();
  const category = (content || "").toLowerCase();

  // --- make sure menu sudah ter-load ---
  const menuData = await loadMenuOnce();

  let response;
  let result;

  if (category && menuData[category]) {
    response = formatMenu(category.toUpperCase(), menuData[category]);
    result = await reply(m, style(response) || "Failed to apply style.");
  } else if (command === "menu") {
    response = `╭──『 *MENU UTAMA* 』
${Object.keys(menu)
  .map((key) => `├ ${key}`)
  .join("\n")}
╰───────────❒`;
    result = await reply(m, style(response) || "Failed to apply style.");
  } else if (command === "allmenu") {
    response = `Hello, ${pushName || "Unknown"}
Vellyn multidevice adalah sistem cerdas yang mampu melakukan tugas, pencarian, serta pengambilan data atau informasi secara langsung melalui WhatsApp.

> 𖥔 ︳ᴄʀᴇᴀᴛᴏʀ : ᴋᴀʀᴛʟᴢʏ ᴅɪɢɪᴛᴀʟ
> 𖥔 ︳ɴᴀᴍᴀ ʙᴏᴛ : ᴠᴇʟʟʏɴ-ᴍᴜʟᴛɪᴅᴇᴠɪᴄᴇ
> 𖥔 ︳ᴛᴀɴɢɢᴀʟ : ${date}
> 𖥔 ︳ʀᴏʟᴇ ᴜꜱᴇʀ : ${roleUser}
> 𖥔 ︳ᴠᴇʀsɪ : 0.1

${Object.keys(menuData)
  .map((key) => formatMenu(key.toUpperCase(), menuData[key]))
  .join("\n\n")}`;

    const buffer = await readFileAsBuffer("@assets/allmenu.jpg");

    result = await sock.sendMessage(
      remoteJid,
      {
        text: style(response),
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: ``,
            body: ``,
            thumbnail: buffer,
            jpegThumbnail: buffer,
            thumbnailUrl: linkGroup,
            sourceUrl: linkGroup,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: message }
    );
  }

  // Kirim audio jika allmenu atau menu tanpa kategori
  if (command === "allmenu" || (command === "menu" && !category)) {
    if (AUDIO_MENU) {
      const audioBuffer = await getGreeting();
      if (audioBuffer) {
        await sock.sendMessage(
          remoteJid,
          { audio: audioBuffer, mimetype: "audio/mp4", ptt: true, },
          { quoted: result }
        );
      }
    }
  }
}

export default {
  Commands: ["menu", "allmenu"],
  OnlyPremium: false,
  OnlyOwner: false,
  handle,
};
