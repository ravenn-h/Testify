import { findGroup, updateGroup, deleteGroup } from "../../lib/group.js";

async function handle(sock, messageInfo) {
  const { remoteJid, message, command } = messageInfo;

  try {
    // Find group data by ID
    const dataGroup = await findGroup("owner", true);

    const isSelf = dataGroup?.fitur?.self;

    // Variables for response and data update
    let responseText = "";
    let updateData = null;

    // Response based on command
    switch (command) {
      case "self":
        updateData = { fitur: { self: true } };
        responseText =
          "_Bot successfully set to self mode. Bot can only be used by the owner. To allow everyone to use it, type_ *.public*.";
        if (isSelf) {
          responseText = "_Bot was already in self mode_";
        }

        break;

      case "public":
        if (dataGroup) {
          await deleteGroup("owner");
        } else {
          responseText = "_Bot was already in public mode_";
          return await sock.sendMessage(
            remoteJid,
            { text: responseText },
            { quoted: message }
          );
        }
        updateData = { fitur: { public: false } };
        responseText = "_Bot successfully set to public mode._";
        break;

      default:
        responseText = "_Command not recognized._";
    }

    // Update group data if there are changes
    if (updateData) {
      const dataGroup2 = await findGroup("owner");
      if (dataGroup2) {
        await updateGroup("owner", updateData);
      }
    }

    // Send message to group
    await sock.sendMessage(
      remoteJid,
      { text: responseText },
      { quoted: message }
    );
  } catch (error) {
    // Handle error
    console.error(error.message);
    await sock.sendMessage(
      remoteJid,
      { text: "An error occurred while processing command. Please try again." },
      { quoted: message }
    );
  }
}

export default {
  handle,
  Commands: ["self", "public"],
  OnlyPremium: false,
  OnlyOwner: true,
};
