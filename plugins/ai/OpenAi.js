const handler = async (m, { conn, text, bot }) => {
if (!text) return m.reply("💙 ~ حط نص جنب الأمر ~ ❤️")
const { api } = bot.config.info.urls
const url = api + `/home/sections/Ai/api/Ai/CustomPrompt?q=${text}`;
const response = await fetch(url)
const { data } = await response.json()

m.reply(data)
};

handler.usage = ["اوبن"];
handler.category = "Ai";
handler.command = ["اوبن"];

export default handler;