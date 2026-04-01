import moment from "moment-timezone";

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  // Date and time format
  const format = "DD-MM-YYYY HH:mm";

  // International time (UTC)
  const utcTime = moment().tz("UTC").format(format);

  // Server time (using the server's local system time)
  const serverTime = moment().format(format);

  // WIB time (Africa/Abijan)
  const abijanTime = moment().tz("Africa/Abidjan").format(format);

  // Send message with three time zones
  const response = `⏰ Current Time:
    
🌍 UTC: 
${utcTime}

🖥 Server: 
${serverTime}

🇮🇩 WIB: 
${abijanTime}`;

  return await sock.sendMessage(
    remoteJid,
    { text: response },
    { quoted: message }
  );
}

export default {
  handle,
  Commands: ["now"],
  OnlyPremium: false,
  OnlyOwner: false,
};