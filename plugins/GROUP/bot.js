async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message } = messageInfo;
  if (!isGroup) return; // Groups only

  await sock.sendMessage(
    remoteJid,
    { text: `Hello, how can I help you?` },
    { quoted: message }
  );
}
export default {
  handle,
  Commands: ["bot"],
  OnlyPremium: false,
  OnlyOwner: false,
};
