import { findAbsen, updateAbsen, createAbsen } from "../../lib/absen.js";

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender } = messageInfo;
  if (!isGroup) return; // Groups only

  try {
    const data = await findAbsen(remoteJid);
    let textNotif;

    if (data) {
      // Check-in record already exists
      // Check if sender has already checked in
      if (data.member.includes(sender)) {
        textNotif = "⚠️ _Already checked in!_ _You have already checked in today!_";
      } else {
        // Add sender to the list of checked-in members
        const updateData = {
          member: [...data.member, sender],
        };
        await updateAbsen(remoteJid, updateData);
        textNotif = "✅ _Check-in successful!_";
      }
    } else {
      // First check-in
      const insertData = {
        member: [sender],
      };
      await createAbsen(remoteJid, insertData);
      textNotif = "✅ _Check-in successful!_";
    }

    // Send message to user
    return await sock.sendMessage(
      remoteJid,
      { text: textNotif },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error handling check-in:", error);
    // Send error message to user if something went wrong
    return await sock.sendMessage(
      remoteJid,
      { text: "An error occurred while processing the check-in." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["absen"],
  OnlyPremium: false,
  OnlyOwner: false,
};
